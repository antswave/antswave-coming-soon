// ===== Launch settings =====
const LAUNCH_DATE = new Date("2026-12-01T00:00:00").getTime();
// When the countdown "started" — used for the progress bar
const START_DATE = new Date("2026-10-01T00:00:00").getTime();

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ===== Countdown =====
const els = {
  days: document.getElementById("days"),
  hours: document.getElementById("hours"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds"),
  status: document.getElementById("status-text"),
  progress: document.getElementById("progress"),
};

const pad = (n) => String(n).padStart(2, "0");

function setValue(el, value) {
  if (el.textContent === value) return;
  el.textContent = value;
  el.classList.remove("tick");
  void el.offsetWidth; // restart the animation
  el.classList.add("tick");
}

function updateCountdown() {
  const now = Date.now();
  const distance = Math.max(0, LAUNCH_DATE - now);

  const d = Math.floor(distance / 86400000);
  const h = Math.floor((distance % 86400000) / 3600000);
  const m = Math.floor((distance % 3600000) / 60000);
  const s = Math.floor((distance % 60000) / 1000);

  setValue(els.days, pad(d));
  setValue(els.hours, pad(h));
  setValue(els.minutes, pad(m));
  setValue(els.seconds, pad(s));

  const pct = Math.min(100, Math.max(0, ((now - START_DATE) / (LAUNCH_DATE - START_DATE)) * 100));
  els.progress.style.width = pct.toFixed(2) + "%";

  if (distance === 0) {
    els.status.textContent = "We're live!";
    clearInterval(timer);
  } else if (d === 0) {
    els.status.textContent = "Launching today";
  } else if (d === 1) {
    els.status.textContent = "Just 1 day left";
  } else {
    els.status.textContent = `Just ${d} days left`;
  }
}

const timer = setInterval(updateCountdown, 1000);
updateCountdown();

// ===== Twinkling stars =====
const starBox = document.getElementById("stars");
(function createStars() {
  const count = window.innerWidth < 640 ? 40 : 80;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const star = document.createElement("span");
    const size = Math.random() * 2 + 1;
    star.className = "star";
    star.style.cssText = `
      width:${size}px;height:${size}px;
      top:${Math.random() * 85}%;left:${Math.random() * 100}%;
      --t:${(Math.random() * 3 + 2).toFixed(2)}s;
      --delay:${(-Math.random() * 5).toFixed(2)}s;`;
    frag.appendChild(star);
  }
  starBox.appendChild(frag);
})();

// ===== Shooting stars =====
if (!reduceMotion) {
  setInterval(() => {
    if (document.hidden) return;
    const s = document.createElement("span");
    s.className = "shooting-star";
    s.style.top = Math.random() * 40 + "%";
    s.style.left = 40 + Math.random() * 60 + "%";
    starBox.appendChild(s);
    s.addEventListener("animationend", () => s.remove());
  }, 4000);
}

// ===== Mouse spotlight + parallax (pointer devices only) =====
const page = document.getElementById("page");
const pointer = { x: -9999, y: -9999, active: false };
if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
  let raf = null;
  window.addEventListener("pointermove", (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      page.style.setProperty("--mx", e.clientX + "px");
      page.style.setProperty("--my", e.clientY + "px");
      page.style.setProperty("--px", (x - 0.5).toFixed(3));
      page.style.setProperty("--py", (y - 0.5).toFixed(3));
      raf = null;
    });
  });
  document.addEventListener("pointerleave", () => (pointer.active = false));
}

