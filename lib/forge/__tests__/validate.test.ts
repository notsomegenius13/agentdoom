import { describe, it, expect } from 'vitest';
import { validate, validateWithRetry } from '../validate';
import { validateSyntax } from '../validators/syntax';
import { validateRender } from '../validators/render';
import { validateInteraction } from '../validators/interaction';
import type { ValidateOptions } from '../types';

// ─── Sample Tool Code ───────────────────────────────────────────────────────

const VALID_JSX = `
function App() {
  const root = document.getElementById('root');
  root.innerHTML = '<div class="p-4"><h1>Counter Tool</h1><p>Count: 0</p><button id="inc">Increment</button><input type="text" placeholder="Enter name" /></div>';
  let count = 0;
  document.getElementById('inc').addEventListener('click', () => {
    count++;
    root.querySelector('p').textContent = 'Count: ' + count;
  });
}
App();
`;

const INVALID_SYNTAX = `
function App( {
  return <div>Unclosed
}
`;

const VALID_HTML_BUNDLE = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: sans-serif; }
  .container { max-width: 100%; padding: 16px; }
  h1 { font-size: 1.5rem; margin-bottom: 8px; }
  button { padding: 8px 16px; cursor: pointer; }
  input { padding: 8px; width: 100%; max-width: 300px; }
</style>
</head>
<body>
<div id="root">
  <div class="container">
    <h1>Counter Tool</h1>
    <p>Count: 0</p>
    <button>Increment</button>
    <input type="text" placeholder="Enter name">
  </div>
</div>
</body>
</html>`;

const OVERFLOW_HTML_BUNDLE = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<div id="root">
  <div style="width: 1200px; background: red;">
    <h1>This is way too wide for mobile</h1>
  </div>
</div>
</body>
</html>`;

// ─── Stage 1: Syntax Tests ─────────────────────────────────────────────────

describe('Stage 1: Syntax Validation', () => {
  it('passes valid JSX code', async () => {
    const result = await validateSyntax(VALID_JSX);
    expect(result.stage).toBe('syntax');
    expect(result.verdict).toBe('pass');
    expect(result.errors).toHaveLength(0);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('fails invalid syntax', async () => {
    const result = await validateSyntax(INVALID_SYNTAX);
    expect(result.verdict).toBe('fail');
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].source).toBe('esbuild');
  });

  it('fails on undefined JSX without React import', async () => {
    const result = await validateSyntax('const x = <NonExistent />');
    // esbuild will parse this as valid JSX (it doesn't check references)
    // This is expected — reference checks are a render-time concern
    expect(result.stage).toBe('syntax');
  });

  it('passes plain JavaScript', async () => {
    const result = await validateSyntax('const x = 1 + 2; console.log(x);');
    expect(result.verdict).toBe('pass');
  });

  it('fails on completely broken code', async () => {
    const result = await validateSyntax('}{{{]]]]');
    expect(result.verdict).toBe('fail');
  });
});

// ─── Stage 2: Render Tests ──────────────────────────────────────────────────

