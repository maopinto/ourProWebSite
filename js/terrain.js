// Standalone terrain preview. No packages or build tools are needed.
(function () {
  "use strict";

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
const smooth = (t) => t * t * (3 - 2 * t);
const clamp = (n, low = 0, high = 1) => Math.min(high, Math.max(low, n));
const hash = (x, y) => {
    const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
    return value - Math.floor(value);
};
function noise(x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = smooth(x - ix);
    const fy = smooth(y - iy);
    const a = hash(ix, iy);
    const b = hash(ix + 1, iy);
    const c = hash(ix, iy + 1);
    const d = hash(ix + 1, iy + 1);
    return (a * (1 - fx) * (1 - fy) +
        b * fx * (1 - fy) +
        c * (1 - fx) * fy +
        d * fx * fy);
}
function fbm(x, y) {
    return (noise(x, y) * 0.54 +
        noise(x * 2.1 + 9, y * 2.1) * 0.27 +
        noise(x * 4.3, y * 4.3 + 7) * 0.13 +
        noise(x * 8.7, y * 8.7) * 0.06);
}
function elevation(x, z, variant) {
    const edge = smooth(clamp((2.25 - Math.abs(x)) * 2.1)) *
        smooth(clamp((1.95 - Math.abs(z)) * 2.1));
    const rough = fbm(x * 2.3 + 13.3, z * 2.3 + 4.2);
    if (variant === "desert") {
        const dunes = Math.pow(0.5 + 0.5 * Math.sin(x * 3.2 + Math.sin(z * 1.8) * 1.2 + z * 0.7), 2);
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
        const coast = smooth(clamp((1.0 -
            Math.sqrt((x / 2.0) ** 2 + (z / 1.65) ** 2) +
            (rough - 0.5) * 0.35) *
            2));
        return 0.06 + coast * mountain * 0.92;
    }
    return 0.065 + edge * mountain;
}
function subtract(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
function normalize(v) {
    const length = Math.hypot(...v) || 1;
    return [v[0] / length, v[1] / length, v[2] / length];
}
function cross(a, b) {
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    ];
}
function mix(a, b, t) {
    return [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
    ];
}
function emptyMesh() {
    return { positions: [], normals: [], colors: [] };
}
function triangle(mesh, a, b, c, color, normal) {
    const n = normal ?? normalize(cross(subtract(b, a), subtract(c, a)));
    for (const point of [a, b, c]) {
        mesh.positions.push(...point);
        mesh.normals.push(...n);
        mesh.colors.push(...color);
    }
}
function terrainGeometry(variant) {
    const terrain = emptyMesh();
    const wire = emptyMesh();
    const columns = 100;
    const rows = 88;
    const low = variant === "desert" ? [0.57, 0.44, 0.29] : [0.36, 0.43, 0.34];
    const high = variant === "desert" ? [0.89, 0.76, 0.54] : [0.86, 0.88, 0.78];
    const point = (x, z) => {
        const px = (x / columns - 0.5) * 4.5;
        const pz = (z / rows - 0.5) * 3.9;
        return [px, elevation(px, pz, variant), pz];
    };
    const addFace = (a, b, c) => {
        const normal = normalize(cross(subtract(b, a), subtract(c, a)));
        const height = (a[1] + b[1] + c[1]) / 3;
        const brightness = (hash(a[0] * 200, a[2] * 200) - 0.5) * 0.035;
        const snow = smooth(clamp((height - 0.28) / 1.18));
        let color = mix(low, high, clamp(snow + brightness));
        if (variant === "island" && height < 0.12)
            color = mix([0.13, 0.29, 0.28], [0.48, 0.58, 0.44], smooth(clamp((height - 0.064) / 0.055)));
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
            }
            else {
                addFace(a, d, b);
                addFace(a, c, d);
            }
        }
    }
    const edge = [];
    for (let x = 0; x <= columns; x++)
        edge.push(point(x, 0));
    for (let z = 1; z <= rows; z++)
        edge.push(point(columns, z));
    for (let x = columns - 1; x >= 0; x--)
        edge.push(point(x, rows));
    for (let z = rows - 1; z >= 0; z--)
        edge.push(point(0, z));
    const slab = variant === "desert" ? [0.34, 0.3, 0.23] : [0.25, 0.3, 0.25];
    edge.forEach((a, i) => {
        const b = edge[(i + 1) % edge.length];
        const c = [a[0], -0.18, a[2]];
        const d = [b[0], -0.18, b[2]];
        triangle(terrain, a, b, c, slab);
        triangle(terrain, b, d, c, slab);
    });
    return { terrain, wire };
}
function cameraMatrix(aspect, yaw, tilt) {
    const eye = [Math.sin(yaw) * 8.2, tilt, Math.cos(yaw) * 8.2];
    const target = [0, 0.55, 0];
    const z = normalize(subtract(eye, target));
    const x = normalize(cross([0, 1, 0], z));
    const y = cross(z, x);
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
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

// Create a preview on an existing canvas and render only when the view changes.
function create(canvas, options = {}) {
    if (!canvas || typeof canvas.getContext !== "function") {
        throw new TypeError("TerraTerrain.create needs a canvas element.");
    }
    const validVariant = (value) => ["alpine", "desert", "island"].includes(value) ? value : "alpine";
    let variant = validVariant(options.variant);
    let wireframe = Boolean(options.wireframe);
    let angle = { yaw: -0.57, tilt: 5.8 };
    let disposed = false;
    let animationFrame = 0;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let program = null;
    let terrain = null;
    let wire = null;
    let grid = null;
    let shadow = null;
    let attributes = null;
    let uniform = null;
    let fallback = null;
    let fallbackCanvas = null;
    const shaders = [];
    const buffers = new Set();

    canvas.tabIndex = 0;
    canvas.setAttribute("role", "img");
    Object.assign(canvas.style, {
        display: "block", width: "100%", height: "100%",
        cursor: "grab", touchAction: "pan-y"
    });

    const updateLabel = () => {
        const name = variant === "alpine" ? "Alpine mountain" : variant === "desert" ? "Desert dune" : "Coastal island";
        canvas.setAttribute("aria-label", fallback
            ? `${name} terrain preview. Static preview shown because 3D rendering is unavailable.`
            : `${name} terrain preview. Drag to rotate, or use the arrow keys. Press Home to reset the view.`);
    };

    // A local illustration keeps the preview visible when a device cannot use WebGL.
    const drawFallback = () => {
        if (!fallbackCanvas) return;
        const context = fallbackCanvas.getContext("2d");
        if (!context) return;
        context.fillStyle = "#191e1b";
        context.fillRect(0, 0, 800, 500);
        context.strokeStyle = "#303d33";
        context.lineWidth = 1;
        for (let step = -8; step <= 8; step++) {
            context.beginPath();
            context.moveTo(400 + step * 65, 225);
            context.lineTo(400 + step * 120, 500);
            context.stroke();
        }
        for (let y = 260; y < 500; y += 35) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(800, y);
            context.stroke();
        }
        if (variant === "island") {
            context.fillStyle = "#294c47";
            context.beginPath();
            context.ellipse(400, 358, 290, 55, 0, 0, Math.PI * 2);
            context.fill();
        }
        context.fillStyle = variant === "desert" ? "#b29a71" : "#73866d";
        context.beginPath();
        context.moveTo(110, 360);
        if (variant === "desert") {
            context.bezierCurveTo(205, 320, 245, 175, 335, 260);
            context.bezierCurveTo(400, 325, 470, 180, 550, 260);
            context.bezierCurveTo(625, 320, 650, 330, 695, 365);
        } else {
            context.lineTo(305, 135);
            context.lineTo(410, 265);
            context.lineTo(520, 185);
            context.lineTo(695, 365);
        }
        context.closePath();
        context.fill();
        if (variant !== "desert") {
            context.fillStyle = "#99a18a";
            context.beginPath();
            context.moveTo(305, 135);
            context.lineTo(410, 265);
            context.lineTo(360, 365);
            context.closePath();
            context.fill();
        }
        if (wireframe) {
            context.strokeStyle = "#bdd7ad";
            context.lineWidth = 0.8;
            for (let y = 285; y <= 350; y += 13) {
                context.beginPath();
                context.moveTo(250 - (y - 285), y);
                context.lineTo(565 + (y - 285), y);
                context.stroke();
            }
        }
    };

    const showFallback = () => {
        if (!fallback && canvas.parentElement) {
            fallback = document.createElement("div");
            fallback.className = "terrain-fallback";
            fallback.setAttribute("aria-hidden", "true");
            Object.assign(fallback.style, {
                position: "absolute", inset: "0", pointerEvents: "none",
                overflow: "hidden", background: "#191e1b"
            });
            fallbackCanvas = document.createElement("canvas");
            fallbackCanvas.width = 800;
            fallbackCanvas.height = 500;
            Object.assign(fallbackCanvas.style, { display: "block", width: "100%", height: "100%" });
            fallback.appendChild(fallbackCanvas);
            canvas.insertAdjacentElement("afterend", fallback);
        }
        canvas.style.cursor = "default";
        drawFallback();
        updateLabel();
    };

    const hideFallback = () => {
        if (fallback) fallback.remove();
        fallback = null;
        fallbackCanvas = null;
        canvas.style.cursor = "grab";
        updateLabel();
    };

    let gl = null;
    try {
        gl = canvas.getContext("webgl", {
            alpha: false, antialias: true, powerPreference: "low-power"
        });
    } catch (_error) {
        // Privacy settings and unsupported graphics drivers can reject a context.
    }

    const releaseMesh = (mesh) => {
        if (!mesh || !gl) return;
        for (const key of ["position", "normal", "color"]) {
            gl.deleteBuffer(mesh[key]);
            buffers.delete(mesh[key]);
        }
    };

    const releaseResources = () => {
        if (!gl) return;
        buffers.forEach((buffer) => gl.deleteBuffer(buffer));
        buffers.clear();
        shaders.forEach((shader) => gl.deleteShader(shader));
        shaders.length = 0;
        if (program) gl.deleteProgram(program);
        program = null;
        terrain = wire = grid = shadow = null;
    };

    const upload = (mesh) => {
        const buffer = (data) => {
            const result = gl.createBuffer();
            if (!result) throw new Error("Unable to create a terrain buffer.");
            buffers.add(result);
            gl.bindBuffer(gl.ARRAY_BUFFER, result);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
            return result;
        };
        return {
            position: buffer(mesh.positions), normal: buffer(mesh.normals),
            color: buffer(mesh.colors), count: mesh.positions.length / 3
        };
    };

    const updateGeometry = () => {
        releaseMesh(terrain);
        releaseMesh(wire);
        const geometry = terrainGeometry(variant);
        terrain = upload(geometry.terrain);
        wire = upload(geometry.wire);
    };

    const initialize = () => {
        if (!gl || gl.isContextLost()) {
            showFallback();
            return;
        }
        releaseResources();
        try {
            const compile = (type, source) => {
                const shader = gl.createShader(type);
                if (!shader) throw new Error("Unable to create a terrain shader.");
                shaders.push(shader);
                gl.shaderSource(shader, source);
                gl.compileShader(shader);
                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                    throw new Error("Unable to compile a terrain shader.");
                }
                return shader;
            };
            const vertex = compile(gl.VERTEX_SHADER, vertexShader);
            const fragment = compile(gl.FRAGMENT_SHADER, fragmentShader);
            program = gl.createProgram();
            if (!program) throw new Error("Unable to create a terrain program.");
            gl.attachShader(program, vertex);
            gl.attachShader(program, fragment);
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                throw new Error("Unable to link terrain shaders.");
            }
            gl.useProgram(program);
            attributes = {
                position: gl.getAttribLocation(program, "aPosition"),
                normal: gl.getAttribLocation(program, "aNormal"),
                color: gl.getAttribLocation(program, "aColor")
            };
            uniform = Object.fromEntries(["Matrix", "Mode", "Opacity", "Fade", "Offset"].map((name) => [
                name, gl.getUniformLocation(program, `u${name}`)
            ]));
            updateGeometry();
            const gridGeometry = emptyMesh();
            const line = (a, b, color) => {
                gridGeometry.positions.push(...a, ...b);
                gridGeometry.normals.push(0, 1, 0, 0, 1, 0);
                gridGeometry.colors.push(...color, ...color);
            };
            for (let i = -16; i <= 16; i++) {
                const color = i % 4 === 0 ? [0.3, 0.36, 0.31] : [0.23, 0.28, 0.24];
                line([i * 0.5, -0.205, -8], [i * 0.5, -0.205, 8], color);
                line([-8, -0.205, i * 0.5], [8, -0.205, i * 0.5], color);
            }
            grid = upload(gridGeometry);
            const shadowGeometry = emptyMesh();
            triangle(shadowGeometry, [-3.3, -0.21, -3], [3.3, -0.21, 3], [3.3, -0.21, -3], [0, 0, 0]);
            triangle(shadowGeometry, [-3.3, -0.21, -3], [-3.3, -0.21, 3], [3.3, -0.21, 3], [0, 0, 0]);
            shadow = upload(shadowGeometry);
            hideFallback();
        } catch (_error) {
            releaseResources();
            showFallback();
        }
    };

    const draw = (mesh, primitive, mode, opacity = 1, fade = 0, offset = 0) => {
        for (const key of ["position", "normal", "color"]) {
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
        if (disposed) return;
        if (fallback) {
            drawFallback();
            return;
        }
        if (!gl || !program || gl.isContextLost()) return;
        const bounds = canvas.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.max(1, Math.round(bounds.width * ratio));
        const height = Math.max(1, Math.round(bounds.height * ratio));
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
        gl.useProgram(program);
        gl.uniformMatrix4fv(uniform.Matrix, false, cameraMatrix(width / height, angle.yaw, angle.tilt));
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
        if (!animationFrame && !disposed) animationFrame = requestAnimationFrame(render);
    };
    const pointerDown = (event) => {
        if (event.button !== 0 || fallback) return;
        dragging = true;
        lastX = event.clientX;
        lastY = event.clientY;
        canvas.setPointerCapture(event.pointerId);
        canvas.style.cursor = "grabbing";
    };
    const pointerMove = (event) => {
        if (!dragging) return;
        angle.yaw -= (event.clientX - lastX) * 0.007;
        angle.tilt = clamp(angle.tilt + (event.clientY - lastY) * 0.018, 3, 9);
        lastX = event.clientX;
        lastY = event.clientY;
        scheduleRender();
    };
    const pointerUp = () => {
        dragging = false;
        canvas.style.cursor = fallback ? "default" : "grab";
    };
    const keyboard = (event) => {
        if (fallback || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"].includes(event.key)) return;
        event.preventDefault();
        if (event.key === "Home") angle = { yaw: -0.57, tilt: 5.8 };
        if (event.key === "ArrowLeft") angle.yaw -= 0.12;
        if (event.key === "ArrowRight") angle.yaw += 0.12;
        if (event.key === "ArrowUp") angle.tilt = clamp(angle.tilt + 0.5, 3, 9);
        if (event.key === "ArrowDown") angle.tilt = clamp(angle.tilt - 0.5, 3, 9);
        scheduleRender();
    };
    const contextLost = (event) => {
        event.preventDefault();
        dragging = false;
        showFallback();
    };
    const contextRestored = () => {
        if (disposed) return;
        initialize();
        scheduleRender();
    };
    const events = {
        pointerdown: pointerDown, pointermove: pointerMove, pointerup: pointerUp,
        pointercancel: pointerUp, lostpointercapture: pointerUp, keydown: keyboard,
        webglcontextlost: contextLost, webglcontextrestored: contextRestored
    };
    Object.entries(events).forEach(([name, listener]) => canvas.addEventListener(name, listener));
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(scheduleRender) : null;
    if (observer) observer.observe(canvas);
    window.addEventListener("resize", scheduleRender);
    updateLabel();
    initialize();
    render();

    return {
        setVariant(value) {
            if (disposed) return;
            const next = validVariant(value);
            if (variant === next) return;
            variant = next;
            updateLabel();
            if (gl && program && !gl.isContextLost()) {
                try {
                    updateGeometry();
                } catch (_error) {
                    releaseResources();
                    showFallback();
                }
            }
            scheduleRender();
        },
        setWireframe(value) {
            if (disposed) return;
            wireframe = Boolean(value);
            scheduleRender();
        },
        destroy() {
            if (disposed) return;
            disposed = true;
            cancelAnimationFrame(animationFrame);
            if (observer) observer.disconnect();
            window.removeEventListener("resize", scheduleRender);
            Object.entries(events).forEach(([name, listener]) => canvas.removeEventListener(name, listener));
            releaseResources();
            hideFallback();
        }
    };
}

window.TerraTerrain = { create };
})();
