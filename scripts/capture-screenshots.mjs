import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 51739;
const DIST_DIR = resolve('dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

// 1. Lightweight Static File Server for dist/
function startServer() {
  return new Promise((resolvePromise) => {
    const server = createServer((req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
      const filePath = join(DIST_DIR, urlPath);

      if (existsSync(filePath) && statSync(filePath).isFile()) {
        const ext = extname(filePath).toLowerCase();
        const mime = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(readFileSync(filePath));
      } else {
        // Fallback to index.html for SPA routing
        const fallback = join(DIST_DIR, 'index.html');
        if (existsSync(fallback)) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(readFileSync(fallback));
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      }
    });

    server.listen(PORT, '127.0.0.1', () => {
      console.log(`[Screenshot Server] Serving dist/ at http://127.0.0.1:${PORT}`);
      resolvePromise(server);
    });
  });
}

// 2. Launch Chrome Headless with Remote Debugging
function launchChrome(debugPort) {
  const args = [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank',
  ];
  return spawn(CHROME_PATH, args, { stdio: 'ignore' });
}

async function createCdpClient(debugPort) {
  await new Promise((r) => setTimeout(r, 1200));
  const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
  const list = await res.json();
  const page = list.find((t) => t.type === 'page') || list[0];
  if (!page || !page.webSocketDebuggerUrl) {
    throw new Error('Failed to find Chrome page target');
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolvePromise, reject) => {
    ws.onopen = resolvePromise;
    ws.onerror = reject;
  });

  let messageId = 1;
  const send = (method, params = {}) =>
    new Promise((resolvePromise, reject) => {
      const curId = messageId++;
      const handler = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === curId) {
          ws.removeEventListener('message', handler);
          if (msg.error) reject(new Error(msg.error.message));
          else resolvePromise(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });

  return { ws, send };
}

async function run() {
  const server = await startServer();
  const debugPort = 9555;
  const chromeProcess = launchChrome(debugPort);

  try {
    const { ws, send } = await createCdpClient(debugPort);

    // Set mobile device emulation: 450x800 with 2.4 scale factor = EXACTLY 1080x1920 pixels
    await send('Emulation.setDeviceMetricsOverride', {
      width: 450,
      height: 800,
      deviceScaleFactor: 2.4,
      mobile: true,
      fitWindow: false,
    });

    console.log('[Screenshots] Device emulation set to 1080x1920 (450x800 @ 2.4x)');

    // Helper: Navigate and wait for DOM idle
    const navigate = async () => {
      await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
      await new Promise((r) => setTimeout(r, 1500));
    };

    // Helper: Evaluate JS in page
    const evaluate = async (expression) => {
      return await send('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });
    };

    // Helper: Capture screenshot to file
    const capture = async (filename) => {
      const result = await send('Page.captureScreenshot', { format: 'png' });
      const buffer = Buffer.from(result.data, 'base64');
      const outPath = resolve('playstore-assets', filename);
      writeFileSync(outPath, buffer);
      console.log(`✓ Saved playstore-assets/${filename} (${buffer.readUInt32BE(16)}x${buffer.readUInt32BE(20)})`);
    };

    // ==========================================
    // SCREENSHOT 1: Inspector Module
    // ==========================================
    console.log('[Screenshots] Capturing Screenshot 1: Inspector...');
    await navigate();
    await evaluate(`
      (function() {
        window.localStorage.setItem('app:active_tab', JSON.stringify('inspector'));
        const textarea = document.querySelector('textarea');
        if (textarea) {
          const sample = "aHR0cHM6Ly9tYWx3YXJlLXRlc3QuZXhhbXBsZS5jb20vcGF5bG9hZC5iaW4=";
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
          nativeSetter.call(textarea, sample);
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()
    `);
    await new Promise((r) => setTimeout(r, 800));
    await capture('screenshot-1-inspector.png');

    // ==========================================
    // SCREENSHOT 2: Networks Module
    // ==========================================
    console.log('[Screenshots] Capturing Screenshot 2: Networks (192.168.1.0/26)...');
    await evaluate(`
      (function() {
        // Switch to networks tab by clicking bottom nav button
        const navButtons = Array.from(document.querySelectorAll('nav button'));
        if (navButtons[1]) navButtons[1].click();
      })()
    `);
    await new Promise((r) => setTimeout(r, 600));
    await evaluate(`
      (function() {
        // Set IP to 192.168.1.0
        const ipInput = document.querySelector('input[type="text"]');
        if (ipInput) {
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeSetter.call(ipInput, '192.168.1.0');
          ipInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        // Click on CIDR 26 chip if present
        const chips = Array.from(document.querySelectorAll('button'));
        const chip26 = chips.find(c => c.textContent && c.textContent.trim() === '/26');
        if (chip26) chip26.click();
      })()
    `);
    await new Promise((r) => setTimeout(r, 800));
    await capture('screenshot-2-networks.png');

    // ==========================================
    // SCREENSHOT 3: Ports Module (Port 445 SMB Expanded)
    // ==========================================
    console.log('[Screenshots] Capturing Screenshot 3: Ports (Port 445 SMB)...');
    await evaluate(`
      (function() {
        const navButtons = Array.from(document.querySelectorAll('nav button'));
        if (navButtons[2]) navButtons[2].click();
      })()
    `);
    await new Promise((r) => setTimeout(r, 600));
    await evaluate(`
      (function() {
        // Search 445 or click port 445 card
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"], input[placeholder*="Buscar"]');
        if (searchInput) {
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeSetter.call(searchInput, '445');
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()
    `);
    await new Promise((r) => setTimeout(r, 500));
    await evaluate(`
      (function() {
        // Find and expand port 445 card
        const cards = Array.from(document.querySelectorAll('div, button')).filter(el => el.textContent && el.textContent.includes('445') && el.textContent.includes('SMB'));
        const clickable = cards.find(el => el.tagName === 'BUTTON' || el.getAttribute('role') === 'button' || el.onclick);
        if (clickable) clickable.click();
        else if (cards[0]) cards[0].click();
      })()
    `);
    await new Promise((r) => setTimeout(r, 800));
    await capture('screenshot-3-ports.png');

    // ==========================================
    // SCREENSHOT 4: Guard Module (Windows Event IDs)
    // ==========================================
    console.log('[Screenshots] Capturing Screenshot 4: Guard (Event IDs)...');
    await evaluate(`
      (function() {
        const navButtons = Array.from(document.querySelectorAll('nav button'));
        if (navButtons[3]) navButtons[3].click();
      })()
    `);
    await new Promise((r) => setTimeout(r, 600));
    await evaluate(`
      (function() {
        // In Guard, search for 4625 or expand first event
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"], input[placeholder*="Buscar"]');
        if (searchInput) {
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeSetter.call(searchInput, '4625');
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()
    `);
    await new Promise((r) => setTimeout(r, 500));
    await evaluate(`
      (function() {
        // Expand event 4625
        const eventCards = Array.from(document.querySelectorAll('button, div')).filter(el => el.textContent && el.textContent.includes('4625'));
        if (eventCards[0]) eventCards[0].click();
      })()
    `);
    await new Promise((r) => setTimeout(r, 800));
    await capture('screenshot-4-guard.png');

    console.log('[Screenshots] All 4 mobile screenshots captured successfully!');
    ws.close();
  } finally {
    chromeProcess.kill();
    server.close();
  }
}

run().catch((err) => {
  console.error('[Screenshot Error]', err);
  process.exit(1);
});
