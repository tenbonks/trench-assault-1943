"use strict";

// ---------- combat ----------
// A garrison can only engage as far as the ADJACENT trench line, never past it.
function fireLimit(u) {
  const nl = u.line + (u.side === P ? -1 : 1);
  const gap = (nl >= 0 && nl < LINES) ? Math.abs(LINE_Y[nl] - LINE_Y[u.line]) + 8 : RANGE;
  return Math.min(RANGE + 8, gap);
}
function combat(dt) {
  for (const u of soldiers) {
    if (u.dead || u.state === "melee") continue;
    u.fireCd -= dt;
    if (u.fireCd > 0) continue;
    const foeSide = u.side === P ? E : P;
    if (u.side === E && u.state === "garrison" && tank && tank.sec === u.sec &&
        tank.y > u.y - 10 && tank.y - u.y < fireLimit(u) + 30 && Math.random() < 0.35) {
      u.fireCd = rnd(0.7, 1.4);
      tracers.push({ x1: u.x, y1: u.y, x2: tank.x + rnd(-10, 10), y2: tank.y + rnd(-8, 8), t: 0.1 });
      flashes.push({ x: u.x, y: u.y, t: 0.05 });
      sndShot(); tank.hp -= 0.35;
      continue;
    }
    let tgt = null, bd = 1e9;
    if (u.state === "garrison") {
      const dir = u.side === P ? -1 : 1;
      const eff = fireLimit(u);
      for (const v of soldiers) {
        if (v.dead || v.side !== foeSide || v.sec !== u.sec) continue;
        const dy = (v.y - u.y) * dir;
        if (dy < -10 || dy > eff) continue;    // can't shoot past the next trench
        const d = Math.hypot(v.x - u.x, v.y - u.y);
        if (d < bd) { bd = d; tgt = v; }
      }
      u.fireCd = rnd(0.7, 1.4);
      if (tgt) shoot(u, tgt, 0.42 * (1 - bd / (eff + 60)));
    } else {
      for (const v of soldiers) {
        if (v.dead || v.side !== foeSide || v.sec !== u.sec || v.state !== "garrison" || v.line !== u.tLine) continue;
        const d = Math.hypot(v.x - u.x, v.y - u.y);
        if (d < bd && d < RANGE) { bd = d; tgt = v; }
      }
      u.fireCd = rnd(1.6, 2.6);
      if (tgt) shoot(u, tgt, 0.12);
    }
  }
  // melee + capture, per segment
  for (let l = 0; l < LINES; l++) for (let s = 0; s < SECTORS; s++) {
    const own = segOwner[l][s];
    if (own === N) {                           // unclaimed ground: whoever reaches it takes it
      const pa = meleeAt(P, l, s), ea = meleeAt(E, l, s);
      if (pa.length && ea.length) {            // both sides arrive: brawl for it
        for (const a of pa.concat(ea)) {
          a.meleeCd -= dt;
          if (a.meleeCd > 0) continue;
          a.meleeCd = rnd(0.4, 0.7);
          const pool = a.side === P ? ea : pa;
          const d = pool[Math.floor(Math.random() * pool.length)];
          if (d && !d.dead) {
            if (Math.random() < 0.5) d.dead = true; else a.dead = true;
            sndShot();
          }
        }
      } else if (pa.length || ea.length) {
        const side = pa.length ? P : E;
        segOwner[l][s] = side;
        toastCapture(side, l, s);
        for (const a of (pa.length ? pa : ea)) {
          a.state = "garrison"; a.line = l;
          const an = anchor(l, s); a.ax = an.ax; a.ay = an.ay;
        }
        noise(0.3, 0.2, 700);
      }
      continue;
    }
    const att = own === P ? E : P;
    const atk = meleeAt(att, l, s);
    if (!atk.length) continue;
    const def = garrison(own, l, s);
    if (def.length) {
      for (const a of atk) {
        a.meleeCd -= dt;
        if (a.meleeCd > 0) continue;
        a.meleeCd = rnd(0.4, 0.7);
        const d = def[Math.floor(Math.random() * def.length)];
        if (d && !d.dead) {
          if (Math.random() < 0.55) d.dead = true; else { a.dead = true; }
          sndShot();
        }
      }
    }
    if (!garrison(own, l, s).length && meleeAt(att, l, s).length) {
      segOwner[l][s] = att;
      toastCapture(att, l, s);
      for (const a of meleeAt(att, l, s)) {
        a.state = "garrison"; a.line = l;
        const an = anchor(l, s); a.ax = an.ax; a.ay = an.ay;
      }
      noise(0.3, 0.2, 700);
    }
  }
}
function shoot(u, v, p) {
  tracers.push({ x1: u.x, y1: u.y, x2: v.x, y2: v.y, t: 0.1 });
  flashes.push({ x: u.x, y: u.y, t: 0.05 });
  sndShot();
  if (Math.random() < Math.max(0.05, p)) v.dead = true;
}

// ---------- movement ----------
function move(dt) {
  for (const u of soldiers) {
    if (u.dead) continue;
    if (u.state === "garrison") {
      const dx = u.ax - u.x, dy = u.ay - u.y, d = Math.hypot(dx, dy);
      if (d > 2) { u.x += dx / d * 40 * dt; u.y += dy / d * 40 * dt; u.walking = true; }
      else u.walking = false;
      continue;
    }
    if (u.state === "advance") {
      u.walking = true;
      const dx = u.ax - u.x, dy = u.ay - u.y, d = Math.hypot(dx, dy);
      if (d < 6) {
        if (segOwner[u.tLine][u.sec] === u.side) { u.state = "garrison"; u.line = u.tLine; }
        else { u.state = "melee"; u.meleeCd = rnd(0.1, 0.4); }
      } else {
        u.x += dx / d * u.spd * dt; u.y += dy / d * u.spd * dt;
      }
    }
  }
  for (let i = soldiers.length - 1; i >= 0; i--) {
    if (soldiers[i].dead) {
      const u = soldiers[i];
      corpses.push({ x: u.x, y: u.y, t: 8, gassed: u.gassed, a: rnd(0, TAU) });
      soldiers.splice(i, 1);
    }
  }
}

// ---------- win / lose ----------
function checkEnd() {
  if (segOwner.every(row => row.every(o => o === P))) return end(true);
  if (segOwner[LINES - 1].every(o => o === E)) return end(false);
}
function end(won) {
  over = true;
  hideTrenchIcons();
  const ov = document.getElementById("overlay");
  document.getElementById("ovTitle").textContent = won ? "Objective Taken" : "Line Overrun";
  document.getElementById("ovText").textContent = won
    ? "Every trench line is in your hands. The salient is yours — until the counteroffensive."
    : "The enemy has taken your home trench and cut the supply line. The sector is lost.";
  ov.style.display = "flex";
}
