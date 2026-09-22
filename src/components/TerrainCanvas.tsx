import { useEffect, useRef, useState } from "react";

export type TerrainVariant = "alpine" | "desert" | "island";

type TerrainCanvasProps = {
  variant?: TerrainVariant;
  wireframe?: boolean;
  className?: string;
  onReady?: () => void;
};

type Vec3 = [number, number, number];
type Mesh = { positions: number[]; normals: number[]; colors: number[] };
type GpuMesh = {
  position: WebGLBuffer;
  normal: WebGLBuffer;
  color: WebGLBuffer;
  count: number;
};

const vertexShader = `
  attribute vec3 aPosition;
  attribute vec3 aNormal;
  attribute vec3 aColor;
  uniform mat4 uMatrix;
  uniform float uOffset;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vColor;
  void main() {
    vPosition = aPosition;
    vNormal = aNormal;
    vColor = aColor;
    gl_Position = uMatrix * vec4(aPosition + aNormal * uOffset, 1.0);
  }
`;

const fragmentShader = `
  precision mediump float;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vColor;
  uniform float uMode;
  uniform float uOpacity;
  uniform float uFade;
  void main() {
    if (uMode > 1.5) {
      float radius = length(vPosition.xz / vec2(3.0, 2.65));
      float shadow = (1.0 - smoothstep(0.25, 1.0, radius)) * 0.36;
      gl_FragColor = vec4(0.015, 0.024, 0.018, shadow);
      return;
    }
    if (uMode > 0.5) {
      float fade = mix(1.0, 1.0 - smoothstep(2.6, 7.5, length(vPosition.xz)), uFade);
      gl_FragColor = vec4(vColor, uOpacity * fade);
      return;
    }
    vec3 normal = normalize(vNormal);
    vec3 light = normalize(vec3(-0.65, 1.0, 0.4));
    float diffuse = max(dot(normal, light), 0.0);
    float fill = max(dot(normal, normalize(vec3(0.6, 0.4, -0.65))), 0.0);
    vec3 color = vColor * (0.48 + diffuse * 0.61 + fill * 0.13);
    float contours = abs(fract(vPosition.y * 8.0) - 0.5);
    float contour = (1.0 - smoothstep(0.009, 0.032, contours)) * 0.13;
    color *= 1.0 - contour * smoothstep(0.05, 0.35, vPosition.y);
    float grain = fract(sin(dot(vPosition.xz * 180.0, vec2(12.9898, 78.233))) * 43758.5453);
    color *= 0.98 + grain * 0.04;
    gl_FragColor = vec4(color, 1.0);
  }
`;

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp = (n: number, low = 0, high = 1) =>
  Math.min(high, Math.max(low, n));
const hash = (x: number, y: number) => {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return value - Math.floor(value);
};

function noise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smooth(x - ix);
  const fy = smooth(y - iy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return (
    a * (1 - fx) * (1 - fy) +
    b * fx * (1 - fy) +
    c * (1 - fx) * fy +
    d * fx * fy
  );
}

function fbm(x: number, y: number): number {
  return (
    noise(x, y) * 0.54 +
    noise(x * 2.1 + 9, y * 2.1) * 0.27 +
    noise(x * 4.3, y * 4.3 + 7) * 0.13 +
    noise(x * 8.7, y * 8.7) * 0.06
  );
}

function elevation(x: number, z: number, variant: TerrainVariant): number {
  const edge =
    smooth(clamp((2.25 - Math.abs(x)) * 2.1)) *
    smooth(clamp((1.95 - Math.abs(z)) * 2.1));
  const rough = fbm(x * 2.3 + 13.3, z * 2.3 + 4.2);
  if (variant === "desert") {
    const dunes = Math.pow(
      0.5 + 0.5 * Math.sin(x * 3.2 + Math.sin(z * 1.8) * 1.2 + z * 0.7),
      2,
    );
    const distance = Math.exp(-0.12 * (x * x + z * z));
    return 0.065 + edge * (0.2 + dunes * 0.8 * distance + rough * 0.19);
  }
  const peakA = Math.exp(-((x + 0.57) ** 2 * 1.3 + (z + 0.24) ** 2 * 1.9));
  const peakB = Math.exp(-((x - 0.58) ** 2 * 2.0 + (z - 0.32) ** 2 * 2.7));
  const peakC = Math.exp(-((x + 0.2) ** 2 * 3.0 + (z - 1.0) ** 2 * 4.3));
  const ridge = 1 - Math.abs(noise(x * 3.4 + 7.8, z * 3.4) * 2 - 1);
  const peaks = Math.max(peakA * 1.65, peakB * 1.37, peakC * 0.85);
  const mountain = peaks * (0.65 + rough * 0.45 + ridge * 0.2) + rough * 0.19;
  if (variant === "island") {
    const coast = smooth(
      clamp(
        (1.0 -
          Math.sqrt((x / 2.0) ** 2 + (z / 1.65) ** 2) +
          (rough - 0.5) * 0.35) *
          2,
      ),
    );
    return 0.06 + coast * mountain * 0.92;
  }
  return 0.065 + edge * mountain;
}

