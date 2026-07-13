"use strict";

// ---------- player actions ----------
function deploy(s) { const f = pFront(s); if (f >= 0) deployTo(f, s); }
function push(s) { const f = pFront(s); if (f >= 0) sendForward(f, s); }
function deployTo(l, s) {
  if (over || segOwner[l][s] !== P) return;
  const n = Math.min(10, reserves);
  if (n <= 0) return;
  reserves -= n;
  for (let i = 0; i < n; i++)
    soldiers.push(mkAdvancer(P, s, l, secX(s) + rnd(18, SEC_W - 18), H - rnd(6, 18)));
}
function sendForward(l, s) {                   // over the top (E/N ahead) or advance (P ahead)
  if (over || l <= 0 || segOwner[l][s] !== P) return;
  const men = garrison(P, l, s); if (!men.length) return;
  for (const u of men) {
    u.state = "advance"; u.tLine = l - 1; u.line = -1;
    u.ax = secX(s) + rnd(18, SEC_W - 18); u.ay = LINE_Y[l - 1]; u.spd = rnd(24, 34);
  }
  if (segOwner[l - 1][s] !== P) noise(0.25, 0.15, 900);
}
function fireArtillery(x, y, shells, kill) {
  let t = 0;
  for (let i = 0; i < shells; i++) {
    t += rnd(0.15, 0.45);
    setTimeout(() => shell(x + rnd(-45, 45), y + rnd(-35, 35), kill), t * 1000);
  }
}
function shell(x, y, kill) {
  if (over) return;
  booms.push({ x, y, r: 4, maxR: 58, t: 0.6, tot: 0.6 });
  craters.push({ x, y, r: rnd(9, 15) }); paintGround();
  spawnDirt(x, y, 16); spawnSmoke(x, y, 6);
  shake = Math.min(9, shake + 5);
  sndBoom();
  for (const u of soldiers)
    if (Math.hypot(u.x - x, u.y - y) < 58 && Math.random() < kill) u.dead = true;
  if (tank && Math.hypot(tank.x - x, tank.y - y) < 58) tank.hp -= 8;
}
function gasStrike(x, y) {
  if (over) return;
  sndHiss();
  clouds.push({ x, y, t: 12, tot: 12, drift: rnd(-6, 6), seed: rnd(0, 100), r: 20 });
  booms.push({ x, y, r: 2, maxR: 20, t: 0.4, tot: 0.4 });
}
function deployTank(s) {
  tank = { x: secX(s) + SEC_W / 2, y: H - 24, sec: s, hp: 100, maxHp: 100,
           gunCd: 1.5, mgCd: 0.5, atCd: 2.2, tread: 0, lastY: H - 24, puffT: 0 };
  tankCd = 60;
  noise(0.6, 0.2, 300);
}

// ---------- tank ----------
function tankTick(dt) {
  if (!tank) return;
  const t = tank, ef = eFront(t.sec);
  const targetY = ef >= 0 ? LINE_Y[ef] + 60 : 40;
  let moving = false;
  if (t.y > targetY + 3) { t.y -= 13 * dt; moving = true; }
  else if (t.y < targetY - 3) { t.y += 13 * dt; moving = true; }
  if (moving) {
    t.tread += 30 * dt;
    if (Math.abs(t.y - t.lastY) > 4) { tracks.push({ x: t.x, y: t.y }); if (tracks.length > 400) tracks.shift(); t.lastY = t.y; }
    t.puffT -= dt;
    if (t.puffT <= 0) { t.puffT = 0.35; spawnSmoke(t.x + 12, t.y + 12, 1, true); }
  }
  t.gunCd -= dt;
  if (t.gunCd <= 0 && ef >= 0 && Math.abs(LINE_Y[ef] - t.y) < 160) {
    t.gunCd = rnd(2.6, 3.4);
    const tx = secX(t.sec) + rnd(30, SEC_W - 30), ty = LINE_Y[ef] + rnd(-8, 8);
    tracers.push({ x1: t.x, y1: t.y - 16, x2: tx, y2: ty, t: 0.12 });
    flashes.push({ x: t.x, y: t.y - 18, t: 0.07, big: true });
    booms.push({ x: tx, y: ty, r: 3, maxR: 30, t: 0.5, tot: 0.5 });
    spawnDirt(tx, ty, 8); spawnSmoke(tx, ty, 3);
    shake = Math.min(9, shake + 2);
    sndBoom();
    for (const u of soldiers)
      if (Math.hypot(u.x - tx, u.y - ty) < 30 && Math.random() < 0.5) u.dead = true;
  }
  t.mgCd -= dt;
  if (t.mgCd <= 0) {
    t.mgCd = rnd(0.6, 1);
    let tgt = null, bd = 120;
    for (const u of soldiers) {
      if (u.side !== E || u.sec !== t.sec) continue;
      const d = Math.hypot(u.x - t.x, u.y - t.y);
      if (d < bd) { bd = d; tgt = u; }
    }
    if (tgt) { tracers.push({ x1: t.x, y1: t.y - 8, x2: tgt.x, y2: tgt.y, t: 0.08 });
               flashes.push({ x: t.x, y: t.y - 8, t: 0.05 });
               sndShot(); if (Math.random() < 0.5) tgt.dead = true; }
  }
  t.atCd -= dt;
  if (t.atCd <= 0) {
    t.atCd = rnd(2, 2.6);
    let src = null;
    for (let l = 0; l < LINES; l++) {
      if (segOwner[l][t.sec] !== E || !garrison(E, l, t.sec).length) continue;
      if (Math.abs(LINE_Y[l] - t.y) < 160) { src = l; break; }
    }
    if (src !== null) {
      const sx = secX(t.sec) + rnd(40, SEC_W - 40), sy = LINE_Y[src];
      tracers.push({ x1: sx, y1: sy, x2: t.x + rnd(-14, 14), y2: t.y + rnd(-10, 10), t: 0.12 });
      flashes.push({ x: sx, y: sy, t: 0.07, big: true });
      noise(0.3, 0.25, 600);
      if (Math.random() < 0.45) {
        tank.hp -= rnd(10, 16);
        booms.push({ x: t.x + rnd(-8, 8), y: t.y + rnd(-6, 6), r: 2, maxR: 18, t: 0.35, tot: 0.35 });
        spawnSmoke(t.x, t.y, 2, true);
        shake = Math.min(9, shake + 2);
      } else {
        const mx = t.x + rnd(-30, 30), my = t.y + rnd(20, 34);
        booms.push({ x: mx, y: my, r: 2, maxR: 16, t: 0.35, tot: 0.35 });
        spawnDirt(mx, my, 6);
      }
    }
  }
  if (t.hp <= 0) {
    booms.push({ x: t.x, y: t.y, r: 6, maxR: 70, t: 0.8, tot: 0.8 });
    spawnDirt(t.x, t.y, 20); spawnSmoke(t.x, t.y, 10, true);
    wrecks.push({ x: t.x, y: t.y });
    shake = Math.min(11, shake + 8);
    sndBoom();
    toast("Tank knocked out", "bad");
    tank = null;
  }
}

// ---------- gas ----------
function gasTick(dt) {
  for (const c of clouds) {
    c.x += c.drift * dt;
    const k = 1 - c.t / c.tot;
    c.r = k < 0.25 ? 20 + k * 220 : (c.t < 3 ? 75 * (c.t / 3) : 75);
    for (const u of soldiers)
      if (Math.hypot(u.x - c.x, u.y - c.y) < c.r && Math.random() < 0.3 * dt) { u.dead = true; u.gassed = true; }
  }
}
