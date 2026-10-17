// Hörsaal bei Nacht in Zentralperspektive: in Metern gebaut und auf den Bildschirm projiziert.
// Die Leinwand liegt genau auf dem Folienkasten (.slide); alles andere richtet sich nach ihr.
const scene = document.querySelector(".scene");
const svg = document.querySelector(".hall");
const slide = document.querySelector(".slide");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const H = 900;

function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const n1 = (v) => v.toFixed(1);
let last = "";

function render() {
  const box = scene.getBoundingClientRect();
  const sr = slide.getBoundingClientRect();
  const key = [box.width, box.height, sr.width, sr.height, sr.top - box.top].map(Math.round).join();
  if (key === last || !box.height) return;
  last = key;

  const s = H / box.height;
  const W = Math.round(box.width * s);
  const L = (sr.left - box.left) * s;
  const T = (sr.top - box.top) * s;
  const SWi = sr.width * s;
  const SHi = sr.height * s;
  const cx = L + SWi / 2;
  const r = rng(42);

  // Welt: Kamera im Ursprung, Blick nach +z, y nach oben. Leinwand SW Meter breit, D Meter entfernt.
  const D = 14;
  const SW = 8;
  const YB = 0.75; // Unterkante der Leinwand knapp über der vordersten Reihe
  const f = (SWi * D) / SW;
  const vy = T + 0.6 * SHi; // Augenhöhe im unteren Teil der Leinwand
  const hc = YB + ((T + SHi - vy) * D) / f;
  const X = (x, z) => cx + (x * f) / z;
  const Y = (y, z) => vy + ((hc - y) * f) / z;
  const pt = (x, y, z) => `${n1(X(x, z))} ${n1(Y(y, z))}`;

  const FW = SW / 2 + 0.9; // halbe Breite der Stirnwand
  const CEIL = YB + (SHi / SWi) * SW + 3;
  const xw = (z) => FW + (D - z) * 0.3; // Saal öffnet sich nach hinten
  const back = [];
  const rows = [];

  // Stirnwand, Seitenwände mit Holzlamellen
  back.push(`<rect width="${W}" height="${H}" fill="url(#room)"/>`);
  for (const side of [-1, 1]) {
    const zn = 0.4;
    back.push(
      `<path d="M${pt(side * FW, -1, D)}L${pt(side * FW, CEIL, D)}L${pt(side * xw(zn), CEIL + 4, zn)}L${pt(side * xw(zn), -1, zn)}Z" fill="url(#side)"/>`,
    );
    let slats = "";
    for (let z = D - 0.12; z > 4; z -= 0.26) {
      const x = side * xw(z);
      const xs = X(x, z);
      if (xs < -4 || xs > W + 4) break;
      const o = 0.26 * Math.exp(-(D - z) / 2.6);
      slats += `<line x1="${n1(xs)}" y1="${n1(Y(CEIL, z))}" x2="${n1(xs)}" y2="${n1(Y(0, z))}" stroke-width="${Math.max(0.6, (0.03 * f) / z).toFixed(2)}" stroke-opacity="${o.toFixed(3)}"/>`;
    }
    back.push(`<g class="slat lit">${slats}</g>`);
  }
  const fx0 = X(-FW, D);
  const fx1 = X(FW, D);
  back.push(`<rect x="${n1(fx0)}" y="${n1(Y(CEIL, D))}" width="${n1(fx1 - fx0)}" height="${n1(Y(-1, D) - Y(CEIL, D))}" fill="url(#front)"/>`);

  // Lichthof der Leinwand auf Wand und Saal
  back.push(
    `<ellipse class="lit" cx="${n1(cx)}" cy="${n1(T + SHi * 0.55)}" rx="${n1(SWi * 1.05)}" ry="${n1(SHi * 1.25)}" fill="url(#spill)"/>`,
  );

  // Beamerstrahl von der Decke hinter dem Bildrand auf die Leinwand, mit feinen Bahnen und Staub
  const lx = cx;
  const ly = Y(hc + 2.4, 2.6);
  const beamAt = (y, t) => {
    const k = (y - ly) / (T - ly);
    return lx + (L + t * SWi - lx) * k;
  };
  let rays = "";
  for (let i = 0; i < 9; i++) {
    const a = r();
    const w = 0.015 + r() * 0.05;
    rays += `<path d="M${n1(lx)} ${n1(ly)}L${n1(L + a * SWi)} ${n1(T)}L${n1(L + Math.min(1, a + w) * SWi)} ${n1(T)}Z" opacity="${(0.25 + r() * 0.5).toFixed(2)}"/>`;
  }
  const motes = [];
  const nm = Math.round(Math.min(56, W / 28));
  for (let i = 0; i < nm; i++) {
    const y = T * (0.06 + r() * 0.92);
    const x = beamAt(y, 0.04 + r() * 0.92);
    motes.push({ x, y, rad: (0.5 + r() ** 2 * 1.3) * s, dx: (r() - 0.5) * 26 * s, dy: (r() - 0.35) * 18 * s, t: 9 + r() * 14, w: -r() * 20, o0: 0.15 + r() * 0.35, o1: 0.35 + r() * 0.55 });
  }
  back.push(`<g class="beam">
    <path d="M${n1(lx)} ${n1(ly)}L${n1(L)} ${n1(T)}L${n1(L + SWi)} ${n1(T)}Z" fill="url(#beam)"/>
    <g fill="url(#ray)" filter="url(#soft)">${rays}</g></g>`);
  back.push(
    `<g class="mote-wrap">${motes.map((m) => `<circle class="mote" cx="${n1(m.x)}" cy="${n1(m.y)}" r="${m.rad.toFixed(2)}" data-m="${m.dx.toFixed(1)},${m.dy.toFixed(1)},${m.t.toFixed(1)},${m.w.toFixed(1)},${m.o0.toFixed(2)},${m.o1.toFixed(2)}"/>`).join("")}</g>`,
  );

  // Leinwand: Bloom dahinter, Fläche mit Lichtkern, feiner Rahmen
  back.push(`<g class="screen">
    <rect x="${n1(L - 6 * s)}" y="${n1(T - 6 * s)}" width="${n1(SWi + 12 * s)}" height="${n1(SHi + 12 * s)}" rx="${n1(10 * s)}" fill="#2b44c4" opacity=".2" filter="url(#bloom)"/>
    <rect x="${n1(L)}" y="${n1(T)}" width="${n1(SWi)}" height="${n1(SHi)}" fill="url(#screen)"/>
    <rect x="${n1(L)}" y="${n1(T)}" width="${n1(SWi)}" height="${n1(SHi)}" fill="url(#hot)"/>
    <rect x="${n1(L + 0.5 * s)}" y="${n1(T + 0.5 * s)}" width="${n1(SWi - s)}" height="${n1(SHi - s)}" fill="none" stroke="#b9c9ff" stroke-opacity=".16" stroke-width="${n1(s)}"/></g>`);

  // Pult mit Leselampe vorn links
  const pz = D - 2.3;
  const px0 = -SW / 2 - 1.1;
  rows.push({
    d: 1,
    html: `<path d="M${pt(px0, 0, pz)}L${pt(px0, 1.12, pz)}L${pt(px0 + 0.75, 1.12, pz)}L${pt(px0 + 0.75, 0, pz)}Z" fill="#080b12"/>
      <path class="rim lit" d="M${pt(px0, 1.12, pz)}L${pt(px0 + 0.75, 1.12, pz)}" stroke-width="${n1(s)}" stroke-opacity=".5"/>
      <g class="lamp"><circle class="lamp-glow" cx="${n1(X(px0 + 0.55, pz))}" cy="${n1(Y(1.2, pz))}" r="${n1(26 * s)}" fill="url(#warm)"/>
      <circle cx="${n1(X(px0 + 0.55, pz))}" cy="${n1(Y(1.2, pz))}" r="${n1(1.6 * s)}" fill="#ffd9a6"/></g>`,
  });

  // Sitzreihen als konzentrische Bögen um das Pult, steigend nach hinten, mit zwei Gängen
  const ZS = D - 1.2;
  const R0 = 2.7;
  const PITCH = 0.95;
  const rake = Math.max(0.06, (hc - 2.1) / ((ZS - R0) / PITCH));
  const AISLE = 0.44;
  const SEAT = 0.56;
  for (let k = 0; ; k++) {
    const R = R0 + k * PITCH;
    const zm = ZS - R;
    if (zm < 0.55) break;
    const t = k * rake;
    const light = Math.exp(-(D - zm) / 6.5);
    const d = [1.5, 3, 5, 8, 12][Math.min(4, Math.floor(k / 3))];
    let tmax = 0;
    for (let a = 0; a < 0.95; a += 0.01) {
      const z = ZS - R * Math.cos(a);
      if (Math.abs(R * Math.sin(a)) > xw(z) - 0.45) break;
      tmax = a;
    }
    const dA = 0.55 / R;
    const blocks = [
      [-tmax, -AISLE - dA],
      [-AISLE + dA, AISLE - dA],
      [AISLE + dA, tmax],
    ].filter(([a, b]) => (b - a) * R > SEAT * 1.5);
    const P = (a, y) => pt(R * Math.sin(a), y, ZS - R * Math.cos(a));
    let g = "";

    // Rückenlehnen: abgerundete Buckel nebeneinander, Oberkante fängt das Licht der Leinwand
    let minY = Infinity;
    for (const [a, b] of blocks) {
      const n = Math.max(1, Math.floor(((b - a) * R) / SEAT));
      const w = (b - a) / n;
      const top = [];
      for (let i = 0; i < n; i++) {
        for (const u of [0.04, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 0.9, 0.96]) {
          const hump = Math.min(1, Math.sin(Math.PI * u) * 2.4);
          const y = t + 0.8 + 0.15 * hump;
          const p = P(a + (i + u) * w, y);
          top.push(p);
          minY = Math.min(minY, +p.split(" ")[1]);
        }
      }
      const bottom = [];
      for (let j = 0; j <= 12; j++) bottom.push(P(b - ((b - a) * j) / 12, t - 0.02));
      g += `<path d="M${top.join("L")}L${bottom.join("L")}Z" fill="url(#seat)"/>`;
      g += `<path class="rim lit" d="M${top.join("L")}" stroke-width="${Math.min(2.2 * s, Math.max(0.55 * s, (0.012 * f) / zm)).toFixed(2)}" stroke-opacity="${(0.05 + 0.42 * light).toFixed(3)}"/>`;
    }
    if (minY > H + 10) break;

    // Stufenlicht im Gang, zwischen dieser und der nächsten Reihe (dort ist der Blick durch die Lücke frei)
    const R2 = R + PITCH;
    for (const side of [-1, 1]) {
      const a = side * AISLE;
      const z1 = ZS - R * Math.cos(a);
      const z2 = ZS - R2 * Math.cos(a);
      const lxp = X(R * Math.sin(a), z1) * 0.55 + X(R2 * Math.sin(a), z2) * 0.45;
      const lyp = Y(t + 0.8, z1) * 0.55 + Y(t + rake + 0.8, z2) * 0.45;
      if (lyp > H + 20) continue;
      const rr = Math.max(0.7 * s, (0.026 * f) / z1);
      g += `<g class="step" data-k="${k}"><circle class="step-glow" cx="${n1(lxp)}" cy="${n1(lyp)}" r="${n1(rr * 9)}" fill="url(#warm)" opacity=".5"/><circle cx="${n1(lxp)}" cy="${n1(lyp)}" r="${n1(rr)}" fill="#ffc68a"/></g>`;
    }
    rows.push({ d, html: g });
  }

  // Dunst über den vorderen Reihen, Licht der Leinwand auf dem Saal
  const sb = T + SHi;
  rows.push({
    d: 2,
    html: `<rect class="lit" x="0" y="${n1(sb)}" width="${W}" height="${n1(Math.min(H - sb, 150 * s))}" fill="url(#haze)"/>
      <rect class="lit" x="${n1(cx - SWi)}" y="${n1(sb)}" width="${n1(2 * SWi)}" height="${n1(H - sb)}" fill="url(#pool)"/>`,
  });

  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = `<defs>
    <linearGradient id="room" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05070c"/><stop offset="1" stop-color="#030408"/></linearGradient>
    <linearGradient id="front" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04060a"/><stop offset=".6" stop-color="#080b13"/><stop offset="1" stop-color="#05070c"/></linearGradient>
    <linearGradient id="side" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#030408"/><stop offset=".6" stop-color="#06080e"/><stop offset="1" stop-color="#040509"/></linearGradient>
    <linearGradient id="seat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#18203a"/><stop offset=".3" stop-color="#0a0e1a"/><stop offset=".7" stop-color="#05070c"/><stop offset="1" stop-color="#030407"/></linearGradient>
    <linearGradient id="screen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#121a2d"/><stop offset="1" stop-color="#0b1120"/></linearGradient>
    <radialGradient id="hot" cx=".5" cy=".18" r=".75"><stop offset="0" stop-color="#9fb4ff" stop-opacity=".13"/><stop offset="1" stop-color="#9fb4ff" stop-opacity="0"/></radialGradient>
    <radialGradient id="spill"><stop offset="0" stop-color="#6f8cff" stop-opacity=".1"/><stop offset=".55" stop-color="#4a63d6" stop-opacity=".03"/><stop offset="1" stop-color="#4a63d6" stop-opacity="0"/></radialGradient>
    <radialGradient id="pool" cx=".5" cy="0" r=".75"><stop offset="0" stop-color="#7d97ff" stop-opacity=".09"/><stop offset=".6" stop-color="#5068d8" stop-opacity=".03"/><stop offset="1" stop-color="#5068d8" stop-opacity="0"/></radialGradient>
    <radialGradient id="warm"><stop offset="0" stop-color="#ffb36b" stop-opacity=".6"/><stop offset=".35" stop-color="#ff9a4a" stop-opacity=".14"/><stop offset="1" stop-color="#ff9a4a" stop-opacity="0"/></radialGradient>
    <linearGradient id="fade" gradientUnits="userSpaceOnUse" x1="${n1(cx - SWi * 1.15)}" y1="0" x2="${n1(cx + SWi * 1.15)}" y2="0"><stop offset="0" stop-color="#c3d2ff" stop-opacity="0"/><stop offset=".32" stop-color="#c3d2ff"/><stop offset=".68" stop-color="#c3d2ff"/><stop offset="1" stop-color="#c3d2ff" stop-opacity="0"/></linearGradient>
    <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ea5ff" stop-opacity="0"/><stop offset=".3" stop-color="#8ea5ff" stop-opacity=".05"/><stop offset="1" stop-color="#8ea5ff" stop-opacity="0"/></linearGradient>
    <linearGradient id="beam" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${n1(T)}"><stop offset="0" stop-color="#b8c8ff" stop-opacity=".02"/><stop offset="1" stop-color="#b8c8ff" stop-opacity=".12"/></linearGradient>
    <linearGradient id="ray" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${n1(T)}"><stop offset="0" stop-color="#d6e0ff" stop-opacity="0"/><stop offset="1" stop-color="#d6e0ff" stop-opacity=".16"/></linearGradient>
    <filter id="soft" x="-20%" y="-5%" width="140%" height="110%"><feGaussianBlur stdDeviation="${n1(3 * s)}"/></filter>
    <filter id="bloom" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${n1(34 * s)}"/></filter>
  </defs>${back.join("")}${rows.map((x) => `<g class="layer" data-d="${x.d}">${x.html}</g>`).join("")}`;

  // Stil-Attribute aus innerHTML blockiert die CSP; Variablen deshalb über das CSSOM setzen.
  svg.querySelectorAll(".layer").forEach((el) => el.style.setProperty("--d", el.dataset.d));
  svg.querySelectorAll(".step").forEach((el) => el.style.setProperty("--k", el.dataset.k));
  svg.querySelectorAll(".mote").forEach((el) => {
    const [dx, dy, t, w, o0, o1] = el.dataset.m.split(",");
    for (const [p, v] of [["--dx", `${dx}px`], ["--dy", `${dy}px`], ["--t", `${t}s`], ["--w", `${w}s`], ["--o0", o0], ["--o1", o1]]) el.style.setProperty(p, v);
  });

  // Auftakt nur beim Laden; ein frühes Neuzeichnen (Schrift geladen) startet ihn einfach neu.
  svg.classList.toggle("intro", !reduce && performance.now() < 1500);
}

