// The PRD page (prd/public/index.html) served at /prd, copied as is at build time. It carries its own
// noindex meta, and public/_headers keeps the X-Robots-Tag noindex on it whatever the launch switch says.
import type { APIRoute } from 'astro';
import prd from '../../prd/public/index.html?raw';

export const GET: APIRoute = () => new Response(prd, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
