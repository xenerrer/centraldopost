/* Central do Post — interações da v1 */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- rolagem suave (Lenis) ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.1, easing: t => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      if (target.matches('[data-morph].is-ready')) {        /* "Exemplos" cai direto no arco já montado */
        lenis.scrollTo(target.getBoundingClientRect().top + scrollY + (target.offsetHeight - innerHeight) * 0.66);
        return;
      }
      lenis.scrollTo(target, { offset: -84 });
    }));
  }

  /* ---------- hero: título palavra por palavra + marca-texto ---------- */
  let wi = 0;
  $$('[data-split]').forEach(line => {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const s = document.createElement('span');
            s.className = 'wd'; s.style.setProperty('--d', wi++); s.textContent = part;
            frag.append(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(line);
  });

  const heroIn = () => {
    $$('[data-split]').forEach(l => l.classList.add('is-in'));
    setTimeout(() => $('.mark')?.classList.add('is-on'), 200);
    $$('.hero [data-fade]').forEach((el, i) => setTimeout(() => el.classList.add('is-in'), 380 + i * 110));
    playChat();
  };
  (document.fonts?.ready ?? Promise.resolve()).then(() => requestAnimationFrame(heroIn));

  /* ---------- outras revelações ---------- */
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -10% 0px' });
  $$('[data-fade]').filter(el => !el.closest('.hero')).forEach(el => io.observe(el));

  /* ---------- conversa do WhatsApp ---------- */
  function playChat() {
    const body = $('[data-chat]');
    if (!body) return;
    const msgs = $$('[data-msg]', body);
    if (reduce) { msgs.forEach(m => m.classList.add('is-in')); return; }
    const typing = document.createElement('div');
    typing.className = 'typing'; typing.setAttribute('aria-hidden', 'true');
    typing.innerHTML = '<i></i><i></i><i></i>';
    let t = 700;
    msgs.forEach((m, i) => {
      const incoming = m.classList.contains('msg--in');
      if (incoming && i !== 2) {
        setTimeout(() => { m.before(typing); typing.style.display = ''; }, t);
        t += 900;
      }
      setTimeout(() => {
        typing.style.display = 'none';
        m.classList.add('is-in');
      }, t);
      t += i === 1 ? 700 : 1100;
    });
  }

  /* ---------- celular inclina com o ponteiro (mola suave) ---------- */
  const phone = $('.phone');
  if (phone && fine && !reduce) {
    const hero = $('.hero');
    let tx = 0, ty = 0, x = 0, y = 0, run = false;
    const step = () => {
      x += (tx - x) * 0.08; y += (ty - y) * 0.08;
      phone.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
      if (Math.abs(tx - x) > 0.01 || Math.abs(ty - y) > 0.01) requestAnimationFrame(step); else run = false;
    };
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 14;
      ty = -((e.clientY - r.top) / r.height - 0.5) * 10;
      if (!run) { run = true; requestAnimationFrame(step); }
    });
    hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; if (!run) { run = true; requestAnimationFrame(step); } });
  }

  /* ---------- CTA do hero: luz segue o cursor + efeito ímã (mola) ---------- */
  if (fine && !reduce) $$('.btn--shine').forEach(btn => {
    let tx = 0, ty = 0, x = 0, y = 0, run = false;
    const step = () => {
      x += (tx - x) * 0.16; y += (ty - y) * 0.16;
      btn.style.translate = `${x.toFixed(2)}px ${y.toFixed(2)}px`;
      if (Math.abs(tx - x) > 0.05 || Math.abs(ty - y) > 0.05) requestAnimationFrame(step); else run = false;
    };
    const kick = () => { if (!run) { run = true; requestAnimationFrame(step); } };
    const track = e => {
      const r = btn.getBoundingClientRect();
      const px = e.clientX - r.left + x, py = e.clientY - r.top + y;   /* desconta o próprio deslocamento */
      btn.style.setProperty('--mx', px + 'px');
      btn.style.setProperty('--my', py + 'px');
      tx = (px - r.width / 2) * 0.12;
      ty = (py - r.height / 2) * 0.28;
      kick();
    };
    btn.addEventListener('pointerenter', track);
    btn.addEventListener('pointermove', track);
    btn.addEventListener('pointerleave', () => { tx = 0; ty = 0; kick(); });
  });

  /* ---------- pílulas em movimento contínuo ---------- */
  const rows = $$('[data-marquee]').map(row => {
    const track = $('.pills__track', row);
    for (let k = 0; k < 3; k++) { const c = track.cloneNode(true); c.setAttribute('aria-hidden', 'true'); row.append(c); }
    return { row, dir: +row.dataset.marquee, w: 0, x: 0 };
  });
  const measure = () => rows.forEach(r => { r.w = $('.pills__track', r.row).getBoundingClientRect().width; r.x = r.dir > 0 ? -r.w : 0; });
  measure(); addEventListener('resize', measure, { passive: true });
  if (!reduce && rows.length) {
    let boost = 0;
    lenis?.on('scroll', e => { boost = Math.min(6, Math.abs(e.velocity) * 0.25); });
    const tick = () => {
      rows.forEach(r => {
        r.x += r.dir * (0.45 + boost);
        if (r.dir < 0 && r.x <= -r.w) r.x += r.w;
        if (r.dir > 0 && r.x >= 0) r.x -= r.w;
        r.row.style.transform = `translate3d(${r.x}px,0,0)`;
      });
      boost *= 0.92;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- números que contam ---------- */
  const fmt = (v, el) => {
    const dec = +(el.dataset.decimals || 0);
    let s = dec ? v.toFixed(dec).replace('.', ',') : Math.round(v).toLocaleString('pt-BR');
    return (el.dataset.prefix || '') + s + (el.dataset.suffix || '');
  };
  const counter = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, end = +el.dataset.count, final = el.textContent;
    counter.unobserve(el);
    if (reduce) return;
    const t0 = performance.now(), dur = 1400;
    const run = now => {
      const p = Math.min(1, (now - t0) / dur), k = 1 - Math.pow(1 - p, 4);
      el.textContent = p < 1 ? fmt(end * k, el) : final;
      if (p < 1) requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  }), { threshold: 0.6 });
  $$('[data-count]').forEach(el => counter.observe(el));

  /* ---------- comparar antes × depois ---------- */
  const cmp = $('[data-compare]');
  if (cmp) {
    const range = $('[data-compare-range]', cmp);
    const set = v => cmp.style.setProperty('--pos', v + '%');
    range.addEventListener('input', () => set(range.value));
    if (!reduce) {
      const hint = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        hint.disconnect();
        const keys = [[0, 50], [700, 78], [1500, 30], [2200, 50]];
        const t0 = performance.now();
        const run = now => {
          const t = now - t0;
          let i = keys.findIndex(k => k[0] > t);
          if (i === -1) { set(50); range.value = 50; return; }
          const [ta, va] = keys[i - 1], [tb, vb] = keys[i];
          const p = (t - ta) / (tb - ta), k = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
          const v = va + (vb - va) * k; set(v); range.value = v;
          requestAnimationFrame(run);
        };
        requestAnimationFrame(run);
      }, { threshold: 0.6 });
      hint.observe(cmp);
    }
  }

  /* ---------- planos: mensal × anual ---------- */
  const billing = $('[data-billing]');
  if (billing) {
    const thumb = $('.toggle__thumb', billing);
    const btns = $$('button', billing);
    const place = btn => { thumb.style.setProperty('--x', btn.offsetLeft + 'px'); thumb.style.setProperty('--w', btn.offsetWidth + 'px'); };
    place(btns[0]);
    addEventListener('resize', () => place(btns.find(b => b.getAttribute('aria-checked') === 'true')), { passive: true });
    const choose = btn => {
      if (btn.getAttribute('aria-checked') === 'true') return;
      btns.forEach(b => { b.setAttribute('aria-checked', String(b === btn)); b.tabIndex = b === btn ? 0 : -1; });
      place(btn);
      const period = btn.dataset.period;
      const els = $$('[data-mensal]');
      els.forEach(el => el.classList.add('is-swapping'));
      setTimeout(() => {
        els.forEach(el => { el.textContent = el.dataset[period]; el.classList.remove('is-swapping'); });
      }, reduce ? 0 : 200);
    };
    btns.forEach((b, i) => {
      b.tabIndex = i === 0 ? 0 : -1;
      b.addEventListener('click', () => choose(b));
      b.addEventListener('keydown', e => {
        if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
        e.preventDefault();
        const n = btns[(i + (e.key === 'ArrowRight' ? 1 : btns.length - 1)) % btns.length];
        n.focus(); choose(n);
      });
    });
  }


  /* ---------- exemplos: scroll-morph ----------
     A rolagem conduz 4 estados: espalhadas → fileira → círculo (título no centro)
     → arco que gira e mostra todas as artes. Com movimento reduzido, fica a grade. */
  const morph = $('[data-morph]');
  if (morph && !reduce) {
    const sticky = $('.morph__sticky', morph);
    const head = $('.morph__head', morph);
    const stage = $('[data-morph-stage]', morph);
    const title = $('[data-morph-title]', morph);
    const more = $('[data-morph-more]', morph);
    const cap = $('[data-morph-caption]', morph);
    const capName = $('[data-cap-name]', morph);
    const base = $$('.morph__card', stage);
    base.forEach(c => {                                   /* segunda volta de artes, só visual */
      const n = c.cloneNode(true);
      n.setAttribute('aria-hidden', 'true'); n.setAttribute('inert', '');
      n.querySelector('.sr-only')?.remove();
      stage.append(n);
    });
    const cards = $$('.morph__card', stage);
    const N = cards.length, HALF = base.length, BW = 240, BH = 300;
    const c01 = v => Math.max(0, Math.min(1, v));
    const seg = (p, a, b) => c01((p - a) / (b - a));
    const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const stag = (t, i) => c01((t - (i / N) * 0.3) / 0.7);
    const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    const ang = (a, b, k) => a + ((((b - a) % 360) + 540) % 360 - 180) * k;     /* menor caminho */
    const mix = (a, b, k) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, r: ang(a.r, b.r, k), s: a.s + (b.s - a.s) * k });
    let W = 0, H = 0, G = {}, p = 0, mouse = 0, ms = 0, raf = 0, active = false, lastCap = -1;

    const layout = () => {
      W = sticky.clientWidth; H = sticky.clientHeight;
      const mobile = W < 760;
      morph.style.setProperty('--morph-h', mobile ? '260vh' : '300vh');
      title.style.transform = ''; more.style.transform = '';
      const headBottom = head.offsetTop + more.offsetTop + more.offsetHeight;
      const titleMid = head.offsetTop + title.offsetTop + title.offsetHeight / 2;
      const cardArc = mobile ? Math.min(124, W * 0.3) : Math.min(150, Math.max(112, W * 0.09));
      const capH = 36;
      const apex = Math.min(H - cardArc * 0.4, Math.max(H * 0.56, headBottom + 28 + capH + 10 + cardArc * 0.625));
      const Ra = mobile ? W * 0.95 : Math.max(W * 0.72, 700);
      const R = Math.min(W * (mobile ? 0.45 : 0.36), H * 0.38);
      const lineW = Math.min(W * 0.88, N * 72);
      G = {
        apex, Ra, cy: apex + Ra, dA: (cardArc * 1.06) / Ra, cardArc, R,
        cardCircle: Math.min((2 * Math.PI * R / N) * 0.62, mobile ? 46 : 84),
        lineW, cardLine: Math.min((lineW / N) * 0.86, 64),
        titleDy: H / 2 - titleMid,
      };
      G.span = G.dA * N;
      cap.style.top = (apex - cardArc * 0.625 - 14 - capH) + 'px';
    };

    const S0 = i => ({ x: W * (0.1 + 0.8 * rnd(i)), y: H * (0.2 + 0.6 * rnd(i + 50)), r: (rnd(i + 99) - 0.5) * 70, s: (G.cardCircle / BW) * 0.9 });
    const S1 = i => ({ x: W / 2 + (i - (N - 1) / 2) * (G.lineW / N), y: H / 2, r: 0, s: G.cardLine / BW });
    const S2 = (i, spin) => {
      const a = (i / N) * Math.PI * 2 - Math.PI / 2 + spin;
      return { x: W / 2 + Math.cos(a) * G.R, y: H / 2 + Math.sin(a) * G.R, r: (a * 180) / Math.PI + 90, s: G.cardCircle / BW };
    };
    const S3 = (i, rot) => {
      const phi = ((((i * G.dA - rot) % G.span) + G.span) % G.span) - G.span / 2;
      return { x: W / 2 + Math.sin(phi) * G.Ra, y: G.cy - Math.cos(phi) * G.Ra, r: (phi * 180) / Math.PI, s: G.cardArc / BW, phi };
    };

    const render = () => {
      const t1 = seg(p, 0, 0.12), t2 = seg(p, 0.12, 0.26), t3 = seg(p, 0.38, 0.58);
      const spin = seg(p, 0.12, 0.42) * 0.5;
      const rot = seg(p, 0.58, 1) * G.span * 0.7 + ms * G.dA * 2;
      let best = 1e9, bestI = 0;
      for (let i = 0; i < N; i++) {
        const d = S3(i, rot);
        let s = mix(S0(i), S1(i), ease(stag(t1, i)));
        s = mix(s, S2(i, spin), ease(stag(t2, i)));
        s = mix(s, d, ease(stag(t3, i)));
        cards[i].style.transform = `translate3d(${(s.x - BW / 2).toFixed(1)}px,${(s.y - BH / 2).toFixed(1)}px,0) rotate(${s.r.toFixed(2)}deg) scale(${s.s.toFixed(4)})`;
        if (Math.abs(d.phi) < best) { best = Math.abs(d.phi); bestI = i; }
      }
      const tk = ease(seg(p, 0.38, 0.56));
      title.style.transform = `translate3d(0,${(G.titleDy * (1 - tk)).toFixed(1)}px,0) scale(${(0.8 + 0.2 * tk).toFixed(3)})`;   /* menor dentro do círculo */
      title.style.opacity = ease(seg(p, 0.1, 0.22)).toFixed(3);
      const mk = ease(seg(p, 0.5, 0.62));
      more.style.opacity = mk.toFixed(3);
      more.style.transform = `translate3d(0,${((1 - mk) * 16).toFixed(1)}px,0)`;
      more.style.visibility = mk < 0.02 ? 'hidden' : 'visible';
      cap.style.opacity = ease(seg(p, 0.58, 0.66)).toFixed(3);
      if (bestI % HALF !== lastCap) { lastCap = bestI % HALF; capName.textContent = base[lastCap].dataset.cap; }
    };

    const progress = () => {
      const r = morph.getBoundingClientRect();
      return c01(-r.top / Math.max(1, r.height - H));
    };
    const tick = () => {
      p += (progress() - p) * 0.16;                /* suaviza a rolagem */
      ms += (mouse - ms) * 0.06;
      render();
      raf = active ? requestAnimationFrame(tick) : 0;
    };

    if (fine) sticky.addEventListener('pointermove', e => { mouse = e.clientX / W - 0.5; }, { passive: true });
    morph.classList.add('is-ready');
    layout(); p = progress(); render();
    const pre = new IntersectionObserver(([e]) => {        /* carrega as artes ~1,5 tela antes */
      if (!e.isIntersecting) return;
      pre.disconnect();
      $$('img[loading="lazy"]', stage).forEach(img => { img.loading = 'eager'; });
    }, { rootMargin: '150% 0px' });
    pre.observe(morph);
    new IntersectionObserver(([e]) => {
      active = e.isIntersecting;
      morph.classList.toggle('is-live', active);
      if (active && !raf) raf = requestAnimationFrame(tick);
    }, { rootMargin: '200px 0px' }).observe(morph);
    addEventListener('resize', () => { layout(); render(); }, { passive: true });
    addEventListener('load', () => { layout(); render(); });
  }

  /* ---------- vídeo ---------- */
  const dlg = $('[data-video-dialog]');
  $('[data-video-open]')?.addEventListener('click', () => {
    const frame = $('[data-video-frame]');
    const src = frame.dataset.videoSrc;
    if (src && !frame.querySelector('iframe')) {
      frame.innerHTML = `<iframe src="${src}" title="Vídeo de demonstração da Central do Post" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    }
    dlg.showModal();
  });
  dlg?.addEventListener('close', () => { const f = $('[data-video-frame] iframe'); if (f) f.src = f.src; });
  dlg?.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

  /* ---------- barra fixa no celular ---------- */
  const bar = $('[data-mobilebar]');
  if (bar) {
    const heroEl = $('.hero');
    let pastHero = false;
    const ends = new Set();
    const upd = () => bar.classList.toggle('is-shown', pastHero && ends.size === 0);
    new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting; upd(); }).observe(heroEl);
    const endIO = new IntersectionObserver(es => { es.forEach(e => e.isIntersecting ? ends.add(e.target) : ends.delete(e.target)); upd(); }, { rootMargin: '0px 0px -15% 0px' });
    [$('.final'), $('.footer'), $('#planos')].forEach(el => el && endIO.observe(el));
  }

  /* =========================================================
     Coreografia de rolagem (GSAP)
     ========================================================= */
  if (!hasGsap || reduce) return;
  const mm = gsap.matchMedia();

  /* parallax das imagens soltas */
  $$('[data-parallax]').forEach(el => {
    gsap.to(el, { y: +el.dataset.parallax, ease: 'none', scrollTrigger: { trigger: el.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* título do problema acende palavra por palavra:
     desktop acompanha a rolagem; celular/toque acende sozinho ao entrar na tela */
  $$('[data-words]').forEach(h => {
    let i = 0;
    h.innerHTML = h.textContent.split(/(\s+)/).map(p => /^\s+$/.test(p) ? p : `<span class="w" style="--i:${i++}">${p}</span>`).join('');
    h.classList.add('is-split');
  });
  mm.add('(min-width: 901px) and (pointer: fine)', () => {
    $$('[data-words]').forEach(h => {
      gsap.to($$('.w', h), { opacity: 1, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: h, start: 'top 80%', end: 'bottom 45%', scrub: true } });
    });
  });
  mm.add('(max-width: 900px), (pointer: coarse)', () => {
    const lit = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-lit'); lit.unobserve(e.target); }
    }), { threshold: 0.35 });
    $$('[data-words]').forEach(h => lit.observe(h));
    return () => lit.disconnect();
  });

  /* listas em cascata */
  $$('[data-stagger]').forEach(list => {
    gsap.from(list.children, { y: 18, opacity: 0, duration: 0.7, stagger: 0.07, ease: 'expo.out', scrollTrigger: { trigger: list, start: 'top 82%', once: true } });
  });
  gsap.from('.quote', { y: 24, opacity: 0, duration: 0.8, stagger: 0.06, ease: 'expo.out', scrollTrigger: { trigger: '.reviews__grid', start: 'top 80%', once: true } });
  gsap.from('.stat', { y: 24, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: '.stats__grid', start: 'top 80%', once: true } });

  /* como funciona: trilho horizontal fixado (desktop) */
  mm.add('(min-width: 901px)', () => {
    const pin = $('[data-how]'), track = $('[data-how-track]'), prog = $('[data-how-progress]');
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    const tl = gsap.timeline({ scrollTrigger: { trigger: pin, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.6, invalidateOnRefresh: true } });
    tl.to(track, { x: () => -dist(), ease: 'none' }, 0).to(prog, { scaleX: 1, ease: 'none' }, 0);
    gsap.from($$('.step', track), { opacity: 0.25, y: 30, stagger: 0.15, ease: 'none', scrollTrigger: { trigger: pin, start: 'top 70%', end: 'top top', scrub: true } });
  });

  /* vídeo: o portal abre até a borda */
  const portal = $('[data-portal]');
  if (portal) {
    gsap.fromTo(portal, { clipPath: () => `inset(4% ${getComputedStyle(document.documentElement).getPropertyValue('--gutter').trim() || '24px'} 4% round 40px)` },
      { clipPath: 'inset(0% 0px 0% round 0px)', ease: 'none', scrollTrigger: { trigger: portal, start: 'top 85%', end: 'top 10%', scrub: true } });
    gsap.fromTo($('.video__poster', portal), { scale: 1.18 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: portal, start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* objeções: o cartão de trás recua quando o próximo chega */
  const stack = $$('.stack__card');
  stack.forEach((card, i) => {
    const next = stack[i + 1];
    if (!next) return;
    gsap.to(card, { scale: 0.94, ease: 'none', scrollTrigger: { trigger: next, start: 'top 85%', end: 'top 30%', scrub: true } });
  });

  /* selo da garantia gira em 3D */
  const seal = $('.seal');
  if (seal) gsap.fromTo(seal, { rotateY: -28, rotateX: 12 }, { rotateY: 18, rotateX: -6, ease: 'none', scrollTrigger: { trigger: '[data-seal]', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* CTA final: título sobe com leve desfoque */
  gsap.from('.final__title', { y: 40, opacity: 0, filter: 'blur(8px)', duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.final', start: 'top 70%', once: true } });

  /* rodapé: a palavra emerge do horizonte (só no desktop) */
  mm.add('(min-width: 761px)', () => {
    gsap.fromTo('.footer__word', { yPercent: 45 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
