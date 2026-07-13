"use strict";

// ---------- static layers ----------
const ground = document.createElement("canvas");
ground.width = W; ground.height = H;
const vignette = document.createElement("canvas");
vignette.width = W; vignette.height = H;
{
  const g = vignette.getContext("2d");
  const rg = g.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95);
  rg.addColorStop(0, "rgba(0,0,0,0)");
  rg.addColorStop(1, "rgba(10,7,3,0.55)");
  g.fillStyle = rg; g.fillRect(0, 0, W, H);
}
const grain = document.createElement("canvas");
grain.width = 160; grain.height = 94;
{
  const g = grain.getContext("2d");
  const im = g.createImageData(160, 94);
  for (let i = 0; i < im.data.length; i += 4) {
    const v = 100 + Math.random() * 110;
    im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255;
  }
  g.putImageData(im, 0, 0);
}

function paintGround() {
  const g = ground.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#3d3421"); grad.addColorStop(0.5, "#463b28"); grad.addColorStop(1, "#3a3122");
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  let seed = 7;
  const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 260; i++) {
    g.fillStyle = "rgba(" + (r() < 0.5 ? "30,24,14" : "80,68,44") + "," + (0.05 + r() * 0.08) + ")";
    g.beginPath(); g.arc(r() * W, r() * H, 6 + r() * 26, 0, TAU); g.fill();
  }
  g.fillStyle = "rgba(0,0,0,.09)";
  for (let i = 0; i < 900; i++) g.fillRect(r() * W, r() * H, 2, 2);
  for (const y of WIRE_Y) {
    for (let i = 0; i < 50; i++) {
      g.fillStyle = "rgba(22,17,10," + (0.06 + r() * 0.1) + ")";
      g.beginPath(); g.arc(r() * W, y + (r() - 0.5) * 55, 4 + r() * 12, 0, TAU); g.fill();
    }
  }
  for (const c of craters) {
    g.beginPath(); g.arc(c.x, c.y, c.r, 0, TAU);
    g.fillStyle = "rgba(20,16,9,.55)"; g.fill();
    g.beginPath(); g.arc(c.x - c.r * .2, c.y - c.r * .2, c.r * .6, 0, TAU);
    g.fillStyle = "rgba(15,12,7,.6)"; g.fill();
    g.strokeStyle = "rgba(96,82,54,.35)"; g.lineWidth = 1.5;
    g.beginPath(); g.arc(c.x, c.y, c.r + 1, TAU * 0.55, TAU * 0.95); g.stroke();
  }
  g.strokeStyle = "rgba(0,0,0,.4)"; g.lineWidth = 1;
  for (const y of WIRE_Y) {
    g.beginPath();
    for (let x = 8; x < W; x += 14) { g.moveTo(x - 4, y - 3); g.lineTo(x + 4, y + 3); g.moveTo(x + 4, y - 3); g.lineTo(x - 4, y + 3); }
    g.stroke();
    g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
    g.fillStyle = "rgba(30,24,14,.8)";
    for (let x = 8; x < W; x += 42) g.fillRect(x - 1, y - 5, 2, 10);
  }
  for (let l = 0; l < LINES; l++) {
    const y = LINE_Y[l];
    g.fillStyle = "rgba(16,12,7,.85)";
    g.fillRect(0, y - 8, W, 16);
    g.lineWidth = 4; g.strokeStyle = "#0f0b06";
    zig(g, y); g.stroke();
    g.lineWidth = 1.5; g.strokeStyle = "rgba(120,102,66,.5)";
    zig(g, y - 8); g.stroke();
    g.strokeStyle = "rgba(0,0,0,.6)";
    zig(g, y + 8); g.stroke();
    g.fillStyle = "rgba(74,60,36,.5)";
    for (let x = 6; x < W; x += 26) g.fillRect(x, y - 2, 14, 4);
    for (let x = 4; x < W; x += 9) {
      g.fillStyle = "rgba(" + (x % 18 ? "108,94,62" : "94,80,52") + ",.75)";
      g.beginPath(); g.ellipse(x, y - 11, 4, 2.4, 0, 0, TAU); g.fill();
      g.beginPath(); g.ellipse(x + 4, y + 11, 4, 2.4, 0, 0, TAU); g.fill();
    }
  }
}
function zig(g, y) {
  g.beginPath(); g.moveTo(0, y);
  for (let x = 0; x <= W; x += 40) g.lineTo(x, y + (x / 40 % 2 ? 5 : -5));
}

