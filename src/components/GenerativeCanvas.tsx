import { useEffect, useRef, useState } from 'react';
import { SPIRAL_PHRASES } from './spiralGeometry';
import { bakeSpiralLayers, spiralCacheKey, type SpiralBakeResult } from './spiralLayers';
import { SpiralGpuRenderer } from './SpiralGpuRenderer';
import { initialSettings, RIPPLE_STRENGTH_GAIN, ROTATION_SPEED, type CanvasSettings } from './canvasSettings';

export type { CanvasSettings };
export { initialSettings };

type Props = {
  theme: 'light' | 'dark';
  settings: CanvasSettings;
  phrases?: readonly string[];
  /**
   * V22.9.9 — sidebar nav variants subtract outer rings from the responsive
   * count (clipped, not redistributed). Top nav keeps 0.
   */
  ringCountSubtract?: number;
};

type Wave = { x: number; y: number; age: number; amp: number };
const EMPTY_WAVE: Wave = { x: 0, y: 0, age: 0, amp: 0 };

/** Pressure reaches ~1 in ~0.7s from the initial 0.15 kick. */
const PRESSURE_RATE = 1.2;
/** Shader damps by age; retire the wave slot after the visual train fades. */
const WAVE_MAX_AGE = 3.2;

/** Composite baked layers once — used for the static no-WebGL fallback. */
function paintStaticSpiral(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  baked: SpiralBakeResult,
) {
  ctx.clearRect(0, 0, width, height);
  const { layers, layerSize, centerX, centerY } = baked;
  for (let i = 0; i < layers.length; i++) {
    ctx.save();
    ctx.translate(centerX, centerY);
    // Match GPU idle phase ≈ 0 with fixed layer rotation offsets unused at rest.
    ctx.drawImage(layers[i], -layerSize / 2, -layerSize / 2);
    ctx.restore();
  }
}

/**
 * Primary spiral surface: WebGL/OGL compositor with GLSL ripples.
 * If WebGL is unavailable or the context is lost, a static Canvas 2D bake is shown
 * (no CPU RippleRaster, no animation engine).
 */
