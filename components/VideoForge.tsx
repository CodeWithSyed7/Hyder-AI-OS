
import React, { useState } from 'react';
import { Film, Play, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { generateVideo } from '../services/geminiService';

const VideoForge: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState('');

  const handleSynthesize = async () => {
    if (!prompt.trim() || isGenerating) return;
    
    // Check for API Key selection (Mocking based on prompt rules)
    if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
    }

    setIsGenerating(true);
    setStatus('Initializing VEO 3.1 Fast Engines...');
    
    try {
      const loadingMessages = [
        'Connecting to Google GenAI Cloud...',
        'Analyzing cinematic parameters...',
        'Encoding neural keyframes...',
        'Synthesizing physics engine...',
        'Finalizing render pass...'
      ];
      
      let msgIdx = 0;
      const interval = setInterval(() => {
        setStatus(loadingMessages[msgIdx % loadingMessages.length]);
        msgIdx++;
      }, 5000);

      const url = await generateVideo(prompt);
      clearInterval(interval);
      setVideoUrl(url);
    } catch (err) {
      console.error(err);
      setStatus('Render Failed. Project aborted.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col gap-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-orbitron text-purple-400">VIDEO FORGE</h2>
          <p className="text-slate-400 font-mono text-sm tracking-widest mt-1">POWERED BY VEO 3.1 GENERATIVE AI</p>
        </div>
        <div className="glass px-4 py-2 rounded-lg border border-purple-500/30 flex items-center gap-2 text-[10px] text-purple-400">
          <Sparkles size={14}/> PREMIUM COMPUTE ACTIVE
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        <div className="lg:col-span-1 space-y-4">
          <div className="glass p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-orbitron text-slate-500 uppercase tracking-widest">Cinema Prompt</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe motion, lighting, and subject... (e.g. A neon panther jumping through a portal, cinematic lighting, slow motion)"
                className="w-full h-40 bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-sm outline-none focus:border-purple-500/50 transition-all resize-none"
              />
            </div>
            
            <div className="flex items-start gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-[10px] text-purple-200">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>Video generation takes approx. 1-2 mins. Ensure high speed uplink is stable.</span>
            </div>

            <button 
              onClick={handleSynthesize}
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-orbitron py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Film size={18} />}
              {isGenerating ? 'RENDERING...' : 'SYNTHESIZE MOTION'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-3 relative">
          <div className="w-full h-full glass rounded-3xl border border-slate-800 flex items-center justify-center overflow-hidden bg-slate-950">
            {videoUrl ? (
              <video 
                src={videoUrl} 
                controls 
                autoPlay 
                loop 
                className="w-full h-full object-contain"
              />
            ) : isGenerating ? (
              <div className="flex flex-col items-center gap-6">
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-4 border-4 border-indigo-500/20 rounded-full"></div>
                  <div className="absolute inset-4 border-4 border-transparent border-b-indigo-500 rounded-full animate-[spin_1.5s_linear_infinite_reverse]"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Film size={32} className="text-purple-400 animate-pulse" />
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-orbitron text-xl text-purple-400 mb-2">{status}</div>
                  <div className="text-slate-500 text-xs font-mono">NEURAL_BLOCK_PROCESSING_SEQUENCE_88%</div>
                </div>
              </div>
            ) : (
              <div className="text-center opacity-30 flex flex-col items-center gap-4">
                <div className="p-12 border-4 border-dashed border-slate-900 rounded-full">
                  <Play size={64} className="text-slate-800" />
                </div>
                <p className="font-orbitron text-lg tracking-[0.5em]">DIRECTOR_STANDBY</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoForge;
