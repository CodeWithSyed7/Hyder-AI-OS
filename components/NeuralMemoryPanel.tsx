import React, { useState, useEffect, useRef } from 'react';
import { 
  Bookmark, 
  BrainCircuit, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Clock, 
  Bell, 
  BellRing, 
  CheckCircle2, 
  AlertCircle, 
  Mic, 
  MicOff, 
  Tag, 
  Filter, 
  Download, 
  RotateCcw, 
  Sparkles, 
  MessageSquare, 
  ChevronRight, 
  Zap, 
  ShieldCheck,
  Calendar,
  Volume2
} from 'lucide-react';
import { MemoryItem, MemoryCategory, MemoryImportance, ChatMessage } from '../types';
import { neuralMemory, NeuralMemoryEvent } from '../services/neuralMemoryService';

export const NeuralMemoryPanel: React.FC = () => {
  const [memories, setMemories] = useState<MemoryItem[]>(() => neuralMemory.getMemories());
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => neuralMemory.getChatHistory());
  const [stats, setStats] = useState(() => neuralMemory.getStats());
  const [activeTab, setActiveTab] = useState<'bank' | 'reminders' | 'voice' | 'chat'>('bank');
  
  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | MemoryCategory>('all');
  const [importanceFilter, setImportanceFilter] = useState<'all' | MemoryImportance>('all');

  // Inline editing state (for editing specific content / words)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editScheduledTime, setEditScheduledTime] = useState('');

  // Add new memory modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('fact');
  const [newImportance, setNewImportance] = useState<MemoryImportance>('medium');
  const [newTags, setNewTags] = useState('');
  const [newIsReminder, setNewIsReminder] = useState(false);
  const [newScheduledTime, setNewScheduledTime] = useState('');
  const [newReminderDate, setNewReminderDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Voice capture state
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceParsedPreview, setVoiceParsedPreview] = useState<Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'> | null>(null);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Active due reminder alerts
  const [dueAlerts, setDueAlerts] = useState<MemoryItem[]>(() => neuralMemory.getActiveDueReminders());

  // Subscribe to service updates
  useEffect(() => {
    const unsub = neuralMemory.subscribe((evt: NeuralMemoryEvent) => {
      if (evt.type === 'MEMORIES_UPDATED') {
        setMemories(evt.items);
        setStats(neuralMemory.getStats());
      } else if (evt.type === 'CHAT_HISTORY_UPDATED') {
        setChatHistory(evt.messages);
        setStats(neuralMemory.getStats());
      } else if (evt.type === 'REMINDER_TRIGGERED') {
        setDueAlerts(neuralMemory.getActiveDueReminders());
      }
    });

    const handleSync = () => {
      setMemories(neuralMemory.getMemories());
      setStats(neuralMemory.getStats());
    };
    window.addEventListener('haider_neural_memory_updated', handleSync);

    return () => {
      unsub();
      window.removeEventListener('haider_neural_memory_updated', handleSync);
    };
  }, []);

  // Initialize Speech Recognition for Voice Memory Uplink
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      // Support multilingual dictation
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setVoiceTranscript(currentTranscript);

        if (event.results[0].isFinal) {
          const parsed = neuralMemory.parseVoiceMemoryDirective(currentTranscript);
          setVoiceParsedPreview(parsed);
          setIsVoiceListening(false);
        }
      };

      recognitionRef.current.onerror = () => {
        setIsVoiceListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsVoiceListening(false);
      };
    }
  }, []);

  const toggleVoiceCapture = () => {
    if (isVoiceListening) {
      recognitionRef.current?.stop();
      setIsVoiceListening(false);
    } else {
      setVoiceTranscript('');
      setVoiceParsedPreview(null);
      setVoiceFeedback(null);
      try {
        recognitionRef.current?.start();
        setIsVoiceListening(true);
      } catch (e) {
        setIsVoiceListening(false);
      }
    }
  };

  const handleSaveVoiceMemory = () => {
    if (!voiceParsedPreview) return;
    neuralMemory.addMemory(voiceParsedPreview);
    setVoiceFeedback(`Successfully committed to Neural Memory: "${voiceParsedPreview.title}"`);
    setVoiceTranscript('');
    setVoiceParsedPreview(null);
    setTimeout(() => setVoiceFeedback(null), 4000);
  };

  // Start inline editing
  const handleStartEdit = (item: MemoryItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditContent(item.content);
    setEditTags(item.tags.join(', '));
    setEditScheduledTime(item.scheduledTime || '');
  };

  const handleSaveEdit = (id: string) => {
    const tagsArr = editTags.split(',').map(t => t.trim()).filter(Boolean);
    neuralMemory.updateMemory(id, {
      title: editTitle.trim(),
      content: editContent.trim(),
      tags: tagsArr,
      scheduledTime: editScheduledTime.trim() || undefined
    });
    setEditingId(null);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Delete memory "${title}" from Neural Bank?`)) {
      neuralMemory.deleteMemory(id);
    }
  };

  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const tagsArr = newTags.split(',').map(t => t.trim()).filter(Boolean);
    neuralMemory.addMemory({
      category: newCategory,
      title: newTitle.trim(),
      content: newContent.trim(),
      tags: tagsArr.length > 0 ? tagsArr : [newCategory],
      importance: newImportance,
      source: 'manual',
      isReminder: newIsReminder || Boolean(newScheduledTime),
      scheduledTime: newScheduledTime.trim() || undefined,
      reminderDate: newIsReminder ? newReminderDate : undefined,
      isCompleted: false,
      notified: false
    });

    // Reset form
    setNewTitle('');
    setNewContent('');
    setNewTags('');
    setNewScheduledTime('');
    setNewIsReminder(false);
    setShowAddModal(false);
  };

  const handleExportJSON = () => {
    const data = {
      memories: neuralMemory.getMemories(),
      chatHistory: neuralMemory.getChatHistory(),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hyder-neural-memory-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter memories
  const filteredMemories = memories.filter(item => {
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesImportance = importanceFilter === 'all' || item.importance === importanceFilter;
    const matchesSearch = !searchQuery.trim() || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesImportance && matchesSearch;
  });

  const remindersList = memories.filter(m => m.isReminder || m.category === 'task_reminder');

  return (
    <div className="w-full h-full flex flex-col p-2 sm:p-4 md:p-6 lg:p-7 space-y-4 overflow-y-auto custom-scrollbar">
      
      {/* =========================================================================
          TOP COMMAND DECK: Neural Memory Telemetry & Quick Action Bar
          ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-[22px] sm:rounded-[30px] bg-white/[0.03] border border-white/10 backdrop-blur-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xl">
        
        {/* Left: Holographic Memory Badge & Identity */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00E5FF]/20 via-[#2ED8C3]/15 to-purple-500/10 border border-[#00E5FF]/40 flex items-center justify-center text-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.25)] shrink-0">
            <Bookmark size={24} className="animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-orbitron font-black text-[clamp(14px,1.1vw,18px)] tracking-wider text-white uppercase">
                NEURAL MEMORY & CONTEXT BANK
              </h2>
              
              <span className="px-2.5 py-0.5 rounded-full text-[clamp(7.5px,0.5vw,9px)] font-mono font-bold uppercase tracking-widest bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                LocalStorage Synchronized
              </span>
            </div>

            <p className="text-[clamp(9.5px,0.68vw,11.5px)] text-white/60 font-mono mt-0.5">
              Continuous conversational recall across sessions • Friendly human JARVIS tone • Voice & manual task scheduling
            </p>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[#00E5FF] hover:bg-white text-[#0A1A2F] font-orbitron font-bold text-[clamp(8px,0.55vw,9.5px)] uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,229,255,0.3)] active:scale-95"
          >
            <Plus size={13} /> ADD NEW MEMORY
          </button>

          <button
            onClick={() => setActiveTab('voice')}
            className={`px-3.5 py-2 rounded-xl border font-orbitron font-bold text-[clamp(8px,0.55vw,9.5px)] uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'voice' 
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.25)]' 
                : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
            }`}
          >
            <Mic size={13} /> VOICE MEMORY
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 font-orbitron font-bold text-[clamp(8px,0.55vw,9.5px)] uppercase tracking-wider transition-all flex items-center gap-1.5"
            title="Export memories as JSON"
          >
            <Download size={13} /> EXPORT
          </button>
        </div>
      </div>

      {/* Active Due Reminders Glowing Banner if triggered */}
      {dueAlerts.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_0_30px_rgba(245,158,11,0.25)] animate-slide-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-black flex items-center justify-center font-bold shrink-0 animate-bounce">
              <BellRing size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-orbitron font-black text-amber-300 text-[clamp(11px,0.8vw,13px)] uppercase">
                  SCHEDULED TASK REMINDER DUE
                </span>
                <span className="text-[8px] font-mono text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded">
                  JARVIS Alert
                </span>
              </div>
              <p className="text-[clamp(10px,0.72vw,12px)] text-white/90 font-medium">
                {dueAlerts[0]?.title}: {dueAlerts[0]?.content}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                neuralMemory.toggleReminderComplete(dueAlerts[0].id);
                setDueAlerts(neuralMemory.getActiveDueReminders());
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-orbitron font-black text-[clamp(8px,0.55vw,9.5px)] uppercase tracking-wider transition-all flex items-center gap-1 shadow-md"
            >
              <CheckCircle2 size={12} /> MARK DONE
            </button>
            <button
              onClick={() => neuralMemory.dismissDueReminder(dueAlerts[0].id)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-orbitron font-bold text-[clamp(8px,0.55vw,9.5px)] uppercase tracking-wider transition-all"
            >
              DISMISS
            </button>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs & Statistics Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-black/40 rounded-2xl border border-white/10 overflow-x-auto custom-scrollbar">
          {[
            { id: 'bank', label: `MEMORY BANK (${memories.length})`, icon: Bookmark },
            { id: 'reminders', label: `TASKS & REMINDERS (${remindersList.length})`, icon: Clock },
            { id: 'voice', label: 'VOICE UPLINK', icon: Mic },
            { id: 'chat', label: `CHAT ARCHIVE (${chatHistory.length})`, icon: MessageSquare }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl font-orbitron font-bold text-[clamp(8px,0.55vw,9.5px)] tracking-wider uppercase whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-[#00E5FF] text-[#0A1A2F] shadow-lg shadow-[#00E5FF]/20'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <Icon size={12} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Telemetry Chips */}
        <div className="flex items-center gap-2 text-[clamp(8px,0.55vw,9.5px)] font-mono text-white/50">
          <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/5">
            Facts: <strong className="text-white">{stats.factsCount}</strong>
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/5">
            Preferences: <strong className="text-[#00E5FF]">{stats.preferencesCount}</strong>
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/5">
            Active Reminders: <strong className="text-amber-300">{stats.activeRemindersCount}</strong>
          </span>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: MEMORY BANK (SEARCH, FILTER, WORD EDITING, AND CATEGORIES)
          ========================================================================= */}
      {activeTab === 'bank' && (
        <div className="flex flex-col space-y-4 flex-1">
          {/* Search & Category Filter Controls */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full flex items-center bg-black/40 border border-white/10 rounded-xl px-3 py-1.5">
              <Search size={14} className="text-[#00E5FF]/60 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search words, facts, preferences, or tags in memory..."
                className="bg-transparent border-none outline-none font-mono text-[clamp(10px,0.72vw,12px)] text-white w-full placeholder:text-white/30"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-white/40 hover:text-white">
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
              {[
                { id: 'all', label: 'All' },
                { id: 'fact', label: 'Facts' },
                { id: 'preference', label: 'Preferences' },
                { id: 'task_reminder', label: 'Reminders' },
                { id: 'project_context', label: 'Projects' },
                { id: 'custom_note', label: 'Notes' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-[clamp(7.5px,0.5vw,9px)] font-orbitron uppercase tracking-wider transition-all border ${
                    categoryFilter === cat.id
                      ? 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/40 shadow-sm'
                      : 'bg-white/5 text-white/50 border-white/5 hover:border-white/20'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Memories Grid */}
          {filteredMemories.length === 0 ? (
            <div className="py-16 text-center text-white/40 font-mono text-[clamp(10px,0.7vw,12px)] space-y-3 p-8 rounded-3xl bg-white/[0.01] border border-dashed border-white/10">
              <BrainCircuit size={36} className="mx-auto text-white/20" />
              <p>No neural memories match your search filter.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-xl bg-[#00E5FF]/20 hover:bg-[#00E5FF] text-[#00E5FF] hover:text-[#0A1A2F] border border-[#00E5FF]/40 font-orbitron font-bold text-[clamp(8px,0.55vw,9.5px)] uppercase transition-all"
              >
                COMMIT FIRST MEMORY
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredMemories.map(item => {
                const isEditing = editingId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-[22px] bg-white/[0.02] hover:bg-white/[0.04] border transition-all flex flex-col justify-between space-y-3 group ${
                      item.importance === 'critical' ? 'border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.15)]' :
                      item.importance === 'high' ? 'border-amber-400/30' :
                      'border-white/5 hover:border-[#00E5FF]/30'
                    }`}
                  >
                    <div>
                      {/* Card Header: Category & Source */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[clamp(7px,0.48vw,8.5px)] font-mono font-bold uppercase tracking-wider ${
                            item.category === 'fact' ? 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20' :
                            item.category === 'preference' ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' :
                            item.category === 'task_reminder' ? 'bg-amber-400/10 text-amber-300 border border-amber-400/20' :
                            item.category === 'project_context' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' :
                            'bg-white/10 text-white/60'
                          }`}>
                            {item.category.replace('_', ' ')}
                          </span>

                          {item.scheduledTime && (
                            <span className="flex items-center gap-1 text-[clamp(7.5px,0.5vw,9px)] font-mono text-amber-300">
                              <Clock size={10} /> {item.scheduledTime}
                            </span>
                          )}
                        </div>

                        {/* Action Icons: Edit & Delete */}
                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          {!isEditing ? (
                            <>
                              <button
                                onClick={() => handleStartEdit(item)}
                                className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-[#00E5FF] transition-colors"
                                title="Edit words / content"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id, item.title)}
                                className="p-1 rounded-lg hover:bg-rose-500/20 text-white/50 hover:text-rose-400 transition-colors"
                                title="Delete from memory"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleSaveEdit(item.id)}
                                className="p-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-black transition-colors"
                                title="Save changes"
                              >
                                <Save size={13} />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                                title="Cancel"
                              >
                                <X size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Content or Inline Word Edit Box */}
                      {isEditing ? (
                        <div className="space-y-2 pt-1">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full bg-black/60 border border-[#00E5FF]/40 rounded-xl px-2.5 py-1 text-[clamp(11px,0.8vw,13px)] font-orbitron font-bold text-white outline-none"
                            placeholder="Title..."
                          />
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={3}
                            className="w-full bg-black/60 border border-white/10 focus:border-[#00E5FF]/40 rounded-xl p-2 text-[clamp(10px,0.72vw,12px)] text-white/90 outline-none font-mono resize-none custom-scrollbar"
                            placeholder="Memory content / words to edit..."
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={editTags}
                              onChange={(e) => setEditTags(e.target.value)}
                              className="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-[9px] font-mono text-white/70 outline-none"
                              placeholder="Tags (comma separated)..."
                            />
                            <input
                              type="text"
                              value={editScheduledTime}
                              onChange={(e) => setEditScheduledTime(e.target.value)}
                              className="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-[9px] font-mono text-white/70 outline-none"
                              placeholder="Time (e.g. 17:00)..."
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h4 className="font-orbitron font-bold text-[clamp(11px,0.8vw,13px)] text-white leading-snug">
                            {item.title}
                          </h4>
                          <p className="text-[clamp(10px,0.72vw,12px)] text-white/70 font-medium leading-relaxed mt-1.5">
                            {item.content}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Card Footer: Tags & Timestamp */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[clamp(7.5px,0.5vw,9px)] font-mono text-white/40">
                      <div className="flex items-center gap-1 flex-wrap">
                        {item.tags.map((t, tidx) => (
                          <span key={tidx} className="bg-white/5 px-1.5 py-0.2 rounded text-white/50">
                            #{t}
                          </span>
                        ))}
                      </div>
                      <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: TASKS & SCHEDULED REMINDERS
          ========================================================================= */}
      {activeTab === 'reminders' && (
        <div className="p-4 sm:p-6 rounded-[24px] bg-white/[0.02] border border-white/10 backdrop-blur-xl flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <span className="font-orbitron font-black text-white text-[clamp(12px,0.9vw,15px)] uppercase flex items-center gap-2">
                <Clock size={16} className="text-amber-400" /> SCHEDULED TASKS & ALARM REMINDERS
              </span>
              <p className="text-[clamp(8px,0.55vw,10px)] font-mono text-white/50 mt-0.5">
                Every task you ask Hyder/JARVIS to remember at a specific time is monitored and triggered automatically.
              </p>
            </div>

            <button
              onClick={() => {
                setNewCategory('task_reminder');
                setNewIsReminder(true);
                setShowAddModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-white text-black font-orbitron font-bold text-[clamp(8px,0.55vw,9.5px)] uppercase tracking-wider transition-all flex items-center gap-1 shadow-md"
            >
              <Plus size={12} /> SCHEDULE NEW TASK
            </button>
          </div>

          {remindersList.length === 0 ? (
            <div className="py-12 text-center text-white/40 font-mono text-[clamp(10px,0.7vw,12px)] space-y-2">
              <Clock size={32} className="mx-auto text-amber-400/40" />
              <p>No active scheduled tasks or reminders stored in Neural Memory.</p>
              <p className="text-[9px] text-white/30">Speak via Voice Uplink or click above to set an automated task alert.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {remindersList.map(task => {
                const isDue = dueAlerts.some(a => a.id === task.id);

                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      isDue 
                        ? 'bg-amber-500/15 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]' 
                        : task.isCompleted
                        ? 'bg-white/[0.01] border-emerald-500/20 opacity-70'
                        : 'bg-white/[0.03] border-white/10 hover:border-amber-400/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => neuralMemory.toggleReminderComplete(task.id)}
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold shrink-0 mt-0.5 transition-transform active:scale-90 ${
                          task.isCompleted
                            ? 'bg-emerald-500 text-black shadow-md'
                            : 'bg-white/10 hover:bg-amber-400 hover:text-black text-white/60'
                        }`}
                        title={task.isCompleted ? 'Mark pending' : 'Mark completed'}
                      >
                        <CheckCircle2 size={15} />
                      </button>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-orbitron font-bold text-[clamp(11px,0.8vw,13px)] text-white ${task.isCompleted ? 'line-through text-white/40' : ''}`}>
                            {task.title}
                          </span>
                          
                          {task.scheduledTime && (
                            <span className="px-2 py-0.5 rounded-full text-[clamp(7.5px,0.5vw,9px)] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                              ⏰ {task.scheduledTime}
                            </span>
                          )}

                          {task.reminderDate && (
                            <span className="text-[clamp(7.5px,0.5vw,9px)] font-mono text-white/40">
                              📅 {task.reminderDate}
                            </span>
                          )}
                        </div>

                        <p className={`text-[clamp(9.5px,0.68vw,11.5px)] text-white/70 font-mono mt-1 ${task.isCompleted ? 'line-through text-white/30' : ''}`}>
                          {task.content}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleDelete(task.id, task.title)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition-colors"
                        title="Delete task"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: VOICE MEMORY UPLINK (SPEAK TO RECORD IN URDU / ENGLISH)
          ========================================================================= */}
      {activeTab === 'voice' && (
        <div className="p-4 sm:p-6 rounded-[24px] bg-white/[0.02] border border-white/10 backdrop-blur-xl flex flex-col items-center justify-center text-center space-y-6 max-w-3xl mx-auto w-full">
          
          <div className="space-y-1">
            <span className="text-[clamp(8px,0.55vw,10px)] font-orbitron font-black text-purple-400 tracking-[0.4em] uppercase">
              MULTILINGUAL SYNAPTIC INGESTION
            </span>
            <h3 className="font-orbitron font-black text-[clamp(18px,1.4vw,24px)] text-white uppercase">
              VOICE MEMORY RECORDING
            </h3>
            <p className="text-[clamp(10px,0.72vw,12px)] text-white/60 font-mono max-w-lg mx-auto">
              Speak naturally in Urdu or English. Tell JARVIS what to remember or when to schedule a reminder.
            </p>
          </div>

          {/* Microphone Activation Orb */}
          <div className="flex flex-col items-center space-y-3">
            <button
              onClick={toggleVoiceCapture}
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center transition-all shadow-2xl relative ${
                isVoiceListening 
                  ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_50px_rgba(244,63,94,0.6)] scale-105' 
                  : 'bg-gradient-to-tr from-[#00E5FF] to-purple-600 text-[#0A1A2F] hover:scale-105 shadow-[0_0_40px_rgba(0,229,255,0.4)]'
              }`}
            >
              {isVoiceListening ? <MicOff size={38} /> : <Mic size={38} />}
            </button>
            <span className="font-mono text-[clamp(9px,0.65vw,11px)] font-bold uppercase tracking-widest text-[#00E5FF]">
              {isVoiceListening ? 'LISTENING... SPEAK NOW' : 'CLICK TO SPEAK'}
            </span>
          </div>

          {/* Real-time Voice Transcript */}
          {voiceTranscript && (
            <div className="w-full p-4 rounded-2xl bg-black/60 border border-white/10 text-left space-y-2 animate-slide-in">
              <span className="text-[8px] font-mono text-[#00E5FF] uppercase font-bold tracking-widest">
                SPEECH RECOGNITION TRANSCRIPT:
              </span>
              <p className="text-[clamp(12px,0.85vw,14px)] text-white font-medium italic">
                "{voiceTranscript}"
              </p>
            </div>
          )}

          {/* Parsed Directive Preview Card */}
          {voiceParsedPreview && (
            <div className="w-full p-4 sm:p-5 rounded-2xl bg-[#00E5FF]/10 border border-[#00E5FF]/40 text-left space-y-3 animate-slide-in shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-[clamp(8px,0.55vw,9.5px)] font-mono uppercase font-bold text-[#00E5FF] flex items-center gap-1.5">
                  <Sparkles size={12} /> EXTRACTED NEURAL MEMORY DIRECTIVE
                </span>
                <span className="px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold bg-[#00E5FF]/20 text-[#00E5FF]">
                  {voiceParsedPreview.category}
                </span>
              </div>

              <div>
                <h4 className="font-orbitron font-bold text-[clamp(12px,0.85vw,14px)] text-white">
                  {voiceParsedPreview.title}
                </h4>
                <p className="text-[clamp(10px,0.72vw,12px)] text-white/80 font-mono mt-0.5">
                  {voiceParsedPreview.content}
                </p>
              </div>

              {voiceParsedPreview.scheduledTime && (
                <div className="flex items-center gap-2 text-[clamp(8.5px,0.6vw,10px)] font-mono text-amber-300">
                  <Clock size={12} /> Detected Alert Time: <strong>{voiceParsedPreview.scheduledTime}</strong>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleSaveVoiceMemory}
                  className="px-5 py-2.5 rounded-xl bg-[#00E5FF] hover:bg-white text-[#0A1A2F] font-orbitron font-black text-[clamp(8.5px,0.6vw,10.5px)] uppercase tracking-wider transition-all shadow-lg shadow-[#00E5FF]/30 flex items-center gap-1.5"
                >
                  <Save size={13} /> COMMIT TO NEURAL MEMORY
                </button>
                <button
                  onClick={() => setVoiceParsedPreview(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-orbitron font-bold text-[clamp(8px,0.55vw,9.5px)] uppercase transition-all"
                >
                  DISCARD
                </button>
              </div>
            </div>
          )}

          {voiceFeedback && (
            <div className="w-full p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[clamp(9.5px,0.68vw,11.5px)] flex items-center gap-2 animate-slide-in">
              <CheckCircle2 size={16} />
              <span>{voiceFeedback}</span>
            </div>
          )}

          {/* Example Voice Prompts */}
          <div className="w-full pt-4 border-t border-white/5 space-y-2">
            <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest">
              Example Voice Prompts (English & Urdu):
            </span>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {[
                "Remind me to backup files at 22:00",
                "Remember my client call is at 5 PM",
                "مجھے رات 10 بجے بیک اپ لینا یاد کروانا",
                "Remember that I prefer TypeScript and Dark Mode"
              ].map((ex, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setVoiceTranscript(ex);
                    const parsed = neuralMemory.parseVoiceMemoryDirective(ex);
                    setVoiceParsedPreview(parsed);
                  }}
                  className="px-3 py-1 rounded-full bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-[#00E5FF]/30 text-white/60 hover:text-[#00E5FF] text-[clamp(7.5px,0.5vw,9px)] font-mono transition-all"
                >
                  "{ex}"
                </button>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* =========================================================================
          TAB 4: CHAT ARCHIVE ACROSS SESSIONS
          ========================================================================= */}
      {activeTab === 'chat' && (
        <div className="p-4 sm:p-6 rounded-[24px] bg-white/[0.02] border border-white/10 backdrop-blur-xl flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <span className="font-orbitron font-black text-white text-[clamp(12px,0.9vw,15px)] uppercase flex items-center gap-2">
                <MessageSquare size={16} className="text-[#00E5FF]" /> PERSISTENT CHAT HISTORY ARCHIVE
              </span>
              <p className="text-[clamp(8px,0.55vw,10px)] font-mono text-white/50 mt-0.5">
                Every conversation is preserved in LocalStorage, providing the AI with past interaction context.
              </p>
            </div>

            {chatHistory.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm("Clear all persistent chat logs? Stored memory facts will be retained.")) {
                    neuralMemory.clearChatHistory();
                    setChatHistory([]);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-orbitron font-bold text-[clamp(7.5px,0.5vw,9px)] uppercase tracking-wider flex items-center gap-1 transition-all"
              >
                <Trash2 size={12} /> CLEAR CHAT ARCHIVE
              </button>
            )}
          </div>

          {chatHistory.length === 0 ? (
            <div className="py-12 text-center text-white/40 font-mono text-[clamp(10px,0.7vw,12px)] space-y-2">
              <MessageSquare size={32} className="mx-auto text-white/20" />
              <p>Chat history archive is currently empty.</p>
              <p className="text-[9px] text-white/30">Start talking in Neural Terminal to accumulate conversational memory.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
              {chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-2xl border transition-all flex flex-col space-y-1 ${
                    msg.role === 'user'
                      ? 'bg-white/[0.04] border-white/10 ml-6'
                      : 'bg-[#00E5FF]/[0.03] border-[#00E5FF]/20 mr-6'
                  }`}
                >
                  <div className="flex items-center justify-between text-[clamp(7.5px,0.48vw,8.5px)] font-mono text-white/40">
                    <span className={`uppercase font-bold ${msg.role === 'user' ? 'text-white/60' : 'text-[#00E5FF]'}`}>
                      {msg.role === 'user' ? 'USER DIRECTIVE' : 'JARVIS RESPONSE'}
                    </span>
                    <span>{new Date(msg.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-[clamp(10px,0.72vw,12px)] text-white/80 font-medium leading-relaxed">
                    {msg.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD NEW MEMORY OR REMINDER
          ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <div className="w-full max-w-xl glass-panel p-6 sm:p-8 rounded-[28px] border border-white/10 relative animate-slide-in shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="space-y-1 mb-5">
              <span className="text-[clamp(7.5px,0.5vw,9px)] font-orbitron font-black text-[#00E5FF] tracking-[0.3em] uppercase">
                SYNAPTIC REGISTRATION
              </span>
              <h3 className="font-orbitron font-black text-[clamp(16px,1.2vw,20px)] text-white uppercase">
                COMMIT NEW NEURAL MEMORY
              </h3>
            </div>

            <form onSubmit={handleCreateMemory} className="space-y-4">
              <div>
                <label className="text-[clamp(8px,0.55vw,9.5px)] font-mono text-white/60 uppercase block mb-1">
                  Title / Directive Name *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Preferred Database, Birthday, Nightly Backup Task..."
                  className="w-full bg-black/60 border border-white/10 focus:border-[#00E5FF]/60 rounded-xl px-3 py-2 text-[clamp(11px,0.78vw,13px)] text-white outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[clamp(8px,0.55vw,9.5px)] font-mono text-white/60 uppercase block mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-[clamp(10px,0.72vw,12px)] text-white outline-none font-mono"
                  >
                    <option value="fact">Fact / Knowledge</option>
                    <option value="preference">Personal Preference</option>
                    <option value="task_reminder">Task & Reminder</option>
                    <option value="project_context">Project Context</option>
                    <option value="custom_note">Custom Note</option>
                  </select>
                </div>

                <div>
                  <label className="text-[clamp(8px,0.55vw,9.5px)] font-mono text-white/60 uppercase block mb-1">
                    Importance
                  </label>
                  <select
                    value={newImportance}
                    onChange={(e) => setNewImportance(e.target.value as any)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-[clamp(10px,0.72vw,12px)] text-white outline-none font-mono"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[clamp(8px,0.55vw,9.5px)] font-mono text-white/60 uppercase block mb-1">
                  Memory Content / Words to Remember *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Explain the detail, rule, or instruction JARVIS should recall..."
                  className="w-full bg-black/60 border border-white/10 focus:border-[#00E5FF]/60 rounded-xl p-3 text-[clamp(10px,0.72vw,12px)] text-white outline-none font-mono resize-none"
                />
              </div>

              <div>
                <label className="text-[clamp(8px,0.55vw,9.5px)] font-mono text-white/60 uppercase block mb-1">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="e.g. system, personal, backup, urdu"
                  className="w-full bg-black/60 border border-white/10 focus:border-[#00E5FF]/60 rounded-xl px-3 py-1.5 text-[clamp(10px,0.72vw,12px)] text-white outline-none font-mono"
                />
              </div>

              {/* Task Scheduling Toggle */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsReminder}
                    onChange={(e) => setNewIsReminder(e.target.checked)}
                    className="rounded text-[#00E5FF]"
                  />
                  <span className="text-[clamp(9.5px,0.68vw,11.5px)] font-orbitron font-bold text-white uppercase">
                    Schedule as Time-Based Task Reminder
                  </span>
                </label>

                {newIsReminder && (
                  <div className="grid grid-cols-2 gap-2 pt-1 animate-slide-in">
                    <div>
                      <label className="text-[8px] font-mono text-white/40 block mb-0.5">ALERT TIME (HH:MM)</label>
                      <input
                        type="time"
                        value={newScheduledTime}
                        onChange={(e) => setNewScheduledTime(e.target.value)}
                        className="w-full bg-black/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white font-mono outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-mono text-white/40 block mb-0.5">DATE</label>
                      <input
                        type="date"
                        value={newReminderDate}
                        onChange={(e) => setNewReminderDate(e.target.value)}
                        className="w-full bg-black/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white font-mono outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#00E5FF] hover:bg-white text-[#0A1A2F] font-orbitron font-black text-[clamp(9px,0.65vw,11px)] uppercase tracking-wider transition-all shadow-lg"
                >
                  SAVE INTO NEURAL MEMORY
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-orbitron font-bold text-[clamp(9px,0.65vw,11px)] uppercase transition-all"
                >
                  CANCEL
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
