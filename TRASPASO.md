# Traspaso: nueva web de Cocinas CMA (prototipo)

Documento para continuar el trabajo (persona o agente, p. ej. Claude Cowork). Resume qué se ha hecho, dónde está todo, qué decisiones se tomaron y qué falta.

## 1. Enlaces y estado (16/10/2026)

| Qué | Dónde |
| --- | --- |
| **Web publicada (prototipo)** | **https://atilavg.github.io/Web-CocinasCMA/** |
| Repositorio | https://github.com/AtilaVG/Web-CocinasCMA (público) |
| Rama de trabajo | `claude/gracious-pasteur-y5y3io` (ahora es la **rama principal** del repo) |
| Pull request | https://github.com/AtilaVG/Web-CocinasCMA/pull/1 (borrador, hacia `main`; CI en verde, sin conflictos) |
| `main` | Solo tiene un commit inicial vacío; se creó para poder abrir el PR |
| Lista para el cliente | [`PENDIENTE.md`](PENDIENTE.md) |
| Manual técnico | [`README.md`](README.md) |
| Web actual del cliente | https://www.cocinascma.com (de 2009, no responsive) |

La web se publica sola en GitHub Pages con cada push a la rama principal (workflow «Publicar en GitHub Pages»).

## 2. El encargo

- **Cliente:** Cocinas C.M.A. S.L., fábrica y tienda familiar de muebles de cocina en Humanes de Madrid, fundada en 1992 (constituida el 13/01/1993).
  - Tienda y exposición: Avda. de Fuenlabrada, 57, 28970 Humanes de Madrid (más de 700 m²).
  - Fábrica: Pol. Ind. Requena, Nave 56, 45214 Cedillo del Condado, Toledo (más de 2.000 m²).
  - Teléfonos: 91 604 93 82 · 91 604 06 56 (tienda) · 925 50 89 76 (fábrica). Correo: info@cocinascma.com.
  - Valoración: 4,5/5 en 155 opiniones de ProvenExpert.
- **Objetivo:** prototipo para enseñar al dueño en una reunión y presupuestar. El cliente **no quiere vender más ni tienda online**: quiere una web bonita, elegante y actual, a la altura de sus cocinas. Prioridad: estética, fotos grandes y sensación de calidad artesanal y fábrica propia. **Nada de tácticas agresivas de venta.**
- **Requisitos del usuario (quien encarga el prototipo), que hay que respetar:**
  - Sitio estático en GitHub Pages, 100 % responsive, accesible, rápido y con SEO local.
  - Español de España, textos revisados (son «más de 30 años», no 18).
  - Marca: azul marino `#003C6D` / `#020F3D` y rojo `#9D0008` (el rojo, con moderación) sobre una base clara y cálida.
  - Serif elegante para titulares y sans limpia para el texto.
  - **No hacer pasar fotos de banco de imágenes por trabajos del cliente.** Donde falte una foto, hueco «foto pendiente» claramente marcado.
  - **En los commits no poner a Claude como coautor ni líneas Co-Authored-By.** Los commits se han hecho como `AtilaVG <valorgonzalezalex@gmail.com>`. Un hook del entorno avisa de que salen como «Unverified»: es estético y se ha mantenido así a propósito.

## 3. Tecnología y estructura

- **Astro 7.3.8** (HTML estático, casi sin JS), CSS propio con variables, Node 22.
- Tipografías de Google Fonts **autoalojadas** con Fontsource: **Cormorant Garamond** (titulares) y **Jost** (texto). No hay peticiones a Google.
- Imágenes optimizadas por Astro (`astro:assets` + sharp): AVIF y WebP, varios tamaños, carga diferida.

```
src/config/empresa.ts      datos de la empresa (fuente única: teléfonos, direcciones, WhatsApp, horario, valoración, Formspree)
src/data/catalogo.ts       estilos y acabados (slugs de los filtros) y textos de materiales
src/data/fotos.ts          huecos de foto de cada página + tira de la exposición
src/data/fotos-web-actual.json   inventario de las fotos importadas (galería, alts, avisos, destacados)
src/data/proyectos.ts      galería y selección de portada (lee el JSON)
src/components/            cabecera, pie, Foto/FotoPendiente, valoración, visita, etc.
src/layouts/               Base (SEO, Open Graph, JSON-LD) y Legal
src/pages/                 index, nosotros, fabrica, proyectos, exposicion, contacto, aviso-legal, privacidad, cookies, 404, robots.txt
src/scripts/               sitio.ts (menú, animaciones), galeria.ts (filtros + visor), contacto.ts (formulario + mapa)
src/styles/global.css      sistema de diseño
scripts/importar-web-actual.mjs   importador de fotos y textos de cocinascma.com
referencias/web-actual/    textos de cada página de la web antigua + informe de la importación
.github/workflows/         deploy.yml (Pages) e importar-fotos.yml (importador)
```

