import React, { useState, useEffect, useRef } from 'react';
import { 
  Laptop, 
  Terminal, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  Play, 
  Square, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Cpu, 
  HardDrive, 
  Camera, 
  Radio, 
  Code, 
  ExternalLink, 
  FolderOpen, 
  Sliders, 
  Copy, 
  Check, 
  Send,
  Zap,
  Globe,
  Settings,
  ArrowUp,
  ArrowDown,
  Plus,
  Filter,
  ListOrdered
} from 'lucide-react';
import { AgentTask, DesktopBridgeHealth, SafetyLevel } from '../types';
import { desktopCommander } from '../services/desktopCommanderService';
import { orchestrator } from '../services/agentOrchestrator';

export type TaskPriority = 'High' | 'Medium' | 'Low';

export interface LocalTaskItem {
  id: string;
  label: string;
  cmd: string;
  priority: TaskPriority;
  category: string;
}

export const DEFAULT_LOCAL_TASKS: LocalTaskItem[] = [
  { id: 't-1', label: 'Kill Hung Dev Processes', cmd: 'taskkill /F /IM node.exe; taskkill /F /IM vite.exe', priority: 'High', category: 'Process Kill' },
  { id: 't-2', label: 'Inspect Port Conflicts (3000/5173)', cmd: 'Get-NetTCPConnection -LocalPort 3000,5173 -State Listen -ErrorAction SilentlyContinue | Select-Object LocalPort, OwningProcess, State', priority: 'High', category: 'Port Diagnostics' },
  { id: 't-3', label: 'Compile Production Build', cmd: 'npm run build', priority: 'Medium', category: 'Build' },
  { id: 't-4', label: 'Git Working Tree Status', cmd: 'git status', priority: 'Medium', category: 'Git' },
  { id: 't-5', label: 'Open Workspace in VS Code', cmd: 'code .', priority: 'Medium', category: 'IDE' },
  { id: 't-6', label: 'Check Node & npm Versions', cmd: 'node -v; npm -v', priority: 'Low', category: 'Environment' },
  { id: 't-7', label: 'System Hardware & OS Info', cmd: 'Get-ComputerInfo | Select-Object WindowsProductName, TotalPhysicalMemory', priority: 'Low', category: 'Telemetry' },
  { id: 't-8', label: 'Inspect Active Dev Processes', cmd: 'Get-Process | Where-Object {$_.ProcessName -match "node|git|code|docker"} | Select-Object Id, ProcessName', priority: 'Low', category: 'Process Audit' }
];

