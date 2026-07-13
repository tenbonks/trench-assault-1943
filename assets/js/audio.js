"use strict";

// ---------- audio ----------
let AC = null, muted = false, lastShotSnd = 0;
function audio() { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); return AC; }
function noise(dur, vol, freq) {
  if (muted) return;
  const ac = audio(), n = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
  const buf = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  n.buffer = buf; f.type = "lowpass"; f.frequency.value = freq;
  g.gain.setValueAtTime(vol, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
  n.connect(f); f.connect(g); g.connect(ac.destination); n.start();
}
function sndShot() { const t = performance.now(); if (t - lastShotSnd > 90) { lastShotSnd = t; noise(0.08, 0.12, 2200); } }
function sndBoom() { noise(0.9, 0.5, 420); }
function sndHiss() { noise(1.4, 0.18, 5000); }
