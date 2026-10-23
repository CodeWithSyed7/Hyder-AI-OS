/**
 * Self-Improving Skill Research & Integration Agent - Type Definitions
 */

export type SkillCategory = 
  | 'debugging' 
  | 'coding' 
  | 'testing' 
  | 'security' 
  | 'ui_ux' 
  | 'database' 
  | 'api_integration' 
  | 'mcp' 
  | 'automation' 
  | 'ai_models' 
  | 'browser_automation' 
  | 'research' 
  | 'deployment' 
  | 'design';

export type CapabilityStatus = 
  | 'discovered' 
  | 'analyzing' 
  | 'approved' 
  | 'testing' 
  | 'installed' 
  | 'available' 
  | 'rejected' 
  | 'disabled' 
  | 'deprecated' 
  | 'failed';

export type SecurityApprovalLevel = 'safe' | 'review' | 'restricted';

export interface SkillTool {
  name: string;
  description: string;
  parameters?: Record<string, any>;
}

export interface SandboxTestResult {
  passed: boolean;
  score: number;
  executionTimeMs: number;
  memoryUsageMb: number;
  warnings: string[];
  isolatedTestOutput: string;
  checkedAt: number;
}

export interface DiscoveredCapability {
  id: string;
  name: string;
  category: SkillCategory;
  description: string;
  source: 'github' | 'official_docs' | 'npm' | 'pypi' | 'mcp' | 'api' | 'open_source' | 'community' | 'ai_directory';
  repository?: string;
  documentation?: string;
  installation?: string;
  version: string;
  latestVersion?: string;
  previousVersion?: string;
  license: string;
  securityStatus: SecurityApprovalLevel;
  securityScore: number; // 0-100
  qualityScore: number;  // 0-100
  compatibility: string[];
  useCases: string[];
  tools: SkillTool[];
  status: CapabilityStatus;
  discoveredAt: number;
  lastUpdated: number;
  usedCount: number;
  enabled: boolean;
  sandboxAudit?: SandboxTestResult;
  changelog?: string;
  rollbackAvailable?: boolean;
}

export interface ResearchSourceConfig {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
  iconName: string;
}

export interface ResearchSettings {
  enabled: boolean;
  frequency: 'manual' | '5m_demo' | '6h' | '12h' | 'daily' | 'weekly' | 'smart';
  sources: {
    github: boolean;
    official_docs: boolean;
    npm: boolean;
    pypi: boolean;
    mcp: boolean;
    apis: boolean;
    open_source: boolean;
    ai_directories: boolean;
  };
  maxDiscoveriesPerCycle: number;
  minQualityScore: number;
  autoDiscovery: boolean;
  autoAddSafeSkills: boolean;
  requireApprovalForRisky: boolean;
  sandboxEnabled: boolean;
  autoUpdate: boolean;
  dependencyScanning: boolean;
  permissionRestrictions: boolean;
  networkRestrictions: boolean;
  credentialProtection: boolean;
  auditLogging: boolean;
}

export interface AuditLogEvent {
  id: string;
  timestamp: number;
  timeFormatted: string;
  phase: 'research' | 'discovery' | 'evaluation' | 'security' | 'sandbox' | 'registry' | 'rollback' | 'execution';
  level: 'info' | 'success' | 'warn' | 'error';
  title: string;
  details: string;
  targetCapabilityId?: string;
  metadata?: Record<string, any>;
}

export interface ResearchCycleStats {
  isRunning: boolean;
  currentPhase: string;
  progressPercent: number;
  lastRunTime: number;
  nextRunTime: number;
  sourcesScannedCount: number;
  totalDiscovered: number;
  totalApproved: number;
  totalRejected: number;
  totalInstalled: number;
  totalTesting: number;
}
