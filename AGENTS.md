# AGENTS.md — Primary AI Agent Operating Manual

> **System Name:** Hyder OS — Next-Gen AI Operating System & Autonomous Desktop AI Agent  
> **Repository ID:** `hyder-os---next-gen-ai-operating-system`  
> **Architecture Level:** Multi-Agent Dual-Engine (Web Neural Frontend + Local Windows Commander Bridge)  
> **Status:** Active Production Development (Vite 6 + React 19 + TypeScript 5.8 + Gemini 3.8/3.1 + Node Desktop Bridge)  

---

## 1. Project Identity & Purpose

Hyder OS is a futuristic, JARVIS-inspired personal AI operating system. It merges:
1. **Executive Cognitive Intelligence** (Gemini 3.8 / 3.1 Flash-Lite, natural voice uplink, holographic HUD, and multimodal perception).
2. **Autonomous Desktop Execution** (`Desktop Commander` local bridge running on `http://127.0.0.1:9742` with PowerShell execution, port conflict resolution, and Windows hardware telemetry).
3. **Advanced Screen Intelligence & Visual Guidance** (Screen sharing via `getDisplayMedia`, front camera via `getUserMedia`, interactive SVG coordinate reticles/arrows, step-by-step guided mode, and diagnostic screen troubleshooting).
4. **Self-Healing Watchdog & Smart Scheduler** (Supervises port 3000/9742, kills hung Node/Vite processes, runs nightly backups, and schedules health checks).
5. **Self-Improving Skill Intelligence** (Autonomous background researcher discovering, sandboxing, and registering capabilities from GitHub, npm, MCP, and PyPI).

**Primary Objective:** Deliver a unified, personal AI computer operator where users can ask questions, share their screen, receive visual directional pointers, automate complex tasks, and enjoy an autonomous desktop companion that self-heals and self-improves.

---

## 2. Documentation System & Source of Truth

Every documentation file controls a specific facet of this repository. When making decisions or updates, consult the corresponding authority:

| Documentation File | Domain Authority | Responsibilities |
|---|---|---|
| `AGENTS.md` | **Agent Protocol** | Operating guidelines, forbidden actions, completion checklist, workflow. |
| `PRD.md` | **Product Requirements** | User personas, feature specs, inputs/outputs, priorities (P0–P3), MVP definitions. |
| `ARCHITECTURE.md` | **System Architecture** | Component topology, data flows, protocols, ports, services, file structures. |
| `RULES.md` | **Engineering Standards** | TypeScript conventions, styling rules, safety policies, git rules, dependencies. |
| `DESIGN.md` | **Design Constitution** | Dark glassmorphism, cyan/amber/emerald palette, typography, micro-interactions. |
| `TASKS.md` | **Roadmap & Tracking** | Executable tasks (`TASK-001` to `TASK-025`), current status, acceptance criteria. |
| `MEMORY.md` | **Project Long-Term Memory** | Architectural decision records (ADRs), solved bugs, risks, known limitations. |
| `README.md` | **Developer Quickstart** | Setup guide, dual-engine start commands, script usage, system requirements. |
| `.github/copilot-instructions.md` | **Coding Agent Guardrails** | Specific prompt rules for GitHub Copilot, Cursor, and IDE coding assistants. |
| `.github/instructions/frontend.instructions.md` | **Frontend Architecture** | UI component boundaries, state management, SVG overlay rules, audio/video handling. |

---

## 3. Protocol for AI Agents Before Modifying Code

Every AI agent working on this codebase **MUST** follow this sequence before making any edits:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. READ AGENTS.md, RULES.md, and relevant task in TASKS.md  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. INSPECT EXISTING IMPLEMENTATION (Never guess or assume)  │
│    Check types.ts, active services, and components          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. VERIFY CLIENT / SERVER BOUNDARIES                        │
│    - Web client runs in browser on Port 3000                │
│    - Desktop Commander runs natively on Port 9742           │
│    - API keys must never be committed or exposed to client  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. MAKE THE SMALLEST SAFE CONTIGUOUS CHANGE                 │
│    Preserve existing functionality, types, and styling      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. VERIFY COMPILATION & LINT                                │
│    Run lint_applet (`tsc --noEmit`) and compile_applet      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. UPDATE DOCUMENTATION & RECORD IN MEMORY.MD               │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Forbidden Actions (What AI Agents Must NEVER Do)

- **NEVER** overwrite or bypass the early `window.fetch` accessor guard in `index.html`. It protects third-party polyfills against read-only getter collisions.
- **NEVER** remove or disable `desktop-commander/securityPolicy.js` destructive command blockers (e.g., blocking `rmdir /s /q C:\` or formatted disk drives).
- **NEVER** hardcode real API keys or tokens in client files or commit them to git. The Gemini API key must be consumed through `process.env.API_KEY`.
- **NEVER** fabricate non-existent endpoints, databases, or third-party SDKs. If a feature is planned but not connected, document it as `NOT_STARTED` or `MOCK_SANDBOX`.
- **NEVER** introduce redundant libraries when existing packages (`recharts`, `lucide-react`, native HTML5 Canvas, MediaStream API) already fulfill the requirement.
- **NEVER** replace the dark glassmorphic design system with unstyled HTML, default Tailwind colors, or white backgrounds.
- **NEVER** execute dangerous shell commands directly without going through the `AgentOrchestrator` security classification and confirmation workflow.

---

## 5. Completion Protocol

After completing any feature or architectural modification:
1. **Lint & Build Check:** Run `tsc --noEmit` and `npm run build` to confirm zero TypeScript compilation errors.
2. **Sync TASKS.md:** Mark the completed task as `DONE` and update acceptance criteria.
3. **Record in MEMORY.md:** Log the architectural decision, the reason, alternatives evaluated, and any fixed bugs.
4. **Brief Summary:** Give the user a clear, professional overview of what was created, how to test it, and the recommended next step.
