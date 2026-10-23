# DESIGN.md — Design System & UI/UX Constitution

> **Aesthetic Philosophy:** Dark Glassmorphism • Futuristic Neural Cockpit • Cybernetic Cleanliness  
> **Target Theme:** Iron Man / JARVIS HUD meets Next-Gen Desktop Operating System  

---

## 1. Brand Identity & Visual Direction

Hyder OS embodies authority, intelligence, and immediate responsiveness. The interface gives the user the sensation of piloting an advanced executive AI computer system:
- **Atmospheric Depth:** Multi-layered translucent panels over deep cosmos navy backgrounds.
- **Precision Reticles:** Technical corner accents, subtle dotted grid coordinates, and pulsing synaptic orbs.
- **Zero AI Slop:** No generic chatbot bubbles or unnecessary empty white cards. Every pixel serves a diagnostic, navigational, or execution purpose.

---

## 2. Color Palette & Functional Tokens

| Token Name | Hex / RGBA Value | Semantic Usage |
|---|---|---|
| **Cosmos Background** | `#050B18` | Base application canvas background. |
| **Glass Panel Base** | `rgba(255, 255, 255, 0.02)` | Default card background with `backdrop-blur-xl`. |
| **Glass Panel Hover** | `rgba(255, 255, 255, 0.05)` | Interactive card hover state. |
| **Glass Border Subdued** | `rgba(255, 255, 255, 0.08)` | Standard panel outline border. |
| **Glass Border Active** | `rgba(0, 229, 255, 0.40)` | Focused input or active element border. |
| **Cyan Accent (Primary)** | `#00E5FF` | Core actions, HUD orb, active tabs, telemetry highlights. |
| **Emerald Accent (Success)** | `#2ED8C3` / `#10B981` | Online status, healthy watchdog, completed tasks. |
| **Amber Accent (Warning)** | `#FACC15` / `#FFAB40` | Medium-priority tasks, active step markers, review alerts. |
| **Rose Accent (Danger/High)** | `#F43F5E` / `#EF4444` | High-priority directives, emergency stop, offline bridge. |
| **Purple Accent (Studio)** | `#A855F7` | Visual synthesis studio (ImageForge) and creative suites. |
| **Text Primary** | `#FFFFFF` / `#EAFBFF` | High-contrast headings and readable body text. |
| **Text Muted** | `rgba(255, 255, 255, 0.50)` | Secondary labels, descriptions, and timestamps. |

---

## 3. Typography System

The typography uses three distinct font families for specific visual duties:
1. **Headings & Tactical Labels:** `font-orbitron` (Orbitron)
   - Heavy weights (`font-black`, `font-bold`), uppercase, wide letter spacing (`tracking-[0.15em]` to `tracking-[0.3em]`).
2. **Telemetry, Terminal & Code Snippets:** `font-mono` (JetBrains Mono / monospace)
   - For file paths, PowerShell commands, coordinate percentages, and timestamps.
3. **Conversational & Explanatory Text:** `font-sans` (Inter / system-ui)
   - Clean, neutral, high-legibility font for guidance steps and descriptions.

### Fluid Typography Scale (Zero Layout Overflow)
```css
/* Micro Tag / Coordinate */ text-[clamp(7px, 0.5vw, 9px)]
/* Badge / Filter Chip */    text-[clamp(8px, 0.55vw, 10px)]
/* Directive Label */        text-[clamp(9.5px, 0.7vw, 12px)]
/* Panel Subheading */       text-[clamp(11px, 0.8vw, 14px)]
/* Modal / Section Title */  text-[clamp(15px, 1.2vw, 20px)]
/* Hero Display */           text-[clamp(24px, 2.5vw, 42px)]
```

---

## 4. UI Component Architecture

### 4.1 Glass Cards & Panels
- **Standard Card:** `rounded-[22px] sm:rounded-[30px] bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-2xl`
- **Interactive Hover:** `hover:bg-white/[0.05] hover:border-white/20 transition-all duration-300 hover:scale-[1.01]`

### 4.2 Buttons
- **Primary Cyber Button:** `bg-[#00E5FF] hover:bg-white text-[#0A1A2F] font-orbitron font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(0,229,255,0.35)] active:scale-95`
- **Secondary Ghost Button:** `bg-white/5 hover:bg-white/10 text-white border border-white/10 font-orbitron font-bold rounded-xl transition-all`
- **Destructive / Emergency Button:** `bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl transition-all`

### 4.3 Visual SVG Annotations & Reticles
- **Directional Arrow:** Dashed cyan/yellow vector line with dynamic SVG arrowhead pointing directly to target coordinates `(x, y)`.
- **Target Reticle Box:** Rounded rectangle with 4 corner accent pins and semi-transparent color fill framing the target element.
- **Numbered Step Badge:** High-contrast circular pin with `#1`, `#2` bouncing on the active step.

### 4.4 Floating Dock Navigation
- Positioned centrally at `bottom-12 sm:bottom-16 left-1/2 -translate-x-1/2`.
- Translucent rounded pill with blur (`backdrop-blur-3xl bg-white/5 border border-white/5`).
- Active pill highlighted in glowing cyan with a bottom indicator dot.

---

## 5. Micro-Interactions & Animation Standards

- **State Transitions:** Fast cubic bezier easing (`transition-all duration-300`).
- **Orb Breathing:** Radial sine-wave fluctuation simulating live AI cognition.
- **Pulsing Status Dots:** `animate-ping` and `animate-pulse` for live network uplinks.
- **Drag & Drop Feedback:**
  - Dragged item: `opacity-40 scale-95 border-dashed border-[#00E5FF]`
  - Drag over target: `border-[#00E5FF] bg-[#00E5FF]/10 scale-[1.01]`
