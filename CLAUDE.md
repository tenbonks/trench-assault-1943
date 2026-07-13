# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Trench Assault — 1943 is a single-page, real-time trench-warfare game written in **vanilla JavaScript with the Canvas 2D API**. There is no build step, no package manager, and no third-party dependencies.

## Running / testing

- Open [index.html](index.html) directly in a browser (`file://` works — see "Script architecture" for why this is deliberate).
- Some tooling (e.g. Chrome DevTools automation) refuses `file://`. To serve over HTTP: `python -m http.server 8000` then open `http://localhost:8000/index.html`.
- There is no test suite. To smoke-test logic without waiting on the animation loop, pump frames manually from the console: `for (let i=0;i<30;i++) frame(performance.now()+i*16);` — all game state (`soldiers`, `segOwner`, `reserves`, etc.) is global.

## Script architecture

The game was refactored out of a single file into ordered **classic scripts** (not ES modules) under `assets/js/`. This is intentional:

- Every file shares one global lexical scope. State like `soldiers`, `segOwner`, `tank`, `reserves` and helpers like `garrison()`, `rnd()`, `secX()` are declared at the top level of one file and referenced directly from all the others — there are no imports/exports.
- **Load order in `index.html` matters.** A file may reference globals defined in an earlier-loaded file. Current order: `constants → audio → state → actions → ai → combat → render → ui`. When adding a file, insert it where its dependencies are already defined, and add the `<script>` tag in the same position.
- ES modules were deliberately avoided because (a) they'd require threading imports/exports through hundreds of cross-references, and (b) module scripts are blocked under `file://`, breaking the double-click-to-play workflow.

`assets/js/ui.js` runs last and ends with `reset(); requestAnimationFrame(frame);` — that is the boot line. `reset()` and all functions are hoisted globals, so definition order across files never matters for *calls*, only for top-level code that executes at load time (e.g. `render.js` builds the ground/vignette/grain offscreen canvases immediately).

## File responsibilities

| File | Responsibility |
|------|----------------|
| `assets/js/constants.js` | Board dims (`W`,`H`,`SECTORS`,`LINES`), `LINE_Y`/`WIRE_Y` layout, canvas refs (`cv`,`ctx`), `TAU` |
| `assets/js/audio.js` | WebAudio-synthesized noise + `sndShot`/`sndBoom`/`sndHiss` |
| `assets/js/state.js` | Global state vars, `reset()`, unit factories (`mkGarrison`/`mkAdvancer`), `garrison`/`meleeAt`/`pFront`/`eFront` queries, `rnd`/`secX`, toasts, particles |
| `assets/js/actions.js` | Player orders (`deploy`/`push`/`deployTo`/`sendForward`) and weapons (artillery, gas, tank incl. `tankTick`/`gasTick`) |
| `assets/js/ai.js` | Enemy AI (`aiTick`): reinforcement, counterattack, coordinated push, artillery, gas |
| `assets/js/combat.js` | Rifle fire, melee, segment capture, `move()`, `checkEnd`/`end` win-lose |
| `assets/js/render.js` | Static offscreen layers (`paintGround`), the per-frame `render()`, `drawSoldier`/`drawTank` |
| `assets/js/ui.js` | Tooltips, trench hover icons, HUD sync, keyboard/mouse input, the `frame()` loop, boot |
| `assets/css/style.css` | All styling |

## Core game model

- **The battlefield is a grid of segments** `segOwner[line][sector]`, `LINES`=5 rows × `SECTORS`=3 columns. Each cell holds `P` (player), `E` (enemy), or `N` (neutral/unclaimed). Rows run enemy-home (0) → Central Line (2) → player-home (4). Win = all cells `P`; lose = enemy holds the whole player-home row.
- **Units live in a flat `soldiers` array**, each with a `state`: `"garrison"` (holds a line), `"advance"` (crossing no-man's-land toward `tLine`), or `"melee"` (fighting for a contested segment). Combat and capture are resolved per-segment in `combat()`.
- **Canvas is a fixed 960×560 internal resolution** scaled to display width via CSS; input handlers convert client coords back to internal coords using the canvas bounding rect.
- **The frame loop** (`frame()` in `ui.js`) advances a clamped `dt`, then calls, in order: `aiTick → combat → tankTick → gasTick → move → particleTick → checkEnd`, followed by `render()` and `hud()`. Timed effects (artillery salvos, telegraphed strikes) use real-time `setTimeout`, so they will not fire when frames are pumped manually with synthetic timestamps.
