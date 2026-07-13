"use strict";

// ---------- tooltip system ----------
const tipEl = document.getElementById("tooltip");
let tipTarget = null;
document.addEventListener("mouseover", e => {
  const t = e.target.closest("[data-tip]");
  if (!t || t === tipTarget || !t.dataset.tip) return;
  tipTarget = t;
  tipEl.innerHTML = t.dataset.tip;
  tipEl.style.display = "block";
  const r = t.getBoundingClientRect(), tr = tipEl.getBoundingClientRect();
  let x = r.left + r.width / 2 - tr.width / 2;
  x = Math.max(6, Math.min(window.innerWidth - tr.width - 6, x));
  let y = r.top - tr.height - 8;
  if (y < 6) y = r.bottom + 8;
  tipEl.style.left = x + "px"; tipEl.style.top = y + "px";
});
document.addEventListener("mouseout", e => {
  if (tipTarget && !tipTarget.contains(e.relatedTarget)) { tipTarget = null; tipEl.style.display = "none"; }
});
document.addEventListener("mousedown", () => { tipTarget = null; tipEl.style.display = "none"; });

// ---------- trench hover icons ----------
const tiEl = document.getElementById("trenchIcons"),
      tiCount = document.getElementById("tiCount"),
      tiDeploy = document.getElementById("tiDeploy"),
      tiAction = document.getElementById("tiAction"),
      tiActionSvg = document.getElementById("tiActionSvg");
let tiSeg = null, tiHideT = null, tiOverIcons = false;
function showTrenchIcons(l, s) {
  tiSeg = { line: l, sec: s };
  const r = cv.getBoundingClientRect(), wrap = document.getElementById("cvwrap");
  const sx = r.width / W, sy = r.height / H;
  tiEl.style.display = "flex";
  refreshTrenchIcons();
  const mw = tiEl.offsetWidth || 140;
  let px = (secX(s) + SEC_W / 2) * sx - mw / 2;
  px = Math.max(4, Math.min(wrap.clientWidth - mw - 4, px));
  let py = LINE_Y[l] * sy - 46;
  if (py < 4) py = LINE_Y[l] * sy + 18;
  tiEl.style.left = px + "px"; tiEl.style.top = py + "px";
}
function hideTrenchIcons() { tiSeg = null; tiEl.style.display = "none"; }
function refreshTrenchIcons() {
  if (!tiSeg) return;
  const l = tiSeg.line, s = tiSeg.sec;
  if (over || segOwner[l][s] !== P) return hideTrenchIcons();
  const n = garrison(P, l, s).length;
  tiCount.textContent = LINE_NAME[l] + " · " + n;
  tiDeploy.disabled = reserves <= 0;
  if (l === 0) { tiAction.style.display = "none"; return; }
  tiAction.style.display = "";
  const above = segOwner[l - 1][s];
  if (above === P) {
    tiAction.dataset.tip = "<b>Advance</b> — move this garrison forward to the friendly trench ahead.";
    tiActionSvg.innerHTML = '<path d="M6.5 12V2M2 6L6.5 1.5 11 6"/>';
  } else {
    tiAction.dataset.tip = "<b>Over the top</b> — send this garrison across no-man's land at the " +
      (above === E ? "enemy trench" : "unclaimed trench") + " ahead.";
    tiActionSvg.innerHTML = '<path d="M2 8l4.5-5L11 8M2 12l4.5-5L11 12"/>';
  }
  tiAction.disabled = n === 0;
}
function segHit(x, y) {
  for (let l = 0; l < LINES; l++) {
    if (Math.abs(y - LINE_Y[l]) < 15) {
      const s = Math.min(SECTORS - 1, Math.floor(x / SEC_W));
      if (segOwner[l][s] === P) return { line: l, sec: s };
    }
  }
  return null;
}
cv.addEventListener("mousemove", e => {
  const r = cv.getBoundingClientRect();
  const x = (e.clientX - r.left) * (W / r.width), y = (e.clientY - r.top) * (H / r.height);
  const hit = over || armed ? null : segHit(x, y);
  hoverSeg = hit;
  cv.style.cursor = armed ? "crosshair" : hit ? "pointer" : "default";
  if (hit) {
    clearTimeout(tiHideT);
    if (!tiSeg || tiSeg.line !== hit.line || tiSeg.sec !== hit.sec) showTrenchIcons(hit.line, hit.sec);
  } else if (tiSeg && !tiOverIcons) {
    clearTimeout(tiHideT);
    tiHideT = setTimeout(() => { if (!tiOverIcons) hideTrenchIcons(); }, 300);
  }
});
cv.addEventListener("mouseleave", () => {
  hoverSeg = null;
  tiHideT = setTimeout(() => { if (!tiOverIcons) hideTrenchIcons(); }, 300);
});
tiEl.addEventListener("mouseenter", () => { tiOverIcons = true; clearTimeout(tiHideT); });
tiEl.addEventListener("mouseleave", () => { tiOverIcons = false; tiHideT = setTimeout(hideTrenchIcons, 250); });
tiDeploy.addEventListener("click", () => { if (tiSeg) { deployTo(tiSeg.line, tiSeg.sec); refreshTrenchIcons(); } });
tiAction.addEventListener("click", () => { if (tiSeg) { sendForward(tiSeg.line, tiSeg.sec); hideTrenchIcons(); } });

