# ARCHITECTURE.md — System Architecture & Technical Specifications

> **Architecture Style:** Dual-Engine Hybrid (Web Neural Frontend + Native Node.js Desktop Execution Gateway)  
> **Frontend Runtime:** Browser (Vite 6 + React 19 + TypeScript 5.8) on `http://localhost:3000`  
> **Backend Gateway:** Node.js Express + WebSocket Server on `http://127.0.0.1:9742`  
> **AI Core:** Google Gemini TypeScript SDK (`@google/genai` v1.34.0) consuming `gemini-3.8-flash` & `gemini-3.1-flash-lite`  

---

## 1. High-Level System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                              USER CLIENT                               │
│  Browser Display • Microphone • Front Camera • Keyboard (Ctrl+Space)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        HYDER OS WEB APPLICATION                        │
│                   (React 19 + Vite 6 • Port 3000)                      │
│                                                                        │
│  ┌───────────────────────┐ ┌──────────────────────┐ ┌───────────────┐ │
│  │     HUD & Orb Face    │ │  Screen Intelligence │ │  Neural Chat  │ │
│  │ (Priority Drag & Drop)│ │(SVG Reticles/Arrows) │ │  & Terminal   │ │
│  └───────────┬───────────┘ └──────────┬───────────┘ └───────┬───────┘ │
│              │                        │                     │         │
│              ▼                        ▼                     ▼         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                         SERVICE LAYER                            │  │
│  │  • screenIntelligenceService.ts (Streams, Captures, Annotations) │  │
│  │  • watchdogService.ts (Self-Healing Process Supervision)         │  │
│  │  • taskSchedulerService.ts (Recurring Directives & Backups)      │  │
│  │  • agentOrchestrator.ts (Intent Classifier & Security Policy)    │  │
│  │  • desktopCommanderService.ts (REST / WebSocket Client)          │  │
│  │  • skillIntelligence/ (Research Agent, Sandbox, Registry)        │  │
│  └──────────────────┬─────────────────────────────────┬─────────────┘  │
└─────────────────────┼─────────────────────────────────┼────────────────┘
                      │                                 │
           HTTP POST / Streaming               REST / WebSocket Handshake
         Multimodal Vision Payload                 Bearer / X-Token
                      │                       http://127.0.0.1:9742
                      ▼                                 │
