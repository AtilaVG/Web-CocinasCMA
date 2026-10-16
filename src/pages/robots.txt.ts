import type { APIRoute } from 'astro';

// Prototipo: no indexar. Web definitiva (INDEXAR=true): abrir y enlazar el sitemap.
export const GET: APIRoute = ({ site }) => {
  const cuerpo = __INDEXAR__
    ? `User-agent: *\nAllow: /\n\nSitemap: ${new URL(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/sitemap-index.xml`, site)}\n`
    : 'User-agent: *\nDisallow: /\n';
  return new Response(cuerpo, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
