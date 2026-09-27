# SPEC 02 — Animación de explosión al destruir bloques

> **Estado:** Aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-09-27
> **Objetivo:** Al romperse un bloque, reproducir en su lugar la animación de explosión de 4 fotogramas de `EXPLOSION_FRAMES` durante 150 ms antes de que desaparezca del todo.

## Alcance

**Dentro:**

- Cuando un bloque pasa a `alive = false` en `checkBlockCollision`, se crea una explosión en su posición y color.
- La explosión se dibuja con `drawFrame(ctx, frame, x, y, w, h)`, recorriendo los 4 fotogramas de `EXPLOSION_FRAMES.<color>` a partes iguales durante `EXPLOSION_DURATION` (150 ms), es decir 37.5 ms por fotograma.
- Los bloques de color `gray` usan `EXPLOSION_FRAMES.gray` (que reutiliza los fotogramas de `red`, ya definido así en `spritesheet.js`).
- El bloque deja de existir para la física y la puntuación en el mismo frame del impacto, exactamente igual que en la SPEC 01. La animación es un efecto puramente visual que se dibuja encima, sin bloquear ni retrasar el rebote de la pelota ni la detección de victoria.
- Varias explosiones pueden estar activas y solaparse en el tiempo si el jugador rompe varios bloques en sucesión (como máximo un bloque por frame, regla ya vigente).
- Cada explosión se elimina de `state.explosions` en cuanto pasan sus 150 ms.

**Fuera de alcance (para futuras specs):**

- Sonido de rotura (`assets/sounds/break-sound.mp3`) y de rebote (`ball-bounce.mp3`). Quedan para una spec de feedback audiovisual, tal como ya indicaba la SPEC 01.
- Cualquier cambio en las reglas de colisión, puntuación o velocidad de la pelota.
- Bloques que ocupen espacio físico mientras explotan.

## Modelo de datos

```js
// Nuevo estado en `state` (game.js)
state.explosions = [ /* { x, y, color, elapsed } */ ];
```

Convenciones:

- Cada explosión guarda `x`, `y` (esquina superior izquierda, iguales a las del bloque que la originó), `color` y `elapsed` (ms transcurridos desde su creación, inicializado a 0).
- El fotograma a dibujar es `EXPLOSION_FRAMES[color][Math.floor(elapsed / (EXPLOSION_DURATION / 4))]`, con el índice acotado a `[0, 3]`.
- En cada `update(dt)`, `elapsed` de cada explosión aumenta `dt * 1000`. Al llegar a `EXPLOSION_DURATION` la explosión se retira de `state.explosions`.
- Las explosiones se actualizan siempre, incluida la pausa (`mode = 'paused'`) para mantener el resto del comportamiento de pausa (congelar física y paleta) idéntico al de la SPEC 01... — Decisión: en pausa **no** avanzan (ver sección Decisiones).

## Plan de implementación

1. Añadir `state.explosions = []` y, en `checkBlockCollision`, al poner `block.alive = false`, empujar `{ x: block.x, y: block.y, color: block.color, elapsed: 0 }` a `state.explosions`. Prueba manual: sin más cambios, el array crece en la consola al romper bloques (verificable con un `console.log` temporal, que se retira antes de terminar el paso).
2. Añadir `updateExplosions(dt)` que incrementa `elapsed` en cada explosión y filtra las que superan `EXPLOSION_DURATION`. Llamarla desde `update(dt)` solo cuando `mode !== 'paused'`. Prueba manual: el array de explosiones se vacía solo pasados ~150 ms.
3. En `render()`, tras dibujar los bloques vivos, dibujar cada explosión activa con `drawFrame`, calculando el índice de fotograma a partir de `elapsed`. Prueba manual: al romper un bloque se ve la secuencia de 4 fotogramas de la explosión en su lugar antes de quedar vacío.

## Criterios de aceptación

- [ ] Al golpear un bloque, este desaparece de la física en el mismo frame (rebote y puntuación inmediatos, como en la SPEC 01).
- [ ] En el lugar del bloque roto se ve la animación de explosión de su color durante aproximadamente 150 ms, recorriendo sus 4 fotogramas.
- [ ] Un bloque `gray` explota con los mismos fotogramas que uno `red`.
- [ ] Romper varios bloques en sucesión rápida muestra varias explosiones solapadas sin errores.
- [ ] Pasados los 150 ms, la explosión desaparece por completo del canvas.
- [ ] Pausar la partida (P) mientras hay una explosión en curso congela también su animación, y se retoma al reanudar.
- [ ] Romper los 78 bloques sigue mostrando "¡Victoria!" con normalidad.
- [ ] No hay errores en la consola del navegador.
- [ ] El proyecto sigue sin dependencias, `package.json` ni build.

## Decisiones

- **Sí:** el bloque deja de existir para la física en el instante del impacto; la animación es solo visual. Es lo más simple y no toca las reglas de colisión ya aprobadas en la SPEC 01.
- **No:** hacer que el bloque bloquee físicamente hasta terminar de explotar. Añade complejidad no pedida.
- **Sí:** lista `state.explosions` sin límite fijo, para soportar solapes si se rompen varios bloques seguidos.
- **No:** una única explosión global que se corta si empieza otra. Se perdería el efecto al romper bloques rápido.
- **Sí:** las explosiones se congelan en pausa, igual que la física y la paleta, para mantener la pausa consistente con el resto del juego.
- **No:** sonido de rotura en esta spec. Se deja junto con `ball-bounce.mp3` para una spec de audio, como ya señalaba la SPEC 01.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `elapsed` supera `EXPLOSION_DURATION` en un frame con `dt` grande y salta fotogramas | El índice de fotograma se acota a `[0, 3]`; con `MAX_DT` (1/30 s) ya limitado en la SPEC 01, el salto máximo es pequeño frente a los 150 ms totales. |
| Fuga de memoria si una explosión nunca se retira | `updateExplosions` filtra por `elapsed >= EXPLOSION_DURATION` en cada frame en que se ejecuta. |

## Qué **no** entra en esta spec

- Sonidos de rotura o de rebote.
- Bloques que bloqueen físicamente durante su explosión.
- Cualquier cambio a las reglas de colisión, puntuación o velocidad definidas en la SPEC 01.

Cada uno de estos puntos, si llega, irá en su propia spec.
