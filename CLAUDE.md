# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

An Arkanoid/Breakout game built with plain HTML + CSS + JS and **zero dependencies**: no npm, no bundler, no framework, no test runner. The game code hasn't been written yet. The repo holds only the provided assets and the spec-driven workflow skills. `README.md` is in Spanish.

## Running

There's no build step. Serve the repo root over HTTP and open the page:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

Use a server instead of `file://` so that relative asset paths and audio load reliably.

## Provided assets (`assets/`)

- `spritesheet.js` is a classic (non-module) script that defines **globals**. Load it with a plain `<script src="assets/spritesheet.js">` tag before the game script:
  - `SPRITES` maps names to source rects: `paddle` (162×14), `ball` (16×16), and `blocks.<color>` (32×16). The colors are `gray`, `red`, `yellow`, `cyan`, `magenta`, `hotpink` and `green`.
  - `EXPLOSION_FRAMES.<color>` holds 4 frames per block color, and `EXPLOSION_DURATION = 150` (ms). `gray` reuses the `red` frames.
  - `loadSpritesheet(cb)` loads the image and runs `cb` when it's ready. It is safe to call more than once. `drawSprite(ctx, name, x, y, w, h)` draws a sprite by name, using `'paddle'`, `'ball'`, or `'block_<color>'` for blocks. `drawFrame(ctx, frame, x, y, w, h)` draws an explosion frame. Both functions do nothing until the sheet has loaded, so start the game loop from the `loadSpritesheet` callback.
  - The image path is hardcoded as the relative path `assets/spritesheet-breakout.png`, so the HTML page that loads this script must live at the repo root.
- `sounds/ball-bounce.mp3` and `sounds/break-sound.mp3` are the sound effects.
- `assets.zip` is just the original archive of `assets/`. Don't edit it.

## Spec-driven workflow

Features are built through two project skills in `.claude/skills/`. Users invoke them. Don't invoke them on your own.

- `/spec <description>` asks clarifying questions and then writes `specs/NN-slug.md` from `.claude/skills/spec/template.md`, with status `Draft`. It also creates `specs/.spec-config.yml` (`AutoCreateBranch: true`) if the file is missing. It never writes code.
- `/spec-impl <NN-slug>` only runs on a spec whose status means "Approved" (any language, e.g. `Aprobado`). It creates the branch `spec-NN-slug` and implements the spec one plan step at a time, pausing for diff review after each step. It never commits automatically.

Spec rules to respect:
- Only the human changes a spec's status to Approved.
- Code follows the spec. Out-of-scope requests go into a future spec, not onto the current branch.
- New specs match the language and status wording of the existing ones.
- Reply to the user in the language they write in.

`/spec-impl` needs git, but the directory is not a git repository yet (`git init` is required first).