Comandos: `npm ci`, `npm run dev` (http://localhost:4321), `npm run build`, `npm run check`, `npm run fotos`.

## 4. Páginas

1. **Inicio:**
   - foto a sangre con el lema «Cocinas a medida, fabricadas por nosotros desde 1992»;
   - presentación y 3 pilares (fabricación propia · diseño a medida · 700 m² de exposición);
   - selección de 5 trabajos;
   - bloque de fábrica con cifras;
   - valoración 4,5/5 (155 opiniones);
   - invitación a visitar la exposición.
2. **Nosotros:**
   - historia de la empresa familiar (varias generaciones de carpinteros);
   - línea del tiempo (los años de fábrica y tienda, pendientes);
   - valores y «Cómo trabajamos» en 4 pasos.
3. **Fábrica:** Cedillo del Condado, por qué tener fábrica propia, proceso en 6 pasos y «Dónde está».
4. **Proyectos:**
   - galería con las 47 cocinas del catálogo de la web actual;
   - filtros por estilo (Últimos trabajos, Actual, Moderno, Rústico, Encimeras, Impresión digital) y por acabado;
   - filtros compartibles en la URL (`?estilo=…&acabado=…`);
   - visor accesible (teclado, gestos, foco, Esc).
5. **Exposición:**
   - qué hay en la tienda y tira «Un paseo por la exposición» con las fotos actuales de la tienda;
   - 12 materiales y acabados (muestras de color hechas con CSS, orientativas);
   - cómo llegar, con la fachada.
6. **Contacto:**
   - teléfonos clicables, WhatsApp, correo y horario (de ejemplo);
   - formulario: mailto por defecto, Formspree si se configura;
   - mapa de Google que solo se carga al pulsar el botón, por las cookies.
7. **Legales:** aviso legal, privacidad y cookies (plantillas provisionales con los datos pendientes marcados), y página 404.

Todo dato sin confirmar se ve con una etiqueta discontinua **«pendiente»**. Las fotos pequeñas usadas a sangre llevan **«Foto provisional · N px»** y las dudosas, **«Foto por confirmar»**.

## 5. Fotos: origen y decisiones

**El entorno donde se hizo el trabajo no tenía acceso a cocinascma.com** (proxy). Por eso las fotos se importan desde GitHub Actions con el workflow «Importar fotos de la web actual». Sus modos:

- **Importación normal:** descarga las fotos al repo y vuelve a publicar.
- **Diagnóstico:** el campo `diagnostico` muestra el HTML de una página en el log.
- **Reclasificar:** `npm run fotos -- --reclasificar` recalcula la clasificación sin red.

**Inventario de la web actual** (57 imágenes guardadas en `src/assets/fotos/web-actual/`):
- **47 cocinas del catálogo** («Exposición virtual»): todas en la galería. Estilo y acabado salen de la etiqueta de la web antigua (p. ej. «Moderno-Polilaminado con gola»).
- **Banners** `fab-ban` (fábrica: escuadradora y canteadora) y `tienda-ban` (exposición), de 670×131: se usan sin ampliar en Fábrica y Exposición.
- **Miniaturas de 300×120:** `cocina1–5` (tienda) van en la tira de Exposición, `cocina7` (nave con el rótulo «Cocinas C.M.A.») en Fábrica y `cocina8` (fachada de la tienda) en Exposición.
- **Las fichas «Detallar» de la web antigua están rotas** (devuelven una plantilla genérica), así que no hay fotos extra por cocina.

**Decisiones (todas en `PENDIENTE.md` para confirmar con el cliente):**
- **«Moderno-Luxe» (`gr-721925123`):** parece foto de catálogo del fabricante. Está en la galería con la etiqueta «Foto por confirmar», visible también en el visor.
- **Dos cocinas fotografiadas con los plásticos de obra:** están en la galería; conviene pedir las fotos terminadas.
- **`cocina6`:** **no se publica.** Tiene carteles de precio con QR y un distintivo «25» que parecen de otra cadena.
- **Fotos de la portada antigua** (`box-pic1–4`, `img5–7`): **de banco de imágenes, no se usan.** El importador ya no sube al repo las imágenes descartadas: quedan como artifact del workflow. `box-pic5` es un recorte de una cocina que ya está en la galería.
- **`cocina7`:** se da como la nave de la fábrica porque la web antigua la usaba en el bloque de fábrica. Lleva «Foto por confirmar».
- **Cabeceras de Fábrica y Nosotros y bloque de fábrica de la portada:** usan fotos reales de detalles y cocinas de madera, porque no hay fotos del taller con calidad suficiente.
- **Único hueco «Foto pendiente»:** **el equipo**, en Nosotros. No hay ninguna foto del equipo.
- **Selección de portada y textos alternativos:** la portada se elige con `"destacado": 1…5` en el JSON. Los alt están escritos describiendo lo que se ve; se revisaron foto a foto para no inventar materiales ni lugares.

## 6. Diseño

- **Paleta** (en `global.css`):
  - tinta `#020f3d`, marino `#003c6d` y rojo `#9d0008` (solo en acentos: guiones, números, cursivas);
  - papel `#f8f5ef`, piedra clara `#f1ece3`, piedra `#e5ddd0` y madera `#77573a`.
- Titulares serif grandes, mucho aire, fotos a sangre, animaciones suaves al hacer scroll (respetan «reducir movimiento»).
- Cabecera transparente sobre la foto en las páginas con cabecera de foto; se vuelve opaca al bajar. Lleva un degradado y sombra de texto para leerse sobre fotos claras.
- **Logo:** de momento es texto («cocinas» fino en azul + «cma» en rojo). **Para el oficial basta con guardar el SVG como `src/assets/marca/logo.svg`** (y `logo-blanco.svg` para fondos oscuros); la web lo usa sola.

## 7. Calidad comprobada

- `astro check` sin errores.
- **axe-core** (WCAG 2.1 AA + buenas prácticas) sin incidencias en las 10 páginas, a 1440 y 390 px.
- Sin desplazamiento horizontal a 320 px. Galería y visor probados con Playwright: filtros, URL, teclado, foco y Esc.
- **Revisión con varios agentes** (completitud de fotos, honestidad de los alt, código y maquetación): 31 hallazgos, verificados uno a uno y corregidos en el commit `5d35b0f`.
- **SEO local:**
  - title y description por página, canonical y Open Graph (imagen `public/og-cocinascma.png`);
  - JSON-LD `HomeAndConstructionBusiness` de la tienda y la fábrica, con zona de servicio Humanes, Fuenlabrada, Leganés, Móstoles y sur de Madrid (como la web actual).
- **`noindex` mientras sea prototipo.** Para la web definitiva: `INDEXAR=true` en el build, que activa robots.txt y el sitemap.

## 8. Publicación y ajustes del repositorio

- `deploy.yml` compila en cada push y PR, y **publica solo desde la rama principal del repo**.
- Si se fusiona el PR y se pasa a `main`:
  1. *Settings → Branches*: marcar `main` como rama principal.
  2. *Settings → Environments → github-pages*: permitir `main`.
- *Settings → Pages → Source* debe estar en **GitHub Actions**. Si se pone «Deploy from a branch», GitHub lanza un build con Jekyll que falla con los `.astro`. Desde el último commit ya no aparece, así que parece corregido.
- **Dominio propio:** *Settings → Pages → Custom domain* y DNS del dominio. La ruta base se adapta sola.

## 9. Pendiente del cliente (resumen de `PENDIENTE.md`)

- **Marca:** logo vectorial (y versión en blanco).
- **Fotos:**
  - fotos originales en alta (mín. 2400 px) y valorar una sesión profesional (exposición, fábrica y 8–12 cocinas);
  - foto del equipo o la familia;
  - confirmar `cocina7`, «Luxe» y `cocina6`;
  - fotos terminadas de las dos cocinas con plásticos.
- **Datos:**
  - horario real;
  - número de WhatsApp (ahora apunta al fijo 91 604 93 82);
  - redes sociales;
  - enlace a ProvenExpert y permiso para mostrar 3 opiniones;
  - años de la fábrica y de la tienda;
  - nº de cocinas instaladas y tamaño del equipo;
  - marcas con las que trabajan;
  - validar los textos de los procesos;
  - descripción de Luxe y Alpicord;
  - Formica y Pek;
  - si siguen haciendo baños y armarios.
- **Legal y técnico:**
  - CIF, domicilio social y datos registrales (y revisión de los textos legales por un asesor);
  - dominio, hosting y correo;
  - Formspree;
  - si quieren estadísticas (implica aviso de cookies);
  - ficha de Google Business;
  - zonas de trabajo.

## 10. Siguientes pasos sugeridos

1. Reunión con el cliente: enseñar la web publicada y repasar `PENDIENTE.md`.
2. Con el material del cliente:
   - logo a `src/assets/marca/logo.svg`;
   - fotos nuevas a `src/assets/fotos/propias/`, con su ruta en `src/data/fotos.ts` (huecos) o en `propias` de `src/data/proyectos.ts` (galería);
   - datos en `src/config/empresa.ts`;
   - quitar las etiquetas «pendiente» que ya no apliquen.
3. Formulario: crear el formulario en Formspree y poner su ID en `empresa.formspreeId`.
4. Versión definitiva:
   - textos legales revisados;
   - `INDEXAR=true`;
   - dominio www.cocinascma.com;
   - fusionar el PR y publicar desde `main`.

## 11. Historial (commits principales)

- `1052296` Prototipo inicial (todas las páginas, sistema de diseño, importador, workflows).
- `2a88ce1`, `7abb913` Ajustes de móvil y de la portada.
- `1576060`, `e9fab6f` Primera importación de fotos y su uso en la web.
- `c1f943a` Unión con `main` (commit inicial vacío) para poder abrir el PR.
- `9a879d7` Modo diagnóstico del importador.
- `e74a6b3` Todas las fotos de la web actual (47 en la galería, banners, fachada, nave, tira).
- `5d35b0f` Revisión de fotos, legibilidad y código tras la revisión con varios agentes.
- `3272719`, `749b35c` Reimportación, y las imágenes descartadas pasan a artifact (no se suben al repo).
