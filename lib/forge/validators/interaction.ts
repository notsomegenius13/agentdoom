import type { StageResult, ValidationError } from '../types';

/**
 * Stage 3: Interaction Test
 * Verifies buttons, inputs, and state changes work correctly.
 * Uses jsdom + simulated events for fast headless interaction testing.
 */
export async function validateInteraction(code: string): Promise<StageResult> {
  const start = performance.now();
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  try {
    const html = wrapCodeInHtml(code);
    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      resources: 'usable',
      pretendToBeVisual: true,
      url: 'http://localhost',
    });

    // Wait for initial render
    await waitForContent(dom, 2000);

    const doc = dom.window.document;

    // Test buttons: find all, click each, check no errors thrown
    const buttons = doc.querySelectorAll('button');
    for (const btn of buttons) {
      try {
        btn.click();
      } catch (err) {
        errors.push({
          message: `Button click threw: ${String(err)} (button: "${btn.textContent?.trim()}")`,
          source: 'interaction',
        });
      }
    }

    // Test inputs: find all, simulate typing
    const inputs = doc.querySelectorAll('input, textarea, select');
    for (const input of inputs) {
      try {
        const el = input as HTMLInputElement;
        const inputType = el.type || el.tagName.toLowerCase();

        if (el.tagName === 'SELECT') {
          // Select first option if available
          const select = el as unknown as HTMLSelectElement;
          if (select.options.length > 0) {
            select.selectedIndex = 0;
            select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
          }
        } else if (inputType === 'checkbox' || inputType === 'radio') {
          el.click();
        } else {
          // Text-like inputs
          el.focus();
          el.value = 'test input';
          el.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
          el.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
        }
      } catch (err) {
        errors.push({
          message: `Input interaction failed: ${String(err)}`,
          source: 'interaction',
        });
      }
    }

    // Test forms: find all, simulate submit
    const forms = doc.querySelectorAll('form');
    for (const form of forms) {
      try {
        // Prevent actual submission
        form.addEventListener('submit', (e: Event) => e.preventDefault());
        form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
      } catch (err) {
        errors.push({
          message: `Form submit failed: ${String(err)}`,
          source: 'interaction',
        });
      }
    }

    // Check console errors post-interaction
    const consoleErrors = (dom.window as unknown as { __consoleErrors?: string[] }).__consoleErrors || [];
    for (const msg of consoleErrors) {
      // Filter React warnings from hard errors
      if (msg.includes('Warning:')) {
        warnings.push(msg);
      } else if (msg.includes('Uncaught') || msg.includes('TypeError') || msg.includes('ReferenceError')) {
        errors.push({ message: msg, source: 'console' });
      }
    }

    // If no interactive elements found, warn (not an error — some tools are display-only)
    if (buttons.length === 0 && inputs.length === 0 && forms.length === 0) {
      warnings.push('No interactive elements (buttons, inputs, forms) found — tool may be display-only');
    }

    dom.window.close();
  } catch (err: unknown) {
    errors.push({
      message: `Interaction test failed: ${String(err)}`,
      source: 'jsdom',
    });
  }

  return {
    stage: 'interaction',
    verdict: errors.length === 0 ? 'pass' : 'fail',
    durationMs: Math.round(performance.now() - start),
    errors,
    warnings,
  };
}

function wrapCodeInHtml(code: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body>
<div id="root"></div>
<script>
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

function waitForContent(dom: InstanceType<typeof import('jsdom').JSDOM>, timeoutMs: number): Promise<void> {
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
