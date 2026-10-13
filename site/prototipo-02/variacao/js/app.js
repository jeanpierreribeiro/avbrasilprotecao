(function () {
'use strict';
/* ==========================================================================
   Protótipo 02 "Estrada Aberta" — comportamento e animação
   GSAP 3.13 + ScrollTrigger + SplitText + MotionPath + Lenis (todos locais em assets/vendor).
   Sem JS o site continua legível: o estado "oculto para animar" só existe com html.motion-ok.
   ========================================================================== */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const HDR = () => (innerWidth < 640 ? 64 : 72);
let lenis = null;

window.AVB.applyConfig();

/* ---------- Lenis + GSAP ---------- */
const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
if (hasGsap) {
  gsap.registerPlugin(ScrollTrigger, window.SplitText, window.MotionPathPlugin);
  ScrollTrigger.config({ ignoreMobileResize: true });
  if (!reduce && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
}

/* ---------- Âncoras ---------- */
$$('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const t = $(id);
    if (!t) return;
    e.preventDefault();
    closeMenu();
    if (lenis) lenis.scrollTo(t, { offset: -(HDR() + 8), duration: 1.3 });
    else t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', id);
  });
});

/* ---------- Header: acompanha a dobra que está por baixo dele + scroll-spy ----------
   Variação de fundos: transparente no topo do hero, vidro navy sobre dobras escuras
   ([data-tone="dark"]: hero, números, diferenciais, rodapé) e sólido claro no resto.
   Sem JS o header fica navy sólido, como no original. */
const header = $('[data-header]');
const hero = $('#inicio');
const darkZones = $$('[data-tone="dark"]');
const topbar = $('.topbar');
const onScroll = () => {
  // posição de layout do header (sticky logo abaixo da topbar), imune ao transform da entrada animada
  const y = Math.max(0, topbar ? topbar.getBoundingClientRect().bottom : 0) + header.offsetHeight / 2;
  const under = darkZones.find((z) => { const r = z.getBoundingClientRect(); return r.top <= y && r.bottom > y; });
  header.classList.toggle('is-solid', !under);
  header.classList.toggle('is-dark', !!under);
  header.classList.toggle('is-top', under === hero && scrollY < 24);
};
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll, { passive: true });
addEventListener('load', onScroll);
onScroll();

const links = new Map($$('.hdr__nav a').map((a) => [a.getAttribute('href'), a]));
const spy = new IntersectionObserver((es) => {
  es.forEach((e) => {
    if (!e.isIntersecting) return;
    links.forEach((a) => a.classList.remove('is-current'));
    links.get('#' + e.target.id)?.classList.add('is-current');
  });
}, { rootMargin: '-45% 0px -50% 0px' });
['quem-somos', 'beneficios', 'tipos-de-veiculos', 'diferenciais', 'contato'].forEach((id) => { const el = document.getElementById(id); if (el) spy.observe(el); });

/* ---------- Menu mobile ---------- */
const menu = $('#menu-mobile');
const burger = $('.hdr__burger');
function openMenu() {
  menu.hidden = false; burger.setAttribute('aria-expanded', 'true'); lenis?.stop();
  document.documentElement.style.overflow = 'hidden';
  $('.mmenu__close').focus();
  if (hasGsap && !reduce) gsap.from('.mmenu__list li', { y: 36, autoAlpha: 0, stagger: 0.05, duration: 0.6, ease: 'expo.out', delay: 0.1 });
}
function closeMenu() {
  if (menu.hidden) return;
  menu.hidden = true; burger.setAttribute('aria-expanded', 'false'); lenis?.start();
  document.documentElement.style.overflow = ''; burger.focus({ preventScroll: true });
}
burger.addEventListener('click', openMenu);
$('.mmenu__close').addEventListener('click', closeMenu);
menu.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMenu();
  if (e.key === 'Tab') {
    const f = $$('a, button', menu); const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});
matchMedia('(min-width: 1180px)').addEventListener('change', (m) => { if (m.matches) closeMenu(); });

