/* Web concept generator — clickable prototype.
   Everything "generated" here is faked on timers, except the colour palette,
   which is really extracted from the dropped image. */
(function () {
  const { HISTORY_SEED, PACKS, FONT_PAIRS, PRESETS } = window.WCG;
  const $ = (s, r) => (r || document).querySelector(s);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const app = $('#app'), board = $('#board'), field = $('#field');
  const input = $('#domain'), goBtn = $('#go');
  const pop = $('#pop'), historyEl = $('#history'), stepsEl = $('#steps'), hintEl = $('#hint');
  const popStyle = $('#pop-style'), stepsStyle = $('#steps-style');
  const strip = $('#strip'), dz = $('#dz'), file = $('#file');

  const CONTENT_STEPS = ['Loading sitemap', 'Analyzing content', 'Defining service areas', 'Finding images', 'Summarizing findings'];
  const STYLE_STEPS = ['Extracting colors', 'Defining typography', 'Analyzing spacing', 'Detecting layout', 'Saving aesthetic', 'Summarizing design system'];

  const state = { phase: 'idle', styles: [], style: null, content: null, active: -1, items: [] };

  /* ───────── helpers ───────── */
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const icons = () => window.lucide && window.lucide.createIcons({ attrs: { 'stroke-width': 1.7 } });
  const setPhase = (p) => { state.phase = p; app.dataset.phase = p; };
  const withTransition = (fn) => {
    if (document.startViewTransition && !reduced) {
      const t = document.startViewTransition(fn);
      [t.ready, t.finished, t.updateCallbackDone].forEach((p) => p.catch(() => {}));
    } else fn();
  };
  const rel = (ts) => {
    const m = Math.round((Date.now() - ts) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + ' min ago';
    const h = Math.round(m / 60);
    if (h < 24) return h + ' hr ago';
    return Math.round(h / 24) + ' d ago';
  };

  /* ───────── history ───────── */
  const HKEY = 'wcg.history';
  function loadHistory() {
    try {
      const raw = localStorage.getItem(HKEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* storage unavailable */ }
    return HISTORY_SEED.map((h) => ({ domain: h.domain, ts: Date.now() - h.ago }));
  }
  let history = loadHistory();
  function saveHistory() { try { localStorage.setItem(HKEY, JSON.stringify(history)); } catch (e) { /* ignore */ } }
  function touchHistory(domain) {
    history = [{ domain, ts: Date.now() }].concat(history.filter((h) => h.domain !== domain)).slice(0, 8);
    saveHistory();
  }

  /* ───────── popover: history ───────── */
  function showPanel(which) {
    pop.hidden = which === null;
    historyEl.hidden = which !== 'history';
    stepsEl.hidden = which !== 'steps';
    hintEl.hidden = which !== 'hint';
    input.setAttribute('aria-expanded', String(which === 'history'));
  }
  function renderHistory() {
    const q = input.value.trim().toLowerCase();
    state.items = history.filter((h) => !q || h.domain.includes(q)).slice(0, 5);
    state.active = -1;
    if (!state.items.length) { showPanel(null); return; }
    historyEl.innerHTML = state.items.map((h, i) =>
      `<li role="presentation"><button type="button" class="row" role="option" id="h${i}" data-i="${i}" aria-selected="false">
         <i data-lucide="globe" class="ico" aria-hidden="true"></i><span class="txt mono">${esc(h.domain)}</span><span class="meta">${rel(h.ts)}</span>
       </button></li>`).join('');
    icons();
    showPanel('history');
  }
  function moveActive(d) {
    if (!state.items.length) return;
    state.active = (state.active + d + state.items.length) % state.items.length;
    historyEl.querySelectorAll('.row').forEach((r, i) => r.setAttribute('aria-selected', String(i === state.active)));
    input.setAttribute('aria-activedescendant', 'h' + state.active);
  }

  /* ───────── progress steps ───────── */
  const ICO_DONE = '<svg class="step-ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-dasharray="3.3 3.3"/><path d="m8.5 12.4 2.5 2.5 4.5-5"/></svg>';
  const ICO_RUN = '<svg class="step-ico" viewBox="0 0 24 24"><circle class="spin" cx="12" cy="12" r="10" stroke-dasharray="3.3 3.3"/><path d="M12 7v5l3.2 2"/></svg>';
  const ICO_WAIT = '<svg class="step-ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-dasharray="3.3 3.3"/></svg>';

  async function runSteps(ol, labels, minMs, maxMs) {
    ol.innerHTML = labels.map((l) =>
      `<li class="row state-pending"><span class="ico">${ICO_WAIT}</span><span class="txt">${esc(l)}</span><span class="meta"></span></li>`).join('');
    const rows = [...ol.children];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      row.className = 'row state-running';
      row.querySelector('.ico').innerHTML = ICO_RUN;
      const ms = reduced ? 120 : minMs + Math.random() * (maxMs - minMs);
      await wait(ms);
      row.className = 'row state-done';
      row.querySelector('.ico').innerHTML = ICO_DONE;
      row.querySelector('.meta').textContent = (ms / 1000).toFixed(1) + 's';
    }
    await wait(reduced ? 0 : 350);
  }

  /* ───────── content generation (faked) ───────── */
  function normalize(raw) {
    let d = raw.trim().toLowerCase().replace(/^[a-z]+:\/\//, '').replace(/^www\./, '').split(/[/?#]/)[0];
    return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d) ? d : null;
  }
  function businessName(domain, pack) {
    const known = HISTORY_SEED.find((h) => h.domain === domain);
    if (known) return known.name;
    let base = domain.split('.').slice(0, -1).join(' ');
    const m = base.match(pack.match);
    if (m && pack.id !== 'generic' && !base.includes('-') && m.index > 0 && !/\s/.test(base)) {
      base = base.slice(0, m.index) + ' ' + base.slice(m.index);
    }
    return base.replace(/[-_.]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
  function generateContent(domain) {
    const pack = PACKS.find((p) => p.match.test(domain)) || PACKS[PACKS.length - 1];
    return Object.assign({}, pack, { name: businessName(domain, pack), domain });
  }

  /* ───────── concept page templates ───────── */
  function img(seed) {
    const o = seed % 3;
    const paths = [
      ['M0 170 Q100 110 200 160 T400 140 V250 H0Z', 'M0 205 Q120 150 240 197 T400 182 V250H0Z', 'M0 232 Q150 192 300 226 T400 216 V250H0Z'],
      ['M0 150 Q90 190 200 140 T400 170 V250 H0Z', 'M0 190 Q140 140 260 190 T400 165 V250H0Z', 'M0 228 Q120 205 280 230 T400 210 V250H0Z'],
      ['M0 185 Q120 120 230 170 T400 120 V250 H0Z', 'M0 210 Q100 170 220 205 T400 190 V250H0Z', 'M0 238 Q160 205 300 236 T400 222 V250H0Z'],
    ][o];
    return `<div class="img${seed % 2 ? ' flip' : ''}"><svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <circle cx="${90 + o * 70}" cy="72" r="30" fill="var(--c-accent)" opacity=".9"/>
      <path d="${paths[0]}" fill="var(--i1)"/><path d="${paths[1]}" fill="var(--i2)"/><path d="${paths[2]}" fill="var(--i3)"/></svg></div>`;
  }
  const nav = (c) => `<header class="nav"><span class="brand">${esc(c.name)}</span><ul>${c.nav.map((n) => `<li>${esc(n)}</li>`).join('')}</ul><span class="btn">${esc(c.cta)}</span></header>`;
  const PAGES = {
    home: (c) => `<div class="page home">${nav(c)}
      <section class="hero"><div><h1>${esc(c.homeTitle)}</h1></div><div><p class="lede">${esc(c.homeBlurb)}</p><span class="btn">${esc(c.cta)}</span></div></section>
      ${img(0).replace('class="img', 'class="img hero-img')}
      <div class="facts">${c.facts.map((f) => `<div><b>${esc(f[0])}</b><span>${esc(f[1])}</span></div>`).join('')}</div></div>`,
    services: (c) => `<div class="page services">${nav(c)}
      <div class="banner">${img(1)}<h2>${esc(c.bannerTitle)}</h2></div>
      <div class="cards">${c.services.map((s, i) => `<article class="card">${img(i + 2)}<h3>${esc(s[0])}</h3><p>${esc(s[1])}</p></article>`).join('')}</div></div>`,
    details: (c) => `<div class="page details">${nav(c)}
      <section class="d-top">${img(2)}<div><h1>${esc(c.detailTitle)}</h1><p>${esc(c.detailBlurb)}</p></div></section>
      <section class="d-body"><div class="byline"><span class="avatar">${esc(c.byline[0][0])}</span><div><b>${esc(c.byline[0])}</b><span>${esc(c.byline[1])}</span></div></div>
        <div class="prose"><p>${esc(c.body[0])}</p><h4>${esc(c.subhead)}</h4><p>${esc(c.body[1])}</p></div></section></div>`,
  };
  function scalePages() {
    board.querySelectorAll('.concept').forEach((card) => {
      const w = card.getBoundingClientRect().width;
      const pw = card.querySelector('.page-wrap');
      if (pw && w) pw.style.transform = `scale(${w / 1440})`;
    });
  }
  new ResizeObserver(scalePages).observe(board);

  function renderConcepts(c) {
    board.querySelectorAll('.concept').forEach((card) => {
      $('.page-slot', card).innerHTML = `<div class="page-wrap">${PAGES[card.dataset.page](c)}</div>`;
    });
    board.classList.remove('is-skeleton');
    scalePages();
  }
  function resetConcepts() {
    board.classList.add('is-skeleton');
    board.querySelectorAll('.page-slot').forEach((s) => { s.innerHTML = ''; });
  }

  /* ───────── styles ───────── */
  function cardVars(s) {
    const p = s.palette;
    return `--bg:${p.bg};--surface:${p.surface};--ink:${p.ink};--accent:${p.accent};--fd:${s.fonts.display};--fb:${s.fonts.body};--dw:${s.fonts.dw}`;
  }
  function renderStyles(newId) {
    strip.innerHTML = state.styles.map((s) =>
      `<button type="button" class="style-card${s.id === newId ? ' is-new' : ''}" role="radio" aria-checked="${s.id === (state.style && state.style.id)}" data-id="${s.id}" style="${cardVars(s)}" aria-label="${esc(s.name)}, ${s.vibe.join(', ')}, ${s.layout} layout">
         <div class="sw"><i class="s1"></i><i class="s2"></i><i class="s3"></i></div>
         <div class="aa"><b>Aa</b><span>Aa</span></div>
         <footer><span class="nm">${esc(s.name)}</span><span class="chip">${esc(s.layout)}</span></footer>
       </button>`).join('');
  }
  function renderStyleSkeleton() {
    strip.innerHTML = '<div class="style-skel"></div>'.repeat(6);
  }
  function applyStyle(s) {
    state.style = s;
    const p = s.palette, st = board.style;
    st.setProperty('--c-bg', p.bg); st.setProperty('--c-surface', p.surface); st.setProperty('--c-ink', p.ink);
    st.setProperty('--c-muted', p.muted); st.setProperty('--c-accent', p.accent); st.setProperty('--c-accent-ink', p.accentInk);
    st.setProperty('--f-display', s.fonts.display); st.setProperty('--f-body', s.fonts.body);
    st.setProperty('--dw', s.fonts.dw); st.setProperty('--dcase', s.fonts.dcase); st.setProperty('--dtrack', s.fonts.dtrack);
    st.setProperty('--space', s.space); st.setProperty('--radius', s.radius + 'px');
    board.dataset.layout = s.layout;
    strip.querySelectorAll('.style-card').forEach((c) => c.setAttribute('aria-checked', String(c.dataset.id === s.id)));
  }
  strip.addEventListener('click', (e) => {
    const c = e.target.closest('.style-card');
    if (!c || state.phase === 'extracting') return;
    const s = state.styles.find((x) => x.id === c.dataset.id);
    if (s && s !== state.style) withTransition(() => applyStyle(s));
  });
  strip.addEventListener('keydown', (e) => {
    if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
    const cards = [...strip.querySelectorAll('.style-card')];
    const i = cards.indexOf(document.activeElement);
    if (i < 0) return;
    const n = cards[(i + (e.key === 'ArrowRight' ? 1 : -1) + cards.length) % cards.length];
    n.focus(); n.click(); e.preventDefault();
  });

  /* ───────── generate flow ───────── */
  async function submit(raw) {
    if (state.phase === 'loading' || state.phase === 'extracting') return;
    const domain = normalize(raw);
    if (!domain) {
      field.dataset.invalid = '';
      hintEl.textContent = 'Enter a website address, like example.com';
      showPanel('hint');
      return;
    }
    delete field.dataset.invalid;
    input.value = domain; input.blur(); input.disabled = true;
    goBtn.hidden = false;
    setPhase('loading');
    resetConcepts();
    if (!state.styles.length) renderStyleSkeleton();
    showPanel('steps');
    await runSteps(stepsEl, CONTENT_STEPS, 700, 1400);
    showPanel(null);
    touchHistory(domain);
    state.content = generateContent(domain);
    withTransition(() => {
      if (!state.styles.length) { state.styles = PRESETS.slice(); state.style = state.styles[0]; }
      renderStyles();
      applyStyle(state.style);
      renderConcepts(state.content);
    });
    input.disabled = false;
    setPhase('loaded');
  }

  /* ───────── events: search ───────── */
  input.addEventListener('focus', () => { if (state.phase !== 'loading') renderHistory(); });
  input.addEventListener('input', () => {
    goBtn.hidden = !input.value.trim();
    delete field.dataset.invalid;
    renderHistory();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (pop.hidden) renderHistory(); moveActive(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveActive(-1); }
    else if (e.key === 'Escape') showPanel(null);
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (state.active >= 0 && state.items[state.active]) input.value = state.items[state.active].domain;
      submit(input.value);
    }
  });
  historyEl.addEventListener('mousedown', (e) => e.preventDefault());
  historyEl.addEventListener('click', (e) => {
    const r = e.target.closest('.row');
    if (r) submit(state.items[+r.dataset.i].domain);
  });
  goBtn.addEventListener('click', () => submit(input.value));
  document.addEventListener('click', (e) => {
    if (state.phase !== 'loading' && !e.target.closest('.search')) showPanel(null);
  });

  /* ───────── image → style extraction ───────── */
  const hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  const parse = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const lum = (rgb) => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
  const contrast = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const sat = (rgb) => { const mx = Math.max(...rgb), mn = Math.min(...rgb); return mx === 0 ? 0 : (mx - mn) / mx; };
  const bright = (rgb) => (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  /* Push `fg` away from `bg` (towards black or white) until it reaches `min` contrast. */
  function ensureContrast(fg, bg, min) {
    const target = lum(bg) > 0.4 ? [10, 10, 10] : [250, 250, 250];
    let out = fg, t = 0;
    while (contrast(out, bg) < min && t < 1) { t += 0.05; out = mix(fg, target, t); }
    return out;
  }

  function loadImage(f) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(f), im = new Image();
      im.onload = () => { URL.revokeObjectURL(url); resolve(im); };
      im.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image')); };
      im.src = url;
    });
  }
  function kmeans(px, k) {
    const cs = []; for (let i = 0; i < k; i++) cs.push(px[Math.floor((i + 0.5) * px.length / k)].slice());
    let asg = new Array(px.length).fill(0);
    for (let it = 0; it < 8; it++) {
      px.forEach((p, i) => {
        let best = 0, bd = Infinity;
        cs.forEach((c, j) => { const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (d < bd) { bd = d; best = j; } });
        asg[i] = best;
      });
      const sums = cs.map(() => [0, 0, 0, 0]);
      px.forEach((p, i) => { const s = sums[asg[i]]; s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++; });
      sums.forEach((s, j) => { if (s[3]) cs[j] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]]; });
    }
    const counts = cs.map(() => 0); asg.forEach((a) => counts[a]++);
    return cs.map((c, j) => ({ rgb: c, w: counts[j] / px.length })).filter((c) => c.w > 0);
  }

  async function extractStyle(f) {
    const im = await loadImage(f);
    const N = 64, cv = document.createElement('canvas'); cv.width = cv.height = N;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    const sc = Math.max(N / im.width, N / im.height), w = im.width * sc, h = im.height * sc;
    ctx.drawImage(im, (N - w) / 2, (N - h) / 2, w, h);
    const data = ctx.getImageData(0, 0, N, N).data;
    const px = [], gray = new Float32Array(N * N);
    for (let i = 0; i < N * N; i++) {
      const p = [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]];
      px.push(p); gray[i] = bright(p);
    }
    /* traits */
    const meanL = gray.reduce((a, b) => a + b, 0) / gray.length;
    const stdL = Math.sqrt(gray.reduce((a, b) => a + (b - meanL) ** 2, 0) / gray.length);
    const meanS = px.reduce((a, p) => a + sat(p), 0) / px.length;
    const warmth = px.reduce((a, p) => a + (p[0] - p[2]), 0) / px.length / 255;
    let edge = 0;
    for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
      const i = y * N + x;
      edge += Math.abs(gray[i + 1] - gray[i - 1]) + Math.abs(gray[i + N] - gray[i - N]);
    }
    edge /= (N - 2) * (N - 2) * 2;
    let sym = 0;
    for (let y = 0; y < N; y++) for (let x = 0; x < N / 2; x++) sym += 1 - Math.abs(gray[y * N + x] - gray[y * N + (N - 1 - x)]);
    sym /= N * (N / 2);

    /* palette roles */
    const cl = kmeans(px, 6).sort((a, b) => b.w - a.w);
    const dark = meanL < 0.42;
    const byL = cl.slice().sort((a, b) => bright(a.rgb) - bright(b.rgb));
    const lowSat = (c) => sat(c.rgb) < 0.38;
    let bg = (dark ? byL.find(lowSat) : byL.slice().reverse().find(lowSat)) || (dark ? byL[0] : byL[byL.length - 1]);
    let bgRgb = bg.rgb;
    if (!dark) bgRgb = mix(bgRgb, [255, 255, 255], 0.55); else bgRgb = mix(bgRgb, [0, 0, 0], 0.6);
    const inkSrc = (dark ? byL[byL.length - 1] : byL[0]).rgb;
    let inkRgb = ensureContrast(dark ? mix(inkSrc, [255, 255, 255], 0.75) : mix(inkSrc, [0, 0, 0], 0.7), bgRgb, 9);
    const accentC = cl.filter((c) => c !== bg).sort((a, b) => sat(b.rgb) * (1 + b.w) - sat(a.rgb) * (1 + a.w))[0] || cl[0];
    let accentRgb = ensureContrast(accentC.rgb, bgRgb, 3);
    const accentInk = contrast([255, 255, 255], accentRgb) >= contrast([10, 10, 10], accentRgb) ? [255, 255, 255] : [10, 10, 10];
    const surfaceRgb = mix(bgRgb, inkRgb, dark ? 0.08 : 0.07);
    const mutedRgb = ensureContrast(mix(inkRgb, bgRgb, 0.35), surfaceRgb, 4.8);
    const palette = {
      bg: hex(...bgRgb), surface: hex(...surfaceRgb), ink: hex(...inkRgb), muted: hex(...mutedRgb),
      accent: hex(...accentRgb), accentInk: hex(...accentInk),
    };

    /* layout (heuristic stand-in for the model) */
    let layout;
    if (sym > 0.9) layout = 'symmetrical';
    else if (stdL > 0.27 && meanS > 0.42) layout = 'avant-garde';
    else if (edge < 0.035 && meanS < 0.35) layout = 'clean';
    else if (meanS < 0.28 && warmth > 0) layout = 'traditional';
    else if (edge > 0.1) layout = 'overlapping';
    else layout = 'asymmetrical';

    /* fonts, spacing, radius, vibe (heuristic stand-ins) */
    const fontKey = dark && layout !== 'avant-garde' ? 'noir' : ({
      symmetrical: 'editorial', asymmetrical: 'verdant', clean: 'coastal',
      overlapping: 'midcentury', traditional: 'editorial', 'avant-garde': 'brutalist',
    })[layout];
    const f0 = FONT_PAIRS[fontKey];
    const space = +(edge < 0.05 ? 1.3 : edge > 0.1 ? 0.88 : 1).toFixed(2);
    const radius = { clean: 14, traditional: 2, 'avant-garde': 0, overlapping: 20, symmetrical: 6, asymmetrical: 10 }[layout];
    const vibe = [
      dark ? 'Moody' : meanL > 0.7 ? 'Airy' : 'Grounded',
      meanS > 0.5 ? 'Vivid' : warmth > 0.05 ? 'Warm' : warmth < -0.05 ? 'Cool' : 'Muted',
    ];
    const name = f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim().slice(0, 22) || 'Image style';
    return {
      id: 'x' + Date.now().toString(36), name: name.charAt(0).toUpperCase() + name.slice(1), vibe, layout, palette,
      fonts: { display: f0.display, body: f0.body, dw: f0.dw, dcase: f0.dcase, dtrack: f0.dtrack }, space, radius,
    };
  }

  async function handleImage(f) {
    if (state.phase !== 'loaded' || !f || !f.type.startsWith('image/')) return;
    setPhase('extracting');
    popStyle.hidden = false;
    const job = extractStyle(f).then((s) => ({ s }), (err) => ({ err }));
    await runSteps(stepsStyle, STYLE_STEPS, 550, 1100);
    const res = await job;
    popStyle.hidden = true;
    if (res.err) {
      setPhase('loaded');
      field.dataset.invalid = '';
      hintEl.textContent = res.err.message;
      showPanel('hint');
      setTimeout(() => { delete field.dataset.invalid; showPanel(null); }, 2600);
      return;
    }
    state.styles.unshift(res.s);
    withTransition(() => { state.style = res.s; renderStyles(res.s.id); applyStyle(res.s); strip.scrollTo({ left: 0 }); });
    setPhase('loaded');
  }

  /* ───────── events: dropzone ───────── */
  let depth = 0;
  const hasFiles = (e) => e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files');
  window.addEventListener('dragenter', (e) => { if (hasFiles(e)) { depth++; if (state.phase === 'loaded') dz.classList.add('drag'); } });
  window.addEventListener('dragleave', (e) => { if (hasFiles(e) && --depth <= 0) { depth = 0; dz.classList.remove('drag'); } });
  window.addEventListener('dragover', (e) => { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener('drop', (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault(); depth = 0; dz.classList.remove('drag');
    handleImage(e.dataTransfer.files[0]);
  });
  $('#dz-hint').addEventListener('click', () => file.click());
  file.addEventListener('change', () => { handleImage(file.files[0]); file.value = ''; });
  document.addEventListener('paste', (e) => {
    const item = [...(e.clipboardData ? e.clipboardData.items : [])].find((i) => i.type.startsWith('image/'));
    if (item) handleImage(item.getAsFile());
  });

  /* ───────── init ───────── */
  renderStyleSkeleton();
  icons();
  window.addEventListener('load', icons);
  window.WCG.debug = { state, submit, handleImage };
})();
