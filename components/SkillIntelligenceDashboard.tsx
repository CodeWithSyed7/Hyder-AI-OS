import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Search, 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  Box, 
  Terminal, 
  Globe, 
  Github, 
  Layers, 
  Cpu, 
  Activity, 
  Clock, 
  Filter, 
  Sparkles, 
  Check, 
  Sliders, 
  ExternalLink, 
  ArrowRight, 
  Undo2, 
  Settings, 
  Database, 
  Zap, 
  Code, 
  Compass, 
  Shield 
} from 'lucide-react';
import { 
  DiscoveredCapability, 
  SkillCategory, 
  CapabilityStatus, 
  SecurityApprovalLevel, 
  AuditLogEvent, 
  ResearchSettings, 
  ResearchCycleStats 
} from '../services/skillIntelligence/types';
import { skillRegistry } from '../services/skillIntelligence/skillRegistry';
import { researchAgent } from '../services/skillIntelligence/researchAgent';
import { sandboxService } from '../services/skillIntelligence/sandboxService';

export const SkillIntelligenceDashboard: React.FC = () => {
  const [capabilities, setCapabilities] = useState<DiscoveredCapability[]>(() => skillRegistry.getAllCapabilities());
  const [stats, setStats] = useState<ResearchCycleStats>(() => researchAgent.getStats());
  const [auditLogs, setAuditLogs] = useState<AuditLogEvent[]>(() => researchAgent.getAuditLogs());
  const [settings, setSettings] = useState<ResearchSettings>(() => researchAgent.getSettings());
  
  // Tabs: 'library' | 'activity' | 'settings'
  const [activeTab, setActiveTab] = useState<'library' | 'activity' | 'settings'>('library');
  
  // Library filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal / Inspection state
  const [inspectedCapability, setInspectedCapability] = useState<DiscoveredCapability | null>(null);
  const [testingCapId, setTestingCapId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const unsubRegistry = skillRegistry.subscribe((updated) => {
      setCapabilities([...updated]);
    });

    const unsubResearch = researchAgent.subscribe(() => {
      setStats({ ...researchAgent.getStats() });
      setAuditLogs([...researchAgent.getAuditLogs()]);
      setSettings({ ...researchAgent.getSettings() });
    });

    return () => {
      unsubRegistry();
      unsubResearch();
    };
  }, []);

  const handleRunManualResearch = async () => {
    if (stats.isRunning) return;
    showToast("Background Skill Research Agent dispatched across repositories and docs.");
    await researchAgent.runResearchCycle();
  };

  const handleToggleSkill = (id: string, currentEnabled: boolean) => {
    skillRegistry.toggleSkill(id, !currentEnabled);
    showToast(`Capability "${id}" ${!currentEnabled ? 'enabled' : 'disabled'}.`);
  };

  const handleApproveSkill = (id: string) => {
    skillRegistry.approveSkill(id);
    showToast(`Capability "${id}" approved and promoted to active registry.`);
  };

  const handleRejectSkill = (id: string) => {
    skillRegistry.rejectSkill(id, "Rejected by user administrative override.");
    showToast(`Capability "${id}" rejected.`);
  };

  const handleRollbackSkill = (id: string) => {
    skillRegistry.rollbackSkill(id);
    showToast(`Capability "${id}" rolled back to prior version.`);
  };

  const handleTestSandbox = async (cap: DiscoveredCapability) => {
    setTestingCapId(cap.id);
    try {
      const res = await sandboxService.testCapabilityInSandbox(cap);
      cap.sandboxAudit = res;
      skillRegistry.registerSkill({ ...cap });
      showToast(res.passed ? `Sandbox test passed (${res.score}/100)` : `Sandbox test warned (${res.score}/100)`);
    } finally {
      setTestingCapId(null);
    }
  };

  const handleSaveSettings = (updates: Partial<ResearchSettings>) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    researchAgent.saveSettings(updated);
    showToast("Skill Intelligence configuration updated.");
  };

  // Filtered capabilities
  const filteredCapabilities = capabilities.filter(c => {
    const matchesSearch = searchQuery === '' || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.compatibility.some(cmp => cmp.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Domains' },
    { id: 'debugging', label: 'Debugging' },
    { id: 'coding', label: 'Coding' },
    { id: 'testing', label: 'Testing' },
    { id: 'security', label: 'Security' },
    { id: 'ui_ux', label: 'UI/UX' },
    { id: 'mcp', label: 'MCP Servers' },
    { id: 'automation', label: 'Automation' },
    { id: 'database', label: 'Database' }
  ];

  const availableCount = capabilities.filter(c => c.status === 'available').length;
  const reviewCount = capabilities.filter(c => c.status === 'approved' || c.securityStatus === 'review').length;
  const avgQuality = capabilities.length 
    ? Math.round(capabilities.reduce((acc, c) => acc + c.qualityScore, 0) / capabilities.length) 
    : 95;

  return (
    <div className="w-full h-full flex flex-col p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 overflow-y-auto custom-scrollbar select-none text-white">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[999] px-4 py-2.5 rounded-xl bg-[#00E5FF] text-[#0A1A2F] font-mono text-[clamp(10px,0.75vw,12px)] font-bold shadow-[0_0_30px_rgba(0,229,255,0.4)] flex items-center gap-2 animate-bounce">
          <Sparkles size={16} /> {toastMessage}
        </div>
      )}

      {/* Main Header Card */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] bg-white/[0.02] border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00E5FF]/20 to-[#2ED8C3]/20 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] shadow-[0_0_25px_rgba(0,229,255,0.2)]">
            <BrainCircuit size={24} className={stats.isRunning ? 'animate-spin' : ''} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[clamp(16px,1.2vw,22px)] font-orbitron font-black text-white tracking-wider">
                SKILL INTELLIGENCE
              </h2>
              <span className="text-[clamp(7px,0.5vw,9px)] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30">
                AUTONOMOUS CAPABILITY ENGINE
              </span>
            </div>
            <p className="text-[clamp(9px,0.65vw,11px)] text-white/50 font-mono tracking-widest uppercase">
              BACKGROUND RESEARCH & INTEGRATION AGENT // DISCOVER • EVALUATE • SANDBOX • REGISTER
            </p>
          </div>
        </div>

        {/* Live Controls & Autonomous Research Trigger */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
            <span className={`w-2 h-2 rounded-full ${stats.isRunning ? 'bg-[#00E5FF] animate-ping' : 'bg-green-400'}`}></span>
            <div className="flex flex-col text-left">
              <span className="text-[clamp(7px,0.5vw,8px)] font-mono text-white/40 uppercase">RESEARCH AGENT</span>
              <span className="text-[clamp(9px,0.65vw,11px)] font-orbitron font-bold text-white uppercase">
                {stats.isRunning ? stats.currentPhase : 'IDLE & READY'}
              </span>
            </div>
          </div>

          {/* Trigger Autonomous Research */}
          <button
            onClick={handleRunManualResearch}
            disabled={stats.isRunning}
            className="px-4 py-2 rounded-xl bg-[#00E5FF] hover:bg-white text-[#0A1A2F] font-orbitron font-black text-[clamp(8px,0.6vw,10px)] tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-40 flex items-center gap-1.5 active:scale-95"
          >
            <RefreshCw size={13} className={stats.isRunning ? 'animate-spin' : ''} />
            {stats.isRunning ? `RESEARCHING (${stats.progressPercent}%)` : 'RUN RESEARCH CYCLE'}
          </button>
        </div>
      </div>

      {/* Progress Bar when running */}
      {stats.isRunning && (
        <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden border border-white/5">
          <div 
            className="bg-gradient-to-r from-[#00E5FF] to-[#2ED8C3] h-full transition-all duration-300"
            style={{ width: `${stats.progressPercent}%` }}
          />
        </div>
      )}

      {/* Top Telemetry Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Available */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/40 text-[clamp(7px,0.5vw,9px)] font-mono uppercase">
            <span>ACTIVE CAPABILITIES</span>
            <CheckCircle2 size={13} className="text-green-400" />
          </div>
          <div className="text-[clamp(20px,1.5vw,28px)] font-orbitron font-black text-white mt-1">
            {availableCount} <span className="text-white/30 text-xs font-normal">/ {capabilities.length}</span>
          </div>
          <div className="text-[clamp(8px,0.55vw,10px)] font-mono text-white/40">
            Available to Haider Core
          </div>
        </div>

        {/* Quality Score */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/40 text-[clamp(7px,0.5vw,9px)] font-mono uppercase">
            <span>AVG QUALITY SCORE</span>
            <Zap size={13} className="text-[#00E5FF]" />
          </div>
          <div className="text-[clamp(20px,1.5vw,28px)] font-orbitron font-black text-[#00E5FF] mt-1">
            {avgQuality}<span className="text-xs font-normal">/100</span>
          </div>
          <div className="text-[clamp(8px,0.55vw,10px)] font-mono text-white/40">
            Maintained & Verified Stacks
          </div>
        </div>

        {/* Security Isolation */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/40 text-[clamp(7px,0.5vw,9px)] font-mono uppercase">
            <span>SANDBOX CONTAINMENT</span>
            <ShieldCheck size={13} className="text-[#2ED8C3]" />
          </div>
          <div className="text-[clamp(20px,1.5vw,28px)] font-orbitron font-black text-[#2ED8C3] mt-1">
            100%
          </div>
          <div className="text-[clamp(8px,0.55vw,10px)] font-mono text-white/40">
            Zero Prod Code Mutation
          </div>
        </div>

        {/* Intelligence Sources */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/40 text-[clamp(7px,0.5vw,9px)] font-mono uppercase">
            <span>SCANNED REPOSITORIES</span>
            <Globe size={13} className="text-[#FFAB40]" />
          </div>
          <div className="text-[clamp(20px,1.5vw,28px)] font-orbitron font-black text-white mt-1">
            8 <span className="text-xs text-white/40 font-normal">SOURCES</span>
          </div>
          <div className="text-[clamp(8px,0.55vw,10px)] font-mono text-white/40 truncate">
            GitHub • npm • MCP • Docs
          </div>
        </div>
      </div>

      {/* Navigation Tabs Header */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('library')}
          className={`px-4 py-2 rounded-xl font-orbitron font-bold text-[clamp(9px,0.65vw,11px)] tracking-wider uppercase transition-all flex items-center gap-2 ${
            activeTab === 'library' 
              ? 'bg-[#00E5FF] text-[#0A1A2F] shadow-[0_0_15px_rgba(0,229,255,0.3)]' 
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          <Box size={14} /> SKILL REGISTRY ({capabilities.length})
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 rounded-xl font-orbitron font-bold text-[clamp(9px,0.65vw,11px)] tracking-wider uppercase transition-all flex items-center gap-2 ${
            activeTab === 'activity' 
              ? 'bg-[#00E5FF] text-[#0A1A2F] shadow-[0_0_15px_rgba(0,229,255,0.3)]' 
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          <Activity size={14} /> AUDIT TIMELINE ({auditLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl font-orbitron font-bold text-[clamp(9px,0.65vw,11px)] tracking-wider uppercase transition-all flex items-center gap-2 ${
            activeTab === 'settings' 
              ? 'bg-[#00E5FF] text-[#0A1A2F] shadow-[0_0_15px_rgba(0,229,255,0.3)]' 
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sliders size={14} /> RESEARCH SETTINGS
        </button>
      </div>

      {/* TAB 1: SKILL REGISTRY LIBRARY */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          
          {/* Search & Domain Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search capabilities by name, keyword, tech stack (e.g. 'hydration', 'react', 'mcp', 'security')..."
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-[clamp(10px,0.75vw,12px)] font-mono text-white placeholder:text-white/30 outline-none focus:border-[#00E5FF]"
              />
            </div>

            {/* Category Select Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-[clamp(8px,0.55vw,10px)] font-mono font-bold uppercase transition-all whitespace-nowrap ${
                    selectedCategory === cat.id 
                      ? 'bg-white text-black' 
                      : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Capabilities Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCapabilities.map(cap => {
              const isTesting = testingCapId === cap.id;
              return (
                <div
                  key={cap.id}
                  className={`p-4 sm:p-5 rounded-2xl bg-white/[0.02] border transition-all flex flex-col justify-between space-y-3.5 ${
                    cap.enabled 
                      ? 'border-white/10 hover:border-[#00E5FF]/40 shadow-lg' 
                      : 'border-white/5 opacity-60'
                  }`}
                >
                  {/* Top Bar: Category & Badges */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-[clamp(7px,0.5vw,9px)] font-mono font-bold uppercase tracking-wider bg-white/10 text-white/70">
                        {cap.category}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* Quality Badge */}
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30">
                          Q: {cap.qualityScore}
                        </span>

                        {/* Security Badge */}
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${
                          cap.securityStatus === 'safe' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                          cap.securityStatus === 'review' ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' :
                          'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}>
                          {cap.securityStatus}
                        </span>
                      </div>
                    </div>

                    {/* Name & Version */}
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-[clamp(12px,0.9vw,15px)] font-orbitron font-bold text-white group-hover:text-[#00E5FF]">
                        {cap.name}
                      </h3>
                      <span className="text-[clamp(8px,0.55vw,10px)] font-mono text-white/30 shrink-0">
                        v{cap.version}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-[clamp(9.5px,0.7vw,11.5px)] text-white/60 leading-relaxed mt-1.5 line-clamp-3">
                      {cap.description}
                    </p>
                  </div>

                  {/* Compatibility & Tools info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 flex-wrap">
                      {cap.compatibility.map(cmp => (
                        <span key={cmp} className="px-1.5 py-0.5 rounded text-[7.5px] font-mono text-white/40 bg-white/5 border border-white/5">
                          {cmp}
                        </span>
                      ))}
                      <span className="ml-auto text-[7.5px] font-mono text-[#00E5FF] opacity-60">
                        USED {cap.usedCount}x
                      </span>
                    </div>

                    {/* Use cases snippet */}
                    {cap.useCases.length > 0 && (
                      <div className="text-[clamp(8px,0.55vw,9.5px)] font-mono text-white/40 truncate">
                        • {cap.useCases[0]}
                      </div>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                    {/* Enable / Disable Switch */}
                    <button
                      onClick={() => handleToggleSkill(cap.id, cap.enabled)}
                      className={`px-2.5 py-1 rounded-lg text-[clamp(7.5px,0.5vw,9.5px)] font-mono font-bold uppercase transition-all ${
                        cap.enabled 
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                          : 'bg-white/5 text-white/40 border border-white/10 hover:text-white'
                      }`}
                    >
                      {cap.enabled ? 'ACTIVE' : 'DISABLED'}
                    </button>

                    <div className="flex items-center gap-1.5 ml-auto">
                      {/* Test in Sandbox */}
                      <button
                        onClick={() => handleTestSandbox(cap)}
                        disabled={isTesting}
                        title="Run isolated dry run test in sandbox"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-[#00E5FF]/20 text-white/60 hover:text-[#00E5FF] border border-white/10 transition-colors"
                      >
                        <Box size={13} className={isTesting ? 'animate-spin text-[#00E5FF]' : ''} />
                      </button>

                      {/* Inspect Details */}
                      <button
                        onClick={() => setInspectedCapability(cap)}
                        title="Inspect full metadata and audit report"
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/20 text-white/80 font-mono text-[clamp(7.5px,0.5vw,9.5px)] uppercase border border-white/10 transition-colors"
                      >
                        DETAILS
                      </button>

                      {/* Human Approval Button if review needed */}
                      {cap.status === 'approved' && !cap.enabled && (
                        <button
                          onClick={() => handleApproveSkill(cap.id)}
                          title="Approve for active agent usage"
                          className="px-2.5 py-1 rounded-lg bg-[#00E5FF] text-[#0A1A2F] font-orbitron font-bold text-[clamp(7.5px,0.5vw,9px)] uppercase tracking-wider hover:bg-white transition-all"
                        >
                          APPROVE
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCapabilities.length === 0 && (
            <div className="py-16 text-center text-white/30 font-mono text-[clamp(11px,0.8vw,13px)]">
              No capabilities found matching "{searchQuery}". Run a Research Cycle to discover more tools.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AUDIT TIMELINE LOG */}
      {activeTab === 'activity' && (
        <div className="p-4 sm:p-6 rounded-[24px] bg-white/[0.02] border border-white/10 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[clamp(9px,0.65vw,11px)] font-orbitron font-black text-white/50 tracking-[0.2em] uppercase">
              CHRONOLOGICAL AUDIT & DISCOVERY LOGS
            </span>
            <span className="text-[clamp(8px,0.55vw,10px)] font-mono text-white/40">
              {auditLogs.length} RECORDED EVENTS
            </span>
          </div>

          <div className="space-y-2.5 max-h-[550px] overflow-y-auto custom-scrollbar pr-2">
            {auditLogs.map((log) => (
              <div 
                key={log.id} 
                className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all flex items-start gap-3"
              >
                <div className="mt-0.5 shrink-0">
                  {log.level === 'success' ? (
                    <CheckCircle2 size={16} className="text-green-400" />
                  ) : log.level === 'warn' ? (
                    <AlertTriangle size={16} className="text-yellow-400" />
                  ) : log.level === 'error' ? (
                    <XCircle size={16} className="text-red-400" />
                  ) : (
                    <Compass size={16} className="text-[#00E5FF]" />
                  )}
                </div>

                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between text-[clamp(7.5px,0.5vw,9.5px)] font-mono text-white/40 mb-1">
                    <span className="uppercase font-bold text-[#00E5FF]">{log.phase}</span>
                    <span>{log.timeFormatted}</span>
                  </div>
                  <div className="text-[clamp(11px,0.8vw,13px)] font-orbitron font-bold text-white mb-0.5">
                    {log.title}
                  </div>
                  <div className="text-[clamp(9px,0.7vw,11px)] font-mono text-white/60 leading-relaxed">
                    {log.details}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SETTINGS UI */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          
          {/* Research Agent Configuration */}
          <div className="p-4 sm:p-6 rounded-[24px] bg-white/[0.02] border border-white/10 backdrop-blur-xl space-y-4">
            <h3 className="font-orbitron font-black text-[clamp(12px,0.9vw,15px)] text-white tracking-wider uppercase flex items-center gap-2">
              <Compass size={16} className="text-[#00E5FF]" /> RESEARCH ENGINE CONTROLS
            </h3>

            <div className="space-y-3 font-mono text-[clamp(10px,0.75vw,12px)]">
              {/* Enable / Disable Research */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                <div>
                  <div className="font-bold text-white">Enable Autonomous Research Agent</div>
                  <div className="text-[clamp(8px,0.55vw,10px)] text-white/40">Continual background discovery across verified repos & docs</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={e => handleSaveSettings({ enabled: e.target.checked })}
                  className="w-4 h-4 accent-[#00E5FF] cursor-pointer"
                />
              </div>

              {/* Frequency */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                <div>
                  <div className="font-bold text-white">Execution Frequency</div>
                  <div className="text-[clamp(8px,0.55vw,10px)] text-white/40">Cadence of autonomous discovery sweeps</div>
                </div>
                <select
                  value={settings.frequency}
                  onChange={e => handleSaveSettings({ frequency: e.target.value as any })}
                  className="bg-white/10 border border-white/20 rounded-lg px-2.5 py-1 text-white text-[11px] font-mono outline-none"
                >
                  <option value="manual" className="bg-[#050b18]">Manual Only</option>
                  <option value="5m_demo" className="bg-[#050b18]">Every 5 Mins (Demo)</option>
                  <option value="6h" className="bg-[#050b18]">Every 6 Hours</option>
                  <option value="12h" className="bg-[#050b18]">Every 12 Hours</option>
                  <option value="daily" className="bg-[#050b18]">Daily</option>
                  <option value="weekly" className="bg-[#050b18]">Weekly</option>
                  <option value="smart" className="bg-[#050b18]">Smart (On-Demand)</option>
                </select>
              </div>

              {/* Max Discoveries Per Cycle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                <div>
                  <div className="font-bold text-white">Max Discoveries Per Cycle</div>
                  <div className="text-[clamp(8px,0.55vw,10px)] text-white/40">Limits candidate ingestion volume</div>
                </div>
                <span className="font-bold text-[#00E5FF]">{settings.maxDiscoveriesPerCycle}</span>
              </div>

              {/* Minimum Quality Score */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                <div>
                  <div className="font-bold text-white">Minimum Quality Threshold</div>
                  <div className="text-[clamp(8px,0.55vw,10px)] text-white/40">Rejects low-documentation packages</div>
                </div>
                <span className="font-bold text-green-400">{settings.minQualityScore}/100</span>
              </div>
            </div>

            {/* Source Toggles */}
            <div className="pt-2">
              <div className="text-[clamp(9px,0.65vw,11px)] font-orbitron font-bold text-white/60 uppercase mb-2">
                VERIFIED INTELLIGENCE SOURCES
              </div>
              <div className="grid grid-cols-2 gap-2 text-[clamp(9px,0.65vw,11px)] font-mono">
                {Object.entries(settings.sources).map(([src, isEnabled]) => (
                  <label key={src} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={e => handleSaveSettings({
                        sources: { ...settings.sources, [src]: e.target.checked }
                      })}
                      className="w-3.5 h-3.5 accent-[#00E5FF]"
                    />
                    <span className="uppercase text-white/80">{src.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Integration & Security Safeguards */}
          <div className="p-4 sm:p-6 rounded-[24px] bg-white/[0.02] border border-white/10 backdrop-blur-xl space-y-4">
            <h3 className="font-orbitron font-black text-[clamp(12px,0.9vw,15px)] text-white tracking-wider uppercase flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#2ED8C3]" /> INTEGRATION & SECURITY POLICIES
            </h3>

            <div className="space-y-3 font-mono text-[clamp(10px,0.75vw,12px)]">
              {/* Auto Add Safe Skills */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                <div>
                  <div className="font-bold text-white">Auto-Promote Safe Verified Skills</div>
                  <div className="text-[clamp(8px,0.55vw,10px)] text-white/40">Only promotes if sandbox & security checks pass 100%</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoAddSafeSkills}
                  onChange={e => handleSaveSettings({ autoAddSafeSkills: e.target.checked })}
                  className="w-4 h-4 accent-[#00E5FF] cursor-pointer"
                />
              </div>

              {/* Require Approval for Risky */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                <div>
                  <div className="font-bold text-white">Require Approval for Elevated Permissions</div>
                  <div className="text-[clamp(8px,0.55vw,10px)] text-white/40">Security tools & automation require explicit user approval</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.requireApprovalForRisky}
                  onChange={e => handleSaveSettings({ requireApprovalForRisky: e.target.checked })}
                  className="w-4 h-4 accent-[#00E5FF] cursor-pointer"
                />
              </div>

              {/* Sandbox Enabled */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                <div>
                  <div className="font-bold text-white">Mandatory Sandbox Isolation</div>
                  <div className="text-[clamp(8px,0.55vw,10px)] text-white/40">Dry-run packages in virtual containment before ingestion</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.sandboxEnabled}
                  onChange={e => handleSaveSettings({ sandboxEnabled: e.target.checked })}
                  className="w-4 h-4 accent-[#00E5FF] cursor-pointer"
                />
              </div>

              {/* Credential Protection */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                <div>
                  <div className="font-bold text-white">API Key & Credential Cloaking</div>
                  <div className="text-[clamp(8px,0.55vw,10px)] text-white/40">Strictly blocks skills from reading API keys or secrets</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.credentialProtection}
                  onChange={e => handleSaveSettings({ credentialProtection: e.target.checked })}
                  className="w-4 h-4 accent-[#00E5FF] cursor-pointer"
                />
              </div>
            </div>

            {/* Reset to Factory Defaults */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-[clamp(8px,0.55vw,10px)] font-mono text-white/40">
                Registry Management
              </span>
              <button
                onClick={() => {
                  if (confirm("Reset Skill Registry to factory default state?")) {
                    skillRegistry.resetToDefaults();
                    showToast("Registry reset to initial verified capabilities.");
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/30 text-[clamp(8px,0.55vw,10px)] font-mono uppercase transition-colors"
              >
                Reset Default Registry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECTION MODAL DRAWER */}
      {inspectedCapability && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0A1A2F] border border-[#00E5FF]/40 rounded-[28px] p-6 space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar animate-slide-in">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-[#00E5FF]/10 text-[#00E5FF] uppercase border border-[#00E5FF]/30">
                    {inspectedCapability.category}
                  </span>
                  <span className="text-[9px] font-mono text-white/40">ID: {inspectedCapability.id}</span>
                </div>
                <h3 className="text-xl font-orbitron font-black text-white">
                  {inspectedCapability.name}
                </h3>
              </div>
              <button
                onClick={() => setInspectedCapability(null)}
                className="p-1 text-white/40 hover:text-white"
              >
                <XCircle size={20} />
              </button>
            </div>

            <p className="text-sm text-white/70 font-mono leading-relaxed">
              {inspectedCapability.description}
            </p>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="text-white/40 text-[9px] uppercase">Version</div>
                <div className="font-bold text-white mt-0.5">{inspectedCapability.version}</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="text-white/40 text-[9px] uppercase">Quality Score</div>
                <div className="font-bold text-[#00E5FF] mt-0.5">{inspectedCapability.qualityScore}/100</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="text-white/40 text-[9px] uppercase">Security Status</div>
                <div className="font-bold text-green-400 mt-0.5 uppercase">{inspectedCapability.securityStatus}</div>
              </div>
            </div>

            {/* Sandbox Audit Output */}
            {inspectedCapability.sandboxAudit && (
              <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 font-mono text-xs">
                <div className="text-[#00E5FF] text-[10px] uppercase font-bold mb-1.5">
                  Sandbox Containment Telemetry
                </div>
                <pre className="text-white/70 whitespace-pre-wrap max-h-36 overflow-y-auto custom-scrollbar text-[11px]">
                  {inspectedCapability.sandboxAudit.isolatedTestOutput}
                </pre>
              </div>
            )}

            {/* Use Cases */}
            <div className="space-y-1.5 font-mono text-xs">
              <div className="text-white/40 uppercase text-[10px]">Developer Use Cases</div>
              {inspectedCapability.useCases.map((uc, i) => (
                <div key={i} className="flex items-center gap-2 text-white/80">
                  <Check size={12} className="text-[#00E5FF]" /> {uc}
                </div>
              ))}
            </div>

            {/* Tools list */}
            {inspectedCapability.tools && inspectedCapability.tools.length > 0 && (
              <div className="space-y-1.5 font-mono text-xs">
                <div className="text-white/40 uppercase text-[10px]">Exposed Tools</div>
                {inspectedCapability.tools.map((tl, i) => (
                  <div key={i} className="p-2 rounded-lg bg-white/5 border border-white/5">
                    <span className="font-bold text-[#00E5FF]">{tl.name}</span>: <span className="text-white/70">{tl.description}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
              {inspectedCapability.rollbackAvailable && (
                <button
                  onClick={() => {
                    handleRollbackSkill(inspectedCapability.id);
                    setInspectedCapability(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-xs font-orbitron font-bold uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Undo2 size={13} /> Rollback Version
                </button>
              )}
              <button
                onClick={() => setInspectedCapability(null)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-orbitron font-bold uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
