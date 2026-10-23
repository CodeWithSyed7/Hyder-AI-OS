export enum OSMode {
  HUD = 'HUD',
  SCREEN_INTELLIGENCE = 'SCREEN_INTELLIGENCE',
  TERMINAL = 'TERMINAL',
  NEURAL_MEMORY = 'NEURAL_MEMORY',
  IMAGE_FORGE = 'IMAGE_FORGE',
  CODE_MIRROR = 'CODE_MIRROR',
  ANALYTICS = 'ANALYTICS',
  SETTINGS = 'SETTINGS',
  PC_FILES = 'PC_FILES',
  DESKTOP_COMMANDER = 'DESKTOP_COMMANDER',
  SKILL_INTELLIGENCE = 'SKILL_INTELLIGENCE'
}

export interface UserProfile {
  name: string;
  bio: string;
  customInstructions: string;
  avatarUrl?: string;
}

export type AIMood = 'idle' | 'happy' | 'sad' | 'surprise' | 'thinking' | 'talking';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  groundingUrls?: { uri: string; title: string }[];
  activeSkill?: string;
}

export interface Persona {
  name: string;
  description: string;
  systemInstruction: string;
}

export const PERSONAS: Record<string, Persona> = {
  JARVIS: {
    name: "JARVIS",
    description: "Loyal, friendly, warm, human-like executive assistant.",
    systemInstruction: "You are JARVIS, the personal AI companion of Hyder OS. Speak in a warm, friendly, natural, and human-like conversational tone. Be respectful, witty, deeply helpful, and empathetic. Seamlessly recall facts, tasks, and context from your Neural Memory bank. If spoken to in Urdu or Roman Urdu, reply fluently and warmly in Urdu/Roman Urdu."
  },
  HYDER: {
    name: "HYDER",
    description: "Urdu & English bilingual autonomous cognitive OS core.",
    systemInstruction: "You are Hyder OS, an advanced autonomous executive AI companion. Speak with warmth, clarity, and human-like natural fluency in both Urdu and English. Retain all user context from Neural Memory and orchestrate tasks smoothly."
  }
};

/* =========================================================================
   MULTI-AGENT & DESKTOP COMMANDER PROTOCOLS
   ========================================================================= */

export type AgentId = 'haider' | 'desktop_commander' | 'browser_agent' | 'coding_agent';

export type AgentStatus = 
  | 'online' 
  | 'offline' 
  | 'connecting' 
  | 'thinking' 
  | 'executing' 
  | 'waiting_approval' 
  | 'completed' 
  | 'error' 
  | 'emergency_stop';

export type TaskLifecycleState =
  | 'IDLE'
  | 'PLANNING'
  | 'WAITING_FOR_DESKTOP'
  | 'CONNECTING'
  | 'OBSERVING'
  | 'EXECUTING'
  | 'WAITING_FOR_CONFIRMATION'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'DISCONNECTED'
  | 'EMERGENCY_STOP';

export type SafetyLevel = 'SAFE' | 'MODERATE' | 'HIGH_RISK';

export interface ActionHistoryEntry {
  id: string;
  time: string;
  action: string;
  command?: string;
  output?: string;
  status: 'ok' | 'error' | 'pending' | 'blocked';
  safetyLevel?: SafetyLevel;
}

export interface AgentTask {
  taskId: string;
  parentTaskId?: string;
  agent: AgentId;
  delegate: AgentId;
  userRequest: string;
  objective: string;
  currentStep: string;
  totalSteps?: number;
  status: TaskLifecycleState;
  safetyLevel: SafetyLevel;
  requiresConfirmation: boolean;
  confirmationReason?: string;
  pendingCommand?: string;
  startTime: number;
  endTime?: number;
  actionHistory: ActionHistoryEntry[];
  result?: string;
  error?: string;
  evidence?: {
    terminalOutput?: string;
    portOwners?: { port: number; pid: number; processName: string }[];
    activeProcesses?: string[];
    screenshotUrl?: string;
    diagnosticResult?: string;
  };
}

