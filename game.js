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

function launchBall() {
  if (state.mode !== 'serve') return;
  const angle = Math.PI / 6; // 30° a la derecha de la vertical
  state.ball.vx = BALL_SPEED * Math.sin(angle);
  state.ball.vy = -BALL_SPEED * Math.cos(angle);
  state.mode = 'playing';
}

window.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Spacebar') launchBall();
});

canvas.addEventListener('click', launchBall);

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

function serveBall() {
  const { paddle, ball } = state;
  ball.x = paddle.x + paddle.w / 2 - ball.size / 2;
  ball.y = paddle.y - ball.size;
}

function updateBall(dt) {
  const { ball } = state;

  if (state.mode === 'serve') {
    serveBall();
    return;
  }

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  // Paredes laterales
  if (ball.x <= 0) {
    ball.x = 0;
    ball.vx = -ball.vx;
  } else if (ball.x + ball.size >= CANVAS_W) {
    ball.x = CANVAS_W - ball.size;
    ball.vx = -ball.vx;
  }

  // Techo (borde inferior del HUD)
  if (ball.y <= HUD_H) {
    ball.y = HUD_H;
    ball.vy = -ball.vy;
  }

  // Cae por debajo de la paleta: vuelve a servirse (las vidas se restan en el Paso 6)
  if (ball.y > CANVAS_H) {
    ball.vx = 0;
    ball.vy = 0;
    state.mode = 'serve';
    serveBall();
  }
}

function update(dt) {
  updatePaddle(dt);
  updateBall(dt);
  // La lógica de bloques, vidas y pausa se añade en los siguientes pasos.
}

function render() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  drawSprite(ctx, 'paddle', state.paddle.x, state.paddle.y, state.paddle.w, state.paddle.h);
  drawSprite(ctx, 'ball', state.ball.x, state.ball.y, state.ball.size, state.ball.size);

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
