"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface GlowBlob {
  rgb: string;
  x: number;
  y: number;
  ampX: number;
  ampY: number;
  freqX: number;
  freqY: number;
  phase: number;
  radius: number;
}

// Unit-square coordinates. The canvas is stretched onto the button, so each
// circle comes out as a wide ellipse that hugs it.
const BLOBS: GlowBlob[] = [
  {
    rgb: "34 184 240",
    x: 0.36,
    y: 0.5,
    ampX: 0.16,
    ampY: 0.2,
    freqX: 0.7,
    freqY: 1.1,
    phase: 0,
    radius: 0.62,
  },
  {
    rgb: "106 114 234",
    x: 0.64,
    y: 0.5,
    ampX: 0.16,
    ampY: 0.22,
    freqX: 0.55,
    freqY: 0.9,
    phase: 2.1,
    radius: 0.62,
  },
  {
    rgb: "242 92 200",
    x: 0.9,
    y: 0.5,
    ampX: 0.05,
    ampY: 0.32,
    freqX: 0.8,
    freqY: 1.2,
    phase: 4.2,
    radius: 0.34,
  },
  {
    rgb: "69 224 180",
    x: 0.1,
    y: 0.5,
    ampX: 0.05,
    ampY: 0.32,
    freqX: 0.75,
    freqY: 1.15,
    phase: 1.3,
    radius: 0.34,
  },
];

const WASH = "rgb(196 200 246 / 0.45)";

const blobCore = (blob: GlowBlob) => `rgb(${blob.rgb} / 0.95)`;

function blobAt(blob: GlowBlob, t: number) {
  return {
    x: blob.x + blob.ampX * Math.sin(blob.freqX * t + blob.phase),
    y: blob.y + blob.ampY * Math.sin(blob.freqY * t + blob.phase * 1.7),
  };
}

// A canvas-less browser (and jsdom) still gets the glow, frozen at t = 0.
function staticGlow() {
  const blobs = BLOBS.map((blob) => {
    const { x, y } = blobAt(blob, 0);
    return `radial-gradient(${blob.radius * 100}% ${blob.radius * 100}% at ${x * 100}% ${y * 100}%, ${blobCore(blob)}, transparent)`;
  });
  return [...blobs.reverse(), `linear-gradient(${WASH}, ${WASH})`].join(", ");
}

function startGlow(glow: HTMLCanvasElement, hover: HTMLCanvasElement) {
  const ctx = glow.getContext("2d");
  const hoverCtx = hover.getContext("2d");
  if (!ctx || !hoverCtx) {
    glow.style.background = hover.style.background = staticGlow();
    return () => {};
  }

  let t = 0;
  const paint = () => {
    const w = glow.width;
    const h = glow.height;
    ctx.setTransform(w, 0, 0, h, 0, 0);
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = WASH;
    ctx.fillRect(0, 0, 1, 1);
    for (const blob of BLOBS) {
      const { x, y } = blobAt(blob, t);
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, blob.radius);
      gradient.addColorStop(0, blobCore(blob));
      gradient.addColorStop(1, `rgb(${blob.rgb} / 0)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1, 1);
    }
    hoverCtx.setTransform(1, 0, 0, 1, 0, 0);
    hoverCtx.clearRect(0, 0, w, h);
    hoverCtx.drawImage(glow, 0, 0);
  };

  // Resizing a canvas wipes it, so every fit repaints.
  const fit = () => {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(glow.clientWidth * dpr);
    const h = Math.round(glow.clientHeight * dpr);
    for (const canvas of [glow, hover]) {
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
    }
    paint();
  };
  fit();
  const resize =
    typeof ResizeObserver === "undefined" ? null : new ResizeObserver(fit);
  resize?.observe(glow);

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => resize?.disconnect();
  }

  let raf = 0;
  let last: number | null = null;
  const frame = (now: number) => {
    // Capped so a long frame (or a resume) doesn't jump the blobs.
    if (last !== null) t += Math.min(now - last, 100) / 1000;
    last = now;
    paint();
    raf = requestAnimationFrame(frame);
  };
  const start = () => {
    if (raf) return;
    last = null;
    raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };
  const onVisibility = () => (document.hidden ? stop() : start());

  document.addEventListener("visibilitychange", onVisibility);
  onVisibility();
  return () => {
    stop();
    document.removeEventListener("visibilitychange", onVisibility);
    resize?.disconnect();
  };
}

export function BoostGlow({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const glowRef = useRef<HTMLCanvasElement>(null);
  const hoverRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!glowRef.current || !hoverRef.current) return;
    return startGlow(glowRef.current, hoverRef.current);
  }, []);

  return (
    <div className={cn("boost-glow relative isolate", className)}>
      <canvas ref={glowRef} aria-hidden='true' className='boost-glow-layer' />
      <canvas
        ref={hoverRef}
        aria-hidden='true'
        className='boost-glow-layer boost-glow-hover'
      />
      {children}
    </div>
  );
}
