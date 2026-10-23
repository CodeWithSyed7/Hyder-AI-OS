/**
 * Haider Desktop Commander - Security Policy & Command Classifier
 * Enforces least-privilege execution, prompt injection defense, and workspace sandboxing.
 */

const path = require('path');

// Patterns that are considered High Risk and ALWAYS require explicit user approval
const HIGH_RISK_PATTERNS = [
  /\b(del|rmdir|remove-item)\b.*(\/s|\/q|-r|-recurse|-force)/i,
  /\bformat\b/i,
  /\b(reg\s+delete|reg\s+add)\b/i,
  /\bdiskpart\b/i,
  /\b(shutdown|restart-computer)\b/i,
  /\bnet\s+user\b/i,
  /\b(set-executionpolicy)\s+(unrestricted|bypass)/i,
  /\b(takeown|icacls)\b/i,
  /\bgit\s+reset\s+--hard\b/i,
  /\bgit\s+clean\s+-fdx\b/i,
  /\b(taskkill)\s+.*\/f\b/i,
  /\b(stop-process)\s+.*-force\b/i,
  /\b(drop\s+database|truncate\s+table)\b/i
];

// Patterns that are Moderate (development actions)
const MODERATE_PATTERNS = [
  /\bnpm\s+(install|i|update|audit\s+fix)\b/i,
  /\bnpm\s+run\s+(build|dev|start|test)\b/i,
  /\bpnpm\s+|yarn\s+/i,
  /\bgit\s+(pull|checkout|merge|commit|push)\b/i,
  /\b(taskkill|stop-process)\b/i,
  /\bnode\s+[\w-]+\.js\b/i,
  /\b(code|start|explorer)\b/i
];

// Patterns that are Safe read-only inspections
const SAFE_PATTERNS = [
  /\b(pwd|cd|dir|ls|get-location|get-childitem)\b/i,
  /\b(git\s+status|git\s+log|git\s+diff|git\s+branch)\b/i,
  /\b(node\s+-v|npm\s+-v|git\s+--version|docker\s+ps)\b/i,
  /\b(get-process|tasklist|netstat|get-nettcpconnection)\b/i,
  /\b(echo|type|cat|get-content)\b/i,
  /\b(hostname|systeminfo|whoami)\b/i,
  /\b(tsc\s+--noEmit|npm\s+run\s+lint)\b/i
];

// Adversarial prompt injection markers found in untrusted output/screen
const INJECTION_MARKERS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /you\s+are\s+now\s+in\s+(developer|unrestricted)\s+mode/i,
  /system\s+override:\s+execute/i,
  /delete\s+(all\s+files|system32)/i,
  /curl\s+.*\|\s*(bash|powershell|iex)/i
];

class SecurityPolicy {
  constructor(config = {}) {
    this.allowedWorkspaces = (config.allowedWorkspaces || [process.cwd()])
      .map(p => path.resolve(p).toLowerCase());
    this.allowModerateAuto = config.allowModerateAuto !== false;
  }

  /**
   * Classifies a command's risk level.
   * Returns: { level: 'SAFE' | 'MODERATE' | 'HIGH_RISK', reason: string }
   */
  classifyCommand(cmd) {
    if (!cmd || typeof cmd !== 'string') {
      return { level: 'HIGH_RISK', reason: 'Empty or invalid command format' };
    }

    const trimmed = cmd.trim();

    // Check for high-risk destructive commands
    for (const pattern of HIGH_RISK_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          level: 'HIGH_RISK',
          reason: `Command matches critical destructive pattern: ${pattern.toString()}`
        };
      }
    }

    // Check for safe read-only operations
    for (const pattern of SAFE_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          level: 'SAFE',
          reason: 'Read-only diagnostic or observation command'
        };
      }
    }

    // Check for moderate actions
    for (const pattern of MODERATE_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          level: 'MODERATE',
          reason: 'Development workflow or process management command'
        };
      }
    }

    // Default unclassified commands to MODERATE for user review
    return {
      level: 'MODERATE',
      reason: 'General system command'
    };
  }

  /**
   * Verifies if a given path is inside the allowed workspace directory
   */
  isPathAllowed(targetPath) {
    if (!targetPath) return true;
    try {
      const resolved = path.resolve(targetPath).toLowerCase();
      return this.allowedWorkspaces.some(ws => resolved.startsWith(ws));
    } catch (e) {
      return false;
    }
  }

  /**
   * Scans text for malicious prompt injection attempts
   */
  scanPromptInjection(text) {
    if (!text || typeof text !== 'string') return { detected: false };

    for (const marker of INJECTION_MARKERS) {
      if (marker.test(text)) {
        return {
          detected: true,
          marker: marker.toString(),
          warning: 'Potential prompt injection attempt detected in execution data.'
        };
      }
    }
    return { detected: false };
  }
}

module.exports = {
  SecurityPolicy,
  HIGH_RISK_PATTERNS,
  MODERATE_PATTERNS,
  SAFE_PATTERNS
};
