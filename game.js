// Arkanoid — SPEC 01: playable MVP
// game.js is a classic script (not a module), loaded after assets/spritesheet.js.

// --- Constants ---
const CANVAS_W = 480, CANVAS_H = 640;
const HUD_H = 32;                       // top HUD strip
const BLOCK_W = 32, BLOCK_H = 16;
const BLOCK_COLS = 13;
const GRID_X = 32, GRID_Y = 64;         // top-left corner of the block grid
const ROW_COLORS = ['red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green'];
const PADDLE_W = 80, PADDLE_H = 14, PADDLE_Y = 600, PADDLE_SPEED = 420; // px/s via keyboard
const BALL_SIZE = 16;

// Fixed levels (SPEC 04): each one defines its block rows and ball speed
const LEVELS = [
  { rows: 6, ballSpeed: 300 },
  { rows: 8, ballSpeed: 360 },
  { rows: 10, ballSpeed: 420 },
];
const MAX_BOUNCE_ANGLE = Math.PI / 3;    // 60°
const START_LIVES = 3, POINTS_PER_BLOCK = 10;
const MAX_DT = 1 / 30;                   // dt cap in seconds

// --- Mutable state ---
const state = {
  mode: 'serve',        // 'serve' | 'playing' | 'paused' | 'levelComplete' | 'won' | 'lost'
  level: 1,             // human-facing index: 1, 2 or 3 — LEVELS[level - 1] is the active config
  score: 0,
  lives: START_LIVES,
  paddle: { x: (CANVAS_W - PADDLE_W) / 2, y: PADDLE_Y, w: PADDLE_W, h: PADDLE_H },
  ball:   { x: 0, y: 0, size: BALL_SIZE, vx: 0, vy: 0 },
  blocks: [ /* { x, y, w, h, color, alive: true } */ ],
  explosions: [ /* { x, y, color, elapsed } */ ],
  input:  { left: false, right: false, mouseX: null, source: null }, // source: 'mouse' | 'keyboard'
};

// --- Canvas ---
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// --- Sound (SPEC 03) ---
const SOUNDS = {
  bounce: new Audio('assets/sounds/ball-bounce.mp3'),
  break: new Audio('assets/sounds/break-sound.mp3'),
};

function playSound(name) {
  const clone = SOUNDS[name].cloneNode(true);
  clone.play().catch(() => {}); // ignore autoplay rejection; user interaction already happened to get here
}

// --- Input ---
function clampPaddleX(x) {
  return Math.max(0, Math.min(CANVAS_W - state.paddle.w, x));
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { state.input.left = true; state.input.source = 'keyboard'; }
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { state.input.right = true; state.input.source = 'keyboard'; }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') state.input.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') state.input.right = false;
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_W / rect.width;
  state.input.mouseX = (e.clientX - rect.left) * scaleX;
  state.input.source = 'mouse';
});

function launchBall() {
  if (state.mode !== 'serve') return;
  const angle = Math.PI / 6; // 30° to the right of vertical
  const ballSpeed = LEVELS[state.level - 1].ballSpeed;
  state.ball.vx = ballSpeed * Math.sin(angle);
  state.ball.vy = -ballSpeed * Math.cos(angle);
  state.mode = 'playing';
}

function resetGame() {
  state.level = 1;
  state.score = 0;
  state.lives = START_LIVES;
  state.blocks = createBlocks(state.level);
  state.explosions = [];
  state.paddle.x = (CANVAS_W - PADDLE_W) / 2;
  state.ball.vx = 0;
  state.ball.vy = 0;
  state.mode = 'serve';
  serveBall();
}

function advanceLevel() {
  state.level += 1;
  state.blocks = createBlocks(state.level);
  state.explosions = [];
  state.mode = 'serve';
  serveBall();
}

function handleAction() {
  if (state.mode === 'won' || state.mode === 'lost') {
    resetGame();
  } else if (state.mode === 'levelComplete') {
    advanceLevel();
  } else {
    launchBall();
  }
}

window.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Spacebar') handleAction();
});

canvas.addEventListener('click', handleAction);

window.addEventListener('keydown', (e) => {
  if (e.key !== 'p' && e.key !== 'P') return;
  if (state.mode === 'playing') state.mode = 'paused';
  else if (state.mode === 'paused') state.mode = 'playing';
});

// --- Blocks ---
function createBlocks(level) {
  const blocks = [];
  const rows = LEVELS[level - 1].rows;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < BLOCK_COLS; col++) {
      blocks.push({
        x: GRID_X + col * BLOCK_W,
        y: GRID_Y + row * BLOCK_H,
        w: BLOCK_W,
        h: BLOCK_H,
        color: ROW_COLORS[row % ROW_COLORS.length],
        alive: true,
      });
    }
  }
  return blocks;
}

state.blocks = createBlocks(state.level);

// --- Game loop ---
let lastTime = null;

function updatePaddle(dt) {
  const { paddle, input } = state;

  if (input.source === 'mouse' && input.mouseX !== null) {
    paddle.x = input.mouseX - paddle.w / 2;
  }
  if (input.left) paddle.x -= PADDLE_SPEED * dt;
  if (input.right) paddle.x += PADDLE_SPEED * dt;

  paddle.x = clampPaddleX(paddle.x);
}

function serveBall() {
  const { paddle, ball } = state;
  ball.x = paddle.x + paddle.w / 2 - ball.size / 2;
  ball.y = paddle.y - ball.size;
}

