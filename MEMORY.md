# MEMORY.md — Project Long-Term Memory & Decision Log

> **Repository:** Hyder OS  
> **Role:** Persistent architectural log, bug resolution history, decisions, and system constraints.  

---

## 1. Current State of the System

As of October 2026:
- The dual-engine architecture is completely functional: Web frontend running on Port 3000 (`http://localhost:3000`) and Desktop Commander local bridge on Port 9742 (`http://127.0.0.1:9742`).
- Both engines can be simultaneously launched via `run-all.bat` (Windows 1-click) or `npm run dev:all` (`launch-all.js`).
- Advanced Screen Intelligence is live with `getDisplayMedia` screen sharing, front camera stream, native desktop screenshot capture, and multimodal vision analysis via Gemini 3.8 Flash.
- Interactive SVG visual guidance renders dynamic directional arrows, reticle bounding boxes, and numbered step pins over the live viewport.
- Self-Healing Watchdog proactively audits the Web server, local bridge, ports, and dev processes, providing automated fault recovery.
- Reorderable High/Medium/Low priority task decks are synchronized between the HUD and Desktop Commander panels via `haider_tasks_updated` custom events.
- Background Skill Research Agent discovers, evaluates, sandboxes, and registers capabilities from verified sources without mutating core code.

---

## 2. Architectural Decision Records (ADRs)

### ADR-001: Dual-Engine Architecture (Web Frontend + Native Local Bridge)
- **Date:** October 2026
- **Context:** Cloud web applications running in browser sandboxes cannot inspect local Windows processes, ports, or execute PowerShell commands directly due to browser security boundaries.
- **Decision:** Split the system into a high-performance React 19 web frontend (`Port 3000`) and a lightweight local Node.js process (`desktop-commander` on `Port 9742`) communicating over authenticated REST and WebSocket.
- **Alternatives Considered:** Electron-only desktop wrapper (higher memory footprint, less portable) vs Web-only with mocked terminal (unacceptable, user required real computer interaction).
- **Result:** Full native desktop control while keeping the web UI responsive, portable, and cloud-deployable.

### ADR-002: Early window.fetch Accessor Guard in index.html
- **Date:** October 2026
- **Context:** Certain third-party polyfills (such as `formdata-polyfill`) attempted to rebind or patch `window.fetch` using direct assignment (`window.fetch = fn`), crashing in strict mode with `TypeError: Cannot set property fetch of #<Window> which has only a getter`.
- **Decision:** Installed an early script in `<head>` of `index.html` defining configurable `get` and `set` descriptors on `window` and `Window.prototype` before any module scripts execute.
- **Alternatives Considered:** Patching node_modules directly (brittle across npm installs).
- **Result:** Complete runtime immunity against fetch assignment crashes while maintaining native fetch performance.

### ADR-003: 2D Spatial Coordinate Percentages for SVG Overlays
- **Date:** October 2026
- **Context:** Screen sizes vary drastically between user monitors (1080p, 1440p, 4K, ultrawide). Hardcoded pixel coordinates break upon resizing.
- **Decision:** Prompt Gemini 3.8 Flash to return element coordinates in percentage terms `(x: 0-100, y: 0-100, width: 0-100, height: 0-100)` relative to the top-left of the viewport. Render using an SVG element with `viewBox="0 0 100 100" preserveAspectRatio="none"`.
- **Alternatives Considered:** Canvas overlay with manual resize recalculations (heavy CPU repaint cost).
- **Result:** Crisp, resolution-independent vector arrows and reticle highlights across all display resolutions and aspect ratios.

### ADR-004: Event-Driven Cross-Panel Synchronization
- **Date:** October 2026
- **Context:** The user can reorder local priority directives both in the HUD panel and in the Desktop Commander panel. Stale state occurred if one panel was updated while the other was mounted.
- **Decision:** Use `localStorage` as persistent backing store and dispatch `window.dispatchEvent(new Event('haider_tasks_updated'))` upon every reorder or priority change. Components listen to both `haider_tasks_updated` and `storage` events.
- **Alternatives Considered:** Global Redux/Zustand store (unnecessary dependency overhead).
- **Result:** Instant zero-latency synchronization between HUD and Desktop Commander with zero extra packages.