// Kalenderwoche nach ISO 8601, wie in der App
const heute = new Date();
const d = new Date(Date.UTC(heute.getFullYear(), heute.getMonth(), heute.getDate()));
d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
const kw = Math.ceil(((d - Date.UTC(d.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
document.querySelector(".kw").textContent = `KW ${kw}`;
document.querySelector(".badge").hidden = false;

// Vor dem ersten Zeichnen, damit der Folienkasten schon seine endgültige Höhe hat
if (!reduce) document.body.classList.add("typing");
render();
new ResizeObserver(render).observe(document.body);
document.fonts?.ready.then(render);

// Leichte Tiefe beim Bewegen der Maus (nur feine Zeiger, nicht bei reduzierter Bewegung).
if (!reduce && matchMedia("(hover: hover) and (pointer: fine)").matches) {
  addEventListener("pointermove", (e) => {
    scene.style.setProperty("--px", ((e.clientX / innerWidth) * 2 - 1).toFixed(3));
    scene.style.setProperty("--py", ((e.clientY / innerHeight) * 2 - 1).toFixed(3));
  });
}

// Was der Lernhelfer macht, als Schreibmaschine; ein Durchlauf, der letzte Punkt bleibt stehen.
const typed = document.querySelector(".typed");
const caret = document.querySelector(".caret");
const items = [...document.querySelectorAll(".points li")].map((li) => li.textContent);
const wait = (ms) => new Promise((res) => setTimeout(res, ms));

async function typeAll() {
  await wait(1900);
  for (const [k, text] of items.entries()) {
    for (let i = 1; i <= text.length; i++) {
      typed.textContent = text.slice(0, i);
      await wait(36);
    }
    if (k === items.length - 1) break;
    await wait(1500);
    for (let i = text.length; i >= 0; i--) {
      typed.textContent = text.slice(0, i);
      await wait(13);
    }
    await wait(220);
  }
  await wait(1200);
  caret.classList.add("done");
}

if (!reduce) typeAll();
