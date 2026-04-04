import { chromium } from 'playwright';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const demoPage = path.join(__dirname, 'demo-page.html');
const videoDir = path.join(__dirname, 'recordings');
const outputGif = path.join(__dirname, 'agentdoom-demo.gif');

async function record() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 800, height: 700 },
    recordVideo: { dir: videoDir, size: { width: 800, height: 700 } },
  });

  const page = await context.newPage();
  console.log('Loading demo page...');
  await page.goto(`file://${demoPage}`);

  // Wait for the demo to complete (typing + generation + preview + hold)
  // Total estimated: ~800+300+(45*39=1755)+600+400+(4 stages * ~1500)+800+400+3000 ≈ 16s
  console.log('Recording demo flow...');
  await page.waitForSelector('.actions.visible', { timeout: 30000 });

  // Extra hold at end
  await page.waitForTimeout(3000);

  console.log('Stopping recording...');
  await page.close();
  await context.close();

  // Get the video file path
  const fs = await import('fs');
  const videos = fs.readdirSync(videoDir).filter(f => f.endsWith('.webm'));
  if (videos.length === 0) {
    console.error('No video recorded!');
    await browser.close();
    process.exit(1);
  }

  const videoPath = path.join(videoDir, videos[videos.length - 1]);
  console.log(`Video: ${videoPath}`);

  // Convert to GIF using ffmpeg
  // Two-pass for good quality: palette generation then GIF encoding
  const palettePath = path.join(__dirname, 'palette.png');
  console.log('Generating palette...');
  execSync(`ffmpeg -y -i "${videoPath}" -vf "fps=12,scale=800:-1:flags=lanczos,palettegen=max_colors=128" "${palettePath}"`, { stdio: 'inherit' });

  console.log('Encoding GIF...');
  execSync(`ffmpeg -y -i "${videoPath}" -i "${palettePath}" -lavfi "fps=12,scale=800:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3" "${outputGif}"`, { stdio: 'inherit' });

  // Cleanup
  fs.unlinkSync(palettePath);
  console.log(`\nDone! GIF saved to: ${outputGif}`);
  const stats = fs.statSync(outputGif);
  console.log(`Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  await browser.close();
}

record().catch(err => { console.error(err); process.exit(1); });
