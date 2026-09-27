# SPEC 04 — Niveles progresivos con dificultad creciente

> **Estado:** Aprobado
> **Depende de:** SPEC 01, SPEC 02, SPEC 03
> **Fecha:** 2026-09-27
> **Objetivo:** Añadir 3 niveles fijos que se juegan en secuencia dentro de la misma partida, cada uno con más bloques y una pelota más rápida que el anterior.

## Alcance

**Dentro:**

- 3 niveles fijos, definidos en un array `LEVELS` en `game.js`, cada uno con su número de filas de bloques y la velocidad de la pelota:
  - Nivel 1: 6 filas × 13 columnas (78 bloques), pelota a 300 px/s (igual que la SPEC 01 actual).
  - Nivel 2: 8 filas × 13 columnas (104 bloques), pelota a 360 px/s.
  - Nivel 3: 10 filas × 13 columnas (130 bloques), pelota a 420 px/s.
- Las filas más allá de las 6 originales repiten cíclicamente los colores de `ROW_COLORS` (fila 7 = `red`, fila 8 = `yellow`, fila 9 = `cyan`, fila 10 = `magenta`). El color `gray` no entra en el ciclo.
- Al romper todos los bloques de un nivel que no es el último, la partida pasa a un nuevo estado `levelComplete` que detiene la pelota y muestra "¡Nivel N superado!" superpuesto, igual que ya se hace con "Pausa" o "Game Over".
- Con Espacio o clic durante `levelComplete`, arranca el siguiente nivel: se generan sus bloques, la pelota vuelve a modo `serve`, y el score y las vidas se conservan tal cual estaban.
- Al romper todos los bloques del nivel 3 (el último), se mantiene el comportamiento actual: `mode = 'won'` y el texto "¡Victoria!".
- El HUD muestra "Nivel: N" junto a "Puntos" y "Vidas".
- Perder las 3 vidas en cualquier nivel (1, 2 o 3) sigue mostrando "Game Over". Con Espacio o clic tras "Game Over" o tras "¡Victoria!", la partida se reinicia completa: nivel 1, 0 puntos, 3 vidas y los 78 bloques originales.

**Fuera de alcance (para futuras specs):**

- Más de 3 niveles o generación procedural/aleatoria de niveles.
- Editor de niveles.
- Patrones de bloques con huecos o formas no rectangulares.
- Bloques de varios golpes. `gray` sigue reservado para eso, tal como ya definía la SPEC 01, sin cambios de comportamiento en esta spec.
- Selección de nivel, o continuar una partida desde el nivel alcanzado tras un Game Over.
- Cambios en la velocidad de la paleta (`PADDLE_SPEED`) entre niveles.
- Persistencia de progreso, puntuaciones o niveles entre sesiones (`localStorage`), tal como ya excluía la SPEC 01.

## Modelo de datos

```js
// Nueva constante (game.js), sustituye a BLOCK_ROWS y BALL_SPEED como valores fijos
const LEVELS = [
  { rows: 6, ballSpeed: 300 },
  { rows: 8, ballSpeed: 360 },
  { rows: 10, ballSpeed: 420 },
];

// Nuevo campo en `state`
state.level = 1; // índice humano: 1, 2 o 3 — LEVELS[state.level - 1] es la config activa
```

Convenciones:

- `createBlocks(level)` deja de usar la constante `BLOCK_ROWS` fija y usa `LEVELS[level - 1].rows`. El color de cada fila pasa a ser `ROW_COLORS[row % ROW_COLORS.length]` en lugar de `ROW_COLORS[row]`, para soportar niveles con más de 6 filas.
- `launchBall()` y `bounceOffPaddle()` dejan de usar la constante `BALL_SPEED` fija y usan `LEVELS[state.level - 1].ballSpeed`.
- `state.mode` gana un valor nuevo: `'levelComplete'` (además de los ya existentes `'serve' | 'playing' | 'paused' | 'won' | 'lost'`). Se entra en `levelComplete` cuando no quedan bloques vivos y `state.level < LEVELS.length`; se entra en `won` cuando no quedan bloques vivos y `state.level === LEVELS.length` (comportamiento sin cambios respecto a la SPEC 01).
- El score y las vidas viven en `state` igual que hoy y no se reinician al pasar de nivel, solo en `resetGame()`.

## Plan de implementación

1. Añadir la constante `LEVELS` y `state.level = 1`. Cambiar `createBlocks` para leer `LEVELS[level - 1].rows` (recibiendo `level` como parámetro, invocado con `state.level`), y `launchBall`/`bounceOffPaddle` para leer `LEVELS[state.level - 1].ballSpeed` en vez de las constantes `BLOCK_ROWS`/`BALL_SPEED`. Prueba manual: el nivel 1 se juega exactamente igual que antes (78 bloques, pelota a 300 px/s).
2. Cambiar `createBlocks` para asignar color con `ROW_COLORS[row % ROW_COLORS.length]` en vez de `ROW_COLORS[row]`. Prueba manual: el nivel 1 se ve visualmente idéntico (6 filas, el ciclo nunca se repite todavía).
3. En `updateBall`, cuando no quedan bloques vivos: si `state.level < LEVELS.length`, poner `mode = 'levelComplete'` y detener la pelota (en vez de `mode = 'won'`); si `state.level === LEVELS.length`, mantener el `mode = 'won'` actual. Añadir el mensaje "¡Nivel N superado!" (con el número de nivel actual) al overlay que ya dibuja "Pausa"/"Game Over"/"¡Victoria!". Prueba manual: al romper los 78 bloques del nivel 1 aparece "¡Nivel 1 superado!" en vez de "¡Victoria!".
4. Añadir `advanceLevel()`: incrementa `state.level`, regenera `state.blocks` con `createBlocks(state.level)`, vacía `state.explosions`, pone `mode = 'serve'` y llama a `serveBall()`, sin tocar `state.score` ni `state.lives`. En `handleAction()`, si `state.mode === 'levelComplete'`, llamar a `advanceLevel()` en vez de `launchBall()`. Prueba manual: tras "¡Nivel 1 superado!", Espacio o clic arrancan el nivel 2 con 104 bloques y la pelota notablemente más rápida, conservando el score y las vidas del nivel 1.
5. Actualizar `resetGame()` para además poner `state.level = 1` (junto al score, vidas y bloques que ya reinicia). Prueba manual: perder las 3 vidas en el nivel 2 o 3, o completar el nivel 3, y pulsar Espacio/clic reinicia siempre en el nivel 1 con 0 puntos, 3 vidas y 78 bloques.
6. Añadir "Nivel: N" al HUD, entre "Puntos" y "Vidas". Prueba manual: el HUD muestra el nivel correcto durante una partida completa de los 3 niveles.

