import { spawn } from 'node:child_process';
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function renderHtmlToPng(htmlContent, outputPath, width, height) {
  return new Promise((resolvePromise, reject) => {
    const tempHtmlPath = resolve(`temp-${Date.now()}-${Math.random().toString(36).substring(7)}.html`);
    writeFileSync(tempHtmlPath, htmlContent, 'utf-8');

    const args = [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      `--window-size=${width},${height}`,
      `--screenshot=${outputPath}`,
      `file:///${tempHtmlPath.replace(/\\/g, '/')}`
    ];

    const child = spawn(CHROME_PATH, args, { stdio: 'ignore' });
    child.on('close', (code) => {
      try {
        if (existsSync(tempHtmlPath)) unlinkSync(tempHtmlPath);
      } catch (err) {}
      if (code === 0) {
        resolvePromise();
      } else {
        reject(new Error(`Chrome exited with code ${code}`));
      }
    });
    child.on('error', (err) => {
      try {
        if (existsSync(tempHtmlPath)) unlinkSync(tempHtmlPath);
      } catch (e) {}
      reject(err);
    });
  });
}

const SHIELD_SVG = `
<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%;">
  <defs>
    <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#10B981"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="1.5" flood-color="#38BDF8" flood-opacity="0.5"/>
    </filter>
  </defs>
  <path d="M32 9 L51 16 V31 C51 43 43 51 32 55 C21 51 13 43 13 31 V16 Z" stroke="url(#shieldGrad)" stroke-width="3.6" stroke-linejoin="round" filter="url(#glow)"/>
  <circle cx="32" cy="24" r="3.5" fill="#38BDF8"/>
  <circle cx="23" cy="38" r="3.5" fill="#10B981"/>
  <circle cx="41" cy="38" r="3.5" fill="#10B981"/>
  <path d="M32 27.5 L24.5 35.5 M32 27.5 L39.5 35.5 M26.5 38 H37.5" stroke="#94A3B8" stroke-width="2.2" stroke-linecap="round"/>
</svg>
`;

function getSquareIconHtml(size) {
  const pad = Math.round(size * 0.12);
  const radius = Math.round(size * 0.22);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width:${size}px;
    height:${size}px;
    background:#0B0F19;
    display:flex;
    align-items:center;
    justify-content:center;
    overflow:hidden;
  }
  .container {
    width:${size}px;
    height:${size}px;
    background: radial-gradient(circle at 50% 30%, #172554 0%, #0B0F19 80%);
    border-radius: ${radius}px;
    display:flex;
    align-items:center;
    justify-content:center;
    padding: ${pad}px;
    border: 1px solid rgba(56, 189, 248, 0.25);
  }
</style>
</head>
<body>
  <div class="container">
    ${SHIELD_SVG}
  </div>
</body>
</html>`;
}

function getRoundIconHtml(size) {
  const pad = Math.round(size * 0.14);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width:${size}px;
    height:${size}px;
    background:transparent;
    display:flex;
    align-items:center;
    justify-content:center;
    overflow:hidden;
  }
  .container {
    width:${size}px;
    height:${size}px;
    background: radial-gradient(circle at 50% 30%, #172554 0%, #0B0F19 80%);
    border-radius: 50%;
    display:flex;
    align-items:center;
    justify-content:center;
    padding: ${pad}px;
    border: 2px solid rgba(56, 189, 248, 0.35);
  }
</style>
</head>
<body>
  <div class="container">
    ${SHIELD_SVG}
  </div>
</body>
</html>`;
}

function getForegroundIconHtml(size) {
  // Safe zone is 66.6% in center
  const innerSize = Math.round(size * 0.62);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width:${size}px;
    height:${size}px;
    background:transparent;
    display:flex;
    align-items:center;
    justify-content:center;
    overflow:hidden;
  }
  .inner {
    width:${innerSize}px;
    height:${innerSize}px;
    display:flex;
    align-items:center;
    justify-content:center;
  }
</style>
</head>
<body>
  <div class="inner">
    ${SHIELD_SVG}
  </div>