// ===== Ant colony — ants wander, find food, carry crumbs home to the nest =====
(function antColony() {
  const box = document.getElementById("ants");
  if (!box || reduceMotion) return;

  const NS = "http://www.w3.org/2000/svg";
  const rand = (a, b) => a + Math.random() * (b - a);
  const TAU = Math.PI * 2;
  let W = window.innerWidth;
  let H = window.innerHeight;
  const small = W < 640;
  const ANT_COUNT = small ? 6 : W < 1100 ? 9 : 12;
  const MAX_FOOD = small ? 3 : 4;

  // --- Pheromone trail (canvas under the ants) ---
  const trail = document.createElement("canvas");
  trail.className = "trail";
  box.appendChild(trail);
  const tctx = trail.getContext("2d");
  const trailDots = []; // {x, y, life}
  function sizeTrail() {
    const d = Math.min(window.devicePixelRatio || 1, 2);
    trail.width = Math.round(W * d);
    trail.height = Math.round(H * d);
    tctx.setTransform(d, 0, 0, d, 0, 0);
  }

  // --- Nest ---
  const nest = { x: 0, y: 0, el: document.createElement("div") };
  nest.el.className = "nest";
  box.appendChild(nest.el);
  function placeNest() {
    nest.x = small ? 42 : Math.max(60, W * 0.06);
    nest.y = H - (small ? 64 : 78);
    nest.el.style.transform = `translate(${nest.x}px, ${nest.y}px)`;
  }
  setTimeout(() => nest.el.classList.add("in"), 500);

  // --- Keep auto-spawned food away from the text & countdown ---
  let contentRects = [];
  function measure() {
    contentRects = [...document.querySelectorAll("main > *, header > *")].map((e) => e.getBoundingClientRect());
  }
  const blocked = (x, y) =>
    contentRects.some((r) => x > r.left - 24 && x < r.right + 24 && y > r.top - 24 && y < r.bottom + 24);

  // --- Food ---
  const foods = [];
  function addFood(x, y) {
    if (x == null) {
      let tries = 0;
      do {
        x = rand(40, W - 40);
        y = rand(70, H - 50);
        tries++;
      } while ((blocked(x, y) || Math.hypot(x - nest.x, y - nest.y) < Math.min(W, H) * 0.3) && tries < 40);
    }
    const el = document.createElement("div");
    el.className = "food";
    el.style.transform = `translate(${x}px, ${y}px)`;
    const amount = Math.round(rand(5, 8));
    for (let i = 0; i < amount; i++) {
      const c = document.createElement("span");
      c.style.cssText = `--cx:${rand(-7, 7).toFixed(1)}px;--cy:${rand(-6, 6).toFixed(1)}px;--s:${rand(4, 7).toFixed(1)}px;--dl:${(i * 0.05).toFixed(2)}s`;
      el.appendChild(c);
    }
    box.appendChild(el);
    foods.push({ x, y, amount, el });
    // Too much food on screen? Remove the oldest pile.
    if (foods.length > MAX_FOOD + 2) removeFood(foods[0]);
  }
  function removeFood(f) {
    const i = foods.indexOf(f);
    if (i !== -1) foods.splice(i, 1);
    f.amount = 0;
    f.el.classList.add("gone");
    setTimeout(() => f.el.remove(), 450);
  }
  function biteFood(f) {
    f.amount--;
    f.el.lastElementChild?.remove();
    if (f.amount <= 0) removeFood(f);
  }

  // --- Ants ---
  const ants = [];
  for (let i = 0; i < ANT_COUNT; i++) {
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 40 30");
    svg.innerHTML = document.getElementById("ant").innerHTML;
    svg.setAttribute("class", "walker");
    const size = rand(16, 24);
    svg.style.setProperty("--size", size + "px");
    box.appendChild(svg);
    ants.push({
      el: svg,
      x: rand(0.05, 0.95) * W,
      y: rand(0.05, 0.95) * H,
      angle: rand(0, TAU),
      turn: 0,
      baseSpeed: rand(0.6, 1.05) * (size / 20),
      speed: 0,
      rest: 0,
      fear: 0,
      state: "wander", // wander | seek | carry
      target: null,
      drop: 0,
    });
    setTimeout(() => svg.classList.add("in"), 600 + i * 200);
  }

  function setRest(a, frames) {
    a.rest = frames;
    a.el.classList.toggle("resting", frames > 0);
  }
  function angleDiff(a, b) {
    let d = (a - b) % TAU;
    if (d > Math.PI) d -= TAU;
    if (d < -Math.PI) d += TAU;
    return d;
  }
  function nearestFood(a, radius) {
    let best = null;
    let bd = radius;
    for (const f of foods) {
      const d = Math.hypot(f.x - a.x, f.y - a.y);
      if (d < bd) {
        bd = d;
        best = f;
      }
    }
    return best;
  }

  let last = performance.now();
  function step(now) {
    const dt = Math.min(3, (now - last) / 16.67);
    last = now;
    const sense = Math.max(W, H) * 0.5;

    for (const a of ants) {
      if (a.rest > 0) {
        a.rest -= dt;
        if (a.rest <= 0) setRest(a, 0);
      }

      // Natural wiggle
      a.turn += rand(-0.02, 0.02) * dt;
      a.turn = Math.max(-0.06, Math.min(0.06, a.turn)) * 0.97;
      let desired = a.angle + a.turn * dt * (a.state === "wander" ? 1 : 0.5);

      if (a.state === "wander") {
        if (a.rest <= 0 && Math.random() < 0.002 * dt) setRest(a, rand(30, 100));
        if (Math.random() < 0.02 * dt) {
          const f = nearestFood(a, sense);
          if (f) {
            a.state = "seek";
            a.target = f;
          }
        }
      } else if (a.state === "seek") {
        const f = a.target;
        if (!f || f.amount <= 0) {
          a.state = "wander";
          a.target = null;
        } else {
          const d = Math.hypot(f.x - a.x, f.y - a.y);
          desired += angleDiff(Math.atan2(f.y - a.y, f.x - a.x), desired) * 0.12 * dt;
          if (d < 8) {
            biteFood(f);
            a.state = "carry";
            a.target = null;
            a.el.classList.add("carrying");
            setRest(a, 18); // pause to pick it up
          }
        }
      } else if (a.state === "carry") {
        const d = Math.hypot(nest.x - a.x, nest.y - a.y);
        desired += angleDiff(Math.atan2(nest.y - a.y, nest.x - a.x), desired) * 0.1 * dt;
        // leave a pheromone trail
        a.drop -= dt;
        if (a.drop <= 0 && a.speed > 0.2) {
          trailDots.push({ x: a.x - Math.cos(a.angle) * 6, y: a.y - Math.sin(a.angle) * 6, life: 1 });
          a.drop = 5;
        }
        if (d < 10) {
          a.state = "wander";
          a.el.classList.remove("carrying");
          nest.el.classList.remove("fed");
          void nest.el.offsetWidth;
          nest.el.classList.add("fed");
          a.angle += Math.PI + rand(-0.8, 0.8); // turn around, head back out
          desired = a.angle;
          setRest(a, 20);
        }
      }

      // Steer back from the edges
      const m = 30;
      if (a.x < m || a.x > W - m || a.y < m || a.y > H - m) {
        desired += angleDiff(Math.atan2(H / 2 - a.y, W / 2 - a.x), desired) * 0.08 * dt;
      }

      // Scurry away from the mouse cursor
      a.fear = Math.max(0, a.fear - 0.02 * dt);
      if (pointer.active) {
        const dx = a.x - pointer.x;
        const dy = a.y - pointer.y;
        if (dx * dx + dy * dy < 90 * 90) {
          desired += angleDiff(Math.atan2(dy, dx), desired) * 0.25;
          a.fear = 1;
          if (a.rest > 0) setRest(a, 0);
        }
      }

      a.angle = desired % TAU;
      const busy = a.state !== "wander" ? 1.15 : 1;
      const target = a.rest > 0 ? 0 : a.baseSpeed * busy * (1 + a.fear * 2.5);
      a.speed += (target - a.speed) * 0.15;
      a.x = Math.max(-10, Math.min(W + 10, a.x + Math.cos(a.angle) * a.speed * dt));
      a.y = Math.max(-10, Math.min(H + 10, a.y + Math.sin(a.angle) * a.speed * dt));

      a.el.style.setProperty("--step", (0.26 / Math.max(0.6, a.speed)).toFixed(2) + "s");
      a.el.style.transform = `translate(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px) rotate(${a.angle.toFixed(3)}rad)`;
    }

    // Draw & fade the trail
    tctx.clearRect(0, 0, W, H);
    for (let i = trailDots.length - 1; i >= 0; i--) {
      const p = trailDots[i];
      p.life -= 0.004 * dt;
      if (p.life <= 0) {
        trailDots.splice(i, 1);
        continue;
      }
      tctx.fillStyle = `rgba(255, 210, 194, ${(p.life * 0.45).toFixed(3)})`;
      tctx.beginPath();
      tctx.arc(p.x, p.y, 1.4, 0, TAU);
      tctx.fill();
    }

    requestAnimationFrame(step);
  }

  // Click / tap anywhere (except buttons & links) to drop food
  window.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button, a")) return;
    addFood(e.clientX, e.clientY);
  });

  // Food keeps appearing on its own
  setInterval(() => {
    if (!document.hidden && foods.length < MAX_FOOD) addFood();
  }, 4500);

  function layout() {
    W = window.innerWidth;
    H = window.innerHeight;
    sizeTrail();
    placeNest();
    measure();
  }
  layout();
  window.addEventListener("resize", layout);
  setTimeout(() => {
    measure(); // after entrance animations settle
    addFood();
    addFood();
  }, 1600);

  requestAnimationFrame(step);
})();

