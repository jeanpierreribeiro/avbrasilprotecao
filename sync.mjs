// Copia a variação (e o design-system que ela usa) para site/ e marca as páginas como noindex.
// Uso: node sync.mjs   (rode de novo sempre que a variação mudar)
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const variacao = resolve(here, '..');              // prototipo-02/variacao
const ds = resolve(here, '../../../design-system'); // Website/design-system
const out = resolve(here, 'site');
const pairs = [
  [variacao, resolve(out, 'prototipo-02/variacao'), ['index.html', 'css', 'js', 'assets']],
  [ds, resolve(out, 'design-system'), ['tokens.css', 'components/bundle.css']],
];
for (const [from, to, items] of pairs) {
  if (!existsSync(from)) throw new Error('Não achei ' + from);
  rmSync(to, { recursive: true, force: true });
  for (const it of items) { mkdirSync(dirname(resolve(to, it)), { recursive: true }); cpSync(resolve(from, it), resolve(to, it), { recursive: true }); }
}
const idx = resolve(out, 'prototipo-02/variacao/index.html');
let html = readFileSync(idx, 'utf8');
if (!/name="robots"/.test(html)) html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="robots" content="noindex, nofollow, noarchive">');
writeFileSync(idx, html);
console.log('site/ atualizado');
