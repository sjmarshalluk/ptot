/*
 * hero-eyes.js — gives shapes marked .has-eyes a pair of eyes of their own.
 *
 * Independent of hero-shapes.js on purpose: that file owns the outline's `d`
 * and the shape's own `transform` every frame for the idle/dent physics, so
 * this script only ever touches the `<g class="eye">` transform and the
 * pupils' cx/cy — different attributes, no fighting over the same one.
 *
 * Only one shape's eyes are open at a time. Hovering a new shape closes
 * whichever is open first, and only starts opening the next one once that
 * close has actually finished. Each shape also closes itself again after a
 * couple of blinks, even if the cursor never left it — nudging the cursor
 * re-wakes it. Eye geometry (centres, radii, resting look direction) is read
 * straight off the SVG markup shape.njk emits, not hardcoded here.
 */
(function () {
  'use strict';

  var hero = document.querySelector('.hero');
  if (!hero) return;

  var els = Array.prototype.slice.call(hero.querySelectorAll('.shape.has-eyes'));
  if (!els.length) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var BLINKS_BEFORE_CLOSE = 2;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function EyeShape(el) {
    this.el = el;
    this.svg = el.querySelector('svg');
    var eyes = el.querySelectorAll('.eye');
    this.eyeL = eyes[0]; this.eyeR = eyes[1];
    this.pupilL = this.eyeL.querySelector('.pupil');
    this.pupilR = this.eyeR.querySelector('.pupil');
    this.cL = { x: +this.eyeL.dataset.cx, y: +this.eyeL.dataset.cy };
    this.cR = { x: +this.eyeR.dataset.cx, y: +this.eyeR.dataset.cy };

    var vb = this.svg.viewBox.baseVal;
    this.vbw = vb.width; this.vbh = vb.height;

    var scleraR = +this.eyeL.querySelector('.sclera').getAttribute('r');
    var pupilR = +this.pupilL.getAttribute('r');
    this.maxOff = scleraR - pupilR - 3;
    this.restX = (+this.pupilL.getAttribute('cx')) - this.cL.x;
    this.restY = (+this.pupilL.getAttribute('cy')) - this.cL.y;

    this.rect = null;
    this.px = 0; this.py = 0;          // pointer, in this svg's user units
    this.open = 0;
    this.pupil = { x: this.restX, y: this.restY };
    this.pupilT = { x: this.restX, y: this.restY };
    this.blinking = false;
    this.blinkTimer = null;
    this.blinkCount = 0;
    this.onAutoClose = null;
  }

  EyeShape.prototype.measure = function () {
    this.rect = this.svg.getBoundingClientRect();
  };

  EyeShape.prototype.setPointer = function (clientX, clientY) {
    if (!this.rect || !this.rect.width) return;
    this.px = (clientX - this.rect.left) * (this.vbw / this.rect.width);
    this.py = (clientY - this.rect.top) * (this.vbh / this.rect.height);
  };

  EyeShape.prototype.gaze = function () {
    var fx = (this.cL.x + this.cR.x) / 2, fy = (this.cL.y + this.cR.y) / 2;
    var dx = this.px - fx, dy = this.py - fy;
    var d = Math.hypot(dx, dy) || 1;
    return { x: dx / d, y: dy / d };
  };

  EyeShape.prototype.scheduleBlink = function (isFirst) {
    var self = this;
    clearTimeout(self.blinkTimer);
    var delay = isFirst ? (850 + Math.random() * 500) : (900 + Math.random() * 700);
    self.blinkTimer = setTimeout(function () {
      if (reduce.matches) return;
      self.blinking = true;
      setTimeout(function () {
        self.blinking = false;
        self.blinkCount++;
        if (self.blinkCount >= BLINKS_BEFORE_CLOSE) {
          if (self.onAutoClose) self.onAutoClose();
        } else {
          self.scheduleBlink(false);
        }
      }, 110);
    }, delay);
  };

  EyeShape.prototype.wake = function () { this.blinkCount = 0; this.scheduleBlink(true); };
  EyeShape.prototype.sleep = function () { clearTimeout(this.blinkTimer); this.blinking = false; };

  function setLid(g, cx, cy, open) {
    var v = Math.max(open, 0.001).toFixed(3);
    g.setAttribute('transform', 'translate(' + cx + ' ' + cy + ') scale(1 ' + v + ') translate(' + -cx + ' ' + -cy + ')');
  }
  function setPupil(el, cx, cy, ox, oy) {
    el.setAttribute('cx', (cx + ox).toFixed(2));
    el.setAttribute('cy', (cy + oy).toFixed(2));
  }

  EyeShape.prototype.render = function () {
    setLid(this.eyeL, this.cL.x, this.cL.y, this.open);
    setLid(this.eyeR, this.cR.x, this.cR.y, this.open);
    setPupil(this.pupilL, this.cL.x, this.cL.y, this.pupil.x, this.pupil.y);
    setPupil(this.pupilR, this.cR.x, this.cR.y, this.pupil.x, this.pupil.y);
  };

  EyeShape.prototype.tick = function (active) {
    var openT = active ? (this.blinking ? 0.05 : 1) : 0;
    var k = openT > this.open ? 0.22 : (this.blinking ? 0.4 : 0.07);
    this.open = lerp(this.open, openT, k);

    if (active) {
      var g = this.gaze();
      this.pupilT.x = g.x * this.maxOff;
      this.pupilT.y = g.y * this.maxOff;
    } else {
      this.pupilT.x = this.restX;
      this.pupilT.y = this.restY;
    }
    this.pupil.x = lerp(this.pupil.x, this.pupilT.x, 0.18);
    this.pupil.y = lerp(this.pupil.y, this.pupilT.y, 0.18);

    this.render();
  };

  var shapes = els.map(function (el) { return new EyeShape(el); });

  var activeId = null, pendingId = null, closingId = null;
  var mx = -1e5, my = -1e5, hasPointer = false;

  function requestActive(id) {
    if (id === activeId) { pendingId = null; return; }
    if (id === pendingId) return;
    if (activeId !== null) { closingId = activeId; shapes[activeId].sleep(); activeId = null; }
    pendingId = id;
  }

  shapes.forEach(function (s, i) {
    s.onAutoClose = function () {
      if (activeId !== i) return;
      closingId = i;
      activeId = null;
      pendingId = null;
    };
  });

  function hitTest() {
    var bestId = null, bestDist = Infinity;
    shapes.forEach(function (s, i) {
      if (!s.rect || !s.rect.width) return;
      var cx = s.rect.left + s.rect.width / 2, cy = s.rect.top + s.rect.height / 2;
      var d = Math.hypot(mx - cx, my - cy);
      if (d <= s.rect.width / 2 && d < bestDist) { bestDist = d; bestId = i; }
    });
    return bestId;
  }

  var enabled = false, running = false, rafId = 0;

  function measure() {
    shapes.forEach(function (s) { s.measure(); });
  }

  function reset() {
    activeId = null; pendingId = null; closingId = null;
    shapes.forEach(function (s) {
      s.sleep();
      s.open = 0; s.pupil.x = s.restX; s.pupil.y = s.restY;
      s.render();
    });
  }

  function frame() {
    rafId = 0;
    measure();
    if (hasPointer) requestActive(hitTest());

    if (pendingId !== null) {
      var canOpen = closingId === null || shapes[closingId].open < 0.05;
      if (canOpen) {
        activeId = pendingId; pendingId = null; closingId = null;
        if (activeId !== null) shapes[activeId].wake();
      }
    }
    shapes.forEach(function (s, i) { s.tick(i === activeId); });

    if (running) rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (running || !enabled || reduce.matches || document.hidden) return;
    running = true;
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  }

  function applyGate() {
    enabled = window.innerWidth > 900;
    if (reduce.matches || !enabled) { stop(); reset(); }
    else start();
  }

  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    mx = e.clientX; my = e.clientY;
    hasPointer = true;
    shapes.forEach(function (s) { s.setPointer(mx, my); });
  }, { passive: true });

  function dropPointer() { hasPointer = false; requestActive(null); }
  document.addEventListener('pointerleave', dropPointer);
  window.addEventListener('blur', dropPointer);

  window.addEventListener('resize', applyGate, { passive: true });
  document.addEventListener('visibilitychange', function () {
    document.hidden ? stop() : start();
  });
  if (reduce.addEventListener) reduce.addEventListener('change', applyGate);

  applyGate();
  window.addEventListener('load', measure); // fonts can shift the layout
})();
