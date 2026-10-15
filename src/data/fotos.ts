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
    foto: '',
    alt: 'Cocina a medida terminada, fabricada por Cocinas CMA',
    pendiente: 'Cocina terminada, horizontal y en alta resolución (mín. 2400 px de ancho)',
  },
  inicioFabrica: {
    foto: '',
    alt: 'Interior de la fábrica de Cocinas CMA en Cedillo del Condado',
    pendiente: 'Nave de la fábrica de Cedillo del Condado con la maquinaria en marcha',
  },
  inicioExposicion: {
    foto: '',
    alt: 'Exposición de cocinas de Cocinas CMA en Humanes de Madrid',
    pendiente: 'Vista general de la exposición de Humanes (700 m²)',
  },
  nosotrosHero: {
    foto: '',
    alt: 'Carpintero de Cocinas CMA trabajando en un mueble de cocina',
    pendiente: 'Manos de un carpintero trabajando la madera / detalle de oficio',
  },
  nosotrosHistoria: {
    foto: '',
    alt: 'Los inicios de Cocinas CMA',
    pendiente: 'Foto antigua del taller o de los fundadores (años 90)',
  },
  nosotrosEquipo: {
    foto: '',
    alt: 'El equipo de Cocinas CMA',
    pendiente: 'La familia y el equipo, en la tienda o en la fábrica',
  },
  fabricaHero: {
    foto: '',
    alt: 'Fábrica de Cocinas CMA en Cedillo del Condado (Toledo)',
    pendiente: 'Nave de fabricación, plano general (horizontal, alta resolución)',
  },
  fabricaDetalle1: {
    foto: '',
    alt: 'Corte de tableros a medida en la fábrica',
    pendiente: 'Seccionadora o corte de tableros',
  },
  fabricaDetalle2: {
    foto: '',
    alt: 'Canteado de piezas en la fábrica',
    pendiente: 'Canteadora / detalle de cantos',
  },
  fabricaDetalle3: {
    foto: '',
    alt: 'Montaje y revisión de módulos de cocina',
    pendiente: 'Módulos montados y revisión antes de embalar',
  },
  exposicionHero: {
    foto: '',
    alt: 'Exposición de Cocinas CMA en Humanes de Madrid',
    pendiente: 'Exposición de Humanes, plano general (horizontal, alta resolución)',
  },
  exposicionAmbiente1: {
    foto: '',
    alt: 'Ambiente de cocina montado en la exposición',
    pendiente: 'Uno de los ambientes de cocina montados en la tienda',
  },
  exposicionAmbiente2: {
    foto: '',
    alt: 'Muestrario de acabados en la exposición',
    pendiente: 'Muestrario de frentes, colores y encimeras',
  },
  exposicionFachada: {
    foto: '',
    alt: 'Fachada de la tienda de Cocinas CMA en Humanes de Madrid',
    pendiente: 'Fachada / entrada de la tienda (para que se reconozca al llegar)',
  },
} satisfies Record<string, Hueco>;
