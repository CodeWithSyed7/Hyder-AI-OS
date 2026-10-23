/**
 * Haider Multi-Agent Orchestrator
 * Connects Haider (Executive AI) -> Task Planner -> Desktop Commander (Execution Agent)
 */

import { AgentTask, TaskLifecycleState, SafetyLevel, ActionHistoryEntry } from '../types';
import { desktopCommander } from './desktopCommanderService';
import { chatWithGemini } from './geminiService';
import { skillRegistry, RankedSkill } from './skillIntelligence/skillRegistry';

export interface OrchestrationResult {
  handledBy: 'haider_direct' | 'desktop_commander';
  replyText: string;
  task?: AgentTask;
  needsConfirmation?: boolean;
  activeSkill?: string;
}

export class AgentOrchestrator {
  private activeTask: AgentTask | null = null;
  private taskListeners: Set<(task: AgentTask) => void> = new Set();
  private approvalResolver: ((approved: boolean) => void) | null = null;

  public subscribe(cb: (task: AgentTask) => void): () => void {
    this.taskListeners.add(cb);
    if (this.activeTask) cb(this.activeTask);
    return () => this.taskListeners.delete(cb);
  }

  private updateTask(updates: Partial<AgentTask>) {
    if (!this.activeTask) return;
    this.activeTask = {
      ...this.activeTask,
      ...updates
    };
    for (const listener of this.taskListeners) {
      listener(this.activeTask);
    }
  }

  public getActiveTask(): AgentTask | null {
    return this.activeTask;
  }

  public cancelActiveTask() {
    if (!this.activeTask) return;
    this.updateTask({
      status: 'CANCELLED',
      currentStep: 'Task cancelled by user instruction',
      endTime: Date.now()
    });
  }

  public resolveConfirmation(approved: boolean) {
    if (this.approvalResolver) {
      this.approvalResolver(approved);
      this.approvalResolver = null;
    }
  }

  /**
   * Main Dispatcher: Haider receives user prompt (text or voice)
   */
  public async processRequest(
    userPrompt: string, 
    customInstructions?: string,
    onSpeech?: (text: string) => void
  ): Promise<OrchestrationResult> {
    const prompt = userPrompt.trim();
    if (!prompt) {
      return { handledBy: 'haider_direct', replyText: "Please provide a directive." };
    }

    const lower = prompt.toLowerCase();

    // 1. Task Analyzer: Query the Skill Registry for best matching capabilities
    const matchedSkills: RankedSkill[] = await skillRegistry.searchSkills(prompt);
    const bestSkill = matchedSkills.length > 0 ? matchedSkills[0] : null;

    if (bestSkill) {
      await skillRegistry.useSkill(bestSkill.skill.id);
    }

    // Check if the user is asking for Windows desktop, terminal, dev tools, or port operations
    const isDesktopIntent = this.detectDesktopIntent(lower);

    if (!isDesktopIntent) {
      // Direct Haider executive response augmented by discovered specialist skills
      try {
        let sys = customInstructions 
          ? `You are Haider, the executive AI. ${customInstructions}. Be concise, intelligent, and authoritative.`
          : `You are Haider, an executive AI operating system. Be concise, witty, highly competent, and direct.`;
        
        if (bestSkill) {
          sys += `\n[SPECIALIST SKILL ENGAGED]: "${bestSkill.skill.name}" (v${bestSkill.skill.version}) - Category: ${bestSkill.skill.category}. Apply your specialized knowledge: ${bestSkill.skill.description}. Use cases: ${bestSkill.skill.useCases.join('; ')}.`;
        }

        const res = await chatWithGemini(prompt, sys, true);
        const reply = res.text || "Directives received and processed.";
        if (onSpeech) onSpeech(reply);
        return { 
          handledBy: 'haider_direct', 
          replyText: reply,
          activeSkill: bestSkill?.skill.name
        };
      } catch (err: any) {
        return { handledBy: 'haider_direct', replyText: "Neural core link momentary timeout. Please retry." };
      }
    }

    // Task requires Desktop Commander
    const isOnline = desktopCommander.isOnline();
    if (!isOnline) {
      const offlineMsg = "Desktop Commander is offline. Launch the local Desktop Commander service on your Windows PC to enable computer control.";
      if (onSpeech) onSpeech("Desktop Commander is offline. Please launch the local Windows service.");
      return {
        handledBy: 'desktop_commander',
        replyText: offlineMsg,
        activeSkill: bestSkill?.skill.name
      };
    }

    // Initialize structured Agent Task
    const taskId = `task_${Date.now()}`;
    const newTask: AgentTask = {
      taskId,
      agent: 'haider',
      delegate: 'desktop_commander',
      userRequest: prompt,
      objective: `Execute: ${prompt}${bestSkill ? ` (Enhanced by ${bestSkill.skill.name})` : ''}`,
      currentStep: 'Haider received request. Formulating execution plan...',
      status: 'PLANNING',
      safetyLevel: 'SAFE',
      requiresConfirmation: false,
      startTime: Date.now(),
      actionHistory: [
        {
          id: `act_${Date.now()}_1`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          action: bestSkill 
            ? `Haider activated specialist skill: "${bestSkill.skill.name}" (${bestSkill.relevanceScore}% match)` 
            : 'Haider received user directive',
          status: 'ok'
        }
      ]
    };

    this.activeTask = newTask;
    this.updateTask(newTask);

    if (onSpeech) {
      onSpeech("Got it. I'll have Desktop Commander handle that.");
    }

    return this.executeDesktopWorkflow(prompt, onSpeech);
  }

