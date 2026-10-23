# TASKS.md — Project Implementation Roadmap & Task Matrix

> **Project:** Hyder OS — Next-Gen Autonomous AI Desktop Operating System  
> **Status Schema:** `DONE` • `IN_PROGRESS` • `NOT_STARTED` • `BLOCKED` • `NEEDS_REVIEW`  

---

## Task Matrix Overview

| Task ID | Feature Domain | Priority | Status |
|---|---|---|---|
| `TASK-001` | Project Foundation, TypeScript & Strict Setup | P0 | **DONE** |
| `TASK-002` | Dark Glassmorphic Design System & Tailwind Configuration | P0 | **DONE** |
| `TASK-003` | Early window.fetch Accessor Guard & Polyfill Protection | P0 | **DONE** |
| `TASK-004` | Reactive 2D/WebGL Holographic NeuralOrb Component | P1 | **DONE** |
| `TASK-005` | Neural Holographic HUD Dashboard & Quick Directives | P0 | **DONE** |
| `TASK-006` | Native Windows Desktop Commander Local Bridge (Port 9742) | P0 | **DONE** |
| `TASK-007` | Security Policy Classifier & High-Risk Confirmation Barrier | P0 | **DONE** |
| `TASK-008` | Reorderable Priority Task Deck (High/Med/Low Drag & Drop) | P0 | **DONE** |
| `TASK-009` | Dual-Engine 1-Click Launchers (`run-all.bat` & `launch-all.js`)| P0 | **DONE** |
| `TASK-010` | Screen Sharing & Camera Stream Ingestion Pipeline | P0 | **DONE** |
| `TASK-011` | Gemini Multimodal Vision Screen Analysis Engine | P0 | **DONE** |
| `TASK-012` | Interactive SVG Coordinate Reticles & Visual Arrows Overlay | P0 | **DONE** |
| `TASK-013` | Step-by-Step Interactive "Guide Me" Workflow Stepper | P0 | **DONE** |
| `TASK-014` | Screen-Based Error Troubleshooter & Automated Repair Hook | P1 | **DONE** |
| `TASK-015` | Self-Healing Background Watchdog Service & Port Supervision | P1 | **DONE** |
| `TASK-016` | Automated Recurring Task Scheduler (Backups & Audits) | P1 | **DONE** |
| `TASK-017` | Autonomous Skill Research Agent & Verified Source Crawler | P1 | **DONE** |
| `TASK-018` | Isolated Sandbox Execution & Capability Registry Ingestion | P1 | **DONE** |
| `TASK-019` | Global Keyboard Hotkey (`Ctrl + Space`) & System Tray Agent | P1 | **DONE** |
| `TASK-020` | Real-time Voice Interaction (`LiveVoice`) & Speech Synthesis | P1 | **DONE** |
| `TASK-021` | Synaptic Chat Terminal with Google Search Grounding | P1 | **DONE** |
| `TASK-022` | Studio Suites (ImageForge, CodeMirror, AnalyticsHub, Files) | P2 | **DONE** |
| `TASK-026` | Neural Memory & Voice Task Scheduling (LocalStorage Sync) | P0 | **DONE** |
| `TASK-023` | Multi-Device Remote Mobile Companion App | P3 | `NOT_STARTED` |
| `TASK-024` | Local Offline LLM Integration (Ollama / Llama.cpp) | P3 | `NOT_STARTED` |
| `TASK-025` | Enterprise Multi-Tenant RBAC & Cloud SQL Storage Sync | P3 | `NOT_STARTED` |

---

## Detailed Task Specifications

### TASK-001: Project Foundation & Strict Setup
- **Title:** Initialize Core Application Shell and Types
- **Priority:** P0 | **Status:** `DONE`
- **Files Affected:** `package.json`, `tsconfig.json`, `index.html`, `index.tsx`, `types.ts`
- **Implementation:** Configured Vite 6, React 19, TypeScript 5.8, Tailwind CSS, and core OSMode state machine.
- **Acceptance Criteria:** `npm run build` succeeds with zero errors.

---

### TASK-008: Reorderable Priority Directives (HUD & Desktop Commander)
- **Title:** Implement High/Medium/Low Priority Drag & Drop Task Queue
- **Priority:** P0 | **Status:** `DONE`
- **Files Affected:** `components/HUD.tsx`, `components/DesktopCommanderPanel.tsx`, `types.ts`
- **Implementation:** Added `LocalTaskItem` schema with `TaskPriority`. Built HTML5 drag-and-drop (`onDragStart`, `onDragOver`, `onDrop`), tactile move up/down arrows, priority filter tabs (`All`, `High`, `Medium`, `Low`), and synchronized across panels using `haider_tasks_updated` custom event.
- **Acceptance Criteria:** Reordering in HUD immediately reflects in Desktop Commander panel and persists across page reloads.

