# Sky Contract

Shoot ’em up horizontal en HD (canvas 1280×720), inspirado en el género de *UN Squadron* / *Area 88*.

**Juego original** — no usa assets, personajes ni marcas de Capcom.

## Cómo jugar

`index.html` es **autocontenido** (CSS + JS embebidos). Ábrelo con doble clic; funciona con `file://` sin servidor ni CORS.

Si ves un error CORS de `type="module"`, tienes una copia vieja. Actualiza la rama del PR:

```bash
git fetch origin
git checkout cursor/sky-mercenary-hd-5826
git pull origin cursor/sky-mercenary-hd-5826
```

Luego abre de nuevo `sky-mercenary/index.html`.

| Control | Acción |
|---------|--------|
| WASD / flechas | Mover |
| Espacio | Disparo |
| Shift | Arma especial |
| Enter | Confirmar / despegar |
| Esc | Menú / pausa |

## Contenido

- Hangar con 3 aviones (stats y especiales distintos)
- Crédito por derribos; desbloquea máquinas más caras
- Oleadas, torretas, bomber y jefe final
- Power-ups: crédito, reparación, potencia de arma
- Récord guardado en `localStorage`

## Nota legal

Este proyecto es un homenaje al género arcade de combate aéreo mercenary. No es un remake oficial ni afiliado a Capcom ni a *Area 88*.
