/**
 * Central Skill & Tool Registry ("skills/registry")
 * Provides an intelligent query interface for the Main Manager Agent
 */

import { DiscoveredCapability, SkillCategory, CapabilityStatus } from './types';

const INITIAL_SKILLS: DiscoveredCapability[] = [
  {
    id: 'react-debugger-pro',
    name: 'React Hydration & Component Debugger',
    category: 'debugging',
    description: 'Specialist skill for diagnosing SSR hydration mismatches, layout shift thrashing, and unhandled React 19 lifecycle warnings.',
    source: 'github',
    repository: 'https://github.com/facebook/react',
    documentation: 'https://react.dev/reference/react-dom/client/hydrateRoot',
    installation: 'npm install @react/devtools-core',
    version: '2.4.1',
    license: 'MIT',
    securityStatus: 'safe',
    securityScore: 98,
    qualityScore: 96,
    compatibility: ['react', 'nextjs', 'typescript', 'vite'],
    useCases: [
      'Fix React hydration mismatch errors',
      'Diagnose useEffect infinite rendering loops',
      'Optimize re-render bottlenecks'
    ],
    tools: [
      { name: 'inspectHydrationDiff', description: 'Compares server-rendered HTML with client-side VDOM representation' },
      { name: 'profileRenderCycles', description: 'Traces component tree rerender triggers and state transitions' }
    ],
    status: 'available',
    discoveredAt: Date.now() - 86400000 * 3,
    lastUpdated: Date.now() - 86400000 * 1,
    usedCount: 14,
    enabled: true,
    sandboxAudit: {
      passed: true,
      score: 95,
      executionTimeMs: 120,
      memoryUsageMb: 2.4,
      warnings: [],
      isolatedTestOutput: '[SANDBOX] React Hydration Debugger passed all synthetic tests.',
      checkedAt: Date.now() - 86400000 * 1
    }
  },
  {
    id: 'nextjs-hydration-sentinel',
    name: 'Next.js App Router Diagnostic Sentinel',
    category: 'debugging',
    description: 'Autonomous diagnosis of Next.js 15 Server Components vs Client Components boundary violations and cookie/header access conflicts.',
    source: 'official_docs',
    repository: 'https://github.com/vercel/next.js',
    documentation: 'https://nextjs.org/docs/messages/react-hydration-error',
    version: '15.1.0',
    license: 'MIT',
    securityStatus: 'safe',
    securityScore: 96,
    qualityScore: 94,
    compatibility: ['nextjs', 'react', 'typescript'],
    useCases: [
      'Resolve "Text content did not match" Next.js errors',
      'Verify "use client" boundaries',
      'Audit async Server Actions'
    ],
    tools: [
      { name: 'auditServerClientBoundaries', description: 'Scans import tree for client-only APIs called in server environments' }
    ],
    status: 'available',
    discoveredAt: Date.now() - 86400000 * 4,
    lastUpdated: Date.now() - 86400000 * 2,
    usedCount: 9,
    enabled: true
  },
  {
    id: 'mcp-filesystem-connector',
    name: 'Model Context Protocol (MCP) Secure Filesystem',
    category: 'mcp',
    description: 'Standardized Model Context Protocol server connector granting structured, read-only or authorized write access to project directories.',
    source: 'mcp',
    repository: 'https://github.com/modelcontextprotocol/servers',
    documentation: 'https://modelcontextprotocol.io/docs/quickstart',
    installation: 'npx -y @modelcontextprotocol/server-filesystem',
    version: '1.2.0',
    license: 'MIT',
    securityStatus: 'safe',
    securityScore: 92,
    qualityScore: 95,
    compatibility: ['node', 'typescript', 'mcp'],
    useCases: [
      'Safely browse workspace directories via standardized MCP JSON-RPC',
      'Query file structural trees without shell injection'
    ],
    tools: [
      { name: 'mcp_read_file', description: 'Read file contents inside bounded root' },
      { name: 'mcp_list_directory', description: 'Enumerate directory entries securely' }
    ],
    status: 'available',
    discoveredAt: Date.now() - 86400000 * 5,
    lastUpdated: Date.now() - 86400000 * 2,
    usedCount: 22,
    enabled: true
  },
  {
    id: 'tailwind-fluid-styler',
    name: 'Tailwind Fluid Typography & Glassmorphism Generator',
    category: 'ui_ux',
    description: 'Automatic synthesis of clamp() fluid typography formulas and luxury obsidian glassmorphism palettes with Zero-Pill discipline.',
    source: 'official_docs',
    documentation: 'https://tailwindcss.com/docs',
    version: '4.0.0',
    license: 'MIT',
    securityStatus: 'safe',
    securityScore: 100,
    qualityScore: 92,
    compatibility: ['react', 'vite', 'tailwind'],
    useCases: [
      'Generate clamp(min, val, max) responsive font scales',
      'Refine cubic-bezier transitions for smooth animations',
      'Eliminate visual layout shifts on dynamic screens'
    ],
    tools: [
      { name: 'generateFluidClamp', description: 'Computes precision linear interpolation clamp() values' }
    ],
    status: 'available',
    discoveredAt: Date.now() - 86400000 * 2,
    lastUpdated: Date.now() - 86400000 * 1,
    usedCount: 31,
    enabled: true
  },
  {
    id: 'security-auditor-guard',
    name: 'Local Port & Process Security Auditor',
    category: 'security',
    description: 'Audits listening TCP/UDP ports, detects orphaned zombie processes, and validates command safety policies before PowerShell execution.',
    source: 'open_source',
    repository: 'https://github.com/microsoft/powershell',
    documentation: 'https://learn.microsoft.com/en-us/powershell/module/nettcpip/get-nettcpconnection',
    version: '3.1.0',
    license: 'MIT',
    securityStatus: 'safe',
    securityScore: 97,
    qualityScore: 91,
    compatibility: ['powershell', 'node', 'windows'],
    useCases: [
      'Inspect which application owns port 3000, 5173, or 8080',
      'Detect unauthorized remote outbound socket attempts',
      'Flag destructive rm/format directives'
    ],
    tools: [
      { name: 'auditPortBindings', description: 'Correlates TCP ports with Windows PID and process image names' }
    ],
    status: 'available',
    discoveredAt: Date.now() - 86400000 * 6,
    lastUpdated: Date.now() - 86400000 * 2,
    usedCount: 18,
    enabled: true
  },
  {
    id: 'playwright-e2e-runner',
    name: 'Playwright Headless Browser Automation Testbed',
    category: 'testing',
    description: 'Automated synthesis and headless verification of cross-browser tests, DOM assertions, and network mock intercepts.',
    source: 'github',
    repository: 'https://github.com/microsoft/playwright',
    documentation: 'https://playwright.dev/docs/intro',
    installation: 'npm install -D @playwright/test',
    version: '1.50.0',
    license: 'Apache-2.0',
    securityStatus: 'review',
    securityScore: 84,
    qualityScore: 98,
    compatibility: ['node', 'typescript', 'vite'],
    useCases: [
      'Generate end-to-end user journey test suites',
      'Audit visual regression across viewport breakpoints'
    ],
    tools: [
      { name: 'synthesizeE2ETest', description: 'Generates Playwright test spec from user scenario' }
    ],
    status: 'available',
    discoveredAt: Date.now() - 86400000 * 4,
    lastUpdated: Date.now() - 86400000 * 2,
    usedCount: 7,
    enabled: true
  }
];

