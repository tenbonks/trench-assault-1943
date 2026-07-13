"use strict";

// ---------- constants ----------
const W = 960, H = 560, SECTORS = 3, SEC_W = W / SECTORS, LINES = 5;
const LINE_Y = [70, 165, 260, 355, 450];       // 0 = enemy home ... 2 = central ... 4 = player home
const LINE_NAME = ["Enemy Home Line", "Enemy Second Line", "Central Line", "Forward Trench", "Home Trench"];
const WIRE_Y = [117, 212, 307, 402];
const SEC_NAME = ["West", "Centre", "East"];
const P = "P", E = "E", N = "N";
const RANGE = 100;                             // rifle range cap (vertical px)
const cv = document.getElementById("cv"), ctx = cv.getContext("2d");
const TAU = Math.PI * 2;
