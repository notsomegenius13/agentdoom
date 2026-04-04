# Primitive Library MVP Gap Audit

Date: 2026-04-01
Owner: Lego (Primitive Library)
Scope: AgentDoom primitive inventory, Forge compatibility, and launch-critical quality gates.

## Executive Summary

The library has strong breadth (`43` primitive directories), but the MVP risk is no longer raw component count. The highest-risk gaps are **cross-layer contract mismatches** between:

- primitive selection (`lib/forge/classify.ts`)
- primitive schema generation (`lib/forge/generate.ts`)
- runtime rendering (`lib/forge/assemble.ts`)
- React primitive source/testing (`primitives/*`)

These mismatches can produce unknown primitives at runtime, prevent valid primitives from being generated, and hide quality regressions until late validation.

## Baseline Inventory

- Primitive directories: `43` (`/primitives/*`)
- Seed tools audited: `130` (`data/seed-tools/*.json`)
- Unique primitive types in seeds: `19`
- Prompt-cache templates audited: `50` (`data/prompt-cache.json`)
- Unique primitive types in prompt cache: `13`

### Good news

All primitive types used by seed tools are currently present in the primitive library.

### Key mismatch counts

- Classifier-supported primitive types: `12`
- Generator schema-supported types: `21`
- Assembler renderer-supported types: `24`

## Priority Gap List

## P0 (Blockers for reliable generation)

1. No single source of truth for primitive registry
- Evidence:
  - `lib/forge/classify.ts` has 12 hardcoded primitives (`AVAILABLE_PRIMITIVES`)
  - `lib/forge/generate.ts` has 21 hardcoded schema entries (`PRIMITIVE_SCHEMAS`)
  - `lib/forge/assemble.ts` has 24 hardcoded renderers (`RENDERERS`)
- Risk:
  - Primitive may be selected but not generated
  - Primitive may be generated but not rendered
  - Feature rollout requires editing multiple files manually
- Effort: 1.5-2 days
- Dependency: none

2. Generator can emit primitives that assembler cannot render
- Schema-only types (in generate, missing in assemble):
  - `calendar`, `progress-bar`, `search`, `accordion`
- Risk:
  - Runtime falls back to `Unknown primitive` block for valid generated configs
- Effort: 1 day
- Dependency: P0-1

3. Assembler can render primitives that generator cannot emit
- Renderer-only types (in assemble, missing in generate schema):
  - `split-calculator`, `converter`, `poll`, `pricing-table`, `kanban-board`, `stats-dashboard`, `wizard-form`
- Risk:
  - Existing capability inaccessible to non-cached/novel prompts
- Effort: 1 day
- Dependency: P0-1

4. Assembler supports primitives with no React primitive package parity
- Renderers with no `/primitives/<type>` directory:
  - `realtime-collab`, `ai-chat`, `payment-form`, `analytics-dashboard`, `notification-center`
- Risk:
  - No schema/default/test package parity; no reusable primitive module for Forge composition path
- Effort: 2-3 days (for either implementation parity or explicit de-scope)
- Dependency: P0-1

## P1 (Generation quality and coverage)

5. Classifier coverage is narrower than live primitive demand
- Seed tools currently rely on 19 types; classifier only exposes 12.
- Types used in seeds but unavailable to classifier include:
  - `stats-dashboard`, `kanban-board`, `poll`, `converter`, `split-calculator`, `pricing-table`, `wizard-form`
- Risk:
  - Prompt intent gets mapped to inferior primitive combinations
- Effort: 0.5 day (after registry unification)
- Dependency: P0-1

6. Spec-defined primitive set gaps (first-class components still missing)
- Explicit V1 spec primitives without first-class library component parity:
  - `survey`, `timeline`, `estimator`, `scorer`, `invoice-template`, `booking-calendar`, `tip-jar/payment-button` (separate from full checkout), `markdown-renderer`, `slide-deck`, `flashcard-set`, `recipe-card`, `guide-tutorial`
- Risk:
  - Product/marketing contract drift vs launch messaging
- Effort: 8-12 days total (phased)
- Dependency: P0 items complete first

## P2 (Quality bar enforcement gaps)

7. WCAG AA verification is mostly manual/implicit
- Some ARIA work exists in primitives, but no systematic a11y assertion suite per primitive.
- No `axe`-style automated checks found in primitive tests.
- Effort: 1.5 days
- Dependency: P0-1 for stable registry

8. Primitive-level performance contract (<100ms) is not asserted in CI
- No per-primitive render-time performance tests found.
- Effort: 1 day
- Dependency: P0-1

9. Browser matrix coverage is indirect
- Mobile validator exists in Forge (`validateMobile`) using Playwright Chromium.
- No primitive-by-primitive Safari/Firefox regression harness currently wired in CI.
- Effort: 2 days (smoke matrix for top 20 primitives first)
- Dependency: P0-1

10. Offline-state behavior is not standardized per primitive config contract
- No shared offline contract found in primitive schemas/tests.
- Effort: 1 day
- Dependency: P0-1

## Recommended Execution Order

Phase 1 (2 days): Contract integrity first
- Build unified `primitive-registry` (types, schema, renderer availability, component path, defaults path)
- Drive `classify`, `generate`, and `assemble` from registry
- Add CI guard to fail on drift between registry/schema/renderer/component/test artifacts

Phase 2 (2 days): Remove active runtime mismatch risk
- Add missing renderers for `calendar`, `progress-bar`, `search`, `accordion` OR remove these from generation until implemented
- Add schema entries for renderer-only core types (`split-calculator`, `converter`, `poll`, `pricing-table`, `kanban-board`, `stats-dashboard`, `wizard-form`)

Phase 3 (3 days): Resolve parity debt on renderer-only advanced types
- Decision gate per type: implement as first-class primitive packages vs de-scope from assembler
- Implement/test or explicitly remove: `realtime-collab`, `ai-chat`, `payment-form`, `analytics-dashboard`, `notification-center`

Phase 4 (4-5 days): Enforce quality bar as code
- Add automated accessibility checks per primitive
- Add primitive render-performance assertions (<100ms baseline in test harness)
- Add browser smoke matrix (iOS Safari emulation baseline + Firefox + Safari desktop in CI or scheduled runs)
- Add offline state config + tests

## Dependency Graph

- Registry unification (Phase 1) is prerequisite for all safe expansion.
- Runtime mismatch fixes (Phase 2) should precede any new primitive buildout.
- Advanced parity cleanup (Phase 3) can run in parallel with quality automation kickoff.
- New spec primitives (P1-6) should start only after P0 is complete.

## Delivery Plan for Next Sprint (Launch-Critical)

1. Complete Phase 1 + Phase 2 (highest reliability impact).
2. Complete Phase 4 (a11y/perf/browser/offline gates) for top 19 seed-used primitives.
3. Implement first 4 missing spec-first-class primitives:
   - `survey`, `timeline`, `markdown-renderer`, `flashcard-set`
4. Re-audit and publish updated readiness scorecard.

## Acceptance Checklist for This Audit Task

- Prioritized gap list: complete
- Effort estimates: complete
- Dependencies and sequencing: complete
- Concrete code references: complete