</body>
</html>`;
}

function getStoreIconHtml() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width:512px;
    height:512px;
    background:#0B0F19;
    display:flex;
    align-items:center;
    justify-content:center;
    overflow:hidden;
    font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  .bg {
    width:512px;
    height:512px;
    background: radial-gradient(circle at 50% 35%, #0e2238 0%, #0B0F19 75%);
    display:flex;
    align-items:center;
    justify-content:center;
    position:relative;
  }
  .grid {
    position:absolute;
    inset:0;
    background-image: linear-gradient(rgba(56, 189, 248, 0.05) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(56, 189, 248, 0.05) 1px, transparent 1px);
    background-size: 32px 32px;
  }
  .shield-box {
    width: 360px;
    height: 360px;
    position: relative;
    z-index: 2;
  }
</style>
</head>
<body>
  <div class="bg">
    <div class="grid"></div>
    <div class="shield-box">
      ${SHIELD_SVG}
    </div>
  </div>
</body>
</html>`;
}

function getFeatureGraphicHtml() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width:1024px;
    height:500px;
    background:#0B0F19;
    color:#F3F4F6;
    font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    overflow:hidden;
    display:flex;
    align-items:center;
    justify-content:center;
  }
  .card {
    width:1024px;
    height:500px;
    position:relative;
    display:flex;
    align-items:center;
    justify-content:space-between;
    padding:48px 64px;
    background: radial-gradient(circle at 20% 40%, rgba(14, 165, 233, 0.18) 0%, transparent 60%),
                radial-gradient(circle at 85% 60%, rgba(16, 185, 129, 0.12) 0%, transparent 55%),
                #0B0F19;
  }
  .grid-pattern {
    position:absolute;
    inset:0;
    background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events:none;
  }
  .left {
    display:flex;
    flex-direction:column;
    gap:18px;
    max-width:560px;
    z-index:2;
  }
  .tag {
    display:inline-flex;
    align-items:center;
    gap:8px;
    background:rgba(16, 185, 129, 0.12);
    border:1px solid rgba(16, 185, 129, 0.35);
    color:#34D399;
    font-size:12px;
    font-weight:700;
    text-transform:uppercase;
    letter-spacing:1px;
    padding:6px 14px;
    border-radius:9999px;
    width:fit-content;
  }
  .tag-dot {
    width:8px;
    height:8px;
    border-radius:50%;
    background:#10B981;
    box-shadow:0 0 8px #10B981;
  }
  h1 {
    font-size:46px;
    font-weight:900;
    letter-spacing:-1px;
    line-height:1.1;
    color:#FFFFFF;
  }
  h1 span {
    background: linear-gradient(135deg, #38BDF8 0%, #34D399 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  p.sub {
    font-size:18px;
    color:#94A3B8;
    line-height:1.4;
    font-weight:500;
  }
  .badges-grid {
    display:grid;
    grid-template-columns: repeat(2, 1fr);
    gap:10px;
    margin-top:8px;
  }
  .badge-item {
    background:rgba(17, 24, 39, 0.85);
    border:1px solid rgba(55, 65, 81, 0.7);
    border-radius:10px;
    padding:10px 14px;
    display:flex;
    align-items:center;
    gap:10px;
    backdrop-filter:blur(4px);
  }
  .badge-icon {
    width:28px;
    height:28px;
    border-radius:6px;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:14px;
    font-weight:700;
  }
  .badge-title {
    font-size:13px;
    font-weight:700;
    color:#F1F5F9;
  }
  .badge-desc {
    font-size:10px;
    color:#64748B;
  }
  .right {
    position:relative;
    width:320px;
    height:320px;
    display:flex;
    align-items:center;
    justify-content:center;
    z-index:2;
  }
  .right-glow {
    position:absolute;
    width:260px;
    height:260px;
    border-radius:50%;
    background:radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%);
  }
  .emblem {
    width:240px;
    height:240px;
    position:relative;
  }
