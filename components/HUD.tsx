import React, { useState, useEffect, useRef } from 'react';
import NeuralOrb from './NeuralOrb';
import { OSMode, AIMood, Persona } from '../types';
import { 
  MessageSquare, 
  ImageIcon, 
  Code, 
  ArrowUpRight, 
  Cpu, 
  Activity, 
  Database, 
  ShieldCheck, 
  XCircle, 
  Mic, 
  Sparkles, 
  Search, 
  Zap, 
  Terminal, 
  Volume2, 
  Radio, 
  Compass, 
  ChevronRight,
  FolderOpen,
  Laptop,
  BrainCircuit,
  Eye,
  Video,
  Crosshair,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Play,
  Check,
  CheckCircle2,
  ListOrdered,
  AlertTriangle,
  Bookmark,
  BellRing,
  Clock
} from 'lucide-react';
import { desktopCommander } from '../services/desktopCommanderService';
import { neuralMemory } from '../services/neuralMemoryService';
import { LocalTaskItem, TaskPriority, DEFAULT_LOCAL_TASKS } from './DesktopCommanderPanel';

interface HUDProps {
  onNavigate: (mode: OSMode) => void;
  mood?: AIMood;
  onStopAlarm?: () => void;
  onVoiceActivate?: () => void;
  onCommand?: (cmd: string) => void;
  persona?: Persona;
}

