import React, { useEffect, useRef, useState, useMemo } from 'react';
import { AIMood } from '../types';

export type HaiderVoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

export interface NeuralOrbProps {
  size: number;
  state?: HaiderVoiceState;
  mood?: AIMood;
  audioLevel?: number; // 0 to 100
  onClick?: () => void;
  className?: string;
}

const NeuralOrb: React.FC<NeuralOrbProps> = ({
  size,
  state: explicitState,
  mood = 'idle',
  audioLevel = 0,
  onClick,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Derive active voice state from explicit state or mood
  const activeState: HaiderVoiceState = useMemo(() => {
    if (explicitState) return explicitState;
    switch (mood) {
      case 'talking':
        return 'speaking';
      case 'thinking':
        return 'thinking';
      case 'surprise':
      case 'sad':
        return 'error';
      case 'happy':
        return 'listening';
      case 'idle':
      default:
        return 'idle';
    }
  }, [explicitState, mood]);

  // Smooth interpolated state tracking for water animation
  const stateWeightRef = useRef<{
    idle: number;
    listening: number;
    thinking: number;
    speaking: number;
    error: number;
    audio: number;
  }>({
    idle: 1,
    listening: 0,
    thinking: 0,
    speaking: 0,
    error: 0,
    audio: 0
  });

  // Natural eye blink state with randomized interval
  const [blinkProgress, setBlinkProgress] = useState(0); // 0 = open, 1 = fully closed
  const blinkTimerRef = useRef<number | null>(null);
  const isBlinkingRef = useRef(false);

  // Check reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Natural non-robotic blinking system
  useEffect(() => {
    if (prefersReducedMotion) return;

    let mounted = true;

    const scheduleNextBlink = () => {
      // Human-like natural distribution between 3.2s and 6.8s
      const delay = Math.random() * 3600 + 3200;
      blinkTimerRef.current = window.setTimeout(() => {
        if (!mounted) return;
        isBlinkingRef.current = true;
        const startTime = performance.now();
        const duration = 160; // 160ms total blink

        const animateBlink = (now: number) => {
          const elapsed = now - startTime;
          const t = Math.min(1, elapsed / duration);
          // Eyelid closes fast (0 to 0.4), stays closed briefly (0.4 to 0.5), opens smoothly (0.5 to 1)
          let progress = 0;
          if (t < 0.4) {
            progress = t / 0.4;
          } else if (t < 0.55) {
            progress = 1;
          } else {
            progress = 1 - (t - 0.55) / 0.45;
          }

          if (mounted) {
            setBlinkProgress(progress);
          }

          if (t < 1 && mounted) {
            requestAnimationFrame(animateBlink);
          } else if (mounted) {
            setBlinkProgress(0);
            isBlinkingRef.current = false;
            scheduleNextBlink();
          }
        };

        requestAnimationFrame(animateBlink);
      }, delay);
    };

    scheduleNextBlink();

    return () => {
      mounted = false;
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current);
    };
  }, [prefersReducedMotion]);

  // Canvas Water & Moonlit Light Flow Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const render = () => {
      time += 0.015;

      const target = stateWeightRef.current;
      // Smooth interpolation toward target state weights
      const lerp = (cur: number, tgt: number, factor: number) => cur + (tgt - cur) * factor;
      const speed = 0.08;

      target.idle = lerp(target.idle, activeState === 'idle' ? 1 : 0, speed);
      target.listening = lerp(target.listening, activeState === 'listening' ? 1 : 0, speed);
      target.thinking = lerp(target.thinking, activeState === 'thinking' ? 1 : 0, speed);
      target.speaking = lerp(target.speaking, activeState === 'speaking' ? 1 : 0, speed);
      target.error = lerp(target.error, activeState === 'error' ? 1 : 0, speed);
      target.audio = lerp(target.audio, audioLevel / 100, 0.15);

      const w = size;
      const h = size;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const radius = (w * 0.43);

      // Only draw inside the circular orb boundaries
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      // BASE LAYER: Pure solid white with hyper-subtle 3D spherical shading
      const sphereBase = ctx.createRadialGradient(
        cx - radius * 0.28,
        cy - radius * 0.32,
        radius * 0.05,
        cx,
        cy,
        radius
      );
      // Pristine porcelain white with ultra-soft ambient occlusion rim
      sphereBase.addColorStop(0, '#FFFFFF');
      sphereBase.addColorStop(0.65, '#FFFFFF');
      sphereBase.addColorStop(0.88, '#F8FAFD');
      sphereBase.addColorStop(1, '#EDF2F9');

      ctx.fillStyle = sphereBase;
      ctx.fill();

      // WATER-LIKE FLUID ANIMATION LAYER (Soft moon-like cool luminous water)
      const waterWeight = target.listening * 0.9 + target.speaking * 1.0 + target.thinking * 0.75 + target.error * 0.8;
      
      if (waterWeight > 0.01 && !prefersReducedMotion) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-atop';

        const baseWaterY = cy + radius * 0.15 - (target.speaking * 18 + target.audio * 25);
        const waveAmp = (radius * 0.1) * (1 + target.audio * 0.8);
        const waveFreq = 0.018;

        // Wave 1: Gentle moon-silver fluid wave
        ctx.beginPath();
        ctx.moveTo(cx - radius, h);
        for (let x = cx - radius; x <= cx + radius; x += 3) {
          const relX = x - cx;
          const y = baseWaterY + 
            Math.sin(relX * waveFreq + time * 1.4) * (waveAmp * 0.9) +
            Math.cos(relX * 0.012 - time * 0.8) * (waveAmp * 0.45);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(cx + radius, h);
        ctx.closePath();

        const gradWave1 = ctx.createLinearGradient(0, cy - radius * 0.3, 0, cy + radius);
        if (activeState === 'error') {
          gradWave1.addColorStop(0, `rgba(254, 215, 170, ${0.45 * waterWeight})`);
          gradWave1.addColorStop(1, `rgba(251, 146, 60, ${0.25 * waterWeight})`);
        } else {
          // Soft silver & subtle icy blue
          gradWave1.addColorStop(0, `rgba(224, 242, 254, ${0.48 * waterWeight})`);
          gradWave1.addColorStop(0.5, `rgba(186, 230, 253, ${0.32 * waterWeight})`);
          gradWave1.addColorStop(1, `rgba(224, 242, 254, ${0.12 * waterWeight})`);
        }
        ctx.fillStyle = gradWave1;
        ctx.fill();

        // Wave 2: Sub-surface cool cyan caustic ripple
        ctx.beginPath();
        ctx.moveTo(cx - radius, h);
        for (let x = cx - radius; x <= cx + radius; x += 3) {
          const relX = x - cx;
          const y = (baseWaterY + 12) + 
            Math.sin(relX * (waveFreq * 1.3) - time * 1.8) * (waveAmp * 0.7) +
            Math.cos(relX * 0.02 + time * 1.1) * (waveAmp * 0.35);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(cx + radius, h);
        ctx.closePath();

        const gradWave2 = ctx.createLinearGradient(0, cy, 0, cy + radius);
        gradWave2.addColorStop(0, `rgba(0, 229, 255, ${0.22 * waterWeight})`);
        gradWave2.addColorStop(1, `rgba(147, 197, 253, ${0.15 * waterWeight})`);
        ctx.fillStyle = gradWave2;
        ctx.fill();

        // Thinking state orbital moon shimmer
        if (target.thinking > 0.05) {
          const orbitAngle = time * 1.6;
          const orbitRadius = radius * 0.72;
          const ox = cx + Math.cos(orbitAngle) * orbitRadius;
          const oy = cy + Math.sin(orbitAngle) * orbitRadius;

          const orbitShimmer = ctx.createRadialGradient(ox, oy, 2, ox, oy, radius * 0.45);
          orbitShimmer.addColorStop(0, `rgba(186, 230, 253, ${0.4 * target.thinking})`);
          orbitShimmer.addColorStop(0.6, `rgba(224, 242, 254, ${0.15 * target.thinking})`);
          orbitShimmer.addColorStop(1, 'rgba(255, 255, 255, 0)');

          ctx.fillStyle = orbitShimmer;
          ctx.beginPath();
          ctx.arc(ox, oy, radius * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // Specular highlight: Soft luxury glass / milky pearl top-left gloss
      const specHighlight = ctx.createRadialGradient(
        cx - radius * 0.35,
        cy - radius * 0.38,
        0,
        cx - radius * 0.35,
        cy - radius * 0.38,
        radius * 0.65
      );
      specHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      specHighlight.addColorStop(0.3, 'rgba(255, 255, 255, 0.4)');
      specHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = specHighlight;
      ctx.fill();

      // Delicate perimeter rim light
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.stroke();

      ctx.restore();

      if (!prefersReducedMotion) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [size, activeState, audioLevel, prefersReducedMotion]);

  // Derived Outer Halo Glow Style based on real state
  const haloShadowStyle = useMemo(() => {
    const audioScale = Math.min(35, audioLevel * 0.35);

    switch (activeState) {
      case 'listening':
        return {
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.4), 
                      0 0 ${45 + audioScale}px rgba(186, 230, 253, 0.45), 
                      0 0 ${90 + audioScale * 1.5}px rgba(224, 242, 254, 0.22),
                      inset 0 2px 4px rgba(255, 255, 255, 1),
                      inset 0 -6px 16px rgba(210, 228, 248, 0.35)`
        };
      case 'thinking':
        return {
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.4), 
                      0 0 50px rgba(224, 242, 254, 0.4), 
                      0 0 100px rgba(199, 210, 254, 0.2),
                      inset 0 2px 4px rgba(255, 255, 255, 1),
                      inset 0 -6px 16px rgba(210, 228, 248, 0.35)`
        };
      case 'speaking':
        return {
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.4), 
                      0 0 ${55 + audioScale * 1.2}px rgba(0, 229, 255, 0.5), 
                      0 0 ${110 + audioScale * 2}px rgba(186, 230, 253, 0.3),
                      inset 0 2px 4px rgba(255, 255, 255, 1),
                      inset 0 -6px 16px rgba(200, 225, 248, 0.4)`
        };
      case 'error':
        return {
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.4), 
                      0 0 45px rgba(251, 146, 60, 0.35), 
                      0 0 90px rgba(254, 215, 170, 0.2),
                      inset 0 2px 4px rgba(255, 255, 255, 1),
                      inset 0 -6px 16px rgba(240, 210, 210, 0.35)`
        };
      case 'idle':
      default:
        return {
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.45), 
                      0 0 35px rgba(255, 255, 255, 0.2), 
                      0 0 70px rgba(240, 248, 255, 0.1),
                      inset 0 2px 4px rgba(255, 255, 255, 1),
                      inset 0 -6px 16px rgba(215, 228, 242, 0.3)`
        };
    }
  }, [activeState, audioLevel]);

  // Scaled eye dimensions based on size prop
  const eyeWidth = Math.round(size * 0.082);
  const eyeHeight = Math.round(size * 0.098);
  const eyeGap = Math.round(size * 0.17);

  // Eye micro-movement per state
  const eyeStateTransform = useMemo(() => {
    // Height compression during blink
    const blinkScaleY = Math.max(0.06, 1 - blinkProgress);

    switch (activeState) {
      case 'listening':
        // Attentive, slightly taller and focused
        return `scale(1.05, ${1.08 * blinkScaleY}) translateY(-1px)`;
      case 'thinking':
        // Focused squint / micro-calculation
        return `scale(0.96, ${0.92 * blinkScaleY}) translateY(0px)`;
      case 'speaking':
        // Lively audio reactive cadence
        const speechKick = 1 + (audioLevel / 100) * 0.12;
        return `scale(${speechKick}, ${speechKick * blinkScaleY})`;
      case 'error':
        return `scale(1.02, ${0.85 * blinkScaleY})`;
      case 'idle':
      default:
        return `scale(1, ${1 * blinkScaleY})`;
    }
  }, [activeState, blinkProgress, audioLevel]);

  // Mouth animation logic
  const mouthState = useMemo(() => {
    if (activeState === 'speaking') {
      const openHeight = Math.max(4, Math.min(14, 4 + (audioLevel / 100) * 10));
      return {
        width: Math.round(size * 0.11),
        height: openHeight,
        borderRadius: '9999px',
        opacity: 0.9,
        background: '#0B1320'
      };
    }
    if (mood === 'happy' || activeState === 'listening') {
      return {
        width: Math.round(size * 0.12),
        height: 6,
        borderBottom: '3px solid #0B1320',
        borderRadius: '0 0 20px 20px',
        opacity: 0.85,
        background: 'transparent'
      };
    }
    // Subtle peaceful line in idle
    return {
      width: Math.round(size * 0.08),
      height: 2.5,
      borderRadius: '2px',
      opacity: 0.5,
      background: '#0B1320'
    };
  }, [activeState, audioLevel, mood, size]);

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{
        width: size,
        height: size,
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      {/* Outer Ambient Moon Halo (Fluid breathing glow) */}
      <div
        className="absolute rounded-full pointer-events-none transition-all duration-700 ease-out"
        style={{
          width: size * 0.86,
          height: size * 0.86,
          ...haloShadowStyle
        }}
      />

      {/* Outer Orbital Orbit Ring (Minimalist high-precision guide) */}
      <div 
        className="absolute rounded-full border border-white/[0.04] pointer-events-none"
        style={{
          width: size * 1.08,
          height: size * 1.08,
          animation: prefersReducedMotion ? 'none' : 'spin 70s linear infinite'
        }}
      />
      <div 
        className="absolute rounded-full border border-dashed border-[#00E5FF]/[0.08] pointer-events-none hidden sm:block"
        style={{
          width: size * 1.22,
          height: size * 1.22,
          animation: prefersReducedMotion ? 'none' : 'spin 90s linear infinite reverse'
        }}
      />

      {/* THE PURE SOLID WHITE ORB CONTAINER */}
      <div
        className="relative rounded-full overflow-hidden flex items-center justify-center transition-transform duration-500 ease-out"
        style={{
          width: size * 0.86,
          height: size * 0.86,
          backgroundColor: '#FFFFFF',
          transform: prefersReducedMotion ? 'none' : 
            activeState === 'speaking' 
              ? `scale(${1 + (audioLevel / 100) * 0.035})` 
              : activeState === 'listening'
              ? 'scale(1.015)'
              : 'scale(1)',
          transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Canvas Render for Moonlit Water-Like Waves */}
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* HAIDER'S ICONIC TWO EYES & EXPRESSIVE FACE */}
        <div 
          className="relative z-20 flex flex-col items-center justify-center pointer-events-none"
          style={{ transform: 'translateY(-4%)' }}
        >
          {/* Eyes Pair */}
          <div 
            className="flex items-center justify-center"
            style={{ gap: eyeGap }}
          >
            {/* Left Eye */}
            <div
              className="relative rounded-full transition-transform duration-150 ease-out flex items-center justify-center overflow-hidden"
              style={{
                width: eyeWidth,
                height: eyeHeight,
                backgroundColor: '#0B1320',
                transform: eyeStateTransform,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)'
              }}
            >
              {/* Inner Moonlit Iris Specular Highlight */}
              <div 
                className="absolute rounded-full bg-white transition-opacity duration-300"
                style={{
                  width: Math.max(3, eyeWidth * 0.34),
                  height: Math.max(3, eyeHeight * 0.34),
                  top: '18%',
                  left: '20%',
                  opacity: 0.95
                }}
              />
              {/* Subtle Cool Cyan Pupil Glow */}
              <div
                className="absolute rounded-full transition-all duration-300"
                style={{
                  width: eyeWidth * 0.45,
                  height: eyeHeight * 0.45,
                  bottom: '15%',
                  right: '18%',
                  backgroundColor: '#00E5FF',
                  opacity: activeState === 'listening' || activeState === 'speaking' ? 0.8 : 0.35,
                  filter: 'blur(1px)'
                }}
              />
            </div>

            {/* Right Eye */}
            <div
              className="relative rounded-full transition-transform duration-150 ease-out flex items-center justify-center overflow-hidden"
              style={{
                width: eyeWidth,
                height: eyeHeight,
                backgroundColor: '#0B1320',
                transform: eyeStateTransform,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)'
              }}
            >
              {/* Inner Moonlit Iris Specular Highlight */}
              <div 
                className="absolute rounded-full bg-white transition-opacity duration-300"
                style={{
                  width: Math.max(3, eyeWidth * 0.34),
                  height: Math.max(3, eyeHeight * 0.34),
                  top: '18%',
                  left: '20%',
                  opacity: 0.95
                }}
              />
              {/* Subtle Cool Cyan Pupil Glow */}
              <div
                className="absolute rounded-full transition-all duration-300"
                style={{
                  width: eyeWidth * 0.45,
                  height: eyeHeight * 0.45,
                  bottom: '15%',
                  right: '18%',
                  backgroundColor: '#00E5FF',
                  opacity: activeState === 'listening' || activeState === 'speaking' ? 0.8 : 0.35,
                  filter: 'blur(1px)'
                }}
              />
            </div>
          </div>

          {/* Minimalist Friendly Mouth (Subtle & Expressive, not cartoonish) */}
          <div 
            className="mt-3.5 transition-all duration-200 ease-out"
            style={{
              ...mouthState,
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
        </div>

        {/* Soft Front Gloss Arc */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 35% 25%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 60%)'
          }}
        />
      </div>
    </div>
  );
};

export default NeuralOrb;