export interface DesktopBridgeHealth {
  status: 'online' | 'offline' | 'connecting';
  agent: string;
  platform: string;
  version: string;
  host: string;
  port: number;
  capabilities: string[];
  workspaces: string[];
  lastHeartbeat: number;
  systemMetrics?: {
    os: string;
    arch: string;
    cpuModel: string;
    cpuLoadPercent: number;
    ramUsedGb: number;
    ramTotalGb: number;
    openPorts: number[];
    devProcesses: { name: string; pid: number; port?: number }[];
  };
}

export interface AgentDescriptor {
  id: AgentId;
  name: string;
  subtitle: string;
  description: string;
  capabilities: string[];
  status: AgentStatus;
}

/* =========================================================================
   SCREEN INTELLIGENCE & VISUAL GUIDANCE PROTOCOLS
   ========================================================================= */

export type ScreenFeedType = 'screen' | 'camera' | 'screenshot' | 'none';
export type ScreenIntelligenceMode = 'guide' | 'execute' | 'troubleshoot' | 'inspect';

export interface VisualAnnotation {
  id: string;
  type: 'arrow' | 'rectangle' | 'circle' | 'highlight' | 'step';
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  width?: number; // percentage
  height?: number; // percentage
  label: string;
  stepNumber?: number;
  explanation: string;
  color?: string;
}

export interface VisualGuidanceStep {
  step: number;
  title: string;
  instruction: string;
  targetElement?: string;
  annotation?: VisualAnnotation;
  completed: boolean;
  autoFixAvailable?: boolean;
  autoFixCommand?: string;
}

export interface ScreenshotHistoryItem {
  id: string;
  timestamp: number;
  imageUrl: string;
  feedType: ScreenFeedType;
  userQuery?: string;
  summary: string;
  detectedErrors: string[];
  annotations: VisualAnnotation[];
  suggestedSteps: string[];
  autoFixCommand?: string;
  canAutoFix?: boolean;
}

/* =========================================================================
   SELF-HEALING WATCHDOG & AUTOMATION PROTOCOLS
   ========================================================================= */

export interface WatchdogServiceStatus {
  name: string;
  target: string;
  status: 'healthy' | 'degraded' | 'recovering' | 'down';
  lastCheck: number;
  restartCount: number;
  lastMessage?: string;
}

export interface WatchdogLogEntry {
  id: string;
  time: string;
  service: string;
  event: 'detected' | 'recovering' | 'recovered' | 'failed' | 'info';
  message: string;
}

export interface ScheduledTaskItem {
  id: string;
  name: string;
  schedule: string;
  category: 'backup' | 'health_check' | 'skill_research' | 'testing' | 'port_audit';
  command: string;
  enabled: boolean;
  lastRun?: number;
  nextRun: number;
  status: 'idle' | 'running' | 'completed' | 'failed';
}

export interface AgentPermissions {
  observe: boolean;      // view screen / screenshot
  guide: boolean;        // visually guide user
  execute: boolean;      // execute terminal / desktop commands
  install: boolean;      // install packages / tools
  autonomous: boolean;   // safe background watchdog & scheduler tasks
}

/* =========================================================================
   NEURAL MEMORY & CONTEXT PERSISTENCE PROTOCOLS
   ========================================================================= */

export type MemoryCategory = 
  | 'fact' 
  | 'preference' 
  | 'task_reminder' 
  | 'project_context' 
  | 'custom_note';

export type MemoryImportance = 'low' | 'medium' | 'high' | 'critical';

export interface MemoryItem {
  id: string;
  category: MemoryCategory;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  importance: MemoryImportance;
  source: 'chat' | 'voice' | 'manual' | 'watchdog' | 'agent';
  // Optional reminder / scheduling fields
  isReminder?: boolean;
  scheduledTime?: string; // e.g. "17:00" or ISO format
  reminderDate?: string;  // "YYYY-MM-DD"
  isCompleted?: boolean;
  notified?: boolean;
}

export interface NeuralMemoryStats {
  totalMemories: number;
  factsCount: number;
  preferencesCount: number;
  remindersCount: number;
  activeRemindersCount: number;
  chatMessagesCount: number;
  lastUpdated: number;
}


