"use strict";

// ---------- enemy AI ----------
function aiTick(dt) {
  const dif = Math.min(2.2, 1 + gameT / 240);
  aiReinfT -= dt; aiCounterT -= dt; aiArtyT -= dt; aiPushT -= dt; aiGasT -= dt;
  if (aiReinfT <= 0) {
    aiReinfT = rnd(4.5, 7) / dif;
    let best = null, low = 1e9;
    for (let s = 0; s < SECTORS; s++) {
      const f = eFront(s); if (f < 0) continue;
      const n = garrison(E, f, s).length;
      if (n < low) { low = n; best = { s, f }; }
    }
    if (best) {
      const n = 2 + Math.round(2 * dif);
      for (let i = 0; i < n; i++)
        soldiers.push(mkAdvancer(E, best.s, best.f, secX(best.s) + rnd(18, SEC_W - 18), rnd(4, 16)));
    }
  }
  if (aiCounterT <= 0) {                       // opportunistic local attacks (into P or unclaimed ground)
    aiCounterT = rnd(16, 26) / dif;
    let launched = 0;
    for (let s = 0; s < SECTORS && launched < 2; s++) {
      const f = eFront(s);
      if (f < 0 || f >= LINES - 1 || segOwner[f + 1][s] === E) continue;
      const g = garrison(E, f, s);
      const d = segOwner[f + 1][s] === P ? garrison(P, f + 1, s).length : 0;
      if (g.length >= (d ? 6 : 4) && d < g.length * 0.9) {
        const n = Math.floor(g.length * 0.7);
        for (let i = 0; i < n; i++) {
          const u = g[i];
          u.state = "advance"; u.tLine = f + 1; u.line = -1;
          u.ax = secX(s) + rnd(18, SEC_W - 18); u.ay = LINE_Y[f + 1]; u.spd = rnd(24, 34);
        }
        launched++;
      }
    }
  }
  if (aiPushT <= 0) {                          // coordinated offensive on every contested sector
    aiPushT = rnd(55, 80) / Math.max(1, dif * 0.8);
    let any = false;
    for (let s = 0; s < SECTORS; s++) {
      const f = eFront(s);
      if (f < 0 || f >= LINES - 1 || segOwner[f + 1][s] === E) continue;
      any = true;
      markers.push({ x: secX(s) + SEC_W / 2, y: LINE_Y[f + 1], t: 1.4 });
      const fresh = 4 + Math.round(3 * dif);
      for (let i = 0; i < fresh; i++) {
        const u = mkAdvancer(E, s, f + 1, secX(s) + rnd(18, SEC_W - 18), LINE_Y[f] + rnd(-6, 6));
        u.spd = rnd(26, 36); soldiers.push(u);
      }
      const g = garrison(E, f, s), n = Math.floor(g.length * 0.5);
      for (let i = 0; i < n; i++) {
        const u = g[i];
        u.state = "advance"; u.tLine = f + 1; u.line = -1;
        u.ax = secX(s) + rnd(18, SEC_W - 18); u.ay = LINE_Y[f + 1]; u.spd = rnd(24, 34);
      }
    }
    if (any) { noise(0.5, 0.22, 500); toast("Enemy offensive inbound", "warn"); }
  }
  if (aiArtyT <= 0) {
    aiArtyT = rnd(22, 34);
    let best = null, hi = 0;
    for (let l = 0; l < LINES; l++) for (let s = 0; s < SECTORS; s++) {
      if (segOwner[l][s] !== P) continue;
      const n = garrison(P, l, s).length;
      if (n > hi) { hi = n; best = { l, s }; }
    }
    if (best) {
      const x = secX(best.s) + SEC_W / 2 + rnd(-60, 60), y = LINE_Y[best.l];
      markers.push({ x, y, t: 1.8 });
      toast("Incoming barrage — scatter", "warn");
      setTimeout(() => fireArtillery(x, y, 4, 0.6), 1800);
    }
  }
  if (aiGasT <= 0) {                           // enemy gas on your most crowded trench (telegraphed)
    aiGasT = rnd(70, 100);
    let best = null, hi = 5;
    for (let l = 0; l < LINES; l++) for (let s = 0; s < SECTORS; s++) {
      if (segOwner[l][s] !== P) continue;
      const n = garrison(P, l, s).length;
      if (n > hi) { hi = n; best = { l, s }; }
    }
    if (best) {
      const x = secX(best.s) + SEC_W / 2 + rnd(-50, 50), y = LINE_Y[best.l];
      markers.push({ x, y, t: 2 });
      toast("Gas shells inbound", "warn");
      setTimeout(() => gasStrike(x, y), 2000);
    }
  }
}
