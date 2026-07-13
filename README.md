# Trench Assault — 1943

A real-time trench-warfare game for the browser, built with plain JavaScript and the Canvas 2D API. No build step, no dependencies — just open it and play.

Both sides race for the **Central Line** and grind forward trench by trench. Feed men into the front, send them over the top, and back them with artillery, gas, and armour — while the enemy AI reinforces, counterattacks, and shells you back.

## Play

Open [`index.html`](index.html) in any modern browser (double-clicking the file works).

To serve it over HTTP instead:

```sh
python -m http.server 8000
# then open http://localhost:8000/index.html
```

## How to play

The battlefield is three sectors (West / Centre / East) stacked into five trench lines. You start holding the two rear lines; the enemy holds the two front lines; the Central Line in the middle is up for grabs. **Win** by capturing every trench; **lose** if the enemy overruns your home trench.

- **Reserves** refill over time. Deploying or pushing spends men from them.
- **Deploy** — send 10 reserves up to a sector's front trench. Use the per-sector panel buttons, or hover a trench you hold and use its on-map icons.
- **Push / Over the top** — send a garrison forward at the line ahead.

### Weapons (arm, then click the map)

| Key | Weapon | Effect |
|-----|--------|--------|
| `1` | Artillery | Four scattered shells — deadly to infantry on **both** sides. ~18s reload. |
| `2` | Gas | A drifting cloud that kills anything inside it, including your own men. ~30s reload. |
| `3` | Tank | Grinds forward in a sector, shelling the trench ahead — until enemy AT guns knock it out. One at a time. |

`Esc` cancels an armed weapon. The speaker icon toggles sound.

## Project structure

```
index.html          Markup only; loads the CSS and the ordered scripts
assets/css/          Styling
assets/js/           Game logic, split by concern (constants, audio, state,
                     actions, ai, combat, render, ui)
```

The scripts are plain (non-module) scripts that share one global scope and **must load in the order listed in `index.html`**. See [CLAUDE.md](CLAUDE.md) for the architecture and the reasoning behind it.
