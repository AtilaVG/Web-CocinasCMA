# Cocinas CMA · nueva web (prototipo)

Prototipo de la nueva web de **Cocinas CMA**, fábrica y tienda familiar de muebles de cocina en Humanes de Madrid (desde 1992).
Web corporativa estática, sin tienda online: el peso está en el diseño, la fotografía y un contacto sencillo.

- **Tecnología:** [Astro](https://astro.build) (HTML estático, casi sin JavaScript), CSS propio, tipografías de Google Fonts autoalojadas (Cormorant Garamond + Jost).
- **Publicación:** GitHub Pages mediante GitHub Actions.
- **Pendiente de pedir al cliente:** ver [PENDIENTE.md](PENDIENTE.md).

## Páginas

| Ruta | Contenido |
| --- | --- |
| `/` | Portada: foto a sangre, 3 pilares, selección de trabajos, fábrica, opiniones (4,5/5 · 155), visita a la exposición |
| `/nosotros/` | Historia de la empresa familiar, línea del tiempo, valores, cómo trabajamos |
| `/fabrica/` | Fábrica de Cedillo del Condado (+2.000 m²) y el proceso en 6 pasos |
| `/proyectos/` | Galería filtrable por estilo y acabado, con visor de fotos (teclado, gestos, URL compartible `?estilo=…&acabado=…`) |
| `/exposicion/` | Tienda de Humanes (700 m²), materiales y acabados, cómo llegar |
| `/contacto/` | Teléfonos, WhatsApp, correo, horario, formulario y mapa de Google (se carga al pulsar) |
| `/aviso-legal/`, `/privacidad/`, `/cookies/` | Textos legales provisionales |

## Trabajar en local

Requisitos: **Node.js 22.12 o superior**.

```bash
npm ci            # instalar dependencias
npm run dev       # servidor de desarrollo → http://localhost:4321
npm run build     # compilar la web en dist/
npm run preview   # ver la versión compilada
```

## Dónde se cambia cada cosa

| Qué | Dónde |
| --- | --- |
| Teléfonos, direcciones, correo, WhatsApp, horario, valoración, redes, Formspree | `src/config/empresa.ts` |
| Estilos y acabados del catálogo (y sus textos) | `src/data/catalogo.ts` |
| Fotos fijas de cada página (portada, fábrica, exposición…) | `src/data/fotos.ts` |
| Fotos de la galería | `src/data/fotos-web-actual.json` y `src/data/proyectos.ts` |
| Colores, tipografías, espaciados | `src/styles/global.css` (variables al principio) |
| Menú | `src/data/navegacion.ts` |

Los datos que aún no están confirmados se muestran en la web con una etiqueta discontinua (**«pendiente»**) para que se vean en la reunión.

### Fotos

Ninguna foto de banco de imágenes se hace pasar por trabajo propio. Donde falta una foto se ve un hueco **«Foto pendiente»** que describe la foto que hace falta.

- **Fotos de la web actual.** Se importan con `npm run fotos` (o desde GitHub: *Actions → Importar fotos de la web actual → Run workflow*). El script recorre cocinascma.com, descarga la versión más grande de cada foto de `/imagenes_cocinas/`, deduce estilo y acabado por el contexto, guarda los textos de cada página en `referencias/web-actual/` y genera `src/data/fotos-web-actual.json`. En ese JSON se puede corregir a mano el estilo, los acabados, el título o el texto alternativo de cada foto, llevarla a la portada con `"destacado": 1…5` (posición en la rejilla), mostrar una etiqueta con `"aviso": "…"` o quitarla con `"galeria": false`; si se vuelve a importar (aunque sea desde otro origen), esas correcciones se respetan. Las fotos de `/images/` (cabeceras de la web antigua) nunca van a la galería: solo se usan en huecos concretos cuando se ha comprobado que son reales (los banners de la fábrica y de la exposición). Las imágenes demasiado pequeñas para la web se guardan en `referencias/web-actual/descartadas/` para revisarlas a mano (no se suben al repo; en GitHub quedan como artifact «imagenes-descartadas» de la ejecución del workflow). Para ver el HTML que recibe el importador: `npm run fotos -- --diagnostico /exposicion-virtual.php` (o el campo «diagnostico» del workflow).
- **Fotos nuevas del cliente.** Copiarlas en `src/assets/fotos/propias/` y escribir su ruta en el hueco correspondiente de `src/data/fotos.ts` (p. ej. `foto: 'propias/exposicion-general.jpg'`) o añadirlas a la galería en `propias` dentro de `src/data/proyectos.ts`.
- Astro las optimiza solo al compilar (AVIF/WebP, varios tamaños, carga diferida). Conviene entregarlas en JPG de alta calidad, mínimo 2400 px de ancho para las fotos a sangre.

### Logo

Ahora el logo es un texto provisional («cocinas» + «cma»). Cuando llegue el oficial en vectorial, basta con guardarlo como `src/assets/marca/logo.svg` (y, si hay versión en blanco para fondos oscuros, `src/assets/marca/logo-blanco.svg`). La web lo usa automáticamente.

### Formulario de contacto

Sin configurar, el formulario abre el programa de correo del visitante con el mensaje ya redactado. Para que envíe directamente: crear un formulario gratuito en [Formspree](https://formspree.io) apuntando a info@cocinascma.com y poner su ID en `formspreeId` (`src/config/empresa.ts`). Lleva validación accesible y un campo trampa antispam.

## Publicar en GitHub Pages

El workflow `.github/workflows/deploy.yml` compila la web en cada push y la publica **desde la rama principal** del repositorio.

1. **Una sola vez:** en GitHub, *Settings → Pages → Build and deployment → Source:* **GitHub Actions**.
2. Hacer push a la rama principal (o *Actions → Publicar en GitHub Pages → Run workflow*).
3. La web queda en `https://<usuario>.github.io/<repositorio>/` (para este repo: <https://atilavg.github.io/Web-CocinasCMA/>).

La ruta base la toma el workflow de la configuración de Pages, así que funciona igual si se cambia el nombre del repositorio o se añade un dominio propio.

### Web definitiva

Mientras sea prototipo, la web lleva `noindex` (para que Google no la indexe con contenido provisional ni compita con la web actual). Para la versión definitiva:

1. Añadir `INDEXAR: true` en el paso *Compilar* del workflow (activa la indexación, `robots.txt` y el `sitemap`).
2. Configurar el dominio (`www.cocinascma.com`) en *Settings → Pages → Custom domain* y en el DNS del dominio.
3. Revisar los textos legales con un asesor y quitar las etiquetas «pendiente».

## Calidad

- **Responsive** desde 320 px, sin desplazamiento horizontal.
- **Accesibilidad:** HTML semántico, contraste AA, textos alternativos, enlace para saltar al contenido, menú móvil y visor de fotos con `<dialog>` (foco atrapado, Esc), navegación completa con teclado y respeto de «reducir movimiento».
- **Rendimiento:** HTML estático, imágenes optimizadas con carga diferida, tipografías autoalojadas (sin peticiones a Google), mapa de Google solo bajo demanda.
- **SEO local:** título y descripción por página, URL canónica, Open Graph y datos estructurados `HomeAndConstructionBusiness` (tienda y fábrica) con dirección y teléfonos.

## Estructura

```
src/
  config/empresa.ts        datos de la empresa (fuente única)
  data/                    catálogo, fotos, proyectos, navegación
  assets/fotos/            fotos (web-actual/ importadas, propias/ nuevas)
  assets/marca/            logo oficial en SVG (cuando llegue)
  components/              cabecera, pie, foto/hueco, valoración, etc.
  layouts/                 plantilla base y legal
  pages/                   una página por archivo
  scripts/                 JS mínimo: menú, animaciones, galería, contacto
  styles/global.css        sistema de diseño
scripts/importar-web-actual.mjs   importador de fotos y textos
referencias/web-actual/           textos de la web antigua (tras importar)
```