### ADR-005: Screen Intelligence Reception Status & Step Guidance Workflow
- **Date:** October 2026
- **Context:** Users require clear visibility into whether the AI is receiving Screen, Camera, Screenshot, or Nothing, plus actionable step-by-step guidance and audio narration.
- **Decision:** Display high-visibility reception status pill (`AGENT RECEIVING: SCREEN / CAMERA / SCREENSHOT / NOTHING`), provide prominent top-level action buttons (Share Screen, Take Screenshot, Open Camera, Stop Sharing, Screen History, Visual Guidance), and add step navigation with next/prev, completion toggling, clarification queries, and Web Speech API narration.
- **Result:** Fully transparent multimodal perception state and guided desktop navigation.

### ADR-006: Neural Memory Persistence & Voice Task Scheduling
- **Date:** October 2026
- **Context:** User required persistent chat history and knowledge across sessions using LocalStorage, voice-directed task scheduling ("remind me at X time", "یاد رکھنا کہ"), manual word/data editing, and a warm, friendly human-like JARVIS tone.
- **Decision:** Built `neuralMemoryService` with twin LocalStorage partitions: `haider_neural_memory_items_v1` (structured facts, preferences, project context, scheduled task reminders) and `haider_neural_chat_history_v1` (multi-turn conversation archive). Added Web Speech voice parser supporting Urdu/English, real-time reminder watcher with synthesized audio chime, inline text editing, and prompt context injection into `chatWithGemini`.
- **Result:** Complete cross-session conversational recall, natural human-like JARVIS persona, and voice/manual task scheduling.

---

## 3. Solved Bugs & Fixes History

| Bug ID | Problem Description | Root Cause | Solution Applied | Status |
|---|---|---|---|---|
| `BUG-001` | `TypeError: Cannot set property fetch of #<Window> which has only a getter` | Polyfills attempting direct assignment to read-only `window.fetch`. | Implemented global accessor wrapper with configurable getter/setter in `index.html`. | **FIXED** |
| `BUG-002` | Desktop Commander not starting when running `npm run dev` | `npm run dev` only started Vite; bridge on port 9742 required a separate CMD window. | Created `run-all.bat` and `launch-all.js` (`npm run dev:all`) to concurrently spawn both engines. | **FIXED** |
| `BUG-003` | `captureScreen` property mismatch in `screenIntelligenceService` | TypeScript error TS2551: Desktop Commander client exposed `captureScreenshot()`. | Updated method invocation to `desktopCommander.captureScreenshot()`. | **FIXED** |
| `BUG-004` | `researchAgent.runResearchCycle` return type void check | `taskSchedulerService` expected array output from `runResearchCycle`. | Corrected scheduler handler to await `runResearchCycle()` and verify completion. | **FIXED** |
| `BUG-005` | Screen history lacking single-click clearing and detailed action review | History tab displayed basic thumbnail without query or clear button. | Implemented `clearHistory()` in service and enhanced timeline items with query, suggested actions, and context restoration. | **FIXED** |

---

## 4. Known Boundaries & Limitations

- **Browser Permission Dialogs:** Browser security mandates that screen sharing (`getDisplayMedia`) and camera access (`getUserMedia`) prompt the user for permission on the first invocation.
- **Local Bridge Host Availability:** If the user runs the web UI on a remote device without running `desktop-commander` on the host machine, local computer interop operations will be unavailable until the bridge is started.
- **API Key Environment:** Multimodal vision and LLM responses require a valid Gemini API key (`process.env.API_KEY`).

---

## 5. Notes for Future AI Agents

1. Always check `types.ts` before adding new properties to tasks, annotations, or watchdog statuses.
2. The global hotkey `Ctrl + Space` is registered in `App.tsx` and toggles `OSMode.SCREEN_INTELLIGENCE`.
3. Never bypass `securityPolicy.js` in `desktop-commander`. Destructive commands must remain blocked.
