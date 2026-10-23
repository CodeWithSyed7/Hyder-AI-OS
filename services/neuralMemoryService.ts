/**
 * Neural Memory & Context Persistence Service
 * Persists user facts, preferences, project context, scheduled task reminders,
 * and chat history across sessions using LocalStorage.
 * Integrates directly with Gemini conversational prompt context and Web Speech.
 */

import { MemoryItem, MemoryCategory, MemoryImportance, NeuralMemoryStats, ChatMessage } from '../types';

export type NeuralMemoryEvent = 
  | { type: 'MEMORIES_UPDATED'; items: MemoryItem[] }
  | { type: 'CHAT_HISTORY_UPDATED'; messages: ChatMessage[] }
  | { type: 'REMINDER_TRIGGERED'; reminder: MemoryItem };

const STORAGE_KEY_MEMORIES = 'haider_neural_memory_items_v1';
const STORAGE_KEY_CHAT = 'haider_neural_chat_history_v1';

// Seed default initial memories if first launch
const DEFAULT_INITIAL_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-core-identity',
    category: 'fact',
    title: 'Operating Core Identity',
    content: 'Hyder OS is an autonomous dual-engine AI operating system powered by Gemini 3.8/3.1 with local Windows Desktop Commander bridge.',
    tags: ['system', 'core', 'architecture'],
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
    importance: 'high',
    source: 'agent'
  },
  {
    id: 'mem-user-persona',
    category: 'preference',
    title: 'Interaction Persona Style',
    content: 'Friendly, warm, conversational, and respectful tone like a real human companion (JARVIS style). Supports Urdu and English fluently.',
    tags: ['personality', 'jarvis', 'urdu', 'tone'],
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
    importance: 'high',
    source: 'manual'
  },
  {
    id: 'mem-dev-stack',
    category: 'project_context',
    title: 'Development Stack & Ports',
    content: 'Vite 6 + React 19 + TypeScript 5.8 on Port 3000. Desktop Commander running natively on Port 9742 with PowerShell access.',
    tags: ['react', 'ports', 'development'],
    createdAt: Date.now() - 43200000,
    updatedAt: Date.now() - 43200000,
    importance: 'medium',
    source: 'manual'
  },
  {
    id: 'mem-sample-task',
    category: 'task_reminder',
    title: 'System Health Diagnostic & Nightly Backup',
    content: 'Verify Desktop Commander port 9742 status and review scheduled git backup directives.',
    tags: ['task', 'health', 'backup'],
    createdAt: Date.now() - 21600000,
    updatedAt: Date.now() - 21600000,
    importance: 'medium',
    source: 'manual',
    isReminder: true,
    scheduledTime: '22:00',
    reminderDate: new Date().toISOString().split('T')[0],
    isCompleted: false,
    notified: false
  }
];

class NeuralMemoryService {
  private memories: MemoryItem[] = [];
  private chatHistory: ChatMessage[] = [];
  private listeners: ((event: NeuralMemoryEvent) => void)[] = [];
  private reminderCheckInterval: any = null;
  private activeDueReminders: MemoryItem[] = [];

  constructor() {
    this.loadMemories();
    this.loadChatHistory();
    this.startReminderWatcher();
  }

