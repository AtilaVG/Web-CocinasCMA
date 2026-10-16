#!/usr/bin/env node
/**
 * Importa las fotos y los textos de la web actual (cocinascma.com) al repo.
 *
 *   npm run fotos                       # rastrea www.cocinascma.com
 *   npm run fotos -- --origen URL       # otro origen (p. ej. una copia local para pruebas)
 *   npm run fotos -- --max-paginas 50
 *   npm run fotos -- --reclasificar     # sin descargar: recalcula estilo, acabado y
 *                                       # título a partir del contexto guardado
 *   npm run fotos -- --diagnostico URL[,URL…]
 *                                       # muestra el HTML que recibe el importador
 *                                       # (para ajustar el rastreo; no guarda nada)
 *
 * Qué hace:
 *  1. Recorre las páginas del sitio (enlaces, marcos y menús en JavaScript).
 *  2. Localiza las fotos de /imagenes_cocinas/ (y de /images/) junto con su
 *     contexto: título, alt, grupo del lightbox, encabezado y texto cercano.
 *  3. De cada foto descarga la versión más grande disponible (la miniatura
 *     "pq_" solo si no hay otra) y descarta duplicados.
 *  4. Deduce estilo y acabado (sobre todo de la etiqueta «Estilo-Acabado»
 *     que la web antigua pone a cada foto) y escribe
 *     src/data/fotos-web-actual.json, que alimenta la galería. Si el archivo
 *     ya existía, respeta lo que se haya corregido a mano.
 *  5. Guarda el texto de cada página en referencias/web-actual/ para poder
 *     revisar los contenidos.
 *
 * Las fotos de /images/ (cabeceras y banners de la web antigua) se descargan
 * pero NO se publican en la galería: pueden ser de banco de imágenes y hay
 * que confirmarlas con el cliente.
 */

import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR_FOTOS = path.join(RAIZ, 'src/assets/fotos/web-actual');
const DIR_REF = path.join(RAIZ, 'referencias/web-actual');
const MANIFIESTO = path.join(RAIZ, 'src/data/fotos-web-actual.json');

const args = leerArgumentos(process.argv.slice(2));
const ORIGENES = args.origen
  ? [args.origen]
  : ['https://www.cocinascma.com/', 'https://cocinascma.com/', 'http://www.cocinascma.com/', 'http://cocinascma.com/'];
const MAX_PAGINAS = Number(args['max-paginas'] ?? 150);
const UA = 'Mozilla/5.0 (compatible; CocinasCMA-importador/1.0; +https://github.com/)';

const EXT_PAGINA = /(\/|\.php|\.html?|\.aspx?|\.jsp|\.cfm)$/i;
const EXT_IMAGEN = /\.(jpe?g|png)$/i;
const RECURSO_UI = /(^|[\/_-])(logo|bot(on|o)?|btn|fondo|bg|flecha|icono?|spacer|blank|linea|sombra|menu|cabecera|pie|degradado|transparen|loading|close|next|prev|lightbox|arrow|bullet|esquina|borde|separador|marco|lupa|ampliar)([\/_.\d-]|$)/i;

// ---------------------------------------------------------------------------

const informe = { paginas: [], fallos: [], fotos: 0, descartadas: [], paraRevisar: [], sondeosFallidos: [] };
const cacheImagenes = new Map();

let origen;
let HOSTS;