// ---------- HUD ----------
const secEls = [...document.querySelectorAll(".sector")];
function abilityState(btn, cd, max, isArmed, armedClass) {
  const over_ = btn.querySelector(".cdover"), lbl = btn.querySelector(".lbl");
  btn.classList.toggle("armed", isArmed);
  if (armedClass) btn.classList.toggle(armedClass, isArmed);
  if (isArmed) { lbl.textContent = "Target…"; over_.style.height = "0%"; btn.disabled = false; }
  else if (cd > 0) {
    lbl.textContent = Math.ceil(cd) + "s";
    over_.style.height = (cd / max * 100) + "%";
    btn.disabled = true;
  } else {
    lbl.textContent = btn.dataset.name;
    over_.style.height = "0%";
    btn.disabled = false;
  }
}
const artyBtn = document.getElementById("artyBtn"), gasBtn = document.getElementById("gasBtn"), tankBtn = document.getElementById("tankBtn");
artyBtn.dataset.name = "Artillery"; gasBtn.dataset.name = "Gas"; tankBtn.dataset.name = "Tank";
function hud() {
  document.getElementById("reserves").textContent = reserves;
  const m = Math.floor(gameT / 60), s = Math.floor(gameT % 60);
  document.getElementById("clock").textContent = String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  abilityState(artyBtn, artyCd, 18, armed === "arty");
  abilityState(gasBtn, gasCd, 30, armed === "gas", "gasArmed");
  if (tank) {
    tankBtn.classList.remove("armed");
    tankBtn.querySelector(".lbl").textContent = "In action";
    tankBtn.querySelector(".cdover").style.height = "0%";
    tankBtn.disabled = true;
  } else abilityState(tankBtn, tankCd, 60, armed === "tank");
  for (let s2 = 0; s2 < SECTORS; s2++) {
    const el = secEls[s2], f = pFront(s2);
    const frontEl = el.querySelector(".front"), menB = el.querySelector(".men b"), menBar = el.querySelector(".menbar i");
    const pushBtn = el.querySelector(".push"), depBtn = el.querySelector(".deploy");
    if (f < 0) {
      frontEl.textContent = "SECTOR LOST";
      menB.textContent = "0"; menBar.style.width = "0%";
      pushBtn.disabled = true; depBtn.disabled = true; continue;
    }
    const n = garrison(P, f, s2).length;
    frontEl.textContent = LINE_NAME[f];
    menB.textContent = n;
    menBar.style.width = Math.min(100, n * 5) + "%";
    depBtn.disabled = reserves <= 0;
    pushBtn.disabled = f === 0 || n === 0;
  }
  refreshTrenchIcons();
}

// ---------- loop ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!over) {
    gameT += dt;
    reserveT += dt;
    if (reserveT >= 1.1 && reserves < 200) { reserveT = 0; reserves++; }
    if (artyCd > 0) artyCd -= dt;
    if (gasCd > 0) gasCd -= dt;
    if (tankCd > 0) tankCd -= dt;
    aiTick(dt);
    combat(dt);
    tankTick(dt);
    gasTick(dt);
    move(dt);
    particleTick(dt);
    checkEnd();
  }
  shake = Math.max(0, shake - 22 * dt);
  for (const hz of haze) { hz.x += hz.vx * dt; if (hz.x - hz.r > W) hz.x = -hz.r; }
  for (const a of [tracers, booms, corpses, markers, clouds, flashes, particles]) {
    for (let i = a.length - 1; i >= 0; i--) { a[i].t -= dt; if (a[i].t <= 0) a.splice(i, 1); }
  }
  render(); hud();
  requestAnimationFrame(frame);
}

// ---------- input ----------
secEls.forEach(el => {
  const s = +el.dataset.s;
  el.querySelector(".deploy").addEventListener("click", () => deploy(s));
  el.querySelector(".push").addEventListener("click", () => push(s));
});
function toggleArm(mode) {
  if (over) return;
  if (mode === "arty" && artyCd > 0) return;
  if (mode === "gas" && gasCd > 0) return;
  if (mode === "tank" && (tankCd > 0 || tank)) return;
  armed = armed === mode ? null : mode;
  if (armed) hideTrenchIcons();
}
artyBtn.addEventListener("click", () => toggleArm("arty"));
gasBtn.addEventListener("click", () => toggleArm("gas"));
tankBtn.addEventListener("click", () => toggleArm("tank"));
document.addEventListener("keydown", e => {
  if (e.key === "1") toggleArm("arty");
  else if (e.key === "2") toggleArm("gas");
  else if (e.key === "3") toggleArm("tank");
  else if (e.key === "Escape") { armed = null; hideTrenchIcons(); }
});
cv.addEventListener("click", e => {
  const r = cv.getBoundingClientRect();
  const x = (e.clientX - r.left) * (W / r.width), y = (e.clientY - r.top) * (H / r.height);
  if (!armed || over) {
    if (!over) {                               // tap support: pin icons on a held trench
      const hit = segHit(x, y);
      if (hit) { showTrenchIcons(hit.line, hit.sec); return; }
    }
    hideTrenchIcons();
    return;
  }
  if (armed === "arty") {
    armed = null; artyCd = 18;
    markers.push({ x, y, t: 0.9 });
    setTimeout(() => fireArtillery(x, y, 4, 0.75), 900);
  } else if (armed === "gas") {
    armed = null; gasCd = 30;
    markers.push({ x, y, t: 0.9 });
    setTimeout(() => gasStrike(x, y), 900);
  } else if (armed === "tank") {
    armed = null;
    deployTank(Math.min(SECTORS - 1, Math.floor(x / SEC_W)));
  }
});
document.getElementById("muteBtn").addEventListener("click", () => { muted = !muted; });
document.getElementById("restart").addEventListener("click", reset);

reset();
requestAnimationFrame(frame);
