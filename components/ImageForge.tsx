
import React, { useState } from 'react';
import { ImageIcon, Wand2, Download, Maximize, Sparkles, Filter } from 'lucide-react';
import { generateImage, editImage } from '../services/geminiService';

const ImageForge: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageSize, setImageSize] = useState('1K');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    try {
      if (selectedFile) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = (e.target?.result as string).split(',')[1];
          const result = await editImage(base64, selectedFile.type, prompt);
          setGeneratedUrl(result);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        const result = await generateImage(prompt, aspectRatio, imageSize);
        setGeneratedUrl(result);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-6 lg:gap-8 h-full bg-[#050b18]/40 overflow-y-auto custom-scrollbar min-h-0">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-0 shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 sm:p-3 rounded-xl bg-[#00E5FF]/20 text-[#00E5FF] shrink-0">
              <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h2 className="text-[clamp(22px,2.5vw,44px)] font-orbitron font-black tracking-tighter text-white">NEURAL FORGE</h2>
          </div>
          <p className="text-white/30 font-mono text-[clamp(9px,0.7vw,12px)] tracking-[0.2em] sm:tracking-[0.3em] uppercase ml-11 sm:ml-14">Advanced Visual Synthesis & Curation</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center w-full lg:w-auto">
          <div className="flex bg-white/5 rounded-xl p-1 border border-white/5 shadow-inner w-full sm:w-auto overflow-x-auto custom-scrollbar">
            {['1:1', '16:9', '9:16', '3:2'].map(ratio => (
              <button 
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-[clamp(10px,0.75vw,12px)] rounded-lg font-orbitron tracking-widest transition-all whitespace-nowrap ${aspectRatio === ratio ? 'bg-[#00E5FF] text-[#0A1A2F] font-black' : 'text-white/40 hover:text-white'}`}
              >
                {ratio}
              </button>
            ))}
          </div>
          <select 
            value={imageSize}
            onChange={(e) => setImageSize(e.target.value)}
            className="w-full sm:w-auto bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-[clamp(10px,0.75vw,12px)] text-[#00E5FF] font-orbitron tracking-widest outline-none hover:bg-white/10 transition-colors"
          >
            <option value="1K">1K RESOLUTION</option>
            <option value="2K">2K RESOLUTION</option>
            <option value="4K">4K RESOLUTION</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 flex-1 min-h-0">
        <div className="lg:col-span-5 xl:col-span-4 space-y-4 sm:space-y-6 overflow-y-auto custom-scrollbar pr-1">
          <div className="glass-panel p-4 sm:p-6 lg:p-8 rounded-[24px] sm:rounded-[32px] border-white/5 space-y-4 sm:space-y-6 bg-white/[0.02]">
            <div className="space-y-2">
              <label className="text-[clamp(8px,0.55vw,10px)] font-orbitron text-white/30 uppercase tracking-[0.4em] font-black">Creative Directive</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the neural transformation..."
                className="w-full h-24 sm:h-36 bg-white/5 border border-white/10 rounded-[18px] sm:rounded-[24px] p-4 text-[clamp(12px,0.85vw,14px)] outline-none focus:border-[#00E5FF]/40 transition-all resize-none text-white/80 leading-relaxed placeholder:text-white/10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[clamp(8px,0.55vw,10px)] font-orbitron text-white/30 uppercase tracking-[0.4em] font-black">Input Substrate</label>
              <div className="relative h-24 sm:h-32 border-2 border-dashed border-white/10 rounded-[18px] sm:rounded-[24px] flex flex-col items-center justify-center hover:border-[#00E5FF]/30 transition-all cursor-pointer overflow-hidden bg-white/5 group">
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <Filter className="text-[#00E5FF] animate-pulse w-6 h-6" />
                    <div className="text-[#00E5FF] text-[clamp(9px,0.65vw,11px)] font-mono font-black tracking-widest truncate max-w-[180px]">{selectedFile.name}</div>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="text-white/10 group-hover:text-[#00E5FF]/40 transition-colors mb-1 w-6 h-6" />
                    <span className="text-[clamp(8px,0.55vw,10px)] text-white/20 uppercase font-orbitron tracking-widest">Inject Reference Image</span>
                  </>
                )}
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              className={`w-full py-3.5 sm:py-4 rounded-[18px] sm:rounded-[24px] font-orbitron font-black text-[clamp(11px,0.8vw,13px)] tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95 disabled:opacity-30
                ${selectedFile ? 'bg-gradient-to-r from-[#2ED8C3] to-[#00E5FF] text-[#0A1A2F]' : 'bg-white text-[#0A1A2F] hover:bg-[#00E5FF]'}
              `}
            >
              {isLoading ? <div className="w-4 h-4 border-2 border-[#0A1A2F]/20 border-t-[#0A1A2F] rounded-full animate-spin"></div> : <Wand2 size={16} />}
              {isLoading ? 'SYNCING...' : selectedFile ? 'FORGE TRANSFORMATION' : 'INITIALIZE SYNTHESIS'}
            </button>
          </div>

          <div className="glass-panel p-4 sm:p-6 rounded-[20px] sm:rounded-[28px] border-white/5 bg-white/[0.01]">
            <h4 className="text-[clamp(8px,0.55vw,10px)] font-orbitron text-white/20 uppercase mb-3 tracking-[0.3em] font-black">Neural Presets</h4>
            <div className="flex flex-wrap gap-2">
              {['Vibrant Oil', 'Glitch Art', 'Celestial Glow', 'Ukiyo-e', 'Claymation', 'Hyper-Real'].map(style => (
                <button 
                  key={style}
                  onClick={() => setPrompt(p => p + (p ? ', ' : '') + style)}
                  className="text-[clamp(8px,0.55vw,10px)] px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-white/40 hover:text-[#00E5FF] hover:border-[#00E5FF]/40 hover:bg-white/10 transition-all font-orbitron tracking-widest"
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 xl:col-span-8 relative h-full flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
          <div className="w-full h-full glass-panel rounded-[24px] sm:rounded-[40px] border-white/5 flex items-center justify-center overflow-hidden bg-black/40 shadow-[0_0_100px_rgba(0,0,0,0.5)] p-4">
            {generatedUrl ? (
              <div className="relative w-full h-full flex items-center justify-center group">
                <img 
                  src={generatedUrl} 
                  alt="Generated" 
                  className={`max-w-full max-h-full object-contain rounded-xl sm:rounded-2xl shadow-2xl transition-all duration-700 ${isLoading ? 'scale-95 opacity-50 blur-xl' : 'scale-100 opacity-100 blur-0'}`}
                />
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                  <a 
                    href={generatedUrl} 
                    download={`hyder-os-${Date.now()}.png`}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black font-orbitron font-black text-[clamp(9px,0.7vw,12px)] tracking-widest shadow-2xl hover:scale-105 active:scale-95"
                  >
                    <Download size={16} /> EXTRACT_DATA
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-white/10">
                <div className="relative">
                   <div className="w-20 h-20 sm:w-32 sm:h-32 border-2 border-white/5 rounded-full flex items-center justify-center animate-[spin_20s_linear_infinite]">
                     <Sparkles size={32} className="opacity-20 sm:w-[48px] sm:h-[48px]" />
                   </div>
                   <div className="absolute inset-0 w-20 h-20 sm:w-32 sm:h-32 border-2 border-dashed border-[#00E5FF]/10 rounded-full animate-[spin_30s_linear_infinite_reverse]"></div>
                </div>
                <p className="font-orbitron text-[clamp(8px,0.65vw,12px)] tracking-[0.4em] sm:tracking-[0.8em]">Awaiting Neural Stimulus</p>
              </div>
            )}
            
            {isLoading && (
              <div className="absolute inset-0 bg-[#0A1A2F]/40 backdrop-blur-md flex flex-col items-center justify-center gap-4 sm:gap-8 z-10 animate-pulse p-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-[#00E5FF]/10 border-t-[#00E5FF] rounded-full animate-spin"></div>
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <div className="font-orbitron text-[clamp(15px,1.1vw,18px)] text-[#00E5FF] font-black tracking-[0.3em] uppercase">Forging Patterns</div>
                  <div className="text-white/20 font-mono text-[clamp(8px,0.6vw,10px)] tracking-widest uppercase">Calculating Synaptic Coordinates...</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageForge;
