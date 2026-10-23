import React, { useState, useEffect, useRef } from 'react';
import { 
  Monitor, 
  Camera, 
  CameraOff, 
  Video, 
  VideoOff, 
  Eye, 
  Crosshair, 
  Sparkles, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  RefreshCw, 
  Compass, 
  ChevronRight, 
  ChevronLeft, 
  Trash2, 
  Sliders, 
  ShieldCheck, 
  Wrench, 
  Clock, 
  Calendar, 
  Maximize2, 
  HelpCircle, 
  ArrowRight, 
  Check, 
  Zap, 
  Terminal, 
  Laptop, 
  Search,
  Flame,
  Activity,
  Volume2,
  RotateCcw,
  CheckSquare,
  Square
} from 'lucide-react';
import { 
  ScreenFeedType, 
  ScreenIntelligenceMode, 
  VisualAnnotation, 
  VisualGuidanceStep, 
  ScreenshotHistoryItem,
  WatchdogServiceStatus,
  WatchdogLogEntry,
  ScheduledTaskItem,
  AgentPermissions
} from '../types';
import { screenIntelligence } from '../services/screenIntelligenceService';
import { watchdog } from '../services/watchdogService';
import { taskScheduler } from '../services/taskSchedulerService';
import { desktopCommander } from '../services/desktopCommanderService';

