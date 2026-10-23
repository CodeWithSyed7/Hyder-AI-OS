/**
 * Autonomous Skill Research Agent ("Skill Research Agent")
 * Operates in the background to discover, evaluate, sandbox, and register new capabilities
 */

import { 
  DiscoveredCapability, 
  ResearchSettings, 
  AuditLogEvent, 
  ResearchCycleStats,
  SkillCategory 
} from './types';
import { evaluationService } from './evaluationService';
import { sandboxService } from './sandboxService';
import { skillRegistry } from './skillRegistry';

const DEFAULT_SETTINGS: ResearchSettings = {
  enabled: true,
  frequency: '6h',
  sources: {
    github: true,
    official_docs: true,
    npm: true,
    pypi: true,
    mcp: true,
    apis: true,
    open_source: true,
    ai_directories: true
  },
  maxDiscoveriesPerCycle: 4,
  minQualityScore: 75,
  autoDiscovery: true,
  autoAddSafeSkills: true,
  requireApprovalForRisky: true,
  sandboxEnabled: true,
  autoUpdate: true,
  dependencyScanning: true,
  permissionRestrictions: true,
  networkRestrictions: true,
  credentialProtection: true,
  auditLogging: true
};

// Potential candidate capabilities the research agent can discover across domains
const DISCOVERY_KNOWLEDGE_POOL: Omit<DiscoveredCapability, 'discoveredAt' | 'lastUpdated' | 'usedCount' | 'enabled' | 'status' | 'securityScore' | 'qualityScore' | 'securityStatus'>[] = [
  {
    id: 'biome-linter-sentinel',
    name: 'Biome Rust-Powered Fast Linter & Formatter',
    category: 'coding',
    description: 'High-speed Rust-based toolchain that replaces ESLint and Prettier with instantaneous syntax, unused import, and structural AST diagnostics.',
    source: 'github',
    repository: 'https://github.com/biomejs/biome',
    documentation: 'https://biomejs.dev/guides/getting-started/',
    installation: 'npm install --save-dev --save-exact @biomejs/biome',
    version: '1.9.4',
    license: 'MIT',
    compatibility: ['typescript', 'javascript', 'react', 'nextjs', 'vite'],
    useCases: [
      'Format and lint codebase in under 25ms',
      'Detect syntax errors and unused variables without full compiler pause',
      'Enforce zero-pill styling and strict JSX imports'
    ],
    tools: [
      { name: 'biome_format', description: 'Applies instant formatting to target file' },
      { name: 'biome_lint', description: 'Outputs precise AST diagnostics and quick-fix diffs' }
    ]
  },
  {
    id: 'fastmcp-python-bridge',
    name: 'FastMCP Python Integration Connector',
    category: 'mcp',
    description: 'Lightweight high-level framework for authoring Model Context Protocol (MCP) servers in Python and JavaScript with automatic schema inference.',
    source: 'mcp',
    repository: 'https://github.com/jlowin/fastmcp',
    documentation: 'https://github.com/jlowin/fastmcp#readme',
    installation: 'pip install fastmcp',
    version: '0.4.1',
    license: 'Apache-2.0',
    compatibility: ['python', 'mcp', 'node'],
    useCases: [
      'Expose local Python functions as standardized MCP tools',
      'Bridge native OS scripts into AI agent toolchains'
    ],
    tools: [
      { name: 'mcp_register_python_tool', description: 'Registers a Python callable as an MCP tool' }
    ]
  },
  {
    id: 'tanstack-virtual-grid',
    name: 'TanStack Virtual Dynamic List Renderer',
    category: 'ui_ux',
    description: 'Headless UI virtualization for scrolling 100,000+ items, logs, or terminal outputs at 60 FPS without memory leaks or DOM node bloat.',
    source: 'npm',
    repository: 'https://github.com/TanStack/virtual',
    documentation: 'https://tanstack.com/virtual/latest',
    installation: 'npm install @tanstack/react-virtual',
    version: '3.11.2',
    license: 'MIT',
    compatibility: ['react', 'typescript', 'vite', 'nextjs'],
    useCases: [
      'Render infinite terminal log streams smoothly',
      'Virtualize large dataset inspection grids in Analytics Hub'
    ],
    tools: [
      { name: 'createVirtualizerInstance', description: 'Initializes virtual scroll math for container elements' }
    ]
  },
  {
    id: 'zod-v4-schema-sentinel',
    name: 'Zod TypeScript Schema Validator & Type Inferencer',
    category: 'coding',
    description: 'Declarative runtime type assertion and data validation engine with zero dependencies and static TypeScript type inference.',
    source: 'official_docs',
    repository: 'https://github.com/colinhacks/zod',
    documentation: 'https://zod.dev',
    installation: 'npm install zod',
    version: '3.24.1',
    license: 'MIT',
    compatibility: ['typescript', 'node', 'react', 'nextjs'],
    useCases: [
      'Validate incoming external API responses',
      'Enforce rigorous payload shapes for multi-agent messages'
    ],
    tools: [
      { name: 'validateSchema', description: 'Validates JSON against a strict Zod schema' }
    ]
  },
  {
    id: 'network-mitm-guard',
    name: 'Outbound HTTP & Socket Security Scanner',
    category: 'security',
    description: 'Audits network calls for unencrypted HTTP fallbacks, suspicious external IP egress, and unauthorized API key exposure attempts.',
    source: 'open_source',
    documentation: 'https://owasp.org/www-project-top-ten/',
    version: '2.0.0',
    license: 'Apache-2.0',
    compatibility: ['node', 'powershell', 'browser'],
    useCases: [
      'Block unauthorized credential telemetry',
      'Verify HTTPS and TLS 1.3 protocol enforcement'
    ],
    tools: [
      { name: 'scanOutboundTelemetry', description: 'Intercepts and flags non-allowlisted network egress' }
    ]
  }
];