async function main() {
  if (args.reclasificar) return reclasificar();
  if (args.diagnostico) return diagnostico(String(args.diagnostico).split(',').map((u) => u.trim()).filter(Boolean));

  origen = await elegirOrigen();
  if (!origen) {
    console.error('✖ No se ha podido acceder a la web actual desde ninguno de estos orígenes:\n  ' + ORIGENES.join('\n  '));
    process.exit(1);
  }
  HOSTS = new Set([origen.host, origen.host.replace(/^www\./, ''), 'www.' + origen.host.replace(/^www\./, '')]);
  console.log(`→ Rastreando ${origen.href}`);

  const paginas = await rastrear(origen);
  console.log(`→ ${paginas.length} páginas leídas`);

  // Agrupar referencias de imagen por foto (miniatura + grande = misma foto)
  const grupos = new Map();
  for (const pagina of paginas) {
    for (const ref of pagina.imagenes) {
      const u = new URL(ref.url);
      if (!HOSTS.has(u.host) || !EXT_IMAGEN.test(u.pathname)) continue;
      const clave = claveFoto(u);
      if (!grupos.has(clave)) grupos.set(clave, { clave, urls: new Set(), contextos: [], paginas: new Set() });
      const g = grupos.get(clave);
      g.urls.add(u.href);
      g.paginas.add(pagina.url);
      g.contextos.push({ ...ref.contexto, pagina: pagina.titulo, encabezadoPagina: pagina.h1, urlPagina: pagina.url });
    }
  }

  // Sondeo de nombres conocidos (cocina1.jpg … cocina10.jpg)
  for (let n = 1; n <= 10; n++) {
    for (const dir of ['imagenes_cocinas', 'images']) {
      const u = new URL(`/${dir}/cocina${n}.jpg`, origen);
      const clave = claveFoto(u);
      if (!grupos.has(clave)) grupos.set(clave, { clave, urls: new Set([u.href]), contextos: [], paginas: new Set(), sondeo: true });
    }
  }

  // Descargar la mejor versión de cada foto
  await rm(DIR_FOTOS, { recursive: true, force: true });
  await mkdir(DIR_FOTOS, { recursive: true });
  const anterior = await leerManifiestoAnterior();
  const vistos = new Map(); // hash → id
  const fotos = [];

  for (const g of grupos.values()) {
    const candidatos = new Set(g.urls);
    for (const u of g.urls) for (const alt of variantesGrandes(new URL(u))) candidatos.add(alt.href);

    let mejor = null;
    for (const c of candidatos) {
      const img = await descargarImagen(c);
      if (img && (!mejor || img.ancho * img.alto > mejor.ancho * mejor.alto)) mejor = { ...img, url: c };
    }
    if (!mejor) {
      if (g.sondeo) informe.sondeosFallidos.push(g.clave);
      else informe.descartadas.push(`${g.clave}: no se pudo descargar`);
      continue;
    }

    const enCocinas = /\/imagenes_cocinas\//i.test(new URL(mejor.url).pathname);
    const lado = Math.max(mejor.ancho, mejor.alto);
    const nombre = path.basename(new URL(mejor.url).pathname);
    if (!enCocinas && RECURSO_UI.test(nombre)) {
      informe.descartadas.push(`${mejor.url}: elemento de la interfaz (${mejor.ancho}×${mejor.alto})`);
      continue;
    }
    // Las pequeñas no van a la web, pero se guardan en referencias/ para revisarlas a mano
    if (lado < (enCocinas ? 150 : 300)) {
      informe.descartadas.push(`${mejor.url}: demasiado pequeña (${mejor.ancho}×${mejor.alto}), guardada en referencias/web-actual/descartadas/`);
      informe.paraRevisar.push({ nombre: nombreArchivo(nombre, mejor.formato), buffer: mejor.buffer });
      continue;
    }

    const hash = createHash('sha1').update(mejor.buffer).digest('hex');
    if (vistos.has(hash)) {
      informe.descartadas.push(`${mejor.url}: duplicada de ${vistos.get(hash)}`);
      continue;
    }

    const carpeta = enCocinas ? 'imagenes_cocinas' : 'images';
    const archivo = `${carpeta}/${nombreArchivo(nombre, mejor.formato)}`;
    const id = slug(path.basename(archivo, path.extname(archivo)).replace(/^(pq|gr|th|mini)_/i, ''));
    vistos.set(hash, id);

    await mkdir(path.join(DIR_FOTOS, carpeta), { recursive: true });
    await writeFile(path.join(DIR_FOTOS, archivo), mejor.buffer);

    const camposContexto = (c) => [c.grupo, c.titulo, c.alt, c.encabezado, c.textoCercano, c.pagina, c.encabezadoPagina, c.urlPagina];
    const textos = g.contextos.flatMap(camposContexto);
    // Se clasifica con los contextos más fiables (enlaces de lightbox, <img>);
    // las rutas sueltas en scripts solo cuentan si no hay otra cosa.
    const fuertes = g.contextos.filter((c) => (c.fuerza ?? 1) >= 2);
    const clasificacion = clasificarFoto((fuertes.length ? fuertes : g.contextos).map(camposContexto), nombre);
    const estilos = clasificacion.estilos;
    const acabados = clasificacion.acabados;
    const titulo = clasificacion.titulo || tituloDesde(g.contextos);
    const previo = anterior.get(claveFoto(new URL(mejor.url)));

    fotos.push({
      id: idUnico(id, fotos),
      archivo: `web-actual/${archivo}`,
      origen: mejor.url,
      miniatura: [...g.urls].find((u) => u !== mejor.url) ?? null,
      ancho: mejor.ancho,
      alto: mejor.alto,
      paginas: [...g.paginas],
      contexto: [...new Set(textos.filter(Boolean).map((t) => limpiar(t)).filter((t) => t && t.length < 160))].slice(0, 12),
      estilos: previo?.estilos ?? (enCocinas ? estilos : []),
      acabados: previo?.acabados ?? acabados,
      titulo: previo?.titulo ?? titulo,
      alt: previo?.alt ?? '',
      galeria: previo?.galeria ?? (enCocinas && estilos.length > 0),
      destacado: previo?.destacado ?? false,
      ...(previo?.aviso ? { aviso: previo.aviso } : {}),
      nota: previo?.nota ?? (enCocinas ? '' : 'De /images/ (web antigua): confirmar con el cliente que es un trabajo suyo antes de usarla.'),
    });
  }

  fotos.sort((a, b) => a.archivo.localeCompare(b.archivo, 'es', { numeric: true }));
  informe.fotos = fotos.length;

  await writeFile(
    MANIFIESTO,
    JSON.stringify({ generado: new Date().toISOString(), origen: origen.href, fotos }, null, 2) + '\n',
  );
  await guardarReferencias(paginas);

  console.log(`✔ ${fotos.length} fotos guardadas en src/assets/fotos/web-actual/`);
  console.log(`  ${fotos.filter((f) => f.galeria).length} irán a la galería; revisa src/data/fotos-web-actual.json`);
  if (informe.descartadas.length) console.log(`  ${informe.descartadas.length} descartadas (ver referencias/web-actual/informe.md)`);
}

