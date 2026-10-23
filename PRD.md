# PRD.md — Product Requirements Document

> **Product Name:** Hyder OS  
> **Subtitle:** Next-Gen Autonomous AI Desktop Operating System  
> **Version:** 2.4.0  
> **Status:** Active Production  
> **Last Updated:** October 2026  

---

## 1. Executive Summary & Vision

### 1.1 Product Vision
Hyder OS is an autonomous desktop AI operating system that acts as a proactive personal computer engineer and operator. Rather than being a passive conversational text box, Hyder OS perceives the user's computer screen, listens to natural voice, guides workflows visually with spatial reticles and directional arrows, executes native Windows directives safely, auto-heals hung processes, and self-improves by discovering verified developer tools and skills in the background.

### 1.2 Target Users
1. **Software Engineers & DevOps:** Developers dealing with port conflicts (3000/5173), hung node processes, git operations, local builds, and CI/CD scripts.
2. **Technical Power Users & Creators:** Users seeking an executive AI assistant that can take instructions, inspect application windows, generate visual assets, and troubleshoot configuration errors.
3. **Non-Technical or Novice Computer Users:** Users who encounter confusing error dialogs, don't know where to click, and need step-by-step visual guidance directly on their screen.

### 1.3 Core Problems Solved
- **The "Where do I click?" problem:** Chatbots give long text instructions that users struggle to locate. Hyder OS draws an arrow directly on the target UI element.
- **The "Port already in use" dev frustration:** Developers constantly get `EADDRINUSE: 3000`. Hyder OS's watchdog detects it and kills the hung process with one click.
- **The "Disconnected Agent" limitation:** Cloud AI cannot access local Windows files or command prompt. Hyder OS bridges this with an authenticated, sandboxed local agent (`Desktop Commander`).
- **Capability Stagnation:** Static AI models cannot perform new actions without prompt engineering. Hyder OS's background Skill Researcher crawls GitHub, npm, and MCP directories to propose and sandbox new capabilities.

### 1.4 Product Goals vs. Non-Goals
- **Goals:**
  - Real-time multimodal screen perception with coordinate localization (0-100% 2D canvas overlay).
  - One-click dual engine startup (`run-all.bat` or `npm run dev:all`) for web UI + native bridge.
  - Safe, audited PowerShell execution with high-risk confirmation barriers.
  - Autonomous self-healing for local development processes.
  - Smooth 60fps dark glassmorphic UI with zero layout shifts.
- **Non-Goals:**
  - Unrestricted, un-sandboxed arbitrary script execution without user confirmation.
  - Replacing the underlying Windows Operating System kernel (Hyder OS is an overlay and companion agent).
  - Telemetry harvesting or secret exfiltration.

---

## 2. Core User Journeys

### Journey A: Screen Guidance & Visual Assistance ("Guide Me")
```
User asks: "Where do I click to deploy?"
   │
   ▼
User clicks "Share Screen" (or Presses Ctrl+Space)
   │
   ▼
Hyder OS captures Full HD frame & samples UI components via Gemini 3.8 Flash
   │
   ▼
Gemini computes 2D coordinates [x: 82%, y: 14%]
   │
   ▼
Interactive SVG directional arrow points to "Deploy" button + Numbered Pin "#1"
   │
   ▼
Step 1 highlighted in side drawer: "Click the Deploy menu in top-right"
   │
   ▼
User clicks element → Screen updates → Agent verifies and advances to Step 2
```

### Journey B: Local Process Troubleshooting ("Fix It For Me")
```
User starts dev server: Error "Port 3000 is already in use"
   │
   ▼
Self-Healing Watchdog detects degraded port status OR user takes screenshot
   │
   ▼
Agent diagnoses: "Hung Node process (PID: 14920) occupying TCP port 3000"
   │
   ▼
Agent presents: [Fix Automatically] vs [Show Me How]
   │
   ▼
User clicks [Fix Automatically]
   │
   ▼
Task Orchestrator routes directive to Desktop Commander (Port 9742)
   │
   ▼
Desktop Commander executes `taskkill /F /IM node.exe` safely
   │
   ▼
Watchdog re-audits port → Confirms Port 3000 released → Server starts cleanly
```

---

## 3. Feature Specifications

