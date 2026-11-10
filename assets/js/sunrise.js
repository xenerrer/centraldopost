/* Nascer do sol em WebGL: o horizonte verde-limão sobe com a rolagem
   e o brilho da borda segue o ponteiro. Sem WebGL, fica o gradiente do CSS.
   Uso: <canvas class="sky" data-sunrise></canvas> dentro de uma seção posicionada.
   data-sunrise=""      → sobe enquanto a seção sai pelo topo (hero)
   data-sunrise="enter" → sobe enquanto a seção atravessa a tela (seções do meio) */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;

  const vert = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;
  const frag = `
precision highp float;
uniform vec2 u_res; uniform float u_time; uniform vec2 u_mouse; uniform float u_rise;
const vec3 BG = vec3(0.976,0.984,0.969);
const vec3 LIME = vec3(0.639,0.882,0.341);
const vec3 HI = vec3(0.835,0.965,0.643);
const vec3 DEEP = vec3(0.47,0.76,0.22);
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  float ar = u_res.x / u_res.y;
  vec2 p = vec2(uv.x * ar, uv.y);
  bool portrait = ar < 1.0;
  vec2 c = portrait ? vec2(ar*0.5, -0.62 + u_rise*0.18) : vec2(ar*0.80, -1.02 + u_rise*0.22);
  float R = portrait ? 0.9 : 1.42;
  vec2 dp = p - c;
  float d = length(dp) - R;

  /* dobras de seda dentro do "sol" */
  float t = u_time * 0.07;
  vec2 q = p * 2.4;
  float f = sin(q.x*1.5 + sin(q.y*2.1 + t*2.0)*1.5 + t*3.0)
          + sin(q.y*2.7 - q.x*0.8 + sin(q.x*1.2 - t*2.4)*1.3);
  f = f * 0.25 + 0.5;
  float depth = clamp(-d * 1.4, 0.0, 1.0);
  vec3 inside = mix(LIME, HI, smoothstep(0.15, 0.95, f) * (1.0 - depth*0.6));
  inside = mix(inside, DEEP, depth * 0.45);

  /* luz da borda que acompanha o ponteiro */
  float ang = atan(dp.y, dp.x);
  vec2 mp = vec2(u_mouse.x * ar, u_mouse.y) - c;
  float near = exp(-pow((ang - atan(mp.y, mp.x)) * 2.6, 2.0));

  float edge = smoothstep(0.003, -0.003, d);
  float halo = exp(-max(d, 0.0) * 4.2) * (1.0 - edge);
  float limb = exp(-abs(d) * 34.0);

  vec3 col = BG;
  col = mix(col, HI, halo * (0.38 + 0.25*near));
  col = mix(col, inside, edge);
  col = mix(col, vec3(1.0), limb * (0.55 + 0.45*near) * edge);
  col = mix(col, DEEP, exp(-abs(d+0.004)*260.0) * 0.35);

  col += (h(gl_FragCoord.xy + fract(u_time)) - 0.5) * 0.018; /* grão */
  gl_FragColor = vec4(col, 1.0);
}`;

  function init(canvas) {
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'low-power' });
    if (!gl) return;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    const vs = sh(gl.VERTEX_SHADER, vert), fs = sh(gl.FRAGMENT_SHADER, frag);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const U = n => gl.getUniformLocation(prog, n);
    const uRes = U('u_res'), uTime = U('u_time'), uMouse = U('u_mouse'), uRise = U('u_rise');

    const host = canvas.parentElement;
    const mode = canvas.dataset.sunrise;
    let w = 0, h = 0, visible = false, raf = 0;
    const mouse = { x: 0.62, y: 0.55, tx: 0.62, ty: 0.55 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, fine ? 1.5 : 1);   /* celular: 1x poupa GPU e bateria */
      const r = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width * dpr)); h = Math.max(1, Math.round(r.height * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
    };
    const riseOf = () => {
      const r = host.getBoundingClientRect();
      const v = mode === 'enter'
        ? (innerHeight - r.top) / (innerHeight + r.height)
        : -r.top / Math.max(1, r.height);
      return Math.min(1, Math.max(0, v));
    };
    const draw = now => {
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uTime, now / 1000);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uRise, riseOf());
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const loop = now => { draw(now); raf = (visible && !reduce) ? requestAnimationFrame(loop) : 0; };
    const start = () => { if (!raf && visible && !reduce && !document.hidden) raf = requestAnimationFrame(loop); };

    resize();
    draw(performance.now());                 /* primeiro quadro já pintado: nunca fica preto */
    canvas.style.background = 'none';
    addEventListener('resize', () => { resize(); draw(performance.now()); }, { passive: true });

    if (fine) {
      host.addEventListener('pointermove', e => {
        const r = host.getBoundingClientRect();
        mouse.tx = (e.clientX - r.left) / r.width;
        mouse.ty = 1 - (e.clientY - r.top) / r.height;
      }, { passive: true });
    }
    if (reduce) return;

    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start(); else { cancelAnimationFrame(raf); raf = 0; }
    }).observe(host);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else start();
    });
  }

  document.querySelectorAll('[data-sunrise]').forEach(init);
})();
