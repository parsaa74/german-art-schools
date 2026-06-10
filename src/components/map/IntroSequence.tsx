'use client'

/**
 * IntroSequence — a minimal loading veil: no title, no copy, just a sketch of
 * an ethereal, breathing surface (2D-canvas contour lines undulating around a
 * slow breath, in the wall's mono-glass tone).
 *
 * Deliberately free of three.js / framer-motion so it paints near-instantly as
 * the lazy-loaded Scene's Suspense fallback. The animation clock is absolute
 * (performance.now), so the hand-off from App's fallback instance to Scene's
 * overlay instance is seamless — the surface keeps breathing mid-phrase.
 */

import { useEffect, useRef } from 'react';

interface IntroSequenceProps {
  /** true → fade the veil out (the scene underneath is ready) */
  leaving?: boolean;
  /** called once the fade-out has finished */
  onLeft?: () => void;
}

const LINES = 28;
const FADE_MS = 1100;

export function IntroSequence({ leaving = false, onLeft }: IntroSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let w = 0, h = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const t = performance.now() / 1000; // absolute → seamless across remounts
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      const span = Math.min(w * 0.62, 760);
      const breath = 0.62 + 0.38 * Math.sin(t * 0.55); // slow inhale … exhale
      const rise = Math.sin(t * 0.55) * 6;             // the sheet lifts on the inhale
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = 1;

      for (let i = 0; i < LINES; i++) {
        const v = i / (LINES - 1) - 0.5;          // -0.5 … 0.5 across the sheet
        const envelope = Math.exp(-v * v * 7);    // soft membrane edges
        const baseY = cy + v * Math.min(h * 0.34, 300);
        ctx.beginPath();
        const STEPS = 90;
        for (let k = 0; k <= STEPS; k++) {
          const u = k / STEPS;
          const x = cx - span / 2 + u * span;
          const edge = Math.sin(u * Math.PI);     // pinch the line ends to points
          const ripple =
            Math.sin(u * 5.1 + t * 0.9 + i * 0.35) * 7 +
            Math.sin(u * 11.7 - t * 0.6 + i * 0.18) * 3.5;
          const y = baseY + ripple * envelope * edge * breath - rise * envelope;
          if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        const alpha = (0.05 + 0.1 * envelope) * (0.75 + 0.25 * breath);
        ctx.strokeStyle = `rgba(168, 194, 224, ${alpha})`; // the wall's mono-glass tone
        ctx.stroke();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    if (!leaving || !onLeft) return;
    const t = setTimeout(onLeft, FADE_MS);
    return () => clearTimeout(t);
  }, [leaving, onLeft]);

  return (
    <div
      className="fixed inset-0 z-20"
      style={{
        background: '#04060c',
        opacity: leaving ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease-in-out`,
        pointerEvents: leaving ? 'none' : 'auto',
      }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
