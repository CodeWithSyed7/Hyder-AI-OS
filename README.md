# Hyder OS — Next-Gen Autonomous AI Desktop Operating System

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-cyan.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-purple.svg)](https://vitejs.dev/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-3.8_Flash-orange.svg)](https://ai.google.dev/)
[![Architecture](https://img.shields.io/badge/Architecture-Dual--Engine_Hybrid-emerald.svg)](./ARCHITECTURE.md)

Hyder OS is a futuristic, JARVIS-inspired autonomous desktop AI operating system that combines cloud cognitive reasoning with native local computer interaction, real-time screen sharing, interactive SVG visual guidance overlays, self-healing process supervision, and background skill intelligence.

---

## ⚡ Key Capabilities

- **Screen Intelligence & Visual Guidance:** Real-time Full HD screen sharing, camera streaming, and native desktop perception with Gemini 3.8 Flash. Directly draws interactive SVG directional arrows and numbered reticles over the UI.
- **Desktop Commander Local Bridge:** Secure Node.js + WebSocket local gateway on `http://127.0.0.1:9742` enabling PowerShell execution, port conflict auditing, and Windows hardware telemetry.
- **Reorderable Neural Priority Tasks:** Organize local tasks by `High`, `Medium`, and `Low` priority with HTML5 drag-and-drop reordering, synchronized in real time across the HUD and Commander panels.
- **Self-Healing Watchdog:** Proactive background supervisor that monitors ports 3000/9742, kills hung Node/Vite processes, and auto-recovers dropped bridges with audit logging.
- **Autonomous Skill Intelligence:** Dedicated background agent crawling GitHub, npm, and MCP directories to discover, sandbox, and register verified capabilities without mutating core production code.
- **Smart Task Scheduler:** Automates recurring system directives including nightly git backups, morning diagnostic sweeps, and port cleanliness audits.
- **Dual-Engine 1-Click Launcher:** Run both the web frontend and native desktop bridge simultaneously using `run-all.bat` or `npm run dev:all`.

---

## 🚀 Quickstart Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- Windows 10/11 (for native Desktop Commander interop)
- Modern web browser (Chrome, Edge, or Brave recommended for screen sharing)

### 1. 1-Click Launch (Recommended)
Double-click **`run-all.bat`** in the root directory, or execute in your terminal:

```bash
npm run dev:all
```

This concurrently:
1. Verifies dependencies and starts the **Desktop Commander Bridge** on `http://127.0.0.1:9742`.
2. Starts the **Hyder OS Web Interface** on `http://localhost:3000`.
3. Automatically opens `http://localhost:3000` in your default browser.

---

### 2. Manual Startup (Separate Processes)

If you prefer to run services in dedicated terminal windows:

#### Terminal 1 — Desktop Commander Local Bridge:
```bash
cd desktop-commander
npm install
npm start
```
*Listens on `http://127.0.0.1:9742` (Auth Token: `haider_commander_token_local`)*

#### Terminal 2 — Hyder OS Web Interface:
```bash
npm install
npm run dev
```
*Accessible at `http://localhost:3000`*

---

## ⌨️ Global Shortcuts & Navigation

| Shortcut | Action |
|---|---|
| **`Ctrl + Space`** or **`Alt + Space`** | Toggle **Screen Intelligence & Visual Guidance** panel |
| **`⌘1`** | Navigate to Cognitive Chat & Terminal |
| **`⌘2`** | Navigate to ImageForge (AI Visual Synthesis) |
| **`⌘3`** | Navigate to CodeForge (Live Code Sandbox) |
| **`⌘4`** | Navigate to AnalyticsHub (System Telemetry) |

---

## 📂 Project Structure

```
├── components/                  # React UI components
│   ├── HUD.tsx                  # Holographic HUD + Reorderable Priority Widget
│   ├── NeuralOrb.tsx            # Reactive WebGL/2D Holographic AI Core Face
│   ├── ScreenIntelligencePanel.tsx # Screen Sharing, SVG Overlays & Watchdog
│   ├── DesktopCommanderPanel.tsx   # Windows Execution Console & Telemetry
│   ├── SkillIntelligenceDashboard.tsx # Autonomous Research & Registry UI
│   ├── NeuralTerminal.tsx       # Cognitive Chat Console with Search Grounding
│   ├── LiveVoice.tsx            # Real-time Speech-to-Speech Audio Interface
│   └── ImageForge.tsx           # Visual Asset Generation Studio
├── services/                    # Business logic & external connectors
│   ├── geminiService.ts         # Multimodal Gemini API Connector
│   ├── desktopCommanderService.ts # Local Bridge REST/WS Client
│   ├── screenIntelligenceService.ts # MediaStream & Frame Extraction
│   ├── watchdogService.ts       # Self-Healing Watchdog Engine
│   ├── taskSchedulerService.ts  # Automated Recurring Task Scheduler
│   └── skillIntelligence/       # Autonomous Capability Discovery & Sandbox
├── desktop-commander/           # Local Native Windows Gateway (Port 9742)
│   ├── server.js                # Express & WebSocket Gateway
│   ├── windowsBridge.js         # PowerShell & .NET Screenshot Bridge
│   ├── securityPolicy.js        # Command Risk Classifier & Safety Filter
│   └── run.bat                  # 1-Click Bridge Batch Runner
├── launch-all.js                # Concurrent Node dual-engine launcher
└── run-all.bat                  # 1-Click root batch launcher
```

---

## 📖 Complete Documentation System

Detailed documentation files govern every aspect of this project:

- [AGENTS.md](./AGENTS.md) — Mandatory instruction manual for AI agents.
- [PRD.md](./PRD.md) — Product requirements, user journeys, and feature specs.
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Technical topology, data flows, and security.
- [RULES.md](./RULES.md) — Coding conventions, security guidelines, and standards.
- [DESIGN.md](./DESIGN.md) — Dark glassmorphic design system and UI specs.
- [TASKS.md](./TASKS.md) — Implementation roadmap, task status, and backlog.
- [MEMORY.md](./MEMORY.md) — Architectural decision records (ADRs) and resolved bugs.
- [LICENSE](./LICENSE) — Open source software license.

---

## 🛡️ License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.
