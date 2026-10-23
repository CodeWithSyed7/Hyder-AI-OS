
import React, { useState } from 'react';
import { Play, Code, Save, Bug, Sparkles, Terminal } from 'lucide-react';

const CodeMirror: React.FC = () => {
  const [code, setCode] = useState(`<html>
  <head>
    <style>
      body { background: #0f172a; color: #38bdf8; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
      .box { padding: 2rem; border: 2px solid #38bdf8; border-radius: 1rem; box-shadow: 0 0 20px rgba(56, 189, 248, 0.3); }
    </style>
  </head>
  <body>
    <div class="box">
      <h1>Hyder OS Preview</h1>
      <p>Neural terminal link established.</p>
    </div>
  </body>
</html>`);

  return (
    <div className="h-full flex flex-col p-3 sm:p-5 lg:p-6 overflow-y-auto custom-scrollbar min-h-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-4 sm:gap-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-slate-800 border border-slate-700 text-cyan-400">
            <Code size={18} />
          </div>
          <div>
            <h2 className="text-[clamp(15px,1.1vw,18px)] font-orbitron text-slate-200">CODE MIRROR</h2>
            <div className="text-[clamp(8px,0.6vw,10px)] text-slate-500 font-mono uppercase tracking-widest">WORKSPACE: /NEURAL_ENV/index.html</div>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-[clamp(10px,0.75vw,12px)] text-slate-400 border border-slate-700 hover:text-white transition-all">
            <Bug size={14} /> DEBUG_AI
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg bg-cyan-600 text-[clamp(10px,0.75vw,12px)] text-white border border-cyan-500 hover:bg-cyan-500 transition-all font-bold">
            <Play size={14} /> DEPLOY
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        <div className="flex flex-col rounded-xl overflow-hidden glass border border-slate-800 h-[300px] lg:h-auto">
          <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
            <span className="text-[clamp(10px,0.7vw,12px)] font-mono text-slate-500">SOURCE_EDITOR</span>
            <div className="flex gap-1.5">
              <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-red-500/50"></div>
              <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-yellow-500/50"></div>
              <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-green-500/50"></div>
            </div>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 bg-slate-950/80 p-4 md:p-6 font-mono text-[clamp(12px,0.85vw,14px)] text-cyan-500/80 outline-none resize-none leading-relaxed custom-scrollbar"
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col rounded-xl overflow-hidden glass border border-slate-800 bg-white h-[300px] lg:h-auto">
          <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center">
            <span className="text-[clamp(10px,0.7vw,12px)] font-mono text-slate-400 uppercase">Live Preview</span>
          </div>
          <iframe
            srcDoc={code}
            title="Preview"
            className="flex-1 w-full border-none"
          />
        </div>
      </div>

      <div className="mt-4 md:mt-6 flex flex-col md:flex-row gap-4 shrink-0">
        <div className="flex-1 glass rounded-xl border border-slate-800 p-3 md:p-4 flex items-center gap-3 md:gap-4">
          <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
            <Sparkles size={18} className="sm:w-[20px] sm:h-[20px]" />
          </div>
          <div className="flex-1">
            <input 
              type="text" 
              placeholder="Ask AI to modify this code..."
              className="w-full bg-transparent border-none outline-none text-[clamp(12px,0.85vw,14px)] text-slate-300"
            />
          </div>
          <button className="hidden sm:block text-[clamp(8px,0.6vw,10px)] font-orbitron bg-slate-800 px-3 py-2 rounded text-slate-400 hover:text-cyan-400 border border-slate-700 transition-all uppercase whitespace-nowrap">
            Execute Command
          </button>
        </div>
        
        <div className="w-full md:w-64 glass rounded-xl border border-slate-800 p-3 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Terminal size={14} className="text-slate-500" />
             <span className="text-[clamp(10px,0.7vw,12px)] font-mono text-slate-500">Terminal Output</span>
           </div>
           <span className="text-[clamp(10px,0.7vw,12px)] font-mono text-green-500">SUCCESS</span>
        </div>
      </div>
    </div>
  );
};

export default CodeMirror;
