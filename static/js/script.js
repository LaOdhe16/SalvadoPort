/* ═══════════════════════════════════════════════════════════
   PORTFOLIO — interactions
   ═══════════════════════════════════════════════════════════ */

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ── SCROLL PROGRESS + HEADER + BACK TO TOP ─────────────── */
const $bar = $('#scrollBar');
const $hdr = $('#siteHeader');
const $top = $('#topBtn');
const onScroll = () => {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - innerHeight;
  if ($bar && max > 0) $bar.style.width = (y / max * 100) + '%';
  $hdr?.classList.toggle('on', y > 40);
  $top?.classList.toggle('show', y > 500);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();
$top?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ── MOBILE DRAWER ──────────────────────────────────────── */
const $ham = $('#ham'), $drw = $('#drawer'), $drwX = $('#drawerX'), $drwBg = $('#drawerBg');
const openD  = () => { $drw?.classList.add('open');    $drwBg?.classList.add('on');    $ham?.classList.add('open');    document.body.style.overflow = 'hidden'; };
const closeD = () => { $drw?.classList.remove('open'); $drwBg?.classList.remove('on'); $ham?.classList.remove('open'); document.body.style.overflow = ''; };
$ham?.addEventListener('click', () => ($drw?.classList.contains('open') ? closeD() : openD()));
$drwX?.addEventListener('click', closeD);
$drwBg?.addEventListener('click', closeD);
$$('#drawer a').forEach(a => a.addEventListener('click', closeD));

/* ── SMOOTH ANCHOR SCROLL (works from any page: "/#work") ─ */
$$('a[href^="/#"], a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id  = a.getAttribute('href').split('#')[1];
    const sec = id && document.getElementById(id);
    if (!sec) return;                       // not on this page → normal navigation
    e.preventDefault();
    closeD();
    sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', '#' + id);
  });
});

/* ── SCROLL REVEAL ──────────────────────────────────────── */
const revObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el   = entry.target;
    const sibs = [...(el.parentElement?.children || [])].filter(c => c.classList.contains('reveal'));
    el.style.transitionDelay = Math.min(sibs.indexOf(el) * 90, 360) + 'ms';
    el.classList.add('in');
    revObs.unobserve(el);
    // remove the delay once revealed so hover transitions stay snappy
    setTimeout(() => { el.style.transitionDelay = ''; }, 1200);
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
$$('.reveal').forEach(el => revObs.observe(el));

/* ── HERO CAROUSEL (latest projects) ────────────────────── */
const $car = $('#heroCarousel'), $prev = $('#arrPrev'), $next = $('#arrNext');
if ($car && $prev && $next) {
  const step = () => {
    const card = $car.querySelector('.shot');
    return card ? card.getBoundingClientRect().width + 20 : 240;
  };
  const sync = () => {
    const max = $car.scrollWidth - $car.clientWidth - 2;
    $prev.disabled = $car.scrollLeft <= 2;
    $next.disabled = $car.scrollLeft >= max;
  };
  $prev.addEventListener('click', () => $car.scrollBy({ left: -step(), behavior: 'smooth' }));
  $next.addEventListener('click', () => $car.scrollBy({ left:  step(), behavior: 'smooth' }));
  $car.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync);
  sync();
}

/* ── PORTFOLIO FILTER ───────────────────────────────────── */
const $empty = $('#worksEmpty');
const matches = (card, f) =>
  f === 'all' ||
  (f === 'impactful' ? card.dataset.impact === '1' : card.dataset.cat === f);

$$('.f-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.f-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.f;
    let shown = 0;
    $$('.work-card').forEach(card => {
      const show = matches(card, f);
      if (show) shown++;
      clearTimeout(card._t);
      if (show) {
        card.style.display = '';
        requestAnimationFrame(() => { card.style.opacity = ''; card.style.transform = ''; });
      } else {
        card.style.opacity = '0';
        card.style.transform = 'translateY(10px)';
        card._t = setTimeout(() => { card.style.display = 'none'; }, 300);
      }
    });
    if ($empty) $empty.hidden = shown !== 0;
  });
});

/* ── TOAST + COPY EMAIL ─────────────────────────────────── */
function showToast(msg, icon = 'fa-check') {
  const $t = $('#globalToast');
  if (!$t) return;
  $t.innerHTML = `<i class="fa-solid ${icon}"></i> ${msg}`;
  $t.classList.add('show');
  clearTimeout($t._t);
  $t._t = setTimeout(() => $t.classList.remove('show'), 2600);
}
$('#copyEmailBtn')?.addEventListener('click', function () {
  const email = this.dataset.email;
  (navigator.clipboard?.writeText(email) ?? Promise.reject())
    .then(() => showToast(`${email} copied!`, 'fa-copy'))
    .catch(() => showToast('Could not copy — please copy manually', 'fa-triangle-exclamation'));
});

/* ── CERTIFICATE LIGHTBOX ───────────────────────────────── */
const $lb = $('#lightbox'), $lbI = $('#lbImg'), $lbC = $('#lbCap'), $lbX = $('#lbX');
$$('.cert-card').forEach(c => {
  c.addEventListener('click', () => {
    $lbI.src = c.querySelector('img').src;
    $lbI.alt = c.dataset.title || '';
    $lbC.textContent = c.dataset.title || '';
    $lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
});
const closeLB = () => {
  $lb?.classList.remove('open');
  document.body.style.overflow = '';
  setTimeout(() => { if ($lbI && !$lb.classList.contains('open')) $lbI.removeAttribute('src'); }, 350);
};
$lbX?.addEventListener('click', closeLB);
$lb?.addEventListener('click', e => { if (e.target === $lb) closeLB(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeD(); closeLB(); } });

/* ── CLOCK (WIB) ────────────────────────────────────────── */
const $clk = $('#localTime');
if ($clk) {
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const tick = () => { $clk.textContent = fmt.format(new Date()); };
  tick(); setInterval(tick, 1000);
}

/* ── ACTIVE NAV LINK (scroll-spy) ───────────────────────── */
const navLinks = $$('.nav-center a');
const sections = $$('section[id]');
if (navLinks.length && sections.length) {
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      navLinks.forEach(a => a.classList.toggle('on', a.dataset.sec === e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => spy.observe(s));
}

/* ── EXPERIENCE LINKS WITHOUT A URL YET ─────────────────── */
$$('.jrn-link.is-soon').forEach(a => {
  a.addEventListener('click', e => { e.preventDefault(); showToast('Certificate link coming soon', 'fa-clock'); });
});

/* ── TECH-STACK BUBBLES: drift away from the cursor ─────── */
const $bubbles = $('#bubbles');
if ($bubbles && matchMedia('(hover: hover)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const items = $$('.bubble', $bubbles);
  const RANGE = 170, PUSH = 26;
  const reset = () => items.forEach(b => { b.style.translate = '0 0'; });
  items.forEach(b => { b.style.transition = 'translate .5s cubic-bezier(.2,.7,.2,1)'; });
  $bubbles.addEventListener('mousemove', e => {
    items.forEach(b => {
      const r = b.getBoundingClientRect();
      const dx = (r.left + r.width / 2) - e.clientX;
      const dy = (r.top + r.height / 2) - e.clientY;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist > RANGE || b.matches(':hover')) { b.style.translate = '0 0'; return; }
      const f = (1 - dist / RANGE) * PUSH;
      b.style.translate = `${(dx / dist * f).toFixed(1)}px ${(dy / dist * f).toFixed(1)}px`;
    });
  });
  $bubbles.addEventListener('mouseleave', reset);
}
