// ribbons.js
// Ported from React/OGL to Vanilla JS/OGL
// Uses OGL from CDN (ES Module bundled)

import { Renderer, Transform, Vec3, Color, Polyline } from './vendor/ogl.mjs';

export function initRibbons(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Default configuration
    const config = {
        colors: ['#FC8EAC', '#2563eb', '#C4455C'],
        baseSpring: 0.03,
        baseFriction: 0.9,
        baseThickness: 30,
        offsetFactor: 0.05,
        maxAge: 500,
        pointCount: 50,
        speedMultiplier: 0.6,
        enableFade: false,
        enableShaderEffect: true,
        effectAmplitude: 2,
        backgroundColor: [0, 0, 0, 0],
        ...options
    };

    const renderer = new Renderer({ dpr: window.devicePixelRatio || 2, alpha: true });
    const gl = renderer.gl;
    const bg = config.backgroundColor;
    gl.clearColor(bg[0], bg[1], bg[2], bg[3]);

    gl.canvas.style.position = 'absolute';
    gl.canvas.style.top = '0';
    gl.canvas.style.left = '0';
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    gl.canvas.style.pointerEvents = 'none'; // Passthrough
    gl.canvas.style.zIndex = '0'; // Behind content
    container.style.position = 'relative'; // Ensure containment
    container.insertBefore(gl.canvas, container.firstChild);

    const scene = new Transform();
    const lines = [];

    const vertex = `
      precision highp float;
      
      attribute vec3 position;
      attribute vec3 next;
      attribute vec3 prev;
      attribute vec2 uv;
      attribute float side;
      
      uniform vec2 uResolution;
      uniform float uDPR;
      uniform float uThickness;
      uniform float uTime;
      uniform float uEnableShaderEffect;
      uniform float uEffectAmplitude;
      
      varying vec2 vUV;
      
      vec4 getPosition() {
          vec4 current = vec4(position, 1.0);
          vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
          vec2 nextScreen = next.xy * aspect;
          vec2 prevScreen = prev.xy * aspect;
          vec2 tangent = normalize(nextScreen - prevScreen);
          vec2 normal = vec2(-tangent.y, tangent.x);
          normal /= aspect;
          normal *= mix(1.0, 0.1, pow(abs(uv.y - 0.5) * 2.0, 2.0));
          float dist = length(nextScreen - prevScreen);
          normal *= smoothstep(0.0, 0.02, dist);
          float pixelWidthRatio = 1.0 / (uResolution.y / uDPR);
          float pixelWidth = current.w * pixelWidthRatio;
          normal *= pixelWidth * uThickness;
          current.xy -= normal * side;
          if(uEnableShaderEffect > 0.5) {
            current.xy += normal * sin(uTime + current.x * 10.0) * uEffectAmplitude;
          }
          return current;
      }
      
      void main() {
          vUV = uv;
          gl_Position = getPosition();
      }
    `;

    const fragment = `
      precision highp float;
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uEnableFade;
      varying vec2 vUV;
      void main() {
          float fadeFactor = 1.0;
          if(uEnableFade > 0.5) {
              fadeFactor = 1.0 - smoothstep(0.0, 1.0, vUV.y);
          }
          gl_FragColor = vec4(uColor, uOpacity * fadeFactor);
      }
    `;

    function resize() {
        if (!container) return;
        const width = container.clientWidth;
        const height = container.clientHeight;
        renderer.setSize(width, height);
        lines.forEach(line => line.polyline.resize());
    }
    window.addEventListener('resize', resize);

    const center = (config.colors.length - 1) / 2;
    config.colors.forEach((colorHex, index) => {
        const spring = config.baseSpring + (Math.random() - 0.5) * 0.05;
        const friction = config.baseFriction + (Math.random() - 0.5) * 0.05;
        const thickness = config.baseThickness + (Math.random() - 0.5) * 3;
        const mouseOffset = new Vec3(
            (index - center) * config.offsetFactor + (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.1,
            0
        );

        const line = {
            spring,
            friction,
            mouseVelocity: new Vec3(),
            mouseOffset
        };

        const count = config.pointCount;
        const points = [];
        for (let i = 0; i < count; i++) {
            points.push(new Vec3());
        }
        line.points = points;

        // Color parsing: OGL Color accepts hex strings
        const uColorVal = new Color(colorHex);

        line.polyline = new Polyline(gl, {
            points,
            vertex,
            fragment,
            uniforms: {
                uColor: { value: uColorVal },
                uThickness: { value: thickness },
                uOpacity: { value: 1.0 },
                uTime: { value: 0.0 },
                uEnableShaderEffect: { value: config.enableShaderEffect ? 1.0 : 0.0 },
                uEffectAmplitude: { value: config.effectAmplitude },
                uEnableFade: { value: config.enableFade ? 1.0 : 0.0 }
            }
        });
        line.polyline.mesh.setParent(scene);
        lines.push(line);
    });

    resize();

    const mouse = new Vec3();
    let frameId;
    let lastTime = performance.now();

    function updateMouse(e) {
        if (!container) return;
        let x, y;
        const rect = container.getBoundingClientRect();
        if (e.changedTouches && e.changedTouches.length) {
            x = e.changedTouches[0].clientX - rect.left;
            y = e.changedTouches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }
        const width = container.clientWidth;
        const height = container.clientHeight;
        mouse.set((x / width) * 2 - 1, (y / height) * -2 + 1, 0);
    }

    // Attach to window mostly for smoother effect, or container if preferred
    window.addEventListener('mousemove', updateMouse);
    window.addEventListener('touchstart', updateMouse, { passive: true });
    window.addEventListener('touchmove', updateMouse, { passive: true });

    const tmp = new Vec3();

    function update() {
        frameId = requestAnimationFrame(update);
        const currentTime = performance.now();
        const dt = currentTime - lastTime;
        lastTime = currentTime;

        lines.forEach(line => {
            tmp.copy(mouse).add(line.mouseOffset).sub(line.points[0]).multiply(line.spring);
            line.mouseVelocity.add(tmp).multiply(line.friction);
            line.points[0].add(line.mouseVelocity);

            for (let i = 1; i < line.points.length; i++) {
                line.points[i].lerp(line.points[i - 1], 0.9);
            }
            if (line.polyline.mesh.program.uniforms.uTime) {
                line.polyline.mesh.program.uniforms.uTime.value = currentTime * 0.001;
            }
            line.polyline.updateGeometry();
        });

        renderer.render({ scene });
    }
    update();

    // Clean up function
    return () => {
        window.removeEventListener('resize', resize);
        window.removeEventListener('mousemove', updateMouse);
        window.removeEventListener('touchstart', updateMouse);
        window.removeEventListener('touchmove', updateMouse);
        cancelAnimationFrame(frameId);
        if (gl.canvas && gl.canvas.parentNode === container) {
            container.removeChild(gl.canvas);
        }
    };
}
