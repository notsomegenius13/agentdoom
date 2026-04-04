/**
 * Shield: Output Scanner
 * Static analysis of generated tool HTML/configs for security vulnerabilities.
 * Catches XSS, script injection, iframe abuse, and external resource loading.
 */

export type ThreatCategory =
  | 'xss'
  | 'script_injection'
  | 'iframe_abuse'
  | 'external_resource'
  | 'data_exfiltration';

export interface ScanFinding {
  category: ThreatCategory;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  match: string;
  line?: number;
}

export interface ScanResult {
  safe: boolean;
  findings: ScanFinding[];
  scannedBytes: number;
}

interface ScanRule {
  category: ThreatCategory;
  severity: ScanFinding['severity'];
  pattern: RegExp;
  description: string;
}

const SCAN_RULES: ScanRule[] = [
  // XSS via event handlers
  {
    category: 'xss',
    severity: 'critical',
    pattern:
      /on(?:error|load|click|mouseover|focus|blur|submit|change|input|keydown|keyup|keypress)\s*=\s*["']?[^"'\s>]*(?:document\.|window\.|eval|alert|confirm|prompt|fetch|XMLHttpRequest)/gi,
    description: 'Inline event handler with dangerous JS execution',
  },
  {
    category: 'xss',
    severity: 'critical',
    pattern: /javascript\s*:/gi,
    description: 'JavaScript protocol in attribute (javascript: URI)',
  },
  {
    category: 'xss',
    severity: 'high',
    pattern: /document\.(?:cookie|write|writeln|domain)/gi,
    description: 'Direct DOM manipulation of sensitive properties',
  },
  {
    category: 'xss',
    severity: 'high',
    pattern: /\.innerHTML\s*=(?!\s*['"`]<\/)/gi,
    description: 'Unsafe innerHTML assignment',
  },
  {
    category: 'xss',
    severity: 'critical',
    pattern: /(?:eval|Function|setTimeout|setInterval)\s*\(\s*(?:['"`]|[a-zA-Z_$])/gi,
    description: 'Dynamic code execution via eval/Function/timers with string args',
  },

  // Script injection
  {
    category: 'script_injection',
    severity: 'critical',
    pattern: /<script[^>]*src\s*=\s*["']https?:\/\/(?!cdn\.agentdoom\.ai)/gi,
    description: 'External script loading from non-approved domain',
  },
  {
    category: 'script_injection',
    severity: 'high',
    pattern: /document\.createElement\s*\(\s*['"]script['"]\s*\)/gi,
    description: 'Dynamic script element creation',
  },
  {
    category: 'script_injection',
    severity: 'high',
    pattern: /import\s*\(\s*['"`]https?:\/\//gi,
    description: 'Dynamic import from external URL',
  },

  // Iframe abuse
  {
    category: 'iframe_abuse',
    severity: 'high',
    pattern: /<iframe[^>]*src\s*=\s*["']https?:\/\/(?!cdn\.agentdoom\.ai)/gi,
    description: 'Iframe loading external content',
  },
  {
    category: 'iframe_abuse',
    severity: 'medium',
    pattern: /<iframe[^>]*(?:allow\s*=\s*["'][^"']*(?:camera|microphone|geolocation|payment))/gi,
    description: 'Iframe requesting sensitive permissions',
  },

  // External resource loading
  {
    category: 'external_resource',
    severity: 'medium',
    pattern:
      /(?:fetch|XMLHttpRequest|axios|\.ajax)\s*\(\s*['"`]https?:\/\/(?!cdn\.agentdoom\.ai|api\.agentdoom\.ai)/gi,
    description: 'HTTP request to external domain',
  },
  {
    category: 'external_resource',
    severity: 'high',
    pattern: /new\s+WebSocket\s*\(\s*['"`]wss?:\/\//gi,
    description: 'WebSocket connection to external server',
  },
  {
    category: 'external_resource',
    severity: 'medium',
    pattern: /navigator\.sendBeacon\s*\(/gi,
    description: 'Beacon API usage (potential data exfiltration)',
  },

  // Obfuscation / encoding evasion
  {
    category: 'xss',
    severity: 'critical',
    pattern: /\\x[0-9a-fA-F]{2}(?:\\x[0-9a-fA-F]{2}){3,}/gi,
    description: 'Hex-encoded string (potential obfuscated payload)',
  },
  {
    category: 'xss',
    severity: 'critical',
    pattern: /\\u00[0-9a-fA-F]{2}(?:\\u00[0-9a-fA-F]{2}){3,}/gi,
    description: 'Unicode-escaped string (potential obfuscated payload)',
  },
  {
    category: 'xss',
    severity: 'critical',
    pattern: /atob\s*\(\s*['"`]/gi,
    description: 'Base64 decode (potential obfuscated payload)',
  },
  {
    category: 'xss',
    severity: 'high',
    pattern: /String\.fromCharCode\s*\(\s*\d/gi,
    description: 'String.fromCharCode (potential obfuscated payload)',
  },
  {
    category: 'xss',
    severity: 'high',
    pattern: /(?:window|self|top|parent|globalThis)\s*\[\s*['"`]/gi,
    description: 'Bracket notation property access on global object',
  },
  // CSS-based exfiltration
  {
    category: 'external_resource',
    severity: 'high',
    pattern: /@import\s+(?:url\s*\(\s*)?['"]?https?:\/\/(?!cdn\.agentdoom\.ai)/gi,
    description: 'CSS @import loading external resource',
  },

  // Meta refresh redirect (phishing / exfil via redirect)
  {
    category: 'xss',
    severity: 'critical',
    pattern:
      /<meta[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*url\s*=\s*['"]?https?:\/\/(?!(?:www\.)?agentdoom\.ai)/gi,
    description: 'Meta refresh redirect to external URL',
  },
  {
    category: 'data_exfiltration',
    severity: 'critical',
    pattern:
      /(?:document\.location|window\.location(?:\.href)?)\s*=\s*['"]https?:\/\/(?!(?:www\.)?agentdoom\.ai)/gi,
    description: 'Location redirect to external URL',
  },

  // Data exfiltration
  {
    category: 'data_exfiltration',
    severity: 'medium',
    pattern: /(?:localStorage|sessionStorage|indexedDB)\s*\.(?:getItem|setItem|key|removeItem)/gi,
    description: 'Browser storage access',
  },
  {
    category: 'data_exfiltration',
    severity: 'critical',
    pattern: /navigator\.(?:credentials|geolocation|mediaDevices)/gi,
    description: 'Access to sensitive browser APIs',
  },
  {
    category: 'data_exfiltration',
    severity: 'medium',
    pattern: /navigator\.clipboard/gi,
    description: 'Clipboard API access',
  },
  {
    category: 'data_exfiltration',
    severity: 'high',
    pattern: /new\s+(?:FormData|Blob)\s*\(.*\)[\s\S]{0,100}(?:fetch|XMLHttpRequest|sendBeacon)/gi,
    description: 'Data packaging followed by network request',
  },
];

/**
 * Scan generated HTML/config for security threats.
 * Returns findings sorted by severity (critical first).
 */
export function scanOutput(html: string): ScanResult {
  const findings: ScanFinding[] = [];

  for (const rule of SCAN_RULES) {
    // Reset regex state for global patterns
    rule.pattern.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = rule.pattern.exec(html)) !== null) {
      // Calculate approximate line number
      const beforeMatch = html.slice(0, match.index);
      const line = (beforeMatch.match(/\n/g) || []).length + 1;

      findings.push({
        category: rule.category,
        severity: rule.severity,
        description: rule.description,
        match: match[0].slice(0, 100), // Truncate long matches
        line,
      });
    }
  }

  // Sort by severity
  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    safe: findings.filter((f) => f.severity === 'critical' || f.severity === 'high').length === 0,
    findings,
    scannedBytes: html.length,
  };
}

/**
 * Quick check — returns true if the output has no critical/high findings.
 */
export function isOutputSafe(html: string): boolean {
  return scanOutput(html).safe;
}
