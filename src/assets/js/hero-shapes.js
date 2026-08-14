/*
 * hero-shapes.js — gives the hero's background shapes a slow life of their own.
 *
 *   idle    the outline itself undulates on a few low harmonics (periods of
 *           30–60s) over a slow drift and spin, so nothing ever repeats
 *   cursor  each shape is a soft body: press into one and the surface dents
 *           inward under the cursor while the body springs away, picking up
 *           some of the cursor's momentum and a little spin if you catch it
 *           off-centre. Let go and it wobbles back.
 *   scroll  the shapes accelerate outward off the canvas, clearing the view
 *           by the time the hero is half gone
 *
 * Each path is sampled once into points; every frame those points are
 * displaced and re-emitted as a smooth path (sharp corners are detected and
 * kept sharp). Body motion stays on the compositor as a transform. Respects
 * prefers-reduced-motion, and switches off below the desktop breakpoint.
 */
(function () {
  'use strict';

  var hero = document.querySelector('.hero');
  if (!hero) return;

  var els = Array.prototype.slice.call(hero.querySelectorAll('.shape'));
  if (!els.length) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var RAD = Math.PI / 180;

  /* ---- tuning ------------------------------------------------------ */
  var IDLE_AMP    = 0.075;  // outline undulation, as a fraction of the radius
  var HARMONICS   = [       // [waves around the outline, weight, rad/s]
    [2, 1.00, 0.160],
    [3, 0.55, 0.220],
    [5, 0.28, 0.300]
  ];
  // Idle wander. Small on purpose: the hero's shapes sit inside the page now,
  // so anything like the old 70px would either walk them into the headline or
  // push them under the viewport edge to be clipped.
  var DRIFT_X     = 26;
  var DRIFT_Y     = 18;
  var DRIFT_EDGE  = 8;      // keep a bleeding shape at least this far off-canvas
  var BREATHE     = 0.05;   // idle uniform scale, ±5%
  var SPIN        = 7;      // idle rotation, deg

  var CONTACT_PAD = 8;      // px outside the outline that still counts as touching
  var DENT_RADIUS = 120;    // px — how wide the dent spreads
  var DENT_MAX    = 30;     // px — deepest the surface can be pressed in
  var RIM         = 0.15;   // outward bulge around the dent (volume-ish)
  var DENT_K      = 80;     // dent spring — slow and thick, one soft rebound
  var DENT_C      = 9;
  var BODY_GIVE   = 0.62;   // share of the penetration the whole body gives way
  var BODY_K      = 14;     // body spring — very soft, takes ~2s to settle
  var BODY_C      = 6.7;
  var BODY_MAX    = 90;     // px
  var ENTRAIN     = 0.16;   // how much of the cursor's motion drags the body
  var TORQUE      = 13;     // spin from an off-centre shove
  var SPIN_K      = 30;
  var SPIN_C      = 7;
  var SPIN_MAX    = 4;      // deg

  var SCROLL_X    = 280;    // outward drift at full scroll, px
  var SCROLL_Y    = 150;
  var SCROLL_LIFT = 70;
  var SCROLL_FADE = 0.75;
  var SCROLL_SPAN = 0.5;   // exit completes this far into the hero's height

  var IDLE_GEOM_MS = 80;    // an idle outline moves ~0.03px/frame: 12fps is plenty

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  /* ---- sample each path into points -------------------------------- */
  function build(el, i) {
    var path = el.querySelector('path');
    var svg = el.querySelector('svg');
    if (!path || !svg || !path.getTotalLength) return null;

    var len = path.getTotalLength();
    if (!len) return null;
    var n = clamp(Math.round(len / 8), 70, 130);

    var bx = new Float64Array(n), by = new Float64Array(n);
    var j, p;
    for (j = 0; j < n; j++) {
      p = path.getPointAtLength(len * j / n);
      bx[j] = p.x; by[j] = p.y;
    }

    // centroid + mean radius, for scaling the idle undulation
    var cx = 0, cy = 0;
    for (j = 0; j < n; j++) { cx += bx[j]; cy += by[j]; }
    cx /= n; cy /= n;
    var rad = 0;
    for (j = 0; j < n; j++) rad += Math.hypot(bx[j] - cx, by[j] - cy);
    rad /= n;

    // outward normals, and a flag for vertices sharp enough to preserve
    var nx = new Float64Array(n), ny = new Float64Array(n);
    var corner = new Uint8Array(n);
    for (j = 0; j < n; j++) {
      var a = (j + n - 1) % n, b = (j + 1) % n;
      var tx = bx[b] - bx[a], ty = by[b] - by[a];
      var tl = Math.hypot(tx, ty) || 1;
      var ox = ty / tl, oy = -tx / tl;
      if (ox * (bx[j] - cx) + oy * (by[j] - cy) < 0) { ox = -ox; oy = -oy; }
      nx[j] = ox; ny[j] = oy;

      var i1x = bx[j] - bx[a], i1y = by[j] - by[a];
      var i2x = bx[b] - bx[j], i2y = by[b] - by[j];
      var turn = Math.abs(Math.atan2(i1x * i2y - i1y * i2x, i1x * i2x + i1y * i2y));
      corner[j] = turn > 0.35 ? 1 : 0;
    }

    // sin/cos of the spatial term of each harmonic, so the frame loop only
    // has to fold in the time term
    var hs = [], hc = [];
    for (var h = 0; h < HARMONICS.length; h++) {
      var k = HARMONICS[h][0];
      var s = new Float64Array(n), c = new Float64Array(n);
      for (j = 0; j < n; j++) {
        var ang = 2 * Math.PI * k * j / n;
        s[j] = Math.sin(ang); c[j] = Math.cos(ang);
      }
      hs.push(s); hc.push(c);
    }

    var vb = svg.viewBox.baseVal;
    var ph = i * 1.73;

    return {
      el: el, path: path, d0: path.getAttribute('d'),
      n: n, bx: bx, by: by, nx: nx, ny: ny, corner: corner,
      hs: hs, hc: hc, ph: [ph, ph + 2.1, ph + 4.3, ph + 1.2, ph + 3.4, ph + 5.6],
      cx: cx, cy: cy, rad: rad, amp: rad * IDLE_AMP,
      vbx: vb ? vb.x : 0, vby: vb ? vb.y : 0, vbw: (vb && vb.width) || 300,
      // filled in by measure()
      ox: 0, oy: 0, hw: 0, hh: 0, scale: 1, ux: 0, uy: 0,
      // live state
      px: new Float64Array(n), py: new Float64Array(n),
      bxo: 0, byo: 0, bvx: 0, bvy: 0,          // body offset + velocity, px
      dent: 0, dentV: 0, dcx: 0, dcy: 0,       // dent depth (px) + contact point
      dnx: 0, dny: 0,                          // dent direction, local
      spin: 0, spinV: 0,
      geomAt: 0
    };
  }

  var shapes = [];
  for (var i = 0; i < els.length; i++) {
    var s = build(els[i], i);
    if (s) shapes.push(s);
  }
  if (!shapes.length) return;

  var mx = -1e5, my = -1e5, pmx = 0, pmy = 0, mvx = 0, mvy = 0, mt = 0;
  var hasPointer = false, enabled = true, running = false, rafId = 0, last = 0;
  var heroL = 0, heroT = 0, heroW = 1, heroH = 1;   // page coords, cached

  /* ---- geometry ---------------------------------------------------- */
  function measure() {
    var prev = shapes.map(function (s) {
      var t = s.el.style.transform;
      s.el.style.transform = 'none';
      return t;
    });

    var hr = hero.getBoundingClientRect();
    var hw = hr.width / 2 || 1, hh = hr.height / 2 || 1;
    var visible = 0;

    // page coords, so the frame loop never has to force a layout
    heroL = hr.left + window.pageXOffset;
    heroT = hr.top + window.pageYOffset;
    heroW = hr.width || 1; heroH = hr.height || 1;

    shapes.forEach(function (s) {
      var r = s.el.getBoundingClientRect();
      if (r.width) visible++;
      s.ox = r.left - hr.left;              // box origin within the hero
      s.oy = r.top - hr.top;
      s.hw = r.width / 2; s.hh = r.height / 2;
      s.scale = r.width / s.vbw || 1;       // px per user unit
      s.reach = Math.max(s.hw, s.hh) + CONTACT_PAD + BODY_MAX +
                Math.max(DRIFT_X, DRIFT_Y);
      s.ux = clamp((s.ox + s.hw - hw) / hw, -1.2, 1.2);
      s.uy = clamp((s.oy + s.hh - hh) / hh, -1.2, 1.2);

      // A shape that bleeds off an edge has to keep bleeding: cap how far it
      // can wander back inward, or the drift would expose a bare edge.
      var M = DRIFT_EDGE;
      s.txHi = s.ox < 0 ? -M - s.ox : Infinity;
      s.txLo = s.ox + 2 * s.hw > heroW ? heroW + M - s.ox - 2 * s.hw : -Infinity;
      s.tyHi = s.oy < 0 ? -M - s.oy : Infinity;
      s.tyLo = s.oy + 2 * s.hh > heroH ? heroH + M - s.oy - 2 * s.hh : -Infinity;
      if (s.txHi < s.txLo) { s.txHi = s.txLo = 0; }   // wider than the hero
      if (s.tyHi < s.tyLo) { s.tyHi = s.tyLo = 0; }
    });

    shapes.forEach(function (s, i) { s.el.style.transform = prev[i]; });

    // Shapes now render at every width, but the physics stays on the desktop
    // breakpoint: below it there is no pointer to press into them, and the
    // frame loop is not worth a phone battery.
    enabled = visible > 0 && window.innerWidth > 900;
    if (!enabled) { stop(); reset(); }
  }

  function reset() {
    shapes.forEach(function (s) {
      s.bxo = s.byo = s.bvx = s.bvy = 0;
      s.dent = s.dentV = s.spin = s.spinV = 0;
      s.el.style.transform = '';
      s.el.style.opacity = '';
      s.path.setAttribute('d', s.d0);
    });
  }

  /* The outline at rest: base points pushed along their normals by a few
     low harmonics. sin(spatial + temporal) is expanded so the precomputed
     tables do the work and the loop is three multiply-adds per point. */
  function idle(s, t) {
    var n = s.n, px = s.px, py = s.py, bx = s.bx, by = s.by, nx = s.nx, ny = s.ny;
    var w0 = HARMONICS[0][2] * t + s.ph[0],
        w1 = HARMONICS[1][2] * t + s.ph[1],
        w2 = HARMONICS[2][2] * t + s.ph[2];
    var s0 = Math.sin(w0), c0 = Math.cos(w0),
        s1 = Math.sin(w1), c1 = Math.cos(w1),
        s2 = Math.sin(w2), c2 = Math.cos(w2);
    var h0s = s.hs[0], h0c = s.hc[0], h1s = s.hs[1], h1c = s.hc[1],
        h2s = s.hs[2], h2c = s.hc[2];
    var A0 = HARMONICS[0][1] * s.amp, A1 = HARMONICS[1][1] * s.amp,
        A2 = HARMONICS[2][1] * s.amp;
    for (var k = 0; k < n; k++) {
      var off = A0 * (h0s[k] * c0 + h0c[k] * s0)
              + A1 * (h1s[k] * c1 + h1c[k] * s1)
              + A2 * (h2s[k] * c2 + h2c[k] * s2);
      px[k] = bx[k] + nx[k] * off;
      py[k] = by[k] + ny[k] * off;
    }
  }

  /* ---- frame ------------------------------------------------------- */
  function frame(now) {
    rafId = 0;
    var dt = last ? Math.min((now - last) / 1000, 0.033) : 1 / 60;
    last = now;
    var t = now / 1000;

    // cursor velocity, px/s, decaying when it stops moving
    if (mt && now - mt > 90) { mvx = mvy = 0; }

    var hLeft = heroL - window.pageXOffset;   // cached: no layout read per frame
    var hTop = heroT - window.pageYOffset;
    var prog = clamp(-hTop / (heroH * SCROLL_SPAN), 0, 1);
    var out = prog * prog;   // hangs back at first, then leaves quickly

    for (var si = 0; si < shapes.length; si++) {
      var s = shapes[si], n = s.n;

      /* idle: a slow wander, breath and roll at the transform level. Two
         components per axis on unrelated periods, so the path never repeats
         and never quite reads as a circle. */
      var driftX = DRIFT_X * (0.7 * Math.sin(0.028 * 6.283 * t + s.ph[0]) +
                              0.3 * Math.sin(0.011 * 6.283 * t + s.ph[4]));
      var driftY = DRIFT_Y * (0.7 * Math.cos(0.022 * 6.283 * t + s.ph[1]) +
                              0.3 * Math.cos(0.009 * 6.283 * t + s.ph[5]));
      var breathe = 1 + BREATHE * Math.sin(0.020 * 6.283 * t + s.ph[2]);
      var rot = SPIN * Math.sin(0.020 * 6.283 * t + s.ph[3]) + s.spin;

      var px = s.px, py = s.py;
      var tx = clamp(driftX + s.bxo, s.txLo, s.txHi) + s.ux * SCROLL_X * out;
      var ty = clamp(driftY + s.byo, s.tyLo, s.tyHi) +
               s.uy * SCROLL_Y * out - SCROLL_LIFT * out;

      // Centre in viewport px, and a cheap reject before any point work.
      var ccx = hLeft + s.ox + s.hw + tx, ccy = hTop + s.oy + s.hh + ty;
      var near = hasPointer &&
                 Math.abs(mx - ccx) < s.reach && Math.abs(my - ccy) < s.reach;
      var fresh = false;
      var k;

      if (near) { idle(s, t); fresh = true; }

      /* where is the cursor, in this shape's own user units? */
      var pen = 0, cux = 0, cuy = 0, dirx = 0, diry = 0;
      if (near) {
        var vx = mx - ccx, vy = my - ccy;
        var ca = Math.cos(-rot * RAD), sa = Math.sin(-rot * RAD);
        var kk = breathe * s.scale || 1;
        // undo the transform, then px -> user units, origin at the box corner
        var lx = (vx * ca - vy * sa) / kk + s.hw / s.scale + s.vbx;
        var ly = (vx * sa + vy * ca) / kk + s.hh / s.scale + s.vby;

        /* nearest point on the outline, and whether we're inside it */
        var best = 1e12, bi = 0, inside = false, j = n - 1;
        for (k = 0; k < n; k++) {
          var ddx = px[k] - lx, ddy = py[k] - ly;
          var dd = ddx * ddx + ddy * ddy;
          if (dd < best) { best = dd; bi = k; }
          if ((py[k] > ly) !== (py[j] > ly) &&
              lx < (px[j] - px[k]) * (ly - py[k]) / (py[j] - py[k]) + px[k]) {
            inside = !inside;
          }
          j = k;
        }
        var dist = Math.sqrt(best);                 // user units
        var pad = CONTACT_PAD / s.scale;

        if (inside || dist < pad) {
          // press direction runs from outside the surface toward the inside
          var qx = px[bi], qy = py[bi];
          var ex = lx - qx, ey = ly - qy;
          var el2 = Math.hypot(ex, ey) || 1;
          if (inside) { dirx = ex / el2; diry = ey / el2; }
          else        { dirx = -ex / el2; diry = -ey / el2; }
          // penetration: how far past the surface the cursor has pushed
          pen = inside ? Math.min(dist, DENT_MAX / s.scale)
                       : (1 - dist / pad) * 2 / s.scale;
          cux = qx; cuy = qy;
        }
      }

      /* dent spring — stiff, lightly damped, so it jiggles back */
      var dentTarget = pen * s.scale;                 // px
      s.dentV += (DENT_K * (dentTarget - s.dent) - DENT_C * s.dentV) * dt;
      s.dent += s.dentV * dt;
      if (s.dent < 0.01 && dentTarget === 0 && Math.abs(s.dentV) < 0.05) {
        s.dent = 0; s.dentV = 0;
      }
      if (pen > 0) { s.dcx = cux; s.dcy = cuy; s.dnx = dirx; s.dny = diry; }

      /* body spring — soft and slow, plus a nudge from the cursor's own
         motion and a little torque when the shove lands off-centre */
      var sinr = Math.sin(rot * RAD), cosr = Math.cos(rot * RAD);
      var tgx = 0, tgy = 0;
      if (pen > 0) {
        // push direction back into viewport space (uniform scale, so a
        // rotation is all that's needed)
        var wx = dirx * cosr - diry * sinr, wy = dirx * sinr + diry * cosr;
        var give = pen * s.scale * BODY_GIVE;
        tgx = wx * give + mvx * ENTRAIN;
        tgy = wy * give + mvy * ENTRAIN;
        var m = Math.hypot(tgx, tgy);
        if (m > BODY_MAX) { tgx = tgx / m * BODY_MAX; tgy = tgy / m * BODY_MAX; }

        var rx = (cux - s.cx) / s.rad, ry = (cuy - s.cy) / s.rad;
        s.spinV += (rx * diry - ry * dirx) * pen * s.scale * TORQUE * dt;
      }
      s.bvx += (BODY_K * (tgx - s.bxo) - BODY_C * s.bvx) * dt;
      s.bvy += (BODY_K * (tgy - s.byo) - BODY_C * s.bvy) * dt;
      s.bxo += s.bvx * dt;
      s.byo += s.bvy * dt;

      s.spinV += (SPIN_K * (0 - s.spin) - SPIN_C * s.spinV) * dt;
      s.spin += s.spinV * dt;
      if (s.spin < -SPIN_MAX || s.spin > SPIN_MAX) {
        s.spin = clamp(s.spin, -SPIN_MAX, SPIN_MAX);
        s.spinV = 0;    // don't bank velocity against the stop
      }

      /* apply the dent to the sampled outline */
      var active = s.dent > 0.05;
      var emit = active || now - s.geomAt > IDLE_GEOM_MS;
      if (emit && !fresh) { idle(s, t); fresh = true; }

      if (active) {
        var depth = s.dent / s.scale;                 // user units
        var R = DENT_RADIUS / s.scale, R2 = R * R;
        var dcx = s.dcx, dcy = s.dcy, dnx = s.dnx, dny = s.dny;
        for (k = 0; k < n; k++) {
          var gx = px[k] - dcx, gy = py[k] - dcy;
          var g2 = gx * gx + gy * gy;
          if (g2 > 4 * R2) continue;
          var u = Math.sqrt(g2) / R;
          var w;
          if (u < 1) { w = 1 - u * u; w = w * w; }    // the dent
          else {                                       // a soft rim around it
            var v = (u - 1.5) / 0.5;
            if (v < -1 || v > 1) continue;
            v = 1 - v * v;
            w = -RIM * v * v;
          }
          px[k] += dnx * depth * w;
          py[k] += dny * depth * w;
        }
      }

      /* emit — an untouched outline doesn't need redrawing every frame */
      if (emit) {
        s.geomAt = now;
        s.path.setAttribute('d', toPath(px, py, s.corner, n));
      }

      s.el.style.transform =
        'translate3d(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px,0)' +
        ' rotate(' + rot.toFixed(3) + 'deg)' +
        ' scale(' + breathe.toFixed(4) + ')';
      s.el.style.opacity = (1 - SCROLL_FADE * out).toFixed(3);
    }

    if (running) rafId = requestAnimationFrame(frame);
  }

  /* Quadratics through segment midpoints: smooth everywhere, and cheap.
     Flagged vertices are emitted as lines so corners stay sharp. */
  function toPath(px, py, corner, n) {
    var r = function (v) { return Math.round(v * 10) / 10; };
    var out = ['M', r((px[0] + px[n - 1]) / 2), ',', r((py[0] + py[n - 1]) / 2)];
    for (var k = 0; k < n; k++) {
      var b = (k + 1) % n;
      var mx = r((px[k] + px[b]) / 2), my = r((py[k] + py[b]) / 2);
      if (corner[k]) out.push('L', r(px[k]), ',', r(py[k]), 'L', mx, ',', my);
      else out.push('Q', r(px[k]), ',', r(py[k]), ' ', mx, ',', my);
    }
    out.push('Z');
    return out.join('');
  }

  function start() {
    if (running || !enabled || reduce.matches || document.hidden) return;
    running = true;
    last = 0;
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  }

  /* ---- wiring ------------------------------------------------------ */
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    var now = performance.now();
    if (hasPointer && now > mt) {
      var d = Math.min((now - mt) / 1000, 0.1);
      mvx = (e.clientX - pmx) / d;
      mvy = (e.clientY - pmy) / d;
    }
    pmx = mx = e.clientX; pmy = my = e.clientY;
    mt = now;
    hasPointer = true;
  }, { passive: true });

  function dropPointer() { hasPointer = false; mvx = mvy = 0; }
  document.addEventListener('pointerleave', dropPointer);
  window.addEventListener('blur', dropPointer);

  var remeasure = 0;
  window.addEventListener('resize', function () {
    if (remeasure) return;
    remeasure = requestAnimationFrame(function () { remeasure = 0; measure(); });
  }, { passive: true });

  document.addEventListener('visibilitychange', function () {
    document.hidden ? stop() : start();
  });

  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(function () { measure(); }).observe(hero);
  }

  if (typeof IntersectionObserver === 'function') {
    new IntersectionObserver(function (entries) {
      entries[0].isIntersecting ? start() : stop();
    }, { rootMargin: '200px' }).observe(hero);
  }

  if (reduce.addEventListener) {
    reduce.addEventListener('change', function () {
      if (reduce.matches) { stop(); reset(); } else { measure(); start(); }
    });
  }

  measure();
  start();
  window.addEventListener('load', measure);   // fonts can shift the layout
})();