// ===== Ants Wave — a 3D field of tiny "ants" (particles) moving as one wave =====
(function antWave() {
  const canvas = document.getElementById("ant-wave");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const CORAL = [255, 87, 83];
  const PEACH = [255, 177, 153];
  const VIOLET = [168, 100, 255];

  let w, h, dpr, cols, rows;
  let bump = 0; // eased pointer influence
  let bumpX = 0;

  // Scout ants: bright particles running along the wave crests
  const scouts = Array.from({ length: 6 }, (_, i) => ({
    row: 0.35 + Math.random() * 0.6, // depth position (0 = far, 1 = near)
    x: Math.random(), // 0..1 across
    speed: 0.0006 + Math.random() * 0.0008,
    trail: [],
  }));

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = w < 640 ? 60 : w < 1100 ? 96 : 130;
    rows = h < 220 ? 18 : 28;
  }

  const mix = (a, b, t) => a + (b - a) * t;
  const mixColor = (c1, c2, t) => [mix(c1[0], c2[0], t), mix(c1[1], c2[1], t), mix(c1[2], c2[2], t)];

  // World → screen. u: -1..1 across, p: 0 (far) .. 1 (near), y: height
  const Z_NEAR = 1, Z_FAR = 7, SPREAD = 3.2;
  function project(u, p, y) {
    const z = mix(Z_FAR, Z_NEAR, p);
    const s = 1 / z;
    return {
      x: w / 2 + u * SPREAD * s * w * 0.55,
      y: h * 0.18 + (1.05 - y) * s * h * 0.85,
      s,
      z,
    };
  }

  function height(u, p, t, sx) {
    const z = mix(Z_FAR, Z_NEAR, p);
    let y =
      0.34 * Math.sin(u * 3.2 + t * 0.9) +
      0.22 * Math.sin(z * 1.4 - t * 1.3) +
      0.1 * Math.sin((u * 5 + z) * 1.1 + t * 1.7);
    if (bump > 0.001) {
      const d = (sx - bumpX) / (w * 0.12);
      y += 0.35 * bump * Math.exp(-d * d) * (0.4 + p * 0.6);
    }
    return y;
  }

  function draw(time) {
    const t = time * 0.001;
    ctx.clearRect(0, 0, w, h);

    // ease pointer influence
    bump = mix(bump, pointer.active ? 1 : 0, 0.05);
    if (pointer.active) bumpX = mix(bumpX || pointer.x, pointer.x, 0.12);

    for (let r = 0; r < rows; r++) {
      const p = r / (rows - 1);
      const depthAlpha = 0.12 + Math.pow(p, 1.3) * 0.8;
      for (let c = 0; c < cols; c++) {
        const u = (c / (cols - 1)) * 2 - 1;
        const flat = project(u, p, 0);
        if (flat.x < -10 || flat.x > w + 10) continue;
        const y = height(u, p, t, flat.x);
        const pt = project(u, p, y);
        const crest = Math.min(1, Math.max(0, (y + 0.4) / 0.9));
        const col = mixColor(mixColor(VIOLET, CORAL, (u + 1) / 2), PEACH, crest * 0.6);
        const size = Math.max(0.6, pt.s * 3.2 * (0.7 + crest * 0.6));
        ctx.fillStyle = `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${depthAlpha * (0.55 + crest * 0.45)})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Scout ants with glowing trails
    for (const a of scouts) {
      a.x += a.speed;
      if (a.x > 1.05) {
        a.x = -0.05;
        a.trail.length = 0;
      }
      const u = a.x * 2 - 1;
      const flat = project(u * 0.55, a.row, 0);
      const y = height(u * 0.55, a.row, t, flat.x) + 0.04;
      const pt = project(u * 0.55, a.row, y);
      a.trail.push({ x: pt.x, y: pt.y });
      if (a.trail.length > 14) a.trail.shift();

      for (let i = 0; i < a.trail.length; i++) {
        const q = a.trail[i];
        const k = i / a.trail.length;
        ctx.fillStyle = `rgba(255,${(150 + k * 80) | 0},${(140 + k * 60) | 0},${k * 0.5})`;
        ctx.beginPath();
        ctx.arc(q.x, q.y, pt.s * 3 * k + 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowColor = "rgba(255,87,83,0.9)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.s * 5 + 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  let running = false;
  function loop(time) {
    draw(time);
    if (running) requestAnimationFrame(loop);
  }
  function start() {
    if (running || reduceMotion) return;
    running = true;
    requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener("resize", () => {
    resize();
    if (reduceMotion) draw(0);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) running = false;
    else start();
  });

  if (reduceMotion) draw(0);
  else start();
})();