export const DesktopCommanderPanel: React.FC = () => {
  const [health, setHealth] = useState<DesktopBridgeHealth>(desktopCommander.health);
  const [activeTask, setActiveTask] = useState<AgentTask | null>(orchestrator.getActiveTask());
  const [manualCommand, setManualCommand] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<Array<{ cmd: string; out: string; code: number; time: string }>>([
    {
      cmd: 'Get-ComputerInfo | Select-Object WindowsProductName',
      out: 'Microsoft Windows 11 Pro [Version 10.0.26100]',
      code: 0,
      time: new Date().toLocaleTimeString()
    }
  ]);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState(localStorage.getItem('haider_dc_token') || 'haider_commander_token_local');
  const [portInput, setPortInput] = useState(localStorage.getItem('haider_dc_port') || '9742');

  // Local terminal tasks categorized by High, Medium, and Low priority with reordering
  const [localTasks, setLocalTasks] = useState<LocalTaskItem[]>(() => {
    try {
      const saved = localStorage.getItem('haider_local_tasks_priority_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_LOCAL_TASKS;
  });

  const [priorityFilter, setPriorityFilter] = useState<'All' | TaskPriority>('All');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskLabel, setNewTaskLabel] = useState('');
  const [newTaskCmd, setNewTaskCmd] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('Medium');

  const saveLocalTasks = (tasks: LocalTaskItem[]) => {
    setLocalTasks(tasks);
    try {
      localStorage.setItem('haider_local_tasks_priority_v1', JSON.stringify(tasks));
      window.dispatchEvent(new Event('haider_tasks_updated'));
    } catch (e) {}
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...localTasks];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    saveLocalTasks(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index >= localTasks.length - 1) return;
    const updated = [...localTasks];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    saveLocalTasks(updated);
  };

  const cycleTaskPriority = (id: string) => {
    const updated = localTasks.map(t => {
      if (t.id === id) {
        const next: TaskPriority = t.priority === 'High' ? 'Low' : t.priority === 'Low' ? 'Medium' : 'High';
        return { ...t, priority: next };
      }
      return t;
    });
    saveLocalTasks(updated);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskLabel.trim() || !newTaskCmd.trim()) return;
    const created: LocalTaskItem = {
      id: `task_${Date.now()}`,
      label: newTaskLabel.trim(),
      cmd: newTaskCmd.trim(),
      priority: newTaskPriority,
      category: 'Custom Directives'
    };
    saveLocalTasks([created, ...localTasks]);
    setNewTaskLabel('');
    setNewTaskCmd('');
    setIsAddingTask(false);
  };

  const handleDeleteTask = (id: string) => {
    saveLocalTasks(localTasks.filter(t => t.id !== id));
  };

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to health & task stream
  useEffect(() => {
    const unsubCommander = desktopCommander.subscribe((evt) => {
      if (evt.type === 'STATUS_CHANGE') {
        setHealth({ ...desktopCommander.health });
      } else if (evt.type === 'EMERGENCY_STOP_TRIGGERED') {
        setEmergencyActive(true);
      } else if (evt.type === 'EMERGENCY_STOP_RESET') {
        setEmergencyActive(false);
      }
    });

    const unsubOrchestrator = orchestrator.subscribe((task) => {
      setActiveTask({ ...task });
      if (task.status === 'COMPLETED' || task.status === 'FAILED' || task.status === 'CANCELLED') {
        setIsExecuting(false);
      }
    });

    // Initial system metrics poll if online
    if (desktopCommander.isOnline()) {
      desktopCommander.getSystemMetrics().then(m => {
        if (m) setSystemMetrics(m);
      });
    }

    const handleSyncTasks = () => {
      try {
        const saved = localStorage.getItem('haider_local_tasks_priority_v1');
        if (saved) setLocalTasks(JSON.parse(saved));
      } catch (e) {}
    };
    window.addEventListener('haider_tasks_updated', handleSyncTasks);
    window.addEventListener('storage', handleSyncTasks);

    return () => {
      window.removeEventListener('haider_tasks_updated', handleSyncTasks);
      window.removeEventListener('storage', handleSyncTasks);
      unsubCommander();
      unsubOrchestrator();
    };
  }, []);

  const handleRunCommand = async (cmdToRun: string, isApproval: boolean = false) => {
    const cmd = cmdToRun.trim();
    if (!cmd) return;

    setIsExecuting(true);
    try {
      const res = await desktopCommander.executeCommand(cmd, { approved: isApproval });
      setTerminalHistory(prev => [
        {
          cmd,
          out: res.stdout || res.stderr || 'Executed with exit code 0.',
          code: res.exitCode ?? 0,
          time: new Date().toLocaleTimeString()
        },
        ...prev.slice(0, 15)
      ]);
      setManualCommand('');
    } catch (err: any) {
      setTerminalHistory(prev => [
        {
          cmd,
          out: err.message,
          code: 1,
          time: new Date().toLocaleTimeString()
        },
        ...prev.slice(0, 15)
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCaptureScreen = async () => {
    try {
      const shot = await desktopCommander.captureScreenshot();
      if (shot.dataUrl) {
        setScreenshotData(shot.dataUrl);
      }
    } catch (e: any) {
      alert(`Screenshot failed: ${e.message}`);
    }
  };

  const handleEmergencyStop = async () => {
    if (confirm("Are you sure you want to trigger EMERGENCY STOP? This will immediately terminate all active desktop child processes.")) {
      await desktopCommander.triggerEmergencyStop();
      setEmergencyActive(true);
    }
  };

  const handleResetEmergency = async () => {
    await desktopCommander.resetEmergencyStop();
    setEmergencyActive(false);
  };

  const handleSaveConfig = () => {
    desktopCommander.configure('127.0.0.1', parseInt(portInput, 10), tokenInput);
    setConfigOpen(false);
  };

  const copyRunCommand = () => {
    navigator.clipboard.writeText("cd desktop-commander && npm start");
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 overflow-y-auto custom-scrollbar select-none text-white">
      
      {/* Top Multi-Agent Header & Emergency Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] bg-white/[0.02] border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00E5FF]/20 to-[#2ED8C3]/20 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] shadow-[0_0_25px_rgba(0,229,255,0.2)]">
            <Laptop size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[clamp(16px,1.2vw,22px)] font-orbitron font-black text-white tracking-wider">
                DESKTOP COMMANDER
              </h2>
              <span className="text-[clamp(7px,0.5vw,9px)] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30">
                WINDOWS AGENT
              </span>
            </div>
            <p className="text-[clamp(9px,0.65vw,11px)] text-white/50 font-mono tracking-widest uppercase">
              DELEGATED BY HAIDER EXECUTIVE CORE // LOCAL MACHINE BRIDGE
            </p>
          </div>
        </div>

        {/* Multi-Agent Dual Status Indicators */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Haider Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse"></span>
            <div className="flex flex-col text-left">
              <span className="text-[clamp(7px,0.5vw,8px)] font-mono text-white/40 uppercase">EXECUTIVE</span>
              <span className="text-[clamp(9px,0.65vw,11px)] font-orbitron font-bold text-white">HAIDER: ONLINE</span>
            </div>
          </div>

          {/* Desktop Commander Status */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
            health.status === 'online' 
              ? 'bg-[#2ED8C3]/10 border-[#2ED8C3]/30 text-[#2ED8C3]' 
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${health.status === 'online' ? 'bg-[#2ED8C3] animate-ping' : 'bg-red-400'}`}></span>
            <div className="flex flex-col text-left">
              <span className="text-[clamp(7px,0.5vw,8px)] font-mono opacity-60 uppercase">EXECUTION AGENT</span>
              <span className="text-[clamp(9px,0.65vw,11px)] font-orbitron font-bold">
                {health.status === 'online' ? 'COMMANDER: ONLINE' : 'COMMANDER: OFFLINE'}
              </span>
            </div>
          </div>

          {/* Emergency Stop / Reset Button */}
          {emergencyActive ? (
            <button
              onClick={handleResetEmergency}
              className="px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-orbitron font-black text-[clamp(8px,0.6vw,10px)] tracking-wider uppercase transition-all shadow-lg flex items-center gap-2 animate-bounce"
            >
              <AlertTriangle size={14} /> RESET EMERGENCY LOCK
            </button>
          ) : (
            <button
              onClick={handleEmergencyStop}
              className="px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500 border border-red-500/40 text-red-200 hover:text-white font-orbitron font-black text-[clamp(8px,0.6vw,10px)] tracking-wider uppercase transition-all shadow-lg flex items-center gap-1.5"
            >
              <ShieldAlert size={14} /> EMERGENCY STOP
            </button>
          )}

          {/* Settings cog */}
          <button
            onClick={() => setConfigOpen(!configOpen)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-colors"
            title="Configure Desktop Commander Bridge"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Configuration Drawer */}
      {configOpen && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-[#00E5FF]/30 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-slide-in">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="flex flex-col w-full sm:w-auto">
              <label className="text-[clamp(7px,0.5vw,8px)] font-mono text-white/40 uppercase mb-1">Port</label>
              <input 
                type="text" 
                value={portInput}
                onChange={e => setPortInput(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-[clamp(10px,0.75vw,12px)] font-mono text-[#00E5FF] outline-none"
              />
            </div>
            <div className="flex flex-col w-full sm:w-64">
              <label className="text-[clamp(7px,0.5vw,8px)] font-mono text-white/40 uppercase mb-1">Auth Token</label>
              <input 
                type="password" 
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-[clamp(10px,0.75vw,12px)] font-mono text-white outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveConfig}
              className="px-4 py-2 rounded-xl bg-[#00E5FF] text-[#0A1A2F] font-orbitron font-bold text-[clamp(8px,0.6vw,10px)] tracking-wider uppercase hover:bg-white transition-all"
            >
              SAVE & RECONNECT
            </button>
          </div>
        </div>
      )}

      {/* OFFLINE NOTICE / QUICK SETUP CARD (When Desktop Commander Bridge is not running) */}
      {health.status !== 'online' && (
        <div className="p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] bg-red-500/10 border border-red-500/30 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 shrink-0 mt-1">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="font-orbitron font-black text-[clamp(12px,0.9vw,15px)] text-white uppercase tracking-wider mb-1">
                Desktop Commander Local Bridge Is Offline
              </h3>
              <p className="text-[clamp(10px,0.75vw,12px)] text-white/60 leading-relaxed max-w-2xl">
                Haider is operating in browser sandbox mode. To enable direct Windows terminal execution, VS Code control, and port inspection, launch the local execution service on your Windows machine:
              </p>
              <div className="mt-3 flex items-center gap-2 font-mono text-[clamp(9px,0.65vw,11px)] bg-black/40 px-3 py-2 rounded-xl border border-white/10 text-[#00E5FF] max-w-lg">
                <span className="select-all">cd desktop-commander && npm start</span>
                <button
                  onClick={copyRunCommand}
                  className="ml-auto p-1 text-white/40 hover:text-white transition-colors"
                  title="Copy command"
                >
                  {copiedScript ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => desktopCommander.checkHealth()}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-orbitron font-bold text-[clamp(8px,0.6vw,10px)] tracking-wider uppercase transition-all shrink-0 flex items-center gap-2"
          >
            <RefreshCw size={13} /> RETRY CONNECTION
          </button>
        </div>
      )}

      {/* USER CONFIRMATION REQUIRED MODAL CARD */}
      {activeTask && activeTask.requiresConfirmation && (
        <div className="p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] bg-yellow-500/10 border-2 border-yellow-400/50 backdrop-blur-2xl shadow-[0_0_50px_rgba(250,204,21,0.2)] animate-slide-in">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-yellow-500/20 text-yellow-400 shrink-0">
              <ShieldAlert size={26} className="animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[clamp(7px,0.5vw,9px)] font-mono font-bold bg-yellow-500 text-black uppercase">
                  HIGH RISK AUTHORIZATION REQUIRED
                </span>
                <span className="text-[clamp(8px,0.55vw,10px)] font-mono text-white/40">
                  TASK ID: {activeTask.taskId}
                </span>
              </div>
              <h3 className="text-[clamp(14px,1vw,18px)] font-orbitron font-black text-white mb-2">
                Desktop Commander requests permission to execute a critical command
              </h3>
              <p className="text-[clamp(11px,0.8vw,13px)] text-white/80 leading-relaxed mb-3">
                {activeTask.confirmationReason || "This action alters filesystem or system state."}
              </p>
              
              {activeTask.pendingCommand && (
                <div className="p-3 rounded-xl bg-black/60 border border-yellow-500/30 font-mono text-[clamp(10px,0.75vw,12px)] text-yellow-300 mb-4 select-all">
                  {activeTask.pendingCommand}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => orchestrator.resolveConfirmation(true)}
                  className="px-6 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-orbitron font-black text-[clamp(9px,0.65vw,11px)] tracking-widest uppercase transition-all shadow-lg active:scale-95"
                >
                  AUTHORIZE ONCE
                </button>
                <button
                  onClick={() => orchestrator.resolveConfirmation(false)}
                  className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-orbitron font-bold text-[clamp(9px,0.65vw,11px)] tracking-widest uppercase transition-all active:scale-95"
                >
                  CANCEL OPERATION
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Left Column (Activity Stream & Task Tracking) | Right Column (Terminal & Controls) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* LEFT COLUMN: Real-Time Multi-Agent Activity Stream */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          
          {/* Active Task Card */}
          <div className="p-4 sm:p-5 rounded-[22px] sm:rounded-[30px] bg-white/[0.02] border border-white/10 backdrop-blur-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[clamp(8px,0.55vw,10px)] font-orbitron font-black text-[#00E5FF] tracking-[0.2em] uppercase flex items-center gap-1.5">
                <Radio size={12} className="animate-pulse" /> CURRENT ORCHESTRATION TASK
              </span>
              {activeTask && (
                <span className={`px-2 py-0.5 rounded-full text-[clamp(7px,0.5vw,9px)] font-mono font-bold uppercase ${
                  activeTask.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400 border border-green-500/30' :
                  activeTask.status === 'EXECUTING' ? 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 animate-pulse' :
                  activeTask.status === 'WAITING_FOR_CONFIRMATION' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' :
                  'bg-white/10 text-white/50'
                }`}>
                  {activeTask.status}
                </span>
              )}
            </div>

            {activeTask ? (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <div className="text-[clamp(7px,0.5vw,9px)] font-mono text-white/40 uppercase mb-0.5">User Directive</div>
                  <div className="text-[clamp(11px,0.8vw,13px)] font-medium text-white">
                    "{activeTask.userRequest}"
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#00E5FF]/5 border border-[#00E5FF]/20">
                  <div className="text-[clamp(7px,0.5vw,9px)] font-mono text-[#00E5FF] uppercase mb-0.5">Current Step</div>
                  <div className="text-[clamp(10px,0.75vw,12px)] font-mono text-white/90">
                    {activeTask.currentStep}
                  </div>
                </div>

                {activeTask.status === 'EXECUTING' && (
                  <button
                    onClick={() => orchestrator.cancelActiveTask()}
                    className="w-full py-2 rounded-xl bg-red-500/20 hover:bg-red-500 border border-red-500/30 text-red-200 font-orbitron font-bold text-[clamp(8px,0.55vw,10px)] tracking-wider uppercase transition-all"
                  >
                    STOP ACTIVE TASK
                  </button>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-white/30 font-mono text-[clamp(10px,0.75vw,12px)]">
                Standing by. Issue a voice directive or terminal command to begin.
              </div>
            )}
          </div>

          {/* Chronological Action History Timeline */}
          <div className="p-4 sm:p-5 rounded-[22px] sm:rounded-[30px] bg-white/[0.02] border border-white/10 backdrop-blur-xl flex flex-col flex-1">
            <span className="text-[clamp(8px,0.55vw,10px)] font-orbitron font-black text-white/40 tracking-[0.2em] uppercase mb-3">
              EXECUTION ACTIVITY TIMELINE
            </span>

            <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
              {activeTask?.actionHistory && activeTask.actionHistory.length > 0 ? (
                activeTask.actionHistory.map((act) => (
                  <div 
                    key={act.id} 
                    className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2.5 text-left"
                  >
                    <div className="mt-0.5">
                      {act.status === 'ok' ? (
                        <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                      ) : act.status === 'error' ? (
                        <XCircle size={14} className="text-red-400 shrink-0" />
                      ) : act.status === 'blocked' ? (
                        <AlertTriangle size={14} className="text-yellow-400 shrink-0" />
                      ) : (
                        <span className="w-3 h-3 rounded-full bg-[#00E5FF] animate-ping inline-block"></span>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between text-[clamp(7px,0.5vw,9px)] font-mono text-white/30 mb-0.5">
                        <span>{act.time}</span>
                        <span className="uppercase">{act.status}</span>
                      </div>
                      <div className="text-[clamp(9px,0.7vw,11px)] text-white/90 font-mono leading-relaxed truncate">
                        {act.action}
                      </div>
                      {act.output && (
                        <div className="mt-1 text-[clamp(8px,0.6vw,10px)] font-mono text-white/50 bg-black/40 p-1.5 rounded max-h-16 overflow-y-auto custom-scrollbar">
                          {act.output}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-white/20 font-mono text-[clamp(9px,0.65vw,11px)]">
                  No execution events recorded yet.
                </div>
              )}
            </div>
          </div>

          {/* Local Tasks & Directives Deck: Categorized by High, Medium, Low Priority with Reordering */}
          <div className="p-4 sm:p-5 rounded-[22px] sm:rounded-[30px] bg-white/[0.02] border border-white/10 backdrop-blur-xl flex flex-col space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ListOrdered size={14} className="text-[#00E5FF]" />
                <span className="text-[clamp(8px,0.55vw,10px)] font-orbitron font-black text-white/70 tracking-[0.18em] uppercase">
                  LOCAL TERMINAL TASKS // PRIORITY QUEUE
                </span>
              </div>
              <button
                onClick={() => setIsAddingTask(!isAddingTask)}
                className="px-2.5 py-1 rounded-lg bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 border border-[#00E5FF]/30 text-[#00E5FF] font-mono text-[clamp(8px,0.55vw,10px)] flex items-center gap-1 transition-all"
              >
                <Plus size={11} /> {isAddingTask ? 'CANCEL' : 'ADD TASK'}
              </button>
            </div>

            {/* Priority Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/5 overflow-x-auto custom-scrollbar">
              {(['All', 'High', 'Medium', 'Low'] as const).map(p => {
                const count = p === 'All' 
                  ? localTasks.length 
                  : localTasks.filter(t => t.priority === p).length;
                const isActive = priorityFilter === p;
                return (
                  <button
                    key={p}
                    onClick={() => setPriorityFilter(p)}
                    className={`px-2.5 py-1 rounded-lg text-[clamp(7.5px,0.5vw,9.5px)] font-mono font-bold uppercase transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      isActive 
                        ? p === 'High' 
                          ? 'bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                          : p === 'Medium'
                          ? 'bg-yellow-500 text-black shadow-[0_0_12px_rgba(234,179,8,0.4)]'
                          : p === 'Low'
                          ? 'bg-[#00E5FF] text-[#0A1A2F] shadow-[0_0_12px_rgba(0,229,255,0.4)]'
                          : 'bg-white text-black'
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{p}</span>
                    <span className={`px-1 py-0.2 rounded-full text-[8px] ${isActive ? 'bg-black/20 text-current' : 'bg-white/10 text-white/60'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Add Form */}
            {isAddingTask && (
              <form onSubmit={handleCreateTask} className="p-3 rounded-xl bg-black/60 border border-[#00E5FF]/30 space-y-2.5 animate-slide-in">
                <div className="text-[clamp(8px,0.55vw,10px)] font-mono text-[#00E5FF] uppercase font-bold">New Local Terminal Directive</div>
                <input
                  type="text"
                  placeholder="Task Name (e.g. Audit Docker Containers)"
                  value={newTaskLabel}
                  onChange={e => setNewTaskLabel(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[clamp(9px,0.7vw,11px)] font-mono text-white outline-none focus:border-[#00E5FF]"
                />
                <input
                  type="text"
                  placeholder="Command (e.g. docker ps -a)"
                  value={newTaskCmd}
                  onChange={e => setNewTaskCmd(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[clamp(9px,0.7vw,11px)] font-mono text-[#00E5FF] outline-none focus:border-[#00E5FF]"
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[clamp(7px,0.5vw,9px)] font-mono text-white/50">
                    <span>PRIORITY:</span>
                    {(['High', 'Medium', 'Low'] as TaskPriority[]).map(pr => (
                      <button
                        type="button"
                        key={pr}
                        onClick={() => setNewTaskPriority(pr)}
                        className={`px-2 py-0.5 rounded text-[8px] uppercase font-bold border transition-all ${
                          newTaskPriority === pr
                            ? pr === 'High' ? 'bg-rose-500/20 text-rose-300 border-rose-500' :
                              pr === 'Medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500' :
                              'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]'
                            : 'border-white/10 text-white/30'
                        }`}
                      >
                        {pr}
                      </button>
                    ))}
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg bg-[#00E5FF] text-[#0A1A2F] font-orbitron font-bold text-[clamp(7.5px,0.5vw,9.5px)] uppercase tracking-wider hover:bg-white transition-all"
                  >
                    SAVE TASK
                  </button>
                </div>
              </form>
            )}

            {/* Reorderable Task List */}
            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
              {localTasks
                .map((task, originalIndex) => ({ task, originalIndex }))
                .filter(({ task }) => priorityFilter === 'All' || task.priority === priorityFilter)
                .map(({ task, originalIndex }) => (
                  <div
                    key={task.id}
                    className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/20 transition-all flex items-center justify-between gap-2 group"
                  >
                    {/* Reorder Arrows */}
                    <div className="flex flex-col gap-0.5 text-white/30 group-hover:text-white/60 shrink-0">
                      <button
                        onClick={() => handleMoveUp(originalIndex)}
                        disabled={originalIndex === 0}
                        title="Move Up in Priority Queue"
                        className="p-0.5 hover:text-[#00E5FF] disabled:opacity-20 disabled:hover:text-white/30 transition-colors"
                      >
                        <ArrowUp size={11} />
                      </button>
                      <button
                        onClick={() => handleMoveDown(originalIndex)}
                        disabled={originalIndex === localTasks.length - 1}
                        title="Move Down in Priority Queue"
                        className="p-0.5 hover:text-[#00E5FF] disabled:opacity-20 disabled:hover:text-white/30 transition-colors"
                      >
                        <ArrowDown size={11} />
                      </button>
                    </div>

                    {/* Task Info & Command Snippet */}
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-2 mb-0.5">
                        <button
                          onClick={() => cycleTaskPriority(task.id)}
                          title="Click to cycle priority (High -> Low -> Medium)"
                          className={`px-1.5 py-0.2 rounded text-[7.5px] font-mono font-bold uppercase tracking-wider border cursor-pointer transition-all ${
                            task.priority === 'High' 
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.2)]' :
                            task.priority === 'Medium'
                              ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40' :
                              'bg-[#00E5FF]/15 text-[#00E5FF] border-[#00E5FF]/40'
                          }`}
                        >
                          {task.priority}
                        </button>
                        <span className="text-[clamp(9px,0.65vw,11px)] font-orbitron font-bold text-white truncate">
                          {task.label}
                        </span>
                      </div>
                      <div className="text-[clamp(7.5px,0.5vw,9.5px)] font-mono text-white/35 truncate group-hover:text-white/60">
                        PS C:\&gt; {task.cmd}
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleRunCommand(task.cmd)}
                        disabled={!desktopCommander.isOnline() || isExecuting}
                        title={`Run "${task.label}"`}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#00E5FF] text-white hover:text-[#0A1A2F] border border-white/10 hover:border-transparent font-orbitron font-bold text-[clamp(7.5px,0.5vw,9px)] tracking-wider uppercase transition-all disabled:opacity-20 flex items-center gap-1"
                      >
                        <Play size={9} /> RUN
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        title="Remove directive"
                        className="p-1 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <XCircle size={12} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Terminal Output & Live Windows Telemetry */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          
          {/* Controlled Interactive Terminal */}
          <div className="p-4 sm:p-5 rounded-[22px] sm:rounded-[30px] bg-black/60 border border-white/10 backdrop-blur-xl flex flex-col h-[400px]">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-2">
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-[#00E5FF]" />
                <span className="font-orbitron font-black text-[clamp(10px,0.75vw,13px)] text-white tracking-widest uppercase">
                  POWERSHELL EXECUTION CONSOLE
                </span>
              </div>
              <div className="flex items-center gap-2 text-[clamp(8px,0.55vw,10px)] font-mono text-white/40">
                <span>PORT: {health.port}</span>
                <span>•</span>
                <span className={health.status === 'online' ? 'text-green-400' : 'text-red-400'}>
                  {health.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Scrollable Terminal Output Screen */}
            <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[clamp(10px,0.75vw,12px)] space-y-3 pr-2 text-white/80">
              {terminalHistory.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center gap-2 text-[#00E5FF]">
                    <span className="text-white/40">PS C:\&gt;</span>
                    <span className="font-bold">{item.cmd}</span>
                    <span className="text-[clamp(7px,0.5vw,9px)] text-white/30 ml-auto">{item.time}</span>
                  </div>
                  <pre className="text-white/70 whitespace-pre-wrap pl-4 border-l border-white/10 max-h-36 overflow-y-auto custom-scrollbar">
                    {item.out}
                  </pre>
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>

            {/* Command Input Bar */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleRunCommand(manualCommand); }}
              className="mt-3 pt-2 border-t border-white/10 flex items-center gap-2"
            >
              <span className="text-[#00E5FF] font-mono text-sm">&gt;</span>
              <input
                type="text"
                value={manualCommand}
                onChange={e => setManualCommand(e.target.value)}
                placeholder="Enter Windows command (e.g. 'Get-Process', 'npm run build', 'netstat -ano')..."
                disabled={!desktopCommander.isOnline() || isExecuting}
                className="w-full bg-transparent border-none outline-none font-mono text-[clamp(11px,0.8vw,13px)] text-white placeholder:text-white/20"
              />
              <button
                type="submit"
                disabled={!desktopCommander.isOnline() || isExecuting || !manualCommand.trim()}
                className="px-4 py-1.5 rounded-xl bg-[#00E5FF] disabled:bg-white/10 text-[#0A1A2F] disabled:text-white/20 font-orbitron font-bold text-[clamp(8px,0.6vw,10px)] tracking-wider uppercase transition-all shrink-0"
              >
                {isExecuting ? 'EXECUTING...' : 'RUN'}
              </button>
            </form>
          </div>

          {/* Windows System & Live Hardware Telemetry */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Host & OS */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center gap-2 text-white/40 text-[clamp(7px,0.5vw,9px)] font-mono uppercase mb-1">
                <Laptop size={12} className="text-[#00E5FF]" /> HOST SYSTEM
              </div>
              <div className="text-[clamp(12px,0.85vw,14px)] font-bold text-white truncate">
                {health.os || 'Windows 11'}
              </div>
              <div className="text-[clamp(8px,0.55vw,10px)] font-mono text-white/40">
                127.0.0.1:{health.port}
              </div>
            </div>

            {/* Hardware Telemetry */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center gap-2 text-white/40 text-[clamp(7px,0.5vw,9px)] font-mono uppercase mb-1">
                <Cpu size={12} className="text-[#2ED8C3]" /> CPU & MEMORY
              </div>
              <div className="text-[clamp(12px,0.85vw,14px)] font-bold text-white">
                {systemMetrics?.ramUsedGb ? `${systemMetrics.ramUsedGb} GB / ${systemMetrics.ramTotalGb} GB` : 'RAM: Active'}
              </div>
              <div className="text-[clamp(8px,0.55vw,10px)] font-mono text-white/40">
                {systemMetrics?.cpuModel ? systemMetrics.cpuModel.slice(0, 24) : 'x64 Architecture'}
              </div>
            </div>

            {/* Desktop Screenshot trigger */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-white/40 text-[clamp(7px,0.5vw,9px)] font-mono uppercase">
                <Camera size={12} className="text-[#FFAB40]" /> SCREEN PERCEPTION
              </div>
              <button
                onClick={handleCaptureScreen}
                disabled={!desktopCommander.isOnline()}
                className="mt-2 py-1.5 px-3 rounded-lg bg-white/5 hover:bg-[#00E5FF]/20 border border-white/10 text-[clamp(8px,0.55vw,10px)] font-orbitron font-bold text-white hover:text-[#00E5FF] transition-all disabled:opacity-30"
              >
                CAPTURE SCREEN
              </button>
            </div>
          </div>

          {/* Screenshot Preview Modal/Drawer if captured */}
          {screenshotData && (
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[clamp(8px,0.55vw,10px)] font-mono text-white/40 uppercase">
                <span>DESKTOP SCREENSHOT CAPTURE</span>
                <button onClick={() => setScreenshotData(null)} className="text-white/40 hover:text-white">CLOSE</button>
              </div>
              <img 
                src={screenshotData} 
                alt="Desktop Screenshot" 
                className="w-full max-h-56 object-contain rounded-lg border border-white/10" 
              />
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
