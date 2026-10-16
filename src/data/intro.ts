/**
 * Intro animada de la portada.
 *
 * Por defecto son dos puertas de mueble que se abren al hacer scroll y dejan
 * ver una cocina. Si se añade una secuencia de fotogramas (vídeo troceado en
 * imágenes), la portada la reproduce con el scroll en lugar de las puertas.
 *
 * Para usar un vídeo:
 *   1. Exportar el vídeo a fotogramas WebP numerados desde 0001:
 *        ffmpeg -i entrada.mp4 -vf "fps=24,scale=1600:-2" -c:v libwebp -quality 72 public/intro/fotogramas/%04d.webp
 *      (en móvil se usan los mismos; con 120-180 fotogramas basta).
 *   2. Poner aquí `total` con el número de fotogramas generados.
 *   3. Si el vídeo no es una grabación real de sus cocinas (render o IA),
 *      dejar `aviso` con el texto que debe verse ("Recreación", etc.).
 */
export const secuencia = {
  /** Carpeta dentro de public/. */
  carpeta: 'intro/fotogramas',
  /** Número de fotogramas. 0 = no hay vídeo: se usan las puertas. */
  total: 0,
  extension: 'webp',
  /** Etiqueta visible sobre el vídeo si no es una grabación real. */
  aviso: '',
};
