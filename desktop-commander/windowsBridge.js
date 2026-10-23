/**
 * Haider Desktop Commander - Native Windows Execution Bridge
 * Provides direct, authenticated Windows system control:
 * - PowerShell command execution with streaming output and timeouts
 * - Native screenshot capture using Windows .NET System.Drawing (zero native binary dependencies)
 * - Process & open port inspection (netstat / Get-NetTCPConnection)
 * - Application launcher (VS Code, Chrome, Terminal, Explorer)
 * - Synthetic mouse/keyboard automation via user32.dll
 */

const { spawn, exec } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

class WindowsBridge {
  constructor(config = {}) {
    this.activeProcesses = new Map();
    this.emergencyStopActive = false;
    this.defaultTimeoutMs = config.timeoutMs || 30000;
  }

  /**
   * Execute a command via Windows PowerShell with timeout and safety controls
   */
  async executePowerShell(command, options = {}) {
    if (this.emergencyStopActive) {
      throw new Error('EMERGENCY_STOP is active. All execution is blocked until explicitly reset.');
    }

    const taskId = options.taskId || `task_${Date.now()}`;
    const cwd = options.cwd || process.cwd();
    const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;

    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      // Encapsulate command in UTF-8 PowerShell execution
      const psProcess = spawn('powershell.exe', [
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy', 'Bypass',
        '-Command',
        `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; ${command}`
      ], {
        cwd,
        windowsHide: true,
        env: { ...process.env, LANG: 'en_US.UTF-8' }
      });

      this.activeProcesses.set(taskId, psProcess);

      const timer = setTimeout(() => {
        timedOut = true;
        try {
          psProcess.kill('SIGKILL');
        } catch (e) {}
        this.activeProcesses.delete(taskId);
        reject(new Error(`Command timed out after ${timeoutMs}ms: "${command}"`));
      }, timeoutMs);

      psProcess.stdout.on('data', (data) => {
        const str = data.toString('utf-8');
        stdout += str;
        if (options.onChunk) options.onChunk('stdout', str);
      });

      psProcess.stderr.on('data', (data) => {
        const str = data.toString('utf-8');
        stderr += str;
        if (options.onChunk) options.onChunk('stderr', str);
      });

      psProcess.on('error', (err) => {
        clearTimeout(timer);
        this.activeProcesses.delete(taskId);
        reject(err);
      });

      psProcess.on('close', (code) => {
        clearTimeout(timer);
        this.activeProcesses.delete(taskId);

        if (timedOut) return;

        resolve({
          taskId,
          command,
          exitCode: code,
          success: code === 0,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  /**
   * Native Windows Desktop Screenshot capture using embedded PowerShell .NET System.Drawing
   * Returns base64 encoded JPEG without requiring any third-party external screen tools!
   */
  async captureScreenshot() {
    if (this.emergencyStopActive) {
      throw new Error('Screenshot blocked: EMERGENCY_STOP active.');
    }

    const script = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$screen = [System.Windows.Forms.Screen]::PrimaryScreen
$bounds = $screen.Bounds
$bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)

$graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)

$ms = New-Object System.IO.MemoryStream
$bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$bytes = $ms.ToArray()
$base64 = [Convert]::ToBase64String($bytes)

$graphics.Dispose()
$bitmap.Dispose()
$ms.Dispose()

Write-Output $base64
`;

    try {
      const result = await this.executePowerShell(script, { timeoutMs: 8000 });
      // Clean up base64 text
      const cleanBase64 = result.stdout.replace(/\s+/g, '');
      return {
        success: true,
        mimeType: 'image/jpeg',
        base64: cleanBase64,
        dataUrl: `data:image/jpeg;base64,${cleanBase64}`,
        timestamp: Date.now()
      };
    } catch (err) {
      // In non-Windows or mock environments, return a simulated screen diagnostic
      return {
        success: false,
        error: err.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Inspect current open listening ports and owning processes
   */
  async inspectPorts() {
    const script = `
Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | 
Select-Object LocalAddress, LocalPort, OwningProcess | 
ForEach-Object {
    $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
    [PSCustomObject]@{
        port = $_.LocalPort
        pid = $_.OwningProcess
        name = if ($proc) { $proc.ProcessName } else { "Unknown" }
    }
} | ConvertTo-Json -Compress
`;

    try {
      const res = await this.executePowerShell(script);
      const data = JSON.parse(res.stdout || '[]');
      return Array.isArray(data) ? data : [data];
    } catch (e) {
      return [];
    }
  }

  /**
   * Inspect running processes related to dev servers (node, python, git, docker)
   */
  async inspectDevProcesses() {
    const script = `
Get-Process | Where-Object { $_.ProcessName -match "node|python|docker|code|git|powershell" } | 
Select-Object Id, ProcessName, WorkingSet64, CPU | 
ForEach-Object {
    [PSCustomObject]@{
        pid = $_.Id
        name = $_.ProcessName
        ramMb = [math]::Round($_.WorkingSet64 / 1MB, 1)
        cpu = [math]::Round($_.CPU, 1)
    }
} | ConvertTo-Json -Compress
`;

    try {
      const res = await this.executePowerShell(script);
      const data = JSON.parse(res.stdout || '[]');
      return Array.isArray(data) ? data : [data];
    } catch (e) {
      return [];
    }
  }

  /**
   * Launch a desktop application
   */
  async launchApplication(appName) {
    const appMap = {
      vscode: 'code',
      code: 'code',
      terminal: 'wt',
      powershell: 'powershell',
      chrome: 'start chrome',
      browser: 'start msedge',
      explorer: 'explorer'
    };

    const target = appMap[appName.toLowerCase()] || `start ${appName}`;
    return this.executePowerShell(target);
  }

  /**
   * Synthesize mouse click at (x, y) coordinates
   */
  async mouseClick(x, y) {
    const script = `
$sig = @'
[DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);
[DllImport("user32.dll")] public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);
'@
$api = Add-Type -MemberDefinition $sig -Name "Win32Mouse" -Namespace "Win32" -PassThru
$api::SetCursorPos(${Math.round(x)}, ${Math.round(y)})
Start-Sleep -Milliseconds 50
$api::mouse_event(0x02, 0, 0, 0, 0) # Left Down
Start-Sleep -Milliseconds 30
$api::mouse_event(0x04, 0, 0, 0, 0) # Left Up
`;
    return this.executePowerShell(script);
  }

  /**
   * Synthesize keyboard typing
   */
  async typeText(text) {
    const escaped = text.replace(/([+^%~(){}[\]])/g, '{$1}').replace(/"/g, '`"');
    const script = `
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait("${escaped}")
`;
    return this.executePowerShell(script);
  }

  /**
   * Emergency Stop: kills all active tasks immediately
   */
  emergencyStop() {
    this.emergencyStopActive = true;
    for (const [taskId, proc] of this.activeProcesses.entries()) {
      try {
        proc.kill('SIGKILL');
      } catch (e) {}
    }
    this.activeProcesses.clear();
    return {
      status: 'EMERGENCY_STOP_ENGAGED',
      message: 'All desktop processes terminated. Execution locked.'
    };
  }

  /**
   * Reset Emergency Stop
   */
  resetEmergencyStop() {
    this.emergencyStopActive = false;
    return {
      status: 'READY',
      message: 'Emergency lock released.'
    };
  }

  /**
   * Get basic system telemetry
   */
  getSystemMetrics() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const cpus = os.cpus();

    return {
      os: `${os.type()} ${os.release()}`,
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      uptimeSeconds: os.uptime(),
      cpuModel: cpus[0]?.model || 'Generic CPU',
      cpuCount: cpus.length,
      cpuLoadPercent: Math.round((os.loadavg()[0] || 0) * 10),
      ramTotalGb: +(totalMem / (1024 ** 3)).toFixed(1),
      ramUsedGb: +(usedMem / (1024 ** 3)).toFixed(1),
      ramFreeGb: +(freeMem / (1024 ** 3)).toFixed(1)
    };
  }
}

module.exports = { WindowsBridge };
