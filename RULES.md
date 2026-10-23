# RULES.md — Engineering Standards & Development Constitution

> **Status:** Mandatory  
> **Applies to:** All Developers, Subagents, and AI Assistants modifying this repository.  

---

## 1. Coding & TypeScript Standards

### 1.1 Language & Type Safety
- **Strict TypeScript:** All new code must be written in TypeScript (`.ts` or `.tsx`). Never use loose `any` where a concrete type can be defined.
- **Centralized Types:** Core domain models, state enums, tasks, and visual annotations belong in `types.ts` or module-specific `types.ts` (e.g. `services/skillIntelligence/types.ts`).
- **Standard Enums:** Use standard TypeScript enums (e.g. `OSMode`) or union string literals (e.g. `TaskPriority = 'High' | 'Medium' | 'Low'`).
- **Imports:** Place all imports at the top of the file. Group third-party libraries first, then internal components, services, and types.

### 1.2 Component Design
- **Functional Components:** Use functional React components with standard React hooks (`useState`, `useEffect`, `useCallback`, `useRef`).
- **No Inline Styles:** Use Tailwind CSS utility classes. Never use inline `style={{ ... }}` unless calculating dynamic runtime percentages (e.g., SVG coordinate positions `left: ${ann.x}%`).
- **Responsive Typography:** Always use responsive font sizes (e.g. `text-[clamp(10px,0.75vw,12px)]`) to ensure readability on mobile, laptop, and ultra-wide screens.

---

## 2. Architecture & State Management Rules

### 2.1 Separation of Concerns
```
┌────────────────────────────────────────────────────────┐
│ UI Components (`components/*.tsx`)                     │
│  - Render layout, display state, capture user events   │
└──────────────────────────┬─────────────────────────────┘
                           │ Calls
                           ▼
┌────────────────────────────────────────────────────────┐
│ Service Layer (`services/*.ts`)                        │
│  - Business logic, stream handling, API communication  │
└──────────────────────────┬─────────────────────────────┘
                           │ Interacts with
                           ▼
┌────────────────────────────────────────────────────────┐
│ External APIs & Native Desktop Bridge (Port 9742)      │
└────────────────────────────────────────────────────────┘
```

- **Business Logic Isolation:** Components must not directly make raw `fetch` calls to Desktop Commander or Gemini; route calls through `desktopCommanderService.ts`, `geminiService.ts`, or `screenIntelligenceService.ts`.
- **State Synchronization:** When modifying shared local datasets (such as `haider_local_tasks_priority_v1`), always persist to `localStorage` AND dispatch the custom event `window.dispatchEvent(new Event('haider_tasks_updated'))` so all active panels update instantaneously.

---

## 3. Security & Safety Rules (Non-Negotiable)

1. **Zero Secret Leakage:**
   - Never commit API keys, auth tokens, or passwords to git.
   - The Gemini API key is supplied via `process.env.API_KEY`.
2. **Local Execution Boundaries:**
   - Every request to the Desktop Commander bridge requires the `X-Commander-Token` header.
   - The bridge must reject all commands marked as destructive in `securityPolicy.js`.
   - `HIGH_RISK` commands must halt and await user confirmation through the `AgentOrchestrator` approval modal before execution.
3. **Safe window.fetch Accessor:**
   - Never modify or remove the window fetch property wrapper in `index.html`. It ensures third-party polyfills do not throw strict-mode `TypeError: Cannot set property fetch` errors.

---

## 4. Dependency Management Rules

Before installing any new package:
1. **Inspect Existing Stack:** Check if `package.json` already contains a suitable library.
   - For icons: use `lucide-react`.
   - For charts: use `recharts`.
   - For UI overlays: use native SVG and HTML5 Canvas.
   - For screen capture: use native browser `navigator.mediaDevices`.
2. **Tool-Assisted Installation:** Always use `install_applet_package` tool to install dependencies.
3. **No Unnecessary Frameworks:** Do not add heavy CSS frameworks, full-state management stores (Redux), or UI component suites that bloat the bundle.

---

## 5. Git & Verification Rules

1. **Verification Before Turn Completion:**
   - Every file change must be verified with `lint_applet` (`tsc --noEmit`) and `compile_applet` (`npm run build`).
2. **Documentation Maintenance:**
   - If a feature is added or updated, update `TASKS.md` and record the rationale in `MEMORY.md`.
3. **No Breaking Changes:**
   - Never break existing modes (`OSMode.HUD`, `OSMode.SCREEN_INTELLIGENCE`, `OSMode.DESKTOP_COMMANDER`, etc.).