export default function GenerativeCanvas({
  theme,
  settings,
  phrases = SPIRAL_PHRASES,
  ringCountSubtract = 0,
}: Props) {
  const [mode, setMode] = useState<'gpu' | 'static'>('gpu');
  const ref = useRef<HTMLCanvasElement>(null);
  const current = useRef({ theme, settings, phrases, ringCountSubtract });
  const refresh = useRef<(() => void) | null>(null);

  useEffect(() => {
    current.current = { theme, settings, phrases, ringCountSubtract };
    refresh.current?.();
  }, [theme, settings, phrases, ringCountSubtract]);

  useEffect(() => {
    const canvas = ref.current!;
    let disposed = false;

    // --- Static fallback path (no WebGL) ---------------------------------
    if (mode === 'static') {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let width = 0, height = 0, mobile = false;
      let cacheKey = '';

      const prepare = () => {
        const { theme, settings, phrases, ringCountSubtract } = current.current;
        const viewportWidth = window.innerWidth;
        const key = spiralCacheKey(
          width,
          height,
          viewportWidth,
          theme,
          settings,
          phrases,
          ringCountSubtract,
        );
        if (!width || !height || key === cacheKey) return;
        cacheKey = key;
        const baked = bakeSpiralLayers({
          width,
          height,
          viewportWidth,
          mobile,
          theme,
          settings,
          phrases,
          ringCountSubtract,
        });
        paintStaticSpiral(ctx, width, height, baked);
      };

      refresh.current = () => { if (!document.hidden) prepare(); };

      const onVisible = () => { if (!document.hidden) prepare(); };

      const resize = new ResizeObserver(([entry]) => {
        width = Math.round(entry.contentRect.width);
        height = Math.round(entry.contentRect.height);
        mobile = matchMedia('(max-width: 760px)').matches;
        canvas.width = width;
        canvas.height = height;
        cacheKey = '';
        prepare();
      });

      const onViewportResize = () => {
        if (!width || !height || document.hidden) return;
        prepare();
      };

      resize.observe(canvas);
      window.addEventListener('resize', onViewportResize);
      document.addEventListener('visibilitychange', onVisible);

      return () => {
        refresh.current = null;
        resize.disconnect();
        window.removeEventListener('resize', onViewportResize);
        document.removeEventListener('visibilitychange', onVisible);
      };
    }

    // --- GPU path --------------------------------------------------------
    const gpu = SpiralGpuRenderer.tryCreate(canvas);
    if (!gpu) {
      setMode('static');
      return;
    }

    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0, height = 0, mobile = false;
    let frame = 0, last = 0, nextPaint = 0, phase = 0;
    let cacheKey = '';
    let held = false, pointerId: number | null = null;
    let pressure = 0;
    let pointerX = 0, pointerY = 0;
    let wave0: Wave = { ...EMPTY_WAVE };
    let wave1: Wave = { ...EMPTY_WAVE };

    const mapPointer = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      if (!box.width || !box.height) return;
      pointerX = (event.clientX - box.left) * width / box.width;
      pointerY = (event.clientY - box.top) * height / box.height;
    };

    const prepare = () => {
      const { theme, settings, phrases, ringCountSubtract } = current.current;
      const viewportWidth = window.innerWidth;
      const key = spiralCacheKey(
        width,
        height,
        viewportWidth,
        theme,
        settings,
        phrases,
        ringCountSubtract,
      );
      if (!width || !height || key === cacheKey) return;
      cacheKey = key;
      const baked = bakeSpiralLayers({
        width,
        height,
        viewportWidth,
        mobile,
        theme,
        settings,
        phrases,
        ringCountSubtract,
      });
      gpu.setLayers(baked);
    };

    const draw = () => {
      gpu.render({
        phase,
        pointerX,
        pointerY,
        pressure,
        held,
        wave0,
        wave1,
        rippleGain: RIPPLE_STRENGTH_GAIN[current.current.settings.rippleStrength],
      });
    };

    const tick = (now: number) => {
      const fps = mobile ? 30 : 60;
      const interval = 1000 / fps;
      if (now >= nextPaint) {
        const delta = last ? Math.min(now - last, 100) / 1000 : 0;
        last = now;
        nextPaint += interval;
        if (nextPaint <= now) nextPaint = now + interval;
        phase += delta * ROTATION_SPEED[current.current.settings.speed];
        if (held) pressure = Math.min(1, pressure + delta * PRESSURE_RATE);
        if (wave0.amp > 0) {
          wave0 = { ...wave0, age: wave0.age + delta };
          if (wave0.age >= WAVE_MAX_AGE) wave0 = { ...EMPTY_WAVE };
        }
        if (wave1.amp > 0) {
          wave1 = { ...wave1, age: wave1.age + delta };
          if (wave1.age >= WAVE_MAX_AGE) wave1 = { ...EMPTY_WAVE };
        }
        draw();
      }
      frame = requestAnimationFrame(tick);
    };

    const clearGesture = () => {
      held = false;
      pressure = 0;
      wave0 = { ...EMPTY_WAVE };
      wave1 = { ...EMPTY_WAVE };
      if (pointerId !== null && canvas.hasPointerCapture(pointerId)) {
        try { canvas.releasePointerCapture(pointerId); } catch { /* already cleared */ }
      }
      pointerId = null;
    };

    const start = () => {
      cancelAnimationFrame(frame);
      last = nextPaint = 0;
      if (document.hidden || reduced.matches) clearGesture();
      if (document.hidden) return;
      prepare();
      draw();
      if (!reduced.matches) frame = requestAnimationFrame(tick);
    };

    refresh.current = () => { if (!document.hidden) { prepare(); draw(); } };

    const resize = new ResizeObserver(([entry]) => {
      width = Math.round(entry.contentRect.width);
      height = Math.round(entry.contentRect.height);
      mobile = matchMedia('(max-width: 760px)').matches;
      gpu.setSize(width, height);
      cacheKey = '';
      start();
    });

    const down = (event: PointerEvent) => {
      if (reduced.matches || event.button !== 0 || pointerId !== null) return;
      mapPointer(event);
      if (wave0.amp > 0.001) wave1 = { ...wave0 };
      wave0 = { ...EMPTY_WAVE };
      pointerId = event.pointerId;
      held = true;
      pressure = 0.15;
      try { canvas.setPointerCapture(event.pointerId); } catch { /* synthetic pointers */ }
    };

    const move = (event: PointerEvent) => {
      if (event.pointerId !== pointerId || !held) return;
      mapPointer(event);
    };

    const release = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      mapPointer(event);
      held = false;
      wave0 = { x: pointerX, y: pointerY, age: 0, amp: Math.max(0.2, pressure) };
      pressure = 0;
      pointerId = null;
      try {
        if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      } catch { /* already cleared */ }
    };

    const cancel = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      if (pressure > 0.2) {
        held = false;
        wave0 = { x: pointerX, y: pointerY, age: 0, amp: pressure * 0.7 };
        pressure = 0;
      } else {
        held = false;
        pressure = 0;
      }
      pointerId = null;
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(frame);
      gpu.dispose();
      if (!disposed) setMode('static');
    };

    const onViewportResize = () => {
      if (!width || !height || document.hidden) return;
      prepare();
      draw();
    };

    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', cancel);
    canvas.addEventListener('lostpointercapture', cancel);
    canvas.addEventListener('webglcontextlost', onContextLost);
    resize.observe(canvas);
    window.addEventListener('resize', onViewportResize);
    document.addEventListener('visibilitychange', start);
    reduced.addEventListener('change', start);

    return () => {
      disposed = true;
      refresh.current = null;
      cancelAnimationFrame(frame);
      resize.disconnect();
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', release);
      canvas.removeEventListener('pointercancel', cancel);
      canvas.removeEventListener('lostpointercapture', cancel);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      window.removeEventListener('resize', onViewportResize);
      document.removeEventListener('visibilitychange', start);
      reduced.removeEventListener('change', start);
      gpu.dispose();
    };
  }, [mode]);

  return (
    <canvas
      ref={ref}
      className="generative-canvas"
      aria-hidden="true"
      data-renderer={mode}
    />
  );
}