┌──────────────────────────────┐                        ▼
│      GOOGLE GEMINI API       │    ┌───────────────────────────────────┐
│ • gemini-3.8-flash (Vision)  │    │     DESKTOP COMMANDER BRIDGE      │
│ • gemini-3.1-flash-lite (Chat│    │      (Node.js • Port 9742)        │
│ • veo-3.1-fast (Video)       │    ├───────────────────────────────────┤
└──────────────────────────────┘    │ • server.js (Express + ws server) │
                                    │ • securityPolicy.js (Risk Filter) │
                                    │ • windowsBridge.js (PowerShell)   │
                                    │ • trayAgent.js (Hotkey / Tray)    │
                                    └─────────────────┬─────────────────┘
                                                      │
                                             Local OS Interop
                                                      ▼
                                    ┌───────────────────────────────────┐
                                    │       WINDOWS 10/11 HOST          │
                                    │ • PowerShell Terminal Subsystem   │
                                    │ • Taskkill & Process Management   │
                                    │ • Netstat TCP Port Telemetry      │
                                    │ • .NET Native Screen Capture      │
                                    │ • Local Filesystem & Git Repo     │
                                    └───────────────────────────────────┘
```

---

## 2. Technology Stack & Component Justification

| Technology | Role | Justification |
|---|---|---|
| **React 19.2.3** | UI Foundation | Concurrent rendering, declarative hooks, component lifecycle optimization. |
| **Vite 6.2.0** | Bundler & Dev Server | Sub-second cold starts, fast HMR, optimized production tree-shaking. |
| **TypeScript 5.8.2** | Type Safety | Strict type checking, interfaces for tasks, visual annotations, and metrics. |
| **@google/genai 1.34.0** | AI SDK | Official modern Google GenAI TypeScript SDK supporting structured JSON and multimodal vision. |
| **Recharts 3.6.0** | Telemetry Visualization | Real-time SVG sparklines, memory allocation, and CPU load charts. |
| **Lucide React 0.562.0** | Futuristic Icons | Consistent, lightweight SVG iconography across all desktop panels. |
| **Tailwind CSS** | Styling Engine | Zero-runtime CSS utility classes, responsive typography clamps, glassmorphism. |
| **Express & ws (Node.js)** | Local Bridge | Lightweight HTTP & WebSocket server bridging web browser to native Windows. |

---

## 3. Verified Project Directory Tree

```
/ (Workspace Root)
├── .env.example                          # Environment variable template
├── AGENTS.md                             # AI Agent Operating Protocol
├── PRD.md                                # Product Requirements Document
├── ARCHITECTURE.md                       # Technical Architecture & Topology
├── RULES.md                              # Code Standards & Security Rules
├── DESIGN.md                             # Design System & UI/UX Constitution
├── TASKS.md                              # Executable Engineering Roadmap
├── MEMORY.md                             # Architecture Decision Records & Bugs
├── README.md                             # Developer Quickstart & Installation
├── LICENSE                               # Open Source License Specification
├── Desktop-App-Packaging-Guide.md        # Native packaging guide
├── index.html                            # Entry HTML + early fetch accessor guard
├── index.tsx                             # React DOM entry point
├── package.json                          # Scripts & dependencies
├── tsconfig.json                         # TypeScript configuration
├── types.ts                              # Core domain types & interfaces
├── vite.config.ts                        # Vite build configuration
├── launch-all.js                         # Dual-engine concurrent Node launcher
├── run-all.bat                           # 1-Click Windows Batch launcher
│
├── .github/
│   ├── copilot-instructions.md           # Instructions for IDE coding agents
│   └── instructions/
│       └── frontend.instructions.md      # Frontend architecture standards
│
├── components/
│   ├── HUD.tsx                           # Neural Holographic HUD + Reorderable Priority Widget
│   ├── NeuralOrb.tsx                     # WebGL/2D Reactive Holographic AI Core Face
│   ├── ScreenIntelligencePanel.tsx       # Screen Sharing, SVG Annotation Overlay & Watchdog
│   ├── DesktopCommanderPanel.tsx         # Local Windows Terminal & Process Execution Console
│   ├── SkillIntelligenceDashboard.tsx    # Autonomous Research, Sandbox & Registry Console
│   ├── NeuralTerminal.tsx                # Synaptic Chat Console with Web Grounding
│   ├── LiveVoice.tsx                     # Speech-to-Speech Real-time Audio Interface
│   ├── ImageForge.tsx                    # AI Image Generation & Editing Studio
│   ├── VideoForge.tsx                    # Veo Video Synthesis Interface
│   ├── CodeMirror.tsx                    # Live Code Editor & Sandbox Previewer
│   ├── AnalyticsHub.tsx                  # System Metrics & Performance Visualizer
│   └── VirtualPC.tsx                     # Virtual Workspace File Manager
│
├── services/
│   ├── geminiService.ts                  # Multimodal Gemini API Connector (Vision, Chat, Video)
│   ├── desktopCommanderService.ts        # Client for 127.0.0.1:9742 (REST & WebSocket)
│   ├── agentOrchestrator.ts              # Intent Classifier & Task Lifecycle State Machine
│   ├── screenIntelligenceService.ts      # Screen/Camera Streams, Frames & Annotation Sync
│   ├── watchdogService.ts                # Self-Healing Watchdog (Supervises 3000/9742/Processes)
│   ├── taskSchedulerService.ts           # Automated Recurring Tasks & Nightly Backups
│   └── skillIntelligence/
│       ├── types.ts                      # Skill Intelligence Schema & Audit Types
│       ├── skillRegistry.ts              # Capability Registry, Versioning & Rollbacks
│       ├── researchAgent.ts              # Autonomous Crawler (GitHub, npm, MCP, Docs)
│       ├── evaluationService.ts          # Quality & Security Scoring Algorithm
│       └── sandboxService.ts             # Isolated Tool Execution Sandbox
│
└── desktop-commander/                    # Local Native Windows Execution Gateway
    ├── package.json                      # Local bridge dependencies (express, cors, ws)
    ├── server.js                         # Local server on port 9742
    ├── windowsBridge.js                  # PowerShell spawn, netstat parser, .NET screenshot
    ├── securityPolicy.js                 # Command Risk Classifier & Blocklist
    ├── trayAgent.js                      # Windows Taskbar Tray & Hotkey Listener
    ├── run.bat                           # 1-Click Bridge Batch Runner
    └── run.ps1                           # PowerShell Bridge Runner
```

---

## 4. Network Protocols, Ports & Inter-Process Communication

### 4.1 Port Allocations
- **Port 3000 (TCP):** Hyder OS Web UI (served by Vite).
- **Port 9742 (TCP):** Desktop Commander REST & WebSocket Gateway.
- **Port 5173 (TCP):** Secondary/Alternative Vite dev port (monitored for collisions).

### 4.2 Inter-Agent Protocol & Events
- **WebSocket Protocol (`ws://127.0.0.1:9742`):**
  - Outgoing: `{ type: 'EXECUTE', command: string, taskId: string }`
  - Incoming: `{ type: 'OUTPUT', taskId: string, stdout: string, stderr: string, exitCode: number }`
  - Telemetry: `{ type: 'SYSTEM_METRICS', cpu: number, ram: number, ports: number[] }`
- **Custom DOM Events (Cross-Component Real-Time Sync):**
  - `'haider_tasks_updated'`: Dispatched whenever a task priority or order changes in HUD or Desktop Commander.
  - `'storage'`: Synchronizes state across browser tabs.

---

## 5. Security & Isolation Architecture

1. **Security Policy Enforcement (`securityPolicy.js`):**
   - Commands are categorized into `SAFE`, `MODERATE`, and `HIGH_RISK`.
   - `HIGH_RISK` directives (e.g. process termination, filesystem deletes) are automatically intercepted and require explicit user authorization before execution.
   - Prohibited commands (e.g. destructive disk formats) are permanently blocked.
2. **Local Token Authentication:**
   - Every request to `http://127.0.0.1:9742` requires header `X-Commander-Token: haider_commander_token_local` or Bearer authentication.
3. **Sandbox Isolation (`sandboxService.ts`):**
   - New external tools discovered by the Skill Research Agent are tested in a mock sandbox environment before being promoted to the active registry.
