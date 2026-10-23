# GitHub Copilot & Coding Agent Instructions — Hyder OS

You are an expert AI software engineer contributing to **Hyder OS**, an advanced autonomous AI operating system.

---

## 1. Project Overview & Architecture
- **Dual-Engine Architecture:**
  - **Frontend:** React 19 + Vite 6 + TypeScript 5.8 running on `http://localhost:3000`.
  - **Local Native Gateway:** Node.js Express + WebSocket server (`desktop-commander`) running on `http://127.0.0.1:9742`.
  - **AI Cognitive Core:** Google GenAI TypeScript SDK (`@google/genai`) using `gemini-3.8-flash` for multimodal screen vision and `gemini-3.1-flash-lite` for conversational reasoning.

---

## 2. Core Directives for Code Generation

### 2.1 Type Safety & Imports
- **Always use TypeScript:** Write strict TypeScript with explicit types.
- **Consult `types.ts`:** Domain models (`AgentTask`, `VisualAnnotation`, `VisualGuidanceStep`, `WatchdogServiceStatus`, `ScheduledTaskItem`, `OSMode`) reside in `types.ts`. Check `types.ts` before declaring new types.
- **Top-Level Imports:** Group third-party package imports first, then internal components, services, and types.

### 2.2 Component & Styling Guidelines
- **Tailwind Utility Classes:** Use Tailwind CSS. Never write arbitrary separate CSS files.
- **Responsive Fluid Sizing:** Use Tailwind clamp utility classes (e.g. `text-[clamp(10px,0.75vw,12px)]`, `rounded-[24px] sm:rounded-[32px]`) to prevent layout overflow across differing screen viewports.
- **Dark Glassmorphism Theme:** Retain the cybernetic aesthetic: deep navy backgrounds (`#050B18`), translucent cards (`bg-white/[0.02] border-white/10 backdrop-blur-xl`), and neon cyan (`#00E5FF`) / neural emerald (`#2ED8C3`) accents.

### 2.3 Service Layer Boundaries
- **Keep Components Focused:** UI components render layout and capture user input. All network calls, WebSocket event streams, and Gemini API queries belong in `services/*.ts`.
- **Cross-Component Synchronization:** When modifying local tasks (`haider_local_tasks_priority_v1`), persist to `localStorage` and dispatch `window.dispatchEvent(new Event('haider_tasks_updated'))`.

---

## 3. Strict Safety & "Do Not Break" Rules

1. **NEVER modify or delete the early window.fetch accessor guard in `index.html`.** It prevents strict-mode read-only property collisions caused by third-party polyfills.
2. **NEVER remove security filters in `desktop-commander/securityPolicy.js`.** Destructive shell commands (e.g. disk formatting, unconditional recursive root deletes) must always be blocked.
3. **NEVER hardcode API keys or secrets.** Use `process.env.API_KEY` for server-side / proxy access.
4. **NEVER bypass TypeScript compilation.** Every edit must compile cleanly with `tsc --noEmit` (0 errors).

---

## 4. Verification Checklist Before Answering
- [ ] Has `tsc --noEmit` been validated?
- [ ] Is existing functionality in HUD, Screen Intelligence, and Desktop Commander preserved?
- [ ] Are task priorities and annotations rendering accurately?
- [ ] Are changes recorded in `TASKS.md` and `MEMORY.md`?
