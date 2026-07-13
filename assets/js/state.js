"use strict";

// ---------- state ----------
let segOwner, soldiers, tracers, booms, corpses, markers, craters, clouds, wrecks;
let particles, flashes, tracks, haze;
let reserves, reserveT, gameT, over, shake;
let armed, artyCd, gasCd, tankCd, tank;
let aiReinfT, aiCounterT, aiArtyT, aiPushT, aiGasT;
let hoverSeg;                                  // {line, sec} under the mouse, or null
const rnd = (a, b) => a + Math.random() * (b - a);
const secX = s => s * SEC_W;

function reset() {
  segOwner = LINE_Y.map((_, l) => Array(SECTORS).fill(l < 2 ? E : l === 2 ? N : P));
  soldiers = []; tracers = []; booms = []; corpses = []; markers = []; craters = [];
  clouds = []; wrecks = []; particles = []; flashes = []; tracks = [];
  haze = Array.from({ length: 4 }, () => ({ x: rnd(0, W), y: rnd(60, 460), r: rnd(120, 220), vx: rnd(3, 9) }));
  reserves = 50; reserveT = 0; gameT = 0; over = false; shake = 0;
  armed = null; artyCd = 0; gasCd = 0; tankCd = 0; tank = null; hoverSeg = null;
  aiReinfT = 5; aiCounterT = 16; aiArtyT = 30; aiPushT = 70; aiGasT = 140;
  for (let s = 0; s < SECTORS; s++) {
    for (let i = 0; i < 12; i++) soldiers.push(mkGarrison(E, 0, s));
    for (let i = 0; i < 12; i++) soldiers.push(mkGarrison(E, 1, s));
    for (let i = 0; i < 10; i++) soldiers.push(mkGarrison(P, 3, s));
    for (let i = 0; i < 12; i++) soldiers.push(mkGarrison(P, 4, s));
  }
  // the enemy races for the central line from the first second
  for (let s = 0; s < SECTORS; s++) {
    const g = garrison(E, 1, s);
    for (let i = 0; i < 7; i++) {
      const u = g[i];
      u.state = "advance"; u.tLine = 2; u.line = -1;
      u.ax = secX(s) + rnd(18, SEC_W - 18); u.ay = LINE_Y[2]; u.spd = rnd(26, 36);
    }
  }
  for (let i = 0; i < 26; i++) craters.push({ x: rnd(20, W - 20), y: rnd(90, 440), r: rnd(6, 15) });
  paintGround();
  document.getElementById("overlay").style.display = "none";
  document.getElementById("toasts").innerHTML = "";
  hideTrenchIcons();
  toast("Race for the Central Line — get there first", "warn");
}

function anchor(l, s) { return { ax: secX(s) + rnd(18, SEC_W - 18), ay: LINE_Y[l] + rnd(-5, 5) }; }
function mkGarrison(side, l, s) {
  const a = anchor(l, s);
  return { side, sec: s, line: l, x: a.ax, y: a.ay, ax: a.ax, ay: a.ay,
           state: "garrison", fireCd: rnd(0.3, 1.5), meleeCd: 0, tLine: l, ph: rnd(0, TAU) };
}
function mkAdvancer(side, s, tLine, x, y) {
  return { side, sec: s, line: -1, x, y, ax: secX(s) + rnd(18, SEC_W - 18), ay: LINE_Y[tLine],
           state: "advance", fireCd: rnd(0.5, 2), meleeCd: 0, tLine, spd: rnd(24, 34), ph: rnd(0, TAU) };
}

function pFront(s) { for (let l = 0; l < LINES; l++) if (segOwner[l][s] === P) return l; return -1; }
function eFront(s) { for (let l = LINES - 1; l >= 0; l--) if (segOwner[l][s] === E) return l; return -1; }
const garrison = (side, l, s) =>
  soldiers.filter(u => u.state === "garrison" && u.side === side && u.line === l && u.sec === s);
const meleeAt = (side, l, s) =>
  soldiers.filter(u => u.state === "melee" && u.side === side && u.tLine === l && u.sec === s);

// ---------- toasts ----------
function toast(text, kind) {
  const box = document.getElementById("toasts");
  const el = document.createElement("div");
  el.className = "toast" + (kind ? " " + kind : "");
  el.textContent = text;
  box.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 300); }, 3200);
}
function toastCapture(side, l, s) {
  const where = LINE_NAME[l] + " (" + SEC_NAME[s] + ")";
  if (side === P) toast(where + " secured", "good");
  else toast(where + " lost", "bad");
}

// ---------- particles ----------
function spawnDirt(x, y, n) {
  for (let i = 0; i < n; i++) particles.push({
    x, y, vx: rnd(-70, 70), vy: rnd(-130, -30), g: 260,
    t: rnd(0.4, 0.9), tot: 0.9, size: rnd(1.5, 3),
    color: Math.random() < 0.5 ? "#3b2f1e" : "#57482e", kind: "dirt"
  });
}
function spawnSmoke(x, y, n, dark) {
  for (let i = 0; i < n; i++) particles.push({
    x: x + rnd(-6, 6), y: y + rnd(-6, 6), vx: rnd(-9, 9), vy: rnd(-26, -12), g: -6,
    t: rnd(1.4, 2.6), tot: 2.6, size: rnd(4, 8),
    color: dark ? "#2a2622" : "#6e6a62", kind: "smoke"
  });
}
function particleTick(dt) {
  for (const p of particles) {
    p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.kind === "smoke") p.size += 5 * dt;
  }
}