/* ---------- Stack de destaques ---------- */
(() => {
  const deck = $('[data-stack]'); if (!deck) return;
  const cards = [...deck.children], pills = $$('.pillnav__pill');
  const n = cards.length; let cur = 0, paused = false, userPaused = false, timer;
  const go = (i) => {
    cur = (i + n) % n;
    cards.forEach((c, k) => { const p = (k - cur + n) % n; c.dataset.pos = p; c.setAttribute('aria-hidden', p !== 0); c.inert = p !== 0; });
    pills.forEach((p, k) => { p.classList.toggle('is-active', k === cur); p.setAttribute('aria-pressed', k === cur); });
  };
  $('[data-next]').addEventListener('click', () => { go(cur + 1); restart(); });
  $('[data-prev]').addEventListener('click', () => { go(cur - 1); restart(); });
  pills.forEach((p, k) => p.addEventListener('click', () => { go(k); restart(); }));
  const pauseBtn = $('[data-pause]');
  pauseBtn.addEventListener('click', () => {
    userPaused = !userPaused;
    pauseBtn.setAttribute('aria-label', userPaused ? 'Retomar animação' : 'Pausar animação');
    pauseBtn.querySelector('use').setAttribute('href', userPaused ? '#i-play' : '#i-pause');
  });
  const root = deck.closest('.stackx');
  root.addEventListener('mouseenter', () => (paused = true)); root.addEventListener('mouseleave', () => (paused = false));
  root.addEventListener('focusin', () => (paused = true)); root.addEventListener('focusout', () => (paused = false));
  const tick = () => { if (!paused && !userPaused && !document.hidden && !reduce) go(cur + 1); };
  const restart = () => { clearInterval(timer); timer = setInterval(tick, 7000); };
  go(0); restart();
})();

/* ---------- App: troca de telas ---------- */
(() => {
  const items = $$('[data-app]'), views = $$('.pv'); if (!items.length) return;
  let cur = 0, stop = reduce, hover = false, timer;
  const show = (i) => { cur = i; items.forEach((b, k) => { b.classList.toggle('is-active', k === i); b.setAttribute('aria-pressed', k === i); }); views.forEach((v, k) => v.classList.toggle('is-active', k === i)); };
  items.forEach((b, k) => b.addEventListener('click', () => { stop = true; show(k); }));
  const root = $('.app__in'); root.addEventListener('mouseenter', () => (hover = true)); root.addEventListener('mouseleave', () => (hover = false));
  const io = new IntersectionObserver(([e]) => { clearInterval(timer); if (e.isIntersecting && !stop) timer = setInterval(() => { if (!hover && !stop) show((cur + 1) % views.length); }, 3500); }, { threshold: 0.35 });
  io.observe(root);
})();

/* ---------- Cookies + WhatsApp flutuante ---------- */
(() => {
  const bar = $('.cookie'); let saved = null;
  try { saved = localStorage.getItem('avb-cookies'); } catch (e) { /* sem storage */ }
  const showBar = () => { if (!bar.hidden || saved) return; saved = 'shown'; bar.hidden = false; if (hasGsap && !reduce) gsap.from(bar, { y: 24, autoAlpha: 0, duration: 0.6, ease: 'expo.out' }); };
  if (!saved) { addEventListener('scroll', () => { if (scrollY > innerHeight * 0.9) showBar(); }, { passive: true }); setTimeout(showBar, 20000); }
  $$('[data-cookie]', bar).forEach((b) => b.addEventListener('click', () => { try { localStorage.setItem('avb-cookies', b.dataset.cookie); } catch (e) { /* ok */ } bar.hidden = true; }));

  const fwa = $('.fwa'); fwa.hidden = false; fwa.classList.add('is-away');
  let heroVis = true, finalVis = false;
  const upd = () => fwa.classList.toggle('is-away', heroVis || finalVis);
  new IntersectionObserver(([e]) => { heroVis = e.isIntersecting; upd(); }).observe(hero);
  new IntersectionObserver(([e]) => { finalVis = e.isIntersecting; upd(); }, { threshold: 0.3 }).observe($('.final'));
})();

