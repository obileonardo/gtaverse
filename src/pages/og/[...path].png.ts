// One Open Graph card per page (src/lib/og.ts), written to dist/og/<page path>.png at build time.
import type { APIRoute, GetStaticPaths } from 'astro';
import { routes, type Route } from '../../lib/routes';
import { ogCard } from '../../lib/og';

export const getStaticPaths = (() =>
  routes.map((r) => ({ params: { path: r.path === '/' ? 'index' : r.path.slice(1) }, props: { route: r } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { route } = props as { route: Route };
  const png = await ogCard({ kicker: route.kicker, title: route.title, meta: route.meta });
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