### 3.1 Screen Intelligence & Visual Guidance Engine (P0)
- **Purpose:** Provide continuous screen sharing, camera vision, screenshot perception, and interactive visual annotation.
- **Inputs:** `MediaStream` from `getDisplayMedia`, `getUserMedia`, or base64 frame from Desktop Commander screenshot API.
- **Processing:** Multimodal vision prompt sent to `gemini-3.8-flash` returning structured JSON coordinates, detected errors, and steps.
- **Outputs:** Interactive SVG overlay with directional arrows, highlight reticles, numbered pins, and natural language explanations.
- **Permissions:** `observe` (view screen), `guide` (draw visual markers).

### 3.2 Desktop Commander Local Windows Bridge (P0)
- **Purpose:** Connect the web interface to the user's local Windows OS.
- **Architecture:** Express + WebSocket server running on `http://127.0.0.1:9742`.
- **Capabilities:** PowerShell command execution, netstat port inspection, active dev process management, screenshot capture via .NET `Graphics.CopyFromScreen`.
- **Security Policy:** Rejects destructive commands (`rmdir /s /q C:\`, registry wipes). Enforces approval modal for `HIGH_RISK` actions.

### 3.3 Reorderable Priority Task Deck (P0)
- **Purpose:** Categorize local terminal directives by `High`, `Medium`, and `Low` priority with drag-and-drop and arrow reordering.
- **Storage:** Persisted in `localStorage` (`haider_local_tasks_priority_v1`) and synced across HUD and Desktop Commander via `haider_tasks_updated` custom events.
- **Execution:** One-click `RUN` triggers execution via Desktop Commander bridge when online.

### 3.4 Self-Healing Watchdog (P1)
- **Purpose:** Continually supervise the Web dev server (3000), Desktop Bridge (9742), Skill Engine, and Vision Uplink.
- **Auto-Healing Triggers:** Terminates hung Node/Vite instances, auto-reconnects dropped WebSocket bridges, and clears stale perceptual cache.
- **Audit Log:** Chronological record of detected, recovering, and recovered events.

### 3.5 Autonomous Skill Intelligence & Registry (P1)
- **Purpose:** Autonomous capability research without modifying production code.
- **Flow:** Crawl (GitHub/npm/MCP/Docs) → Quality & Security Score (0-100) → Sandbox Isolation Test → Registry Ingestion (`skills/registry`).
- **Controls:** Manual cycle trigger, frequency scheduler (5m demo, 6h, 12h, 24h), toggle enable/disable per skill, rollback to previous versions.

### 3.6 Smart Task Scheduler (P1)
- **Purpose:** Automated recurring jobs (Nightly Git backup, Morning environment health check, Autonomous skill sweep, Orphaned port audit).
- **Controls:** Individual task enable toggle, manual "Run Now" trigger, execution status tracking (`completed`, `running`, `failed`).

### 3.7 Cognitive Chat, LiveVoice & Holographic HUD (P1)
- **Purpose:** Primary user interface featuring the reactive 2D/WebGL `NeuralOrb`, real-time speech synthesis, live latency uplink telemetry, and compute sparklines.

### 3.8 Studio Productivity Suites (P2)
- **ImageForge:** AI image synthesis and multi-aspect ratio editing via Gemini.
- **VideoForge:** Video prompt generation via Veo.
- **CodeMirror:** In-browser live HTML/JS sandbox preview.
- **AnalyticsHub:** Real-time token usage, memory, and performance telemetry graphs using Recharts.
- **VirtualPC:** Simulated desktop filesystem and asset organizer.

---

## 4. Priority Matrix (P0 to P3)

| Priority | Feature / Module | Status |
|---|---|---|
| **P0** | Screen Intelligence & Visual SVG Guidance Overlay | **DONE** |
| **P0** | Desktop Commander Local Bridge (`run.bat` / port 9742) | **DONE** |
| **P0** | Reorderable Priority Directives (Drag & Drop in HUD & Commander) | **DONE** |
| **P0** | Dual-Engine Simultaneous Launcher (`run-all.bat` & `launch-all.js`) | **DONE** |
| **P1** | Self-Healing Watchdog (Process supervision & recovery) | **DONE** |
| **P1** | Autonomous Skill Research Agent & Registry | **DONE** |
| **P1** | Smart Task Scheduler (Nightly backup, morning audit) | **DONE** |
| **P1** | Global Hotkey (`Ctrl + Space`) & System Tray Companion | **DONE** |
| **P2** | Neural Terminal, ImageForge, CodeMirror, AnalyticsHub | **DONE** |
| **P3** | Multi-Device Remote Mobile Companion App | *PLANNED* |
| **P3** | Offline Local Ollama/Llama.cpp Fallback Mode | *PLANNED* |
