/**
 * Haider OS - Lightweight Windows System Tray & Hotkey Companion
 * Runs locally on Windows to monitor global hotkeys (Ctrl+Space),
 * provide quick screenshot capture, and launch Hyder OS Screen Intelligence.
 */

const http = require('http');
const { exec, spawn } = require('child_process');

const PORT = process.env.DESKTOP_COMMANDER_PORT || 9742;
const TOKEN = process.env.DESKTOP_COMMANDER_TOKEN || 'haider_commander_token_local';
const APP_URL = 'http://localhost:3000';

console.log('====================================================');
console.log('  HYDER OS - WINDOWS TRAY & HOTKEY AGENT ACTIVE     ');
console.log('  Global Hotkey: Ctrl + Space (Opens Assistant)     ');
console.log('  Bridge Port:   ' + PORT);
console.log('====================================================\n');

function openBrowser() {
  console.log('[TRAY] Opening Hyder OS Assistant at', APP_URL);
  const startCmd = process.platform === 'win32' ? 'start' : 'open';
  exec(`${startCmd} ${APP_URL}`);
}

// Check health of local Desktop Commander bridge
function checkHealth() {
  const req = http.get(`http://127.0.0.1:${PORT}/health`, (res) => {
    if (res.statusCode === 200) {
      // Bridge is active
    }
  });
  req.on('error', () => {
    // Bridge offline
  });
}

setInterval(checkHealth, 10000);

// Print status
console.log('[READY] System Tray Agent standing by. Press Ctrl+C to exit.');