const HUD: React.FC<HUDProps> = ({ 
  onNavigate, 
  mood = 'idle', 
  onStopAlarm, 
  onVoiceActivate, 
  onCommand, 
  persona 
}) => {
  const [orbSize, setOrbSize] = useState<number>(320);
  const [quickInput, setQuickInput] = useState('');
  const [activeMood, setActiveMood] = useState<AIMood>(mood);
  const [latency, setLatency] = useState(14);
  const [cpuWave, setCpuWave] = useState<number[]>([35, 42, 38, 55, 48, 62, 58, 45, 52, 60]);

  // Neural Priority widget state
  const [priorityTasks, setPriorityTasks] = useState<LocalTaskItem[]>(() => {
    try {
      const saved = localStorage.getItem('haider_local_tasks_priority_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_LOCAL_TASKS;
  });
  const [priorityFilter, setPriorityFilter] = useState<'All' | TaskPriority>('All');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [executingTaskId, setExecutingTaskId] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<{ id: string; success: boolean; msg: string } | null>(null);
  const [isCommanderOnline, setIsCommanderOnline] = useState(desktopCommander.isOnline());
  const [dueReminders, setDueReminders] = useState(() => neuralMemory.getActiveDueReminders());
  const [memoriesCount, setMemoriesCount] = useState(() => neuralMemory.getMemories().length);

  useEffect(() => {
    const unsubMemory = neuralMemory.subscribe((evt) => {
      if (evt.type === 'REMINDER_TRIGGERED') {
        setDueReminders(neuralMemory.getActiveDueReminders());
      } else if (evt.type === 'MEMORIES_UPDATED') {
        setMemoriesCount(evt.items.length);
        setDueReminders(neuralMemory.getActiveDueReminders());
      }
    });

    return () => unsubMemory();
  }, []);

  useEffect(() => {
    const unsub = desktopCommander.subscribe((evt) => {
      if (evt.type === 'STATUS_CHANGE') {
        setIsCommanderOnline(desktopCommander.isOnline());
      }
    });

    const handleSyncTasks = () => {
      try {
        const saved = localStorage.getItem('haider_local_tasks_priority_v1');
        if (saved) setPriorityTasks(JSON.parse(saved));
      } catch (e) {}
    };

    window.addEventListener('haider_tasks_updated', handleSyncTasks);
    window.addEventListener('storage', handleSyncTasks);

    return () => {
      unsub();
      window.removeEventListener('haider_tasks_updated', handleSyncTasks);
      window.removeEventListener('storage', handleSyncTasks);
    };
  }, []);

  const saveTasks = (tasks: LocalTaskItem[]) => {
    setPriorityTasks(tasks);
    try {
      localStorage.setItem('haider_local_tasks_priority_v1', JSON.stringify(tasks));
      window.dispatchEvent(new Event('haider_tasks_updated'));
    } catch (e) {}
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${index}`);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const updated = [...priorityTasks];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);
    saveTasks(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const moveTask = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= priorityTasks.length) return;
    const updated = [...priorityTasks];
    const temp = updated[fromIndex];
    updated[fromIndex] = updated[toIndex];
    updated[toIndex] = temp;
    saveTasks(updated);
  };

  const handleExecutePriorityTask = async (task: LocalTaskItem) => {
    if (!desktopCommander.isOnline()) {
      onNavigate(OSMode.DESKTOP_COMMANDER);
      return;
    }

    setExecutingTaskId(task.id);
    setExecutionResult(null);

    try {
      const res = await desktopCommander.executeCommand(task.cmd);
      setExecutionResult({
        id: task.id,
        success: res.exitCode === 0,
        msg: res.exitCode === 0 ? 'Executed successfully' : (res.stderr || 'Execution failed')
      });
      setTimeout(() => setExecutionResult(null), 4000);
    } catch (err: any) {
      setExecutionResult({
        id: task.id,
        success: false,
        msg: err.message || 'Execution error'
      });
      setTimeout(() => setExecutionResult(null), 4000);
    } finally {
      setExecutingTaskId(null);
    }
  };

  useEffect(() => {
    setActiveMood(mood);
  }, [mood]);

  // Periodic subtle latency and wave fluctuation for alive feeling
  useEffect(() => {
    const timer = setInterval(() => {
      setLatency(prev => Math.max(10, Math.min(24, Math.round(prev + (Math.random() * 4 - 2)))));
      setCpuWave(prev => [...prev.slice(1), Math.floor(30 + Math.random() * 45)]);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const calculateOrbSize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w < 640) return Math.min(220, w * 0.52);
      if (w < 1024) return Math.min(270, w * 0.32);
      if (h < 800) return Math.min(300, h * 0.35);
      return Math.min(390, Math.min(w * 0.24, h * 0.38));
    };

    setOrbSize(calculateOrbSize());
    const handleResize = () => setOrbSize(calculateOrbSize());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const speakGreeting = (text: string) => {
    setActiveMood('talking');
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 1.0;
      utterance.rate = 1.05;
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.includes('GB') && v.name.includes('Google')) ||
                    voices.find(v => v.lang.includes('GB')) ||
                    voices.find(v => v.lang.includes('US')) ||
                    voices[0];
      if (voice) utterance.voice = voice;
      utterance.onend = () => setActiveMood('happy');
      window.speechSynthesis.speak(utterance);
    }
    setTimeout(() => {
      setActiveMood('idle');
    }, 2800);
  };

  const handleOrbClick = () => {
    const greetings = [
      "Neural link optimal. What directive do you wish to execute, Architect?",
      "Hyder core is fully operational. All cognitive channels standing by.",
      "Voice command subsystem active. Ready for your command.",
      "Quantum matrix synchronized at sub-millisecond precision."
    ];
    const picked = greetings[Math.floor(Math.random() * greetings.length)];
    speakGreeting(picked);
  };

  const handleQuickSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickInput.trim()) return;
    onCommand?.(quickInput);
    setQuickInput('');
  };

  const actions = [
    { 
      mode: OSMode.TERMINAL, 
      label: 'COGNITIVE CHAT', 
      tag: '⌘1',
      icon: MessageSquare, 
      desc: 'Engage synaptic reasoning engine', 
      meta: 'Gemini 3.1 Flash-Lite Active',
      color: '#00E5FF',
      gradient: 'from-[#00E5FF]/20 via-[#00E5FF]/5 to-transparent',
      border: 'hover:border-[#00E5FF]/40'
    },
    { 
      mode: OSMode.IMAGE_FORGE, 
      label: 'IMAGE STUDIO', 
      tag: '⌘2',
      icon: ImageIcon, 
      desc: 'Visual neural synthesis & art curation', 
      meta: '1K-4K • Multi-Ratio Vectors',
      color: '#A855F7',
      gradient: 'from-[#A855F7]/20 via-[#A855F7]/5 to-transparent',
      border: 'hover:border-[#A855F7]/40'
    },
    { 
      mode: OSMode.CODE_MIRROR, 
      label: 'CODE FORGE', 
      tag: '⌘3',
      icon: Code, 
      desc: 'Synaptic developer environment', 
      meta: 'HTML/JS Live Neural Preview',
      color: '#22D3EE',
      gradient: 'from-[#22D3EE]/20 via-[#22D3EE]/5 to-transparent',
      border: 'hover:border-[#22D3EE]/40'
    },
    { 
      mode: OSMode.ANALYTICS, 
      label: 'ANALYTICS HUB', 
      tag: '⌘4',
      icon: Activity, 
      desc: 'Realtime telemetry and performance', 
      meta: '4 Metrics • 94.2% Efficiency',
      color: '#FFAB40',
      gradient: 'from-[#FFAB40]/20 via-[#FFAB40]/5 to-transparent',
      border: 'hover:border-[#FFAB40]/40'
    }
  ];

  const quickPrompts = [
    { label: 'Neural Memory', cmd: 'open neural memory', icon: Bookmark },
    { label: 'Scheduled Reminders', cmd: 'open scheduled reminders', icon: Clock },
    { label: 'Screen Intelligence', cmd: 'open screen intelligence', icon: Eye },
    { label: 'Desktop Commander', cmd: 'open desktop commander', icon: Laptop },
    { label: 'Skill Intelligence', cmd: 'open skill intelligence', icon: BrainCircuit },
    { label: 'Inspect Open Ports', cmd: 'what is using port 5173', icon: Zap },
    { label: 'Locate Misplaced Files', cmd: 'find misplaced access keys', icon: FolderOpen },
  ];

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-3 sm:p-5 lg:p-7 relative overflow-y-auto custom-scrollbar select-none">
      <div className="flex flex-col items-center justify-center w-full max-w-7xl animate-slide-in my-auto py-1 space-y-4 sm:space-y-6 lg:space-y-7">
        
        {/* Top Holographic Sub-Header Ribbon */}
        <div className="flex items-center justify-between w-full px-2 sm:px-4 text-[clamp(8px,0.58vw,10px)] font-mono text-white/40 tracking-widest uppercase">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-ping"></span>
            <span className="text-[#00E5FF] font-bold">CORE_STATUS: SYNCHRONIZED</span>
            <span className="hidden md:inline text-white/20">|</span>
            <span className="hidden md:inline text-white/50">COHERENCE: 99.82%</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">
              <Compass size={11} className="text-[#00E5FF]" />
              <span className="text-[clamp(7px,0.52vw,9px)] font-orbitron">{persona ? persona.name : 'JARVIS'} MATRIX</span>
            </div>
            <div className="flex items-center gap-1 text-[#2ED8C3]">
              <Radio size={11} className="animate-pulse" />
              <span>{latency}MS UPLINK</span>
            </div>
          </div>
        </div>

        {/* Central Power Feature: The Orb (AI Face & Interactive Target Core) */}
        <div className="relative group flex flex-col items-center">
          {/* Futuristic Radar & Holographic Rings */}
          <div className="absolute inset-0 rounded-full border border-[#00E5FF]/10 scale-[1.2] sm:scale-[1.3] animate-pulse pointer-events-none"></div>
          <div className="absolute inset-0 rounded-full border border-dashed border-[#00E5FF]/10 scale-[1.45] sm:scale-[1.6] animate-[spin_40s_linear_infinite] pointer-events-none"></div>
          <div className="absolute inset-0 rounded-full border border-white/5 scale-[1.7] sm:scale-[1.9] pointer-events-none hidden sm:block"></div>

          {/* Compass Coordinate Markers */}
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[clamp(6px,0.45vw,8px)] font-mono text-white/20 tracking-widest uppercase pointer-events-none">
            NORTH // 000°
          </div>
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[clamp(6px,0.45vw,8px)] font-mono text-white/20 tracking-widest uppercase pointer-events-none">
            SOUTH // 180°
          </div>

          {/* Interactive AI Face Canvas */}
          <div 
            onClick={handleOrbClick}
            className="relative z-10 flex items-center justify-center cursor-pointer transition-transform duration-500 hover:scale-105 active:scale-95 group/orb"
            title="Click to interact with Haider Core"
          >
            <NeuralOrb 
              size={orbSize} 
              mood={activeMood}
              audioLevel={activeMood === 'talking' ? 65 : 0}
            />

            {/* Click to speak hint tooltip */}
            <div className="absolute -top-2 opacity-0 group-hover/orb:opacity-100 transition-opacity bg-black/80 border border-[#00E5FF]/40 rounded-full px-3 py-1 text-[clamp(7px,0.5vw,9px)] font-mono text-[#00E5FF] uppercase tracking-widest pointer-events-none shadow-lg whitespace-nowrap">
              ✦ Click to Probe Neural Core
            </div>
          </div>

          {/* Central Interactive Voice Trigger Button */}
          <div className="mt-3 sm:mt-4 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              {onVoiceActivate && (
                <button
                  onClick={onVoiceActivate}
                  className="group/vbtn relative px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-[#00E5FF]/20 to-[#2ED8C3]/20 border border-[#00E5FF]/40 hover:border-[#00E5FF] hover:bg-[#00E5FF] hover:text-[#0A1A2F] text-white transition-all shadow-[0_0_25px_rgba(0,229,255,0.25)] flex items-center gap-2.5 active:scale-95"
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#00E5FF] text-[#0A1A2F] flex items-center justify-center group-hover/vbtn:bg-[#0A1A2F] group-hover/vbtn:text-[#00E5FF] transition-colors shrink-0">
                    <Mic size={13} className="animate-pulse" />
                  </div>
                  <span className="font-orbitron font-black text-[clamp(8px,0.6vw,11px)] tracking-[0.2em] sm:tracking-[0.25em] uppercase">
                    VOICE COMMAND CENTER
                  </span>
                  <div className="flex items-center gap-0.5 ml-1">
                    <span className="w-0.5 h-3 bg-[#00E5FF] rounded-full animate-bounce group-hover/vbtn:bg-[#0A1A2F]"></span>
                    <span className="w-0.5 h-4 bg-[#00E5FF] rounded-full animate-bounce [animation-delay:-0.15s] group-hover/vbtn:bg-[#0A1A2F]"></span>
                    <span className="w-0.5 h-2 bg-[#00E5FF] rounded-full animate-bounce [animation-delay:-0.3s] group-hover/vbtn:bg-[#0A1A2F]"></span>
                  </div>
                </button>
              )}

              {activeMood === 'surprise' && onStopAlarm && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onStopAlarm(); }}
                  className="px-3 sm:px-5 py-2 rounded-full bg-red-500 text-white font-orbitron text-[clamp(7px,0.55vw,9px)] font-black tracking-widest flex items-center gap-1.5 hover:bg-red-400 pointer-events-auto shadow-lg animate-bounce"
                >
                  <XCircle size={13} /> STOP ALARM
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-[#00E5FF]/70 font-mono text-[clamp(7px,0.5vw,9px)] tracking-widest uppercase">
              <Sparkles size={10} className="animate-spin text-[#00E5FF]" />
              <span>Directives active • Speak or choose below</span>
            </div>
          </div>
        </div>

        {/* Tactical Quick Directives Bar */}
        <div className="w-full max-w-4xl flex flex-col gap-2">
          {/* Quick command search launcher */}
          <form 
            onSubmit={handleQuickSubmit}
            className="w-full relative flex items-center bg-white/[0.03] border border-white/10 hover:border-[#00E5FF]/30 focus-within:border-[#00E5FF]/60 rounded-full px-3.5 sm:px-5 py-1.5 sm:py-2 backdrop-blur-xl shadow-xl transition-all"
          >
            <Search size={15} className="text-[#00E5FF]/50 shrink-0 mr-2.5" />
            <input 
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Transmit neural command (e.g. 'find keys', 'open youtube', 'organize files')..."
              className="bg-transparent border-none outline-none text-[clamp(11px,0.8vw,13px)] text-white w-full placeholder:text-white/20 font-medium"
            />
            {quickInput ? (
              <button 
                type="submit"
                className="ml-2 px-3 py-1 rounded-full bg-[#00E5FF] text-[#0A1A2F] font-orbitron font-black text-[clamp(8px,0.55vw,10px)] tracking-widest uppercase hover:bg-white transition-all shrink-0"
              >
                EXECUTE
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1 text-[clamp(7px,0.5vw,9px)] font-mono text-white/30 tracking-widest uppercase">
                <span>PRESS</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60">ENTER</kbd>
              </div>
            )}
          </form>

          {/* Quick prompt suggestions chips */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                onClick={() => onCommand?.(qp.cmd)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.02] border border-white/5 hover:border-[#00E5FF]/30 hover:bg-white/[0.06] text-white/60 hover:text-[#00E5FF] transition-all text-[clamp(8px,0.55vw,10px)] font-orbitron uppercase tracking-wider group"
              >
                <qp.icon size={11} className="text-[#00E5FF]/60 group-hover:text-[#00E5FF] transition-colors" />
                <span>{qp.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ACTIVE DUE REMINDER ALERT (IF TRIGGERED) */}
        {dueReminders.length > 0 && (
          <div className="w-full p-3.5 sm:p-4 rounded-[22px] bg-amber-500/15 border border-amber-500/50 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_0_30px_rgba(245,158,11,0.25)] animate-slide-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-black flex items-center justify-center font-bold shrink-0 animate-bounce">
                <BellRing size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-orbitron font-black text-amber-300 text-[clamp(11px,0.8vw,13px)] uppercase">
                    SCHEDULED TASK REMINDER DUE
                  </span>
                  <span className="text-[7.5px] font-mono text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded">
                    JARVIS Alert
                  </span>
                </div>
                <p className="text-[clamp(10px,0.72vw,12px)] text-white font-medium">
                  {dueReminders[0]?.title}: {dueReminders[0]?.content}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  neuralMemory.toggleReminderComplete(dueReminders[0].id);
                  setDueReminders(neuralMemory.getActiveDueReminders());
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-orbitron font-black text-[clamp(8px,0.55vw,9.5px)] uppercase tracking-wider transition-all flex items-center gap-1 shadow-md"
              >
                <Check size={12} /> MARK DONE
              </button>
              <button
                onClick={() => onNavigate(OSMode.NEURAL_MEMORY)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-orbitron font-bold text-[clamp(8px,0.55vw,9.5px)] uppercase tracking-wider transition-all"
              >
                VIEW MEMORY
              </button>
            </div>
          </div>
        )}

        {/* HERO PORTAL CARDS (SCREEN INTELLIGENCE & NEURAL MEMORY) */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          
          {/* SCREEN INTELLIGENCE HERO PORTAL CARD */}
          <div className="w-full p-4 sm:p-5 rounded-[22px] sm:rounded-[30px] bg-gradient-to-r from-[#00E5FF]/10 via-[#2ED8C3]/5 to-purple-500/10 border border-[#00E5FF]/30 backdrop-blur-xl flex flex-col justify-between gap-4 shadow-[0_0_35px_rgba(0,229,255,0.12)]">
            <div className="flex items-start gap-3.5">
              <div 
                onClick={() => onNavigate(OSMode.SCREEN_INTELLIGENCE)}
                className="w-11 h-11 rounded-2xl bg-[#00E5FF]/20 border border-[#00E5FF]/40 flex items-center justify-center text-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.3)] shrink-0 cursor-pointer hover:scale-105 transition-all"
              >
                <Eye size={22} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[clamp(7.5px,0.5vw,9px)] font-mono font-bold uppercase tracking-widest text-[#00E5FF] bg-[#00E5FF]/10 px-2 py-0.5 rounded-full border border-[#00E5FF]/20">
                    Multimodal Vision
                  </span>
                  <span className="text-[clamp(7.5px,0.5vw,9px)] font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Full HD Stream
                  </span>
                </div>
                <h3 
                  onClick={() => onNavigate(OSMode.SCREEN_INTELLIGENCE)}
                  className="text-[clamp(14px,1vw,17px)] font-orbitron font-black text-white hover:text-[#00E5FF] cursor-pointer transition-colors mt-0.5"
                >
                  SCREEN INTELLIGENCE
                </h3>
                <p className="text-[clamp(10px,0.7vw,11.5px)] text-white/60 font-mono line-clamp-1">
                  Display streaming, camera perception, interactive SVG overlays & guidance.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-start">
              <button
                onClick={() => onNavigate(OSMode.SCREEN_INTELLIGENCE)}
                className="px-3.5 py-1.5 rounded-xl bg-[#00E5FF] text-[#0A1A2F] font-orbitron font-bold text-[clamp(8px,0.55vw,9.5px)] tracking-wider uppercase hover:bg-white transition-all shadow-[0_0_15px_rgba(0,229,255,0.4)] flex items-center gap-1.5"
              >
                <Eye size={12} /> OPEN INTEL
              </button>
              <button
                onClick={() => onNavigate(OSMode.SCREEN_INTELLIGENCE)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-orbitron font-bold text-[clamp(8px,0.55vw,9.5px)] tracking-wider uppercase transition-all flex items-center gap-1.5"
              >
                <Video size={12} /> SHARE SCREEN
              </button>
            </div>
          </div>

          {/* NEURAL MEMORY HERO PORTAL CARD */}
          <div className="w-full p-4 sm:p-5 rounded-[22px] sm:rounded-[30px] bg-gradient-to-r from-purple-500/10 via-[#00E5FF]/5 to-[#2ED8C3]/10 border border-purple-500/30 backdrop-blur-xl flex flex-col justify-between gap-4 shadow-[0_0_35px_rgba(168,85,247,0.12)]">
            <div className="flex items-start gap-3.5">
              <div 
                onClick={() => onNavigate(OSMode.NEURAL_MEMORY)}
                className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.3)] shrink-0 cursor-pointer hover:scale-105 transition-all"
              >
                <Bookmark size={22} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[clamp(7.5px,0.5vw,9px)] font-mono font-bold uppercase tracking-widest text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                    Synaptic Recall Bank
                  </span>
                  <span className="text-[clamp(7.5px,0.5vw,9px)] font-mono text-[#00E5FF]">
                    {memoriesCount} Memories Stored
                  </span>
                </div>
                <h3 
                  onClick={() => onNavigate(OSMode.NEURAL_MEMORY)}
                  className="text-[clamp(14px,1vw,17px)] font-orbitron font-black text-white hover:text-purple-300 cursor-pointer transition-colors mt-0.5"
                >
                  NEURAL MEMORY & CONTEXT
                </h3>
                <p className="text-[clamp(10px,0.7vw,11.5px)] text-white/60 font-mono line-clamp-1">
                  Persistent facts, preferences, task reminders across sessions in LocalStorage.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-start">
              <button
                onClick={() => onNavigate(OSMode.NEURAL_MEMORY)}
                className="px-3.5 py-1.5 rounded-xl bg-purple-500 hover:bg-white text-black font-orbitron font-black text-[clamp(8px,0.55vw,9.5px)] tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center gap-1.5"
              >
                <Bookmark size={12} /> OPEN MEMORY
              </button>
              <button
                onClick={() => onNavigate(OSMode.NEURAL_MEMORY)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-orbitron font-bold text-[clamp(8px,0.55vw,9.5px)] tracking-wider uppercase transition-all flex items-center gap-1.5"
              >
                <Clock size={12} /> REMINDERS
              </button>
            </div>
          </div>

        </div>

        {/* 4 Primary Navigation Cards (Tactical HUD) */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={() => onNavigate(action.mode)}
              className={`group relative p-4 sm:p-5 lg:p-6 rounded-[22px] sm:rounded-[30px] bg-white/[0.02] border border-white/10 ${action.border} transition-all duration-300 flex flex-col justify-between text-left overflow-hidden shadow-2xl hover:scale-[1.02] active:scale-[0.98]`}
            >
              {/* Subtle Ambient Hover Glow */}
              <div 
                className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
              ></div>

              {/* Card Corner Tech Accent */}
              <div 
                className="absolute top-0 right-0 w-8 h-8 opacity-20 group-hover:opacity-100 transition-opacity"
                style={{
                  background: `radial-gradient(circle at top right, ${action.color} 0%, transparent 70%)`
                }}
              ></div>

              <div className="relative z-10 w-full">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div 
                    className="p-3 rounded-2xl bg-[#0A1A2F]/80 text-white group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(0,0,0,0.4)] shrink-0 border border-white/5" 
                    style={{ color: action.color }}
                  >
                    <action.icon size={22} className="sm:w-[24px] sm:h-[24px]" />
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <span className="text-[clamp(7px,0.5vw,9px)] font-mono text-white/30 px-2 py-0.5 rounded-md bg-white/5 border border-white/5 group-hover:border-white/20 transition-colors">
                      {action.tag}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-white/30 group-hover:text-[#00E5FF] group-hover:bg-[#00E5FF]/10 transition-all">
                      <ArrowUpRight size={15} />
                    </div>
                  </div>
                </div>

                <h3 className="font-orbitron font-black text-[clamp(11px,0.75vw,13px)] tracking-[0.12em] text-white mb-1 uppercase group-hover:text-[#00E5FF] transition-colors">
                  {action.label}
                </h3>
                <p className="text-[clamp(9px,0.65vw,11px)] text-white/50 font-medium leading-relaxed mb-3 line-clamp-2">
                  {action.desc}
                </p>
              </div>

              <div className="relative z-10 w-full pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-[clamp(7px,0.5vw,9px)] font-mono text-white/40 uppercase tracking-widest truncate">
                  {action.meta}
                </span>
                <ChevronRight size={12} className="text-[#00E5FF] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            </button>
          ))}
        </div>

        {/* NEURAL PRIORITY WIDGET - DRAG & DROP REORDERABLE HIGH/MEDIUM/LOW DIRECTIVES */}
        <div className="w-full p-4 sm:p-5 lg:p-6 rounded-[22px] sm:rounded-[30px] bg-white/[0.02] border border-white/10 backdrop-blur-xl flex flex-col space-y-3.5 shadow-2xl">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#00E5FF]/20 to-[#2ED8C3]/10 text-[#00E5FF] border border-[#00E5FF]/30">
                <ListOrdered size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-orbitron font-black text-[clamp(11px,0.8vw,14px)] text-white uppercase tracking-widest">
                    NEURAL PRIORITY DIRECTIVES
                  </h3>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20">
                    DRAG & DROP TO REORDER
                  </span>
                </div>
                <p className="text-[clamp(8px,0.55vw,10px)] font-mono text-white/40">
                  {priorityTasks.filter(t => t.priority === 'High').length} High-Priority • {priorityTasks.length} Total Local Directives
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter Chips */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                {(['All', 'High', 'Medium', 'Low'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setPriorityFilter(filter)}
                    className={`px-2.5 py-0.5 rounded-lg text-[clamp(7.5px,0.5vw,9px)] font-mono uppercase font-bold transition-all ${
                      priorityFilter === filter
                        ? filter === 'High'
                          ? 'bg-rose-500 text-white shadow-md'
                          : filter === 'Medium'
                          ? 'bg-yellow-500 text-black shadow-md'
                          : filter === 'Low'
                          ? 'bg-[#00E5FF] text-[#0A1A2F] shadow-md'
                          : 'bg-white/20 text-white'
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Navigate to Commander Button */}
              <button
                onClick={() => onNavigate(OSMode.DESKTOP_COMMANDER)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#00E5FF]/20 border border-white/10 hover:border-[#00E5FF]/40 text-white hover:text-[#00E5FF] font-orbitron font-bold text-[clamp(8px,0.55vw,9.5px)] tracking-wider uppercase transition-all"
                title="Open Full Desktop Commander Panel"
              >
                <span>COMMANDER DECK</span>
                <ChevronRight size={12} />
              </button>
            </div>
          </div>

          {/* Execution feedback toast if active */}
          {executionResult && (
            <div className={`p-2.5 rounded-xl text-[clamp(9px,0.65vw,11px)] font-mono flex items-center gap-2 animate-slide-in ${
              executionResult.success 
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
            }`}>
              {executionResult.success ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
              <span className="font-bold">{executionResult.success ? 'Directive Completed:' : 'Execution Notice:'}</span>
              <span className="truncate">{executionResult.msg}</span>
            </div>
          )}

          {/* Drag & Drop Reorderable Task List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
            {priorityTasks
              .map((task, originalIndex) => ({ task, originalIndex }))
              .filter(({ task }) => priorityFilter === 'All' || task.priority === priorityFilter)
              .map(({ task, originalIndex }) => {
                const isDragging = draggedIndex === originalIndex;
                const isOver = dragOverIndex === originalIndex;
                const isRunning = executingTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, originalIndex)}
                    onDragOver={(e) => handleDragOver(e, originalIndex)}
                    onDrop={(e) => handleDrop(e, originalIndex)}
                    onDragEnd={handleDragEnd}
                    className={`relative p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 cursor-grab active:cursor-grabbing select-none group ${
                      isDragging 
                        ? 'opacity-40 scale-95 border-dashed border-[#00E5FF]' 
                        : isOver 
                        ? 'border-[#00E5FF] bg-[#00E5FF]/10 scale-[1.01]' 
                        : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5 hover:border-white/20'
                    }`}
                  >
                    {/* Left: Drag Handle & Tactical Arrows */}
                    <div className="flex items-center gap-1 shrink-0 text-white/30 group-hover:text-white/60">
                      <div className="cursor-grab hover:text-[#00E5FF]">
                        <GripVertical size={14} />
                      </div>
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => moveTask(originalIndex, 'up')}
                          disabled={originalIndex === 0}
                          title="Move up in queue"
                          className="hover:text-[#00E5FF] disabled:opacity-20 p-0.5"
                        >
                          <ArrowUp size={10} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveTask(originalIndex, 'down')}
                          disabled={originalIndex === priorityTasks.length - 1}
                          title="Move down in queue"
                          className="hover:text-[#00E5FF] disabled:opacity-20 p-0.5"
                        >
                          <ArrowDown size={10} />
                        </button>
                      </div>
                    </div>

                    {/* Middle: Priority Tag & Label */}
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[7px] font-mono font-bold uppercase tracking-wider border ${
                            task.priority === 'High'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                              : task.priority === 'Medium'
                              ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                              : 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/50'
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span className="text-[clamp(9.5px,0.7vw,11.5px)] font-orbitron font-bold text-white truncate">
                          {task.label}
                        </span>
                      </div>
                      <div className="text-[clamp(7.5px,0.52vw,9.5px)] font-mono text-white/40 truncate group-hover:text-white/70">
                        PS C:\&gt; {task.cmd}
                      </div>
                    </div>

                    {/* Right: Quick Run Button */}
                    <div className="shrink-0 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleExecutePriorityTask(task)}
                        disabled={isRunning}
                        title={isCommanderOnline ? `Execute "${task.label}"` : 'Open Desktop Commander to configure local bridge'}
                        className={`px-2.5 py-1 rounded-xl text-[clamp(7.5px,0.5vw,9px)] font-orbitron font-bold tracking-wider uppercase transition-all flex items-center gap-1 border ${
                          isRunning
                            ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40 animate-pulse'
                            : isCommanderOnline
                            ? 'bg-white/5 hover:bg-[#00E5FF] text-white hover:text-[#0A1A2F] border-white/10 hover:border-transparent'
                            : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border-white/10'
                        }`}
                      >
                        <Play size={9} />
                        <span>{isRunning ? 'RUNNING' : 'RUN'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Telemetry Bar (Interactive System Cockpit) */}
        <div className="w-full flex flex-col md:flex-row justify-between items-center px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-[22px] sm:rounded-[30px] bg-white/[0.015] border border-white/5 shadow-inner gap-3 sm:gap-5">
           <div className="flex flex-wrap items-center gap-4 sm:gap-8 lg:gap-12 w-full md:w-auto">
              
              {/* Compute Power Gauge */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-[#00E5FF] shadow-lg shrink-0">
                  <Cpu size={18} className="sm:w-[20px] sm:h-[20px]" />
                </div>
                <div className="flex flex-col">
                   <div className="flex items-center gap-2">
                     <span className="text-[clamp(7px,0.5vw,9px)] font-orbitron font-black text-white/30 tracking-[0.18em] uppercase">Compute Array</span>
                     {/* Mini visual sparkline */}
                     <div className="flex items-end gap-0.5 h-3">
                       {cpuWave.map((h, idx) => (
                         <div 
                           key={idx} 
                           className="w-0.5 bg-[#00E5FF]/60 rounded-full transition-all duration-700" 
                           style={{ height: `${h}%` }}
                         ></div>
                       ))}
                     </div>
                   </div>
                   <span className="text-[clamp(14px,1.2vw,20px)] font-black text-white">4.88 EFLOPS</span>
                </div>
              </div>

              {/* Neural Memory Gauge */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-[#2ED8C3] shadow-lg shrink-0">
                  <Database size={18} className="sm:w-[20px] sm:h-[20px]" />
                </div>
                <div className="flex flex-col">
                   <span className="text-[clamp(7px,0.5vw,9px)] font-orbitron font-black text-white/30 tracking-[0.18em] uppercase">Neural Pool</span>
                   <div className="flex items-center gap-2">
                     <span className="text-[clamp(14px,1.2vw,20px)] font-black text-white">1.2 PB FRE</span>
                     <span className="text-[clamp(7px,0.5vw,9px)] font-mono text-[#2ED8C3] bg-[#2ED8C3]/10 px-1.5 py-0.5 rounded border border-[#2ED8C3]/20">STABLE</span>
                   </div>
                </div>
              </div>

              {/* Uplink Latency */}
              <div className="hidden lg:flex items-center gap-3">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-[#FFAB40] shadow-lg shrink-0">
                  <Radio size={18} className="sm:w-[20px] sm:h-[20px] animate-pulse" />
                </div>
                <div className="flex flex-col">
                   <span className="text-[clamp(7px,0.5vw,9px)] font-orbitron font-black text-white/30 tracking-[0.18em] uppercase">Synaptic Ping</span>
                   <span className="text-[clamp(14px,1.2vw,20px)] font-black text-white">{latency} ms</span>
                </div>
              </div>
           </div>

           {/* Security / Action Badge */}
           <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-end">
             {onVoiceActivate && (
               <button
                 onClick={onVoiceActivate}
                 className="flex items-center gap-1.5 text-[clamp(8px,0.55vw,10px)] font-orbitron font-black text-[#00E5FF] hover:text-black tracking-[0.2em] px-3.5 sm:px-4 py-1.5 rounded-xl bg-[#00E5FF]/10 hover:bg-[#00E5FF] border border-[#00E5FF]/30 transition-all uppercase whitespace-nowrap"
               >
                 <Mic size={12} /> Live Uplink
               </button>
             )}
             <div className="flex items-center gap-1.5 sm:gap-2 text-[clamp(8px,0.55vw,10px)] font-orbitron font-black text-white/40 tracking-[0.2em] px-3.5 sm:px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 uppercase shrink-0 whitespace-nowrap">
               <ShieldCheck size={13} className="text-[#2ED8C3]"/> Encrypted_L7
             </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default HUD;
