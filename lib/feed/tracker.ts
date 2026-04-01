'use client';

/**
 * Client-side engagement event tracker for the AgentDoom feed.
 *
 * Lightweight — no external SDK. Fires events to POST /api/feed/events
 * with automatic session ID management and batched sends.
 */

const SESSION_KEY = 'agentdoom_session_id';

/** Get or create a persistent session ID (survives page refreshes, expires with tab) */
function getSessionId(): string {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

/** Fire-and-forget event send */
export function trackEvent(
  toolId: string,
  eventType: string,
  extra?: Record<string, string>,
): void {
  const body: Record<string, unknown> = {
    toolId,
    eventType,
    sessionId: getSessionId(),
    referrer: document.referrer || undefined,
    ...extra,
  };

  // Use sendBeacon for reliability (survives page unload), fall back to fetch
  const payload = JSON.stringify(body);
  const sent = navigator.sendBeacon?.(
    '/api/feed/events',
    new Blob([payload], { type: 'application/json' }),
  );
  if (!sent) {
    fetch('/api/feed/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Silent — engagement tracking is best-effort
    });
  }
}

/**
 * Creates an IntersectionObserver that fires a 'view' event once per tool
 * when ≥50% of the card is visible for ≥1 second.
 */
export function createViewObserver(onView: (toolId: string) => void): IntersectionObserver {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  return new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const toolId = (entry.target as HTMLElement).dataset.toolId;
        if (!toolId) continue;

        if (entry.isIntersecting) {
          if (!timers.has(toolId)) {
            timers.set(
              toolId,
              setTimeout(() => {
                onView(toolId);
                timers.delete(toolId);
              }, 1000),
            );
          }
        } else {
          const timer = timers.get(toolId);
          if (timer) {
            clearTimeout(timer);
            timers.delete(toolId);
          }
        }
      }
    },
    { threshold: 0.5 },
  );
}

/**
 * Time-spent tracker. Accumulates active seconds on a per-tool basis
 * and flushes when the tool loses focus or on unload.
 */
export class TimeSpentTracker {
  private activeToolId: string | null = null;
  private startTime = 0;
  private flushed = new Set<string>();

  /** Call when a tool becomes the active/visible card */
  activate(toolId: string): void {
    if (this.activeToolId === toolId) return;
    this.flush();
    this.activeToolId = toolId;
    this.startTime = Date.now();
  }

  /** Call on page hide / component unmount */
  flush(): void {
    if (!this.activeToolId || this.startTime === 0) return;
    const seconds = Math.floor((Date.now() - this.startTime) / 1000);
    if (seconds >= 3 && !this.flushed.has(this.activeToolId)) {
      // Record a 'use' event when user spends 3+ seconds — indicates genuine interest
      trackEvent(this.activeToolId, 'use');
      this.flushed.add(this.activeToolId);
    }
    this.activeToolId = null;
    this.startTime = 0;
  }
}

/**
 * Scroll depth tracker. Records max scroll depth once per session.
 */
export class ScrollDepthTracker {
  private maxDepth = 0;
  private totalItems = 0;
  private reported25 = false;
  private reported50 = false;
  private reported75 = false;
  private reported100 = false;

  update(currentIndex: number, totalItems: number): void {
    this.totalItems = totalItems;
    if (currentIndex <= this.maxDepth) return;
    this.maxDepth = currentIndex;

    if (totalItems < 2) return;
    const pct = currentIndex / (totalItems - 1);

    // Track scroll milestones as view events on the tool at that position
    // We use a simple approach: log a console message for now,
    // future: could track as custom events once we add scroll_depth event type
    if (pct >= 0.25 && !this.reported25) this.reported25 = true;
    if (pct >= 0.5 && !this.reported50) this.reported50 = true;
    if (pct >= 0.75 && !this.reported75) this.reported75 = true;
    if (pct >= 1.0 && !this.reported100) this.reported100 = true;
  }

  getMaxDepth(): number {
    return this.maxDepth;
  }
}
