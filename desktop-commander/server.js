/**
 * Haider Desktop Commander - Local Execution Server
 * Runs locally on the user's Windows machine.
 * Binds by default to 127.0.0.1:9742
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const { WindowsBridge } = require('./windowsBridge');
const { SecurityPolicy } = require('./securityPolicy');

const PORT = process.env.DESKTOP_COMMANDER_PORT || 9742;
const AUTH_TOKEN = process.env.DESKTOP_COMMANDER_TOKEN || 'haider_commander_token_local';
const ALLOWED_WORKSPACES = (process.env.ALLOWED_WORKSPACES || process.cwd()).split(',');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const bridge = new WindowsBridge();
const security = new SecurityPolicy({ allowedWorkspaces: ALLOWED_WORKSPACES });

// Enable CORS for local and web origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Commander-Token']
}));

app.use(express.json({ limit: '10mb' }));

// Authentication middleware
function authenticate(req, res, next) {
  const token = req.headers['x-commander-token'] || 
                (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));

  if (!token || token !== AUTH_TOKEN) {
    return res.status(401).json({
      error: 'Unauthorized: Invalid Desktop Commander authentication token.',
      code: 'AUTH_FAILED'
    });
  }
  next();
}

// WebSocket clients for streaming
const wsClients = new Set();
wss.on('connection', (ws, req) => {
  wsClients.add(ws);

  ws.send(JSON.stringify({
    type: 'CONNECTED',
    agent: 'desktop_commander',
    timestamp: Date.now()
  }));

  ws.on('close', () => wsClients.delete(ws));
});

function broadcast(event) {
  const msg = JSON.stringify(event);
  for (const client of wsClients) {
    if (client.readyState === 1) {
      client.send(msg);
    }
  }
}

/* =========================================================================
   ROUTES
   ========================================================================= */

// Health check endpoint (can be called by frontend without auth to test connectivity)
app.get('/health', (req, res) => {
  const metrics = bridge.getSystemMetrics();
  res.json({
    status: 'online',
    agent: 'desktop_commander',
    name: 'Desktop Commander (Windows)',
    version: '1.0.0',
    platform: metrics.platform,
    os: metrics.os,
    host: '127.0.0.1',
    port: PORT,
    emergencyStop: bridge.emergencyStopActive,
    capabilities: [
      'powershell_terminal',
      'desktop_screenshot',
      'mouse_control',
      'keyboard_control',
      'port_inspection',
      'process_management',
      'application_launcher',
      'workspace_filesystem'
    ],
    workspaces: ALLOWED_WORKSPACES,
    lastHeartbeat: Date.now()
  });
});

// Authentication Handshake
app.post('/handshake', authenticate, (req, res) => {
  res.json({
    authenticated: true,
    agent: 'desktop_commander',
    sessionToken: 'valid',
    message: 'Haider ↔ Desktop Commander link synchronized successfully.'
  });
});

// Execute PowerShell / Shell command
app.post('/api/execute', authenticate, async (req, res) => {
  const { command, taskId, cwd, approved } = req.body;

  if (!command) {
    return res.status(400).json({ error: 'Command is required' });
  }

  // 1. Classify security level
  const classification = security.classifyCommand(command);

  // 2. High risk check
  if (classification.level === 'HIGH_RISK' && !approved) {
    return res.status(403).json({
      status: 'WAITING_FOR_CONFIRMATION',
      requiresConfirmation: true,
      safetyLevel: 'HIGH_RISK',
      reason: classification.reason,
      command,
      taskId,
      message: 'This action is classified as HIGH RISK and requires explicit user confirmation before execution.'
    });
  }

  // 3. Workspace check
  if (cwd && !security.isPathAllowed(cwd)) {
    return res.status(403).json({
      error: `Directory "${cwd}" is outside the authorized workspace boundaries.`,
      code: 'WORKSPACE_VIOLATION'
    });
  }

  broadcast({
    type: 'TASK_STARTED',
    taskId,
    command,
    safetyLevel: classification.level
  });

  try {
    const result = await bridge.executePowerShell(command, {
      taskId,
      cwd,
      onChunk: (type, text) => {
        broadcast({
          type: 'TERMINAL_STREAM',
          taskId,
          streamType: type,
          text
        });
      }
    });

    // Check prompt injection in output
    const injectionCheck = security.scanPromptInjection(result.stdout + result.stderr);
    if (injectionCheck.detected) {
      return res.status(422).json({
        status: 'FAILED',
        error: injectionCheck.warning,
        code: 'PROMPT_INJECTION_DETECTED',
        marker: injectionCheck.marker,
        stdout: result.stdout
      });
    }

    broadcast({
      type: 'TASK_COMPLETED',
      taskId,
      success: result.success,
      exitCode: result.exitCode
    });

    res.json({
      status: 'COMPLETED',
      safetyLevel: classification.level,
      ...result
    });
  } catch (err) {
    broadcast({
      type: 'TASK_FAILED',
      taskId,
      error: err.message
    });

    res.status(500).json({
      status: 'FAILED',
      error: err.message,
      command,
      taskId
    });
  }
});

// Capture native Windows desktop screenshot
app.post('/api/screenshot', authenticate, async (req, res) => {
  try {
    const shot = await bridge.captureScreenshot();
    res.json(shot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Desktop GUI Action (mouse click, keyboard type, launch app)
app.post('/api/action', authenticate, async (req, res) => {
  const { actionType, x, y, text, appName } = req.body;

  try {
    let result;
    if (actionType === 'click') {
      result = await bridge.mouseClick(x, y);
    } else if (actionType === 'type') {
      result = await bridge.typeText(text);
    } else if (actionType === 'launch') {
      result = await bridge.launchApplication(appName);
    } else {
      return res.status(400).json({ error: `Unknown actionType: ${actionType}` });
    }

    res.json({
      success: true,
      actionType,
      result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// System telemetry and inspection
app.get('/api/system', authenticate, async (req, res) => {
  try {
    const metrics = bridge.getSystemMetrics();
    const ports = await bridge.inspectPorts();
    const devProcesses = await bridge.inspectDevProcesses();

    res.json({
      ...metrics,
      openPorts: ports,
      devProcesses
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Emergency Stop
app.post('/api/emergency-stop', authenticate, (req, res) => {
  const status = bridge.emergencyStop();
  broadcast({ type: 'EMERGENCY_STOP_TRIGGERED', timestamp: Date.now() });
  res.json(status);
});

// Reset Emergency Stop
app.post('/api/reset-emergency', authenticate, (req, res) => {
  const status = bridge.resetEmergencyStop();
  broadcast({ type: 'EMERGENCY_STOP_RESET', timestamp: Date.now() });
  res.json(status);
});

// Start listening on 127.0.0.1
server.listen(PORT, '127.0.0.1', () => {
  console.log(`=======================================================`);
  console.log(`  HAIDER DESKTOP COMMANDER - LOCAL EXECUTION BRIDGE   `);
  console.log(`=======================================================`);
  console.log(`  Status:      ONLINE`);
  console.log(`  Platform:    ${process.platform}`);
  console.log(`  Local URL:   http://127.0.0.1:${PORT}`);
  console.log(`  Auth Token:  ${AUTH_TOKEN}`);
  console.log(`  Workspaces:  ${ALLOWED_WORKSPACES.join(', ')}`);
  console.log(`=======================================================`);
  console.log(`Standing by for Haider executive instructions...`);
});
