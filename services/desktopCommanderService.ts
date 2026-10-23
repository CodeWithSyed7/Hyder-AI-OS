/**
 * Haider Desktop Commander - Frontend Client Service
 * Connects securely to the local Windows Desktop Commander bridge (http://127.0.0.1:9742).
 * Handles authentication, health checks, command execution, and real-time streaming.
 */

import { DesktopBridgeHealth, AgentTask } from '../types';

export class DesktopCommanderClient {
  private host: string;
  private port: number;
  private token: string;
  private ws: WebSocket | null = null;
  private healthInterval: number | null = null;
  private listeners: Set<(event: any) => void> = new Set();
  public health: DesktopBridgeHealth = {
    status: 'offline',
    agent: 'desktop_commander',
    platform: 'unknown',
    version: '1.0.0',
    host: '127.0.0.1',
    port: 9742,
    capabilities: [],
    workspaces: [],
    lastHeartbeat: 0
  };

  constructor() {
    this.port = parseInt(localStorage.getItem('haider_dc_port') || '9742', 10);
    this.host = localStorage.getItem('haider_dc_host') || '127.0.0.1';
    this.token = localStorage.getItem('haider_dc_token') || 'haider_commander_token_local';
    
    // Start health heartbeat checks
    this.checkHealth();
    this.startHeartbeat();
  }

  public get baseUrl(): string {
    return `http://${this.host}:${this.port}`;
  }

  public get wsUrl(): string {
    return `ws://${this.host}:${this.port}`;
  }

  public isOnline(): boolean {
    return this.health.status === 'online';
  }

  public configure(host: string, port: number, token: string) {
    this.host = host;
    this.port = port;
    this.token = token;
    localStorage.setItem('haider_dc_host', host);
    localStorage.setItem('haider_dc_port', port.toString());
    localStorage.setItem('haider_dc_token', token);
    this.checkHealth();
    this.connectWs();
  }

  public subscribe(cb: (event: any) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(event: any) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  /**
   * Health check query to 127.0.0.1
   */
  public async checkHealth(): Promise<DesktopBridgeHealth> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        this.health = {
          ...this.health,
          ...data,
          status: 'online',
          lastHeartbeat: Date.now()
        };
        this.notify({ type: 'STATUS_CHANGE', status: 'online', health: this.health });
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
          this.connectWs();
        }
      } else {
        this.setOffline();
      }
    } catch (e) {
      this.setOffline();
    }
    return this.health;
  }

  private setOffline() {
    if (this.health.status !== 'offline') {
      this.health.status = 'offline';
      this.notify({ type: 'STATUS_CHANGE', status: 'offline', health: this.health });
    }
  }

  private startHeartbeat() {
    if (this.healthInterval) clearInterval(this.healthInterval);
    this.healthInterval = window.setInterval(() => {
      this.checkHealth();
    }, 4500);
  }

  /**
   * Connect WebSocket for streaming output
   */
  private connectWs() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          this.notify(parsed);
        } catch (err) {}
      };
      this.ws.onclose = () => {
        this.ws = null;
      };
    } catch (e) {
      this.ws = null;
    }
  }

  /**
   * Execute PowerShell / Shell command via Desktop Commander Bridge
   */
  public async executeCommand(command: string, options: { taskId?: string; cwd?: string; approved?: boolean } = {}) {
    if (!this.isOnline()) {
      throw new Error("Desktop Commander is offline. Please launch the local Desktop Commander service on your Windows PC.");
    }

    const res = await fetch(`${this.baseUrl}/api/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Commander-Token': this.token
      },
      body: JSON.stringify({
        command,
        taskId: options.taskId || `task_${Date.now()}`,
        cwd: options.cwd,
        approved: !!options.approved
      })
    });

    const data = await res.json();
    if (!res.ok && res.status !== 403) {
      throw new Error(data.error || `Command execution failed with status ${res.status}`);
    }
    return data;
  }

  /**
   * Capture native Windows desktop screenshot
   */
  public async captureScreenshot() {
    if (!this.isOnline()) {
      throw new Error("Desktop Commander is offline.");
    }

    const res = await fetch(`${this.baseUrl}/api/screenshot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Commander-Token': this.token
      }
    });

    if (!res.ok) {
      throw new Error("Failed to capture desktop screenshot");
    }
    return res.json();
  }

  /**
   * Execute GUI action (click, type, launch app)
   */
  public async executeAction(payload: { actionType: 'click' | 'type' | 'launch'; x?: number; y?: number; text?: string; appName?: string }) {
    if (!this.isOnline()) {
      throw new Error("Desktop Commander is offline.");
    }

    const res = await fetch(`${this.baseUrl}/api/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Commander-Token': this.token
      },
      body: JSON.stringify(payload)
    });

    return res.json();
  }

  /**
   * Inspect live system metrics, open ports, and active processes
   */
  public async getSystemMetrics() {
    if (!this.isOnline()) return null;
    try {
      const res = await fetch(`${this.baseUrl}/api/system`, {
        headers: {
          'X-Commander-Token': this.token
        }
      });
      if (res.ok) return res.json();
    } catch (e) {}
    return null;
  }

  /**
   * Global Emergency Stop
   */
  public async triggerEmergencyStop() {
    if (!this.isOnline()) return { status: 'OFFLINE' };
    const res = await fetch(`${this.baseUrl}/api/emergency-stop`, {
      method: 'POST',
      headers: {
        'X-Commander-Token': this.token
      }
    });
    return res.json();
  }

  /**
   * Reset Emergency Stop
   */
  public async resetEmergencyStop() {
    if (!this.isOnline()) return { status: 'OFFLINE' };
    const res = await fetch(`${this.baseUrl}/api/reset-emergency`, {
      method: 'POST',
      headers: {
        'X-Commander-Token': this.token
      }
    });
    return res.json();
  }
}

// Singleton client instance
export const desktopCommander = new DesktopCommanderClient();