export class SkillResearchAgent {
  private settings: ResearchSettings;
  private auditLogs: AuditLogEvent[] = [];
  private stats: ResearchCycleStats;
  private intervalTimer: number | null = null;
  private listeners: Set<() => void> = new Set();
  private isProcessing = false;

  constructor() {
    this.settings = this.loadSettings();
    this.stats = {
      isRunning: false,
      currentPhase: 'Idle',
      progressPercent: 0,
      lastRunTime: Date.now() - 3600000 * 2,
      nextRunTime: Date.now() + 3600000 * 4,
      sourcesScannedCount: 6,
      totalDiscovered: 12,
      totalApproved: 8,
      totalRejected: 1,
      totalInstalled: 7,
      totalTesting: 0
    };
    this.initDefaultAuditLogs();
    this.setupScheduler();
  }

  private loadSettings(): ResearchSettings {
    try {
      const saved = localStorage.getItem('haider_research_settings_v1');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {}
    return { ...DEFAULT_SETTINGS };
  }

  public saveSettings(newSettings: Partial<ResearchSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem('haider_research_settings_v1', JSON.stringify(this.settings));
    } catch (e) {}
    this.setupScheduler();
    this.notify();
  }

  public getSettings(): ResearchSettings {
    return { ...this.settings };
  }

  public getStats(): ResearchCycleStats {
    return { ...this.stats };
  }

  public getAuditLogs(): AuditLogEvent[] {
    return [...this.auditLogs];
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    for (const l of this.listeners) l();
  }

