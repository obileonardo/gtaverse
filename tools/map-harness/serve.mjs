// Minimal local static server for the map harness. Verification only, not the product.
// Run with: pnpm map:harness, then open the printed URL. Ctrl+C stops it.
// Serves only tools/map-harness/, content/ and public/map/ from the repo root,
// bound to 127.0.0.1.

import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, dirname, extname, normalize, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ALLOWED = ['tools/map-harness/', 'content/', 'public/map/'];
const TYPES = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.js': 'text/javascript', '.css': 'text/css' };

export function startServer(port = 4317) {
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '');
    const rel = normalize(path).split(sep).join('/');
    const file = join(root, rel);
    const ok = !rel.startsWith('..') && ALLOWED.some((a) => rel.startsWith(a)) && existsSync(file) && statSync(file).isFile();
    if (!ok) {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!existsSync(join(root, 'public/map/meta.json'))) console.warn('No tiles yet: run pnpm map:fetch and pnpm map:tiles first.');
  const port = Number(process.env.PORT ?? 4317);
  await startServer(port);
  console.log(`Map harness: http://127.0.0.1:${port}/tools/map-harness/index.html`);
}