---

### TASK-009: Dual-Engine 1-Click Launchers
- **Title:** Concurrent Startup for Web UI (Port 3000) and Desktop Commander (Port 9742)
- **Priority:** P0 | **Status:** `DONE`
- **Files Affected:** `run-all.bat`, `launch-all.js`, `package.json`
- **Implementation:** Created Node-based concurrent runner `launch-all.js` that spawns both processes with colorized log prefixes, plus Windows `run-all.bat` that launches the bridge and opens `http://localhost:3000`. Configured `"dev:all": "node launch-all.js"`.
- **Acceptance Criteria:** Executing `npm run dev:all` or double-clicking `run-all.bat` launches both engines simultaneously.

---

### TASK-010 to TASK-014: Screen Intelligence & Visual Guidance System
- **Title:** Implement Multimodal Screen Sharing, SVG Guidance Overlays, and Troubleshooter
- **Priority:** P0 | **Status:** `DONE`
- **Files Affected:** `components/ScreenIntelligencePanel.tsx`, `services/screenIntelligenceService.ts`, `services/geminiService.ts`, `types.ts`, `App.tsx`
- **Implementation:** Built `navigator.mediaDevices.getDisplayMedia` screen sharing, camera mode, screenshot perception, Gemini 3.8 Flash 2D coordinate calculation (`x`, `y`, `width`, `height`), SVG directional arrows, interactive numbered pins, step-by-step guidance workflow, and automated repair command dispatch.
- **Acceptance Criteria:** User can share screen, ask "where do I click?", receive visual arrows pointing directly at UI elements, and execute automatic fixes for detected errors.

---

### TASK-015: Self-Healing Watchdog Service
- **Title:** Real-time Process, Port, and Connection Supervision
- **Priority:** P1 | **Status:** `DONE`
- **Files Affected:** `services/watchdogService.ts`, `components/ScreenIntelligencePanel.tsx`, `types.ts`
- **Implementation:** Built periodic supervisor checking Web Server (3000), Desktop Bridge (9742), Skill Engine, and Vision Uplink. Added automated fault recovery triggers (killing hung node/vite processes, reconnecting dropped bridges) with an inspectable audit timeline.
- **Acceptance Criteria:** Watchdog detects hung processes on port 3000 and clears them safely.

---

### TASK-016: Automated Recurring Task Scheduler
- **Title:** Smart Scheduler for Backups, Diagnostic Sweeps & Health Checks
- **Priority:** P1 | **Status:** `DONE`
- **Files Affected:** `services/taskSchedulerService.ts`, `components/ScreenIntelligencePanel.tsx`
- **Implementation:** Configured recurring directives: Nightly Git Backup, Morning Health Check, Autonomous Skill Sweep, and Orphaned Port Audit with toggle controls and instant "Run Now" execution.
- **Acceptance Criteria:** User can toggle schedules, trigger manual runs, and inspect execution outcomes.

---

### TASK-017 & TASK-018: Autonomous Skill Research Agent & Registry
- **Title:** Background Capability Discovery, Sandbox Testing & Skill Registry
- **Priority:** P1 | **Status:** `DONE`
- **Files Affected:** `services/skillIntelligence/*`, `components/SkillIntelligenceDashboard.tsx`
- **Implementation:** Built autonomous background crawler inspecting GitHub, npm, MCP, and documentation sites. Added multi-factor security scoring, isolated sandbox simulation, skill registry table with version tracking, enable/disable toggles, and rollback capabilities.
- **Acceptance Criteria:** Capabilities can be researched, sandboxed, and made available to the executive core without modifying production code.

---

### TASK-026: Neural Memory & Voice Task Scheduling (LocalStorage Sync)
- **Title:** Persistent Context, Knowledge Base, Task Reminders & Voice Uplink
- **Priority:** P0 | **Status:** `DONE`
- **Files Affected:** `services/neuralMemoryService.ts`, `components/NeuralMemoryPanel.tsx`, `components/NeuralTerminal.tsx`, `components/HUD.tsx`, `services/geminiService.ts`, `App.tsx`, `types.ts`
- **Implementation:** Created `neuralMemoryService` persisting user facts, preferences, project context, scheduled task reminders, and chat history in `localStorage`. Built full-featured `NeuralMemoryPanel` with Memory Bank, Tasks & Reminders, Voice Memory Uplink (multilingual Urdu/English), and Chat Archive. Added inline word editing, individual item deletion, and real-time audio chime + HUD banner when reminders are due. Injected memory recall into Gemini prompts with a friendly, natural human-like JARVIS tone.
- **Acceptance Criteria:** Memories and chat history persist across page refreshes, voice dictation automatically extracts reminders with scheduled times, inline word edits save to LocalStorage, and Gemini naturally references stored memories.

