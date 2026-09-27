// Arkanoid — SPEC 01: MVP jugable
// game.js es un script clásico (no módulo), cargado después de assets/spritesheet.js.

// --- Constantes ---
const CANVAS_W = 480, CANVAS_H = 640;
const HUD_H = 32;                       // franja superior del HUD
const BLOCK_W = 32, BLOCK_H = 16;
const BLOCK_COLS = 13, BLOCK_ROWS = 6;
const GRID_X = 32, GRID_Y = 64;         // esquina superior izquierda de la cuadrícula
const ROW_COLORS = ['red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green'];
const PADDLE_W = 80, PADDLE_H = 14, PADDLE_Y = 600, PADDLE_SPEED = 420; // px/s con teclado
const BALL_SIZE = 16, BALL_SPEED = 300;  // px/s
const MAX_BOUNCE_ANGLE = Math.PI / 3;    // 60°
const START_LIVES = 3, POINTS_PER_BLOCK = 10;
const MAX_DT = 1 / 30;                   // tope de dt en segundos

// --- Estado mutable ---
const state = {
  mode: 'serve',        // 'serve' | 'playing' | 'paused' | 'won' | 'lost'
  score: 0,
  lives: START_LIVES,
  paddle: { x: (CANVAS_W - PADDLE_W) / 2, y: PADDLE_Y, w: PADDLE_W, h: PADDLE_H },
  ball:   { x: 0, y: 0, size: BALL_SIZE, vx: 0, vy: 0 },
  blocks: [ /* { x, y, w, h, color, alive: true } */ ],
  input:  { left: false, right: false, mouseX: null },
};

// --- Canvas ---
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// --- Entrada ---
function clampPaddleX(x) {
  return Math.max(0, Math.min(CANVAS_W - state.paddle.w, x));
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') state.input.left = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') state.input.right = true;
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') state.input.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') state.input.right = false;
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_W / rect.width;
  state.input.mouseX = (e.clientX - rect.left) * scaleX;
});

// --- Bucle de juego ---
let lastTime = null;

function updatePaddle(dt) {
  const { paddle, input } = state;

  if (input.mouseX !== null) {
    paddle.x = input.mouseX - paddle.w / 2;
  }
  if (input.left) paddle.x -= PADDLE_SPEED * dt;
  if (input.right) paddle.x += PADDLE_SPEED * dt;

  paddle.x = clampPaddleX(paddle.x);
}

function update(dt) {
  updatePaddle(dt);
  // La lógica de pelota, bloques, vidas y pausa se añade en los siguientes pasos.
}

function render() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  drawSprite(ctx, 'paddle', state.paddle.x, state.paddle.y, state.paddle.w, state.paddle.h);

  // Franja del HUD
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, CANVAS_W, HUD_H);
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