export interface RankedSkill {
  skill: DiscoveredCapability;
  relevanceScore: number;
  matchReasons: string[];
}

export class SkillRegistryService {
  private skills: Map<string, DiscoveredCapability> = new Map();
  private storageKey = 'haider_skills_registry_v1';
  private listeners: Set<(skills: DiscoveredCapability[]) => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed: DiscoveredCapability[] = JSON.parse(saved);
        parsed.forEach(s => this.skills.set(s.id, s));
      } else {
        INITIAL_SKILLS.forEach(s => this.skills.set(s.id, s));
        this.saveToStorage();
      }
    } catch (e) {
      INITIAL_SKILLS.forEach(s => this.skills.set(s.id, s));
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(Array.from(this.skills.values())));
      this.notifyListeners();
    } catch (e) {}
  }

  public subscribe(cb: (skills: DiscoveredCapability[]) => void): () => void {
    this.listeners.add(cb);
    cb(Array.from(this.skills.values()));
    return () => this.listeners.delete(cb);
  }

  private notifyListeners() {
    const arr = Array.from(this.skills.values());
    for (const l of this.listeners) l(arr);
  }

  /**
   * Main Manager Agent Query Interface
   * Searches registry for skills matching a given task description
   */
  public async searchSkills(taskPrompt: string): Promise<RankedSkill[]> {
    const promptLower = taskPrompt.toLowerCase();
    const results: RankedSkill[] = [];

    for (const skill of this.skills.values()) {
      if (!skill.enabled || skill.status !== 'available') continue;

      let score = 0;
      const matchReasons: string[] = [];

      // Category matching
      if (
        (promptLower.includes('fix') || promptLower.includes('bug') || promptLower.includes('error') || promptLower.includes('hydration')) &&
        skill.category === 'debugging'
      ) {
        score += 40;
        matchReasons.push("Matches debugging domain");
      }

      if (
        (promptLower.includes('port') || promptLower.includes('kill') || promptLower.includes('security') || promptLower.includes('process')) &&
        skill.category === 'security'
      ) {
        score += 45;
        matchReasons.push("Matches security & port inspection domain");
      }

      if (
        (promptLower.includes('style') || promptLower.includes('css') || promptLower.includes('ui') || promptLower.includes('color') || promptLower.includes('pulse')) &&
        skill.category === 'ui_ux'
      ) {
        score += 35;
        matchReasons.push("Matches UI/UX styling domain");
      }

      if (
        (promptLower.includes('mcp') || promptLower.includes('file') || promptLower.includes('directory')) &&
        skill.category === 'mcp'
      ) {
        score += 35;
        matchReasons.push("Matches MCP tool server domain");
      }

      // Keyword & use case matching
      for (const uc of skill.useCases) {
        const ucWords = uc.toLowerCase().split(/\s+/);
        const matchCount = ucWords.filter(w => w.length > 3 && promptLower.includes(w)).length;
        if (matchCount >= 2) {
          score += 25;
          matchReasons.push(`Aligned with use case: "${uc}"`);
          break;
        }
      }

      // Name & description keywords
      if (skill.name.toLowerCase().split(/\s+/).some(w => w.length > 3 && promptLower.includes(w))) {
        score += 20;
        matchReasons.push(`Direct skill keyword match: "${skill.name}"`);
      }

      // Quality score contribution (up to 15 points)
      score += Math.round(skill.qualityScore * 0.15);

      if (score >= 35) {
        results.push({
          skill,
          relevanceScore: Math.min(100, score),
          matchReasons
        });
      }
    }

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  public getSkill(skillId: string): DiscoveredCapability | undefined {
    return this.skills.get(skillId);
  }

  public listSkills(category?: SkillCategory): DiscoveredCapability[] {
    const all = Array.from(this.skills.values());
    return category ? all.filter(s => s.category === category) : all;
  }

  public checkCapability(capabilityId: string): boolean {
    const s = this.skills.get(capabilityId);
    return !!(s && s.enabled && s.status === 'available');
  }

  public async useSkill(skillId: string): Promise<{ success: boolean; message: string }> {
    const s = this.skills.get(skillId);
    if (!s) return { success: false, message: `Skill '${skillId}' not found.` };
    if (!s.enabled) return { success: false, message: `Skill '${s.name}' is currently disabled.` };

    s.usedCount += 1;
    s.lastUpdated = Date.now();
    this.saveToStorage();

    return { 
      success: true, 
      message: `Activated capability "${s.name}" (v${s.version}) for executive execution.` 
    };
  }

  public registerSkill(cap: DiscoveredCapability): boolean {
    if (!cap.id) cap.id = `cap_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    this.skills.set(cap.id, cap);
    this.saveToStorage();
    return true;
  }

  public toggleSkill(skillId: string, enabled: boolean): void {
    const s = this.skills.get(skillId);
    if (s) {
      s.enabled = enabled;
      s.status = enabled ? (s.status === 'disabled' ? 'available' : s.status) : 'disabled';
      this.saveToStorage();
    }
  }

  public approveSkill(skillId: string): void {
    const s = this.skills.get(skillId);
    if (s) {
      s.status = 'available';
      s.enabled = true;
      s.lastUpdated = Date.now();
      this.saveToStorage();
    }
  }

  public rejectSkill(skillId: string, reason?: string): void {
    const s = this.skills.get(skillId);
    if (s) {
      s.status = 'rejected';
      s.enabled = false;
      s.changelog = reason || 'Rejected during security or user review';
      this.saveToStorage();
    }
  }

  public rollbackSkill(skillId: string): void {
    const s = this.skills.get(skillId);
    if (s && s.previousVersion) {
      const current = s.version;
      s.version = s.previousVersion;
      s.previousVersion = current;
      s.changelog = `Rolled back to v${s.version}`;
      s.lastUpdated = Date.now();
      this.saveToStorage();
    }
  }

  public resetToDefaults(): void {
    this.skills.clear();
    INITIAL_SKILLS.forEach(s => this.skills.set(s.id, { ...s }));
    this.saveToStorage();
  }

  public getAllCapabilities(): DiscoveredCapability[] {
    return Array.from(this.skills.values());
  }
}

export const skillRegistry = new SkillRegistryService();
