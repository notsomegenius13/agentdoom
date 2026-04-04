import type { StageResult, ValidationError } from '../types';
import { MOBILE_VIEWPORTS } from '../types';

/**
 * Stage 4: Mobile Responsiveness
 * Uses Playwright headless Chromium to test at 4 viewport sizes.
 * Checks: no horizontal scroll, no clipped content, no layout breaks.
 */
export async function validateMobile(htmlBundle: string): Promise<StageResult> {
  const start = performance.now();
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  let screenshot: string | undefined;

  let browser;
  try {
    const { chromium } = await import('playwright');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();

    for (const viewport of MOBILE_VIEWPORTS) {
      const page = await context.newPage();
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      // Load the HTML bundle
      await page.setContent(htmlBundle, { waitUntil: 'networkidle' });

      // Check for horizontal overflow (scroll width > viewport width)
      const overflowCheck = await page.evaluate((vw: number) => {
        const body = document.body;
        const html = document.documentElement;
        const scrollWidth = Math.max(body.scrollWidth, html.scrollWidth);
        const hasOverflow = scrollWidth > vw + 2; // 2px tolerance
        return {
          hasOverflow,
          scrollWidth,
          viewportWidth: vw,
        };
      }, viewport.width);

      if (overflowCheck.hasOverflow) {
        errors.push({
          message: `Horizontal overflow at ${viewport.name} (${viewport.width}px): content is ${overflowCheck.scrollWidth}px wide`,
          source: 'mobile',
        });

        // Take screenshot on first failure
        if (!screenshot) {
          const buf = await page.screenshot({ fullPage: true });
          screenshot = buf.toString('base64');
        }
      }

      // Check for clipped/overlapping content
      const clipCheck = await page.evaluate(() => {
        const issues: string[] = [];
        const elements = document.querySelectorAll('*');
        for (const el of elements) {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);

          // Check for elements extending beyond viewport
          if (rect.right > window.innerWidth + 5 && style.position !== 'fixed' && style.position !== 'absolute') {
            const tag = el.tagName.toLowerCase();
            const cls = el.className ? `.${String(el.className).split(' ')[0]}` : '';
            issues.push(`<${tag}${cls}> extends ${Math.round(rect.right - window.innerWidth)}px beyond viewport`);
          }

          // Check for unreadably small text
          const fontSize = parseFloat(style.fontSize);
          if (fontSize > 0 && fontSize < 10 && el.textContent?.trim()) {
            const tag = el.tagName.toLowerCase();
            issues.push(`<${tag}> has ${fontSize}px font — may be unreadable on mobile`);
          }
        }
        return issues;
      });

      for (const issue of clipCheck) {
        warnings.push(`${viewport.name} (${viewport.width}px): ${issue}`);
      }

      // Check for console errors during render
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      // Brief wait to catch async errors
      await page.waitForTimeout(100);

      for (const msg of consoleErrors) {
        errors.push({
          message: `Console error at ${viewport.name}: ${msg}`,
          source: 'console',
        });
      }

      await page.close();
    }

    await context.close();
  } catch (err: unknown) {
    errors.push({
      message: `Mobile validation failed: ${String(err)}`,
      source: 'playwright',
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return {
    stage: 'mobile',
    verdict: errors.length === 0 ? 'pass' : 'fail',
    durationMs: Math.round(performance.now() - start),
    errors,
    warnings,
    screenshot,
  };
}
