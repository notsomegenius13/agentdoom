# Forge — Generation Engine Specification

## Overview

Forge is the Generation Engine for AgentDoom. It transforms user intent into working tools by wiring component primitives into single-page React applications and deploying them to Cloudflare Workers.

**Owner:** Forge (agent)
**Reports to:** Nero (CEO)
**Target metrics:** 95%+ first-attempt success rate, < 5s average generation time

---

## 1. Intent Classification Schema

Intent classification is the first step in the generation pipeline, executed by Haiku (~50ms, ~$0.001).

### Categories

| Category | Description | Example |
|----------|-------------|---------|
| `data-display` | Tables, charts, dashboards, lists | "Show me a sales dashboard" |
| `form` | Input forms, wizards, multi-step flows | "Build an invoice form" |
| `calculator` | Calculators, converters, estimators | "Mortgage payment calculator" |
| `generator` | Content generators, templates, exporters | "Generate a resume template" |
| `interactive` | Games, simulations, interactive demos | "Build a quiz app" |
| `landing` | Landing pages, marketing pages, portfolios | "Personal portfolio page" |
| `utility` | Timers, clocks, counters, simple tools | "Pomodoro timer" |
| `data-viz` | Charts, graphs, visualizations | "Bar chart of monthly revenue" |
| `editor` | Text editors, code editors, rich text | "Markdown editor with preview" |
| `viewer` | File viewers, image galleries, PDF readers | "Image gallery with lightbox" |

### Complexity Levels

| Level | Score Range | Characteristics | Model |
|-------|-------------|-----------------|-------|
| `simple` | 1–3 | Single primitive, minimal config, no state management | Sonnet |
| `standard` | 4–6 | 2–3 primitives, moderate config, local state | Sonnet |
| `complex` | 7–10 | 4+ primitives, complex config, multi-state, custom logic | Opus |

### Complexity Scoring Factors

- **Primitive count:** Number of distinct primitives needed (+1 per primitive)
- **State complexity:** None (+0), local state (+1), derived/computed state (+2), persistent state (+3)
- **Layout complexity:** Single column (+0), grid/flex (+1), responsive multi-breakpoint (+2)
- **Interaction depth:** Static (+0), click handlers (+1), drag/drop or animations (+2), real-time (+3)
- **Data requirements:** No data (+0), static data (+1), API integration (+2), real-time data (+3)
- **Custom logic:** None (+0), simple validation (+1), complex business rules (+2)

### Classification Output Schema

```typescript
interface ClassificationResult {
  category: string;        // One of the categories above
  complexity: 'simple' | 'standard' | 'complex';
  complexityScore: number; // 1–10
  primitives: string[];    // Recommended primitive IDs
  estimatedTimeMs: number; // Estimated generation time
  estimatedCostCents: number;
}
```

---

## 2. Primitive Selection Algorithm

The primitive selection algorithm maps classified intent to the optimal set of component primitives.

### Selection Pipeline

```
User Intent → Category Match → Primitive Candidates → Scoring → Ranking → Selection
```

### Step 1: Category → Primitive Mapping

Each category has a set of candidate primitives. The mapping is maintained as a lookup table:

```typescript
const CATEGORY_PRIMITIVE_MAP: Record<string, string[]> = {
  'data-display': ['table', 'card', 'chart', 'filter-bar', 'pagination'],
  'form': ['form-builder', 'input', 'select', 'date-picker', 'file-upload', 'validation'],
  'calculator': ['input', 'button', 'result-display', 'slider'],
  'generator': ['template-engine', 'output-panel', 'copy-button', 'export'],
  'interactive': ['canvas', 'state-machine', 'timer', 'score-board'],
  'landing': ['hero', 'feature-grid', 'testimonial', 'cta', 'footer'],
  'utility': ['timer', 'counter', 'toggle', 'notification'],
  'data-viz': ['chart', 'legend', 'tooltip', 'axis', 'data-table'],
  'editor': ['text-area', 'toolbar', 'preview-pane', 'syntax-highlight'],
  'viewer': ['image-viewer', 'gallery', 'lightbox', 'pagination'],
};
```

### Step 2: Scoring

Each candidate primitive is scored against the user intent:

```typescript
interface PrimitiveScore {
  id: string;
  relevanceScore: number;    // 0–100, how well it matches intent
  compatibilityScore: number; // 0–100, how well it works with other selected primitives
  complexityImpact: number;   // -1 to +2, impact on overall complexity
}
```

