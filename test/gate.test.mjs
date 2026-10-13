import assert from 'node:assert/strict';
import { start } from './serve.mjs';
const srv = await start(); const base = 'http://localhost:' + srv.address().port;
const get = (p, o = {}) => fetch(base + p, { redirect: 'manual', ...o });
const post = (code) => get('/acesso/', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'codigo=' + encodeURIComponent(code) });
let n = 0; const ok = (name) => console.log('ok', ++n, name);

// 1. sem cookie, tudo redireciona ao portão
for (const p of ['/', '/prototipo-02/variacao/', '/prototipo-02/variacao/css/styles.css', '/prototipo-02/variacao/assets/img/foto-casal-no-carro.jpg', '/design-system/tokens.css']) {
  const r = await get(p); assert.equal(r.status, 303, p); assert.match(r.headers.get('location'), /\/acesso\/$/, p);
}
ok('sem cookie: página, CSS, imagem e design-system bloqueados');
// 2. portão e robots públicos
assert.equal((await get('/acesso/')).status, 200); assert.equal((await get('/acesso')).status, 303);
const rb = await get('/robots.txt'); assert.equal(rb.status, 200); assert.match(await rb.text(), /Disallow: \//);
ok('portão e robots.txt abertos; robots bloqueia tudo');
assert.match(await (await get('/acesso/')).text(), /name="robots" content="noindex/); ok('portão com meta noindex');
// 3. códigos errados
for (const c of ['', 'errado', 'av229909brasilprotecao', 'Av229909BrasilProtecao ' + 'x']) {
  const r = await post(c); assert.equal(r.status, 303); assert.match(r.headers.get('location'), /acesso\/\?erro=1$/); assert.ok(!r.headers.get('set-cookie'), 'sem cookie');
}
ok('códigos errados (vazio, outro, minúsculo, com sufixo) recusados sem cookie');
// 4. código certo
const r = await post('Av229909BrasilProtecao'); assert.equal(r.status, 303); assert.match(r.headers.get('location'), /\/prototipo-02\/variacao\/$/);
const ck = r.headers.get('set-cookie'); assert.match(ck, /HttpOnly/); assert.match(ck, /SameSite=Lax/); assert.match(ck, /Max-Age=604800/);
ok('código certo: redireciona ao protótipo com cookie HttpOnly de 7 dias');
const cookie = ck.split(';')[0];
// 5. com cookie
const page = await get('/prototipo-02/variacao/', { headers: { cookie } }); assert.equal(page.status, 200);
const html = await page.text(); assert.match(html, /AV Brasil Proteção/); assert.match(html, /name="robots" content="noindex/);
for (const p of ['/prototipo-02/variacao/css/styles.css', '/design-system/tokens.css', '/prototipo-02/variacao/js/app.js']) assert.equal((await get(p, { headers: { cookie } })).status, 200, p);
assert.equal((await get('/', { headers: { cookie } })).headers.get('location').endsWith('/prototipo-02/variacao/'), true);
assert.equal((await get('/acesso/', { headers: { cookie } })).status, 303);
ok('com cookie: página e arquivos abertos; "/" e "/acesso/" levam ao protótipo');
// 6. cookie forjado, sair
assert.equal((await get('/prototipo-02/variacao/', { headers: { cookie: 'avb_acesso=abc' } })).status, 303);
assert.equal((await get('/prototipo-02/variacao/', { headers: { cookie: 'avb_acesso=' } })).status, 303);
const out = await get('/sair', { headers: { cookie } }); assert.match(out.headers.get('set-cookie'), /Max-Age=0/);
ok('cookie forjado/vazio recusado; /sair apaga o cookie');
// 7. código não aparece em texto puro nos arquivos publicados
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const hit = ['middleware.js', ...walk('site'), ...walk('test')].filter(f => !f.endsWith('gate.test.mjs') && !/\.(png|jpg|webp|woff2|js)$/.test(f) || f === 'middleware.js').filter(f => readFileSync(f, 'latin1').includes('Av229909'));
assert.deepEqual(hit, []); ok('o código em texto puro não está no middleware nem no site');
srv.close(); console.log('\nTudo certo:', n, 'grupos de teste');
