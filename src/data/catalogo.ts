/**
 * Estilos y acabados del catálogo (los que hoy aparecen en la "Exposición
 * virtual" de la web actual). Los slugs son los que usa el importador de fotos
 * y los filtros de la galería (?estilo=…&acabado=…).
 */

export const estilos = {
  'ultimos-trabajos': 'Últimos trabajos',
  actual: 'Actual',
  moderno: 'Moderno',
  rustico: 'Rústico',
  encimeras: 'Encimeras',
  'impresion-aluminio': 'Impresión digital y aluminio',
} as const;

export type Estilo = keyof typeof estilos;

/** Orden en que se muestran los filtros de estilo. */
export const estilosFiltro: Estilo[] = ['ultimos-trabajos', 'actual', 'moderno', 'rustico'];

export interface Acabado {
  nombre: string;
  /** Texto breve para la página de Exposición. */
  descripcion: string;
  /** Clase de la muestra visual (ilustración CSS, no es una foto). */
  muestra: string;
  /** El cliente debe completar o validar la descripción. */
  pendiente?: boolean;
}

export const acabados = {
  'laca-brillo': {
    nombre: 'Laca brillo',
    descripcion:
      'Superficie lacada de acabado espejo, lisa y luminosa. Refleja la luz y hace que la cocina parezca más amplia.',
    muestra: 'muestra--laca-brillo',
  },
  'laca-texturizada': {
    nombre: 'Laca texturizada',
    descripcion:
      'Laca con un ligero relieve al tacto. Aporta calidez, es agradable de tocar y disimula mejor las huellas.',
    muestra: 'muestra--laca-textura',
  },
  laca: {
    nombre: 'Laca',
    descripcion: 'Frentes lacados en la gama de colores que prefieras, en brillo o mate.',
    muestra: 'muestra--laca-brillo',
  },
  'cristal-gola': {
    nombre: 'Cristal con gola',
    descripcion:
      'Frentes de cristal sin tiradores: se abren desde un perfil de aluminio (gola) integrado en el mueble.',
    muestra: 'muestra--cristal',
  },
  madera: {
    nombre: 'Madera',
    descripcion:
      'Madera con uñero, el tirador mecanizado en el propio frente. Veta natural y un acabado que mejora con los años.',
    muestra: 'muestra--madera',
  },
  estratificado: {
    nombre: 'Estratificado Matrix',
    descripcion:
      'Laminado de alta presión, muy resistente a golpes, rayas y calor. Ideal para cocinas de uso intensivo.',
    muestra: 'muestra--estratificado',
  },
  'laminado-mate': {
    nombre: 'Laminado mate',
    descripcion: 'Acabado sedoso, sin brillos, de tacto suave y muy fácil de limpiar.',
    muestra: 'muestra--mate',
  },
  luxe: {
    nombre: 'Luxe',
    descripcion: 'Una de nuestras colecciones de frentes. Pregúntanos por sus colores en la exposición.',
    muestra: 'muestra--luxe',
    pendiente: true,
  },
  polilaminado: {
    nombre: 'Polilaminado',
    descripcion:
      'Frentes recubiertos con una lámina termoformada, sin juntas: lisos, imitación madera o brillo, a un precio contenido.',
    muestra: 'muestra--polilaminado',
  },
  acrilico: {
    nombre: 'Acrílico alto brillo',
    descripcion: 'Brillo intenso y color profundo, con un acabado muy uniforme en toda la superficie.',
    muestra: 'muestra--acrilico',
  },
  alpicord: {
    nombre: 'Colección Alpicord',
    descripcion: 'Colección de frentes con su propia gama de colores y texturas. Ven a verla en la exposición.',
    muestra: 'muestra--alpicord',
    pendiente: true,
  },
  neolith: {
    nombre: 'Encimeras Neolith',
    descripcion:
      'Piedra sinterizada en gran formato: resiste el calor, las manchas y los arañazos, y apenas necesita mantenimiento.',
    muestra: 'muestra--neolith',
  },
  'impresion-digital': {
    nombre: 'Impresión digital',
    descripcion:
      'Frentes personalizados con impresión digital de alta definición, y perfilería de aluminio para vitrinas y frentes de cristal.',
    muestra: 'muestra--impresion',
  },
  aluminio: {
    nombre: 'Perfilería de aluminio',
    descripcion: 'Perfiles de aluminio para puertas de cristal, vitrinas y frentes sin tirador.',
    muestra: 'muestra--aluminio',
  },
} satisfies Record<string, Acabado>;

export type AcabadoSlug = keyof typeof acabados;

/** Acabados que se presentan en la página de Exposición, en este orden. */
export const acabadosExposicion: AcabadoSlug[] = [
  'laca-brillo',
  'laca-texturizada',
  'cristal-gola',
  'madera',
  'estratificado',
  'laminado-mate',
  'polilaminado',
  'acrilico',
  'luxe',
  'alpicord',
  'neolith',
  'impresion-digital',
];

export const nombreEstilo = (slug: string) => (estilos as Record<string, string>)[slug] ?? slug;
export const nombreAcabado = (slug: string) =>
  (acabados as Record<string, Acabado>)[slug]?.nombre ?? slug;
