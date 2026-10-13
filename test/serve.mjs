// Simula a Vercel localmente: roda o middleware.js antes de servir site/ (apenas para teste).
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import middleware from '../middleware.js';

const root = resolve(fileURLToPath(import.meta.url), '../../site');
const types = { '.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.txt':'text/plain' };

export function start(port = 0) {
  const server = http.createServer(async (req, res) => {
    const chunks = []; for await (const c of req) chunks.push(c);
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const request = new Request('http://' + req.headers.host + req.url, { method: req.method, headers: req.headers, body: ['GET','HEAD'].includes(req.method) ? undefined : body, duplex: 'half' });
    const r = await middleware(request);
    const h = {}; r.headers.forEach((v, k) => { if (k !== 'x-middleware-next') h[k] = v; });
    const setCookie = r.headers.getSetCookie?.() || []; if (setCookie.length) h['set-cookie'] = setCookie;
    if (r.headers.get('x-middleware-next') !== '1') { res.writeHead(r.status, h); return res.end(); }
    let p = decodeURIComponent(new URL(request.url).pathname); if (p.endsWith('/')) p += 'index.html';
    try { const data = await readFile(join(root, p)); res.writeHead(200, { ...h, 'Content-Type': types[extname(p)] || 'application/octet-stream', 'X-Robots-Tag': 'noindex, nofollow' }); res.end(data); }
    catch { res.writeHead(404, h); res.end('404'); }
  });
  return new Promise(ok => server.listen(port, () => ok(server)));
}
if (process.argv[1] === fileURLToPath(import.meta.url)) start(8787).then(() => console.log('http://localhost:8787'));