/* ---------- Benefícios: carrossel nativo (setas e contador) ---------- */
(() => {
  const view = $('[data-hs-view]'), ctrl = $('[data-hs-ctrl]'); if (!view || !ctrl) return;
  ctrl.hidden = false;
  const cards = $$('.bcard', view), cnt = $('[data-hs-count]'), bar = $('[data-hs-bar]');
  const step = () => (cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : 380);
  const upd = () => {
    if ($('[data-hs]').classList.contains('is-pinned')) return;
    const i = Math.min(cards.length - 1, Math.round(view.scrollLeft / step()));
    cnt.textContent = String(i + 1).padStart(2, '0'); bar.style.width = ((i + 1) / cards.length) * 100 + '%';
  };
  view.addEventListener('scroll', upd, { passive: true });
  $('[data-hs-prev]').addEventListener('click', () => view.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }));
  $('[data-hs-next]').addEventListener('click', () => view.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }));
  view.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); view.scrollBy({ left: step() }); } if (e.key === 'ArrowLeft') { e.preventDefault(); view.scrollBy({ left: -step() }); } });
  bar.style.width = (1 / cards.length) * 100 + '%';
})();

if (!hasGsap) { document.documentElement.classList.remove('motion-ok'); }

/* ==========================================================================
   Animações (somente com GSAP e sem prefers-reduced-motion)
   ========================================================================== */