Scoring factors:
- **Keyword match:** Direct keyword overlap between primitive description and user prompt
- **Historical success rate:** How often this primitive has been used successfully for similar intents
- **Compatibility:** How well this primitive integrates with already-selected primitives

### Step 3: Selection

1. Sort candidates by `relevanceScore` descending
2. Select top primitives until complexity budget is reached
3. Run compatibility check — replace any incompatible primitives with next-best alternatives
4. Final output: ordered list of primitives with configuration hints

---

## 3. Config Generation Prompt Templates

Once primitives are selected, the generation model (Sonnet or Opus) receives a structured prompt to produce the configuration object.

### Base Prompt Template

```
You are configuring component primitives to build a tool.

## User Request
{userPrompt}

## Selected Primitives
{primitiveSchemas}

## Styling Preferences
{stylingPrefs}

## Output Requirements
Return a JSON configuration object that:
1. Wires all primitives together with proper data flow
2. Sets appropriate props for each primitive instance
3. Defines event handlers and state connections
4. Includes layout structure (grid/flex positioning)
5. Specifies responsive breakpoints

## Output Schema
{configSchema}

Return ONLY valid JSON, no markdown, no explanation.
```

### Configuration Object Schema

```typescript
interface ToolConfig {
  meta: {
    title: string;
    description: string;
    category: string;
    version: number;
  };
  layout: {
    type: 'grid' | 'flex' | 'stack';
    responsive: {
      mobile: LayoutConfig;
      tablet: LayoutConfig;
      desktop: LayoutConfig;
    };
  };
  primitives: PrimitiveInstance[];
  state: {
    variables: StateVariable[];
    flows: DataFlow[];
  };
  events: EventHandler[];
  styling: ThemeConfig;
}

interface PrimitiveInstance {
  id: string;           // Unique instance ID
  type: string;         // Primitive type (e.g., "table", "form-builder")
  props: Record<string, any>;
  position: { row: number; col: number; span: number };
  visible: boolean;
  conditionalVisibility?: string; // State variable name for conditional render
}

interface StateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  initialValue: any;
  derived?: string; // Expression for computed values
}

interface DataFlow {
  from: string;  // Source: "primitive.{id}.{prop}" or "state.{name}"
  to: string;    // Target: "primitive.{id}.{prop}" or "state.{name}"
  transform?: string; // Optional transformation expression
}

interface EventHandler {
  trigger: string;   // "primitive.{id}.{event}"
  actions: Action[];
}

interface Action {
  type: 'setState' | 'navigate' | 'callApi' | 'showNotification';
  target?: string;
  payload?: any;
}
```

### Model-Specific Prompt Variations

**Sonnet (standard):** Full template as above with explicit schema.

**Opus (complex):** Adds:
- Detailed interaction scenarios
- Edge case handling instructions
- Performance optimization hints
- Accessibility requirements

---

## 4. Validation Pipeline

Every generated tool passes through a four-stage validation pipeline before deployment.

### Stage 1: Syntax Validation

```
Input: Raw configuration JSON
Checks:
  - Valid JSON parsing
  - All required fields present
  - Primitive type references exist in registry
  - State variable types are valid
  - Data flow references resolve (no dangling pointers)
  - Event handler targets exist
Output: Pass / Fail with error details
```

### Stage 2: Render Validation

```
Input: Validated configuration
Process:
  - Hydrate primitives with config
  - Run in headless browser (Puppeteer/Playwright)
  - Verify all primitives mount without errors
  - Check for console errors/warnings
  - Capture initial render screenshot
Checks:
  - No React hydration errors
  - No undefined prop warnings
  - All primitives visible in viewport
  - Layout matches expected structure
Output: Pass / Fail with screenshot and error log
```

### Stage 3: Interaction Validation

```
Input: Rendered tool
Process:
  - Simulate common interactions based on category
  - Verify state transitions
  - Check data flow propagation
  - Test event handlers fire correctly
Checks:
  - Form inputs update state
  - Buttons trigger expected actions
  - Data flows between primitives
  - No interaction errors
Output: Pass / Fail with interaction log
```

### Stage 4: Mobile Validation

