
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Terminal, 
  Image as ImageIcon, 
  Code, 
  BarChart2, 
  Settings, 
  Mic, 
  LayoutGrid,
  Clock,
  BrainCircuit,
  Search,
  Bell,
  Eye,
  EyeOff,
  Activity,
  Zap,
  User,
  Power,
  ChevronRight,
  X,
  BellRing,
  Moon,
  Trash2,
  FolderOpen,
  Laptop,
  Bookmark
} from 'lucide-react';
import { OSMode, PERSONAS, Persona, UserProfile, AIMood } from './types';
import HUD from './components/HUD';
import NeuralTerminal from './components/NeuralTerminal';
import { NeuralMemoryPanel } from './components/NeuralMemoryPanel';
import ImageForge from './components/ImageForge';
import CodeMirror from './components/CodeMirror';
import AnalyticsHub from './components/AnalyticsHub';
import LiveVoice from './components/LiveVoice';
import VirtualPC from './components/VirtualPC';
import { DesktopCommanderPanel } from './components/DesktopCommanderPanel';
import { SkillIntelligenceDashboard } from './components/SkillIntelligenceDashboard';
import { ScreenIntelligencePanel } from './components/ScreenIntelligencePanel';
import { desktopCommander } from './services/desktopCommanderService';
import { orchestrator } from './services/agentOrchestrator';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<OSMode>(OSMode.HUD);
  const [persona, setPersona] = useState<Persona>(PERSONAS.JARVIS);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [eyeCare, setEyeCare] = useState(false);
  const [time, setTime] = useState(new Date());
  
  const [isSleepMode, setIsSleepMode] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<string[]>(["Neural link stable.", "Welcome to Hyder OS v2.0"]);
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('hyder_user_profile');
    return saved ? JSON.parse(saved) : {
      name: "Hyder Architect",
      bio: "Neural Engineer & UI/UX Expert",
      customInstructions: "Be warm, talkative, and extremely helpful. Never answer with just yes/no."
    };
  });
  
  const [mood, setMood] = useState<AIMood>('idle');
  const alarmIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem('hyder_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    document.body.classList.toggle('eye-care', eyeCare);
  }, [eyeCare]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stopAlarm = useCallback(() => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
      setMood('idle');
      setNotifications(prev => ["Alarm stopped.", ...prev]);
    }
  }, []);

  const [isCommanderOnline, setIsCommanderOnline] = useState(desktopCommander.isOnline());

  useEffect(() => {
    return desktopCommander.subscribe((evt) => {
      if (evt.type === 'STATUS_CHANGE') {
        setIsCommanderOnline(desktopCommander.isOnline());
      }
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global hotkey: Ctrl+Space or Alt+Space toggles Screen Intelligence
      if ((e.ctrlKey || e.altKey) && e.code === 'Space') {
        e.preventDefault();
        setActiveMode(prev => prev === OSMode.SCREEN_INTELLIGENCE ? OSMode.HUD : OSMode.SCREEN_INTELLIGENCE);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCommand = useCallback(async (cmd: string) => {
    const c = cmd.toLowerCase().trim();
    
    // Check if directly navigating to screen intelligence
    if (
      c.includes("screen intelligence") || c.includes("open screen") || c.includes("share screen") || 
      c.includes("look at my screen") || c.includes("guide me") || c.includes("camera") || 
      c.includes("visual guidance") || c.includes("troubleshoot screen") || c.includes("where do i click")
    ) {
      setActiveMode(OSMode.SCREEN_INTELLIGENCE);
      setMood('thinking');
      setNotifications(prev => ["Screen Intelligence & Visual Guidance active.", ...prev]);
      return;
    }

    // Check if directly navigating to skill intelligence
    if (c.includes("skill intelligence") || c.includes("open skills") || c.includes("research agent") || c.includes("skill registry")) {
      setActiveMode(OSMode.SKILL_INTELLIGENCE);
      setMood('thinking');
      setNotifications(prev => ["Skill Intelligence Registry opened.", ...prev]);
      return;
    }

    // Check if directly navigating to desktop commander
    if (c.includes("desktop commander") || c.includes("open commander") || c.includes("computer control")) {
      setActiveMode(OSMode.DESKTOP_COMMANDER);
      setMood('happy');
      return;
    }

    // Check if directive involves desktop, windows, terminal, dev, port, or process execution
    if (
      c.includes("vs code") || c.includes("vscode") || c.includes("port") || 
      c.includes("powershell") || c.includes("git") || c.includes("npm") || 
      c.includes("docker") || c.includes("screenshot") || c.includes("dev server") || 
      c.includes("run build") || c.includes("kill process") || c.includes("what is using")
    ) {
      setActiveMode(OSMode.DESKTOP_COMMANDER);
      setMood('thinking');
      await orchestrator.processRequest(cmd, userProfile.customInstructions, (spoken) => {
        setNotifications(prev => [spoken, ...prev]);
        setMood('happy');
      });
      return;
    }

    if (c.includes("open youtube") || c.includes("launch youtube")) {
      try { window.open("https://youtube.com", "_blank"); } catch (e) {}
      setActiveMode(OSMode.PC_FILES);
      setMood('happy');
    } else if (c.includes("open google") || c.includes("launch google")) {
      try { window.open("https://google.com", "_blank"); } catch (e) {}
      setActiveMode(OSMode.PC_FILES);
      setMood('happy');
    } else if (c.includes("open whatsapp") || c.includes("launch whatsapp")) {
      try { window.open("https://web.whatsapp.com", "_blank"); } catch (e) {}
      setActiveMode(OSMode.PC_FILES);
      setMood('happy');
    } else if (c.includes("find misplaced") || c.includes("find keys") || c.includes("organize files") || c.includes("clean desktop")) {
      setActiveMode(OSMode.PC_FILES);
      setMood('surprise');
    } else if (c.includes("sleep mode")) {
      setIsSleepMode(true);
    } else if (c.includes("search for") && c.includes("open it")) {
      const query = c.replace("search for", "").replace("open it", "").trim();
      window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}&btnI=1`, "_blank");
      setMood('surprise');
    } else if (c.includes("set timer for") || c.includes("set alarm for")) {
      const match = c.match(/(\d+)/);
      if (match) {
        const seconds = parseInt(match[0]);
        setNotifications(prev => [`Timer set for ${seconds} seconds.`, ...prev]);
        setTimeout(() => {
          setMood('surprise');
          setNotifications(prev => ["ALARM: Timer Expired!", ...prev]);
          // Flash notification
          alarmIntervalRef.current = window.setInterval(() => {
            setMood(prev => prev === 'surprise' ? 'idle' : 'surprise');
          }, 500);
        }, seconds * 1000);
      }
    } else if (c.includes("stop alarm") || c.includes("stop timer")) {
      stopAlarm();
    }
  }, [stopAlarm, userProfile.customInstructions]);

  const navItems = [
    { mode: OSMode.HUD, icon: LayoutGrid, label: 'Portal' },
    { mode: OSMode.SCREEN_INTELLIGENCE, icon: Eye, label: 'Screen Intel' },
    { mode: OSMode.TERMINAL, icon: Terminal, label: 'Neural' },
    { mode: OSMode.NEURAL_MEMORY, icon: Bookmark, label: 'Memory' },
    { mode: OSMode.DESKTOP_COMMANDER, icon: Laptop, label: 'Commander' },
    { mode: OSMode.SKILL_INTELLIGENCE, icon: BrainCircuit, label: 'Skills' },
    { mode: OSMode.PC_FILES, icon: FolderOpen, label: 'Files' },
    { mode: OSMode.IMAGE_FORGE, icon: ImageIcon, label: 'Forge' },
    { mode: OSMode.CODE_MIRROR, icon: Code, label: 'Dev' },
    { mode: OSMode.ANALYTICS, icon: BarChart2, label: 'Data' },
    { mode: OSMode.SETTINGS, icon: Settings, label: 'Core' }
  ];

  const [systemLoad, setSystemLoad] = useState(12);
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemLoad(prev => Math.max(5, Math.min(95, prev + (Math.random() * 10 - 5))));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (isSleepMode) {
    return (
      <div className="fixed inset-0 z-[1000] bg-[#050b18] flex flex-col items-center justify-center cursor-pointer overflow-hidden" onClick={() => setIsSleepMode(false)}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#00E5FF]/5 to-transparent"></div>
        <Moon size={120} className="text-[#00E5FF] animate-pulse mb-8 drop-shadow-[0_0_30px_#00E5FF]" />
        <h1 className="font-orbitron text-[clamp(28px,2.5vw,40px)] text-white tracking-[1.5em] opacity-30">HYBERNATING</h1>
        <p className="text-[#00E5FF]/40 mt-8 font-mono text-[clamp(11px,0.8vw,13px)] tracking-widest uppercase animate-pulse">Touch to initialize startup sequence</p>
        <div className="absolute bottom-20 flex flex-col items-center">
          <span className="text-[clamp(56px,5.2vw,96px)] font-mono text-white/5 tracking-tighter">{time.toLocaleTimeString()}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen flex flex-col overflow-hidden text-[#EAFBFF] max-w-[1920px] mx-auto">
      {/* Sleek Minimal Header */}
      <header className="h-14 sm:h-16 mx-2 sm:mx-6 md:mx-8 lg:mx-12 mt-2 sm:mt-3 md:mt-4 lg:mt-6 flex items-center justify-between px-3 sm:px-6 md:px-8 z-[100] glass-panel rounded-full bg-white/5 border-white/5 backdrop-blur-3xl shadow-2xl shrink-0">
        <div className="flex items-center gap-3 sm:gap-6 md:gap-8">
          <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group" onClick={() => setActiveMode(OSMode.HUD)}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#00E5FF] flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all group-hover:rotate-12 shrink-0">
              <BrainCircuit size={18} className="text-[#0A1A2F] sm:w-[20px] sm:h-[20px]" />
            </div>
            <div className="flex flex-col">
              <span className="font-orbitron font-black tracking-[0.15em] sm:tracking-[0.2em] text-[clamp(15px,1.1vw,18px)] leading-none whitespace-nowrap">HYDER OS</span>
              <span className="text-[clamp(7px,0.5vw,9px)] font-mono text-[#00E5FF] font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase opacity-60 whitespace-nowrap">Neural Core Active</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center bg-white/5 border border-white/10 rounded-full px-3 sm:px-5 py-1.5 sm:py-2 gap-2 sm:gap-3 w-36 sm:w-56 md:w-64 lg:w-80 focus-within:w-48 sm:focus-within:w-72 lg:focus-within:w-96 transition-all ring-1 ring-white/5 focus-within:ring-[#00E5FF]/30">
            <Search size={14} className="text-[#00E5FF]/40 shrink-0" />
            <input 
              type="text" 
              placeholder="System command..." 
              className="bg-transparent border-none outline-none text-[clamp(11px,0.8vw,13px)] w-full font-medium placeholder:text-white/20" 
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCommand((e.target as HTMLInputElement).value);
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button 
              onClick={() => setEyeCare(!eyeCare)}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${eyeCare ? 'bg-[#FFAB40] text-black shadow-lg shadow-[#FFAB40]/20' : 'hover:bg-white/5 text-[#00E5FF]/40 hover:text-[#00E5FF]'}`}
              title="Eye Comfort"
            >
              {eyeCare ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full hover:bg-white/5 transition-all relative flex items-center justify-center ${showNotifications ? 'bg-white/10 text-[#00E5FF]' : 'text-[#00E5FF]/40'}`}
            >
              <Bell size={15} />
              {notifications.length > 0 && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#00E5FF] rounded-full shadow-[0_0_5px_#00E5FF]"></div>}
            </button>
          </div>

          <div className="h-5 sm:h-6 w-px bg-white/10"></div>

          {/* Multi-Agent Dual Presence Pill */}
          <button
            onClick={() => setActiveMode(OSMode.DESKTOP_COMMANDER)}
            className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left"
            title="Switch to Desktop Commander"
          >
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse"></span>
              <span className="text-[clamp(7px,0.5vw,9px)] font-orbitron font-bold text-white/80">HAIDER</span>
            </div>
            <span className="text-white/20">|</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isCommanderOnline ? 'bg-[#2ED8C3] animate-ping' : 'bg-red-400'}`}></span>
              <span className={`text-[clamp(7px,0.5vw,9px)] font-orbitron font-bold ${isCommanderOnline ? 'text-[#2ED8C3]' : 'text-red-400'}`}>
                {isCommanderOnline ? 'COMMANDER' : 'OFFLINE'}
              </span>
            </div>
          </button>

          {/* Neural Memory Header Pill */}
          <button
            onClick={() => setActiveMode(OSMode.NEURAL_MEMORY)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-all text-left"
            title="Open Neural Memory Bank"
          >
            <Bookmark size={12} className="text-purple-400" />
            <span className="text-[clamp(7px,0.5vw,9px)] font-orbitron font-bold text-purple-300">
              MEMORY
            </span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[clamp(7px,0.5vw,9px)] font-orbitron font-bold text-white/20 tracking-widest hidden sm:inline">LOCAL_UPLINK</span>
              <span className="text-[clamp(12px,0.85vw,14px)] font-mono font-bold text-[#00E5FF]">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <button 
              onClick={() => setShowProfile(true)}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:border-[#00E5FF] transition-all group overflow-hidden shrink-0"
            >
              <User size={15} className="text-white/40 group-hover:text-[#00E5FF]" />
            </button>
          </div>
        </div>
      </header>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="absolute top-20 sm:top-24 right-2 sm:right-12 lg:right-16 w-[calc(100%-1rem)] sm:w-80 glass-panel z-[200] p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] animate-slide-in border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h4 className="font-orbitron text-[clamp(10px,0.75vw,12px)] font-black tracking-widest text-[#00E5FF]">TELEMETRY_LOG</h4>
            <div className="flex gap-2">
              <Trash2 size={14} className="text-white/20 hover:text-red-500 cursor-pointer" onClick={() => setNotifications([])} />
              <X size={14} className="text-white/20 hover:text-white cursor-pointer" onClick={() => setShowNotifications(false)} />
            </div>
          </div>
          <div className="space-y-2.5 max-h-56 overflow-y-auto custom-scrollbar pr-1.5">
            {notifications.length > 0 ? notifications.map((n, i) => (
              <div key={i} className="flex gap-2.5 p-3 sm:p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                <BellRing size={14} className="text-[#00E5FF] shrink-0 mt-0.5" />
                <p className="text-[clamp(10px,0.75vw,12px)] text-white/60 leading-relaxed">{n}</p>
              </div>
            )) : <p className="text-[clamp(10px,0.75vw,12px)] text-white/20 text-center font-mono py-4">No active logs</p>}
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[500] flex items-center justify-center p-3 sm:p-6 md:p-8">
          <div className="w-full max-w-2xl glass-panel p-6 sm:p-10 md:p-12 rounded-[28px] sm:rounded-[48px] relative animate-slide-in border-white/5 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setShowProfile(false)} className="absolute top-4 sm:top-8 right-4 sm:right-8 text-white/20 hover:text-white transition-colors">
              <X size={20} className="sm:w-6 sm:h-6" />
            </button>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 mb-6 sm:mb-10">
              <div className="w-16 h-16 sm:w-22 sm:h-22 rounded-[24px] sm:rounded-[32px] bg-gradient-to-tr from-[#00E5FF] to-[#2ED8C3] flex items-center justify-center shadow-[0_0_50px_rgba(0,229,255,0.3)] shrink-0">
                <User size={28} className="text-[#0A1A2F] sm:w-10 sm:h-10" />
              </div>
              <div className="text-center sm:text-left w-full">
                <input 
                  value={userProfile.name}
                  onChange={e => setUserProfile({...userProfile, name: e.target.value})}
                  className="text-[clamp(22px,2vw,36px)] font-orbitron font-black bg-transparent border-none outline-none focus:text-[#00E5FF] transition-colors w-full text-center sm:text-left"
                  placeholder="USER_NAME"
                />
                <p className="text-[#00E5FF] font-mono tracking-widest mt-1 uppercase text-[clamp(9px,0.7vw,12px)] opacity-60">Architect Level 9</p>
              </div>
            </div>
            <div className="space-y-4 sm:space-y-8">
              <div className="space-y-2 sm:space-y-3">
                <label className="text-[clamp(8px,0.6vw,10px)] font-orbitron text-white/30 uppercase tracking-[0.4em] font-black">Neural Signature / Bio</label>
                <input 
                  value={userProfile.bio} 
                  onChange={e => setUserProfile({...userProfile, bio: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-5 outline-none focus:border-[#00E5FF]/40 text-[clamp(13px,0.95vw,16px)] transition-all"
                  placeholder="What is your mission?"
                />
              </div>
              <div className="space-y-2 sm:space-y-3">
                <label className="text-[clamp(8px,0.6vw,10px)] font-orbitron text-white/30 uppercase tracking-[0.4em] font-black">AI Custom Directives</label>
                <textarea 
                  value={userProfile.customInstructions}
                  onChange={e => setUserProfile({...userProfile, customInstructions: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-[20px] sm:rounded-[28px] p-4 sm:p-6 outline-none focus:border-[#00E5FF]/40 h-28 sm:h-40 resize-none text-white/80 leading-relaxed transition-all custom-scrollbar text-[clamp(12px,0.85vw,14px)]"
                  placeholder="How should Hyder OS respond to you?"
                />
              </div>
              <div className="flex justify-end gap-3 sm:gap-4 pt-2 sm:pt-4">
                <button onClick={() => setShowProfile(false)} className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-black font-orbitron font-black text-[clamp(11px,0.8vw,13px)] tracking-widest hover:scale-105 active:scale-95 transition-all">SAVE_RECORDS</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Portal */}
      <main className="flex-1 relative flex flex-col p-2 sm:p-4 md:p-6 lg:p-8 xl:p-10 pb-20 sm:pb-24 lg:pb-28 overflow-hidden min-h-0">
        <div className="flex-1 glass-panel rounded-[24px] sm:rounded-[32px] lg:rounded-[40px] border-none bg-white/[0.02] overflow-hidden animate-slide-in relative flex flex-col min-h-0">
          <div className="w-full h-full overflow-y-auto custom-scrollbar flex flex-col min-h-0">
            {activeMode === OSMode.HUD && (
              <HUD 
                onNavigate={setActiveMode} 
                mood={mood} 
                onStopAlarm={stopAlarm} 
                onVoiceActivate={() => setIsLiveActive(true)}
                onCommand={handleCommand}
                persona={persona}
              />
            )}
            {activeMode === OSMode.SCREEN_INTELLIGENCE && <ScreenIntelligencePanel />}
            {activeMode === OSMode.TERMINAL && (
              <NeuralTerminal 
                persona={persona} 
                onCommand={handleCommand} 
                onStatusChange={setMood} 
                customInstructions={userProfile.customInstructions}
                onOpenMemory={() => setActiveMode(OSMode.NEURAL_MEMORY)}
              />
            )}
            {activeMode === OSMode.NEURAL_MEMORY && <NeuralMemoryPanel />}
            {activeMode === OSMode.DESKTOP_COMMANDER && <DesktopCommanderPanel />}
            {activeMode === OSMode.SKILL_INTELLIGENCE && <SkillIntelligenceDashboard />}
            {activeMode === OSMode.IMAGE_FORGE && <ImageForge />}
            {activeMode === OSMode.CODE_MIRROR && <CodeMirror />}
            {activeMode === OSMode.ANALYTICS && <AnalyticsHub />}
            {activeMode === OSMode.PC_FILES && <VirtualPC />}
            {activeMode === OSMode.SETTINGS && (
              <div className="p-4 sm:p-8 md:p-12 lg:p-16 flex flex-col gap-6 sm:gap-10 max-w-6xl mx-auto h-full w-full overflow-y-auto custom-scrollbar">
                
                {/* Neural Memory & Context Quick Launch in Settings */}
                <div className="p-6 sm:p-8 rounded-[24px] sm:rounded-[36px] bg-gradient-to-tr from-purple-500/10 to-[#00E5FF]/5 border border-purple-500/30 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_0_40px_rgba(168,85,247,0.15)]">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.3)] shrink-0">
                      <Bookmark size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[clamp(8px,0.55vw,10px)] font-mono font-bold uppercase tracking-widest text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                          Persistent Synaptic Memory
                        </span>
                        <span className="text-[clamp(8px,0.55vw,10px)] font-mono text-emerald-400">
                          Active & Synchronized
                        </span>
                      </div>
                      <h3 className="text-[clamp(18px,1.4vw,24px)] font-orbitron font-black text-white mt-0.5">
                        NEURAL MEMORY & CONTEXT MATRIX
                      </h3>
                      <p className="text-[clamp(11px,0.8vw,13px)] text-white/70 max-w-xl leading-relaxed mt-1">
                        Persist user knowledge, preferences, and scheduled task reminders across sessions in LocalStorage. Directly injected into JARVIS conversational prompts.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveMode(OSMode.NEURAL_MEMORY)}
                    className="px-6 py-3 rounded-2xl bg-purple-500 hover:bg-white text-black font-orbitron font-black text-[clamp(9px,0.65vw,11px)] tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] shrink-0 flex items-center gap-2 active:scale-95"
                  >
                    OPEN NEURAL MEMORY <ChevronRight size={14} />
                  </button>
                </div>

                {/* Screen Intelligence Quick Launch in Settings */}
                <div className="p-6 sm:p-8 rounded-[24px] sm:rounded-[36px] bg-gradient-to-tr from-[#2ED8C3]/10 to-[#00E5FF]/5 border border-[#2ED8C3]/30 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_0_40px_rgba(46,216,195,0.15)]">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#2ED8C3]/20 border border-[#2ED8C3]/40 flex items-center justify-center text-[#2ED8C3] shadow-[0_0_20px_rgba(46,216,195,0.3)] shrink-0">
                      <Eye size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[clamp(8px,0.55vw,10px)] font-mono font-bold uppercase tracking-widest text-[#2ED8C3] bg-[#2ED8C3]/10 px-2 py-0.5 rounded-full border border-[#2ED8C3]/20">
                          Visual Perception Engine
                        </span>
                        <span className="text-[clamp(8px,0.55vw,10px)] font-mono text-white/50">
                          Shortcut: Ctrl + Space
                        </span>
                      </div>
                      <h3 className="text-[clamp(18px,1.4vw,24px)] font-orbitron font-black text-white mt-0.5">
                        SCREEN INTELLIGENCE & VISUAL GUIDANCE
                      </h3>
                      <p className="text-[clamp(11px,0.8vw,13px)] text-white/70 max-w-xl leading-relaxed mt-1">
                        High-definition screen sharing, camera perception, automated troubleshooting, interactive SVG guidance overlays, and self-healing watchdog.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveMode(OSMode.SCREEN_INTELLIGENCE)}
                    className="px-6 py-3 rounded-2xl bg-[#2ED8C3] hover:bg-white text-[#0A1A2F] font-orbitron font-black text-[clamp(9px,0.65vw,11px)] tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(46,216,195,0.4)] shrink-0 flex items-center gap-2 active:scale-95"
                  >
                    OPEN SCREEN INTELLIGENCE <ChevronRight size={14} />
                  </button>
                </div>

                {/* Skill Intelligence Quick Launch in Settings */}
                <div className="p-6 sm:p-8 rounded-[24px] sm:rounded-[36px] bg-gradient-to-tr from-[#00E5FF]/10 to-[#2ED8C3]/5 border border-[#00E5FF]/30 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_0_40px_rgba(0,229,255,0.15)]">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#00E5FF]/20 border border-[#00E5FF]/40 flex items-center justify-center text-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.3)] shrink-0">
                      <BrainCircuit size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[clamp(8px,0.55vw,10px)] font-mono font-bold uppercase tracking-widest text-[#00E5FF] bg-[#00E5FF]/10 px-2 py-0.5 rounded-full border border-[#00E5FF]/20">
                          Autonomous Registry
                        </span>
                        <span className="text-[clamp(8px,0.55vw,10px)] font-mono text-green-400">
                          ● Background Research Active
                        </span>
                      </div>
                      <h3 className="text-[clamp(18px,1.4vw,24px)] font-orbitron font-black text-white mt-0.5">
                        SKILL INTELLIGENCE & INTEGRATION
                      </h3>
                      <p className="text-[clamp(11px,0.8vw,13px)] text-white/70 max-w-xl leading-relaxed mt-1">
                        Configure autonomous capability research, verified source crawlers (GitHub, npm, MCP, Official Docs), security containment policies, and sandboxed dynamic tooling.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveMode(OSMode.SKILL_INTELLIGENCE)}
                    className="px-6 py-3 rounded-2xl bg-[#00E5FF] hover:bg-white text-[#0A1A2F] font-orbitron font-black text-[clamp(9px,0.65vw,11px)] tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(0,229,255,0.4)] shrink-0 flex items-center gap-2 active:scale-95"
                  >
                    OPEN SKILL INTELLIGENCE <ChevronRight size={14} />
                  </button>
                </div>

                <div className="flex flex-col gap-2 sm:gap-4">
                  <span className="text-[clamp(8px,0.6vw,10px)] font-orbitron text-[#00E5FF] tracking-[0.5em] uppercase font-black opacity-40">System Architecture</span>
                  <h2 className="text-[clamp(28px,3.5vw,56px)] font-orbitron font-black tracking-tighter text-white">CORE PERSONA</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pb-20">
                  {Object.entries(PERSONAS).map(([key, p]) => (
                    <button
                      key={key}
                      onClick={() => setPersona(p)}
                      className={`group relative p-6 sm:p-8 lg:p-10 rounded-[24px] sm:rounded-[36px] transition-all text-left border-2 ${
                        persona.name === p.name 
                          ? 'bg-white text-black border-white shadow-[0_30px_60px_rgba(255,255,255,0.1)] scale-[1.02]' 
                          : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <div className="text-[clamp(17px,1.3vw,24px)] font-black">{p.name}</div>
                        <div className={`p-2.5 sm:p-3 rounded-xl ${persona.name === p.name ? 'bg-black text-white' : 'bg-white/5 text-white/40'}`}>
                          <Zap size={18} className="sm:w-5 sm:h-5" />
                        </div>
                      </div>
                      <p className={`text-[clamp(12px,0.9vw,15px)] font-medium leading-relaxed mb-4 sm:mb-8 ${persona.name === p.name ? 'text-black/60' : 'text-white/50'}`}>
                        {p.description}
                      </p>
                      <div className="flex items-center gap-2 text-[clamp(8px,0.6vw,10px)] font-orbitron font-black uppercase tracking-widest opacity-60">
                        Synchronize Node <ChevronRight size={12} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Dock (Navigation) */}
      <div className="absolute bottom-12 sm:bottom-14 md:bottom-16 lg:bottom-20 left-1/2 -translate-x-1/2 flex items-center px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 glass-panel rounded-full border-white/5 bg-white/5 z-[100] shadow-[0_30px_60px_rgba(0,0,0,0.5)] group/dock max-w-[95vw] overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 shrink-0">
          {navItems.map((item) => (
            <button
              key={item.mode}
              onClick={() => setActiveMode(item.mode)}
              className={`relative h-9 w-9 sm:h-11 sm:w-11 lg:h-13 lg:w-13 flex items-center justify-center rounded-full transition-all group/item shrink-0 ${
                activeMode === item.mode 
                  ? `bg-[#00E5FF] text-[#0A1A2F] shadow-[0_0_20px_rgba(0,229,255,0.4)]` 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={16} className="sm:w-[18px] sm:h-[18px] lg:w-[20px] lg:h-[20px]" />
              <div className="absolute -top-10 px-2.5 py-0.5 bg-white text-black rounded-lg text-[clamp(9px,0.65vw,11px)] font-bold uppercase tracking-widest opacity-0 scale-90 group-hover/item:opacity-100 group-hover/item:scale-100 transition-all pointer-events-none whitespace-nowrap shadow-md">
                {item.label}
              </div>
              {activeMode === item.mode && (
                <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"></div>
              )}
            </button>
          ))}
          <div className="w-px h-5 sm:h-6 lg:h-7 bg-white/10 mx-0.5 sm:mx-1 lg:mx-1.5 shrink-0"></div>
          <button 
            onClick={() => setIsLiveActive(!isLiveActive)}
            className={`h-9 w-9 sm:h-11 sm:w-11 lg:h-13 lg:w-13 flex items-center justify-center rounded-full transition-all shrink-0 ${
              isLiveActive ? 'bg-red-500 text-white animate-pulse shadow-[0_0_20px_#ef4444]' : 'bg-white/5 text-[#00E5FF] hover:bg-[#00E5FF] hover:text-[#0A1A2F]'
            }`}
          >
            <Mic size={16} className="sm:w-[18px] sm:h-[18px] lg:w-[20px] lg:h-[20px]" />
          </button>
          <button 
            onClick={() => setIsSleepMode(true)}
            className="h-9 w-9 sm:h-11 sm:w-11 lg:h-13 lg:w-13 flex items-center justify-center rounded-full text-white/20 hover:text-[#00E5FF] transition-all shrink-0"
          >
            <Power size={16} className="sm:w-[18px] sm:h-[18px] lg:w-[20px] lg:h-[20px]" />
          </button>
        </div>
      </div>

      {/* Cinematic Voice Interface Overlay */}
      {isLiveActive && (
        <div className="absolute inset-0 z-[600] bg-[#0A1A2F]/95 backdrop-blur-3xl flex items-center justify-center p-2 sm:p-6 lg:p-12">
          <div className="w-full max-w-5xl h-full glass-panel rounded-[24px] sm:rounded-[40px] lg:rounded-[56px] overflow-hidden border-white/5 relative animate-slide-in bg-black/40 flex flex-col">
            <button 
              onClick={() => setIsLiveActive(false)}
              className="absolute top-4 sm:top-8 right-4 sm:right-8 text-white/40 hover:text-white transition-all font-orbitron text-[clamp(8px,0.6vw,10px)] tracking-[0.2em] sm:tracking-[0.4em] flex items-center gap-2 bg-white/5 px-4 sm:px-8 py-2 sm:py-3 rounded-xl sm:rounded-[20px] border border-white/5 z-50 font-black shadow-lg"
            >
              TERMINATE_COMM_UPLINK
            </button>
            <LiveVoice 
              persona={persona} 
              onNavigate={(mode) => {
                setActiveMode(mode);
                setIsLiveActive(false);
              }}
              onCommand={(cmd) => {
                handleCommand(cmd);
              }}
              onClose={() => setIsLiveActive(false)}
            />
          </div>
        </div>
      )}

      {/* Futuristic Footer Status Bar */}
      <footer className="h-8 sm:h-10 mx-2 sm:mx-6 md:mx-8 lg:mx-12 mb-2 sm:mb-3 md:mb-4 flex items-center justify-between px-3 sm:px-6 md:px-8 z-[100] glass-panel rounded-full bg-white/5 border-white/5 backdrop-blur-3xl shadow-2xl shrink-0">
        <div className="flex items-center gap-3 sm:gap-6 lg:gap-10">
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse"></div>
            <span className="text-[clamp(7px,0.5vw,9px)] font-orbitron font-black text-white/40 tracking-[0.15em] sm:tracking-[0.25em] uppercase whitespace-nowrap">Neural_Link: STABLE</span>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex justify-between text-[clamp(6px,0.45vw,8px)] font-mono text-white/20 mb-0.5 uppercase tracking-widest gap-2">
                <span>Core_Load</span>
                <span>{Math.round(systemLoad)}%</span>
              </div>
              <div className="w-16 sm:w-20 md:w-24 h-0.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#00E5FF] transition-all duration-1000" style={{ width: `${systemLoad}%` }}></div>
              </div>
            </div>
          </div>
          <div className="hidden xs:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/20">
            <Zap size={8} className="text-[#00E5FF]" />
            <span className="text-[clamp(6px,0.45vw,8px)] font-mono font-bold text-[#00E5FF] uppercase tracking-widest whitespace-nowrap">Flash-Lite Engine</span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <div className="hidden md:flex items-center gap-2 text-[clamp(7px,0.5vw,9px)] font-mono font-bold text-white/20 tracking-widest uppercase whitespace-nowrap">
            <Activity size={10} className="text-[#2ED8C3]" />
            <span>Telemetry: Nominal</span>
          </div>
          <div className="hidden md:block h-3 w-px bg-white/10"></div>
          <div className="flex items-center gap-2">
            <span className="text-[clamp(7px,0.5vw,9px)] font-orbitron font-black text-white/40 tracking-[0.15em] sm:tracking-[0.25em] uppercase whitespace-nowrap">v2.0.4_HYDER</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