if (hasGsap && !reduce) {
  const easeOut = 'expo.out';

  /* ---- Hero ---- */
  const tl = gsap.timeline({ defaults: { ease: easeOut } });
  tl.from('.hdr', { yPercent: -100, duration: 0.7 }, 0)
    .from('.hero .eyebrow', { y: 16, autoAlpha: 0, duration: 0.7 }, 0.1)
    .to('.hero__title .ln > span', { y: 0, duration: 1.1, stagger: 0.12 }, 0.2)
    .from('.hero__sub, .hero__ctas, .hero__micro', { y: 24, autoAlpha: 0, duration: 0.8, stagger: 0.09 }, 0.6)
    .from('.hcard--main', { y: 80, scale: 0.92, autoAlpha: 0, duration: 1.1 }, 0.35)
    .from('.hcard--back', { y: 60, x: 40, rotate: 14, autoAlpha: 0, duration: 1.1 }, 0.5)
    .from('.hchip', { x: -30, autoAlpha: 0, duration: 0.8, ease: 'back.out(1.6)' }, 0.95)
    .from('.hero__seals li', { y: 16, autoAlpha: 0, duration: 0.6, stagger: 0.08 }, 1.0);
  gsap.to('.hcard--back', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hcard--main', { yPercent: 6, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__bg img', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });

  /* ---- Reveal padrão ---- */
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 90%', once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: easeOut, stagger: 0.08, overwrite: true }),
  });

  /* ---- Números: contagem ---- */
  $$('[data-count]').forEach((el) => {
    const end = +el.dataset.count, o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => { el.textContent = '0'; gsap.to(o, { v: end, duration: 2, ease: 'power3.out', onUpdate: () => (el.textContent = Math.round(o.v)) }); } });
  });

  /* ---- Diferenciais: título que "acende" palavra a palavra ---- */
  const words = $('[data-words]');
  if (words && window.SplitText) {
    document.fonts.ready.then(() => {
      const sp = SplitText.create(words, { type: 'words' });
      gsap.fromTo(sp.words, { opacity: 0.16 }, { opacity: 1, stagger: 0.12, ease: 'none', scrollTrigger: { trigger: words, start: 'top 80%', end: 'top 30%', scrub: true } });
      ScrollTrigger.refresh();
    });
  }

  /* ---- Quem somos: foto aproxima suavemente ao rolar ---- */
  if ($('[data-about-photo]')) gsap.fromTo('[data-about-photo]', { scale: 1.1 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.about__frame', start: 'top bottom', end: 'center center', scrub: true } });

  /* ---- Rodapé: marca-d'água do símbolo sobe discretamente ---- */
  gsap.from('[data-foot-mark]', { yPercent: 18, autoAlpha: 0, duration: 1.2, ease: easeOut, scrollTrigger: { trigger: '.foot', start: 'top 85%', once: true } });

  /* ---- Matchmedia: peças com pin / sticky ---- */
  const mm = gsap.matchMedia();

  // Como funciona: cartas empilhadas recuam quando a próxima chega
  mm.add('(min-width: 900px)', () => {
    const steps = $$('.step');
    steps.slice(0, -1).forEach((s, i) => {
      gsap.to(s, { scale: 0.93, ease: 'none', scrollTrigger: { trigger: steps[i + 1], start: 'top 85%', end: 'top 30%', scrub: true } });
    });
  });

  // Benefícios: seção fixada com trilho horizontal (aprimoramento)
  mm.add('(min-width: 1024px) and (min-height: 720px)', () => {
    const sec = $('[data-hs]'), track = $('[data-hs-track]'), view = $('[data-hs-view]');
    sec.classList.add('is-pinned'); view.scrollLeft = 0;
    const dist = () => Math.max(0, track.scrollWidth - view.clientWidth);
    const cnt = $('[data-hs-count]'), bar = $('[data-hs-bar]'), total = $$('.bcard').length;
    gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: sec, start: 'top top+=' + HDR(), end: () => '+=' + dist(), pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
      onUpdate: (s) => { cnt.textContent = String(Math.min(total, Math.round(s.progress * (total - 1)) + 1)).padStart(2, '0'); bar.style.width = 10 + s.progress * 90 + '%'; } } });
    return () => { sec.classList.remove('is-pinned'); gsap.set(track, { clearProps: 'transform' }); };
  });

  // Como se associar: estrada reta + carro (aprimoramento; sem JS tudo já aparece aceso)
  mm.add('(min-width: 1024px)', () => {
    const section = $('[data-join]'), road = $('[data-road]'), car = $('[data-car]');
    const stops = $$('.stop'), from = 12.5, to = 95, fr = [12.5, 37.5, 62.5, 87.5];
    road.classList.add('is-animated');
    stops.forEach((s) => s.classList.remove('is-reached'));
    gsap.set(car, { left: from + '%' });
    const pin = innerHeight >= 700;
    gsap.to(car, { left: to + '%', ease: 'none',
      onUpdate: () => { const x = parseFloat(car.style.left) || from; stops.forEach((s, i) => s.classList.toggle('is-reached', x >= fr[i] - 0.5)); car.classList.toggle('is-protected', x >= to - 0.5); },
      scrollTrigger: { trigger: section, start: pin ? 'top top+=' + HDR() : 'top 60%', end: pin ? '+=100%' : 'bottom 60%', scrub: 0.6, pin: pin ? '.join__pin' : false, invalidateOnRefresh: true } });
    return () => { road.classList.remove('is-animated'); car.classList.remove('is-protected'); stops.forEach((s) => s.classList.add('is-reached')); gsap.set(car, { clearProps: 'left' }); };
  });
  mm.add('(max-width: 1023.98px)', () => {
    const road = $('[data-road]'), stops = $$('.stop');
    road.classList.add('is-animated'); stops.forEach((s) => s.classList.remove('is-reached'));
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) e.target.classList.add('is-reached'); }), { rootMargin: '-30% 0px -30% 0px' });
    stops.forEach((s) => io.observe(s));
    return () => { io.disconnect(); road.classList.remove('is-animated'); stops.forEach((s) => s.classList.add('is-reached')); };
  });
}

/* ---- Recalcular após fontes/imagens ---- */
if (hasGsap) {
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  addEventListener('load', () => ScrollTrigger.refresh());
}
window.__p02ready = true;
})();