```
Input: Rendered tool
Process:
  - Resize viewport to mobile (375px), tablet (768px), desktop (1280px)
  - Re-run render validation at each breakpoint
  - Check for overflow, clipping, touch target sizes
Checks:
  - No horizontal scroll on mobile
  - Touch targets >= 44px
  - Text readable at mobile size
  - Layout adapts correctly
Output: Pass / Fail with per-breakpoint screenshots
```

### Validation Result Schema

```typescript
interface ValidationResult {
  passed: boolean;
  stages: {
    syntax: StageResult;
    render: StageResult;
    interaction: StageResult;
    mobile: StageResult;
  };
  durationMs: number;
  errors: ValidationError[];
  warnings: string[];
  screenshots?: Record<string, string>; // URL to screenshot per stage
}

interface StageResult {
  passed: boolean;
  durationMs: number;
  errors: string[];
}

interface ValidationError {
  stage: string;
  code: string;
  message: string;
  path?: string;    // JSON path to problematic field
  suggestion?: string;
}
```

---

## 5. Error Handling and Retry Logic

### Error Classification

| Error Type | Category | Retry? | Action |
|------------|----------|--------|--------|
| JSON parse failure | Generation | Yes (1x) | Regenerate with stricter prompt |
| Missing primitive reference | Configuration | No | Return error to user |
| Dangling data flow ref | Configuration | Yes (1x) | Auto-fix and revalidate |
| React mount error | Render | Yes (1x) | Regenerate with error context |
| Console error/warning | Render | No (warn) | Log warning, proceed |
| Interaction failure | Interaction | Yes (1x) | Regenerate with interaction trace |
| Mobile layout break | Mobile | Yes (1x) | Regenerate with mobile-first prompt |
| Timeout (>15s) | Infrastructure | Yes (2x) | Retry with backoff |
| Cloudflare deploy failure | Infrastructure | Yes (3x) | Retry with exponential backoff |

### Retry Strategy

```typescript
interface RetryConfig {
  maxRetries: number;
  backoffMs: number;
  backoffMultiplier: number;
  maxBackoffMs: number;
}

const DEFAULT_RETRY: RetryConfig = {
  maxRetries: 3,
  backoffMs: 500,
  backoffMultiplier: 2,
  maxBackoffMs: 5000,
};
```

### Retry Flow

```
Attempt 1 → Fail → Classify error → Retryable? → Yes → Wait(backoff) → Attempt 2
                                                                        ↓
                                                              Still failing?
                                                                        ↓
                                                              Max retries? → Yes → Escalate
                                                                        ↓ No
                                                              Double backoff → Retry
```

### Error Escalation

When retries are exhausted:
1. Collect all error context (config, validation results, screenshots)
2. Create a detailed error report
3. Return to user with:
   - What went wrong
   - What was attempted
   - Suggested user action (simplify request, be more specific)
4. Log to monitoring for pattern analysis

### Circuit Breaker

If error rate exceeds 10% in a 5-minute window:
1. Pause generation for 60 seconds
2. Log alert to monitoring
3. Resume with reduced model (Opus → Sonnet for complex, Sonnet → fail-fast for simple)
4. If error rate remains high after cooldown, escalate to Nero

---

## 6. Caching Strategy

### Cache Layers

**Layer 1: Exact Match Cache**
- Key: SHA-256 hash of (userPrompt + stylingPrefs + category)
- TTL: 24 hours
- Storage: KV store (Cloudflare Workers KV)
- Hit: Serve cached tool immediately, allow customization

**Layer 2: Semantic Similarity Cache**
- Key: Embedding-based similarity search
- Threshold: 0.85 cosine similarity
- TTL: 7 days
- Storage: Vector store
- Hit: Serve cached tool with note: "Found a similar tool — customize it or generate new"

**Layer 3: Component Cache**
- Key: Primitive configuration hash
- TTL: 30 days
- Storage: KV store
- Hit: Reuse pre-configured primitive instances, skip config generation for that primitive

### Cache Invalidation

- Manual: User explicitly requests fresh generation
- Automatic: Primitive registry update invalidates affected cached configs
- Time-based: TTL expiration
- Capacity: LRU eviction when storage exceeds 80%

### Cache Key Generation

```typescript
function generateCacheKey(
  prompt: string,
  styling: StylingPrefs,
  category: string
): string {
  const normalized = {
    prompt: normalizeWhitespace(prompt.toLowerCase()),
    styling: hashObject(styling),
    category,
  };
  return sha256(JSON.stringify(normalized));
}
```

