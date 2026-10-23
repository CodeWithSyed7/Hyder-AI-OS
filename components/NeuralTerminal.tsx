
import React, { useState, useRef, useEffect } from 'react';
import { Send, Globe, Cpu, Sparkles, Wand2, Terminal as TerminalIcon, Mic, MicOff, Zap, Search, Bookmark, Trash2, CheckCircle2 } from 'lucide-react';
import { ChatMessage, Persona } from '../types';
import { chatWithGemini } from '../services/geminiService';
import { skillRegistry } from '../services/skillIntelligence/skillRegistry';
import { neuralMemory } from '../services/neuralMemoryService';

interface NeuralTerminalProps {
  persona: Persona;
  onCommand?: (cmd: string) => void;
  onStatusChange?: (mood: 'idle' | 'happy' | 'thinking' | 'talking') => void;
  customInstructions?: string;
  onOpenMemory?: () => void;
}

const NeuralTerminal: React.FC<NeuralTerminalProps> = ({ persona, onCommand, onStatusChange, customInstructions, onOpenMemory }) => {
  // Load persistent chat history across sessions
  const [messages, setMessages] = useState<ChatMessage[]>(() => neuralMemory.getChatHistory());
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [useSearch, setUseSearch] = useState(true);
  const [memoryNotice, setMemoryNotice] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Listen for memory updates
    const unsub = neuralMemory.subscribe((evt) => {
      if (evt.type === 'CHAT_HISTORY_UPDATED') {
        setMessages(evt.messages);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Clear persistent neural chat history? Stored facts and reminders will remain safe.")) {
      neuralMemory.clearChatHistory();
      setMessages([]);
    }
  };

  const handleSend = async (text?: string) => {
    const finalInput = text || input;
    if (!finalInput.trim() || isLoading) return;

    onCommand?.(finalInput);

    // Auto-detect and store explicit memory directives in conversation
    const lower = finalInput.toLowerCase();
    const isMemoryDirective = 
      lower.startsWith('remember ') || 
      lower.startsWith('remind me ') || 
      lower.includes('یاد رکھنا') || 
      lower.includes('یاد رکھو') ||
      lower.includes('یاد کروانا');

    if (isMemoryDirective) {
      try {
        const parsed = neuralMemory.parseVoiceMemoryDirective(finalInput);
        neuralMemory.addMemory(parsed);
        setMemoryNotice(`Memorized: "${parsed.title}" in Neural Memory`);
        setTimeout(() => setMemoryNotice(null), 4000);
      } catch (e) {}
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: finalInput,
      timestamp: Date.now(),
    };

    const updatedWithUser = [...messages, userMsg];
    setMessages(updatedWithUser);
    neuralMemory.saveChatMessages(updatedWithUser);
    setInput('');
    setIsLoading(true);
    onStatusChange?.('thinking');

    try {
      // Query Skill Registry for specialized capabilities
      const matchedSkills = await skillRegistry.searchSkills(finalInput);
      const bestSkill = matchedSkills.length > 0 ? matchedSkills[0] : null;
      if (bestSkill) {
        await skillRegistry.useSkill(bestSkill.skill.id);
      }

      let systemPrompt = `${persona.systemInstruction}. ${customInstructions || ""}`;
      if (bestSkill) {
        systemPrompt += `\n[AUTONOMOUS SPECIALIST SKILL ENGAGED]: "${bestSkill.skill.name}" (v${bestSkill.skill.version}) - Category: ${bestSkill.skill.category}. Apply your specialized knowledge: ${bestSkill.skill.description}. Use cases: ${bestSkill.skill.useCases.join('; ')}.`;
      }

      // Pass previous turns for multi-turn conversational context
      const response = await chatWithGemini(
        finalInput, 
        systemPrompt,
        useSearch,
        messages
      );
      
      onStatusChange?.('talking');
      
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: response.text || 'Neural matrix connected.',
        timestamp: Date.now(),
        groundingUrls: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web).filter(Boolean),
        activeSkill: bestSkill?.skill.name
      };

      const updatedWithAssistant = [...updatedWithUser, assistantMsg];
      setMessages(updatedWithAssistant);
      neuralMemory.saveChatMessages(updatedWithAssistant);
      
      setTimeout(() => onStatusChange?.('idle'), 2000);
    } catch (error) {
      const errAssistantMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        role: 'assistant',
        text: 'Neural uplink interrupted. Reconnecting to synaptic matrix...',
        timestamp: Date.now()
      };
      const updatedWithError = [...updatedWithUser, errAssistantMsg];
      setMessages(updatedWithError);
      neuralMemory.saveChatMessages(updatedWithError);
      onStatusChange?.('idle');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/10 overflow-hidden min-h-0">
      <div className="px-4 sm:px-8 lg:px-10 py-3 sm:py-4 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between bg-white/[0.02] backdrop-blur-md z-10 gap-3 sm:gap-0 shrink-0">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-8 h-8 rounded-lg bg-[#00E5FF]/20 flex items-center justify-center text-[#00E5FF] shrink-0">
            <TerminalIcon size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[clamp(8px,0.55vw,10px)] font-orbitron font-black text-white/60 uppercase tracking-[0.3em]">{persona.name}_NODE_UPLINK</span>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/20">
                <Zap size={8} className="text-[#00E5FF] animate-pulse" />
                <span className="text-[clamp(7px,0.48vw,9px)] font-mono font-bold text-[#00E5FF] uppercase tracking-tighter">Flash-Lite Active</span>
              </div>
              {useSearch && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#2ED8C3]/10 border border-[#2ED8C3]/20">
                  <Globe size={8} className="text-[#2ED8C3]" />
                  <span className="text-[clamp(7px,0.48vw,9px)] font-mono font-bold text-[#2ED8C3] uppercase tracking-tighter">Search Enabled</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
          {onOpenMemory && (
            <button
              onClick={onOpenMemory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 border border-[#00E5FF]/30 text-[#00E5FF] transition-all text-[clamp(8px,0.55vw,10px)] font-orbitron font-bold uppercase tracking-wider"
              title="Open Neural Memory Bank"
            >
              <Bookmark size={12} />
              <span>Memory Bank</span>
            </button>
          )}
          <button 
            onClick={() => setUseSearch(!useSearch)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${useSearch ? 'bg-[#00E5FF]/10 border-[#00E5FF]/40 text-[#00E5FF]' : 'bg-white/5 border-white/10 text-white/40'}`}
          >
            <Search size={12} />
            <span className="text-[clamp(8px,0.55vw,10px)] font-orbitron font-black uppercase tracking-widest">{useSearch ? 'Search_ON' : 'Search_OFF'}</span>
          </button>
          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="p-1.5 rounded-full bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-400 border border-white/5 transition-all"
              title="Clear chat history"
            >
              <Trash2 size={13} />
            </button>
          )}
          <div className="flex items-center gap-2 text-[clamp(8px,0.55vw,10px)] font-mono font-bold text-white/20 tracking-widest">
            <span className="hidden sm:inline">SECURE_SESSION: ACTIVE</span>
            <div className="w-2 h-2 rounded-full bg-[#2ED8C3] animate-pulse"></div>
          </div>
        </div>
      </div>

      {memoryNotice && (
        <div className="mx-4 sm:mx-8 mt-2 p-2.5 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] text-[clamp(9px,0.65vw,11.5px)] font-mono flex items-center justify-between gap-2 animate-slide-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-[#00E5FF]" />
            <span>{memoryNotice}</span>
          </div>
          {onOpenMemory && (
            <button 
              onClick={onOpenMemory}
              className="underline text-[clamp(8px,0.55vw,10px)] uppercase font-bold hover:text-white"
            >
              View in Memory
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 lg:space-y-8 p-4 sm:p-6 lg:p-8 custom-scrollbar min-h-0" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-4 sm:space-y-6 animate-slide-in my-auto py-6">
            <div className="w-16 h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-[24px] sm:rounded-[36px] bg-white/5 flex items-center justify-center text-[#00E5FF] border border-white/10 shadow-2xl animate-pulse shrink-0">
              <Sparkles size={32} className="sm:w-[40px] sm:h-[40px] lg:w-[48px] lg:h-[48px]" />
            </div>
            <div className="space-y-2">
              <h3 className="font-orbitron font-black text-[clamp(18px,1.6vw,28px)] text-white tracking-tighter uppercase">Neural Matrix Ready</h3>
              <p className="text-white/40 font-medium text-[clamp(13px,0.95vw,16px)] leading-relaxed italic">"I am {persona.name}. How can I assist you today?"</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-slide-in`}>
            <div className={`max-w-[92%] sm:max-w-[80%] lg:max-w-[70%] rounded-[20px] sm:rounded-[28px] px-4 sm:px-6 lg:px-8 py-3.5 sm:py-5 text-[clamp(12px,0.9vw,15px)] font-medium leading-relaxed shadow-xl ${
              msg.role === 'user' 
                ? 'bg-white text-black font-bold' 
                : 'glass-panel text-white/90 border-white/5'
            }`}>
              {msg.text}
              {msg.activeSkill && (
                <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 flex items-center gap-1">
                    <Sparkles size={9} /> Specialist Skill: {msg.activeSkill}
                  </span>
                </div>
              )}
              {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/5">
                  <div className="flex flex-wrap gap-2">
                    {msg.groundingUrls.map((url, i) => (
                      <a 
                        key={i} href={url.uri} target="_blank" rel="noreferrer"
                        className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[clamp(8px,0.55vw,10px)] text-white/40 hover:text-[#00E5FF] hover:border-[#00E5FF]/40 font-black uppercase tracking-widest transition-all"
                      >
                        {url.title || 'Uplink Node'}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2 sm:gap-3 p-4 items-center bg-white/5 rounded-full w-fit">
            <div className="flex space-x-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-bounce"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-bounce [animation-delay:-.3s]"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-bounce [animation-delay:-.5s]"></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 sm:p-6 lg:p-8 pt-0 flex justify-center shrink-0">
        <div className="w-full max-w-4xl relative group">
          <div className="absolute inset-0 bg-[#00E5FF]/10 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
          <div className="relative glass-panel rounded-full border-white/10 flex items-center p-1.5 sm:p-2.5 shadow-2xl bg-[#0A1A2F]/80">
            <button
              onClick={toggleMic}
              className={`w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12 flex items-center justify-center rounded-full transition-all shrink-0 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-[#00E5FF] hover:bg-white/10'}`}
            >
              {isListening ? <MicOff size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Mic size={16} className="sm:w-[18px] sm:h-[18px]" />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Speak or type command..."
              className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/20 font-medium text-[clamp(12px,0.9vw,15px)] px-3 sm:px-5"
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12 flex items-center justify-center rounded-full bg-[#00E5FF] text-[#0A1A2F] hover:bg-white disabled:opacity-30 transition-all shadow-lg shrink-0"
            >
              <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeuralTerminal;