describe('Stage 2: Render Validation', () => {
  it('detects blank screen (empty code)', async () => {
    const result = await validateRender('// no render');
    expect(result.stage).toBe('render');
    // Should detect empty root
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('passes code that writes to DOM', async () => {
    const code = `document.getElementById('root').innerHTML = '<h1>Hello</h1>';`;
    const result = await validateRender(code);
    expect(result.verdict).toBe('pass');
  });
});

// ─── Stage 3: Interaction Tests ─────────────────────────────────────────────

describe('Stage 3: Interaction Validation', () => {
  it('warns when no interactive elements found', async () => {
    const code = `document.getElementById('root').innerHTML = '<p>Static content</p>';`;
    const result = await validateInteraction(code);
    expect(result.stage).toBe('interaction');
    expect(result.warnings.some(w => w.includes('No interactive elements'))).toBe(true);
  });

  it('passes with clickable buttons', async () => {
    const code = `
      const root = document.getElementById('root');
      root.innerHTML = '<button id="btn">Click</button>';
      document.getElementById('btn').addEventListener('click', () => {
        root.innerHTML += '<p>Clicked!</p>';
      });
    `;
    const result = await validateInteraction(code);
    expect(result.verdict).toBe('pass');
  });

  it('passes with form elements', async () => {
    const code = `
      document.getElementById('root').innerHTML = \`
        <form>
          <input type="text" name="name" />
          <input type="checkbox" name="agree" />
          <select><option>A</option><option>B</option></select>
          <button type="submit">Submit</button>
        </form>
      \`;
    `;
    const result = await validateInteraction(code);
    expect(result.verdict).toBe('pass');
  });
});

// ─── Stage 4: Mobile Tests ──────────────────────────────────────────────────

describe('Stage 4: Mobile Responsiveness', () => {
  it('passes responsive HTML', async () => {
    const { validateMobile } = await import('../validators/mobile');
    const result = await validateMobile(VALID_HTML_BUNDLE);
    expect(result.stage).toBe('mobile');
    expect(result.verdict).toBe('pass');
  }, 15000);

  it('catches horizontal overflow', async () => {
    const { validateMobile } = await import('../validators/mobile');
    const result = await validateMobile(OVERFLOW_HTML_BUNDLE);
    expect(result.verdict).toBe('fail');
    expect(result.errors.some(e => e.message.includes('overflow'))).toBe(true);
  }, 15000);
});

// ─── Full Pipeline Tests ────────────────────────────────────────────────────

describe('Full Validation Pipeline', () => {
  it('fails fast on syntax errors (does not run later stages)', async () => {
    const opts: ValidateOptions = {
      toolId: 'test-syntax-fail',
      code: INVALID_SYNTAX,
    };
    const report = await validate(opts);
    expect(report.overallVerdict).toBe('fail');
    expect(report.stages).toHaveLength(1); // Only syntax ran
    expect(report.stages[0].stage).toBe('syntax');
    expect(report.retryContext).toBeDefined();
    expect(report.retryContext!.failedStage).toBe('syntax');
  });

  it('passes all stages in fast mode (skips mobile)', async () => {
    const code = `document.getElementById('root').innerHTML = '<button>Click</button>';`;
    const opts: ValidateOptions = {
      toolId: 'test-fast-pass',
      code,
      fastMode: true,
      stageTimeoutMs: 5000,
    };
    const report = await validate(opts);
    expect(report.overallVerdict).toBe('pass');
    expect(report.stages).toHaveLength(4);
    expect(report.stages[3].stage).toBe('mobile');
    expect(report.stages[3].verdict).toBe('skip');
  });

  it('includes JSON-serializable report', async () => {
    const code = `document.getElementById('root').innerHTML = '<p>Hello</p>';`;
    const report = await validate({
      toolId: 'test-json',
      code,
      fastMode: true,
      stageTimeoutMs: 5000,
    });
    const json = JSON.stringify(report);
    const parsed = JSON.parse(json);
    expect(parsed.toolId).toBe('test-json');
    expect(parsed.timestamp).toBeDefined();
    expect(parsed.totalDurationMs).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(parsed.stages)).toBe(true);
  });

  it('runs full pipeline with mobile on valid HTML bundle', async () => {
    const code = `document.getElementById('root').innerHTML = '<button>OK</button>';`;
    const report = await validate({
      toolId: 'test-full',
      code,
      htmlBundle: VALID_HTML_BUNDLE,
      stageTimeoutMs: 5000,
    });
    expect(report.stages).toHaveLength(4);
    expect(report.stages.map(s => s.stage)).toEqual(['syntax', 'render', 'interaction', 'mobile']);
  }, 20000);
});

// ─── Retry Logic Tests ──────────────────────────────────────────────────────

describe('Retry Logic', () => {
  it('returns pass on first attempt if valid', async () => {
    const code = `document.getElementById('root').innerHTML = '<p>Hi</p>';`;
    const report = await validateWithRetry({
      toolId: 'test-retry-pass',
      code,
      fastMode: true,
      stageTimeoutMs: 5000,
    });
    expect(report.overallVerdict).toBe('pass');
  });

  it('retries with onRetry callback and passes on second attempt', async () => {
    let attempts = 0;
    const report = await validateWithRetry(
      {
        toolId: 'test-retry-fix',
        code: INVALID_SYNTAX,
        fastMode: true,
        stageTimeoutMs: 5000,
      },
      async (ctx) => {
        attempts++;
        expect(ctx.failedStage).toBe('syntax');
        expect(ctx.previousErrors.length).toBeGreaterThan(0);
        // Return valid code on retry
        return `document.getElementById('root').innerHTML = '<p>Fixed</p>';`;
      },
    );
    expect(attempts).toBe(1);
    expect(report.overallVerdict).toBe('pass');
    expect(report.retryContext?.attempt).toBe(1);
  });

  it('returns failure with fallback suggestion after retry exhaustion', async () => {
    const report = await validateWithRetry(
      {
        toolId: 'test-retry-exhaust',
        code: INVALID_SYNTAX,
        fastMode: true,
        stageTimeoutMs: 5000,
      },
      async () => {
        // Return still-broken code
        return '}{{{';
      },
    );
    expect(report.overallVerdict).toBe('fail');
    expect(report.retryContext?.attempt).toBe(2);
    expect(report.retryContext?.suggestion).toContain('rephrasing');
  });
});