  /**
   * Evaluates if prompt relates to local Windows / dev / terminal tasks
   */
  private detectDesktopIntent(lower: string): boolean {
    const desktopKeywords = [
      'vs code', 'vscode', 'terminal', 'powershell', 'chrome', 'browser',
      'port', 'npm', 'node', 'git', 'docker', 'dev server', 'localhost',
      'build', 'compile', 'run project', 'start project', 'test project',
      'kill process', 'taskkill', 'tasklist', 'inspect pc', 'system info',
      'screenshot', 'desktop', 'my computer', 'windows', 'c drive', 'workspace',
      'open app', 'launch app', 'what is using port'
    ];
    return desktopKeywords.some(kw => lower.includes(kw));
  }

  /**
   * Plans, safety-checks, executes, and self-verifies desktop task
   */
  private async executeDesktopWorkflow(
    prompt: string,
    onSpeech?: (text: string) => void
  ): Promise<OrchestrationResult> {
    const lower = prompt.toLowerCase();

    this.updateTask({
      status: 'EXECUTING',
      currentStep: 'Desktop Commander analyzing command and security policy...'
    });

    let commandToRun = '';
    let actionDesc = '';
    let safetyLevel: SafetyLevel = 'SAFE';

    // Heuristic routing for core tasks
    if (lower.includes('port')) {
      const match = lower.match(/\b\d{4,5}\b/);
      const portNum = match ? match[0] : '5173';
      commandToRun = `Get-NetTCPConnection -LocalPort ${portNum} -ErrorAction SilentlyContinue | Select-Object LocalPort, OwningProcess, State | Format-Table -AutoSize`;
      actionDesc = `Inspect open TCP connections on port ${portNum}`;
    } else if (lower.includes('git status')) {
      commandToRun = 'git status';
      actionDesc = 'Inspect local Git working tree status';
    } else if (lower.includes('git log')) {
      commandToRun = 'git log -n 5 --oneline';
      actionDesc = 'Read recent commit history';
    } else if (lower.includes('npm run dev') || lower.includes('start project') || lower.includes('start server')) {
      commandToRun = 'npm run dev';
      actionDesc = 'Start local development server';
      safetyLevel = 'MODERATE';
    } else if (lower.includes('npm run build') || lower.includes('build project') || lower.includes('run build')) {
      commandToRun = 'npm run build';
      actionDesc = 'Compile production build';
      safetyLevel = 'MODERATE';
    } else if (lower.includes('npm i') || lower.includes('npm install')) {
      commandToRun = 'npm install';
      actionDesc = 'Install project dependencies';
      safetyLevel = 'MODERATE';
    } else if (lower.includes('open vs code') || lower.includes('open vscode') || lower.includes('open code')) {
      commandToRun = 'code .';
      actionDesc = 'Open current workspace in Visual Studio Code';
    } else if (lower.includes('open terminal')) {
      commandToRun = 'wt || start powershell';
      actionDesc = 'Launch Windows Terminal';
    } else if (lower.includes('open chrome')) {
      commandToRun = 'start chrome';
      actionDesc = 'Launch Google Chrome';
    } else if (lower.includes('system info') || lower.includes('specs') || lower.includes('inspect pc')) {
      commandToRun = 'Get-ComputerInfo | Select-Object WindowsProductName, TotalPhysicalMemory, CsProcessors | Format-List';
      actionDesc = 'Inspect Windows hardware & OS specs';
    } else if (lower.includes('docker')) {
      commandToRun = 'docker ps';
      actionDesc = 'Inspect active Docker containers';
    } else if (lower.includes('screenshot') || lower.includes('screen')) {
      this.updateTask({ currentStep: 'Capturing desktop screenshot...' });
      const shot = await desktopCommander.captureScreenshot();
      this.recordAction('Desktop Commander captured desktop screen', 'ok');
      this.updateTask({
        status: 'COMPLETED',
        currentStep: 'Screenshot captured successfully',
        result: 'Desktop screenshot captured.',
        endTime: Date.now(),
        evidence: { screenshotUrl: shot.dataUrl }
      });
      const rep = "I captured your current Windows desktop screen.";
      if (onSpeech) onSpeech(rep);
      return { handledBy: 'desktop_commander', replyText: rep, task: this.activeTask! };
    } else {
      // General PowerShell query
      commandToRun = prompt.replace(/^haider\s*,?\s*/i, '');
      actionDesc = `Execute PowerShell: ${commandToRun}`;
      if (/rm\s+|del\s+|format\s+|taskkill\s+\/f/i.test(commandToRun)) {
        safetyLevel = 'HIGH_RISK';
      }
    }

    this.updateTask({
      safetyLevel,
      currentStep: `Desktop Commander executing: ${actionDesc}`,
      pendingCommand: commandToRun
    });

    // Check if HIGH_RISK -> User Approval Card required!
    if (safetyLevel === 'HIGH_RISK') {
      this.updateTask({
        status: 'WAITING_FOR_CONFIRMATION',
        requiresConfirmation: true,
        confirmationReason: `The command "${commandToRun}" involves destructive operations. Explicit approval is required.`,
        currentStep: 'Awaiting your authorization to proceed with high-risk action...'
      });

      if (onSpeech) {
        onSpeech("This action requires your confirmation before proceeding.");
      }

      // Wait for approval
      const isApproved = await new Promise<boolean>((resolve) => {
        this.approvalResolver = resolve;
      });

      if (!isApproved) {
        this.recordAction(`User cancelled high-risk command: "${commandToRun}"`, 'blocked');
        this.updateTask({
          status: 'CANCELLED',
          requiresConfirmation: false,
          currentStep: 'Execution cancelled by user.',
          endTime: Date.now()
        });
        const rep = "Execution cancelled. I did not run the command.";
        if (onSpeech) onSpeech(rep);
        return { handledBy: 'desktop_commander', replyText: rep, task: this.activeTask! };
      }
    }

    // Execute through Desktop Commander Client
    try {
      this.recordAction(`Running: ${commandToRun}`, 'pending');
      const res = await desktopCommander.executeCommand(commandToRun, {
        taskId: this.activeTask!.taskId,
        approved: true
      });

      const output = res.stdout || res.stderr || 'Command executed without output.';
      this.recordAction(`Completed: ${commandToRun}`, res.success ? 'ok' : 'error', output);

      // Self-Verification Step
      this.updateTask({
        status: 'VERIFYING',
        currentStep: 'Haider verifying execution evidence...'
      });

      let verbalFeedback = '';
      if (res.success) {
        verbalFeedback = `Done. ${actionDesc} completed successfully.`;
        if (output.length < 160 && !output.includes('\n')) {
          verbalFeedback = `Done: ${output}`;
        }
      } else {
        verbalFeedback = `Desktop Commander encountered an error while executing that. Here's what failed: ${res.stderr || output}`;
      }

      this.updateTask({
        status: res.success ? 'COMPLETED' : 'FAILED',
        currentStep: res.success ? 'Task verified successfully' : 'Task failed with exit code',
        result: output,
        error: res.success ? undefined : res.stderr,
        endTime: Date.now(),
        evidence: {
          terminalOutput: output
        }
      });

      if (onSpeech) onSpeech(verbalFeedback);

      return {
        handledBy: 'desktop_commander',
        replyText: verbalFeedback,
        task: this.activeTask!
      };
    } catch (err: any) {
      this.recordAction(`Failed: ${commandToRun}`, 'error', err.message);
      this.updateTask({
        status: 'FAILED',
        error: err.message,
        currentStep: `Failed: ${err.message}`,
        endTime: Date.now()
      });
      const errMsg = `Desktop Commander could not execute that command: ${err.message}`;
      if (onSpeech) onSpeech(errMsg);
      return { handledBy: 'desktop_commander', replyText: errMsg, task: this.activeTask! };
    }
  }

  private recordAction(action: string, status: 'ok' | 'error' | 'pending' | 'blocked', output?: string) {
    if (!this.activeTask) return;
    const entry: ActionHistoryEntry = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      action,
      output,
      status
    };
    this.updateTask({
      actionHistory: [...this.activeTask.actionHistory, entry]
    });
  }
}

// Singleton Orchestrator
export const orchestrator = new AgentOrchestrator();