export const ScreenIntelligencePanel: React.FC = () => {
  // Feed state
  const [feedType, setFeedType] = useState<ScreenFeedType>(screenIntelligence.getFeedType());
  const [mode, setMode] = useState<ScreenIntelligenceMode>(screenIntelligence.getMode());
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(screenIntelligence.getIsAnalyzing());
  const [userQuery, setUserQuery] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string | null>(screenIntelligence.getLastCapturedImage());
  
  // Visual Guidance & Annotations
  const [annotations, setAnnotations] = useState<VisualAnnotation[]>(screenIntelligence.getCurrentAnnotations());
  const [guidanceSteps, setGuidanceSteps] = useState<VisualGuidanceStep[]>(screenIntelligence.getGuidanceSteps());
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(screenIntelligence.getCurrentStepIndex());
  const [selectedAnnotation, setSelectedAnnotation] = useState<VisualAnnotation | null>(null);

  // History & Tabs
  const [history, setHistory] = useState<ScreenshotHistoryItem[]>(screenIntelligence.getHistory());
  const [activeTab, setActiveTab] = useState<'guidance' | 'troubleshoot' | 'history' | 'watchdog' | 'scheduler' | 'permissions'>('guidance');
  
  // Watchdog & Scheduler state
  const [watchdogServices, setWatchdogServices] = useState<WatchdogServiceStatus[]>(watchdog.getServices());
  const [watchdogLogs, setWatchdogLogs] = useState<WatchdogLogEntry[]>(watchdog.getLogs());
  const [autoHealing, setAutoHealing] = useState<boolean>(watchdog.isAutoHealing());
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTaskItem[]>(taskScheduler.getTasks());
  const [permissions, setPermissions] = useState<AgentPermissions>(watchdog.getPermissions());

  // Interactive Execution state
  const [executionFeedback, setExecutionFeedback] = useState<{ msg: string; success: boolean } | null>(null);
  const [isExecutingCommand, setIsExecutingCommand] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Subscribe to Screen Intelligence events
  useEffect(() => {
    const unsub = screenIntelligence.subscribe((evt) => {
      if (evt.type === 'FEED_CHANGED') {
        setFeedType(evt.feedType);
        setCapturedImage(screenIntelligence.getLastCapturedImage());
        attachStreamToVideo();
      } else if (evt.type === 'ANALYSIS_START') {
        setIsAnalyzing(true);
      } else if (evt.type === 'ANALYSIS_COMPLETE') {
        setIsAnalyzing(false);
        setAnnotations(evt.result.annotations);
        setGuidanceSteps(screenIntelligence.getGuidanceSteps());
        setHistory(screenIntelligence.getHistory());
        setCapturedImage(evt.result.imageUrl);
      } else if (evt.type === 'ANALYSIS_ERROR') {
        setIsAnalyzing(false);
      } else if (evt.type === 'STEP_CHANGED') {
        setCurrentStepIndex(evt.stepIndex);
        setGuidanceSteps([...screenIntelligence.getGuidanceSteps()]);
      } else if (evt.type === 'MODE_CHANGED') {
        setMode(evt.mode);
      }
    });

    const unsubWatchdog = watchdog.subscribe(() => {
      setWatchdogServices(watchdog.getServices());
      setWatchdogLogs(watchdog.getLogs());
      setAutoHealing(watchdog.isAutoHealing());
      setPermissions(watchdog.getPermissions());
    });

    const unsubScheduler = taskScheduler.subscribe(() => {
      setScheduledTasks(taskScheduler.getTasks());
    });

    return () => {
      unsub();
      unsubWatchdog();
      unsubScheduler();
    };
  }, []);

  // Sync streams with video element
  const attachStreamToVideo = () => {
    if (!videoRef.current) return;
    const screenStream = screenIntelligence.getScreenStream();
    const cameraStream = screenIntelligence.getCameraStream();

    if (screenStream) {
      videoRef.current.srcObject = screenStream;
      videoRef.current.play().catch(() => {});
    } else if (cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    attachStreamToVideo();
  }, [feedType]);

  // Handlers for feed controls
  const handleStartScreenShare = async () => {
    try {
      await screenIntelligence.startScreenShare();
      attachStreamToVideo();
    } catch (e) {}
  };

  const handleStopScreenShare = () => {
    screenIntelligence.stopScreenShare();
  };

  const handleStartCamera = async () => {
    try {
      await screenIntelligence.startCamera();
      attachStreamToVideo();
    } catch (e) {}
  };

  const handleStopCamera = () => {
    screenIntelligence.stopCamera();
  };

  const handleTakeScreenshot = async () => {
    try {
      const dataUrl = await screenIntelligence.captureFrame(videoRef.current);
      setCapturedImage(dataUrl);
      setExecutionFeedback({ msg: 'Screenshot captured and registered into visual context.', success: true });
      setTimeout(() => setExecutionFeedback(null), 3000);
    } catch (err: any) {
      setExecutionFeedback({ msg: `Capture failed: ${err.message}`, success: false });
    }
  };

  const handleAnalyze = async (overridePrompt?: string) => {
    const q = overridePrompt || userQuery.trim() || (mode === 'troubleshoot' ? 'Detect visible errors, misconfigurations, or broken states and explain how to fix them' : 'What am I looking at and guide me step-by-step on what to do next');
    try {
      await screenIntelligence.analyzeActiveScreen(q, videoRef.current);
    } catch (err: any) {
      setExecutionFeedback({ msg: `Analysis failed: ${err.message}`, success: false });
    }
  };

  const handleAutoFix = async (commandToRun: string) => {
    if (!commandToRun) return;
    if (!permissions.execute) {
      setExecutionFeedback({ msg: 'Execution blocked: Execute permission is turned off in Settings.', success: false });
      return;
    }

    if (!desktopCommander.isOnline()) {
      setExecutionFeedback({ msg: 'Desktop Commander bridge is offline. Start desktop-commander on Windows to run local fixes.', success: false });
      return;
    }

    setIsExecutingCommand(true);
    try {
      const res = await desktopCommander.executeCommand(commandToRun);
      const isOk = res.exitCode === 0;
      setExecutionFeedback({
        msg: isOk ? `Fix executed: ${commandToRun}` : `Command reported error: ${res.stderr || res.stdout}`,
        success: isOk
      });
      // Re-audit watchdog
      watchdog.performAuditCycle();
    } catch (e: any) {
      setExecutionFeedback({ msg: `Fix execution failed: ${e.message}`, success: false });
    } finally {
      setIsExecutingCommand(false);
      setTimeout(() => setExecutionFeedback(null), 6000);
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-2 sm:p-4 md:p-6 lg:p-7 space-y-4 overflow-y-auto custom-scrollbar">
      
      {/* =========================================================================
          TOP COMMAND DECK: Feed Status, Mode Switcher, and Primary Actions
          ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-[22px] sm:rounded-[30px] bg-white/[0.03] border border-white/10 backdrop-blur-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xl">
        
        {/* Left: Feed Status Pill & Titles */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#00E5FF]/20 to-[#2ED8C3]/10 border border-[#00E5FF]/40 flex items-center justify-center text-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.25)] shrink-0">
            <Eye size={22} className="animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-orbitron font-black text-[clamp(14px,1vw,18px)] tracking-wider text-white uppercase">
                SCREEN INTELLIGENCE
              </h2>
              
              {/* Dynamic Feed Status Indicator */}
              <span className={`px-3 py-1 rounded-full text-[clamp(8px,0.55vw,9.5px)] font-mono font-bold uppercase tracking-wider border flex items-center gap-2 ${
                feedType === 'screen'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : feedType === 'camera'
                  ? 'bg-[#00E5FF]/15 text-[#00E5FF] border-[#00E5FF]/40 shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                  : feedType === 'screenshot'
                  ? 'bg-purple-500/15 text-purple-300 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                  : 'bg-white/10 text-white/50 border-white/10'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  feedType === 'screen' ? 'bg-emerald-400 animate-ping' :
                  feedType === 'camera' ? 'bg-[#00E5FF] animate-ping' :
                  feedType === 'screenshot' ? 'bg-purple-400' : 'bg-white/30'
                }`}></span>
                <span>AGENT RECEIVING: <strong className="text-white font-black">{
                  feedType === 'screen' ? 'SCREEN' :
                  feedType === 'camera' ? 'CAMERA' :
                  feedType === 'screenshot' ? 'SCREENSHOT' : 'NOTHING'
                }</strong></span>
              </span>
            </div>

            <p className="text-[clamp(9px,0.65vw,11.5px)] text-white/50 font-mono mt-0.5">
              Multimodal 2D spatial coordinate localization & step-by-step interactive guidance
            </p>
          </div>
        </div>

        {/* Center/Right: Mode Selector (Execute Mode vs Guide Mode) & Primary Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
          
          {/* Mode Switcher */}
          <div className="flex items-center bg-black/50 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => { screenIntelligence.setMode('guide'); setActiveTab('guidance'); }}
              className={`px-3 py-1.5 rounded-xl font-orbitron font-bold text-[clamp(8px,0.55vw,9.5px)] tracking-wider uppercase transition-all flex items-center gap-1.5 ${
                mode === 'guide'
                  ? 'bg-[#00E5FF] text-[#0A1A2F] shadow-lg'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Compass size={12} /> GUIDE MODE
            </button>
            <button
              onClick={() => screenIntelligence.setMode('execute')}
              className={`px-3 py-1.5 rounded-xl font-orbitron font-bold text-[clamp(8px,0.55vw,9.5px)] tracking-wider uppercase transition-all flex items-center gap-1.5 ${
                mode === 'execute'
                  ? 'bg-yellow-400 text-black shadow-lg'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Zap size={12} /> EXECUTE MODE
            </button>
          </div>

          {/* Screen Share / Stop Sharing Button */}
          {feedType === 'screen' ? (
            <button
              onClick={handleStopScreenShare}
              className="px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-orbitron font-bold text-[clamp(8px,0.55vw,9.5px)] tracking-wider uppercase transition-all flex items-center gap-1.5"
            >
              <VideoOff size={13} /> STOP SHARING
            </button>
          ) : (
            <button
              onClick={handleStartScreenShare}
              className="px-3.5 py-2 rounded-xl bg-[#00E5FF]/20 hover:bg-[#00E5FF] text-[#00E5FF] hover:text-[#0A1A2F] border border-[#00E5FF]/40 font-orbitron font-bold text-[clamp(8px,0.55vw,9.5px)] tracking-wider uppercase transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,229,255,0.2)]"
            >
              <Video size={13} /> SHARE SCREEN
            </button>
          )}

          {/* Take Screenshot */}
          <button
            onClick={handleTakeScreenshot}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-orbitron font-bold text-[clamp(8px,0.55vw,9.5px)] tracking-wider uppercase transition-all flex items-center gap-1.5"
          >
            <Crosshair size={13} /> TAKE SCREENSHOT
          </button>

          {/* Camera Button */}
          {feedType === 'camera' ? (
            <button
              onClick={handleStopCamera}
              className="px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-orbitron font-bold text-[clamp(8px,0.55vw,9.5px)] tracking-wider uppercase transition-all flex items-center gap-1.5"
            >
              <CameraOff size={13} /> STOP CAMERA
            </button>
          ) : (
            <button
              onClick={handleStartCamera}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-orbitron font-bold text-[clamp(8px,0.55vw,9.5px)] tracking-wider uppercase transition-all flex items-center gap-1.5"
            >
              <Camera size={13} /> OPEN CAMERA
            </button>
          )}

          {/* Visual Guidance Tab Shortcut */}
          <button
            onClick={() => setActiveTab('guidance')}
            className={`px-3 py-2 rounded-xl font-orbitron font-bold text-[clamp(8px,0.55vw,9.5px)] tracking-wider uppercase transition-all flex items-center gap-1.5 border ${
              activeTab === 'guidance'
                ? 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/40'
                : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/10'
            }`}
          >
            <Compass size={13} /> VISUAL GUIDANCE
          </button>

          {/* Screen History Tab Shortcut */}
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-2 rounded-xl font-orbitron font-bold text-[clamp(8px,0.55vw,9.5px)] tracking-wider uppercase transition-all flex items-center gap-1.5 border ${
              activeTab === 'history'
                ? 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/40'
                : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/10'
            }`}
          >
            <Clock size={13} /> SCREEN HISTORY ({history.length})
          </button>
        </div>
      </div>

      {/* Execution Feedback Notification if active */}
      {executionFeedback && (
        <div className={`p-3 rounded-2xl font-mono text-[clamp(9.5px,0.7vw,11.5px)] flex items-center gap-2 animate-slide-in ${
          executionFeedback.success
            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
        }`}>
          {executionFeedback.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span className="font-bold">{executionFeedback.success ? 'Success:' : 'Notice:'}</span>
          <span className="truncate">{executionFeedback.msg}</span>
        </div>
      )}

      {/* =========================================================================
          MAIN INTERACTION GRID: Left Visual Canvas with SVG Annotations Overlay | Right Intelligence Deck
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        
        {/* LEFT COLUMN: Visual Viewport with Interactive Annotation Overlay */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          
          <div className="relative w-full aspect-video rounded-[24px] sm:rounded-[32px] bg-black/80 border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center group select-none">
            
            {/* Live Video Element (Active Screen or Camera Stream) */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-contain ${feedType === 'screen' || feedType === 'camera' ? 'block' : 'hidden'}`}
            />

            {/* Static Screenshot Fallback when stream is paused/captured */}
            {feedType !== 'screen' && feedType !== 'camera' && (
              capturedImage ? (
                <img 
                  src={capturedImage} 
                  alt="Captured Screen" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="p-4 rounded-3xl bg-white/5 border border-white/10 text-[#00E5FF]">
                    <Monitor size={36} className="opacity-60" />
                  </div>
                  <div>
                    <h4 className="font-orbitron font-bold text-white text-[clamp(12px,0.85vw,14px)] uppercase">
                      No Live Visual Stream Active
                    </h4>
                    <p className="text-white/40 font-mono text-[clamp(8px,0.55vw,10.5px)] max-w-sm mt-1">
                      Click "Share Screen" to stream your display, "Open Camera", or "Take Screenshot" to begin visual AI assistance.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={handleStartScreenShare}
                      className="px-4 py-2 rounded-xl bg-[#00E5FF] text-[#0A1A2F] font-orbitron font-bold text-[clamp(8px,0.55vw,9.5px)] uppercase tracking-wider hover:bg-white transition-all shadow-lg"
                    >
                      SHARE DISPLAY NOW
                    </button>
                    <button
                      onClick={handleTakeScreenshot}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-orbitron font-bold text-[clamp(8px,0.55vw,9.5px)] uppercase tracking-wider transition-all"
                    >
                      CAPTURE LOCAL SCREEN
                    </button>
                  </div>
                </div>
              )
            )}

            {/* INTERACTIVE SVG ANNOTATION LAYER OVERLAY */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none z-20"
              viewBox="0 0 100 100" 
              preserveAspectRatio="none"
            >
              <defs>
                <marker 
                  id="arrowhead-cyan" 
                  markerWidth="8" 
                  markerHeight="6" 
                  refX="7" 
                  refY="3" 
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#00E5FF" />
                </marker>
                <marker 
                  id="arrowhead-yellow" 
                  markerWidth="8" 
                  markerHeight="6" 
                  refX="7" 
                  refY="3" 
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#FACC15" />
                </marker>
                <marker 
                  id="arrowhead-rose" 
                  markerWidth="8" 
                  markerHeight="6" 
                  refX="7" 
                  refY="3" 
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#F43F5E" />
                </marker>
              </defs>

              {annotations.map((ann, idx) => {
                const isSelected = selectedAnnotation?.id === ann.id;
                const isCurrentStep = guidanceSteps[currentStepIndex]?.annotation?.id === ann.id;
                const strokeColor = isCurrentStep ? '#FACC15' : ann.color || '#00E5FF';

                if (ann.type === 'arrow') {
                  // Arrow pointing towards target coordinate (ann.x, ann.y)
                  const startX = Math.max(5, Math.min(95, ann.x - 12));
                  const startY = Math.max(5, Math.min(95, ann.y - 12));
                  return (
                    <g key={ann.id} className="animate-pulse">
                      <line
                        x1={startX}
                        y1={startY}
                        x2={ann.x}
                        y2={ann.y}
                        stroke={strokeColor}
                        strokeWidth="0.8"
                        markerEnd={`url(#arrowhead-${isCurrentStep ? 'yellow' : 'cyan'})`}
                        strokeDasharray="1.5, 0.8"
                      />
                      <circle cx={ann.x} cy={ann.y} r="1.5" fill={strokeColor} />
                    </g>
                  );
                }

                if (ann.type === 'circle') {
                  return (
                    <g key={ann.id}>
                      <circle
                        cx={ann.x}
                        cy={ann.y}
                        r={ann.width ? ann.width / 2 : 6}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={isSelected || isCurrentStep ? '0.9' : '0.6'}
                        strokeDasharray={isSelected ? '2, 1' : 'none'}
                        className="animate-pulse"
                      />
                      <circle cx={ann.x} cy={ann.y} r="1" fill={strokeColor} />
                    </g>
                  );
                }

                // Default: Rectangle / Highlight Box
                const boxW = ann.width || 14;
                const boxH = ann.height || 7;
                const boxX = Math.max(1, ann.x - boxW / 2);
                const boxY = Math.max(1, ann.y - boxH / 2);

                return (
                  <g key={ann.id}>
                    <rect
                      x={boxX}
                      y={boxY}
                      width={boxW}
                      height={boxH}
                      rx="1"
                      fill={isCurrentStep ? 'rgba(250, 204, 21, 0.12)' : 'rgba(0, 229, 255, 0.08)'}
                      stroke={strokeColor}
                      strokeWidth={isSelected || isCurrentStep ? '0.9' : '0.6'}
                      strokeDasharray={isSelected ? '2, 1' : 'none'}
                    />
                    {/* Corner Reticle Accents */}
                    <circle cx={boxX} cy={boxY} r="0.8" fill={strokeColor} />
                    <circle cx={boxX + boxW} cy={boxY} r="0.8" fill={strokeColor} />
                    <circle cx={boxX} cy={boxY + boxH} r="0.8" fill={strokeColor} />
                    <circle cx={boxX + boxW} cy={boxY + boxH} r="0.8" fill={strokeColor} />
                  </g>
                );
              })}
            </svg>

            {/* HTML Annotation Badges & Tooltips Overlay (pointer-events enabled) */}
            <div className="absolute inset-0 pointer-events-none z-30">
              {annotations.map((ann) => {
                const isSelected = selectedAnnotation?.id === ann.id;
                const isCurrentStep = guidanceSteps[currentStepIndex]?.annotation?.id === ann.id;
                
                return (
                  <div
                    key={ann.id}
                    style={{
                      left: `${ann.x}%`,
                      top: `${ann.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    className="absolute pointer-events-auto cursor-pointer"
                    onClick={() => setSelectedAnnotation(ann)}
                  >
                    {/* Numbered Step or Element Pin */}
                    <div className={`px-2 py-0.5 rounded-full text-[clamp(7.5px,0.5vw,9.5px)] font-mono font-black uppercase tracking-wider flex items-center gap-1 shadow-lg transition-transform ${
                      isCurrentStep
                        ? 'bg-yellow-400 text-black scale-110 ring-2 ring-yellow-400/50 animate-bounce'
                        : isSelected
                        ? 'bg-white text-black scale-105'
                        : 'bg-[#00E5FF] text-[#0A1A2F] hover:scale-105'
                    }`}>
                      <span>#{ann.stepNumber || '★'}</span>
                      <span className="truncate max-w-[80px]">{ann.label}</span>
                    </div>

                    {/* Hover Explanation Card */}
                    {(isSelected || isCurrentStep) && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 p-2.5 rounded-xl bg-black/90 border border-white/20 text-white backdrop-blur-xl shadow-2xl z-40 text-left pointer-events-none animate-slide-in">
                        <div className="text-[clamp(7px,0.5vw,8.5px)] font-mono text-[#00E5FF] font-bold uppercase mb-0.5">
                          {ann.label}
                        </div>
                        <div className="text-[clamp(8px,0.55vw,10px)] font-medium text-white/80 leading-snug">
                          {ann.explanation}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Analyzing Pulsing Overlay */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 rounded-full border-2 border-[#00E5FF] border-t-transparent animate-spin mb-3"></div>
                <h4 className="font-orbitron font-bold text-white text-[clamp(12px,0.85vw,14px)] uppercase tracking-wider">
                  SYNTACTIC VISION SCAN
                </h4>
                <p className="text-[#00E5FF] font-mono text-[clamp(8px,0.55vw,10px)] mt-1 animate-pulse">
                  Localizing UI coordinates & formulating actionable guidance steps...
                </p>
              </div>
            )}
          </div>

          {/* Quick Query Bar */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleAnalyze(); }}
            className="flex items-center gap-2 p-2 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl"
          >
            <div className="p-2 text-[#00E5FF]/60 shrink-0">
              <Search size={16} />
            </div>
            <input 
              type="text"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Ask about this screen (e.g. 'Where is settings?', 'Why is port 3000 busy?', 'Guide me step-by-step')..."
              className="bg-transparent border-none outline-none font-mono text-[clamp(10px,0.75vw,12px)] text-white w-full placeholder:text-white/30"
            />
            <button
              type="submit"
              disabled={isAnalyzing}
              className="px-4 py-2 rounded-xl bg-[#00E5FF] hover:bg-white text-[#0A1A2F] font-orbitron font-bold text-[clamp(8px,0.55vw,9.5px)] tracking-wider uppercase transition-all shrink-0 disabled:opacity-40"
            >
              {isAnalyzing ? 'PERCEIVING...' : 'ANALYZE SCREEN'}
            </button>
          </form>

          {/* Preset Screen Question Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { label: 'What am I looking at?', q: 'What am I looking at right now on this screen?' },
              { label: 'Guide Me', q: 'Guide me step-by-step through the next actions on this page.' },
              { label: 'Where do I click?', q: 'Point an arrow exactly where I should click next.' },
              { label: 'Detect Errors', q: 'Detect any visible bugs, compilation errors, or port issues on screen.' },
              { label: 'How do I fix this?', q: 'How do I fix the visible problem on screen?' }
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => { setUserQuery(chip.q); handleAnalyze(chip.q); }}
                className="px-2.5 py-1 rounded-full bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-[#00E5FF]/40 text-white/60 hover:text-[#00E5FF] text-[clamp(7.5px,0.5vw,9px)] font-orbitron uppercase tracking-wider transition-all"
              >
                {chip.label}
              </button>
            ))}
          </div>

        </div>

        {/* RIGHT COLUMN: Intelligence Panels, Guidance Workflow, Troubleshooter & System Watchdog */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          
          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 bg-black/40 rounded-2xl border border-white/10 overflow-x-auto custom-scrollbar">
            {[
              { id: 'guidance', label: 'GUIDANCE STEPS', icon: Compass },
              { id: 'troubleshoot', label: 'TROUBLESHOOT', icon: Wrench },
              { id: 'history', label: 'HISTORY', icon: Clock },
              { id: 'watchdog', label: 'WATCHDOG', icon: ShieldCheck },
              { id: 'scheduler', label: 'SCHEDULER', icon: Calendar },
              { id: 'permissions', label: 'SAFETY', icon: Sliders }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-orbitron font-bold text-[clamp(7.5px,0.5vw,9px)] tracking-wider uppercase whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'bg-[#00E5FF] text-[#0A1A2F] shadow-md'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  <Icon size={11} /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: Step-by-Step Guided Mode */}
          {activeTab === 'guidance' && (
            <div className="p-4 sm:p-5 rounded-[24px] bg-white/[0.03] border border-white/10 backdrop-blur-xl flex flex-col space-y-3.5 flex-1 max-h-[500px] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="font-orbitron font-black text-white text-[clamp(11px,0.8vw,13px)] uppercase">
                    STEP-BY-STEP GUIDED WORKFLOW
                  </span>
                  <span className="px-2 py-0.5 rounded text-[7.5px] font-mono font-bold bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20">
                    {guidanceSteps.length > 0 ? `STEP ${currentStepIndex + 1} OF ${guidanceSteps.length}` : 'Awaiting Scan'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {guidanceSteps[currentStepIndex] && (
                    <button
                      onClick={() => screenIntelligence.speakStep(guidanceSteps[currentStepIndex])}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30 transition-all"
                      title="Audio Narration (Speak Active Step)"
                    >
                      <Volume2 size={13} />
                    </button>
                  )}
                  <button
                    onClick={() => screenIntelligence.prevStep()}
                    disabled={currentStepIndex === 0}
                    className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-20 font-orbitron text-[8px] uppercase flex items-center gap-1"
                    title="Previous step"
                  >
                    <ChevronLeft size={13} /> PREV
                  </button>
                  <button
                    onClick={() => screenIntelligence.nextStep()}
                    disabled={currentStepIndex >= guidanceSteps.length - 1}
                    className="px-2 py-1 rounded-lg bg-[#00E5FF] text-[#0A1A2F] hover:bg-white disabled:opacity-20 font-orbitron font-black text-[8px] uppercase flex items-center gap-1 shadow-sm"
                    title="Next step"
                  >
                    NEXT <ChevronRight size={13} />
                  </button>
                </div>
              </div>

              {guidanceSteps.length === 0 ? (
                <div className="py-8 text-center text-white/40 font-mono text-[clamp(9px,0.65vw,11px)] space-y-2">
                  <p>No active guided directives for this screen.</p>
                  <button
                    onClick={() => handleAnalyze('Guide me step-by-step through the next actions on this page')}
                    className="px-4 py-2 rounded-xl bg-[#00E5FF]/20 hover:bg-[#00E5FF] text-[#00E5FF] hover:text-[#0A1A2F] border border-[#00E5FF]/40 font-orbitron font-bold text-[clamp(8px,0.55vw,9.5px)] uppercase transition-all"
                  >
                    GENERATE GUIDANCE STEPS
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {guidanceSteps.map((step, idx) => {
                    const isCurrent = idx === currentStepIndex;
                    return (
                      <div
                        key={step.step}
                        onClick={() => screenIntelligence.setStep(idx)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isCurrent
                            ? 'bg-yellow-400/10 border-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.15)]'
                            : step.completed
                            ? 'bg-white/[0.02] border-emerald-500/30 text-white/60'
                            : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[clamp(9px,0.6vw,11px)] shrink-0 mt-0.5 ${
                          step.completed
                            ? 'bg-emerald-500 text-black'
                            : isCurrent
                            ? 'bg-yellow-400 text-black animate-pulse'
                            : 'bg-white/10 text-white/60'
                        }`}>
                          {step.completed ? <Check size={12} /> : step.step}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-orbitron font-bold text-[clamp(10px,0.7vw,12px)] text-white">
                              {step.title} {step.targetElement && `• ${step.targetElement}`}
                            </span>
                            {isCurrent && (
                              <span className="text-[7.5px] font-mono text-yellow-300 font-bold uppercase tracking-widest bg-yellow-400/20 px-2 py-0.2 rounded">
                                ACTIVE STEP
                              </span>
                            )}
                          </div>
                          <p className="text-[clamp(9px,0.65vw,11px)] text-white/70 leading-relaxed">
                            {step.instruction}
                          </p>

                          {/* Step Controls: Mark Completed, Narrate, Clarify, Auto-Fix */}
                          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap pt-2 border-t border-white/5">
                            <button
                              onClick={(e) => { e.stopPropagation(); screenIntelligence.markStepCompleted(idx); }}
                              className={`px-2.5 py-1 rounded-lg font-orbitron font-bold text-[clamp(7px,0.5vw,8.5px)] uppercase tracking-wider flex items-center gap-1 border transition-all ${
                                step.completed
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/10'
                              }`}
                            >
                              <CheckSquare size={11} className={step.completed ? 'text-emerald-400' : 'text-white/40'} />
                              {step.completed ? 'COMPLETED' : 'MARK COMPLETED'}
                            </button>

                            <button
                              onClick={(e) => { e.stopPropagation(); screenIntelligence.speakStep(step); }}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#00E5FF]/20 text-white/70 hover:text-[#00E5FF] border border-white/10 font-orbitron font-bold text-[clamp(7px,0.5vw,8.5px)] uppercase tracking-wider flex items-center gap-1 transition-all"
                            >
                              <Volume2 size={11} /> NARRATE
                            </button>

                            <button
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                const clarifyQ = `Can you clarify Step ${step.step} (${step.title}): ${step.instruction}? Where exactly should I click and what is expected?`;
                                setUserQuery(clarifyQ);
                                handleAnalyze(clarifyQ);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-yellow-400/20 text-white/70 hover:text-yellow-300 border border-white/10 font-orbitron font-bold text-[clamp(7px,0.5vw,8.5px)] uppercase tracking-wider flex items-center gap-1 transition-all"
                            >
                              <HelpCircle size={11} /> CLARIFY
                            </button>

                            {step.autoFixAvailable && step.autoFixCommand && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleAutoFix(step.autoFixCommand!); }}
                                disabled={isExecutingCommand}
                                className="px-2.5 py-1 rounded-lg bg-yellow-400 text-black font-orbitron font-bold text-[clamp(7px,0.5vw,8.5px)] uppercase tracking-wider flex items-center gap-1 hover:bg-white transition-all shadow-md ml-auto"
                              >
                                <Zap size={10} /> EXECUTE FIX
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Screen-based Troubleshooting */}
          {activeTab === 'troubleshoot' && (
            <div className="p-4 sm:p-5 rounded-[24px] bg-white/[0.03] border border-white/10 backdrop-blur-xl flex flex-col space-y-3.5 flex-1 max-h-[500px] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="font-orbitron font-black text-white text-[clamp(11px,0.8vw,13px)] uppercase flex items-center gap-2">
                  <Wrench size={14} className="text-[#FFAB40]" /> SCREEN-BASED TROUBLESHOOTER
                </span>
                <button
                  onClick={() => handleAnalyze('Detect and diagnose any error, crash, or misconfiguration on screen')}
                  className="px-2.5 py-1 rounded-xl bg-[#FFAB40]/20 hover:bg-[#FFAB40] text-[#FFAB40] hover:text-black font-orbitron font-bold text-[clamp(7.5px,0.5vw,9px)] uppercase transition-all"
                >
                  AUDIT SCREEN
                </button>
              </div>

              {history[0]?.detectedErrors && history[0].detectedErrors.length > 0 ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                    <div className="flex items-center gap-2 text-rose-400 font-orbitron font-bold text-[clamp(10px,0.7vw,12px)] uppercase">
                      <AlertTriangle size={15} /> DETECTED SYSTEM FAULT
                    </div>
                    {history[0].detectedErrors.map((errText, idx) => (
                      <p key={idx} className="text-[clamp(9.5px,0.68vw,11.5px)] text-white/80 leading-relaxed font-mono">
                        • {errText}
                      </p>
                    ))}
                  </div>

                  {history[0].autoFixCommand && (
                    <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-2">
                      <div className="text-[clamp(8px,0.55vw,9.5px)] font-mono text-[#00E5FF] uppercase font-bold">
                        RECOMMENDED AUTOMATED REPAIR
                      </div>
                      <div className="font-mono text-[clamp(9.5px,0.68vw,11.5px)] text-yellow-300 p-2 rounded-xl bg-black/40 border border-white/5 select-all">
                        {history[0].autoFixCommand}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleAutoFix(history[0].autoFixCommand!)}
                          disabled={isExecutingCommand}
                          className="px-4 py-2 rounded-xl bg-yellow-400 text-black font-orbitron font-black text-[clamp(8px,0.55vw,9.5px)] uppercase tracking-wider hover:bg-white transition-all shadow-lg"
                        >
                          APPLY AUTOMATED FIX
                        </button>
                        <button
                          onClick={() => { setActiveTab('guidance'); }}
                          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-orbitron font-bold text-[clamp(8px,0.55vw,9.5px)] uppercase transition-all"
                        >
                          SHOW ME HOW (VISUAL)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-white/40 font-mono text-[clamp(9px,0.65vw,11px)] space-y-2">
                  <CheckCircle2 size={30} className="mx-auto text-emerald-400 opacity-60" />
                  <p>No fatal errors visible on active viewport.</p>
                  <p className="text-[9px] text-white/30">Click "Audit Screen" above to perform deep syntactic inspection.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Screenshot History & Visual Memory */}
          {activeTab === 'history' && (
            <div className="p-4 sm:p-5 rounded-[24px] bg-white/[0.03] border border-white/10 backdrop-blur-xl flex flex-col space-y-3 flex-1 max-h-[500px] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div>
                  <span className="font-orbitron font-black text-white text-[clamp(11px,0.8vw,13px)] uppercase">
                    SCREEN MEMORY & TIMELINE
                  </span>
                  <p className="text-[clamp(8px,0.55vw,9.5px)] font-mono text-white/40">
                    Short-term visual context history with queries & AI findings
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[clamp(8px,0.55vw,9.5px)] font-mono text-white/40">
                    {history.length} snapshots
                  </span>
                  {history.length > 0 && (
                    <button
                      onClick={() => screenIntelligence.clearHistory()}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-orbitron font-bold text-[7.5px] uppercase tracking-wider flex items-center gap-1 transition-all"
                      title="Clear screen history"
                    >
                      <Trash2 size={11} /> CLEAR HISTORY
                    </button>
                  )}
                </div>
              </div>

              {history.length === 0 ? (
                <div className="py-8 text-center text-white/30 font-mono text-[clamp(9px,0.65vw,11px)] space-y-1">
                  <Clock size={28} className="mx-auto text-white/20 mb-2" />
                  <p>Visual context history is empty.</p>
                  <p className="text-[8px] text-white/20">Screenshots and analyzed frames will be recorded here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-[#00E5FF]/30 transition-all space-y-2 group"
                    >
                      <div className="flex items-start gap-3">
                        <img 
                          src={item.imageUrl} 
                          alt="Thumbnail" 
                          className="w-20 h-14 object-cover rounded-xl border border-white/10 shrink-0 shadow-md" 
                        />
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center justify-between text-[clamp(7.5px,0.5vw,9px)] font-mono text-white/40 mb-1">
                            <span>{new Date(item.timestamp).toLocaleString()}</span>
                            <span className="uppercase text-[#00E5FF] px-1.5 py-0.2 bg-[#00E5FF]/10 rounded border border-[#00E5FF]/20">
                              {item.feedType}
                            </span>
                          </div>
                          
                          {item.query && (
                            <div className="text-[clamp(8.5px,0.6vw,10px)] font-mono text-white/80 line-clamp-1 mb-0.5">
                              <span className="text-[#00E5FF] font-bold">Q:</span> {item.query}
                            </div>
                          )}

                          <div className="text-[clamp(9.5px,0.68vw,11.5px)] font-bold text-white line-clamp-2">
                            {item.summary}
                          </div>
                        </div>
                      </div>

                      {/* Suggested Steps Summary if present */}
                      {item.suggestedSteps && item.suggestedSteps.length > 0 && (
                        <div className="p-2 rounded-xl bg-black/40 border border-white/5 space-y-1">
                          <span className="text-[7.5px] font-mono uppercase text-[#00E5FF] font-bold">
                            Suggested Actions ({item.suggestedSteps.length}):
                          </span>
                          <ul className="text-[clamp(8px,0.55vw,10px)] text-white/70 space-y-0.5 font-mono list-disc list-inside">
                            {item.suggestedSteps.slice(0, 3).map((st, sidx) => (
                              <li key={sidx} className="truncate">{st}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[8px] font-mono text-white/30">
                          {item.annotations.length} visual reticle markers
                        </span>
                        <button
                          onClick={() => screenIntelligence.restoreHistoryItem(item)}
                          className="px-3 py-1 rounded-lg bg-[#00E5FF]/15 hover:bg-[#00E5FF] text-[#00E5FF] hover:text-[#0A1A2F] border border-[#00E5FF]/30 font-orbitron font-bold text-[7.5px] uppercase tracking-wider flex items-center gap-1 transition-all"
                        >
                          RESTORE CONTEXT <ChevronRight size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Self-Healing Watchdog Live Services */}
          {activeTab === 'watchdog' && (
            <div className="p-4 sm:p-5 rounded-[24px] bg-white/[0.03] border border-white/10 backdrop-blur-xl flex flex-col space-y-3.5 flex-1 max-h-[500px] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div>
                  <span className="font-orbitron font-black text-white text-[clamp(11px,0.8vw,13px)] uppercase">
                    SELF-HEALING WATCHDOG
                  </span>
                  <p className="text-[clamp(8px,0.55vw,9.5px)] font-mono text-white/40">
                    Proactive process recovery & connection supervision
                  </p>
                </div>
                <button
                  onClick={() => watchdog.setAutoHealing(!autoHealing)}
                  className={`px-3 py-1 rounded-xl font-orbitron font-bold text-[clamp(7.5px,0.5vw,9px)] uppercase border transition-all ${
                    autoHealing
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-white/5 text-white/40 border-white/10'
                  }`}
                >
                  {autoHealing ? 'AUTONOMOUS REPAIR ON' : 'MANUAL ONLY'}
                </button>
              </div>

              {/* Service Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {watchdogServices.map(svc => (
                  <div key={svc.name} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-orbitron font-bold text-[clamp(9.5px,0.68vw,11.5px)] text-white truncate">
                        {svc.name}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${
                        svc.status === 'healthy' ? 'bg-emerald-400' :
                        svc.status === 'recovering' ? 'bg-yellow-400 animate-ping' : 'bg-red-400'
                      }`}></span>
                    </div>
                    <div className="text-[clamp(8px,0.55vw,9.5px)] font-mono text-white/40 truncate">
                      {svc.target} • {svc.lastMessage}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Watchdog Recovery Triggers */}
              <div className="pt-2 border-t border-white/5 space-y-2">
                <span className="text-[clamp(8px,0.55vw,9.5px)] font-mono uppercase text-[#00E5FF] font-bold">
                  Emergency Recovery Actions
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => watchdog.autoRecoverFault('kill_hung_processes')}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white hover:text-rose-300 border border-white/10 hover:border-rose-500/40 font-orbitron font-bold text-[clamp(7.5px,0.5vw,9px)] uppercase transition-all"
                  >
                    KILL HUNG NODE/VITE
                  </button>
                  <button
                    onClick={() => watchdog.autoRecoverFault('restart_bridge')}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#00E5FF]/20 text-white hover:text-[#00E5FF] border border-white/10 hover:border-[#00E5FF]/40 font-orbitron font-bold text-[clamp(7.5px,0.5vw,9px)] uppercase transition-all"
                  >
                    RECONNECT BRIDGE
                  </button>
                </div>
              </div>

              {/* Recent Audit Logs */}
              <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar pt-2 font-mono text-[clamp(8px,0.55vw,9.5px)] text-white/50">
                {watchdogLogs.slice(0, 8).map(l => (
                  <div key={l.id} className="flex items-center gap-2 truncate">
                    <span className="text-white/20">{l.time}</span>
                    <span className="text-[#00E5FF]">[{l.service}]</span>
                    <span className="text-white/70">{l.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Smart Task Scheduler */}
          {activeTab === 'scheduler' && (
            <div className="p-4 sm:p-5 rounded-[24px] bg-white/[0.03] border border-white/10 backdrop-blur-xl flex flex-col space-y-3 flex-1 max-h-[500px] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div>
                  <span className="font-orbitron font-black text-white text-[clamp(11px,0.8vw,13px)] uppercase">
                    AUTOMATED TASK SCHEDULER
                  </span>
                  <p className="text-[clamp(8px,0.55vw,9.5px)] font-mono text-white/40">
                    Recurring system jobs & maintenance triggers
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {scheduledTasks.map(t => (
                  <div key={t.id} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3">
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-orbitron font-bold text-[clamp(9.5px,0.68vw,11.5px)] text-white truncate">
                          {t.name}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[7px] font-mono font-bold uppercase ${
                          t.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                          t.status === 'running' ? 'bg-yellow-400/20 text-yellow-300 animate-pulse' :
                          'bg-white/10 text-white/40'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                      <div className="text-[clamp(8px,0.55vw,9.5px)] font-mono text-white/40 truncate">
                        {t.schedule} • {t.command}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => taskScheduler.runNow(t.id)}
                        disabled={t.status === 'running'}
                        className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-[#00E5FF] text-white hover:text-[#0A1A2F] border border-white/10 font-orbitron font-bold text-[clamp(7.5px,0.5vw,9px)] uppercase transition-all"
                      >
                        RUN NOW
                      </button>
                      <button
                        onClick={() => taskScheduler.toggleTask(t.id)}
                        className={`w-8 h-4 rounded-full transition-colors relative ${t.enabled ? 'bg-[#00E5FF]' : 'bg-white/10'}`}
                      >
                        <div className={`w-3 h-3 rounded-full bg-black transition-transform absolute top-0.5 ${t.enabled ? 'left-4.5' : 'left-0.5'}`}></div>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: Permission & Safety Controls */}
          {activeTab === 'permissions' && (
            <div className="p-4 sm:p-5 rounded-[24px] bg-white/[0.03] border border-white/10 backdrop-blur-xl flex flex-col space-y-3.5 flex-1 max-h-[500px] overflow-y-auto custom-scrollbar">
              <div className="pb-2 border-b border-white/5">
                <span className="font-orbitron font-black text-white text-[clamp(11px,0.8vw,13px)] uppercase">
                  AGENT PERMISSION & SAFETY MATRIX
                </span>
                <p className="text-[clamp(8px,0.55vw,9.5px)] font-mono text-white/40">
                  Granular control over desktop perception and interaction boundaries
                </p>
              </div>

              {[
                { key: 'observe', label: 'Observe Screen & Media', desc: 'Allows AI agent to view screen stream and inspect screenshots' },
                { key: 'guide', label: 'Visual Guidance Overlay', desc: 'Allows AI agent to draw annotations and point to UI targets' },
                { key: 'execute', label: 'Execute Terminal Commands', desc: 'Allows running local Windows directives via Desktop Commander' },
                { key: 'install', label: 'Package & Tool Installation', desc: 'Allows installing npm/pip packages or sandbox tools' },
                { key: 'autonomous', label: 'Autonomous Self-Healing', desc: 'Allows background watchdog to recover hung ports and processes' }
              ].map(p => {
                const isEnabled = (permissions as any)[p.key];
                return (
                  <div key={p.key} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-orbitron font-bold text-[clamp(10px,0.7vw,12px)] text-white">
                        {p.label}
                      </div>
                      <div className="text-[clamp(8px,0.55vw,9.5px)] font-mono text-white/40">
                        {p.desc}
                      </div>
                    </div>
                    <button
                      onClick={() => watchdog.savePermissions({ [p.key]: !isEnabled })}
                      className={`px-3 py-1.5 rounded-xl font-orbitron font-bold text-[clamp(8px,0.55vw,9.5px)] uppercase border transition-all shrink-0 ${
                        isEnabled
                          ? 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/40 shadow-sm'
                          : 'bg-white/5 text-white/30 border-white/10'
                      }`}
                    >
                      {isEnabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