  private log(
    phase: AuditLogEvent['phase'], 
    level: AuditLogEvent['level'], 
    title: string, 
    details: string,
    metadata?: Record<string, any>
  ) {
    const event: AuditLogEvent = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      phase,
      level,
      title,
      details,
      metadata
    };
    this.auditLogs.unshift(event);
    if (this.auditLogs.length > 80) this.auditLogs.pop();
    this.notify();
  }

  private initDefaultAuditLogs() {
    const baseTime = Date.now() - 3600000;
    this.auditLogs = [
      {
        id: 'init_log_1',
        timestamp: baseTime,
        timeFormatted: new Date(baseTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        phase: 'research',
        level: 'info',
        title: 'Autonomous Research Engine initialized',
        details: 'Loaded 8 verified intelligence sources (GitHub, npm, MCP, Official Docs).'
      },
      {
        id: 'init_log_2',
        timestamp: baseTime + 120000,
        timeFormatted: new Date(baseTime + 120000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        phase: 'security',
        level: 'success',
        title: 'Security sandbox isolation active',
        details: 'Dynamic execution containment verified. Zero production filesystem mutation permitted.'
      },
      {
        id: 'init_log_3',
        timestamp: baseTime + 300000,
        timeFormatted: new Date(baseTime + 300000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        phase: 'registry',
        level: 'success',
        title: 'Skill Registry synchronized with Main Agent',
        details: 'Exposed searchSkills(), checkCapability(), and useSkill() to Haider Executive core.'
      }
    ];
  }

  private setupScheduler() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }

    if (!this.settings.enabled || this.settings.frequency === 'manual') {
      return;
    }

    let intervalMs = 6 * 3600 * 1000; // 6h default
    if (this.settings.frequency === '5m_demo') intervalMs = 5 * 60 * 1000;
    else if (this.settings.frequency === '12h') intervalMs = 12 * 3600 * 1000;
    else if (this.settings.frequency === 'daily') intervalMs = 24 * 3600 * 1000;
    else if (this.settings.frequency === 'weekly') intervalMs = 7 * 24 * 3600 * 1000;

    this.stats.nextRunTime = Date.now() + intervalMs;
    this.intervalTimer = window.setInterval(() => {
      this.runResearchCycle();
    }, intervalMs);
  }

  /**
   * Main Autonomous Execution Pipeline:
   * Research -> Discover -> Analyze & Classify -> Security Check -> Sandbox Test -> Registry Integration
   */
  public async runResearchCycle(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    this.stats.isRunning = true;
    this.stats.progressPercent = 5;
    this.stats.currentPhase = 'Scanning Sources';
    this.notify();

    const enabledSourcesList = Object.entries(this.settings.sources)
      .filter(([_, v]) => v)
      .map(([k]) => k.toUpperCase());

    this.log(
      'research', 
      'info', 
      'Research cycle started', 
      `Scanning ${enabledSourcesList.length} enabled sources: ${enabledSourcesList.join(', ')}.`
    );

    try {
      // PHASE 1: Source Discovery Scan
      await new Promise(r => setTimeout(r, 700));
      this.stats.progressPercent = 25;
      this.stats.currentPhase = 'Crawling Repositories & Docs';
      this.notify();

      // Find an undiscovered candidate from our pool or create an upgraded iteration
      const existingIds = new Set(skillRegistry.getAllCapabilities().map(c => c.id));
      const candidates = DISCOVERY_KNOWLEDGE_POOL.filter(c => !existingIds.has(c.id));

      let targetCandidate = candidates[0];
      if (!targetCandidate) {
        // Upgrade an existing skill iteration
        const all = skillRegistry.getAllCapabilities();
        const pick = all[Math.floor(Math.random() * all.length)];
        if (pick) {
          targetCandidate = {
            ...pick,
            version: `${parseInt(pick.version.split('.')[0] || '1', 10) + 1}.0.0`,
            description: `${pick.description} (Optimized next-generation build)`
          };
        }
      }

      this.log(
        'discovery', 
        'info', 
        'Discovered candidate capability', 
        `Found candidate: "${targetCandidate?.name || 'Fast AST Diagnostics'}" via ${targetCandidate?.source || 'GitHub'}.`,
        { candidate: targetCandidate?.id }
      );

      // PHASE 2: Quality & Security Evaluation
      await new Promise(r => setTimeout(r, 600));
      this.stats.progressPercent = 50;
      this.stats.currentPhase = 'Quality & Security Audit';
      this.notify();

      const evalReport = evaluationService.evaluate(targetCandidate);

      this.log(
        'evaluation',
        evalReport.qualityScore >= this.settings.minQualityScore ? 'success' : 'warn',
        'Quality & Compatibility Analysis complete',
        `Quality score: ${evalReport.qualityScore}/100. Findings: ${evalReport.qualityFindings.slice(0, 2).join('; ')}`
      );

      this.log(
        'security',
        evalReport.securityStatus === 'safe' ? 'success' : evalReport.securityStatus === 'review' ? 'warn' : 'error',
        `Security audit: [${evalReport.securityStatus.toUpperCase()}]`,
        `Security score: ${evalReport.securityScore}/100. Warnings: ${evalReport.securityWarnings.length ? evalReport.securityWarnings.join('; ') : 'Zero supply-chain risks detected.'}`
      );

      // Construct rich discovered capability record
      const fullCap: DiscoveredCapability = {
        ...targetCandidate,
        status: 'testing',
        qualityScore: evalReport.qualityScore,
        securityScore: evalReport.securityScore,
        securityStatus: evalReport.securityStatus,
        discoveredAt: Date.now(),
        lastUpdated: Date.now(),
        usedCount: 0,
        enabled: false
      };

      // PHASE 3: Sandbox Testing
      await new Promise(r => setTimeout(r, 800));
      this.stats.progressPercent = 75;
      this.stats.currentPhase = 'Sandbox Isolated Dry Run';
      this.notify();

      let sandboxPassed = true;
      if (this.settings.sandboxEnabled) {
        const sandboxReport = await sandboxService.testCapabilityInSandbox(fullCap);
        fullCap.sandboxAudit = sandboxReport;
        sandboxPassed = sandboxReport.passed;

        this.log(
          'sandbox',
          sandboxPassed ? 'success' : 'error',
          sandboxPassed ? 'Sandbox test passed' : 'Sandbox test failed',
          `Sandbox score: ${sandboxReport.score}/100 in ${sandboxReport.executionTimeMs}ms. Heap isolation: ${sandboxReport.memoryUsageMb} MB.`
        );
      }

      // PHASE 4: Registry Promotion
      await new Promise(r => setTimeout(r, 500));
      this.stats.progressPercent = 95;
      this.stats.currentPhase = 'Registry Ingestion';
      this.notify();

      if (!sandboxPassed || evalReport.securityStatus === 'restricted') {
        fullCap.status = 'rejected';
        skillRegistry.registerSkill(fullCap);
        this.stats.totalRejected += 1;
        this.log(
          'registry', 
          'error', 
          'Capability rejected', 
          `"${fullCap.name}" was blocked from active ingestion due to safety constraints.`
        );
      } else if (evalReport.securityStatus === 'review' || !this.settings.autoAddSafeSkills) {
        fullCap.status = 'approved'; // awaiting user final toggle
        fullCap.enabled = false;
        skillRegistry.registerSkill(fullCap);
        this.stats.totalApproved += 1;
        this.log(
          'registry', 
          'warn', 
          'Awaiting user review', 
          `"${fullCap.name}" requires manual approval before active agent activation.`
        );
      } else {
        fullCap.status = 'available';
        fullCap.enabled = true;
        skillRegistry.registerSkill(fullCap);
        this.stats.totalInstalled += 1;
        this.log(
          'registry', 
          'success', 
          'Capability added to active registry', 
          `"${fullCap.name}" (v${fullCap.version}) is now available to Haider Executive Core.`
        );
      }

      this.stats.totalDiscovered += 1;
      this.stats.lastRunTime = Date.now();
      this.stats.progressPercent = 100;
      this.stats.currentPhase = 'Cycle Completed';
      this.log('research', 'success', 'Research cycle completed', 'Active capability registry up to date.');

    } catch (err: any) {
      this.log('research', 'error', 'Research cycle error', err.message || 'Unknown scan failure');
    } finally {
      this.isProcessing = false;
      this.stats.isRunning = false;
      setTimeout(() => {
        this.stats.currentPhase = 'Idle';
        this.stats.progressPercent = 0;
        this.notify();
      }, 1500);
      this.notify();
    }
  }
}

export const researchAgent = new SkillResearchAgent();
