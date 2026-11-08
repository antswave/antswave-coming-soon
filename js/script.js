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
const pointer = { x: -9999, active: false };
if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
  let raf = null;
  window.addEventListener("pointermove", (e) => {
    pointer.x = e.clientX;
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