</style>
</head>
<body>
  <div class="card">
    <div class="grid-pattern"></div>
    <div class="left">
      <div class="tag">
        <span class="tag-dot"></span>
        100% Offline • Air-Gapped Blue Team Toolkit
      </div>
      <h1>NetPocket <span>Cybersecurity</span></h1>
      <p class="sub">Tactical mobile utility for SOC Analysts, Incident Responders & Network Engineers.</p>
      
      <div class="badges-grid">
        <div class="badge-item">
          <div class="badge-icon" style="background:rgba(56,189,248,0.15); color:#38BDF8;">🔍</div>
          <div>
            <div class="badge-title">Inspector</div>
            <div class="badge-desc">IOC, Base64 & Hash Analysis</div>
          </div>
        </div>
        <div class="badge-item">
          <div class="badge-icon" style="background:rgba(16,185,129,0.15); color:#10B981;">🌐</div>
          <div>
            <div class="badge-title">CIDR / ACL</div>
            <div class="badge-desc">Subnetting & Binary X-Ray</div>
          </div>
        </div>
        <div class="badge-item">
          <div class="badge-icon" style="background:rgba(245,158,11,0.15); color:#F59E0B;">🛡️</div>
          <div>
            <div class="badge-title">Ports & Services</div>
            <div class="badge-desc">SOC Threat & Protocol Matrix</div>
          </div>
        </div>
        <div class="badge-item">
          <div class="badge-icon" style="background:rgba(168,85,247,0.15); color:#A855F7;">⚡</div>
          <div>
            <div class="badge-title">SOC Guard</div>
            <div class="badge-desc">Event IDs, Permissions & Hashes</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="right">
      <div class="right-glow"></div>
      <div class="emblem">
        ${SHIELD_SVG}
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function run() {
  console.log('[Assets] Starting Brand Asset Generation...');

  // Ensure directories exist
  mkdirSync(resolve('playstore-assets'), { recursive: true });

  const densityMap = [
    { dir: 'mipmap-mdpi', size: 48, fgSize: 108 },
    { dir: 'mipmap-hdpi', size: 72, fgSize: 162 },
    { dir: 'mipmap-xhdpi', size: 96, fgSize: 216 },
    { dir: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
    { dir: 'mipmap-xxxhdpi', size: 192, fgSize: 432 },
  ];

  for (const { dir, size, fgSize } of densityMap) {
    const targetDir = resolve(`android/app/src/main/res/${dir}`);
    mkdirSync(targetDir, { recursive: true });

    // ic_launcher.png
    const launcherPath = resolve(targetDir, 'ic_launcher.png');
    await renderHtmlToPng(getSquareIconHtml(size), launcherPath, size, size);
    console.log(`✓ ${dir}/ic_launcher.png (${size}x${size})`);

    // ic_launcher_round.png
    const roundPath = resolve(targetDir, 'ic_launcher_round.png');
    await renderHtmlToPng(getRoundIconHtml(size), roundPath, size, size);
    console.log(`✓ ${dir}/ic_launcher_round.png (${size}x${size})`);

    // ic_launcher_foreground.png
    const fgPath = resolve(targetDir, 'ic_launcher_foreground.png');
    await renderHtmlToPng(getForegroundIconHtml(fgSize), fgPath, fgSize, fgSize);
    console.log(`✓ ${dir}/ic_launcher_foreground.png (${fgSize}x${fgSize})`);
  }

  // Google Play Store Icon (512x512)
  const storeIconPath = resolve('playstore-assets/icon-512x512.png');
  await renderHtmlToPng(getStoreIconHtml(), storeIconPath, 512, 512);
  console.log('✓ playstore-assets/icon-512x512.png (512x512)');

  // Google Play Feature Graphic (1024x500)
  const featureGraphicPath = resolve('playstore-assets/feature-graphic-1024x500.png');
  await renderHtmlToPng(getFeatureGraphicHtml(), featureGraphicPath, 1024, 500);
  console.log('✓ playstore-assets/feature-graphic-1024x500.png (1024x500)');

  console.log('[Assets] Launcher & Store Graphic Assets successfully generated!');
}

run().catch((err) => {
  console.error('[Assets Error]', err);
  process.exit(1);
});
