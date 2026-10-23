import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, 
  FileText, 
  Image as ImageIcon, 
  FileCode, 
  Archive, 
  ShieldAlert, 
  Search, 
  Mic, 
  MicOff, 
  Terminal, 
  RefreshCw, 
  Sliders, 
  ArrowLeft, 
  ExternalLink, 
  CheckCircle, 
  Send, 
  Play, 
  HardDrive, 
  Network, 
  ChevronRight, 
  Laptop, 
  Trash2, 
  FolderHeart,
  Wand2,
  X,
  FileDown,
  Activity,
  Maximize2,
  Minimize2,
  Globe,
  Youtube,
  MessageSquare,
  Users
} from 'lucide-react';

interface VirtualFile {
  id: string;
  name: string;
  type: 'document' | 'image' | 'script' | 'archive' | 'system' | 'folder';
  size: string;
  date: string;
  currentDir: string; // 'Desktop' | 'Documents' | 'Downloads' | 'Pictures' | 'System'
  content: string;
  imgUrl?: string;
}

const INITIAL_FILES: VirtualFile[] = [
  // Desktop
  { id: '1', name: 'wallpaper.jpg', type: 'image', size: '2.4 MB', date: '2026-05-30', currentDir: 'Desktop', content: 'Sci-fi holographic wallpaper matrix configuration.', imgUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop' },
  { id: '2', name: 'system_test_v2.sh', type: 'script', size: '1.2 KB', date: '2026-05-28', currentDir: 'Desktop', content: '#!/bin/bash\necho "Initializing Jervis Core..."\nsleep 2\nhyderos --status --diagnostics\necho "Neural uplink stable. All systems nominal."' },
  { id: '3', name: 'Operational_Manual.md', type: 'document', size: '4.5 KB', date: '2026-05-25', currentDir: 'Desktop', content: '# Operation Manual: Hyder OS Jervis Interface\n\n1. Voice Activation: Click the holographic Microphone and speak commands clearly.\n2. Supported Commands:\n   - "open Google"\n   - "open YouTube"\n   - "open WhatsApp"\n   - "find file [filename]"\n   - "organize files"\n   - "status check"\n3. File Vault is encrypted at L7 clearance.\n4. Ensure quantum drive maintains sub-ambient operating temperatures.' },
  
  // Documents
  { id: '4', name: 'project_blueprint.docx', type: 'document', size: '3.8 MB', date: '2026-05-29', currentDir: 'Documents', content: 'HYDER OS v2.0 Platform Blueprints.\nCore Architecture: Full-stack node-based reactive framework.\nFront-End Modality: Elegant glassmorphism, adaptive grid vectors.\nSub-systems: Image Forge (Veo API/Pro), Code Mirror Live Workspace, Cognitive Chat Uplinks.' },
  { id: '5', name: 'neural_network_logs.log', type: 'document', size: '124 KB', date: '2026-05-30', currentDir: 'Documents', content: '[2026-05-30 12:00:01] Neural Engine: SYNAPSE_REINIT_OK\n[2026-05-30 12:05:32] Memory Consolidation: COMPRESS_RATIO_84%\n[2026-05-30 14:12:00] Cognitive Thread: Latency 84ms\n[2026-05-30 15:45:10] Sensor Stream: WebSpeech recognizer bound.' },
  { id: '6', name: 'weekly_checklist.txt', type: 'document', size: '512 B', date: '2026-05-27', currentDir: 'Documents', content: '- [x] Update Gemini Flash-Lite routes.\n- [ ] Calibrate holographic visualizer colors.\n- [x] Configure responsive UI layouts for laptop modes.\n- [ ] Scan misplaced drive files.' },
  
  // Downloads
  { id: '7', name: 'invoice_9281.pdf', type: 'document', size: '412 KB', date: '2026-05-30', currentDir: 'Downloads', content: 'INVOICE #9281 - NEURAL CORE INC.\nBilled To: Hyder Architect\nQuantitiesOrdered:\n- Gemini Pro Subscriptions: x10\n- High-bandwidth fiber trunk: x2\n- Liquid cooling coolant: 50L\nTotal: $14,240.00\nStatus: PAID' },
  { id: '8', name: 'image_forge_v1.zip', type: 'archive', size: '45.2 MB', date: '2026-05-22', currentDir: 'Downloads', content: 'Archive file containing compiled visual nodes, creative texture overlays, and training substrate models for image synthesis.' },
  { id: '9', name: 'user_avatar_v2.png', type: 'image', size: '1.8 MB', date: '2026-05-29', currentDir: 'Downloads', content: 'Architect primary holographic bio portrait.', imgUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop' },

  // Pictures
  { id: '10', name: 'orion_nebula.png', type: 'image', size: '8.4 MB', date: '2026-05-18', currentDir: 'Pictures', content: 'Hubble visual capture of the Orion Nebular matrix.', imgUrl: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?w=800&auto=format&fit=crop' },
  { id: '11', name: 'quantum_chip.jpg', type: 'image', size: '1.4 MB', date: '2026-05-12', currentDir: 'Pictures', content: 'Hardware microscopic layout of the Josephson super-conducting matrix processor.', imgUrl: 'https://images.unsplash.com/photo-1601597111158-2fceff270190?w=800&auto=format&fit=crop' },

  // Misplaced System File
  { id: '12', name: 'misplaced_access_keys.conf', type: 'system', size: '3.4 KB', date: '2026-05-15', currentDir: 'System', content: '# CLASSIFIED SECURITY TOKENS\n# ENCRYPTION KEYS LEVEL 7\nCORE_ROOT_TOKEN=HYDER_SEC_TOKEN_82910\nAPI_UPLINK_BRIDGE=https://bridge.neural.core\nSECURE_SALT_KEY=0x7FA29EAA91B\n# SYSTEM NOTE: DO NOT Misplace this file under C:/System/secrets directory.' }
];

export const VirtualPC: React.FC = () => {
  const [currentDir, setCurrentDir] = useState<string>('Desktop');
  const [files, setFiles] = useState<VirtualFile[]>(() => {
    const saved = localStorage.getItem('hyder_virtual_filesystem');
    return saved ? JSON.parse(saved) : INITIAL_FILES;
  });
  
  // Search and scan features
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedPathResult, setScannedPathResult] = useState<string | null>(null);
  const [scanStep, setScanStep] = useState('');
  
  // App views
  const [activeTab, setActiveTab] = useState<'explorer' | 'network' | 'organizer'>('explorer');
  const [selectedFile, setSelectedFile] = useState<VirtualFile | null>(null);
  
  // Inside system browser app simulated windows
  const [activeWindow, setActiveWindow] = useState<'google' | 'youtube' | 'whatsapp' | 'file-reader' | null>(null);
  const [browserSearchInput, setBrowserSearchInput] = useState('');
  const [browserSearchDone, setBrowserSearchDone] = useState(false);
  
  // WhatsApp Simulated State
  const [waChats, setWaChats] = useState<{ sender: 'user' | 'jervis', message: string, time: string }[]>([
    { sender: 'jervis', message: 'Hello Architect! Visual neurolink for WhatsApp fully established. How can Jervis organize your network today?', time: '16:01' }
  ]);
  const [waInput, setWaInput] = useState('');
  
  // Voice Command Center Speech
  const [isListening, setIsListening] = useState(false);
  const [vocalTranscript, setVocalTranscript] = useState('');
  const [jervisFeedback, setJervisFeedback] = useState('Voice Command Center online. Say "open YouTube", "find database", or "organize files".');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem('hyder_virtual_filesystem', JSON.stringify(files));
  }, [files]);

  // Jervis Speech synthesis
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const sentence = new SpeechSynthesisUtterance(text);
      sentence.pitch = 1.0;
      sentence.rate = 1.05;
      const voices = window.speechSynthesis.getVoices();
      // Try to find a polite British accent (JARVIS style) or high quality voice
      const britishVoice = voices.find(v => v.lang.includes('GB') && v.name.includes('Google')) || 
                           voices.find(v => v.lang.includes('GB')) ||
                           voices.find(v => v.lang.includes('US')) ||
                           voices[0];
      if (britishVoice) sentence.voice = britishVoice;
      window.speechSynthesis.speak(sentence);
    }
  };

  // Sound recognition set up
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setVocalTranscript('Listening for vocal directives...');
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVocalTranscript(transcript);
        setIsListening(false);
        handleVoiceCommand(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (err: any) => {
        console.error('Vocal uplink error:', err);
        setIsListening(false);
        setVocalTranscript('Failed to catch neural voice wave. Standby.');
      };
    }
  }, [files]);

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        window.speechSynthesis.cancel(); // Mute existing voice before listing
        recognitionRef.current?.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleVoiceCommand = (commandText: string) => {
    const cmd = commandText.toLowerCase();
    
    if (cmd.includes('open google') || cmd.includes('launch google')) {
      setActiveWindow('google');
      setJervisFeedback('Holographic Google browser simulator initiated.');
      speakText('Right away. Launching Google interface.');
    } 
    else if (cmd.includes('open youtube') || cmd.includes('launch youtube')) {
      setActiveWindow('youtube');
      setJervisFeedback('Interactive YouTube projection activated.');
      speakText('Of course. Projecting YouTube grid.');
    } 
    else if (cmd.includes('open whatsapp') || cmd.includes('launch whatsapp')) {
      setActiveWindow('whatsapp');
      setJervisFeedback('WhatsApp secure contact panel active.');
      speakText('Establishing WhatsApp quantum chat bridges.');
    } 
    else if (cmd.includes('organize') || cmd.includes('clean') || cmd.includes('structure data')) {
      triggerFolderOrganization();
    } 
    else if (cmd.includes('find') || cmd.includes('misplaced') || cmd.includes('locate') || cmd.includes('search file')) {
      // Extract file name
      let requestedFile = '';
      if (cmd.includes('keys') || cmd.includes('access') || cmd.includes('misplaced_access_keys')) {
        requestedFile = 'misplaced_access_keys.conf';
      } else if (cmd.includes('wallpaper')) {
        requestedFile = 'wallpaper.jpg';
      } else if (cmd.includes('manual')) {
        requestedFile = 'Operational_Manual.md';
      } else if (cmd.includes('blueprint')) {
        requestedFile = 'project_blueprint.docx';
      } else if (cmd.includes('invoice')) {
        requestedFile = 'invoice_9281.pdf';
      } else if (cmd.includes('avatar')) {
        requestedFile = 'user_avatar_v2.png';
      } else {
        // Try searching for any word
        const words = cmd.split(' ');
        const findIndex = words.findIndex(w => w === 'find' || w === 'search' || w === 'locate');
        if (findIndex !== -1 && words[findIndex + 1]) {
          requestedFile = words.slice(findIndex + 1).join(' ').replace('file', '').trim();
        }
      }

      if (requestedFile) {
        executeScanningSearch(requestedFile);
      } else {
        setJervisFeedback('Jervis error: Please specify the file name clearly, e.g. "Find misplaced file keys"');
        speakText('I could not isolate the filename. Please repeat specifically.');
      }
    } 
    else if (cmd.includes('status') || cmd.includes('check system') || cmd.includes('diagnostic')) {
      setJervisFeedback('Diagnostic clear. All sectors reading nominal levels. Total files: ' + files.length);
      speakText('System diagnostics nominal. Storage node operations optimal.');
    }
    else {
      setJervisFeedback(`Command recognized locally: "${commandText}". No specific trigger folder file matched. Say "find keys" or "organize files".`);
      speakText(`Recognized directive: ${commandText}. Direct integration pending.`);
    }
  };

  // Holographic Scanner Search Method
  const executeScanningSearch = (targetName: string) => {
    setIsScanning(true);
    setScannedPathResult(null);
    setScanStep('Initializing Matrix Drive Scanner...');
    speakText('Running multi-sector scanning sequences across all local directories.');

    const fileToFind = files.find(f => f.name.toLowerCase().includes(targetName.toLowerCase()));

    setTimeout(() => {
      setScanStep('Connecting sectors... C:/Desktop [CLEAR] | C:/Documents [CLEAR]');
    }, 1200);

    setTimeout(() => {
      setScanStep('Retrieving deep memory clusters... Scanning Encrypted C:/System/secrets...');
    }, 2400);

    setTimeout(() => {
      if (fileToFind) {
        setScannedPathResult(`C:/${fileToFind.currentDir}/${fileToFind.name}`);
        setScanStep('Target pinpointed with 99.8% resolution!');
        setJervisFeedback(`Misplaced file "${fileToFind.name}" located at C:/${fileToFind.currentDir}/ directory.`);
        speakText(`File designated, ${fileToFind.name}, has been recovered in directory route, ${fileToFind.currentDir}. Projecting file readouts now.`);
        setSelectedFile(fileToFind);
        setActiveWindow('file-reader');
      } else {
        setScanStep('Sector scan completed. No matching node directories found.');
        speakText('Sector scans are negative. Target file is not written in active partition nodes.');
      }
      setIsScanning(false);
    }, 3800);
  };

  // Organize Files system
  const triggerFolderOrganization = () => {
    setJervisFeedback('Activating file sorting & memory compression engine...');
    speakText('Beginning automatic memory structure. Categorizing desktop downloads substrate into directories.');
    setIsScanning(true);
    setScanStep('Indexing misplaced files in directories...');

    setTimeout(() => {
      setScanStep('Re-allocating document files and logistics into C:/Documents...');
    }, 1200);

    setTimeout(() => {
      setScanStep('Mapping graphics assets into Jervis Holograph Library C:/Pictures...');
    }, 2400);

    setTimeout(() => {
      // Update directories of misplaced files for true functionality
      // Move downloads images to Pictures, desktop manual to Documents, move miscellaneous files
      const organized = files.map(f => {
        if (f.name === 'Operational_Manual.md') {
          return { ...f, currentDir: 'Documents' };
        }
        if (f.name === 'user_avatar_v2.png') {
          return { ...f, currentDir: 'Pictures' };
        }
        if (f.name === 'system_test_v2.sh') {
          return { ...f, currentDir: 'System' };
        }
        return f;
      });

      setFiles(organized);
      setScanStep('System optimization complete! 3 files structurally relocated.');
      setJervisFeedback('Cleanup completed. Desktop manual relocated to Documents, Avatar relocated to Pictures, Shell code moved to System.');
      speakText('Folder optimization sequence successfully executed. Directory registers optimized and cleaned.');
      setIsScanning(false);
    }, 3800);
  };

  const currentDirFiles = files.filter(f => f.currentDir.toLowerCase() === currentDir.toLowerCase());

  const driveUsagePercent = Math.round((files.length / 32) * 100);

  return (
    <div className="w-full h-full flex flex-col bg-[#050b18]/10 text-white overflow-hidden min-h-0">
      
      {/* Holographic Voice Assist Wave at Top */}
      <div className="p-3 sm:p-5 lg:p-6 border-b border-white/5 bg-white/[0.01] backdrop-blur-md flex flex-col md:flex-row gap-4 sm:gap-6 items-center justify-between shrink-0">
        <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-[#00E5FF] to-[#2ED8C3] flex items-center justify-center text-[#0A1A2F] shadow-[0_0_20px_rgba(0,e5,ff,0.3)] animate-pulse shrink-0">
            <Laptop size={20} className="sm:w-[24px] sm:h-[24px]" />
          </div>
          <div>
            <h2 className="text-[clamp(16px,1.3vw,24px)] font-orbitron font-black tracking-tight flex items-center gap-2 flex-wrap">
              JERVIS DESKTOP CORE <span className="text-[clamp(9px,0.7vw,12px)] font-mono px-2.5 py-0.5 sm:px-3 sm:py-1 bg-[#00E5FF]/10 text-[#00E5FF] rounded-full border border-[#00E5FF]/20 uppercase">File Vault Enabled</span>
            </h2>
            <p className="text-[clamp(10px,0.75vw,12px)] text-white/40 font-mono tracking-widest mt-0.5">HOST: HYDER_OS_COGNITIVE_ARRAY</p>
          </div>
        </div>

        {/* Vocal Interface Wave Center */}
        <div className="flex-1 max-w-lg w-full bg-white/[0.02] border border-white/5 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 px-3 sm:px-5 flex items-center gap-3 sm:gap-4">
          <button 
            onClick={toggleVoice}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-[14px] sm:rounded-[18px] flex items-center justify-center transition-all shrink-0 ${isListening ? 'bg-red-500 text-white animate-pulse shadow-[0_0_20px_#ef4444]' : 'bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/20'}`}
            title="Trigger Jervis Speech Recognition Node"
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-[clamp(9px,0.65vw,11px)] font-orbitron font-bold text-[#00E5FF] tracking-wider uppercase">Jervis Vocal Transceiver</div>
            <p className="text-[clamp(10px,0.75vw,12px)] text-white/70 font-mono truncate">{vocalTranscript || jervisFeedback}</p>
          </div>
          {isListening && (
            <div className="flex gap-1 h-4 sm:h-5 items-end shrink-0">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-1 bg-[#00E5FF] rounded-full animate-bounce" style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `.${i}s` }}></div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Filesystem Layout Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-y-auto custom-scrollbar min-h-0">
        
        {/* Left Drive Navigation */}
        <div className="lg:col-span-3 border-r border-white/5 p-4 sm:p-6 space-y-6 sm:space-y-8 bg-black/10 overflow-y-auto custom-scrollbar">
          <div className="space-y-2.5 sm:space-y-3">
             <div className="text-[clamp(8px,0.55vw,10px)] font-orbitron text-white/30 uppercase tracking-[0.25em] font-black">Storage Mounts</div>
             
             <div className="space-y-1">
                {[
                  { name: 'Desktop', dir: 'Desktop', icon: FolderHeart },
                  { name: 'Personal Documents', dir: 'Documents', icon: Folder },
                  { name: 'Transferred Downloads', dir: 'Downloads', icon: Folder },
                  { name: 'Holo Pictures', dir: 'Pictures', icon: Folder },
                  { name: 'Secure System Core', dir: 'System', icon: Folder }
                ].map((item) => (
                  <button 
                    key={item.dir}
                    onClick={() => { setCurrentDir(item.dir); setActiveTab('explorer'); }}
                    className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all border text-left ${currentDir === item.dir && activeTab === 'explorer' ? 'bg-white text-black border-white shadow-[0_10px_20px_rgba(255,255,255,0.05)] font-bold' : 'bg-transparent border-transparent text-white/50 hover:bg-white/5 hover:text-white'}`}
                  >
                     <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <item.icon size={15} className={`shrink-0 ${currentDir === item.dir && activeTab === 'explorer' ? 'text-black' : 'text-[#00E5FF]'}`} />
                        <span className="text-[clamp(11px,0.78vw,13px)] font-orbitron uppercase tracking-wider truncate">{item.name}</span>
                     </div>
                  </button>
                ))}
             </div>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
             <div className="text-[clamp(8px,0.55vw,10px)] font-orbitron text-white/30 uppercase tracking-[0.25em] font-black">Network Grid</div>
             <button 
               onClick={() => setActiveTab('network')}
               className={`w-full flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl transition-all border text-left ${activeTab === 'network' ? 'bg-white text-black border-white font-bold' : 'bg-transparent border-transparent text-white/50 hover:bg-white/5 hover:text-white'}`}
             >
                <Network size={15} className={`shrink-0 ${activeTab === 'network' ? 'text-black' : 'text-[#00E5FF]'}`} />
                <span className="text-[clamp(11px,0.78vw,13px)] font-orbitron uppercase tracking-wider">Bridges & Nodes</span>
             </button>
          </div>

          <div className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 border-t border-white/5">
            <div className="text-[clamp(8px,0.55vw,10px)] font-orbitron text-white/30 uppercase tracking-[0.25em] font-black">Memory Statistics</div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-3 sm:p-4 space-y-3 sm:space-y-4 shadow-inner">
               <div className="flex items-center gap-2 justify-between">
                  <span className="text-[clamp(9px,0.65vw,11px)] font-orbitron font-bold text-white/40 uppercase">Drive (C:) Sector Load</span>
                  <span className="text-[clamp(11px,0.8vw,13px)] font-mono font-bold text-[#00E5FF]">{driveUsagePercent}%</span>
               </div>
               <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#00E5FF] to-[#2ED8C3]" style={{ width: `${driveUsagePercent}%` }}></div>
               </div>
               <div className="flex justify-between font-mono text-[clamp(8px,0.55vw,10px)] text-white/30">
                  <span>Capacity: L7 Sector Vault</span>
                  <span>Files: {files.length} / 32</span>
               </div>
            </div>
          </div>

          <div className="pt-1">
            <button 
              onClick={() => setActiveTab('organizer')}
              className={`w-full flex items-center justify-center gap-2 p-3 px-4 rounded-2xl transition-all border font-orbitron text-[clamp(9px,0.65vw,11px)] uppercase tracking-widest ${activeTab === 'organizer' ? 'bg-[#00E5FF] text-[#0A1A2F] border-[#00E5FF] font-black' : 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/20 hover:bg-[#00E5FF]/20'}`}
            >
              <Wand2 size={14} /> Neural Organizer App
            </button>
          </div>
        </div>

        {/* Directory/File Explorer Sub-panel Content */}
        <div className="lg:col-span-9 p-4 sm:p-6 lg:p-8 flex flex-col bg-[#050b18]/20 relative overflow-y-auto custom-scrollbar">
          
          {/* Diagnostic Loading Scanner Screen Overlay */}
          {isScanning && (
            <div className="absolute inset-0 bg-[#0A1A2F]/90 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 gap-6 animate-fade-in">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#00E5FF] animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-[#00E5FF]">
                  <Activity size={28} className="animate-pulse" />
                </div>
              </div>
              <div className="text-center max-w-md space-y-2">
                <h4 className="font-orbitron font-black text-[#00E5FF] text-[clamp(13px,0.95vw,16px)] tracking-widest uppercase">System Search Stream Active</h4>
                <div className="text-white/60 text-[clamp(11px,0.8vw,13px)] font-mono p-3 bg-black/40 border border-white/5 rounded-2xl h-14 w-72 overflow-hidden flex items-center justify-center text-center">
                  <span className="animate-pulse">{scanStep}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'explorer' && (
            <div className="flex-1 flex flex-col gap-4 sm:gap-6">
              {/* Explorer Header */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between border-b border-white/5 pb-4 sm:pb-6">
                <div>
                  <div className="flex items-center gap-2 text-[clamp(10px,0.75vw,12px)] text-[#00E5FF] font-mono uppercase tracking-widest font-black">
                    <HardDrive size={13} /> <span>System Partition C:/</span> <ChevronRight size={12} /> <span className="text-white/60">{currentDir}</span>
                  </div>
                  <h3 className="text-[clamp(16px,1.3vw,24px)] font-orbitron font-black tracking-tight mt-1">FILES & REPLICA BLOCKS</h3>
                </div>

                {/* Local search bar */}
                <div className="flex bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 bg-[#0A1A2F] gap-2 items-center w-full sm:w-64">
                  <Search size={14} className="text-[#00E5FF]/40 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search current dir..."
                    className="bg-transparent border-none outline-none text-[clamp(11px,0.8vw,13px)] w-full text-white placeholder:text-white/20"
                  />
                </div>
              </div>

              {/* Grid directory contents */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 overflow-y-auto custom-scrollbar pr-1">
                {currentDirFiles.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).map((file) => {
                  const Icon = file.type === 'image' ? ImageIcon : file.type === 'script' ? FileCode : file.type === 'archive' ? Archive : file.type === 'system' ? ShieldAlert : FileText;
                  
                  return (
                    <div 
                      key={file.id}
                      onClick={() => setSelectedFile(file)}
                      onDoubleClick={() => { setSelectedFile(file); setActiveWindow('file-reader'); }}
                      className={`group p-3.5 sm:p-4 rounded-[20px] border transition-all cursor-pointer flex flex-col justify-between ${selectedFile?.id === file.id ? 'bg-[#00E5FF]/20 border-[#00E5FF] shadow-[0_0_15px_rgba(0,e5,ff,0.1)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.05]'}`}
                    >
                      <div className="flex items-start justify-between">
                         <div className="p-2.5 rounded-xl bg-[#0A1A2F]/80 text-[#00E5FF] shrink-0">
                            <Icon size={18} />
                         </div>
                         <div className="text-[clamp(9px,0.65vw,11px)] font-mono text-white/30 tracking-widest uppercase">{file.size}</div>
                      </div>

                      <div className="mt-3">
                         <h4 className="font-orbitron font-black text-[clamp(11px,0.8vw,13px)] text-white uppercase tracking-wider truncate mb-0.5 group-hover:text-[#00E5FF] transition-colors">{file.name}</h4>
                         <span className="text-[clamp(8px,0.55vw,10px)] font-mono text-white/20 font-bold uppercase tracking-widest">{file.type} Node</span>
                      </div>

                      <div className="mt-3 flex justify-between items-center bg-black/20 p-2 rounded-xl border border-white/5">
                         <div className="text-[clamp(8px,0.55vw,10px)] font-mono text-white/40">Mod: {file.date}</div>
                         <button 
                           onClick={(e) => { e.stopPropagation(); setSelectedFile(file); setActiveWindow('file-reader'); }}
                           className="text-[clamp(8px,0.55vw,10px)] font-orbitron font-black text-[#00E5FF] uppercase border border-[#00E5FF]/20 px-2 py-0.5 rounded hover:bg-[#00E5FF] hover:text-black transition-all"
                         >
                           Open Block
                         </button>
                      </div>
                    </div>
                  );
                })}

                {currentDirFiles.length === 0 && (
                  <div className="col-span-full py-16 flex flex-col items-center text-center text-white/20">
                     <Folder size={48} className="stroke-1 animate-pulse" />
                     <p className="font-orbitron tracking-widest text-[clamp(11px,0.8vw,13px)] uppercase mt-4">This folder volume is fully empty.</p>
                     <p className="text-[clamp(10px,0.7vw,12px)] font-mono mt-2">Trigger Organizer system parameters to structure files.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'network' && (
            <div className="flex-1 flex flex-col justify-center items-center text-center max-w-xl mx-auto space-y-8 animate-slide-in">
              <div className="w-20 h-20 rounded-[28px] bg-[#00E5FF]/10 border border-[#00E5FF]/20 flex items-center justify-center text-[#00E5FF] animate-pulse">
                <Network size={36} />
              </div>
              <div className="space-y-3">
                 <h3 className="font-orbitron font-black text-[clamp(15px,1.1vw,18px)] uppercase text-white tracking-widest">Bridged Applications & Networks</h3>
                 <p className="text-[clamp(11px,0.8vw,13px)] text-white/40 leading-relaxed max-w-md">Quantum routing networks verified. Launch browser overlays to control the following applications natively inside Hyder OS voice center.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                 {[
                   { name: 'Google Workspace', icon: Globe, click: 'google', color: 'text-blue-400' },
                   { name: 'YouTube Intel', icon: Youtube, click: 'youtube', color: 'text-red-400' },
                   { name: 'WhatsApp Web', icon: MessageSquare, click: 'whatsapp', color: 'text-green-400' }
                 ].map((link) => (
                    <button 
                      key={link.name}
                      onClick={() => setActiveWindow(link.click as any)}
                      className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all text-center flex flex-col items-center gap-3 group"
                    >
                       <link.icon size={28} className={`${link.color} group-hover:scale-115 transition-transform`} />
                       <span className="text-[clamp(10px,0.7vw,12px)] font-orbitron font-black uppercase tracking-widest text-white/80">{link.name}</span>
                    </button>
                 ))}
              </div>
            </div>
          )}

          {activeTab === 'organizer' && (
            <div className="flex-1 flex flex-col justify-center items-center max-w-2xl mx-auto space-y-8 animate-slide-in p-6 md:p-12">
              <div className="w-28 h-28 rounded-[40px] bg-gradient-to-tr from-[#00E5FF]/20 to-[#2ED8C3]/20 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] relative">
                 <div className="absolute inset-0 bg-[#00E5FF]/5 rounded-[40px] animate-ping opacity-60"></div>
                 <Sliders size={48} />
              </div>

              <div className="space-y-4 text-center">
                 <h3 className="font-orbitron font-black text-[clamp(20px,1.6vw,26px)] uppercase tracking-tighter text-white">Quantum Disk Optimizer</h3>
                 <p className="text-[clamp(12px,0.85vw,14px)] text-white/40 leading-relaxed max-w-md">The file database is scattered with Downloads and Desktop items mismatching our partition slots. Optimize C:/ Sector registers dynamically using Jervis organizational algorithms.</p>
              </div>

              <div className="p-4 border-2 border-dashed border-[#00E5FF]/20 rounded-2xl bg-[#011425] w-full text-center space-y-2">
                 <div className="text-[clamp(10px,0.7vw,12px)] font-orbitron font-bold text-[#00E5FF] tracking-widest uppercase">Target Structural relocation:</div>
                 <p className="text-[clamp(11px,0.75vw,13px)] font-mono text-white/60">{'Desktop Operating Manual → Documents | Download Avatar Portrait → Pictures | Miscellaneous modules → System'}</p>
              </div>

              <button 
                onClick={triggerFolderOrganization}
                className="w-full sm:w-auto px-12 py-5 rounded-full bg-white text-[#0A1A2F] font-orbitron font-black text-[clamp(11px,0.8vw,13px)] tracking-[0.2em] uppercase hover:bg-[#00E5FF] hover:scale-105 active:scale-95 shadow-2xl shadow-[#00e5ff]/10"
              >
                Launch Structuring Algorithm
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER VOCAL TIPS */}
      <div className="p-4 border-t border-white/5 bg-black/20 text-center text-white/30 font-mono text-[clamp(8px,0.6vw,10px)] flex flex-col sm:flex-row justify-between items-center gap-2 uppercase tracking-widest">
         <span>Jervis Voice Assistant Subsystem ready. Vocal commands active.</span>
         <span className="text-[#00E5FF] font-bold">Speech Recognition: WebSpeech Native Channel</span>
      </div>

      {/* SIMULATOR MODALS INTERACTION WINDOWS */}
      {activeWindow === 'google' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[600] flex items-center justify-center p-4">
           <div className="w-full max-w-4xl h-[80vh] glass-panel border border-white/10 rounded-[32px] overflow-hidden flex flex-col bg-[#050b18]">
              {/* Browser bar */}
              <div className="p-4 border-b border-white/5 bg-[#011425] flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="flex gap-1.5">
                       <button onClick={() => setActiveWindow(null)} className="w-3.5 h-3.5 rounded-full bg-red-500 hover:scale-110 transition-all"></button>
                       <div className="w-3.5 h-3.5 rounded-full bg-yellow-500"></div>
                       <div className="w-3.5 h-3.5 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex items-center gap-2 text-[#00E5FF] font-orbitron font-black tracking-widest text-[clamp(9px,0.7vw,12px)] uppercase">
                       <Globe size={14} /> Google Matrix Simulator
                    </div>
                 </div>
                 <button onClick={() => window.open('https://google.com', '_blank')} className="text-white/30 hover:text-white flex items-center gap-2 hover:underline transition-all text-[clamp(9px,0.65vw,11px)] font-mono uppercase tracking-wider">
                    Open Real Google <ExternalLink size={10} />
                 </button>
              </div>

              {/* Simulated Browser Body */}
              <div className="flex-1 overflow-y-auto p-8 md:p-16 flex flex-col justify-center items-center">
                 <div className="text-center w-full max-w-lg space-y-10">
                    <h2 className="text-[clamp(32px,3vw,50px)] font-orbitron font-black tracking-tighter text-white">
                      Google<span className="text-[#00E5FF]">_Matrix</span>
                    </h2>
                    
                    <div className="relative flex items-center gap-3 bg-white/5 border border-white/10 rounded-full p-2.5 px-6 focus-within:border-[#00E5FF]/40 bg-[#0A1A2F]">
                       <Search size={18} className="text-[#00E5FF]/50" />
                       <input 
                         type="text" 
                         value={browserSearchInput}
                         onChange={(e) => setBrowserSearchInput(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && setBrowserSearchDone(true)}
                         placeholder="Synthesize search query..."
                         className="bg-transparent border-none outline-none text-[clamp(12px,0.85vw,15px)] w-full text-white placeholder:text-white/20"
                       />
                       {browserSearchInput && (
                         <button 
                           onClick={() => setBrowserSearchDone(true)}
                           className="bg-[#00E5FF] text-[#0A1A2F] py-2 px-5 rounded-full font-orbitron font-black text-[clamp(9px,0.65vw,11px)] tracking-widest"
                         >
                           Search
                         </button>
                       )}
                    </div>

                    {browserSearchDone ? (
                      <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 space-y-4 text-left animate-slide-in">
                         <div className="text-[clamp(10px,0.7vw,12px)] font-orbitron font-bold text-[#00E5FF] uppercase tracking-wider">Search outcome synthesis:</div>
                         <h4 className="text-[clamp(12px,0.85vw,14px)] font-bold text-white uppercase tracking-wider underline">Neural Matrix analysis on "{browserSearchInput}"</h4>
                         <p className="text-[clamp(11px,0.8vw,13px)] text-white/50 leading-relaxed">Search bridged to Google live indices. Outcome matching indicates quantum diagnostics show perfect coherence. Jervis advises further synthesis via Code Mirror or Image Forge applications.</p>
                      </div>
                    ) : (
                      <div className="flex justify-center gap-4 text-white/30 font-mono text-[clamp(9px,0.65vw,11px)] uppercase tracking-widest">
                         <span>Speech Search: Enabled</span>
                         <span>●</span>
                         <span>No Search History</span>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeWindow === 'youtube' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[600] flex items-center justify-center p-4">
           <div className="w-full max-w-4xl h-[80vh] glass-panel border border-white/10 rounded-[32px] overflow-hidden flex flex-col bg-[#050b18]">
              {/* YouTube Header */}
              <div className="p-4 border-b border-white/5 bg-[#011425] flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="flex gap-1.5">
                       <button onClick={() => setActiveWindow(null)} className="w-3.5 h-3.5 rounded-full bg-red-500 hover:scale-110 transition-all"></button>
                       <div className="w-3.5 h-3.5 rounded-full bg-yellow-500"></div>
                       <div className="w-3.5 h-3.5 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex items-center gap-2 text-red-500 font-orbitron font-black tracking-widest text-[clamp(9px,0.7vw,12px)] uppercase">
                       <Youtube size={14} /> YouTube Hologram Player
                    </div>
                 </div>
                 <button onClick={() => window.open('https://youtube.com', '_blank')} className="text-white/30 hover:text-white flex items-center gap-2 hover:underline transition-all text-[clamp(9px,0.65vw,11px)] font-mono uppercase tracking-wider">
                    Open Real YouTube <ExternalLink size={10} />
                 </button>
              </div>

              {/* Video browser body */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-black/20">
                 <div className="text-center space-y-2">
                    <h3 className="font-orbitron font-black text-[clamp(20px,1.6vw,26px)] tracking-tighter text-white">CURATED HIGHLIGHTS</h3>
                    <p className="text-[clamp(11px,0.8vw,13px)] text-white/40 font-mono leading-relaxed uppercase tracking-widest">Quantum stream feed compiled under diagnostic directives</p>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[
                      { title: 'Intro to Jervis Cybernetics', length: '12:43', author: 'Hyder OS Systems', views: '2.4M', bg: 'from-blue-600/30 to-indigo-600/30' },
                      { title: 'AI Assistant holographic visualizer training', length: '24:12', author: 'Quantum Grid Labs', views: '1.2M', bg: 'from-purple-600/30 to-pink-600/30' },
                      { title: 'Designing High-polishing minimalist Operating Systems', length: '8:45', author: 'Synthesia Designer', views: '840K', bg: 'from-cyan-600/30 to-emerald-600/30' },
                      { title: 'Web speech recognition algorithms masterclass', length: '54:10', author: 'Coding Sentinel', views: '410K', bg: 'from-orange-600/30 to-red-600/30' }
                    ].map((vid) => (
                       <div key={vid.title} className="p-4 rounded-3xl bg-white/[0.01] border border-white/5 space-y-4 hover:border-white/20 transition-all flex flex-col justify-between cursor-pointer group">
                          {/* Mock video frame */}
                          <div className={`h-40 rounded-2xl bg-gradient-to-tr ${vid.bg} border border-white/5 flex items-center justify-center relative overflow-hidden group-hover:scale-[1.01] transition-transform`}>
                             <Play size={36} className="text-white group-hover:scale-130 transition-transform filter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
                             <span className="absolute bottom-3 right-3 text-[clamp(8px,0.6vw,10px)] font-mono font-bold bg-black/80 px-2.5 py-1 rounded-md">{vid.length}</span>
                          </div>
                          
                          <div>
                             <h4 className="font-bold text-[clamp(12px,0.85vw,14px)] text-white line-clamp-1 group-hover:text-[#00E5FF] transition-colors uppercase tracking-wide mt-2">{vid.title}</h4>
                             <p className="text-[clamp(10px,0.7vw,12px)] text-white/40 font-mono mt-1">{vid.author} • {vid.views} visualizers</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeWindow === 'whatsapp' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[600] flex items-center justify-center p-4">
           <div className="w-full max-w-4xl h-[80vh] glass-panel border border-white/10 rounded-[32px] overflow-hidden flex flex-col bg-[#050b18]">
              {/* WhatsApp Header */}
              <div className="p-4 border-b border-white/5 bg-[#011425] flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="flex gap-1.5">
                       <button onClick={() => setActiveWindow(null)} className="w-3.5 h-3.5 rounded-full bg-red-500 hover:scale-110 transition-all"></button>
                       <div className="w-3.5 h-3.5 rounded-full bg-yellow-500"></div>
                       <div className="w-3.5 h-3.5 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex items-center gap-2 text-green-500 font-orbitron font-black tracking-widest text-[clamp(9px,0.7vw,12px)] uppercase">
                       <MessageSquare size={14} /> Secure Neuroweb Telegram/WhatsApp
                    </div>
                 </div>
                 <button onClick={() => window.open('https://web.whatsapp.com', '_blank')} className="text-white/30 hover:text-white flex items-center gap-2 hover:underline transition-all text-[clamp(9px,0.65vw,11px)] font-mono uppercase tracking-wider">
                    Open Real WhatsApp <ExternalLink size={10} />
                 </button>
              </div>

              {/* Chat Sub-panels layout */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-0 overflow-hidden">
                 
                 {/* Contact column */}
                 <div className="md:col-span-4 border-r border-white/5 flex flex-col bg-black/25">
                    <div className="p-4 border-b border-white/5 font-orbitron font-black tracking-widest text-[clamp(9px,0.7vw,12px)] text-white/40 uppercase">ACTIVE SYNAPSES</div>
                    <div className="flex-1 overflow-y-auto space-y-1 p-2">
                       {[
                         { name: 'JARVIS SECURE NODE', status: 'Online', mood: 'british assistance' },
                         { name: 'HYDER URDU NODE', status: 'Online', mood: 'friendly system' },
                         { name: 'COGNITIVE COMPUTE', status: 'Idle', mood: 'cluster load 3%' }
                       ].map((node, idx) => (
                          <div key={idx} className={`p-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-all ${idx === 0 ? 'bg-[#00E5FF]/10 border border-[#00E5FF]/20 text-white' : 'hover:bg-white/5 text-white/50'}`}>
                             <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-500 to-emerald-500 flex items-center justify-center text-[#0A1A2F]">
                                <Users size={16} />
                             </div>
                             <div className="flex-1 min-w-0">
                                <h5 className="font-bold text-[clamp(11px,0.8vw,13px)] uppercase tracking-wider truncate text-white">{node.name}</h5>
                                <p className="text-[clamp(9px,0.65vw,11px)] text-[#00E5FF] font-mono truncate">{node.status} • {node.mood}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* Message column panel */}
                 <div className="md:col-span-8 flex flex-col bg-black/10 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col justify-end">
                       {waChats.map((msg, i) => (
                          <div key={i} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                             <div className={`p-3.5 px-5 rounded-2xl text-[clamp(11px,0.8vw,13px)] leading-relaxed ${msg.sender === 'user' ? 'bg-[#00E5FF] text-[#0A1A2F] font-bold self-end' : 'bg-white/5 border border-white/5 text-white/90 self-start'}`}>
                                {msg.message}
                             </div>
                             <span className="text-[clamp(8px,0.55vw,10px)] font-mono text-white/30 tracking-widest mt-1 p-1">{msg.time}</span>
                          </div>
                       ))}
                    </div>

                    {/* Chat Text area input bar */}
                    <div className="p-4 border-t border-white/5 bg-[#011425] flex items-center gap-3">
                       <input 
                         type="text" 
                         value={waInput}
                         onChange={(e) => setWaInput(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && setWaChats(c => [...c, { sender: 'user', message: waInput, time: '16:03' }])}
                         placeholder="Transmit direct telegram vector..."
                         className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 outline-none text-[clamp(11px,0.8vw,13px)] text-white focus:border-[#00E5FF]/40"
                       />
                       <button 
                         onClick={() => {
                           if (!waInput.trim()) return;
                           setWaChats(c => [...c, { sender: 'user', message: waInput, time: '16:03' }]);
                           setWaInput('');
                         }}
                         className="w-10 h-10 rounded-full bg-[#00E5FF] text-[#0A1A2F] hover:bg-white flex items-center justify-center transition-all shadow-lg shrink-0"
                       >
                          <Send size={16} />
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeWindow === 'file-reader' && selectedFile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[600] flex items-center justify-center p-4 animate-fade-in">
           <div className="w-full max-w-3xl h-[70vh] glass-panel border border-[#00E5FF]/30 rounded-[32px] overflow-hidden flex flex-col bg-[#050b18] shadow-[0_0_50px_rgba(0,e5,ff,0.15)]">
              {/* Reader bar */}
              <div className="p-4 border-b border-white/5 bg-[#011425] flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#00E5FF]/10 text-[#00E5FF] rounded-lg border border-[#00E5FF]/20">
                       <FileText size={16} />
                    </div>
                    <div>
                       <h4 className="font-orbitron font-black text-[clamp(11px,0.8vw,13px)] text-white uppercase tracking-wider">{selectedFile.name}</h4>
                       <span className="text-[clamp(9px,0.65vw,11px)] font-mono text-[#00E5FF] uppercase font-bold tracking-widest">{selectedFile.size} • Partition Storage</span>
                    </div>
                 </div>
                 
                 <div className="flex gap-2">
                    <button 
                      onClick={() => speakText(selectedFile.content)}
                      className="text-[clamp(9px,0.65vw,11px)] font-orbitron font-black text-[#00E5FF] border border-[#00E5FF]/20 bg-[#00E5FF]/10 px-3.5 py-1.5 rounded-lg hover:bg-[#00E5FF] hover:text-black transition-all"
                    >
                       Speak File
                    </button>
                    <button 
                      onClick={() => setActiveWindow(null)} 
                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white"
                    >
                       <X size={16} />
                    </button>
                 </div>
              </div>

              {/* Reader Display */}
              <div className="flex-1 overflow-y-auto p-8 font-mono text-[clamp(12px,0.85vw,14px)] leading-relaxed text-white/80 space-y-6">
                 {selectedFile.type === 'image' && selectedFile.imgUrl ? (
                    <div className="flex flex-col items-center gap-4">
                       <div className="w-full max-h-80 rounded-xl overflow-hidden shadow-2xl border border-white/10 relative">
                          <img src={selectedFile.imgUrl} alt={selectedFile.name} className="w-full object-cover max-h-80" />
                       </div>
                       <div className="text-center font-orbitron text-[clamp(11px,0.8vw,13px)] font-black tracking-widest text-[#00E5FF]">{selectedFile.content}</div>
                    </div>
                 ) : (
                    <pre className="whitespace-pre-wrap font-mono p-5 bg-[#011425]/60 border border-white/5 rounded-2xl max-h-full overflow-y-auto leading-relaxed text-[clamp(11px,0.8vw,13px)] text-cyan-400">
                       {selectedFile.content}
                    </pre>
                 )}
                 
                 <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4 text-[clamp(11px,0.8vw,13px)]">
                    <div className="p-3 bg-white/[0.01] rounded-xl border border-white/5 font-mono">
                       <span className="text-white/30 uppercase text-[clamp(9px,0.65vw,11px)] font-orbitron font-black tracking-widest block">System Path</span>
                       <span className="text-[#00E5FF]">C:/{selectedFile.currentDir}/{selectedFile.name}</span>
                    </div>
                    <div className="p-3 bg-white/[0.01] rounded-xl border border-white/5 font-mono">
                       <span className="text-white/30 uppercase text-[clamp(9px,0.65vw,11px)] font-orbitron font-black tracking-widest block">Neural Substrate Integrity</span>
                       <span className="text-green-400">Stable Node Block Verified</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default VirtualPC;
