# Frontend Architecture & Engineering Guidelines — Hyder OS

> **Framework:** React 19 (Vite 6 SPA)  
> **Target:** High-performance, zero-latency desktop interface with hardware-accelerated animations.  

---

## 1. Component Topology & Folder Structure

```
components/
├── HUD.tsx                   # Main cockpit, NeuralOrb face, telemetry & priority task widget
├── NeuralOrb.tsx             # Procedural 2D/WebGL holographic AI core canvas
├── ScreenIntelligencePanel.tsx # Multimodal screen sharing, SVG guidance & watchdog
├── DesktopCommanderPanel.tsx # Native Windows execution terminal & process manager
├── SkillIntelligenceDashboard.tsx # Capability discovery, sandbox test & registry table
├── NeuralTerminal.tsx        # Cognitive chat console with Google Search grounding
├── LiveVoice.tsx             # Real-time speech synthesis & audio wave visualizer
├── ImageForge.tsx            # AI visual synthesis & image editing studio
├── VideoForge.tsx            # AI video prompt generator (Veo)
├── CodeMirror.tsx            # Live sandbox HTML/JS code execution previewer
├── AnalyticsHub.tsx          # Real-time telemetry, memory & compute charts (Recharts)
└── VirtualPC.tsx             # Virtual desktop filesystem & asset explorer
```

---

## 2. Screen Intelligence & SVG Coordinate Overlay Architecture

When rendering visual guidance annotations over a live screen or camera feed:
1. **Coordinate System:**
   - Coordinates are calculated by Gemini 3.8 Flash as **percentages** from the top-left corner:
     `x: 0%` to `100%`, `y: 0%` to `100%`.
2. **SVG Viewport:**
   - Always use an SVG element overlaying the video/image:
     ```tsx
     <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 100 100" preserveAspectRatio="none">
       ...
     </svg>
     ```
   - Vectors, arrows, and reticles scale automatically across any display resolution (1080p, 1440p, 4K) without pixel distortions.
3. **Interactive Elements:**
   - HTML pins and hover tooltip cards must reside in an overlay with `pointer-events-none` on the container, but `pointer-events-auto` on the interactive badge itself.

---

## 3. Drag-and-Drop Implementation Standards

For reorderable priority directive queues (in `HUD.tsx` and `DesktopCommanderPanel.tsx`):
- Use standard HTML5 drag-and-drop APIs to avoid extra npm library weight:
  - `draggable`
  - `onDragStart={(e) => handleDragStart(e, index)}`
  - `onDragOver={(e) => { e.preventDefault(); handleDragOver(e, index); }}`
  - `onDrop={(e) => handleDrop(e, index)}`
  - `onDragEnd={handleDragEnd}`
- Always provide fallback tactile **Up/Down Arrow Buttons** for accessibility, keyboard navigation, and mobile touchscreens.
- When an item is reordered, immediately write to `localStorage` and trigger:
  ```ts
  window.dispatchEvent(new Event('haider_tasks_updated'));
  ```

---

## 4. MediaStream & Privacy Lifecycle

- **Clean Up Streams:** Every `MediaStream` acquired via `navigator.mediaDevices.getDisplayMedia` or `getUserMedia` must have its tracks stopped on component unmount or when the user clicks "Stop Sharing":
  ```ts
  stream.getTracks().forEach(track => track.stop());
  ```
- **Transparent Status Badges:** The user must always see whether the camera or screen is actively transmitting (`Screen Sharing Active` in emerald, `Camera Active` in cyan).

---

## 5. Performance & Zero-Lag Rendering

- **Frame Sampling:** Never send every 60fps video frame to the AI vision model. Only sample on-demand when the user clicks "Analyze Screen", when an error occurs, or during active step progression.
- **Micro-Animations:** Use GPU-accelerated CSS properties (`transform`, `opacity`) instead of animating layout properties (`width`, `height`, `top`, `left`).
