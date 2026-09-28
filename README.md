# Arkanoid

A browser-based Arkanoid/Breakout game built with plain HTML, CSS and JavaScript — zero dependencies, no build step.

## Running the game

Serve the repo root over HTTP and open the page (don't open `index.html` directly via `file://`, or asset/audio paths won't load reliably):

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Controls

- **Move paddle:** `←`/`→` or `A`/`D`, or move the mouse over the canvas
- **Launch the ball / advance:** `Space` or click
- **Pause/resume:** `P`

## Gameplay

- The ball starts resting on the paddle and launches at a fixed angle when you press Space or click.
- It bounces off the side walls, the ceiling (the bottom edge of the HUD), and the paddle. The paddle bounce angle depends on where the ball hits, from -60° to +60° off vertical.
- Each block breaks in a single hit and awards 10 points, playing a 4-frame explosion animation before disappearing.
- A bounce sound plays off walls, the ceiling and the paddle; a break sound plays when a block is destroyed.
- The game has 3 fixed levels of increasing difficulty, played in sequence: more block rows and a faster ball each time. Clearing a level shows a "Level Complete" screen; clearing the last one wins the game.
- Losing all 3 lives ends the game with a "Game Over" screen. Space/click on the win or game-over screen starts a new game.
- The HUD shows score, current level and remaining lives.

## Project structure

```
index.html    Page shell: canvas + script tags
style.css     Minimal page/canvas styling
game.js       Game state, input, physics, rendering and the main loop
assets/       Sprite sheet, sprite/explosion metadata (spritesheet.js) and sound effects
specs/        Spec-driven development history (see below)
```

## Spec-driven workflow

The game was built incrementally through specs in `specs/`, using the `/spec` and `/spec-impl` project skills described in `CLAUDE.md`. Each spec is written in Spanish, matching the existing specs' language convention:

1. `01-mvp-jugable.md` — playable MVP: paddle, ball, one level of blocks, lives, score, pause, win/game-over screens.
2. `02-animacion-explosion-bloques.md` — explosion animation when a block is destroyed.
3. `03-sonido-rebote-y-rotura.md` — bounce and block-break sound effects.
4. `04-niveles-progresivos.md` — 3 progressive levels with increasing difficulty.

All four specs are implemented on `main`.