### Cache Response Schema

```typescript
interface CacheResponse {
  hit: boolean;
  layer: 'exact' | 'semantic' | 'component' | null;
  cachedTool?: {
    id: string;
    url: string;
    config: ToolConfig;
    createdAt: string;
    usageCount: number;
  };
  customizationOptions?: string[]; // Suggested modifications
}
```

---

## 7. Multi-Model Routing Rules

Forge uses three models, routed automatically based on complexity.

### Routing Decision Tree

```
Classification Result (complexityScore)
  │
  ├── Score 1–3 → Haiku (classification only) → Sonnet (generation)
  │
  ├── Score 4–6 → Haiku (classification only) → Sonnet (generation)
  │
  └── Score 7–10 → Haiku (classification only) → Opus (generation)
```

### Model Specifications

| Model | Role | Latency | Cost | Use Case |
|-------|------|---------|------|----------|
| Haiku | Intent classification | ~50ms | ~$0.001 | Always first step |
| Sonnet | Standard generation | 3–5s | ~$0.05–0.10 | Simple + Standard tools |
| Opus | Complex generation | 8–15s | ~$0.30 | Complex multi-primitive tools |

### Routing Override Rules

- **User override:** User can explicitly request a model (e.g., "use Opus for this")
- **Error escalation:** If Sonnet fails twice on the same request, escalate to Opus
- **Cost cap:** If monthly budget > 80%, downgrade Opus → Sonnet for score 7–8
- **Quality feedback:** Tools rated poorly by users are regenerated with higher-tier model

### Routing Configuration

```typescript
interface RoutingConfig {
  thresholds: {
    sonnetMax: number;    // Default: 6
    opusMin: number;      // Default: 7
  };
  overrides: {
    forceModel?: 'sonnet' | 'opus';
    costCapEnabled: boolean;
    costCapThreshold: number; // Percentage of monthly budget
  };
  escalation: {
    maxSonnetRetries: number;  // Default: 2
    autoEscalate: boolean;     // Default: true
  };
}
```

### Generation Pipeline Flow

```
1. User Prompt
       ↓
2. [Haiku] Intent Classification → category, complexity, primitives
       ↓
3. Cache Check → Hit? → Serve cached + customization options → END
       ↓ Miss
4. Model Router → Sonnet or Opus
       ↓
5. [Sonnet/Opus] Config Generation → ToolConfig JSON
       ↓
6. Validation Pipeline → syntax → render → interaction → mobile
       ↓
7. [If validation fails] Retry with error context → back to step 5
       ↓ Pass
8. Deploy to Cloudflare Workers
       ↓
9. Cache result → Layer 1 (exact) + Layer 3 (component)
       ↓
10. Return URL to user
```

---

## Appendix A: Slack Communication

Forge reports progress via Slack:

```bash
/Users/jarvis/unprompted-slack-bot/slack-post.sh agentdoom "<message>"
```

**Post when:**
- Starting work on a generation task
- Hitting milestones (classification complete, config generated, validation passed)
- Completing a generation (URL ready)
- Blocked (validation failures, model errors, deployment issues)

**Message format:**
```
[Forge] <status>: <brief description>
- Task: <task description>
- Progress: <X/Y stages complete>
- ETA: <estimated time to completion>
- Blocker: <if applicable>
```

## Appendix B: Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| First-attempt success rate | ≥ 95% | Validations passed on first try / total generations |
| Average generation time | < 5s | Wall-clock from prompt to URL (excluding cache hits) |
| P95 generation time | < 15s | 95th percentile generation time |
| Cache hit rate | ≥ 30% | Cache hits / total generation requests |
| Model routing accuracy | ≥ 90% | Correct model chosen on first attempt |
| Cost per generation | < $0.10 avg | Blended cost across all models |

## Appendix C: Primitive Registry Interface

Forge reads from the primitive registry maintained by Lego:

```typescript
interface PrimitiveRegistry {
  id: string;
  name: string;
  version: string;
  category: string;
  description: string;
  props: PropSchema[];
  events: EventSchema[];
  stateRequirements: StateRequirement[];
  compatibility: string[];    // Compatible primitive types
  incompatibility: string[];  // Incompatible primitive types
  complexityWeight: number;   // 1–5
}
```
