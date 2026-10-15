import type { ImageMetadata } from 'astro';

/**
 * Registro de fotos. Todo lo que haya en src/assets/fotos/ queda disponible
 * por su ruta relativa (p. ej. "propias/exposicion-01.jpg") y Astro lo
 * optimiza en el build (AVIF/WebP, varios tamaños, carga diferida).
 */
const archivos = import.meta.glob<ImageMetadata>(
  '/src/assets/fotos/**/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP}',
  { eager: true, import: 'default' },
);

const PREFIJO = '/src/assets/fotos/';

export function buscarFoto(ruta?: string | null): ImageMetadata | undefined {
  if (!ruta) return undefined;
  return archivos[PREFIJO + ruta.replace(/^\/+/, '')];
}

/** Proporción natural de una foto para CSS (aspect-ratio), o la indicada si no existe. */
export function proporcion(ruta: string | undefined, porDefecto: string): string {
  const img = buscarFoto(ruta);
  return img ? `${img.width} / ${img.height}` : porDefecto;
}

export interface Hueco {
  /** Ruta dentro de src/assets/fotos/. Vacío = se muestra "foto pendiente". */
  foto?: string;
  alt: string;
  /** Qué foto hace falta (se muestra en el hueco mientras no exista). */
  pendiente: string;
}

/**
 * Huecos de foto fijos de la web. Para cambiar una foto basta con dejar el
 * archivo en src/assets/fotos/ y escribir su ruta en `foto`.
 */
export const huecos = {
  inicioHero: {
    foto: 'web-actual/imagenes_cocinas/gr-96576749160885808.jpg',
    alt: 'Cocina blanca en laca brillo con isla de mármol, fabricada por Cocinas CMA',
    pendiente: 'Cocina terminada, horizontal y en alta resolución (mín. 2400 px de ancho)',
  },
  inicioFabrica: {
    foto: 'web-actual/imagenes_cocinas/gr-159807047.jpg',
    alt: 'Detalle de cajones en estratificado Matrix con veta de madera y tiradores de aluminio',
    pendiente: 'Nave de la fábrica de Cedillo del Condado con la maquinaria en marcha',
  },
  inicioExposicion: {
    foto: 'web-actual/imagenes_cocinas/gr-600278998.jpg',
    alt: 'Isla de cocina con frentes de cristal negro en la exposición de Cocinas CMA en Humanes de Madrid',
    pendiente: 'Vista general de la exposición de Humanes (700 m²)',
  },
  nosotrosHero: {
    foto: 'web-actual/imagenes_cocinas/gr-11235739.jpg',
    alt: 'Cocina rústica de madera con vitrinas, botellero y campana de madera',
    pendiente: 'Manos de un carpintero trabajando la madera / detalle de oficio',
  },
  nosotrosHistoria: {
    foto: 'web-actual/imagenes_cocinas/gr-1355612061.jpg',
    alt: 'Cocina rústica de pino con cestas de mimbre bajo la encimera',
    pendiente: 'Foto antigua del taller o de los fundadores (años 90)',
  },
  nosotrosEquipo: {
    foto: '',
    alt: 'El equipo de Cocinas CMA',
    pendiente: 'La familia y el equipo, en la tienda o en la fábrica',
  },
  fabricaHero: {
    foto: 'web-actual/imagenes_cocinas/gr-24925509793683888.jpg',
    alt: 'Cocina con encimera negra, frentes blancos y muebles altos en granate junto a un ventanal',
    pendiente: 'Nave de fabricación, plano general (horizontal, alta resolución)',
  },
  fabricaDetalle1: {
    foto: 'web-actual/images/fab-ban.jpg',
    alt: 'Interior de la fábrica de Cedillo del Condado: seccionadora con tableros y nave con la canteadora',
    pendiente: 'Seccionadora o corte de tableros',
  },
  fabricaDetalle2: {
    foto: 'web-actual/imagenes_cocinas/gr-912201119.jpg',
    alt: 'Detalle de cajones de madera oscura con tiradores metálicos',
    pendiente: 'Canteadora / detalle de cantos',
  },
  fabricaDetalle3: {
    foto: 'web-actual/imagenes_cocinas/gr-1097437599673867.jpg',
    alt: 'Encimera con fregadero y placa de inducción recién montada',
    pendiente: 'Módulos montados y revisión antes de embalar',
  },
  exposicionHero: {
    foto: 'web-actual/imagenes_cocinas/gr-412045166.jpg',
    alt: 'Cocina en U con muebles blancos y verdes en la exposición de Cocinas CMA en Humanes de Madrid',
    pendiente: 'Exposición de Humanes, plano general (horizontal, alta resolución)',
  },
  exposicionAmbiente1: {
    foto: 'web-actual/imagenes_cocinas/gr-236499926.jpg',
    alt: 'Cocina con frentes en verde lima y madera gris montada en la exposición',
    pendiente: 'Uno de los ambientes de cocina montados en la tienda',
  },
  exposicionAmbiente2: {
    foto: 'web-actual/imagenes_cocinas/gr-184896135.jpg',
    alt: 'Cocina de la exposición con un muestrario de colores de encimera',
    pendiente: 'Muestrario de frentes, colores y encimeras',
  },
  exposicionFachada: {
    foto: 'web-actual/imagenes_cocinas/cocina8.jpg',
    alt: 'Fachada de la tienda de Cocinas C.M.A. en Humanes de Madrid, con el cartel «Abierto al público»',
    pendiente: 'Fachada / entrada de la tienda (para que se reconozca al llegar)',
  },
  fabricaExterior: {
    foto: 'web-actual/imagenes_cocinas/cocina7.jpg',
    alt: 'Fachada de la nave de la fábrica, con el rótulo «Cocinas»',
    pendiente: 'Exterior de la fábrica de Cedillo del Condado',
  },
} satisfies Record<string, Hueco>;

/**
 * Fotos actuales de la exposición (300×120 px en la web antigua). Se muestran
 * a su tamaño, como tira, hasta tener un reportaje nuevo de la tienda.
 */
export const tiraExposicion: { foto: string; alt: string }[] = [
  { foto: 'web-actual/imagenes_cocinas/cocina1.jpg', alt: 'Cocina naranja con muestras de frentes sobre la encimera, en la exposición' },
  { foto: 'web-actual/imagenes_cocinas/cocina2.jpg', alt: 'Cocina roja con horno y frigorífico, en la exposición' },
  { foto: 'web-actual/imagenes_cocinas/cocina3.jpg', alt: 'Cocina de madera con cestas y muestras de encimera, en la exposición' },
  { foto: 'web-actual/imagenes_cocinas/cocina4.jpg', alt: 'Isla con encimera blanca y muebles negros, en la exposición' },
  { foto: 'web-actual/imagenes_cocinas/cocina5.jpg', alt: 'Cocina oscura con muestras de frentes sobre la encimera, en la exposición' },
  { foto: 'web-actual/imagenes_cocinas/cocina6.jpg', alt: 'Cocina en tono madera claro con microondas integrado, en la exposición' },
];
