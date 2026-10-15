import { Renderer, Program, Mesh, Triangle, Texture } from 'ogl';
import { LAYER_ROTATION_FACTORS } from './spiralLayers';

const vertex = /* glsl */ `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

/**
 * Full-screen composite of three spiral layer textures.
 * Displacement is applied once in screen space before sampling all layers,
 * so the ripple propagates through one continuous typographic surface.
 */
const fragment = /* glsl */ `
precision highp float;

uniform vec2 uResolution;
uniform vec2 uCenter;
uniform float uLayerSize;
uniform float uPhase;
uniform sampler2D uLayer0;
uniform sampler2D uLayer1;
uniform sampler2D uLayer2;
uniform float uRot0;
uniform float uRot1;
uniform float uRot2;

uniform vec2 uPointer;
uniform float uPressure;
uniform float uHeld;
uniform vec2 uWave0Origin;
uniform float uWave0Age;
uniform float uWave0Amp;
uniform vec2 uWave1Origin;
uniform float uWave1Age;
uniform float uWave1Amp;
uniform float uRippleGain;

varying vec2 vUv;

float unitMin() {
  return min(uResolution.x, uResolution.y);
}

/** Aspect-correct radius in units of the shorter canvas side. */
float radiusAt(vec2 screen, vec2 origin) {
  return length(screen - origin) / unitMin();
}

vec2 directionAt(vec2 screen, vec2 origin) {
  vec2 delta = screen - origin;
  float len = length(delta);
  return len > 1e-4 ? delta / len : vec2(0.0);
}

/**
 * Soft press dent. Negative contribution → radial sample scale > 1.
 * V9 baseline is ~45% of the Phase-2 peak; uRippleGain restores Original.
 */
float pressDent(float r, float pressure) {
  float reach = 0.30;
  float fall = exp(-r * r / (reach * reach * 0.28));
  return -pressure * 0.095 * fall;
}

/**
 * Expanding multi-frequency wave train (dimensionless height).
 * Gradient of this height drives typography UV offsets.
 */
float waveHeight(float r, float age, float amp) {
  if (amp <= 0.001) return 0.0;
  float travel = age * 0.48;
  float life = exp(-age * 0.95) * amp;
  float front = exp(-pow((r - travel) / 0.07, 2.0));
  float front2 = exp(-pow((r - travel * 0.78) / 0.09, 2.0));
  float front3 = exp(-pow((r - travel * 0.52) / 0.13, 2.0));
  float osc =
    sin((r - travel) * 48.0) * front +
    sin((r - travel * 0.78) * 34.0) * front2 * 0.55 +
    sin((r - travel * 0.52) * 22.0) * front3 * 0.32;
  float spatial = exp(-r * 0.75);
  return osc * life * spatial * 0.027;
}

vec2 displace(vec2 screen) {
  if (uRippleGain <= 0.0) return screen;

  vec2 outPos = screen;
  float unit = unitMin();

  // Active press: radial warp around the live pointer (single shared surface).
  if (uHeld > 0.5 && uPressure > 0.001) {
    float r = radiusAt(screen, uPointer);
    float dent = pressDent(r, uPressure) * uRippleGain;
    float radialScale = 1.0 / (1.0 + dent);
    outPos = uPointer + (outPos - uPointer) * radialScale;
  }

  // Released waves: gradient-based offsets so letterforms bend with the wavefront.
  if (uWave0Amp > 0.001) {
    float r = radiusAt(outPos, uWave0Origin);
    float h = waveHeight(r, uWave0Age, uWave0Amp) * uRippleGain;
    float h2 = waveHeight(r + 0.0035, uWave0Age, uWave0Amp) * uRippleGain;
    float grad = (h2 - h) / 0.0035;
    outPos += directionAt(outPos, uWave0Origin) * grad * unit;
  }
  if (uWave1Amp > 0.001) {
    float r = radiusAt(outPos, uWave1Origin);
    float h = waveHeight(r, uWave1Age, uWave1Amp) * uRippleGain;
    float h2 = waveHeight(r + 0.0035, uWave1Age, uWave1Amp) * uRippleGain;
    float grad = (h2 - h) / 0.0035;
    outPos += directionAt(outPos, uWave1Origin) * grad * unit;
  }

  return outPos;
}

vec4 sampleLayer(sampler2D map, vec2 screen, float rotFactor) {
  float angle = uPhase * rotFactor;
  float c = cos(angle);
  float s = sin(angle);
  vec2 p = screen - uCenter;
  // Inverse of Canvas 2D rotate(angle) with y-down coordinates.
  vec2 local = vec2(c * p.x + s * p.y, -s * p.x + c * p.y);
  vec2 uv = local / uLayerSize + 0.5;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec4(0.0);
  return texture2D(map, uv);
}

vec4 sourceOver(vec4 src, vec4 dst) {
  return src + dst * (1.0 - src.a);
}

