/**
 * Shield: Prompt Filter (Keyword Blocklist)
 * Fast pre-LLM screening of generation prompts.
 * Catches obviously malicious prompts before they hit the AI model.
 */

export interface PromptFilterResult {
  allowed: boolean
  matchedPatterns: string[]
  category?: string
  reason?: string
}

interface BlockPattern {
  pattern: RegExp
  category: string
  reason: string
}

/**
 * Blocklist patterns grouped by prohibited category.
 * Each pattern is case-insensitive and matches common evasion variants.
 */
const BLOCK_PATTERNS: BlockPattern[] = [
  // Malware / hacking tools (with leet-speak and spacing variants)
  { pattern: /k[e3]y\s*l[o0]g(?:g[e3]r|ging)/i, category: 'malware', reason: 'Keylogger generation' },
  { pattern: /crypto\s*min(?:er|ing)/i, category: 'malware', reason: 'Crypto mining tool' },
  { pattern: /data\s*exfiltrat/i, category: 'malware', reason: 'Data exfiltration tool' },
  { pattern: /reverse\s*shell/i, category: 'malware', reason: 'Reverse shell tool' },
  { pattern: /rat\s*(?:tool|trojan|payload|server)/i, category: 'malware', reason: 'Remote access trojan' },
  { pattern: /ransomware/i, category: 'malware', reason: 'Ransomware generation' },
  { pattern: /(?:ddos|dos)\s*(?:tool|attack|bot)/i, category: 'malware', reason: 'DDoS tool' },
  { pattern: /botnet/i, category: 'malware', reason: 'Botnet creation' },
  { pattern: /exploit\s*kit/i, category: 'malware', reason: 'Exploit kit' },

  // Phishing
  { pattern: /fake\s*login/i, category: 'phishing', reason: 'Fake login page' },
  { pattern: /credential\s*(?:harvest|collect)/i, category: 'phishing', reason: 'Credential harvesting' },
  { pattern: /(?<!recogniz\w+\s)(?<!detect\w+\s)(?<!identif\w+\s)(?<!about\s)(?<!against\s)(?<!prevent\w*\s)phishing\s*(?:page|site|template|tool)/i, category: 'phishing', reason: 'Phishing content' },
  { pattern: /(?:steal|capture|grab)\s*(?:password|credential|login|cookie|session|token)/i, category: 'phishing', reason: 'Credential theft tool' },
  { pattern: /(?:collect|gather|log)\w*\s+(?:email|password|credential)s?\b[\s\S]{0,60}(?:send|post|forward|webhook|server)/i, category: 'phishing', reason: 'Indirect credential collection and exfiltration' },
  { pattern: /(?:looks?\s*like|impersonat|mimic|clone)\s+\w+\s*(?:login|sign[- ]?in)/i, category: 'phishing', reason: 'Login page impersonation' },
  { pattern: /(?:ssn|social\s*security)\s*(?:collector|harvester|form)/i, category: 'phishing', reason: 'PII harvesting' },
  { pattern: /(?:credit\s*card|cc)\s*(?:skim|harvest|steal|grab)/i, category: 'phishing', reason: 'Credit card skimming' },

  // Harmful content
  { pattern: /(?:how\s*to|guide\s*to)\s*(?:make|build|create)\s*(?:a\s*)?(?:bomb|explosive|weapon)/i, category: 'harmful', reason: 'Weapons/explosives instructions' },
  { pattern: /(?:self[- ]?harm|suicide)\s*(?:method|guide|instruction|how)/i, category: 'harmful', reason: 'Self-harm content' },
  { pattern: /(?:hate|racist|supremacist)\s*(?:speech|content|propaganda|generator)/i, category: 'harmful', reason: 'Hate content generator' },
  { pattern: /doxx(?:ing)?\s*(?:tool|finder|lookup)/i, category: 'harmful', reason: 'Doxxing tool' },
  { pattern: /harassment\s*(?:bot|tool|generator)/i, category: 'harmful', reason: 'Harassment tool' },

  // NSFW
  { pattern: /(?:porn|nsfw|xxx|hentai)\s*(?:generat|creat|mak)/i, category: 'nsfw', reason: 'NSFW content generator' },
  { pattern: /(?:deepfake|nude)\s*(?:generat|creat|mak|tool)/i, category: 'nsfw', reason: 'Deepfake/nude generation' },
  { pattern: /(?:adult|explicit|erotic)\s*(?:content|story|image|video)\s*(?:generat|creat|mak)/i, category: 'nsfw', reason: 'Explicit content generator' },
  { pattern: /(?:undress|strip|naked)\s*(?:tool|app|generat|filter|ai)/i, category: 'nsfw', reason: 'Undressing/nudity tool' },
  { pattern: /(?:gore|graphic\s*violence|torture|mutilation)\s*(?:generat|creat|content|image|video)/i, category: 'nsfw', reason: 'Graphic violence content' },
  { pattern: /(?:drug|narcotic|meth|cocaine|heroin)\s*(?:recipe|synth|cook|mak|manufactur)/i, category: 'harmful', reason: 'Drug manufacturing instructions' },
  { pattern: /(?:child|minor|underage)\s*(?:exploit|abuse|porn|nsfw|sexual|nude)/i, category: 'harmful', reason: 'Child exploitation content' },

  // Spam
  { pattern: /(?:spam|mass)\s*(?:email|message|sender|bot)/i, category: 'spam', reason: 'Spam tool' },
  { pattern: /(?:seo|search)\s*(?:spam|manipulation|exploit)/i, category: 'spam', reason: 'SEO spam tool' },
  { pattern: /click\s*(?:farm|bot|fraud)/i, category: 'spam', reason: 'Click fraud tool' },

  // Prompt injection / jailbreak attempts
  { pattern: /ignore\s+(?:all\s+)?(?:previous|above|prior)\s+(?:instructions|rules|prompts)/i, category: 'prompt_injection', reason: 'Prompt injection: instruction override' },
  { pattern: /disregard\s+(?:all\s+)?(?:previous|above|prior|your)\s+(?:instructions|rules|guidelines|constraints)/i, category: 'prompt_injection', reason: 'Prompt injection: instruction override' },
  { pattern: /you\s+are\s+now\s+(?:a|an|in)\s+(?:unrestricted|unfiltered|jailbreak|DAN|developer\s+mode)/i, category: 'prompt_injection', reason: 'Prompt injection: persona hijack' },
  { pattern: /(?:system|assistant)\s*(?:prompt|message)\s*(?::|is|was)\s/i, category: 'prompt_injection', reason: 'Prompt injection: system prompt extraction' },
  { pattern: /(?:forget|override|bypass|skip)\s+(?:your|all|the)\s+(?:safety|content|moderation|filter|restriction|guardrail)/i, category: 'prompt_injection', reason: 'Prompt injection: safety bypass' },
  { pattern: /\b(?:DAN|do\s+anything\s+now|developer\s+mode|jailbreak(?:ed)?)\b/i, category: 'prompt_injection', reason: 'Prompt injection: known jailbreak pattern' },
  { pattern: /pretend\s+(?:you\s+(?:are|have)\s+)?(?:no|without)\s+(?:restrictions|rules|limits|guidelines)/i, category: 'prompt_injection', reason: 'Prompt injection: restriction removal' },
  { pattern: /(?:act|behave|respond)\s+(?:as\s+(?:if|though)\s+)?(?:you\s+(?:are|were)\s+)?(?:unrestricted|unfiltered|uncensored)/i, category: 'prompt_injection', reason: 'Prompt injection: uncensored mode' },
  { pattern: /(?:output|print|reveal|show|leak)\s+(?:your|the|system)\s+(?:system\s+)?(?:prompt|instructions|rules)/i, category: 'prompt_injection', reason: 'Prompt injection: prompt extraction' },
  { pattern: /(?:<\/?(?:system|assistant|user|human)>|\[(?:INST|SYS)\])/i, category: 'prompt_injection', reason: 'Prompt injection: role tag injection' },
]

/**
 * Screen a prompt against the keyword blocklist.
 * Returns immediately — no LLM call needed.
 */
export function filterPrompt(prompt: string): PromptFilterResult {
  const matched: BlockPattern[] = []

  for (const entry of BLOCK_PATTERNS) {
    if (entry.pattern.test(prompt)) {
      matched.push(entry)
    }
  }

  if (matched.length === 0) {
    return { allowed: true, matchedPatterns: [] }
  }

  // Use the highest-severity match as the primary category
  const primary = matched[0]
  return {
    allowed: false,
    matchedPatterns: matched.map((m) => m.reason),
    category: primary.category,
    reason: `Blocked by prompt filter: ${matched.map((m) => m.reason).join(', ')}`,
  }
}
