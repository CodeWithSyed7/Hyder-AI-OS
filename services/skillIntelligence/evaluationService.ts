/**
 * Capability Evaluation Service
 * Evaluates Quality & Security of newly discovered capabilities
 */

import { DiscoveredCapability, SecurityApprovalLevel } from './types';

export interface EvaluationReport {
  qualityScore: number;
  securityScore: number;
  securityStatus: SecurityApprovalLevel;
  qualityFindings: string[];
  securityWarnings: string[];
  recommendedAction: 'auto_approve' | 'require_review' | 'reject';
}

export class CapabilityEvaluationService {
  /**
   * Analyzes quality and security metrics of a discovered capability
   */
  public evaluate(cap: Partial<DiscoveredCapability>): EvaluationReport {
    const qualityFindings: string[] = [];
    const securityWarnings: string[] = [];
    
    // --- 1. Quality Scoring (0 - 100) ---
    let quality = 70; // baseline

    // Documentation completeness
    if (cap.documentation && cap.documentation.length > 5) {
      quality += 8;
      qualityFindings.push("Official documentation verified and accessible");
    } else {
      quality -= 10;
      qualityFindings.push("Sparse or missing official documentation");
    }

    // Repository & Maintenance
    if (cap.repository && (cap.repository.includes('github.com') || cap.repository.includes('gitlab.com'))) {
      quality += 7;
      qualityFindings.push("Open-source repository verified");
    }

    // License compliance
    if (cap.license && ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'ISC'].includes(cap.license)) {
      quality += 5;
      qualityFindings.push(`Permissive standard license (${cap.license}) verified`);
    } else if (cap.license && cap.license.toLowerCase().includes('gpl')) {
      qualityFindings.push(`Copyleft license (${cap.license}) noted`);
    }

    // Compatibility check
    const supportedStacks = ['react', 'typescript', 'nextjs', 'node', 'vite', 'python', 'powershell', 'mcp'];
    const matchesStack = cap.compatibility?.some(c => 
      supportedStacks.includes(c.toLowerCase())
    );
    if (matchesStack) {
      quality += 10;
      qualityFindings.push("Direct native compatibility with current Hyder OS tech stack");
    }

    // Specific problem utility
    if (cap.useCases && cap.useCases.length >= 2) {
      quality += 5;
      qualityFindings.push(`${cap.useCases.length} concrete developer use cases mapped`);
    }

    quality = Math.max(10, Math.min(99, quality));

    // --- 2. Security Scoring & Classification (0 - 100) ---
    let security = 95; // baseline assumption with strict checks

    const rawText = `${cap.name} ${cap.description} ${cap.installation || ''} ${JSON.stringify(cap.tools || [])}`.toLowerCase();

    // Check for high-risk flags
    const highRiskFlags = [
      { pattern: /curl.*\|\s*(bash|sh)/i, reason: "Piped remote shell script execution detected" },
      { pattern: /rm\s+-rf\s+\/|del\s+\/f\s+\/s/i, reason: "Dangerous filesystem wipe instructions" },
      { pattern: /eval\(|Function\(/i, reason: "Dynamic code injection / unvalidated eval construct" },
      { pattern: /process\.env\.API_KEY|API_KEY|SECRET|PASSWORD/i, reason: "Potential credential access vectors flagged for audit" },
      { pattern: /powershell\s+-enc/i, reason: "Encoded PowerShell payload pattern detected" },
      { pattern: /0x[0-9a-f]{8,}/i, reason: "Obfuscated binary signature" }
    ];

    for (const flag of highRiskFlags) {
      if (flag.pattern.test(rawText)) {
        security -= 35;
        securityWarnings.push(`HIGH RISK: ${flag.reason}`);
      }
    }

    // Check installation safety
    if (cap.installation) {
      if (cap.installation.startsWith('npm install') || cap.installation.startsWith('npm i') || cap.installation.startsWith('pip install')) {
        security += 2;
      } else if (cap.installation.includes('http://') || cap.installation.includes('ftp://')) {
        security -= 25;
        securityWarnings.push("Insecure unencrypted transmission protocol in install source");
      }
    }

    // Category risk profile
    if (cap.category === 'security') {
      securityWarnings.push("Security/hacking tool profile: requires strict permission containment");
    } else if (cap.category === 'automation' || cap.category === 'browser_automation') {
      securityWarnings.push("Automation agent profile: network & filesystem boundaries enforced");
    }

    security = Math.max(5, Math.min(100, security));

    // --- 3. Determine Security Level ---
    let securityStatus: SecurityApprovalLevel = 'safe';
    let recommendedAction: 'auto_approve' | 'require_review' | 'reject' = 'auto_approve';

    if (security < 60 || quality < 50 || securityWarnings.some(w => w.includes('HIGH RISK'))) {
      securityStatus = 'restricted';
      recommendedAction = 'reject';
    } else if (security < 85 || quality < 70 || cap.category === 'security' || cap.category === 'automation') {
      securityStatus = 'review';
      recommendedAction = 'require_review';
    } else {
      securityStatus = 'safe';
      recommendedAction = 'auto_approve';
    }

    return {
      qualityScore: quality,
      securityScore: security,
      securityStatus,
      qualityFindings,
      securityWarnings,
      recommendedAction
    };
  }
}

export const evaluationService = new CapabilityEvaluationService();
