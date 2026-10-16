/** Rutas internas respetando la base del sitio (p. ej. /Web-CocinasCMA/ en GitHub Pages). */
const base = import.meta.env.BASE_URL.replace(/\/+$/, '');

export function url(ruta = '/'): string {
  const limpia = ruta.replace(/^\/+/, '');
  return `${base}/${limpia}`;
}

/** Quita la base de una ruta para comparar con las del menú. */
export function rutaSinBase(pathname: string): string {
  const sin = base && pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  return sin.startsWith('/') ? sin : `/${sin}`;
}