function bounceOffPaddle() {
  const { ball, paddle } = state;
  const ballCenter = ball.x + ball.size / 2;
  const paddleCenter = paddle.x + paddle.w / 2;

  let angle = ((ballCenter - paddleCenter) / (paddle.w / 2)) * MAX_BOUNCE_ANGLE;
  angle = Math.max(-MAX_BOUNCE_ANGLE, Math.min(MAX_BOUNCE_ANGLE, angle));

  ball.vx = LEVELS[state.level - 1].ballSpeed * Math.sin(angle);
  ball.vy = -LEVELS[state.level - 1].ballSpeed * Math.cos(angle);
  ball.y = paddle.y - ball.size;
  playSound('bounce');
}

function checkBlockCollision() {
  const { ball, blocks } = state;

  for (const block of blocks) {
    if (!block.alive) continue;

    const overlapsX = ball.x + ball.size > block.x && ball.x < block.x + block.w;
    const overlapsY = ball.y + ball.size > block.y && ball.y < block.y + block.h;
    if (!overlapsX || !overlapsY) continue;

    const overlapX = Math.min(ball.x + ball.size, block.x + block.w) - Math.max(ball.x, block.x);
    const overlapY = Math.min(ball.y + ball.size, block.y + block.h) - Math.max(ball.y, block.y);

    if (overlapX < overlapY) {
      ball.vx = -ball.vx;
    } else {
      ball.vy = -ball.vy;
    }

    block.alive = false;
    state.score += POINTS_PER_BLOCK;
    state.explosions.push({ x: block.x, y: block.y, color: block.color, elapsed: 0 });
    playSound('break');
    return; // at most one block per frame
  }
}

function updateBall(dt) {
  const { ball, paddle } = state;

  if (state.mode === 'serve') {
    serveBall();
    return;
  }

  if (state.mode !== 'playing') return; // 'won' / 'lost': the ball stops moving

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  // Side walls
  if (ball.x <= 0) {
    ball.x = 0;
    ball.vx = -ball.vx;
    playSound('bounce');
  } else if (ball.x + ball.size >= CANVAS_W) {
    ball.x = CANVAS_W - ball.size;
    ball.vx = -ball.vx;
    playSound('bounce');
  }

  // Ceiling (bottom edge of the HUD)
  if (ball.y <= HUD_H) {
    ball.y = HUD_H;
    ball.vy = -ball.vy;
    playSound('bounce');
  }

  checkBlockCollision();

  if (state.blocks.every((block) => !block.alive)) {
    state.mode = state.level < LEVELS.length ? 'levelComplete' : 'won';
    ball.vx = 0;
    ball.vy = 0;
    return;
  }

  // Paddle: only checked while the ball is moving down, so it can't get stuck inside
  const hitsPaddle =
    ball.vy > 0 &&
    ball.x + ball.size >= paddle.x &&
    ball.x <= paddle.x + paddle.w &&
    ball.y + ball.size >= paddle.y &&
    ball.y + ball.size <= paddle.y + paddle.h;

  if (hitsPaddle) {
    bounceOffPaddle();
  }

  // Falls below the paddle: lose a life
  if (ball.y > CANVAS_H) {
    ball.vx = 0;
    ball.vy = 0;
    state.lives -= 1;

    if (state.lives <= 0) {
      state.mode = 'lost';
    } else {
      state.mode = 'serve';
      serveBall();
    }
  }
}

function updateExplosions(dt) {
  const elapsedMs = dt * 1000;
  state.explosions = state.explosions
    .map((explosion) => ({ ...explosion, elapsed: explosion.elapsed + elapsedMs }))
    .filter((explosion) => explosion.elapsed < EXPLOSION_DURATION);
}

function update(dt) {
  if (state.mode === 'paused') return;
  updatePaddle(dt);
  updateBall(dt);
  updateExplosions(dt);
}

function render() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  for (const block of state.blocks) {
    if (!block.alive) continue;
    drawSprite(ctx, 'block_' + block.color, block.x, block.y, block.w, block.h);
  }

  for (const explosion of state.explosions) {
    const frameIndex = Math.min(3, Math.floor(explosion.elapsed / (EXPLOSION_DURATION / 4)));
    const frame = EXPLOSION_FRAMES[explosion.color][frameIndex];
    drawFrame(ctx, frame, explosion.x, explosion.y, BLOCK_W, BLOCK_H);
  }

  drawSprite(ctx, 'paddle', state.paddle.x, state.paddle.y, state.paddle.w, state.paddle.h);
  drawSprite(ctx, 'ball', state.ball.x, state.ball.y, state.ball.size, state.ball.size);

  // HUD strip
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, CANVAS_W, HUD_H);

  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText('Score: ' + state.score, 8, HUD_H / 2);

  ctx.textAlign = 'center';
  ctx.fillText('Level: ' + state.level, CANVAS_W / 2, HUD_H / 2);

  ctx.textAlign = 'right';
  ctx.fillText('Lives: ' + state.lives, CANVAS_W - 8, HUD_H / 2);

  if (state.mode === 'won' || state.mode === 'lost' || state.mode === 'paused' || state.mode === 'levelComplete') {
    const messages = {
      won: 'You Win!',
      lost: 'Game Over',
      paused: 'Paused',
      levelComplete: `Level ${state.level} Complete!`,
    };

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, HUD_H, CANVAS_W, CANVAS_H - HUD_H);

    ctx.fillStyle = '#fff';
    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(messages[state.mode], CANVAS_W / 2, CANVAS_H / 2);
  }
}

function loop(timestamp) {
  if (lastTime === null) lastTime = timestamp;
  let dt = (timestamp - lastTime) / 1000;
  if (dt > MAX_DT) dt = MAX_DT;
  lastTime = timestamp;

  update(dt);
  render();

  requestAnimationFrame(loop);
}

loadSpritesheet(() => {
  requestAnimationFrame(loop);
});
