# SPEC 03 — Sonido de rebote y rotura de bloques

> **Estado:** Aprobado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-09-27
> **Objetivo:** Reproducir `assets/sounds/ball-bounce.mp3` cada vez que la pelota rebota contra una superficie distinta de un bloque (paredes, techo o paleta), y `assets/sounds/break-sound.mp3` cada vez que se rompe un bloque.

## Alcance

**Dentro:**

- Reproducir `ball-bounce.mp3` en los cuatro puntos de `updateBall` donde la pelota rebota: pared izquierda, pared derecha, techo (borde inferior del HUD) y paleta.
- Reproducir `break-sound.mp3` en `checkBlockCollision`, en el mismo golpe en que un bloque pasa a `alive = false` (junto con la creación de su explosión, ya definida en la SPEC 02). En ese golpe **no** suena `ball-bounce.mp3`, ya que el bloque no es una de las superficies cubiertas por ese sonido.
- Cada reproducción crea una instancia independiente del sonido (vía `cloneNode(true)`), de modo que rebotes o roturas seguidas no se corten entre sí.
- El volumen queda al valor por defecto (1.0), sin mute ni ajuste alguno.

**Fuera de alcance (para futuras specs):**

- Sonido al lanzar la pelota (Espacio o clic), al perder una vida, en "¡Victoria!" o en "Game Over".
- Control de volumen, tecla de mute, o cualquier ajuste de audio.
- Música de fondo.
- Cualquier cambio a las reglas de colisión, puntuación, velocidad o animación de explosión definidas en las SPEC 01 y 02.

## Modelo de datos

```js
// Nuevo, fuera de `state` (game.js) — son recursos de audio, no estado de partida
const SOUNDS = {
  bounce: new Audio('assets/sounds/ball-bounce.mp3'),
  break: new Audio('assets/sounds/break-sound.mp3'),
};

function playSound(name) {
  const clone = SOUNDS[name].cloneNode(true);
  clone.play().catch(() => {}); // ignora rechazo por autoplay; ya hubo interacción del usuario para llegar aquí
}
```

Convenciones:

- No se guarda nada en `state`: a diferencia de `state.explosions`, un sonido no necesita trackearse entre frames, solo dispararse en el instante de la colisión.
- `playSound` solo se llama desde dentro de `updateBall` y `checkBlockCollision`, funciones que ya solo se ejecutan con `state.mode === 'playing'`.
- Cada llamada crea un clon del `<audio>` base con `cloneNode(true)` para permitir solapes; el clon no se guarda en ninguna estructura y queda disponible para el recolector de basura al terminar de sonar.

## Plan de implementación

1. Añadir el objeto `SOUNDS` con los dos `new Audio(...)` y la función `playSound(name)` con `cloneNode(true).play().catch(() => {})`, sin invocarla todavía desde ningún sitio. Prueba manual: la partida sigue funcionando igual que antes, sin cambios audibles ni errores en consola.
2. Llamar a `playSound('bounce')` en los tres rebotes de `updateBall` contra pared izquierda, pared derecha y techo. Prueba manual: se oye el sonido de rebote al golpear cualquier pared o el techo.
3. Llamar a `playSound('bounce')` en el rebote contra la paleta (dentro de `bounceOffPaddle` o justo donde se invoca). Prueba manual: golpear la paleta también reproduce el sonido de rebote.
4. Llamar a `playSound('break')` en `checkBlockCollision`, junto a donde se pone `block.alive = false` y se empuja la explosión. Prueba manual: al romper un bloque se oye el sonido de rotura y no el de rebote en ese mismo golpe; rebotar y romper bloques en sucesión rápida no corta ningún sonido a la mitad.

## Criterios de aceptación

- [ ] Rebotar contra la pared izquierda reproduce `ball-bounce.mp3`.
- [ ] Rebotar contra la pared derecha reproduce `ball-bounce.mp3`.
- [ ] Rebotar contra el techo (borde inferior del HUD) reproduce `ball-bounce.mp3`.
- [ ] Rebotar contra la paleta reproduce `ball-bounce.mp3`.
- [ ] Romper un bloque reproduce `break-sound.mp3` y no reproduce `ball-bounce.mp3` en ese mismo golpe.
- [ ] Rebotar varias veces seguidas contra paredes, o romper varios bloques en sucesión rápida, reproduce cada sonido completo sin cortar al anterior.
- [ ] Lanzar la pelota, perder una vida, ganar o perder la partida no reproducen ningún sonido nuevo.
- [ ] No hay errores ni promesas rechazadas sin capturar en la consola del navegador.
- [ ] El proyecto sigue sin dependencias, `package.json` ni build.

## Decisiones

- **Sí:** `cloneNode(true).play()` en cada reproducción, para permitir solapes cuando la pelota rebota o rompe bloques rápido.
- **No:** un único `Audio` reutilizado por sonido con `currentTime = 0`. Cortaría el sonido anterior si dos rebotes ocurren muy seguidos.
- **Sí:** volumen fijo por defecto, sin tecla de mute. No estaba en el pedido original y mantiene el alcance mínimo.
- **No:** agregar control de volumen o mute en esta spec.
- **Sí:** perder una vida, "¡Victoria!", "Game Over" y el lanzamiento de la pelota no llevan sonido nuevo. El pedido solo especifica rebote y rotura.
- **Sí:** envolver `play()` en `.catch(() => {})` para no ensuciar la consola si algún navegador bloquea el autoplay, aunque en la práctica el primer sonido siempre ocurre después de una interacción del usuario (Espacio o clic para lanzar la pelota).

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Bloqueo de autoplay del navegador antes de la primera interacción | El primer rebote solo puede ocurrir tras lanzar la pelota (Espacio o clic), que ya es una interacción del usuario; además `play()` se envuelve en `.catch(() => {})` por si algún navegador lo bloquea igual. |
| Acumulación de elementos `<audio>` clonados en memoria | Los clones no se guardan en ninguna estructura; al terminar de sonar quedan sin referencias y el recolector de basura los libera. Con efectos de duración corta y la tasa de colisiones del juego, el impacto es despreciable. |

## Qué **no** entra en esta spec

- Sonido al lanzar la pelota, al perder una vida, en "¡Victoria!" o en "Game Over".
- Control de volumen, mute o cualquier ajuste de audio.
- Música de fondo.

Cada uno de estos puntos, si llega, irá en su propia spec.