## Criterios de aceptación

- [ ] El nivel 1 muestra 78 bloques (6×13) y la pelota viaja a 300 px/s, igual que antes de esta spec.
- [ ] Al romper los 78 bloques del nivel 1 aparece el mensaje "¡Nivel 1 superado!" y la pelota se detiene sin reiniciar la partida sola.
- [ ] Con Espacio o clic tras "¡Nivel 1 superado!", arranca el nivel 2: 104 bloques (8×13) y la pelota a 360 px/s.
- [ ] Al empezar el nivel 2, el HUD muestra "Nivel: 2" y conserva el score y las vidas acumuladas en el nivel 1.
- [ ] Al romper todos los bloques del nivel 2 aparece "¡Nivel 2 superado!"; con Espacio o clic arranca el nivel 3 con 130 bloques (10×13) y la pelota a 420 px/s.
- [ ] Las filas 7 a 10 usan los colores de `ROW_COLORS` repitiendo el ciclo (fila 7 = red, fila 8 = yellow, fila 9 = cyan, fila 10 = magenta).
- [ ] Al romper todos los bloques del nivel 3 aparece "¡Victoria!" (no "¡Nivel 3 superado!").
- [ ] Perder las 3 vidas en el nivel 1, 2 o 3 muestra "Game Over".
- [ ] Tras "Game Over" o "¡Victoria!", Espacio o clic reinicia la partida completa: nivel 1, 0 puntos, 3 vidas y 78 bloques.
- [ ] La pausa (P) sigue funcionando igual dentro de cualquier nivel mientras `mode === 'playing'`.
- [ ] No hay errores en la consola del navegador durante una partida completa (los 3 niveles, un Game Over y una Victoria).
- [ ] El proyecto sigue sin dependencias, `package.json` ni build.

## Decisiones

- **Sí:** 3 niveles fijos definidos en el array `LEVELS`, con filas 6/8/10 y velocidad de pelota 300/360/420 px/s (+20% por nivel). Da una progresión de dificultad perceptible sin necesitar un editor de niveles ni generación procedural.
- **No:** cambiar `PADDLE_SPEED` entre niveles. El pedido original habla de "velocidad de juego", pero se acotó en la fase de preguntas a la velocidad de la pelota; mantener la paleta constante evita que la dificultad añadida por la pelota se compense a sí misma.
- **Sí:** las filas adicionales repiten el ciclo de los 6 colores de `ROW_COLORS`. Es la opción más simple y no introduce un color nuevo sin significado.
- **No:** incluir `gray` en el ciclo de colores. Sigue reservado para una futura spec de bloques de varios golpes, tal como ya decidió la SPEC 01.
- **No:** patrones de bloques con huecos o formas distintas a la cuadrícula rectangular actual. No fue pedido y añade complejidad de layout innecesaria.
- **Sí:** score y vidas se acumulan a través de los 3 niveles; solo se reinician en Game Over o al completar el nivel 3. Es el comportamiento más simple para una partida que ahora tiene 3 niveles en vez de uno.
- **Sí:** Game Over en cualquier nivel reinicia siempre al nivel 1. Evita decidir cómo "reintentar" un nivel intermedio con score o vidas parciales, algo que no se pidió.
- **No:** guardar el nivel alcanzado o pantalla de selección de nivel. Fuera de alcance, no se pidió.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Aumentar las filas de bloques podría solapar con la paleta en niveles con muchas filas | Con 10 filas (nivel 3) la cuadrícula ocupa hasta `y = GRID_Y + 10 * BLOCK_H = 224`, muy por debajo de `PADDLE_Y = 600`. No hay solape en ninguno de los 3 niveles. |
| Olvidar reiniciar `state.explosions` al avanzar de nivel deja explosiones del nivel anterior visibles sobre el nuevo | `advanceLevel()` vacía `state.explosions` explícitamente, igual que ya hace `resetGame()`. |

## Qué **no** entra en esta spec

- Más de 3 niveles, generación procedural de niveles, o editor de niveles.
- Patrones de bloques con huecos o formas no rectangulares.
- Bloques de varios golpes (`gray` sigue reservado, sin cambios de comportamiento).
- Selección de nivel o continuar una partida desde el nivel alcanzado tras un Game Over.
- Cambios en la velocidad de la paleta entre niveles.
- Persistencia de progreso o puntuaciones entre sesiones.

Cada uno de estos puntos, si llega, irá en su propia spec.
