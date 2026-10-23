#!/usr/bin/env node
/**
 * Hyder OS & Desktop Commander All-in-One Launcher
 * Runs both the Vite Web Interface and the Windows Desktop Commander Bridge concurrently.
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\x1b[36m%s\x1b[0m', '=======================================================');
console.log('\x1b[36m%s\x1b[0m', '   HYDER OS - DUAL-ENGINE CONCURRENT LAUNCHER         ');
console.log('\x1b[36m%s\x1b[0m', '   1. Web UI & Neural Neural Core   -> Port 3000      ');
console.log('\x1b[36m%s\x1b[0m', '   2. Desktop Commander Bridge     -> Port 9742      ');
console.log('\x1b[36m%s\x1b[0m', '=======================================================\n');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';
const npxCmd = isWin ? 'npx.cmd' : 'npx';

const desktopCommanderDir = path.join(__dirname, 'desktop-commander');

// 1. Verify Desktop Commander dependencies
const commanderNodeModules = path.join(desktopCommanderDir, 'node_modules');
if (!fs.existsSync(commanderNodeModules)) {
  console.log('\x1b[33m%s\x1b[0m', '[COMMANDER SETUP] Installing desktop-commander dependencies...');
  try {
    const install = spawn(npmCmd, ['install'], {
      cwd: desktopCommanderDir,
      stdio: 'inherit',
      shell: isWin
    });
    await new Promise((resolve) => install.on('close', resolve));
  } catch (err) {
    console.warn('[COMMANDER SETUP WARNING]', err.message);
  }
}

// 2. Launch Desktop Commander Bridge
console.log('\x1b[35m%s\x1b[0m', '[COMMANDER] Starting local bridge on http://127.0.0.1:9742 ...');
const commanderProc = spawn('node', ['server.js'], {
  cwd: desktopCommanderDir,
  env: {
    ...process.env,
    DESKTOP_COMMANDER_PORT: '9742',
    DESKTOP_COMMANDER_TOKEN: 'haider_commander_token_local'
  },
  shell: isWin
});

commanderProc.stdout.on('data', (d) => {
  process.stdout.write(`\x1b[35m[COMMANDER]\x1b[0m ${d.toString()}`);
});
commanderProc.stderr.on('data', (d) => {
  process.stderr.write(`\x1b[31m[COMMANDER ERR]\x1b[0m ${d.toString()}`);
});

// 3. Launch Vite Dev Server
console.log('\x1b[32m%s\x1b[0m', '[WEB UI] Starting Hyder OS Web Interface on http://localhost:3000 ...');
const webProc = spawn(npmCmd, ['run', 'dev'], {
  cwd: __dirname,
  shell: isWin
});

webProc.stdout.on('data', (d) => {
  process.stdout.write(`\x1b[32m[WEB UI]\x1b[0m ${d.toString()}`);
});
webProc.stderr.on('data', (d) => {
  process.stderr.write(`\x1b[33m[WEB UI]\x1b[0m ${d.toString()}`);
});

// Clean shutdown on Ctrl+C
const shutdown = () => {
  console.log('\n\x1b[33m%s\x1b[0m', '[SHUTDOWN] Stopping all Hyder OS services...');
  try {
    if (isWin) {
      if (commanderProc.pid) spawn('taskkill', ['/pid', `${commanderProc.pid}`, '/T', '/F']);
      if (webProc.pid) spawn('taskkill', ['/pid', `${webProc.pid}`, '/T', '/F']);
    } else {
      commanderProc.kill('SIGINT');
      webProc.kill('SIGINT');
    }
  } catch (e) {}
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