function subtract(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
function normalize(v: Vec3): Vec3 {
  const length = Math.hypot(...v) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
}
function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
function mix(a: Vec3, b: Vec3, t: number): Vec3 {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}
function emptyMesh(): Mesh {
  return { positions: [], normals: [], colors: [] };
}

function triangle(
  mesh: Mesh,
  a: Vec3,
  b: Vec3,
  c: Vec3,
  color: Vec3,
  normal?: Vec3,
) {
  const n = normal ?? normalize(cross(subtract(b, a), subtract(c, a)));
  for (const point of [a, b, c]) {
    mesh.positions.push(...point);
    mesh.normals.push(...n);
    mesh.colors.push(...color);
  }
}

function terrainGeometry(variant: TerrainVariant): {
  terrain: Mesh;
  wire: Mesh;
} {
  const terrain = emptyMesh();
  const wire = emptyMesh();
  const columns = 100;
  const rows = 88;
  const low: Vec3 =
    variant === "desert" ? [0.57, 0.44, 0.29] : [0.36, 0.43, 0.34];
  const high: Vec3 =
    variant === "desert" ? [0.89, 0.76, 0.54] : [0.86, 0.88, 0.78];
  const point = (x: number, z: number): Vec3 => {
    const px = (x / columns - 0.5) * 4.5;
    const pz = (z / rows - 0.5) * 3.9;
    return [px, elevation(px, pz, variant), pz];
  };
  const addFace = (a: Vec3, b: Vec3, c: Vec3) => {
    const normal = normalize(cross(subtract(b, a), subtract(c, a)));
    const height = (a[1] + b[1] + c[1]) / 3;
    const brightness = (hash(a[0] * 200, a[2] * 200) - 0.5) * 0.035;
    const snow = smooth(clamp((height - 0.28) / 1.18));
    let color = mix(low, high, clamp(snow + brightness));
    if (variant === "island" && height < 0.12)
      color = mix(
        [0.13, 0.29, 0.28],
        [0.48, 0.58, 0.44],
        smooth(clamp((height - 0.064) / 0.055)),
      );
    triangle(terrain, a, b, c, color, normal);
    for (const p of [a, b, b, c, c, a]) {
      wire.positions.push(...p);
      wire.normals.push(...normal);
      wire.colors.push(0.69, 0.85, 0.64);
    }
  };
  for (let z = 0; z < rows; z++) {
    for (let x = 0; x < columns; x++) {
      const a = point(x, z);
      const b = point(x + 1, z);
      const c = point(x, z + 1);
      const d = point(x + 1, z + 1);
      if ((x + z) % 2) {
        addFace(a, c, b);
        addFace(b, c, d);
      } else {
        addFace(a, d, b);
        addFace(a, c, d);
      }
    }
  }
  const edge: Vec3[] = [];
  for (let x = 0; x <= columns; x++) edge.push(point(x, 0));
  for (let z = 1; z <= rows; z++) edge.push(point(columns, z));
  for (let x = columns - 1; x >= 0; x--) edge.push(point(x, rows));
  for (let z = rows - 1; z >= 0; z--) edge.push(point(0, z));
  const slab: Vec3 =
    variant === "desert" ? [0.34, 0.3, 0.23] : [0.25, 0.3, 0.25];
  edge.forEach((a, i) => {
    const b = edge[(i + 1) % edge.length];
    const c: Vec3 = [a[0], -0.18, a[2]];
    const d: Vec3 = [b[0], -0.18, b[2]];
    triangle(terrain, a, b, c, slab);
    triangle(terrain, b, d, c, slab);
  });
  return { terrain, wire };
}

function cameraMatrix(aspect: number, yaw: number, tilt: number): Float32Array {
  const eye: Vec3 = [Math.sin(yaw) * 8.2, tilt, Math.cos(yaw) * 8.2];
  const target: Vec3 = [0, 0.55, 0];
  const z = normalize(subtract(eye, target));
  const x = normalize(cross([0, 1, 0], z));
  const y = cross(z, x);
  const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const view = [
    x[0],
    y[0],
    z[0],
    0,
    x[1],
    y[1],
    z[1],
    0,
    x[2],
    y[2],
    z[2],
    0,
    -dot(x, eye),
    -dot(y, eye),
    -dot(z, eye),
    1,
  ];
  const halfHeight = Math.max(2.55, 3.6 / aspect);
  const halfWidth = halfHeight * aspect;
  const projection = [
    1 / halfWidth,
    0,
    0,
    0,
    0,
    1 / halfHeight,
    0,
    0,
    0,
    0,
    -2 / 30,
    0,
    0,
    0,
    -1,
    1,
  ];
  const result = new Float32Array(16);
  for (let column = 0; column < 4; column++) {
    for (let row = 0; row < 4; row++) {
      for (let k = 0; k < 4; k++)
        result[column * 4 + row] +=
          projection[k * 4 + row] * view[column * 4 + k];
    }
  }
  return result;
}

/** A small, dependency-free terrain renderer. It only draws when the view changes. */
export default function TerrainCanvas({
  variant = "alpine",
  wireframe = false,
  className,
  onReady,
}: TerrainCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readyRef = useRef(onReady);
  const angleRef = useRef({ yaw: -0.57, tilt: 5.8 });
  const [contextGeneration, setContextGeneration] = useState(0);
  readyRef.current = onReady;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: true,
      powerPreference: "low-power",
    });
    if (!gl) {
      // Preserve a readable preview on devices where WebGL is unavailable.
      const context = canvas.getContext("2d");
      if (context) {
        canvas.width = 800;
        canvas.height = 500;
        context.fillStyle = "#191e1b";
        context.fillRect(0, 0, 800, 500);
        context.fillStyle = "#73866d";
        context.beginPath();
        context.moveTo(110, 360);
        context.lineTo(305, 135);
        context.lineTo(410, 265);
        context.lineTo(520, 185);
        context.lineTo(695, 365);
        context.closePath();
        context.fill();
      }
      readyRef.current?.();
      return;
    }

    const shaders: WebGLShader[] = [];
    const gpuMeshes: GpuMesh[] = [];
    let animationFrame = 0;
    let disposed = false;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    };
    const vertex = compile(gl.VERTEX_SHADER, vertexShader);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentShader);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) {
      shaders.forEach((shader) => gl.deleteShader(shader));
      if (program) gl.deleteProgram(program);
      return;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      shaders.forEach((shader) => gl.deleteShader(shader));
      gl.deleteProgram(program);
      return;
    }
    gl.useProgram(program);
    const attributes = {
      position: gl.getAttribLocation(program, "aPosition"),
      normal: gl.getAttribLocation(program, "aNormal"),
      color: gl.getAttribLocation(program, "aColor"),
    };
    const uniform = Object.fromEntries(
      ["Matrix", "Mode", "Opacity", "Fade", "Offset"].map((name) => [
        name,
        gl.getUniformLocation(program, `u${name}`),
      ]),
    );
    const upload = (mesh: Mesh): GpuMesh => {
      const buffer = (data: number[]) => {
        const result = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, result);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        return result;
      };
      const result = {
        position: buffer(mesh.positions),
        normal: buffer(mesh.normals),
        color: buffer(mesh.colors),
        count: mesh.positions.length / 3,
      };
      gpuMeshes.push(result);
      return result;
    };
    const geometry = terrainGeometry(variant);
    const terrain = upload(geometry.terrain);
    const wire = upload(geometry.wire);
    const gridGeometry = emptyMesh();
    const line = (a: Vec3, b: Vec3, color: Vec3) => {
      gridGeometry.positions.push(...a, ...b);
      gridGeometry.normals.push(0, 1, 0, 0, 1, 0);
      gridGeometry.colors.push(...color, ...color);
    };
    for (let i = -16; i <= 16; i++) {
      const color: Vec3 = i % 4 === 0 ? [0.3, 0.36, 0.31] : [0.23, 0.28, 0.24];
      line([i * 0.5, -0.205, -8], [i * 0.5, -0.205, 8], color);
      line([-8, -0.205, i * 0.5], [8, -0.205, i * 0.5], color);
    }
    const grid = upload(gridGeometry);
    const shadowGeometry = emptyMesh();
    triangle(
      shadowGeometry,
      [-3.3, -0.21, -3],
      [3.3, -0.21, 3],
      [3.3, -0.21, -3],
      [0, 0, 0],
    );
    triangle(
      shadowGeometry,
      [-3.3, -0.21, -3],
      [-3.3, -0.21, 3],
      [3.3, -0.21, 3],
      [0, 0, 0],
    );
    const shadow = upload(shadowGeometry);

    const draw = (
      mesh: GpuMesh,
      primitive: number,
      mode: number,
      opacity = 1,
      fade = 0,
      offset = 0,
    ) => {
      for (const key of ["position", "normal", "color"] as const) {
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh[key]);
        gl.enableVertexAttribArray(attributes[key]);
        gl.vertexAttribPointer(attributes[key], 3, gl.FLOAT, false, 0, 0);
      }
      gl.uniform1f(uniform.Mode, mode);
      gl.uniform1f(uniform.Opacity, opacity);
      gl.uniform1f(uniform.Fade, fade);
      gl.uniform1f(uniform.Offset, offset);
      gl.drawArrays(primitive, 0, mesh.count);
    };

    const render = () => {
      animationFrame = 0;
      if (disposed || gl.isContextLost()) return;
      const bounds = canvas.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(bounds.width * ratio);
      const height = Math.round(bounds.height * ratio);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
      gl.clearColor(0.08, 0.102, 0.087, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.uniformMatrix4fv(
        uniform.Matrix,
        false,
        cameraMatrix(
          width / height,
          angleRef.current.yaw,
          angleRef.current.tilt,
        ),
      );
      gl.depthMask(false);
      draw(shadow, gl.TRIANGLES, 2);
      draw(grid, gl.LINES, 1, 0.4, 1);
      gl.depthMask(true);
      draw(terrain, gl.TRIANGLES, 0);
      if (wireframe) {
        gl.depthMask(false);
        draw(wire, gl.LINES, 1, 0.35, 0, 0.0025);
        gl.depthMask(true);
      }
    };
    const scheduleRender = () => {
      if (!animationFrame && !disposed)
        animationFrame = requestAnimationFrame(render);
    };
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const pointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
    };
    const pointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      angleRef.current.yaw -= (event.clientX - lastX) * 0.007;
      angleRef.current.tilt = clamp(
        angleRef.current.tilt + (event.clientY - lastY) * 0.018,
        3,
        9,
      );
      lastX = event.clientX;
      lastY = event.clientY;
      scheduleRender();
    };
    const pointerUp = () => {
      dragging = false;
      canvas.style.cursor = "grab";
    };
    const keyboard = (event: KeyboardEvent) => {
      if (
        !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"].includes(
          event.key,
        )
      )
        return;
      event.preventDefault();
      if (event.key === "Home") angleRef.current = { yaw: -0.57, tilt: 5.8 };
      if (event.key === "ArrowLeft") angleRef.current.yaw -= 0.12;
      if (event.key === "ArrowRight") angleRef.current.yaw += 0.12;
      if (event.key === "ArrowUp")
        angleRef.current.tilt = clamp(angleRef.current.tilt + 0.5, 3, 9);
      if (event.key === "ArrowDown")
        angleRef.current.tilt = clamp(angleRef.current.tilt - 0.5, 3, 9);
      scheduleRender();
    };
    const contextLost = (event: Event) => {
      event.preventDefault();
    };
    const contextRestored = () => {
      setContextGeneration((generation) => generation + 1);
    };
    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointerup", pointerUp);
    canvas.addEventListener("pointercancel", pointerUp);
    canvas.addEventListener("lostpointercapture", pointerUp);
    canvas.addEventListener("keydown", keyboard);
    canvas.addEventListener("webglcontextlost", contextLost);
    canvas.addEventListener("webglcontextrestored", contextRestored);
    const observer = new ResizeObserver(scheduleRender);
    observer.observe(canvas);
    window.addEventListener("resize", scheduleRender);
    render();
    readyRef.current?.();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      window.removeEventListener("resize", scheduleRender);
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", pointerUp);
      canvas.removeEventListener("pointercancel", pointerUp);
      canvas.removeEventListener("lostpointercapture", pointerUp);
      canvas.removeEventListener("keydown", keyboard);
      canvas.removeEventListener("webglcontextlost", contextLost);
      canvas.removeEventListener("webglcontextrestored", contextRestored);
      gpuMeshes.forEach((mesh) => {
        gl.deleteBuffer(mesh.position);
        gl.deleteBuffer(mesh.normal);
        gl.deleteBuffer(mesh.color);
      });
      shaders.forEach((shader) => gl.deleteShader(shader));
      gl.deleteProgram(program);
    };
  }, [variant, wireframe, contextGeneration]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      tabIndex={0}
      role="img"
      aria-label={`${variant === "alpine" ? "Alpine mountain" : variant === "desert" ? "Desert dune" : "Coastal island"} terrain preview. Drag to rotate, or use the arrow keys. Press Home to reset the view.`}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        cursor: "grab",
        touchAction: "pan-y",
      }}
    />
  );
}
