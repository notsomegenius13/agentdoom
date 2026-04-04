import type { StageResult, ValidationError } from '../types';

/**
 * Stage 2: Render Test
 * Verifies the tool component renders to a valid DOM tree
 * without React errors, blank screens, or console errors.
 *
 * Uses jsdom + React for fast headless rendering.
 */
export async function validateRender(code: string): Promise<StageResult> {
  const start = performance.now();
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  try {
    // Build self-contained HTML to evaluate in jsdom
    const html = wrapCodeInHtml(code);

    // Use jsdom to render
    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      resources: 'usable',
      pretendToBeVisual: true,
      url: 'http://localhost',
    });

    // Wait for React to render (give it up to 2s)
    await waitForRender(dom, 2000);

    const doc = dom.window.document;

    // Check for React error boundaries / error overlay
    const errorOverlay = doc.querySelector('[data-reactroot-error]') ||
      doc.querySelector('#react-error-overlay');
    if (errorOverlay) {
      errors.push({
        message: 'React error boundary triggered during render',
        source: 'react',
      });
    }

    // Check for blank screen (root has no children)
    const root = doc.getElementById('root');
    if (root && root.innerHTML.trim() === '') {
      errors.push({
        message: 'Component rendered a blank screen (empty root)',
        source: 'render',
      });
    }

    // Check if root has meaningful content
    if (root && root.children.length === 0 && !root.textContent?.trim()) {
      errors.push({
        message: 'No visible DOM content after render',
        source: 'render',
      });
    }

    // Capture console errors that jsdom collected
    const consoleErrors = (dom.window as unknown as { __consoleErrors?: string[] }).__consoleErrors || [];
    for (const msg of consoleErrors) {
      if (msg.includes('Warning:')) {
        warnings.push(msg);
      } else {
        errors.push({ message: msg, source: 'console' });
      }
    }

    dom.window.close();
  } catch (err: unknown) {
    errors.push({
      message: `Render failed: ${String(err)}`,
      source: 'jsdom',
    });
  }

  return {
    stage: 'render',
    verdict: errors.length === 0 ? 'pass' : 'fail',
    durationMs: Math.round(performance.now() - start),
    errors,
    warnings,
  };
}

/** Wrap tool code in a minimal HTML page with React for jsdom evaluation */
function wrapCodeInHtml(code: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<div id="root"></div>
<script>
// Capture console errors
window.__consoleErrors = [];
var origError = console.error;
console.error = function() {
  window.__consoleErrors.push(Array.from(arguments).join(' '));
  origError.apply(console, arguments);
};

try {
${code}
} catch(e) {
  window.__consoleErrors.push('Uncaught ' + e.toString());
}
</script>
</body>
</html>`;
}

/** Wait for the root element to have content */
function waitForRender(dom: InstanceType<typeof import('jsdom').JSDOM>, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    const root = dom.window.document.getElementById('root');
    if (root && root.innerHTML.trim() !== '') {
      resolve();
      return;
    }

    const start = Date.now();
    const interval = setInterval(() => {
      const r = dom.window.document.getElementById('root');
      if ((r && r.innerHTML.trim() !== '') || Date.now() - start > timeoutMs) {
        clearInterval(interval);
        resolve();
      }
    }, 50);
  });
}
