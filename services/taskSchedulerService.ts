/**
 * Smart Scheduler Service
 * Manages automated recurring tasks (nightly backups, morning health check,
 * skill research sweeps, and testing directives).
 */

import { ScheduledTaskItem } from '../types';
import { desktopCommander } from './desktopCommanderService';
import { researchAgent } from './skillIntelligence/researchAgent';

const DEFAULT_SCHEDULES: ScheduledTaskItem[] = [
  {
    id: 'sched-1',
    name: 'Nightly Workspace Git Backup',
    schedule: 'Every 24h at 02:00 AM',
    category: 'backup',
    command: 'git add -A; git commit -m "Automated nightly workspace backup"',
    enabled: true,
    lastRun: Date.now() - 3600000 * 8,
    nextRun: Date.now() + 3600000 * 16,
    status: 'completed'
  },
  {
    id: 'sched-2',
    name: 'Morning Dev Environment Health Check',
    schedule: 'Daily at 08:30 AM',
    category: 'health_check',
    command: 'Get-Process | Where-Object {$_.ProcessName -match "node|git"}',
    enabled: true,
    lastRun: Date.now() - 3600000 * 2,
    nextRun: Date.now() + 3600000 * 22,
    status: 'completed'
  },
  {
    id: 'sched-3',
    name: 'Autonomous Skill Research Cycle',
    schedule: 'Every 12 Hours',
    category: 'skill_research',
    command: 'CRAWL_VERIFIED_ECOSYSTEMS',
    enabled: true,
    lastRun: Date.now() - 3600000 * 4,
    nextRun: Date.now() + 3600000 * 8,
    status: 'idle'
  },
  {
    id: 'sched-4',
    name: 'Orphaned Dev Port Scan (3000, 5173, 9742)',
    schedule: 'Every 6 Hours',
    category: 'port_audit',
    command: 'Get-NetTCPConnection -LocalPort 3000,5173,9742 -State Listen -ErrorAction SilentlyContinue',
    enabled: true,
    lastRun: Date.now() - 3600000,
    nextRun: Date.now() + 3600000 * 5,
    status: 'completed'
  }
];

class TaskSchedulerService {
  private tasks: ScheduledTaskItem[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadTasks();
  }

  private loadTasks() {
    try {
      const saved = localStorage.getItem('haider_scheduled_tasks_v1');
      if (saved) {
        this.tasks = JSON.parse(saved);
        return;
      }
    } catch (e) {}
    this.tasks = DEFAULT_SCHEDULES;
  }

  private saveTasks() {
    try {
      localStorage.setItem('haider_scheduled_tasks_v1', JSON.stringify(this.tasks));
      this.notify();
    } catch (e) {}
  }

  public subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  public getTasks(): ScheduledTaskItem[] {
    return [...this.tasks];
  }

  public toggleTask(id: string) {
    this.tasks = this.tasks.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t);
    this.saveTasks();
  }

  public addTask(task: Omit<ScheduledTaskItem, 'id' | 'status'>) {
    const created: ScheduledTaskItem = {
      ...task,
      id: `sched_${Date.now()}`,
      status: 'idle'
    };
    this.tasks.unshift(created);
    this.saveTasks();
  }

  public deleteTask(id: string) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.saveTasks();
  }

  public async runNow(id: string): Promise<{ success: boolean; output: string }> {
    const target = this.tasks.find(t => t.id === id);
    if (!target) return { success: false, output: 'Task not found' };

    target.status = 'running';
    this.notify();

    try {
      if (target.category === 'skill_research') {
        await researchAgent.runResearchCycle();
        target.status = 'completed';
        target.lastRun = Date.now();
        this.saveTasks();
        return { success: true, output: 'Research cycle complete: Autonomous skill registry synchronized.' };
      }

      if (!desktopCommander.isOnline()) {
        target.status = 'failed';
        this.saveTasks();
        return { success: false, output: 'Local bridge is offline. Start desktop-commander to execute.' };
      }

      const res = await desktopCommander.executeCommand(target.command);
      target.status = res.exitCode === 0 ? 'completed' : 'failed';
      target.lastRun = Date.now();
      this.saveTasks();
      return { success: res.exitCode === 0, output: res.stdout || res.stderr || 'Executed' };
    } catch (err: any) {
      target.status = 'failed';
      this.saveTasks();
      return { success: false, output: err.message };
    }
  }
}

export const taskScheduler = new TaskSchedulerService();
