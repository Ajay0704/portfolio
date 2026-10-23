/* Ajay Karthick — portfolio v2. One small script for every page; each block runs only if its markup exists. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* ---------- Nav: border on scroll, mobile menu ---------- */
  var nav = $('.nav');
  var menuBtn = $('.menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open);
    });
    $$('.nav-links a').forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); });
    });
  }

  /* ---------- Reveal on view; annotation boxes draw in after their card ---------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      $$('.anno', e.target).forEach(function (a, i) { setTimeout(function () { a.classList.add('on'); }, reduce ? 0 : 420 + i * 220); });
      io.unobserve(e.target);
    });
  }, { threshold: 0.15 }) : null;
  $$('.reveal').forEach(function (n) { if (io) io.observe(n); else n.classList.add('in'); });
  if (!io) $$('.anno').forEach(function (a) { a.classList.add('on'); });

  /* ---------- Home: finding viewer (tabs, autoplay with a pause control, WCAG 2.2.2) ---------- */
  var viewer = $('#viewer');
  if (viewer) {
    var scenes = $$('.scene', viewer), tabs = $$('.vtab', viewer);
    var cap = $('#viewerCaption'), where = $('#viewerWhere'), pauseBtn = $('#viewerPause');
    var DUR = 7000, cur = -1, timer = null, timers = [], playing = !reduce;
    viewer.style.setProperty('--dur', DUR + 'ms');

    function show(i) {
      timers.forEach(clearTimeout); timers = [];
      cur = i;
      scenes.forEach(function (s, k) {
        var on = k === i;
        s.classList.toggle('on', on);
        s.classList.remove('checked');
        $$('.anno', s).forEach(function (a) { a.classList.remove('on'); });
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      tabs.forEach(function (t, k) {
        t.setAttribute('aria-selected', k === i ? 'true' : 'false');
        t.tabIndex = k === i ? 0 : -1;
        var p = $('.prog', t); if (p) { p.style.animation = 'none'; p.offsetWidth; p.style.animation = ''; }
      });
      var s = scenes[i];
      cap.innerHTML = s.getAttribute('data-caption');
      where.textContent = s.getAttribute('data-where');
      var annos = $$('.anno', s);
      annos.forEach(function (a, k) { timers.push(setTimeout(function () { a.classList.add('on'); }, reduce ? 0 : 450 + k * 300)); });
      timers.push(setTimeout(function () { s.classList.add('checked'); }, reduce ? 0 : 1100 + annos.length * 300));
      schedule();
    }
    function schedule() {
      clearTimeout(timer);
      if (playing) timer = setTimeout(function () { show((cur + 1) % scenes.length); }, DUR);
    }
    function setPlaying(p) {
      playing = p;
      viewer.classList.toggle('paused', !p);
      if (pauseBtn) { pauseBtn.textContent = p ? 'Pause' : 'Play'; pauseBtn.setAttribute('aria-pressed', p ? 'false' : 'true'); }
      if (p) show(cur); else clearTimeout(timer);
    }
    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () { show(k); });
      t.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        var n = (k + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
        tabs[n].focus(); show(n);
      });
    });
    if (pauseBtn) pauseBtn.addEventListener('click', function () { setPlaying(!playing); });
    viewer.addEventListener('focusin', function () { clearTimeout(timer); });
    if (reduce) viewer.classList.add('paused');
    show(0);
  }

  /* ---------- Home: all-work orbit (a tilted ring of project tiles; the front tile names its industry) ---------- */
  var orbit = $('#orbit');
  if (orbit) {
    var ringEl = $('#orbitRing'), orbs = $$('.orb', ringEl);
    var oWord = $('#orbitWord'), oCap = $('#orbitCap'), oPause = $('#orbitPause');
    var N = orbs.length, STEP = Math.PI * 2 / N, SPEED = Math.PI * 2 / 60000;   // one turn a minute: slow enough to read
    var rot = 0, active = -1, spinning = !reduce, hovering = false, inView = false, last = 0, raf = 0, tween = null, og = {};

    function measure() {
      var W = ringEl.clientWidth, H = ringEl.clientHeight, narrow = W < 720;
      og = { cx: W / 2, cy: H / 2, rx: W * (narrow ? 0.40 : 0.445), ry: H * (narrow ? 0.39 : 0.37),
             s: narrow ? 74 : Math.max(108, Math.min(150, W * 0.1)) };
      orbs.forEach(function (o) { o.style.setProperty('--s', og.s + 'px'); });
    }
    function place() {
      var best = -2, bi = 0;
      for (var i = 0; i < N; i++) {
        var a = rot + i * STEP, z = Math.cos(a);              // z: 1 = front (low, large), -1 = back (high, small)
        var k = 0.5 + 0.5 * (z + 1) / 2;
        var x = og.cx + og.rx * Math.sin(a) - og.s / 2, y = og.cy + og.ry * z - og.s / 2;
        var o = orbs[i];
        o.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + k.toFixed(3) + ')';
        o.style.zIndex = Math.round((z + 1) * 25);   // depth by size and stacking only; fading would break text contrast
        if (z > best) { best = z; bi = i; }
      }
      if (bi !== active) setActive(bi);
    }
    function setActive(i) {
      if (active > -1) orbs[active].classList.remove('on');
      active = i;
      var o = orbs[i]; o.classList.add('on');
      oWord.classList.add('swap'); oCap.classList.add('swap');
      setTimeout(function () {
        oWord.textContent = o.getAttribute('data-domain');
        var title = o.getAttribute('data-title');
        oCap.innerHTML = '<b>' + title + (/[.?!]$/.test(title) ? '' : '.') + '</b> ' + o.getAttribute('data-finding') +
          ' <a href="' + $('a', o).getAttribute('href') + '">Case study&nbsp;&rarr;</a>';
        oWord.classList.remove('swap'); oCap.classList.remove('swap');
      }, reduce ? 0 : 200);
    }
    function frame(ts) {
      raf = 0;
      var dt = last ? Math.min(64, ts - last) : 16; last = ts;
      if (tween) {
        var t = Math.min(1, (ts - tween.t0) / tween.dur), e = 1 - Math.pow(1 - t, 3);
        rot = tween.from + (tween.to - tween.from) * e;
        if (t >= 1) tween = null;
      } else if (spinning && !hovering) {
        rot -= dt * SPEED;
      }
      place();
      if (inView && (tween || (spinning && !hovering))) raf = requestAnimationFrame(frame);
      else last = 0;
    }
    function kick() { if (!raf && inView) raf = requestAnimationFrame(frame); }
    function bringToFront(i) {                                  // rotate the shortest way so tile i faces front
      var target = -i * STEP, d = ((target - rot) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
      if (reduce) { rot += d; place(); return; }
      tween = { from: rot, to: rot + d, t0: performance.now(), dur: 700 }; kick();
    }

    measure(); place();
    ringEl.addEventListener('pointerover', function (e) { if (e.target.closest('.orb')) { hovering = true; } });
    ringEl.addEventListener('pointerleave', function () { hovering = false; kick(); });
    ringEl.addEventListener('focusin', function (e) {             // keyboard users: the focused tile comes to the front
      var o = e.target.closest('.orb'); if (!o) return;
      hovering = true; bringToFront(orbs.indexOf(o));
    });
    ringEl.addEventListener('focusout', function () { hovering = false; kick(); });
    $('#orbitPrev').addEventListener('click', function () { bringToFront((active - 1 + N) % N); });
    $('#orbitNext').addEventListener('click', function () { bringToFront((active + 1) % N); });
    if (oPause) oPause.addEventListener('click', function () {
      spinning = !spinning;
      oPause.textContent = spinning ? 'Pause' : 'Play';
      oPause.setAttribute('aria-pressed', spinning ? 'false' : 'true');
      kick();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { inView = es[0].isIntersecting; if (inView) kick(); }, { threshold: 0.05 }).observe(orbit);
    } else { inView = true; kick(); }
    window.addEventListener('resize', function () { measure(); place(); });
  }

  /* ---------- Home: How I work — scroll explodes the dashboard into its layers ---------- */
  var how = $('#howSection'), stack = $('#stack');
  var planes = stack ? $$('.plane', stack) : [], steps = how ? $$('.steps li', how) : [];
  var narrow = window.matchMedia('(max-width: 900px)');
  function updateHow() {
    if (!how) return;
    if (narrow.matches || reduce) {
      stack.style.setProperty('--t', narrow.matches ? .9 : 1);
      stack.style.setProperty('--g', narrow.matches ? .75 : 1);
      stack.classList.remove('flat');
      planes.forEach(function (p) { p.classList.add('on'); });
      steps.forEach(function (s) { s.classList.add('on'); });
      return;
    }
    var r = how.getBoundingClientRect();
    var p = Math.max(0, Math.min(1, (66 - r.top) / (r.height - window.innerHeight + 66)));
    var open = Math.min(1, p / 0.2), eased = open * open * (3 - 2 * open);
    stack.style.setProperty('--t', eased.toFixed(3));
    stack.style.setProperty('--g', eased.toFixed(3));
    stack.classList.toggle('flat', eased < 0.05);
    var k = Math.min(planes.length - 1, Math.floor(p * planes.length));
    planes.forEach(function (pl, j) {
      pl.classList.toggle('on', j === k);
      // layers above the active one only appear once the stack has opened, so they never sit on top of it
      pl.style.opacity = j > k ? Math.max(0, (eased - 0.45) / 0.55 * 0.16).toFixed(3) : '';
    });
    steps.forEach(function (s, j) { s.classList.toggle('on', j === k); });
  }

  /* ---------- Case study: highlight the section you're reading ---------- */
  var tocLinks = $$('.toc a');
  var tocTargets = tocLinks.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  function updateToc() {
    if (!tocLinks.length) return;
    var k = 0;
    tocTargets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top < 140) k = i; });
    tocLinks.forEach(function (a, i) { a.classList.toggle('on', i === k); });
  }

  /* ---------- Page colour follows the band in the middle of the screen (Scale-style dark / tint sections) ---------- */
  var bands = $$('[data-band]');
  function updateBands() {
    if (!bands.length) return;
    var mid = window.innerHeight / 2, cur = null;
    bands.forEach(function (s) {
      var r = s.getBoundingClientRect();
      var on = r.top <= mid && r.bottom >= mid;
      s.classList.toggle('is-active', on);
      if (on) cur = s.getAttribute('data-band');
    });
    ['dark', 'tint', 'green'].forEach(function (k) { document.body.classList.toggle('page-' + k, cur === k); });
  }

  /* ---------- One rAF-throttled scroll loop ---------- */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 8);
      updateHow();
      updateToc();
      updateBands();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Work index: filters ---------- */
  var filters = $$('.filter');
  if (filters.length) {
    var cards = $$('.index-grid .card');
    var count = $('#count');
    function apply(cat) {
      var n = 0;
      cards.forEach(function (c) {
        var show = cat === 'all' || (' ' + c.getAttribute('data-cats') + ' ').indexOf(' ' + cat + ' ') > -1;
        c.hidden = !show; if (show) n++;
      });
      filters.forEach(function (f) { f.setAttribute('aria-pressed', f.getAttribute('data-cat') === cat ? 'true' : 'false'); });
      if (count) count.textContent = n + (n === 1 ? ' project' : ' projects');
    }
    filters.forEach(function (f) { f.addEventListener('click', function () { apply(f.getAttribute('data-cat')); }); });
    var start = (location.hash.match(/^#cat=([a-z]+)/) || [])[1];
    apply(start && $('.filter[data-cat="' + start + '"]') ? start : 'all');
  }

  /* ---------- Copy email ---------- */
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-copy'), label = b.textContent;
      (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(function () {
        b.textContent = 'Copied ✓';
        setTimeout(function () { b.textContent = label; }, 1800);
      }, function () { location.href = 'mailto:' + v; });
    });
  });
})();
