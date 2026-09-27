# SPEC 01 — MVP jugable de Arkanoid

> **Estado:** Borrador
> **Depende de:** —
> **Fecha:** 2026-09-27
> **Objetivo:** Tener una partida completa de Arkanoid jugable en el navegador, con paleta, pelota, un nivel de bloques, vidas, puntuación, pausa y pantallas de victoria y game over.

## Alcance

**Dentro:**

- Página `index.html` en la raíz con un `<canvas>` de 480×640, más `style.css` y `game.js`.
- Carga de sprites con `assets/spritesheet.js`, y bucle de juego arrancado desde el callback de `loadSpritesheet`.
- Paleta controlada con teclado (flechas ← → y A/D) y con el movimiento horizontal del ratón sobre el canvas.
- Pelota que empieza pegada a la paleta y se lanza con Espacio o clic.
- Rebote en las paredes laterales y en el techo. El techo es el borde inferior del HUD.
- Rebote en la paleta con un ángulo que depende del punto de impacto, entre -60° y +60° respecto a la vertical.
- Velocidad de la pelota constante (300 px/s), con movimiento en px/s basado en delta-time.
- Un único nivel fijo de 6 filas × 13 bloques de 32×16, cada fila de un color.
- Cada bloque se rompe de un golpe y suma 10 puntos.
- 3 vidas. Si la pelota cae por debajo de la paleta se pierde una vida y la pelota vuelve a quedar pegada a la paleta.
- HUD en una franja superior de 32 px, dibujado en el canvas con la puntuación y las vidas.
- Pausa y reanudación con la tecla P.
- Texto de "¡Victoria!" al romper todos los bloques y de "Game Over" al quedarse sin vidas. En ambos casos, Espacio o clic reinicia la partida.

**Fuera de alcance (para futuras specs):**

- Sonidos (`assets/sounds/*.mp3`).
- Animación de explosión de bloques (`EXPLOSION_FRAMES`).
- Varios niveles o editor de niveles.
- Bloques duros o de varios golpes (`gray` queda reservado para esto).
- Aumento progresivo de la velocidad de la pelota.
- Power-ups, pantalla de título y récord o cualquier persistencia en `localStorage`.
- Controles táctiles o móvil y escalado responsive del canvas.

## Modelo de datos

```js
// Constantes (game.js)
const CANVAS_W = 480, CANVAS_H = 640;
const HUD_H = 32;                       // franja superior del HUD
const BLOCK_W = 32, BLOCK_H = 16;
const BLOCK_COLS = 13, BLOCK_ROWS = 6;
const GRID_X = 32, GRID_Y = 64;         // esquina superior izquierda de la cuadrícula (margen de 32 px a cada lado)
const ROW_COLORS = ['red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green'];
const PADDLE_W = 80, PADDLE_H = 14, PADDLE_Y = 600, PADDLE_SPEED = 420; // px/s con teclado
const BALL_SIZE = 16, BALL_SPEED = 300;  // px/s
const MAX_BOUNCE_ANGLE = Math.PI / 3;    // 60°
const START_LIVES = 3, POINTS_PER_BLOCK = 10;
const MAX_DT = 1 / 30;                   // tope de dt en segundos, para evitar saltos tras un cambio de pestaña

// Estado mutable
const state = {
  mode: 'serve',        // 'serve' | 'playing' | 'paused' | 'won' | 'lost'
  score: 0,
  lives: START_LIVES,
  paddle: { x: 200, y: PADDLE_Y, w: PADDLE_W, h: PADDLE_H },
  ball:   { x: 0, y: 0, size: BALL_SIZE, vx: 0, vy: 0 },
  blocks: [ /* { x, y, w, h, color, alive: true } */ ],
  input:  { left: false, right: false, mouseX: null },
};
```

Convenciones:

- Coordenadas con origen arriba a la izquierda. `x, y` es la esquina superior izquierda de cada entidad.
- Velocidades en px/s, multiplicadas por `dt` en segundos (limitado a `MAX_DT`).
- En modo `serve`, la pelota se centra sobre la paleta en cada frame.
- La paleta se dibuja con `drawSprite(ctx, 'paddle', …)` escalada de 162×14 a 80×14. Los bloques se dibujan con `drawSprite(ctx, 'block_<color>', …)`.
- Al lanzar, la pelota sale a 30° a la derecha de la vertical, hacia arriba.
- En la paleta, el ángulo es `((centroPelota - centroPaleta) / (PADDLE_W / 2)) * MAX_BOUNCE_ANGLE`, limitado a ±60°. La velocidad se recompone con módulo `BALL_SPEED` y `vy` negativa.
- En los bloques la colisión es AABB. Se refleja el eje de menor penetración y se procesa como máximo un bloque por frame.

## Plan de implementación

