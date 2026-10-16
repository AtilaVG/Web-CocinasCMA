// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// En GitHub Actions, SITE_URL y BASE_PATH los rellena el workflow a partir de
// la configuración de GitHub Pages (sirve igual para user.github.io/repo/ que
// para un dominio propio). En local se usa la raíz.
const site = process.env.SITE_URL || 'https://www.cocinascma.com';
const base = process.env.BASE_PATH || '/';

// Mientras sea un prototipo no queremos que Google lo indexe (contenido
// duplicado con la web actual y fotos pendientes). Para la web definitiva:
// INDEXAR=true en el build.
const indexar = process.env.INDEXAR === 'true';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  integrations: indexar ? [sitemap()] : [],
  vite: {
    define: {
      __INDEXAR__: JSON.stringify(indexar),
    },
  },
});