// ---------------------------------------------------------------------------
// Rastreo
// ---------------------------------------------------------------------------

async function elegirOrigen() {
  for (const o of ORIGENES) {
    try {
      const res = await pedir(o);
      if (res.ok && /html/i.test(res.headers.get('content-type') ?? 'text/html')) return new URL(res.url || o);
    } catch (e) {
      console.warn(`  · ${o}: ${e.cause?.code ?? e.message}`);
    }
  }
  return null;
}

async function rastrear(inicio) {
  const cola = [inicio.href];
  const visitadas = new Set();
  const resultado = [];

  while (cola.length && resultado.length < MAX_PAGINAS) {
    const actual = cola.shift();
    const clave = normalizarPagina(actual);
    if (visitadas.has(clave)) continue;
    visitadas.add(clave);

    let html;
    try {
      const res = await pedir(actual);
      if (!res.ok || !/html|text\/plain/i.test(res.headers.get('content-type') ?? 'text/html')) {
        if (!res.ok) informe.fallos.push(`${actual}: HTTP ${res.status}`);
        continue;
      }
      html = decodificar(Buffer.from(await res.arrayBuffer()), res.headers.get('content-type'));
    } catch (e) {
      informe.fallos.push(`${actual}: ${e.cause?.code ?? e.message}`);
      continue;
    }

    const pagina = analizarPagina(html, actual);
    resultado.push(pagina);
    informe.paginas.push(`${actual} — ${pagina.titulo}`);

    for (const enlace of pagina.enlaces) {
      let u;
      try {
        u = new URL(enlace, pagina.base);
      } catch {
        continue;
      }
      u.hash = '';
      if (!HOSTS.has(u.host) || !/^https?:$/.test(u.protocol)) continue;
      const ruta = u.pathname;
      const esPagina = EXT_PAGINA.test(ruta) || !/\.[a-z0-9]{2,5}$/i.test(ruta);
      if (!esPagina) continue;
      if (/\/(admin|wp-admin|cgi-bin|login|stats?)\b/i.test(ruta)) continue;
      if (!visitadas.has(normalizarPagina(u.href))) cola.push(u.href);
    }
  }
  return resultado;
}