void main() {
  // vUv is bottom-left; convert to Canvas-style top-left pixel space.
  vec2 screen = vec2(vUv.x * uResolution.x, (1.0 - vUv.y) * uResolution.y);
  screen = displace(screen);

  vec4 color = vec4(0.0);
  color = sourceOver(sampleLayer(uLayer0, screen, uRot0), color);
  color = sourceOver(sampleLayer(uLayer1, screen, uRot1), color);
  color = sourceOver(sampleLayer(uLayer2, screen, uRot2), color);

  // Premultiply for the default WebGL canvas compositor.
  gl_FragColor = vec4(color.rgb * color.a, color.a);
}
`;

export type SpiralGpuFrame = {
  phase: number;
  pointerX: number;
  pointerY: number;
  pressure: number;
  held: boolean;
  wave0: { x: number; y: number; age: number; amp: number };
  wave1: { x: number; y: number; age: number; amp: number };
  rippleGain?: number;
};

export type SpiralGpuLayers = {
  layers: HTMLCanvasElement[];
  layerSize: number;
  centerX: number;
  centerY: number;
};

/**
 * OGL compositor: uploads baked Canvas 2D layers once, then rotates/composites on the GPU.
 * Procedural water displacement runs entirely in the fragment shader — no CPU pixel readback.
 */
export class SpiralGpuRenderer {
  readonly renderer: Renderer;
  readonly gl: Renderer['gl'];
  private readonly program: Program;
  private readonly mesh: Mesh;
  private readonly textures: Texture[];
  private width = 0;
  private height = 0;
  private disposed = false;

  private constructor(renderer: Renderer, program: Program, mesh: Mesh, textures: Texture[]) {
    this.renderer = renderer;
    this.gl = renderer.gl;
    this.program = program;
    this.mesh = mesh;
    this.textures = textures;
  }

  static isSupported(): boolean {
    try {
      const probe = document.createElement('canvas');
      return !!(probe.getContext('webgl2') || probe.getContext('webgl'));
    } catch {
      return false;
    }
  }

  static tryCreate(canvas: HTMLCanvasElement): SpiralGpuRenderer | null {
    if (!SpiralGpuRenderer.isSupported()) return null;

    try {
      const renderer = new Renderer({
        canvas,
        width: 1,
        height: 1,
        dpr: 1,
        alpha: true,
        depth: false,
        stencil: false,
        antialias: false,
        premultipliedAlpha: true,
        // false: lower memory / bandwidth for normal display (screenshots use page tooling).
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance',
        autoClear: true,
        webgl: 2,
      });
      if (!renderer.gl) return null;

      // Keep CSS-driven layout; OGL setSize writes inline px dimensions.
      canvas.style.width = '';
      canvas.style.height = '';

      const gl = renderer.gl;
      const blank = document.createElement('canvas');
      blank.width = blank.height = 1;

      const textures = [0, 1, 2].map(() => new Texture(gl, {
        image: blank,
        generateMipmaps: false,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
        flipY: false,
        premultiplyAlpha: false,
      }));

      const program = new Program(gl, {
        vertex,
        fragment,
        uniforms: {
          uResolution: { value: [1, 1] },
          uCenter: { value: [0, 0] },
          uLayerSize: { value: 1 },
          uPhase: { value: 0 },
          uLayer0: { value: textures[0] },
          uLayer1: { value: textures[1] },
          uLayer2: { value: textures[2] },
          uRot0: { value: LAYER_ROTATION_FACTORS[0] },
          uRot1: { value: LAYER_ROTATION_FACTORS[1] },
          uRot2: { value: LAYER_ROTATION_FACTORS[2] },
          uPointer: { value: [0, 0] },
          uPressure: { value: 0 },
          uHeld: { value: 0 },
          uWave0Origin: { value: [0, 0] },
          uWave0Age: { value: 0 },
          uWave0Amp: { value: 0 },
          uWave1Origin: { value: [0, 0] },
          uWave1Age: { value: 0 },
          uWave1Amp: { value: 0 },
          uRippleGain: { value: 0 },
        },
        transparent: false,
        depthTest: false,
        depthWrite: false,
        cullFace: false,
      });

      const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
      return new SpiralGpuRenderer(renderer, program, mesh, textures);
    } catch {
      return null;
    }
  }

  setSize(width: number, height: number) {
    if (this.disposed) return;
    this.width = width;
    this.height = height;
    this.renderer.dpr = 1;
    this.renderer.setSize(width, height);
    this.gl.canvas.style.width = '';
    this.gl.canvas.style.height = '';
    this.program.uniforms.uResolution.value = [width, height];
  }

  /** Upload baked typography layers. Call only when the bake cache changes. */
  setLayers({ layers, layerSize, centerX, centerY }: SpiralGpuLayers) {
    if (this.disposed) return;
    for (let i = 0; i < 3; i++) {
      const texture = this.textures[i];
      texture.image = layers[i];
      texture.needsUpdate = true;
    }
    this.program.uniforms.uLayerSize.value = layerSize;
    this.program.uniforms.uCenter.value = [centerX, centerY];
  }

  render(frame: SpiralGpuFrame) {
    if (this.disposed || !this.width || !this.height) return;
    const { uniforms } = this.program;
    uniforms.uPhase.value = frame.phase;
    uniforms.uPointer.value = [frame.pointerX, frame.pointerY];
    uniforms.uPressure.value = frame.pressure;
    uniforms.uHeld.value = frame.held ? 1 : 0;
    uniforms.uWave0Origin.value = [frame.wave0.x, frame.wave0.y];
    uniforms.uWave0Age.value = frame.wave0.age;
    uniforms.uWave0Amp.value = frame.wave0.amp;
    uniforms.uWave1Origin.value = [frame.wave1.x, frame.wave1.y];
    uniforms.uWave1Age.value = frame.wave1.age;
    uniforms.uWave1Amp.value = frame.wave1.amp;
    uniforms.uRippleGain.value = frame.rippleGain ?? 1;

    this.renderer.render({ scene: this.mesh });
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    const gl = this.gl;
    for (const texture of this.textures) {
      gl.deleteTexture(texture.texture);
    }
    if (this.program.program) gl.deleteProgram(this.program.program);
  }
}