// ---------- render ----------
function ownColor(o, a) {
  return o === P ? "rgba(168,174,92," + a + ")" : o === E ? "rgba(139,149,162," + a + ")" : "rgba(184,173,143," + a + ")";
}
function drawSoldier(u) {
  const bob = u.walking ? Math.sin(gameT * 11 + u.ph) : 0;
  const y = u.y + bob * 0.6;
  ctx.fillStyle = "rgba(0,0,0,.3)";
  ctx.beginPath(); ctx.ellipse(u.x, u.y + 3, 3, 1.4, 0, 0, TAU); ctx.fill();
  if (u.walking) {
    ctx.fillStyle = "#1e1a12";
    ctx.fillRect(u.x - 2 + (bob > 0 ? 1 : 0), y + 2, 1.6, 1.6);
    ctx.fillRect(u.x + 1 - (bob > 0 ? 0 : 1), y + 2, 1.6, 1.6);
  }
  ctx.fillStyle = u.side === P ? "#aab060" : "#a4adb8";
  ctx.fillRect(u.x - 2, y - 3, 4, 5.5);
  ctx.fillStyle = u.side === P ? "#7c8244" : "#7b848f";
  ctx.beginPath(); ctx.arc(u.x, y - 3, 2, 0, TAU); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.18)";
  ctx.fillRect(u.x - 2, y - 1, 4, 0.8);
}
function drawTank(t) {
  ctx.save(); ctx.translate(t.x, t.y);
  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.beginPath(); ctx.ellipse(2, 4, 17, 13, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = "#262217"; ctx.fillRect(-15, -13, 5, 26); ctx.fillRect(10, -13, 5, 26);
  ctx.strokeStyle = "#3d3626"; ctx.lineWidth = 1;
  const off = t.tread % 5;
  for (let yy = -13 + off; yy < 13; yy += 5) {
    ctx.beginPath(); ctx.moveTo(-15, yy); ctx.lineTo(-10, yy);
    ctx.moveTo(10, yy); ctx.lineTo(15, yy); ctx.stroke();
  }
  ctx.fillStyle = "#6f7248"; ctx.fillRect(-11, -11, 22, 22);
  ctx.fillStyle = "#5c603b"; ctx.fillRect(-11, -11, 22, 5);
  ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fillRect(-11, 7, 22, 4);
  ctx.fillStyle = "#7d8054"; ctx.beginPath(); ctx.arc(0, -1, 7.5, 0, TAU); ctx.fill();
  ctx.strokeStyle = "#4d5030"; ctx.stroke();
  ctx.strokeStyle = "#565a36"; ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, -20); ctx.stroke();
  ctx.strokeStyle = "#3e402a"; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(0, -20); ctx.stroke();
  ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fillRect(-14, 17, 28, 3);
  ctx.fillStyle = t.hp > 35 ? "#a8ae5c" : "#c25b45";
  ctx.fillRect(-14, 17, 28 * Math.max(0, t.hp) / t.maxHp, 3);
  ctx.restore();
}
function render() {
  ctx.save();
  if (shake > 0.2) ctx.translate(rnd(-shake, shake) * 0.5, rnd(-shake, shake) * 0.5);
  ctx.drawImage(ground, 0, 0);
  ctx.fillStyle = "rgba(24,19,11,.5)";
  for (const tr of tracks) { ctx.fillRect(tr.x - 14, tr.y - 1, 4, 3); ctx.fillRect(tr.x + 10, tr.y - 1, 4, 3); }
  ctx.strokeStyle = "rgba(216,210,192,.07)"; ctx.setLineDash([4, 8]); ctx.lineWidth = 1;
  for (let s = 1; s < SECTORS; s++) { ctx.beginPath(); ctx.moveTo(secX(s), 0); ctx.lineTo(secX(s), H); ctx.stroke(); }
  ctx.setLineDash([]);
  // ownership strips + hover highlight
  for (let l = 0; l < LINES; l++) for (let s = 0; s < SECTORS; s++) {
    ctx.fillStyle = ownColor(segOwner[l][s], 0.4);
    ctx.fillRect(secX(s) + 4, LINE_Y[l] + 12, SEC_W - 8, 2);
  }
  if (hoverSeg && segOwner[hoverSeg.line][hoverSeg.sec] === P) {
    ctx.fillStyle = "rgba(216,210,192,.06)";
    ctx.fillRect(secX(hoverSeg.sec) + 2, LINE_Y[hoverSeg.line] - 14, SEC_W - 4, 28);
    ctx.strokeStyle = "rgba(216,210,192,.22)"; ctx.lineWidth = 1;
    ctx.strokeRect(secX(hoverSeg.sec) + 2, LINE_Y[hoverSeg.line] - 14, SEC_W - 4, 28);
  }
  // pennants
  for (let l = 0; l < LINES; l++) for (let s = 0; s < SECTORS; s++) {
    const x = secX(s) + SEC_W / 2, y = LINE_Y[l] - 14, own = segOwner[l][s];
    const wave = Math.sin(gameT * 4 + l + s) * 1.5;
    ctx.strokeStyle = "#241f14"; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 12); ctx.stroke();
    ctx.fillStyle = own === P ? "#a8ae5c" : own === E ? "#8b95a2" : "#b8ad8f";
    ctx.beginPath(); ctx.moveTo(x, y - 12); ctx.lineTo(x + 11 + wave, y - 9); ctx.lineTo(x, y - 6);
    ctx.closePath(); ctx.fill();
  }
  for (const w of wrecks) {
    ctx.save(); ctx.translate(w.x, w.y);
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.beginPath(); ctx.ellipse(2, 4, 16, 12, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = "#221d12"; ctx.fillRect(-15, -13, 5, 26); ctx.fillRect(10, -13, 5, 26);
    ctx.fillStyle = "#33301f"; ctx.fillRect(-11, -11, 22, 22);
    ctx.fillStyle = "#1b1810"; ctx.beginPath(); ctx.arc(2, 1, 6, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#26221a"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(9, -16); ctx.stroke();
    ctx.restore();
    if (Math.random() < 0.06) spawnSmoke(w.x + rnd(-4, 4), w.y - 6, 1, true);
  }
  for (const c of corpses) {
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.a);
    ctx.globalAlpha = Math.min(1, c.t / 3.5);
    ctx.fillStyle = c.gassed ? "#5a5c2e" : "#42301f";
    ctx.fillRect(-2.5, -1, 5, 2);
    ctx.fillStyle = c.gassed ? "#4a4c24" : "#372718";
    ctx.beginPath(); ctx.arc(-3, 0, 1.2, 0, TAU); ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  for (const u of soldiers) drawSoldier(u);
  if (tank) drawTank(tank);
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.t / p.tot) * (p.kind === "smoke" ? 0.35 : 0.9);
    ctx.fillStyle = p.color;
    if (p.kind === "smoke") { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill(); }
    else ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;
  for (const t of tracers) {
    const a = Math.min(1, t.t / 0.1);
    ctx.globalAlpha = a * 0.35; ctx.strokeStyle = "#ffb64d"; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(t.x1, t.y1); ctx.lineTo(t.x2, t.y2); ctx.stroke();
    ctx.globalAlpha = a; ctx.strokeStyle = "#ffe9b0"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(t.x1, t.y1); ctx.lineTo(t.x2, t.y2); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (const f of flashes) {
    ctx.globalAlpha = Math.min(1, f.t / 0.05);
    ctx.fillStyle = "#ffe9a8";
    ctx.beginPath(); ctx.arc(f.x, f.y, f.big ? 4.5 : 2, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const c of clouds) {
    const a = Math.min(0.55, c.t / c.tot * 0.75);
    for (let i = 0; i < 6; i++) {
      const ang = c.seed + i * 1.05 + Math.sin(gameT * 0.8 + i) * 0.3;
      const rr = c.r * 0.55, ox = Math.cos(ang) * rr * 0.7, oy = Math.sin(ang) * rr * 0.5;
      const br = c.r * 0.5;
      const rg = ctx.createRadialGradient(c.x + ox, c.y + oy, br * 0.15, c.x + ox, c.y + oy, br);
      rg.addColorStop(0, "rgba(178,184,72," + a * 0.5 + ")");
      rg.addColorStop(1, "rgba(140,148,52,0)");
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(c.x + ox, c.y + oy, br, 0, TAU); ctx.fill();
    }
    const rg = ctx.createRadialGradient(c.x, c.y, 4, c.x, c.y, c.r * 0.65);
    rg.addColorStop(0, "rgba(206,213,94," + a * 0.45 + ")");
    rg.addColorStop(1, "rgba(160,168,60,0)");
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(c.x, c.y, c.r * 0.65, 0, TAU); ctx.fill();
  }
  for (const m of markers) {
    ctx.strokeStyle = "rgba(214,101,75," + (0.45 + 0.4 * Math.sin(m.t * 20)) + ")";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(m.x, m.y, 26, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(m.x - 32, m.y); ctx.lineTo(m.x + 32, m.y);
    ctx.moveTo(m.x, m.y - 32); ctx.lineTo(m.x, m.y + 32); ctx.stroke();
  }
  for (const b of booms) {
    const k = 1 - b.t / b.tot, a = b.t / b.tot;
    ctx.globalAlpha = a;
    ctx.fillStyle = "#fff3d0";
    ctx.beginPath(); ctx.arc(b.x, b.y, Math.max(0.5, (1 - k) * 7), 0, TAU); ctx.fill();
    ctx.fillStyle = "rgba(240,146,58," + a * 0.85 + ")";
    ctx.beginPath(); ctx.arc(b.x, b.y, 5 + k * 13, 0, TAU); ctx.fill();
    ctx.strokeStyle = "rgba(80,66,42," + a * 0.8 + ")"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r + k * b.maxR, 0, TAU); ctx.stroke();
    ctx.strokeStyle = "rgba(255,220,160," + a * 0.35 + ")"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(b.x, b.y, (b.r + k * b.maxR) * 0.8, 0, TAU); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (const hz of haze) {
    const rg = ctx.createRadialGradient(hz.x, hz.y, 10, hz.x, hz.y, hz.r);
    rg.addColorStop(0, "rgba(120,112,92,0.05)");
    rg.addColorStop(1, "rgba(120,112,92,0)");
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(hz.x, hz.y, hz.r, 0, TAU); ctx.fill();
  }
  ctx.restore();
  ctx.drawImage(vignette, 0, 0);
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(grain, rnd(-3, 0), rnd(-3, 0), W + 6, H + 6);
  ctx.restore();
  ctx.imageSmoothingEnabled = true;
  if (armed) {
    ctx.fillStyle = armed === "gas" ? "rgba(198,204,88,.95)" : "rgba(214,101,75,.95)";
    ctx.font = "12px Courier New";
    ctx.fillText(armed === "arty" ? "CLICK TO CALL IN BARRAGE" :
                 armed === "gas" ? "CLICK TO DROP GAS SHELLS" :
                 "CLICK A SECTOR TO SEND THE TANK IN", 12, 20);
  }
}