function analizarPagina(html, url) {
  const baseTag = /<base\b[^>]*href\s*=\s*["']([^"']+)["']/i.exec(html)?.[1];
  const base = baseTag ? new URL(baseTag, url).href : url;
  const titulo = textoPlano(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '');
  const h1 = textoPlano(/<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1] ?? '');

  // Comentarios, scripts y estilos se sustituyen por espacios para conservar las posiciones
  const enBlanco = (m) => ' '.repeat(m.length);
  const sinComentarios = html.replace(/<!--[\s\S]*?-->/g, enBlanco);
  const sinScripts = sinComentarios.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, enBlanco);
  const enlaces = new Set();
  const imagenes = [];

  // Encabezados (y negritas cortas) con su posición, para dar contexto a cada foto
  const encabezados = [];
  for (const m of sinScripts.matchAll(/<(h[1-6]|strong|b|span[^>]*class=["'][^"']*(?:titulo|title)[^"']*["'])[^>]*>([\s\S]{1,200}?)<\/(?:h[1-6]|strong|b|span)>/gi)) {
    const t = textoPlano(m[2]);
    if (t && t.length < 80) encabezados.push({ pos: m.index, texto: t });
  }
  const encabezadoAntes = (pos) => {
    let ultimo = '';
    for (const e of encabezados) {
      if (e.pos > pos) break;
      ultimo = e.texto;
    }
    return ultimo;
  };
  const textoDespues = (pos) => textoPlano(sinScripts.slice(pos, pos + 600).replace(/^<[^>]*>/, '').split(/<img\b|<\/td>|<\/li>|<\/div>/i)[0]).slice(0, 140);

  // Enlaces <a>, <area>, marcos y redirecciones en JS
  for (const m of sinScripts.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const at = atributos(m[1]);
    const interior = m[2];
    if (!at.href) continue;
    const href = at.href.trim();
    if (/^(mailto|tel|javascript):/i.test(href)) {
      for (const j of href.matchAll(/['"]([^'"]+\.(?:php|html?|aspx?)(?:\?[^'"]*)?)['"]/gi)) enlaces.add(j[1]);
      continue;
    }
    const img = /<img\b([^>]*)>/i.exec(interior);
    const atImg = img ? atributos(img[1]) : {};
    if (EXT_IMAGEN.test(href.split('?')[0])) {
      imagenes.push({
        url: absoluta(href, base),
        contexto: {
          fuerza: 3,
          titulo: at.title ?? at['data-title'] ?? '',
          grupo: (at.rel ?? '').replace(/^lightbox\[?|\]$/gi, '') || at['data-lightbox'] || at['data-fancybox'] || '',
          alt: atImg.alt ?? atImg.title ?? '',
          encabezado: encabezadoAntes(m.index),
          textoCercano: textoPlano(interior) || textoDespues(m.index + m[0].length),
        },
      });
    } else {
      enlaces.add(href);
    }
    if (img?.length && atImg.src) {
      imagenes.push({
        url: absoluta(atImg.src, base),
        contexto: {
          fuerza: 2,
          titulo: at.title ?? '',
          grupo: (at.rel ?? '').replace(/^lightbox\[?|\]$/gi, ''),
          alt: atImg.alt ?? '',
          encabezado: encabezadoAntes(m.index),
          textoCercano: textoDespues(m.index + m[0].length),
          enlaceA: EXT_IMAGEN.test(href.split('?')[0]) ? absoluta(href, base) : '',
        },
      });
    }
  }
  for (const m of sinScripts.matchAll(/<(?:area|frame|iframe)\b([^>]*)>/gi)) {
    const at = atributos(m[1]);
    if (at.href) enlaces.add(at.href);
    if (at.src) enlaces.add(at.src);
  }
  for (const m of sinComentarios.matchAll(/(?:location(?:\.href)?|window\.open)\s*(?:=|\()\s*['"]([^'"]+)['"]/gi)) enlaces.add(m[1]);
  for (const m of sinScripts.matchAll(/<option\b[^>]*value=["']([^"']+\.(?:php|html?)[^"']*)["']/gi)) enlaces.add(m[1]);

  // <img> sueltas
  for (const m of sinScripts.matchAll(/<img\b([^>]*)>/gi)) {
    const at = atributos(m[1]);
    if (!at.src) continue;
    imagenes.push({
      url: absoluta(at.src, base),
      contexto: {
        fuerza: 2,
        alt: at.alt ?? '',
        titulo: at.title ?? '',
        encabezado: encabezadoAntes(m.index),
        textoCercano: textoDespues(m.index + m[0].length),
      },
    });
  }
  // Rutas de imagen en scripts, estilos y atributos background
  for (const m of sinComentarios.matchAll(/["'(]\s*([^"'()\s]+\.(?:jpe?g|png))\s*["')]/gi)) {
    imagenes.push({ url: absoluta(m[1], base), contexto: { fuerza: 1, encabezado: encabezadoAntes(m.index) } });
  }

  return {
    url,
    base,
    titulo,
    h1,
    enlaces: [...enlaces],
    imagenes: imagenes.filter((i) => i.url),
    texto: textoPagina(html),
  };
}

// ---------------------------------------------------------------------------
// Descargas
// ---------------------------------------------------------------------------

async function pedir(url, intentos = 2) {
  for (let i = 0; ; i++) {
    try {
      return await fetch(url, {
        headers: { 'User-Agent': UA, Accept: '*/*' },
        redirect: 'follow',
        signal: AbortSignal.timeout(25_000),
      });
    } catch (e) {
      if (i >= intentos) throw e;
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
}

async function descargarImagen(url) {
  if (cacheImagenes.has(url)) return cacheImagenes.get(url);
  let resultado = null;
  try {
    const res = await pedir(url, 1);
    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      const meta = await sharp(buffer).metadata();
      if (meta.width && meta.height && ['jpeg', 'png', 'webp'].includes(meta.format)) {
        resultado = { buffer, ancho: meta.width, alto: meta.height, formato: meta.format };
      }
    }
  } catch {
    /* no es una imagen válida o no existe */
  }
  cacheImagenes.set(url, resultado);
  return resultado;
}

/** Posibles versiones grandes de una miniatura (pq_x.jpg → x.jpg, gr_x.jpg…). */
function variantesGrandes(u) {
  const dir = u.pathname.replace(/[^/]*$/, '');
  const nombre = path.posix.basename(u.pathname);
  const sinPrefijo = nombre.replace(/^(pq|th|mini|peq)_/i, '');
  const sinSufijo = sinPrefijo.replace(/_?(pq|peq|th|mini)(\.\w+)$/i, '$2');
  const nombres = new Set([sinSufijo, `gr_${sinSufijo}`, `g_${sinSufijo}`, `grande_${sinSufijo}`]);
  if (sinSufijo !== nombre) nombres.add(sinSufijo.replace(/\.jpe?g$/i, '.JPG'));
  return [...nombres].filter((n) => n !== nombre).map((n) => new URL(dir + n, u));
}

function claveFoto(u) {
  const dir = u.pathname.replace(/[^/]*$/, '').toLowerCase();
  const nombre = path.posix
    .basename(u.pathname)
    .toLowerCase()
    .replace(/^(pq|gr|g|grande|th|mini|peq)_/, '')
    .replace(/_(pq|peq|th|gr)(\.\w+)$/, '$2')
    .replace(/_?mini(\.\w+)$/, '$1')
    .replace(/\.jpeg$/, '.jpg');
  return dir + nombre;
}

// ---------------------------------------------------------------------------
// Clasificación
// ---------------------------------------------------------------------------

const ORDEN_ESTILOS = ['moderno', 'actual', 'rustico', 'ultimos-trabajos', 'encimeras', 'impresion-aluminio'];

/** Categorías de la «Exposición virtual» de la web antigua (antes del guion en cada foto). */
const CATEGORIAS = [
  [/^(a\.?\s*)?ultimos\s+trabajos$/, 'ultimos-trabajos'],
  [/^actual(es)?$/, 'actual'],
  [/^modern[oa]s?$/, 'moderno'],
  [/^rustic[oa]s?$/, 'rustico'],
  [/^encimeras?$/, 'encimeras'],
  [/^impresion(es)?\s+digital(es)?\.?$/, 'impresion-aluminio'],
];

const NOMBRES_PROPIOS = ['Matrix', 'Alpicord', 'Neolith', 'Luxe'];
const CORRECCIONES = [
  [/estractificado/gi, 'estratificado'],
  [/coleccion/gi, 'colección'],
  [/acrilico/gi, 'acrílico'],
  [/perfileria/gi, 'perfilería'],
  ...NOMBRES_PROPIOS.map((n) => [new RegExp(`\\b${n}\\b`, 'gi'), n]),
];

/** Lee etiquetas como «Moderno-Polilaminado con gola» o «A. Ultimos trabajos-Laca brillo». */
function etiquetaCatalogo(texto) {
  const m = /^(.{3,40}?)\s*-\s*(.{3,60}?)(\s+detallar)?$/i.exec(limpiar(texto ?? ''));
  if (!m) return null;
  const categoria = normalizar(m[1]);
  const encontrada = CATEGORIAS.find(([re]) => re.test(categoria));
  if (!encontrada) return null;
  let acabado = limpiar(m[2]).replace(/[.\s]+$/, '');
  for (const [re, valor] of CORRECCIONES) acabado = acabado.replace(re, valor);
  if (acabado === 'Luxe') acabado = 'colección Luxe';
  if (!NOMBRES_PROPIOS.some((n) => acabado.startsWith(n))) acabado = acabado.charAt(0).toLowerCase() + acabado.slice(1);
  return { estilo: encontrada[1], acabado };
}

function tituloProyecto(estilo, acabado) {
  if (estilo === 'encimeras') return `Encimera ${acabado}`;
  if (estilo === 'impresion-aluminio') return acabado.charAt(0).toUpperCase() + acabado.slice(1);
  const base = { 'ultimos-trabajos': 'Cocina', actual: 'Cocina actual', moderno: 'Cocina moderna', rustico: 'Cocina rústica' }[estilo];
  return /^colecci/.test(acabado) ? `${base}, ${acabado}` : `${base} en ${acabado}`;
}

/**
 * Clasifica una foto. `grupos` tiene una lista de textos por cada lugar donde
 * aparece la foto. Manda la etiqueta del catálogo antiguo; si no la hay, se
 * buscan palabras clave en todo el contexto.
 */
function clasificarFoto(grupos, nombre = '') {
  for (const texto of grupos.flat()) {
    const etiqueta = etiquetaCatalogo(texto);
    if (etiqueta) {
      const acabados = clasificar([etiqueta.acabado]).acabados;
      if (etiqueta.estilo === 'impresion-aluminio') {
        return {
          estilos: [etiqueta.estilo],
          acabados: ['impresion-digital', ...acabados.filter((a) => a !== 'impresion-digital')],
          titulo: `Impresión digital con ${etiqueta.acabado}`,
        };
      }
      return { estilos: [etiqueta.estilo], acabados, titulo: tituloProyecto(etiqueta.estilo, etiqueta.acabado) };
    }
  }
  const estilos = new Set();
  const acabados = new Set();
  const nombreLimpio = nombre.replace(/\.\w+$/, '').replace(/^(pq|gr|th|mini)_/i, '').replace(/[_-]/g, ' ');
  for (const textos of [...grupos, [nombreLimpio]]) {
    const r = clasificar(textos);
    r.estilos.forEach((e) => estilos.add(e));
    r.acabados.forEach((a) => acabados.add(a));
  }
  return { estilos: ORDEN_ESTILOS.filter((e) => estilos.has(e)), acabados: [...acabados], titulo: '' };
}

/** Vuelca el HTML de unas páginas tal como lo recibe el importador (solo lectura). */
async function diagnostico(entradas) {
  const LIMITE = 60_000;
  const urls = entradas.filter((e) => e && e !== 'true');
  if (!urls.length) {
    console.error('Uso: npm run fotos -- --diagnostico URL[,URL…]  (p. ej. /exposicion-virtual.php o cocinascma.com/fabrica.php)');
    process.exitCode = 1;
    return;
  }
  for (const entrada of urls) {
    // Admite URL completas, dominios sin protocolo y rutas relativas a la web actual
    const url = /^https?:\/\//i.test(entrada)
      ? entrada
      : entrada.startsWith('/')
        ? new URL(entrada, ORIGENES[0]).href
        : `https://${entrada}`;
    console.log(`\n===== ${url}`);
    try {
      const res = await pedir(url);
      const buffer = Buffer.from(await res.arrayBuffer());
      const html = decodificar(buffer, res.headers.get('content-type'));
      console.log(`HTTP ${res.status} · ${res.headers.get('content-type')} · ${buffer.length} bytes · final: ${res.url}`);
      const pagina = analizarPagina(html, res.url || url);
      console.log(`Enlaces detectados: ${pagina.enlaces.length} · imágenes detectadas: ${pagina.imagenes.length}`);
      console.log(html.length > LIMITE ? html.slice(0, LIMITE) + `\n[… ${html.length - LIMITE} caracteres más]` : html);
    } catch (e) {
      console.log(`ERROR: ${e.cause?.code ?? e.message}`);
      process.exitCode = 1;
    }
  }
}

/** Recalcula la clasificación del manifiesto con el contexto ya guardado (sin red). */
async function reclasificar() {
  const datos = JSON.parse(await readFile(MANIFIESTO, 'utf8'));
  for (const foto of datos.fotos) {
    if (!/\/imagenes_cocinas\//.test(foto.archivo)) continue;
    const r = clasificarFoto([foto.contexto ?? []], path.basename(foto.archivo));
    foto.estilos = r.estilos;
    foto.acabados = r.acabados;
    if (r.titulo) foto.titulo = r.titulo;
  }
  await writeFile(MANIFIESTO, JSON.stringify(datos, null, 2) + '\n');
  console.log(`✔ ${datos.fotos.length} fotos reclasificadas en src/data/fotos-web-actual.json`);
}

function clasificar(textos) {
  const t = normalizar(textos.filter(Boolean).join(' | '));
  const estilos = [];
  if (/\bultim[oa]s?\b/.test(t)) estilos.push('ultimos-trabajos');
  if (/rustic/.test(t)) estilos.push('rustico');
  if (/modern/.test(t)) estilos.push('moderno');
  if (/\bactual(es)?\b/.test(t)) estilos.push('actual');
  if (/encimera|neolith/.test(t)) estilos.push('encimeras');
  if (/impresion|perfileria/.test(t)) estilos.push('impresion-aluminio');

  const acabados = [];
  const si = (cond, slug) => cond && !acabados.includes(slug) && acabados.push(slug);
  si(/cristal/.test(t), 'cristal-gola');
  si(/laca\W{0,3}(alto\W)?brillo|lacad[ao]s?\W{0,3}brillo/.test(t), 'laca-brillo');
  si(/laca\W{0,3}textur|texturizad/.test(t), 'laca-texturizada');
  si(/\blac(a|ad[ao]s?)\b/.test(t) && !acabados.some((a) => a.startsWith('laca')), 'laca');
  si(/madera|roble|nogal|haya|cerezo/.test(t), 'madera');
  si(/estratificad|matrix/.test(t), 'estratificado');
  si(/polilaminad/.test(t), 'polilaminado');
  si(/(^|[^i])laminado\W{0,3}mate|\bmate\b/.test(t) && !/polilaminado\W{0,3}mate/.test(t), 'laminado-mate');
  si(/acrilic/.test(t), 'acrilico');
  si(/\bluxe\b/.test(t), 'luxe');
  si(/alpicord/.test(t), 'alpicord');
  si(/neolith/.test(t), 'neolith');
  si(/impresion\W{0,3}digital|impresiones/.test(t), 'impresion-digital');
  si(/aluminio|perfileria/.test(t), 'aluminio');
  return { estilos, acabados };
}

function tituloDesde(contextos) {
  for (const campo of ['titulo', 'alt', 'textoCercano']) {
    for (const c of contextos) {
      const t = limpiar(c[campo] ?? '');
      if (t && t.length >= 4 && t.length <= 70 && !/^(pq_|img|dsc|foto|imagen|cocina\d*)\b/i.test(t) && !/\.(jpe?g|png)$/i.test(t)) {
        return t.charAt(0).toUpperCase() + t.slice(1);
      }
    }
  }
  return '';
}

// ---------------------------------------------------------------------------
// Utilidades de texto y HTML
// ---------------------------------------------------------------------------

function decodificar(buffer, contentType) {
  const metaCharset =
    /charset\s*=\s*["']?([\w-]+)/i.exec(contentType ?? '')?.[1] ??
    /<meta[^>]+charset\s*=\s*["']?([\w-]+)/i.exec(buffer.toString('latin1'))?.[1];
  let texto;
  try {
    texto = new TextDecoder(metaCharset && !/utf-?8/i.test(metaCharset) ? metaCharset : 'utf-8', { fatal: true }).decode(buffer);
  } catch {
    texto = new TextDecoder('windows-1252').decode(buffer);
  }
  return arreglarMojibake(texto);
}

// Caracteres de Windows-1252 en el rango 0x80–0x9F, para deshacer el mojibake
const CP1252 = new Map(
  [...'\u20AC\u0081\u201A\u0192\u201E\u2026\u2020\u2021\u02C6\u2030\u0160\u2039\u0152\u008D\u017D\u008F\u0090\u2018\u2019\u201C\u201D\u2022\u2013\u2014\u02DC\u2122\u0161\u203A\u0153\u009D\u017E\u0178'].map(
    (c, i) => [c, 0x80 + i],
  ),
);
const RE_MOJIBAKE = new RegExp(`(?:[\u00C2\u00C3\u00C5\u00C6][\u0080-\u00BF${[...CP1252.keys()].join('')}])+`, 'g');

/** Corrige textos tipo "RÃºstico", "uÃ±ero" o "Ãšltimos" (UTF-8 leído como Latin-1 o Windows-1252). */
function arreglarMojibake(texto) {
  return texto.replace(RE_MOJIBAKE, (trozo) => {
    const bytes = Buffer.from([...trozo].map((c) => CP1252.get(c) ?? c.charCodeAt(0)));
    const reparado = bytes.toString('utf8');
    return reparado.includes('\uFFFD') ? trozo : reparado;
  });
}

function atributos(cadena) {
  const at = {};
  for (const m of cadena.matchAll(/([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    at[m[1].toLowerCase()] = entidades(m[3] ?? m[4] ?? m[5] ?? '');
  }
  return at;
}

function absoluta(ruta, base) {
  try {
    return new URL(ruta.trim().replace(/\\/g, '/'), base).href;
  } catch {
    return '';
  }
}

function textoPlano(html) {
  return limpiar(entidades(html.replace(/<[^>]+>/g, ' ')));
}

function textoPagina(html) {
  return entidades(
    html
      .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<(br|\/p|\/div|\/td|\/tr|\/li|\/h[1-6]|\/table)[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .split('\n')
    .map((l) => l.replace(/[ \t\u00A0]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

function entidades(s) {
  const nombradas = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', ntilde: 'ñ', Ntilde: 'Ñ', uuml: 'ü', ordm: 'º', ordf: 'ª', iexcl: '¡', iquest: '¿', euro: '€', copy: '©', reg: '®', middot: '·', ndash: '–', mdash: '—', laquo: '«', raquo: '»', sup2: '²' };
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&(\w+);/g, (m, n) => nombradas[n] ?? m);
}

function limpiar(s) {
  return arreglarMojibake(String(s)).replace(/\s+/g, ' ').trim();
}

function normalizar(s) {
  return limpiar(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function slug(s) {
  return normalizar(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'foto';
}

function nombreArchivo(nombre, formato) {
  const ext = formato === 'png' ? '.png' : formato === 'webp' ? '.webp' : '.jpg';
  return slug(nombre.replace(/\.\w+$/, '')) + ext;
}

function idUnico(id, lista) {
  let final = id;
  for (let i = 2; lista.some((f) => f.id === final); i++) final = `${id}-${i}`;
  return final;
}

function normalizarPagina(url) {
  const u = new URL(url);
  u.hash = '';
  u.host = u.host.replace(/^www\./, '');
  u.protocol = 'https:';
  if (/\/index\.(php|html?)$/i.test(u.pathname)) u.pathname = u.pathname.replace(/index\.\w+$/i, '');
  return u.href.toLowerCase();
}

function leerArgumentos(lista) {
  const r = {};
  for (let i = 0; i < lista.length; i++) {
    if (lista[i].startsWith('--')) {
      const arg = lista[i].slice(2);
      const igual = arg.indexOf('=');
      const k = igual < 0 ? arg : arg.slice(0, igual);
      const v = igual < 0 ? undefined : arg.slice(igual + 1);
      r[k] = v ?? (lista[i + 1] && !lista[i + 1].startsWith('--') ? lista[++i] : 'true');
    }
  }
  return r;
}

async function leerManifiestoAnterior() {
  try {
    const datos = JSON.parse(await readFile(MANIFIESTO, 'utf8'));
    // Clave sin protocolo ni host: así las correcciones a mano se conservan aunque
    // cambie el origen (www o no, http o https, o una copia local con --origen).
    return new Map((datos.fotos ?? []).map((f) => [claveFoto(new URL(f.origen)), f]));
  } catch {
    return new Map();
  }
}

async function guardarReferencias(paginas) {
  await rm(DIR_REF, { recursive: true, force: true });
  await mkdir(path.join(DIR_REF, 'paginas'), { recursive: true });
  for (const [i, p] of paginas.entries()) {
    const nombre = `${String(i + 1).padStart(2, '0')}-${slug(new URL(p.url).pathname + new URL(p.url).search).slice(0, 60) || 'inicio'}.txt`;
    await writeFile(path.join(DIR_REF, 'paginas', nombre), `${p.url}\n${p.titulo}\n${'='.repeat(60)}\n\n${p.texto}\n`);
  }
  if (informe.paraRevisar.length) {
    await mkdir(path.join(DIR_REF, 'descartadas'), { recursive: true });
    for (const d of informe.paraRevisar) await writeFile(path.join(DIR_REF, 'descartadas', d.nombre), d.buffer);
  }
  // Logo actual, como referencia (no se usa en la web)
  const logo = await descargarImagen(new URL('/images/logo.jpg', origen).href);
  if (logo) await writeFile(path.join(DIR_REF, 'logo-actual.jpg'), logo.buffer);

  const md = [
    '# Importación de la web actual',
    '',
    `- Origen: ${origen.href}`,
    `- Fecha: ${new Date().toISOString()}`,
    `- Páginas leídas: ${informe.paginas.length}`,
    `- Fotos guardadas: ${informe.fotos}`,
    '',
    '## Páginas',
    ...informe.paginas.map((p) => `- ${p}`),
    '',
    '## Fallos',
    ...(informe.fallos.length ? informe.fallos.map((f) => `- ${f}`) : ['- Ninguno']),
    '',
    '## Imágenes descartadas',
    ...(informe.descartadas.length ? informe.descartadas.map((f) => `- ${f}`) : ['- Ninguna']),
    '',
    '## Nombres probados que no existen',
    ...(informe.sondeosFallidos.length ? informe.sondeosFallidos.map((f) => `- ${f}`) : ['- Ninguno']),
    '',
  ].join('\n');
  await writeFile(path.join(DIR_REF, 'informe.md'), md);
}

await main();
