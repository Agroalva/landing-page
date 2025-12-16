# Taxonomía de publicaciones AgroAlva

Este documento resume la estructura jerárquica que definimos para clasificar publicaciones de venta o alquiler, además de detallar los pasos recomendados para seguir ampliando la taxonomía sin romper compatibilidad.

## Familias y categorías

Cada publicación se asigna a una **familia** y a una **categoría** dentro de esa familia. Hoy soportamos:

| Familia (`familyId`) | Categorías destacadas (`categoryId`) |
| --- | --- |
| `agricultural_machinery` | `tractors`, `seeders`, `harvesters`, `fertilizer_spreaders`, `sprayers`, `platforms_heads`, `harrows`, `grinders`, `rollers`, `plows`, `subsoilers`, `chimangos`, `grain_baggers`, `norias_extractors`, `forage_equipment`, `brushcutters`, `mixers`, `forage_choppers`, `mowers`, `bale_equipment` |
| `product_transport` | `tolvas`, `chasis_acoplado`, `semi_remolque`, `bitren`, `otras` |
| `vehicles` | `pickups`, `trucks`, `cars`, `trailers`, `semi_trailers`, `truck_bodies` |
| `parts_accessories` | Cada entrada de `ACCESSORY_TYPES` es una categoría propia (ej. `repuestos_agricolas`, `repuestos_camiones`, etc.) |
| `rural_properties` | `fields`, `rural_houses`, `lands` |
| `road_machinery` | `earthmoving`, `soil_conditioning`, `heavy_machinery` |

> Los textos visibles (labels) provienen de `apps/app/app/config/taxonomy.ts`. Las referencias en Convex usan los IDs (`familyId`/`categoryId`), por lo que cualquier cambio debe mantener esos IDs estables.

### Atributos

Cada categoría define un arreglo `attributes` con metadata de cada campo:

- `type`: `select`, `multiselect`, `text`, `number`, `numberRange` o `boolean`.
- `options`: catálogo reutilizable importado desde `config/options.ts`.
- `required`: marca si el campo es obligatorio.
- `helperText`/`placeholder`: texts opcionales para UI.

En frontend los atributos se renderizan dinámicamente (formulario de creación y edición) y se guardan como `attributes` en Convex. Los datos se normalizan en `apps/app/convex/products.ts`.

## Cómo extender la taxonomía

1. **Agregar opciones reutilizables** (marcas, rangos, etc.) en `apps/app/app/config/options.ts`. Reaprovecha la función `toOptions` para generar IDs consistentes.
2. **Sumar categorías o atributos** en `apps/app/app/config/taxonomy.ts`. Mantén los IDs en `snake_case`/`kebab-case` sin espacios.
3. **Volver a usar los tipos**: `FamilyId`, `CategoryId`, `AttributeDefinition`, `AttributeValueMap`.
4. **Backend**: si agregas índices específicos para nuevos filtros, actualiza `apps/app/convex/schema/products.ts` para reflejarlos y, si aplica, reindexa usando `npx convex dev --admin` o similar.

## Estrategia de despliegue

### Fase 1 – MVP (completa)
- Sustituimos las categorías rígidas por familias/categorías estructuradas.
- Formularios de crear/editar publicaciones ya leen la taxonomía y envían `familyId`, `categoryId` y `attributes`.
- Las pantallas Home y Search filtran usando los IDs nuevos, pero mantienen compatibilidad con `category` legado.
- Convex guarda y filtra con los nuevos campos (`familyId`, `categoryId`, `attributes`), y `search`/`feed` aceptan filtros modernos y un `legacyCategory` opcional.

### Fase 2 – Profundizar en catálogos
- Completar atributos faltantes por categoría (ej. más catálogos de marcas específicas, provincias, etc.).
- Evaluar si algunos catálogos deberían migrarse a tablas Convex editables desde un panel administrativo.
- Incluir migraciones de datos históricos para rellenar `familyId`/`categoryId` a partir de `category` cuando sea posible (ver lógica de fallback en `edit-product`).

### Fase 3 – Administración & APIs externas
- Exponer un endpoint interno para consultar la taxonomía (útil para un panel web u otras integraciones).
- Construir herramientas para que operaciones/marketing puedan activar o desactivar categorías sin despliegue (ej. toggles basados en JSON almacenado en Convex).

## Buenas prácticas

- **IDs estables**: no cambies `familyId`/`categoryId` existentes. Si el texto visible cambia, ajusta solo el `label`.
- **Validación**: agrega nuevas opciones en `options.ts` para asegurar que `select` y `multiselect` usen catálogos controlados.
- **Compatibilidad**: siempre que agregues una categoría nueva, considera cómo editarán publicaciones existentes (usa `edit-product` para mapear `product.category` legado a la nueva categoría si aplica).
- **Documentación**: actualiza este archivo cuando agregues familias/categorías o modifiques atributos importantes.

## Referencias rápidas

- Configuración estática: `apps/app/app/config/taxonomy.ts`
- Catálogos reutilizables: `apps/app/app/config/options.ts`
- Formularios (Expo): `app/create-post.tsx`, `app/edit-product/[id].tsx`
- Pantallas que usan filtros: `app/(tabs)/index.tsx`, `app/(tabs)/search.tsx`
- Convex schema/tablas: `apps/app/convex/schema/products.ts`
- Mutaciones/queries relevantes: `apps/app/convex/products.ts`, `apps/app/convex/search.ts`

Actualiza estas rutas si futuros refactors mueven archivos.