  private loadMemories() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MEMORIES);
      if (saved) {
        this.memories = JSON.parse(saved);
      } else {
        this.memories = [...DEFAULT_INITIAL_MEMORIES];
        this.saveMemories();
      }
    } catch (e) {
      console.warn('Failed to load neural memories from localStorage', e);
      this.memories = [...DEFAULT_INITIAL_MEMORIES];
    }
  }

  private saveMemories() {
    try {
      localStorage.setItem(STORAGE_KEY_MEMORIES, JSON.stringify(this.memories));
      window.dispatchEvent(new Event('haider_neural_memory_updated'));
      this.emit({ type: 'MEMORIES_UPDATED', items: [...this.memories] });
    } catch (e) {
      console.error('Failed to save memories to localStorage', e);
    }
  }

  private loadChatHistory() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHAT);
      if (saved) {
        this.chatHistory = JSON.parse(saved);
      } else {
        this.chatHistory = [];
      }
    } catch (e) {
      this.chatHistory = [];
    }
  }

  private saveChatHistory() {
    try {
      // Keep up to 60 most recent messages to maintain high performance
      const trimmed = this.chatHistory.slice(-60);
      localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(trimmed));
      this.emit({ type: 'CHAT_HISTORY_UPDATED', messages: [...this.chatHistory] });
    } catch (e) {
      console.error('Failed to save chat history to localStorage', e);
    }
  }

  public subscribe(fn: (event: NeuralMemoryEvent) => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private emit(event: NeuralMemoryEvent) {
    this.listeners.forEach(fn => {
      try {
        fn(event);
      } catch (err) {
        console.error('NeuralMemory listener error', err);
      }
    });
  }

  /* =========================================================================
     MEMORY CRUD OPERATIONS
     ========================================================================= */

  public getMemories(): MemoryItem[] {
    return [...this.memories];
  }

  public getMemoriesByCategory(category: MemoryCategory): MemoryItem[] {
    return this.memories.filter(m => m.category === category);
  }

  public addMemory(item: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>): MemoryItem {
    const newMemory: MemoryItem = {
      ...item,
      id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.memories.unshift(newMemory);
    this.saveMemories();
    return newMemory;
  }

  public updateMemory(id: string, updates: Partial<Omit<MemoryItem, 'id' | 'createdAt'>>): MemoryItem | null {
    const idx = this.memories.findIndex(m => m.id === id);
    if (idx === -1) return null;

    this.memories[idx] = {
      ...this.memories[idx],
      ...updates,
      updatedAt: Date.now()
    };

    this.saveMemories();
    return this.memories[idx];
  }

  public deleteMemory(id: string): boolean {
    const initLen = this.memories.length;
    this.memories = this.memories.filter(m => m.id !== id);
    if (this.memories.length !== initLen) {
      this.saveMemories();
      return true;
    }
    return false;
  }

  public clearCategory(category: MemoryCategory) {
    this.memories = this.memories.filter(m => m.category !== category);
    this.saveMemories();
  }

  public clearAllMemories() {
    this.memories = [];
    this.saveMemories();
  }

  public resetToDefault() {
    this.memories = [...DEFAULT_INITIAL_MEMORIES];
    this.saveMemories();
  }

  /* =========================================================================
     REMINDERS & SCHEDULED TASKS
     ========================================================================= */

  public getReminders(): MemoryItem[] {
    return this.memories.filter(m => m.isReminder || m.category === 'task_reminder');
  }

  public getActiveDueReminders(): MemoryItem[] {
    return [...this.activeDueReminders];
  }

  public toggleReminderComplete(id: string): boolean {
    const mem = this.memories.find(m => m.id === id);
    if (mem) {
      mem.isCompleted = !mem.isCompleted;
      mem.updatedAt = Date.now();
      if (mem.isCompleted) {
        // Remove from active due alerts
        this.activeDueReminders = this.activeDueReminders.filter(r => r.id !== id);
      }
      this.saveMemories();
      return true;
    }
    return false;
  }

  public dismissDueReminder(id: string) {
    this.activeDueReminders = this.activeDueReminders.filter(r => r.id !== id);
    const mem = this.memories.find(m => m.id === id);
    if (mem) {
      mem.notified = true;
      this.saveMemories();
    }
  }

  private startReminderWatcher() {
    if (this.reminderCheckInterval) clearInterval(this.reminderCheckInterval);

    this.reminderCheckInterval = setInterval(() => {
      this.checkDueReminders();
    }, 15000); // Check every 15 seconds

    // Initial check
    setTimeout(() => this.checkDueReminders(), 2000);
  }

  private checkDueReminders() {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentHours = now.getHours().toString().padStart(2, '0');
    const currentMinutes = now.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;

    this.memories.forEach(mem => {
      if ((mem.isReminder || mem.category === 'task_reminder') && !mem.isCompleted && !mem.notified) {
        let isDue = false;

        // If specific time is set
        if (mem.scheduledTime) {
          const matchDate = !mem.reminderDate || mem.reminderDate === todayStr || mem.reminderDate <= todayStr;
          if (matchDate && mem.scheduledTime <= currentTimeStr) {
            isDue = true;
          }
        }

        if (isDue) {
          mem.notified = true;
          if (!this.activeDueReminders.some(r => r.id === mem.id)) {
            this.activeDueReminders.push(mem);
          }
          this.playChime();
          this.emit({ type: 'REMINDER_TRIGGERED', reminder: mem });
        }
      }
    });
  }

  private playChime() {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      // AudioContext unavailable
    }
  }

  /* =========================================================================
     SMART VOICE & TEXT DIRECTIVE PARSER
     Allows users in Urdu or English to speak directives like:
     "Remember that my meeting is at 5 PM"
     "مجھے یاد کروانا کہ رات 10 بجے بیک اپ لینا ہے"
     "Remember I prefer Python for backend"
     ========================================================================= */

  public parseVoiceMemoryDirective(text: string): Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'> {
    const raw = text.trim();
    const lower = raw.toLowerCase();

    // Detect if this is a reminder/task directive
    const isReminderWord = 
      lower.includes('remind') || 
      lower.includes('reminder') || 
      lower.includes('task') || 
      lower.includes('یاد کروانا') || 
      lower.includes('یاد دلا') ||
      lower.includes('شیڈول') ||
      lower.includes('schedule') ||
      lower.includes('alarm') ||
      lower.includes('at ') ||
      lower.includes('بجے');

    // Attempt to extract time (e.g. 5:00, 5 PM, 17:00, 10 بجے)
    let scheduledTime: string | undefined = undefined;
    const timeMatch = raw.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      const hh = timeMatch[1].padStart(2, '0');
      const mm = timeMatch[2];
      scheduledTime = `${hh}:${mm}`;
    } else {
      const hourMatch = raw.match(/(\d{1,2})\s*(am|pm|بجے)/i);
      if (hourMatch) {
        let hr = parseInt(hourMatch[1], 10);
        const ampm = (hourMatch[2] || '').toLowerCase();
        if (ampm === 'pm' && hr < 12) hr += 12;
        if (ampm === 'am' && hr === 12) hr = 0;
        scheduledTime = `${hr.toString().padStart(2, '0')}:00`;
      }
    }

    // Category inference
    let category: MemoryCategory = 'fact';
    if (isReminderWord || scheduledTime) {
      category = 'task_reminder';
    } else if (lower.includes('prefer') || lower.includes('like') || lower.includes('want') || lower.includes('پسند') || lower.includes('طریقہ')) {
      category = 'preference';
    } else if (lower.includes('project') || lower.includes('code') || lower.includes('repo') || lower.includes('stack') || lower.includes('پروجیکٹ')) {
      category = 'project_context';
    }

    // Clean title & content
    let cleanContent = raw
      .replace(/^(please\s+)?(remember\s+that\s+|remember\s+|remind\s+me\s+to\s+|remind\s+me\s+that\s+|یاد\s*رکھنا\s*کہ\s*|یاد\s*کروانا\s*کہ\s*)/i, '')
      .trim();

    if (!cleanContent) cleanContent = raw;

    let title = cleanContent.length > 40 ? cleanContent.substring(0, 37) + '...' : cleanContent;
    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);

    // Auto tags
    const tags: string[] = [category];
    if (scheduledTime) tags.push('scheduled', 'reminder');
    if (raw.match(/[\u0600-\u06FF]/)) tags.push('urdu');

    return {
      category,
      title,
      content: cleanContent,
      tags,
      importance: isReminderWord ? 'high' : 'medium',
      source: 'voice',
      isReminder: isReminderWord || Boolean(scheduledTime),
      scheduledTime: scheduledTime,
      reminderDate: scheduledTime ? new Date().toISOString().split('T')[0] : undefined,
      isCompleted: false,
      notified: false
    };
  }

  /* =========================================================================
     CHAT HISTORY PERSISTENCE
     ========================================================================= */

  public getChatHistory(): ChatMessage[] {
    return [...this.chatHistory];
  }

  public saveChatMessages(messages: ChatMessage[]) {
    this.chatHistory = [...messages];
    this.saveChatHistory();
  }

  public addChatMessage(msg: ChatMessage) {
    this.chatHistory.push(msg);
    this.saveChatHistory();
  }

  public clearChatHistory() {
    this.chatHistory = [];
    try {
      localStorage.removeItem(STORAGE_KEY_CHAT);
      this.emit({ type: 'CHAT_HISTORY_UPDATED', messages: [] });
    } catch (e) {}
  }

  /* =========================================================================
     PROMPT INJECTION CONTEXT FOR GEMINI
     Supplies continuous memory recall into AI conversational prompts
     ========================================================================= */

  public getMemoryPromptContext(): string {
    if (this.memories.length === 0) return '';

    const facts = this.memories.filter(m => m.category === 'fact').map(m => `• [FACT] ${m.title}: ${m.content}`);
    const prefs = this.memories.filter(m => m.category === 'preference').map(m => `• [PREFERENCE] ${m.title}: ${m.content}`);
    const projects = this.memories.filter(m => m.category === 'project_context').map(m => `• [PROJECT CONTEXT] ${m.title}: ${m.content}`);
    const activeTasks = this.memories.filter(m => (m.isReminder || m.category === 'task_reminder') && !m.isCompleted).map(m => `• [SCHEDULED TASK/REMINDER] ${m.title} (Time: ${m.scheduledTime || 'Unscheduled'}): ${m.content}`);

    const sections: string[] = [];
    if (facts.length > 0) sections.push(`USER KNOWLEDGE BASE:\n${facts.join('\n')}`);
    if (prefs.length > 0) sections.push(`USER PREFERENCES & STYLES:\n${prefs.join('\n')}`);
    if (activeTasks.length > 0) sections.push(`ACTIVE REMINDERS & SCHEDULED TASKS:\n${activeTasks.join('\n')}`);
    if (projects.length > 0) sections.push(`PROJECT CONTEXT:\n${projects.join('\n')}`);

    return `\n\n[NEURAL MEMORY RECALL ENGAGED - RETRIEVED FROM USER LOCAL STORAGE]:\n` +
      sections.join('\n\n') +
      `\n\n[JARVIS BEHAVIORAL DIRECTIVE]: You are JARVIS / Hyder. You possess full persistent memory of the facts and reminders above. Speak naturally and warmly like a genuine human assistant. When responding, seamlessly refer to these memories when appropriate without sounding like a robotic database. Always honor the user's preferences and remind them of pending tasks if relevant.\n`;
  }

  /* =========================================================================
     TELEMETRY & STATS
     ========================================================================= */

  public getStats(): NeuralMemoryStats {
    const factsCount = this.memories.filter(m => m.category === 'fact').length;
    const preferencesCount = this.memories.filter(m => m.category === 'preference').length;
    const reminders = this.memories.filter(m => m.isReminder || m.category === 'task_reminder');
    const remindersCount = reminders.length;
    const activeRemindersCount = reminders.filter(r => !r.isCompleted).length;

    return {
      totalMemories: this.memories.length,
      factsCount,
      preferencesCount,
      remindersCount,
      activeRemindersCount,
      chatMessagesCount: this.chatHistory.length,
      lastUpdated: this.memories.length > 0 ? Math.max(...this.memories.map(m => m.updatedAt)) : Date.now()
    };
  }
}

export const neuralMemory = new NeuralMemoryService();