1. Crear `index.html` (con `<canvas id="game" width="480" height="640">`, `assets/spritesheet.js` y luego `game.js`), `style.css` (fondo oscuro y canvas centrado) y `game.js` con las constantes, `state`, y un bucle `requestAnimationFrame` iniciado desde `loadSpritesheet` que limpia el canvas y dibuja la franja del HUD. Prueba manual: `python3 -m http.server 8000` muestra el canvas vacío, sin errores en consola.
2. Añadir la paleta: dibujo con sprite, movimiento con flechas o A/D a `PADDLE_SPEED * dt`, seguimiento de `mouseX` y limitación a los bordes del canvas. Prueba manual: la paleta se mueve con los dos métodos y no sale del canvas.
3. Añadir la pelota en modo `serve`, pegada a la paleta. Espacio o clic la lanza (`mode = 'playing'`). Rebota en las paredes laterales y en `HUD_H`. Si cae por debajo de `CANVAS_H`, vuelve a `serve` (sin vidas todavía). Prueba manual: se lanza, rebota en las paredes y reaparece sobre la paleta.
4. Añadir la colisión pelota-paleta con el ángulo según el punto de impacto. Prueba manual: golpear con el borde izquierdo manda la pelota a la izquierda, y con el derecho, a la derecha.
5. Generar la cuadrícula de 6×13 bloques con `ROW_COLORS`, dibujarla, y añadir colisión con rebote, `alive = false` y +10 puntos. Mostrar `Puntos: N` en el HUD. Prueba manual: los bloques desaparecen al golpearlos y la puntuación sube de 10 en 10.
6. Añadir vidas: `Vidas: N` en el HUD, se pierde una al caer la pelota, y con 0 se pasa a `mode = 'lost'` con el texto "Game Over". Si no quedan bloques vivos, `mode = 'won'` con el texto "¡Victoria!". En `won` o `lost`, Espacio o clic reinicia score, vidas, bloques y paleta. Prueba manual: perder 3 vidas muestra Game Over, y reiniciar deja todo como al inicio.
7. Añadir la pausa: P alterna entre `playing` y `paused`. En pausa no se actualiza la física ni la paleta, y se muestra el texto "Pausa". Prueba manual: P congela y reanuda la partida.

## Criterios de aceptación

- [ ] Abrir `http://localhost:8000` muestra el canvas de 480×640 sin errores en la consola.
- [ ] La paleta se mueve con ← → y con A/D, y también sigue al ratón en horizontal.
- [ ] La paleta nunca sale de los límites del canvas.
- [ ] Al iniciar, la pelota está pegada a la paleta y la sigue al moverse.
- [ ] Espacio o clic lanza la pelota.
- [ ] La pelota rebota en las paredes laterales y en el borde inferior del HUD, y nunca entra en la franja del HUD.
- [ ] Golpear la pelota con el extremo izquierdo de la paleta la manda hacia la izquierda, y con el derecho, hacia la derecha.
- [ ] Se muestran 78 bloques (6 filas × 13) y cada fila es de un color distinto.
- [ ] Cada bloque desaparece al primer golpe y suma exactamente 10 puntos al HUD.
- [ ] La partida empieza con 3 vidas en el HUD.
- [ ] Al caer la pelota se resta una vida y la pelota vuelve a la paleta.
- [ ] Con 0 vidas se muestra "Game Over" y la pelota deja de moverse.
- [ ] Romper los 78 bloques muestra "¡Victoria!".
- [ ] En Game Over o Victoria, Espacio o clic reinicia con 0 puntos, 3 vidas y los 78 bloques.
- [ ] P pausa la partida, con el texto "Pausa" y todo congelado, y otra pulsación de P la reanuda.
- [ ] La pelota se mueve a la misma velocidad percibida en monitores de 60 Hz y de 144 Hz.
- [ ] El proyecto no añade dependencias, `package.json` ni build.

## Decisiones

- **Sí:** tres archivos en la raíz (`index.html`, `style.css`, `game.js`) con `game.js` como script clásico. `spritesheet.js` define globales y exige que el HTML esté en la raíz, y así no se sirven módulos ES.
- **No:** `src/` con módulos ES. Es demasiada estructura para el tamaño del MVP. Se puede refactorizar cuando crezca.
- **Sí:** canvas vertical de 480×640 con bloques al tamaño nativo del sprite (32×16). 13 × 32 = 416 px, con 32 px de margen a cada lado.
- **Sí:** el ángulo de rebote depende del punto de impacto en la paleta, con un máximo de ±60°. Es el comportamiento clásico y da control al jugador.
- **No:** reflexión simple en la paleta. El jugador no podría apuntar.
- **Sí:** velocidad fija de 300 px/s con delta-time y un tope de dt de 1/30 s. Así es independiente de la tasa de refresco y evita que la pelota atraviese objetos tras un cambio de pestaña.
- **No:** velocidad progresiva. Queda para una spec de dificultad.
- **Sí:** 10 puntos fijos por bloque. Es la regla más simple.
- **No:** puntos según la fila.
- **Sí:** la pelota espera sobre la paleta sin pantalla de título, y el mismo mecanismo se usa al inicio y tras perder una vida.
- **Sí:** HUD dibujado en el canvas, en una franja de 32 px. Así todo el render vive en un solo sitio.
- **No:** HUD en el DOM.
- **Sí:** pausa con P.
- **No:** persistencia. El récord irá en una spec propia.
- **Sí:** filas de `red`, `yellow`, `cyan`, `magenta`, `hotpink` y `green`. `gray` se reserva para futuros bloques duros.
- **No:** sonidos ni explosiones en este MVP. Los assets existen, pero se dejan para una spec de "feedback audiovisual".

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La pelota atraviesa bloques o la paleta con un dt grande | `dt` limitado a `MAX_DT` (1/30 s). A 300 px/s son 10 px por frame como máximo, menos que el grosor de un bloque (16 px). |
| La pelota queda atrapada rebotando dentro de la paleta | La colisión con la paleta solo se procesa si `vy > 0`, y al rebotar la pelota se recoloca justo encima de la paleta. |
| Doble rebote al tocar dos bloques en el mismo frame | Se procesa como máximo un bloque por frame. |
| El juego arranca antes de cargar el spritesheet | El bucle solo empieza en el callback de `loadSpritesheet`. |

## Qué **no** entra en esta spec

- Sonidos y animación de explosiones.
- Varios niveles, bloques duros y power-ups.
- Pantalla de título, récord y persistencia.
- Aumento de velocidad y controles táctiles o responsive.

Cada uno de estos puntos, si llega, irá en su propia spec.
