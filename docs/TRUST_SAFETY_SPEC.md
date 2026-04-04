# Trust & Safety Specification

## 1. Prohibited Content Categories

All tools generated on the AgentDoom platform are classified against the following prohibited content categories:

| Category | Description | Action |
|----------|-------------|--------|
| **Harmful Content** | Content that promotes violence, self-harm, or dangerous activities | Block + flag |
| **Copyrighted Material** | Unauthorized reproduction of protected works | Block + notify creator |
| **Phishing** | Tools designed to steal credentials or sensitive data | Block + suspend account |
| **Spam** | Automated mass-messaging, SEO manipulation, or platform abuse | Block + rate limit |
| **NSFW** | Sexually explicit or adult content | Block + age-gate review |
| **Malware** | Viruses, trojans, ransomware, or exploit code | Block + immediate suspension |

### Classification Pipeline

Every generated tool passes through a Haiku-based content classification model before going live:

```
Tool Submission → Haiku Classifier → Decision Gate
                                    ├── Pass → Publish
                                    ├── Review → Queue for human review
                                    └── Block → Reject + notify creator
```

## 2. Auto-Scan Pipeline

### Pre-Publication Scan

1. **Code Analysis**: Static analysis of tool code for suspicious patterns
2. **Content Classification**: Haiku model evaluates tool description, code, and metadata
3. **Signature Matching**: Known malware/phishing pattern detection
4. **Risk Scoring**: Composite risk score (0-100) determines action

### Post-Publication Monitoring

- Periodic re-scanning of published tools (every 24 hours)
- User reports trigger immediate re-scan
- Behavioral anomaly detection for tools with unusual usage patterns

### Scan Results

| Risk Score | Action |
|------------|--------|
| 0-30 | Auto-publish |
| 31-70 | Flag for review |
| 71-100 | Auto-block + escalate |

## 3. Creator Verification

Creators earn a verified badge through a progressive trust system:

### Requirements

- **Identity Verification**: Valid government ID or business registration
- **Tool Portfolio**: Minimum 10 published tools
- **Quality Threshold**: Average rating of 4+ stars across all tools
- **Clean Record**: Zero policy violations or suspensions

### Verification Levels

| Level | Requirements | Benefits |
|-------|-------------|----------|
| **Unverified** | New account | Basic publishing |
| **Trusted** | 5 tools, 3.5+ stars | Reduced scan queue |
| **Verified** | 10 tools, 4+ stars, no violations | Verified badge, priority support |
| **Partner** | Invitation only | Revenue share, early access |

### Verification Process

```
Application → Identity Check → Portfolio Review → Decision
                                              ├── Approved → Badge granted
                                              └── Denied → 30-day cooldown
```

## 4. Reporting System

Users can report problematic tools or creators through a one-tap reporting interface.

### Report Flow

1. **User Reports**: One-tap report button on any tool or creator profile
2. **Auto-Triage**: Automated classification of report severity
3. **Evidence Collection**: System captures tool state, usage logs, and creator history
4. **Decision Engine**: Rules-based triage determines action

### Report Categories

- Inappropriate content
- Copyright infringement
- Phishing or scam
- Spam or abuse
- Malware or security threat
- Other (requires description)

### Response Times

| Severity | Response Time | Action |
|----------|--------------|--------|
| Critical (malware, phishing) | Immediate | Auto-suspend + review |
| High (harmful content) | 1 hour | Flag for review |
| Medium (spam, NSFW) | 24 hours | Queue for review |
| Low (other) | 72 hours | Batch review |

## 5. Escalation Path

### Automated Actions

- **Auto-block**: Clear policy violations (malware, phishing)
- **Auto-suspend**: Repeat offenders or high-risk scores
- **Rate limiting**: Spam detection triggers

### Human Review Queue

Items that require human judgment:
- Borderline content classifications
- Copyright disputes
- Appeals from suspended creators
- High-visibility tool reports

### Escalation Chain

```
Auto-System → Trust & Safety Agent (Shield) → Human Moderator → CEO (Nero)
```

### Appeal Process

- Creators can appeal suspensions within 30 days
- Appeals reviewed by human moderator
- Final appeals escalated to CEO
- Decision communicated within 7 business days

## 6. Enforcement Actions

| Violation | First Offense | Second Offense | Third Offense |
|-----------|--------------|----------------|---------------|
| Minor (spam, NSFW) | Warning | 7-day suspension | Permanent ban |
| Major (harmful content) | 7-day suspension | 30-day suspension | Permanent ban |
| Critical (malware, phishing) | Permanent ban | - | - |

## 7. Audit & Compliance

- All moderation actions logged with timestamps and rationale
- Monthly trust & safety reports generated
- Quarterly policy reviews with leadership
- Compliance with applicable content moderation regulations
