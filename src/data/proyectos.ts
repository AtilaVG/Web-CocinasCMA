import manifiesto from './fotos-web-actual.json';
import { nombreAcabado, type AcabadoSlug, type Estilo } from './catalogo';

/**
 * Proyectos de la galería.
 *
 * Salen de src/data/fotos-web-actual.json, que genera el importador
 * (`npm run fotos`) con las fotos de la web actual. Ahí se puede corregir a
 * mano el estilo, los acabados, el título o el texto alternativo de cada foto,
 * quitarla de la galería con "galeria": false o llevarla a la portada con
 * "destacado": 1…5 (posición en la rejilla). Las fotos nuevas que entregue
 * el cliente se añaden en `propias` (abajo).
 *
 * Si todavía no hay fotos, la galería muestra huecos "foto pendiente" con el
 * catálogo real de estilos y acabados.
 */

export interface Proyecto {
  id: string;
  titulo: string;
  /** El primero es el principal; una foto puede ser p. ej. "Moderno" y "Últimos trabajos". */
  estilos: Estilo[];
  acabados: AcabadoSlug[];
  /** Ruta dentro de src/assets/fotos/; vacío = foto pendiente. */
  foto?: string;
  alt: string;
  /** Posición en la selección de la portada (1 = la grande). */
  destacado?: number | boolean;
}

interface FotoImportada {
  id: string;
  archivo: string;
  estilos?: string[];
  acabados?: string[];
  titulo?: string;
  alt?: string;
  galeria?: boolean;
  destacado?: number | boolean;
}

const tituloPorEstilo: Record<Estilo, string> = {
  'ultimos-trabajos': 'Trabajo reciente',
  actual: 'Cocina actual',
  moderno: 'Cocina moderna',
  rustico: 'Cocina rústica',
  encimeras: 'Encimera',
  'impresion-aluminio': 'Impresión digital y aluminio',
};

const descripcionPorEstilo: Record<Estilo, string> = {
  'ultimos-trabajos': 'Cocina reciente fabricada por Cocinas CMA',
  actual: 'Cocina de estilo actual',
  moderno: 'Cocina moderna',
  rustico: 'Cocina rústica',
  encimeras: 'Detalle de encimera',
  'impresion-aluminio': 'Cocina con impresión digital y perfilería de aluminio',
};

/** Fotos nuevas del cliente (src/assets/fotos/propias/). Van delante de las importadas. */
const propias: Proyecto[] = [];

const importadas: Proyecto[] = (manifiesto.fotos as FotoImportada[])
  .filter((f) => f.galeria !== false && f.estilos?.length)
  .map((f) => {
    const estilos = f.estilos as Estilo[];
    const acabados = (f.acabados ?? []) as AcabadoSlug[];
    const titulo = f.titulo || (acabados[0] ? nombreAcabado(acabados[0]) : tituloPorEstilo[estilos[0]]);
    return {
      id: f.id,
      titulo,
      estilos,
      acabados,
      foto: f.archivo,
      alt: f.alt || f.titulo || describir(estilos[0], acabados),
      destacado: f.destacado,
    };
  })
  // Primero los últimos trabajos, luego moderno, actual, rústico…
  .map((p, i) => ({ p, i }))
  .sort((a, b) => ordenEstilo(a.p) - ordenEstilo(b.p) || a.i - b.i)
  .map(({ p }) => p);

const pendientes: Proyecto[] = (
  [
    ['ultimos-trabajos', ['cristal-gola'], 'Cocina con frentes de cristal y gola'],
    ['moderno', ['laca-brillo'], 'Cocina en laca brillo'],
    ['actual', ['laminado-mate'], 'Cocina en laminado mate'],
    ['rustico', ['madera'], 'Cocina rústica de madera'],
    ['moderno', ['acrilico'], 'Cocina en acrílico alto brillo'],
    ['actual', ['estratificado'], 'Cocina en estratificado Matrix'],
    ['ultimos-trabajos', ['laca-texturizada'], 'Cocina en laca texturizada'],
    ['actual', ['polilaminado'], 'Cocina en polilaminado'],
    ['rustico', ['madera'], 'Cocina de madera con uñero'],
    ['moderno', ['luxe'], 'Cocina de la colección Luxe'],
    ['ultimos-trabajos', ['alpicord', 'neolith'], 'Cocina Alpicord con encimera Neolith'],
    ['actual', ['impresion-digital', 'aluminio'], 'Cocina con impresión digital y aluminio'],
  ] as [Estilo, AcabadoSlug[], string][]
).map(([estilo, acabados, titulo], i) => ({
  id: `pendiente-${i + 1}`,
  titulo,
  estilos: [estilo],
  acabados,
  alt: titulo,
  destacado: i < 5,
}));

const reales = [...propias, ...importadas];

export const hayFotosReales = reales.length > 0;

export const proyectos: Proyecto[] = hayFotosReales ? reales : pendientes;

/** Selección para la portada: los marcados como destacados (en su orden) o, si no hay, los primeros. */
export const destacados: Proyecto[] = (() => {
  const posicion = (p: Proyecto) => (typeof p.destacado === 'number' ? p.destacado : 99);
  const marcados = proyectos.filter((p) => p.destacado).sort((a, b) => posicion(a) - posicion(b));
  return (marcados.length >= 5 ? marcados : proyectos).slice(0, 5);
})();

function ordenEstilo(p: Proyecto) {
  const orden: Estilo[] = ['ultimos-trabajos', 'moderno', 'actual', 'rustico', 'encimeras', 'impresion-aluminio'];
  return orden.indexOf(p.estilos[0]);
}

function describir(estilo: Estilo, acabados: AcabadoSlug[]) {
  const base = descripcionPorEstilo[estilo];
  return acabados.length ? `${base}, acabado ${nombreAcabado(acabados[0]).toLowerCase()}` : base;
}
