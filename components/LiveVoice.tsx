import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage, Blob } from '@google/genai';
import { 
  PhoneOff, 
  Activity, 
  Zap, 
  Mic, 
  MicOff, 
  Speaker, 
  Cpu, 
  ShieldCheck, 
  MessageSquare, 
  ImageIcon, 
  Code, 
  FolderOpen, 
  Sparkles, 
  Send, 
  Volume2, 
  CheckCircle2,
  Terminal,
  Radio,
  Search,
  Laptop
} from 'lucide-react';
import { Persona, OSMode } from '../types';
import NeuralOrb, { HaiderVoiceState } from './NeuralOrb';

interface LiveVoiceProps {
  persona: Persona;
  onNavigate?: (mode: OSMode) => void;
  onCommand?: (cmd: string) => void;
  onClose?: () => void;
}

interface CommandLogItem {
  id: string;
  text: string;
  source: 'voice' | 'directive';
  status: 'executed' | 'speaking' | 'processing';
  time: string;
  actionDesc?: string;
}

const LiveVoice: React.FC<LiveVoiceProps> = ({ persona, onNavigate, onCommand, onClose }) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'listening' | 'error'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [vibe, setVibe] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState<string>('Voice Command Center active. Speak any command or choose a directive.');
  const [textInput, setTextInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<CommandLogItem[]>([
    {
      id: 'init-1',
      text: 'Neural Voice Uplink Initialized',
      source: 'directive',
      status: 'executed',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      actionDesc: 'Audio capture standing by'
    }
  ]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [frequencyData, setFrequencyData] = useState<number[]>(new Array(24).fill(25));
  const [activeEngine, setActiveEngine] = useState<'native_gemini' | 'synaptic_speech'>('synaptic_speech');
  const [orbSize, setOrbSize] = useState<number>(230);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w < 640) setOrbSize(Math.min(180, w * 0.44));
      else if (h < 750) setOrbSize(200);
      else setOrbSize(230);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const haiderVoiceState: HaiderVoiceState = React.useMemo(() => {
    if (status === 'error') return 'error';
    if (isMuted) return 'idle';
    if (status === 'connecting') return 'thinking';
    if (activeEngine === 'native_gemini' && vibe > 0.05) return 'speaking';
    if (status === 'listening' || status === 'connected') return 'listening';
    return 'idle';
  }, [status, isMuted, activeEngine, vibe]);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const recognitionRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Manual decode for raw PCM streaming bytes
  function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  // Manual encode for PCM data
  function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Manual decodeAudioData for raw PCM streaming
  async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  // Vocal speech synthesis feedback
  const speakVerbal = useCallback((message: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.pitch = 1.05;
      utterance.rate = 1.05;
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.includes('GB') && v.name.includes('Google')) ||
                    voices.find(v => v.lang.includes('GB')) ||
                    voices.find(v => v.lang.includes('US')) ||
                    voices[0];
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Voice Command Interpreter & Dispatcher
  const executeVoiceDirective = useCallback((cmd: string, source: 'voice' | 'directive' = 'voice') => {
    const cleanCmd = cmd.trim();
    if (!cleanCmd) return;
    const lower = cleanCmd.toLowerCase();

    let feedback = '';
    let navTarget: OSMode | null = null;

    if (lower.includes('commander') || lower.includes('desktop') || lower.includes('vs code') || lower.includes('vscode') || lower.includes('powershell') || lower.includes('port')) {
      feedback = 'Delegating to Desktop Commander local execution agent';
      navTarget = OSMode.DESKTOP_COMMANDER;
    } else if (lower.includes('terminal') || lower.includes('chat') || lower.includes('ask') || lower.includes('prompt')) {
      feedback = 'Routing directive to Cognitive Terminal';
      navTarget = OSMode.TERMINAL;
    } else if (lower.includes('image') || lower.includes('art') || lower.includes('draw') || lower.includes('forge')) {
      feedback = 'Opening Neural Image Studio';
      navTarget = OSMode.IMAGE_FORGE;
    } else if (lower.includes('code') || lower.includes('editor') || lower.includes('mirror') || lower.includes('script')) {
      feedback = 'Launching Synaptic Code Studio';
      navTarget = OSMode.CODE_MIRROR;
    } else if (lower.includes('analytic') || lower.includes('telemetry') || lower.includes('metric') || lower.includes('stat')) {
      feedback = 'Accessing Real-time Analytics Matrix';
      navTarget = OSMode.ANALYTICS;
    } else if (lower.includes('file') || lower.includes('pc') || lower.includes('folder') || lower.includes('drive')) {
      feedback = 'Opening Virtual PC Filesystem';
      navTarget = OSMode.PC_FILES;
    } else if (lower.includes('setting') || lower.includes('persona') || lower.includes('config')) {
      feedback = 'Entering System Architecture Settings';
      navTarget = OSMode.SETTINGS;
    } else if (lower.includes('dashboard') || lower.includes('hud') || lower.includes('home') || lower.includes('main')) {
      feedback = 'Returning to Main OS Dashboard';
      navTarget = OSMode.HUD;
    } else {
      feedback = `Executing neural directive: "${cleanCmd}"`;
    }

    setAiResponse(feedback);
    speakVerbal(feedback);

    // Record in history log
    setCommandHistory(prev => [
      {
        id: `cmd-${Date.now()}`,
        text: cleanCmd,
        source,
        status: 'executed',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        actionDesc: feedback
      },
      ...prev.slice(0, 7)
    ]);

    // Dispatch to system handlers
    onCommand?.(cleanCmd);
    if (navTarget && onNavigate) {
      setTimeout(() => {
        onNavigate(navTarget);
      }, 700);
    }
  }, [onCommand, onNavigate, speakVerbal]);

  // Web Speech Recognition Initializer for Continuous Listening
  const startSpeechRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setStatus('listening');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        if (interim) {
          setInterimTranscript(interim);
        }

        if (final) {
          setTranscript(final);
          setInterimTranscript('');
          executeVoiceDirective(final, 'voice');
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('SpeechRecognition status:', e.error);
        if (e.error !== 'no-speech') {
          // Keep listening alive gracefully
        }
      };

      recognition.onend = () => {
        // Auto-restart if modal remains open and unmuted
        if (!isMuted && status !== 'idle') {
          try {
            recognition.start();
          } catch (err) {
            // ignore rapid restart attempts
          }
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Web Speech setup failed:', err);
    }
  }, [executeVoiceDirective, isMuted, status]);

  // Audio Analyzer for Realtime Spectrum Visualization
  const setupAudioAnalyzer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateBars = () => {
        analyser.getByteFrequencyData(dataArray);
        
        let sum = 0;
        const bars: number[] = [];
        const step = Math.floor(bufferLength / 24);

        for (let i = 0; i < 24; i++) {
          const val = dataArray[i * step] || 0;
          bars.push(Math.max(15, Math.min(100, Math.round((val / 255) * 100))));
          sum += val;
        }

        const avg = sum / bufferLength;
        setAudioLevel(Math.round((avg / 255) * 100));
        setFrequencyData(bars);
        setVibe(avg / 120);

        animFrameRef.current = requestAnimationFrame(updateBars);
      };

      updateBars();
    } catch (e) {
      // Synthetic fallback oscillation if mic is blocked
      const syntheticInterval = setInterval(() => {
        setFrequencyData(prev => prev.map(() => Math.floor(20 + Math.random() * 60)));
        setAudioLevel(Math.floor(15 + Math.random() * 35));
      }, 100);
      return () => clearInterval(syntheticInterval);
    }
  };

  // Primary Session Starter (Dual-engine: Live Audio + Web Speech)
  const startSession = async () => {
    setStatus('connecting');
    await setupAudioAnalyzer();
    startSpeechRecognition();

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: persona.systemInstruction + " You are the voice subsystem of Hyder OS. Be extremely concise, authoritative, and direct.",
        },
        callbacks: {
          onopen: () => {
            setStatus('connected');
            setActiveEngine('native_gemini');
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);

            scriptProcessor.onaudioprocess = (e) => {
              if (isMuted) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const sum = inputData.reduce((a, b) => a + Math.abs(b), 0);
              setVibe(sum * 1.5);

              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const base64 = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64) {
              const ctx = outAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            const interrupted = msg.serverContent?.interrupted;
            if (interrupted) {
              for (const source of sourcesRef.current.values()) {
                source.stop();
              }
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e: any) => {
            console.warn('Native Gemini Live stream notice:', e);
            // Gracefully remain on Synaptic Speech engine without crashing UI
            setActiveEngine('synaptic_speech');
            setStatus('listening');
          },
          onclose: () => {
            if (status !== 'idle') {
              setActiveEngine('synaptic_speech');
              setStatus('listening');
            }
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.warn('Native Live connection failed, running on Synaptic Speech Recognition:', err);
      setActiveEngine('synaptic_speech');
      setStatus('listening');
    }
  };

  const endSession = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    sessionRef.current?.close();
    setStatus('idle');
    onClose?.();
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
    if (!isMuted) {
      if (recognitionRef.current) recognitionRef.current.abort();
    } else {
      startSpeechRecognition();
    }
  };

  const handleTextSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim()) return;
    executeVoiceDirective(textInput, 'directive');
    setTextInput('');
  };

  useEffect(() => {
    startSession();
    return () => endSession();
  }, []);

  const tacticalDirectives = [
    { label: 'Desktop Commander', cmd: 'open desktop commander and inspect pc', icon: Laptop, desc: 'Windows Bridge' },
    { label: 'Terminal Uplink', cmd: 'open terminal and status', icon: Terminal, desc: 'Synaptic Chat' },
    { label: 'Neural Canvas', cmd: 'launch image forge', icon: ImageIcon, desc: 'Image Studio' },
    { label: 'Code Workspace', cmd: 'open code mirror workspace', icon: Code, desc: 'Live Editor' },
    { label: 'Analytics Hub', cmd: 'show system telemetry analytics', icon: Activity, desc: 'Telemetry' },
    { label: 'Virtual PC Files', cmd: 'open pc files and storage', icon: FolderOpen, desc: 'Filesystem' },
    { label: 'Locate Keys', cmd: 'find misplaced access keys in files', icon: Search, desc: 'File Search' },
    { label: 'OS Diagnostic', cmd: 'run core system diagnostics', icon: ShieldCheck, desc: 'Integrity Check' },
  ];

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 sm:p-6 lg:p-8 relative overflow-y-auto custom-scrollbar bg-black/50 min-h-0 select-none">
      {/* Background Matrix Grid */}
      <div className="absolute inset-0 opacity-[0.04] bg-[size:32px_32px] bg-[linear-gradient(to_right,#00e5ff_1px,transparent_1px),linear-gradient(to_bottom,#00e5ff_1px,transparent_1px)] pointer-events-none"></div>

      {/* Top Status & Controls Ribbon */}
      <div className="w-full flex items-center justify-between z-10 shrink-0 pb-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF]">
            <Radio size={18} className="animate-pulse" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-orbitron font-black text-[clamp(11px,0.85vw,14px)] tracking-[0.2em] text-white">
                VOICE COMMAND CENTER
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[clamp(7px,0.5vw,9px)] font-mono font-bold uppercase tracking-wider ${
                status === 'connected' || status === 'listening' 
                  ? 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 animate-pulse' 
                  : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
              }`}>
                {isMuted ? 'MIC MUTED' : status === 'connected' ? 'LIVE AUDIO SYNTHESIS' : 'CONTINUOUS LISTENING'}
              </span>
            </div>
            <span className="text-[clamp(8px,0.58vw,10px)] font-mono text-white/40 tracking-widest uppercase">
              COGNITIVE NODE: {persona.name} // LATENCY: 11MS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mute Toggle */}
          <button
            onClick={toggleMute}
            className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 text-[clamp(8px,0.58vw,10px)] font-orbitron font-bold uppercase tracking-wider ${
              isMuted 
                ? 'bg-red-500/20 border-red-500/50 text-red-400' 
                : 'bg-white/5 border-white/10 hover:border-[#00E5FF]/40 text-white/70'
            }`}
            title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMuted ? <MicOff size={15} /> : <Mic size={15} className="text-[#00E5FF]" />}
            <span className="hidden sm:inline">{isMuted ? 'UNMUTE' : 'MIC ACTIVE'}</span>
          </button>

          {/* Engine indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[clamp(8px,0.55vw,10px)] font-mono text-white/50 uppercase">
            <Cpu size={12} className="text-[#2ED8C3]" />
            <span>{activeEngine === 'native_gemini' ? 'Gemini 2.5 Live' : 'Synaptic VUI'}</span>
          </div>

          {/* Terminate Button */}
          <button
            onClick={endSession}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500 border border-red-500/40 text-red-200 hover:text-white font-orbitron text-[clamp(8px,0.58vw,10px)] font-black tracking-widest uppercase transition-all"
          >
            <PhoneOff size={14} />
            <span className="hidden sm:inline">TERMINATE</span>
          </button>
        </div>
      </div>

      {/* Main Core Section: Holographic Sonic Visualizer & Transcripts */}
      <div className="my-auto py-2 sm:py-4 flex flex-col items-center justify-center w-full max-w-4xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Haider Osman Premium Solid White Face Orb */}
        <div className="relative flex flex-col items-center justify-center">
          <NeuralOrb 
            size={orbSize}
            state={haiderVoiceState}
            audioLevel={isMuted ? 0 : Math.max(audioLevel, Math.round(vibe * 75))}
          />

          {/* Realtime Decibel & State Telemetry Badge */}
          <div className="mt-3 flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/60 border border-white/10 text-[clamp(8px,0.55vw,10px)] font-mono text-[#00E5FF] tracking-wider z-20 shadow-lg">
            <span className={`w-1.5 h-1.5 rounded-full ${isMuted ? 'bg-red-400' : 'bg-[#00E5FF] animate-pulse'}`}></span>
            <span className="uppercase">{isMuted ? 'MIC MUTED' : `HAIDER ${haiderVoiceState.toUpperCase()} • ${audioLevel} dB`}</span>
          </div>
        </div>

        {/* Live Audio Transcript Display Panel */}
        <div className="w-full max-w-2xl bg-white/[0.02] border border-white/10 rounded-[20px] sm:rounded-[28px] p-3.5 sm:p-5 backdrop-blur-xl shadow-2xl flex flex-col gap-2.5 text-center">
          <div className="flex items-center justify-between text-[clamp(7px,0.5vw,9px)] font-mono text-white/40 tracking-widest uppercase">
            <span className="flex items-center gap-1.5 text-[#00E5FF]">
              <Sparkles size={11} className="animate-spin" />
              <span>SYNAPSE_AUDIO_TRANSLATOR</span>
            </span>
            <span>{isMuted ? 'MIC OFF' : 'VOICE ACTIVATED'}</span>
          </div>

          {/* Current Spoken Words */}
          <div className="min-h-[44px] flex items-center justify-center px-3">
            {interimTranscript ? (
              <p className="text-[clamp(13px,1vw,18px)] text-[#00E5FF] font-medium tracking-wide animate-pulse">
                "{interimTranscript}..."
              </p>
            ) : transcript ? (
              <p className="text-[clamp(13px,1vw,18px)] text-white font-medium tracking-wide">
                "{transcript}"
              </p>
            ) : (
              <p className="text-[clamp(11px,0.8vw,14px)] text-white/40 font-mono italic">
                {isMuted ? 'Microphone muted. Tap directives below or type a directive.' : 'Speak naturally (e.g. "open terminal", "launch image studio", "show analytics")...'}
              </p>
            )}
          </div>

          {/* AI Verbal Response Badge */}
          {aiResponse && (
            <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-[#00E5FF]/20 flex items-center justify-between text-left gap-3">
              <div className="flex items-center gap-2 text-[#2ED8C3] shrink-0">
                <Volume2 size={15} className="animate-pulse" />
                <span className="text-[clamp(8px,0.55vw,10px)] font-orbitron font-bold uppercase tracking-wider hidden sm:inline">AI FEEDBACK</span>
              </div>
              <p className="text-[clamp(10px,0.72vw,12px)] text-white/90 font-medium truncate flex-1">
                {aiResponse}
              </p>
              <button 
                onClick={() => speakVerbal(aiResponse)}
                className="p-1 rounded text-white/40 hover:text-white transition-colors"
                title="Repeat spoken feedback"
              >
                <Volume2 size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Quick Directive Action Deck (One-Tap Voice Directives) */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[clamp(8px,0.55vw,10px)] font-orbitron font-black text-white/40 tracking-[0.2em] uppercase">
              QUICK VOCAL DIRECTIVES
            </span>
            <span className="text-[clamp(7px,0.5vw,9px)] font-mono text-[#00E5FF]/60 uppercase tracking-widest">
              TAP OR SPEAK
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 w-full">
            {tacticalDirectives.map((item, idx) => (
              <button
                key={idx}
                onClick={() => executeVoiceDirective(item.cmd, 'directive')}
                className="group relative p-2.5 sm:p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.07] border border-white/5 hover:border-[#00E5FF]/40 text-left transition-all flex flex-col justify-between active:scale-95 shadow-md"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-[#00E5FF]/20 text-white/60 group-hover:text-[#00E5FF] transition-colors">
                    <item.icon size={14} />
                  </div>
                  <span className="text-[clamp(6px,0.45vw,8px)] font-mono text-white/20 group-hover:text-[#00E5FF]/60 uppercase">
                    DIR 0{idx + 1}
                  </span>
                </div>
                <div className="font-orbitron font-bold text-[clamp(9px,0.65vw,11px)] text-white uppercase group-hover:text-[#00E5FF] transition-colors truncate">
                  {item.label}
                </div>
                <div className="text-[clamp(7px,0.5vw,9px)] text-white/40 font-mono tracking-wider truncate">
                  {item.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Direct Text Transmission Bar */}
        <form 
          onSubmit={handleTextSubmit}
          className="w-full max-w-2xl flex items-center bg-white/[0.03] border border-white/10 focus-within:border-[#00E5FF]/50 rounded-full px-4 py-1.5 backdrop-blur-xl transition-all"
        >
          <Mic size={14} className="text-[#00E5FF]/60 mr-2 shrink-0" />
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type vocal directive (e.g. 'open terminal', 'find access keys')..."
            className="bg-transparent border-none outline-none text-[clamp(10px,0.75vw,12px)] text-white placeholder:text-white/30 font-medium w-full"
          />
          <button
            type="submit"
            disabled={!textInput.trim()}
            className="ml-2 p-1.5 rounded-full bg-[#00E5FF] disabled:bg-white/10 text-[#0A1A2F] disabled:text-white/20 transition-all shrink-0"
          >
            <Send size={12} />
          </button>
        </form>
      </div>

      {/* Footer System Telemetry & Command History */}
      <div className="w-full border-t border-white/5 pt-3 mt-2 shrink-0">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[clamp(8px,0.55vw,10px)] font-mono text-white/40">
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center sm:justify-start">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]"></span>
              <span className="text-white/60">SPEECH_CORE: v3.2_STABLE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity size={12} className="text-[#2ED8C3]" />
              <span className="text-white/60">PCM: 16kHz / 24kHz</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-[#00E5FF]" />
              <span>NEURAL DISPATCH: READY</span>
            </div>
          </div>

          {/* Recent Executed Log Pill */}
          {commandHistory.length > 0 && (
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/5">
              <CheckCircle2 size={12} className="text-[#2ED8C3] shrink-0" />
              <span className="text-white/60 truncate max-w-[280px]">
                LAST: {commandHistory[0].text}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveVoice;
