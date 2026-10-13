// Portão de acesso do protótipo (Vercel Routing Middleware, roda na borda, antes de qualquer arquivo).
// Sem o cookie de acesso, nada é entregue: nem HTML, nem CSS, nem imagens.
//
// Código de acesso:
//   • Preferência: variável de ambiente ACCESS_CODE (Vercel → Settings → Environment Variables).
//   • Se ela não existir, vale o código guardado aqui como hash SHA-256 (o texto do código não fica no repositório).

const CODE_HASH = 'a52f407e253aedd2c5a2866cd69315b4d14a5ff095f581f4e312e551c28546fc';
const SALT = 'avb-prototipo-02:';
const COOKIE = 'avb_acesso';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 dias
const HOME = '/prototipo-02/variacao/';
const GATE = '/acesso/';

const enc = new TextEncoder();
async function sha256(txt) {
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(txt));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
const env = (k) => (typeof process !== 'undefined' && process.env ? process.env[k] : undefined);
async function expectedHash() {
  const code = env('ACCESS_CODE');
  return code ? sha256(SALT + code) : CODE_HASH;
}
async function expectedToken() { return sha256('cookie:' + (await expectedHash())); }
function getCookie(req, name) {
  const m = (req.headers.get('cookie') || '').match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return m ? m[1] : '';
}
function redirect(url, path, extra = {}) {
  return new Response(null, { status: 303, headers: { Location: new URL(path, url).toString(), 'Cache-Control': 'no-store', ...extra } });
}
const pass = () => new Response(null, { headers: { 'x-middleware-next': '1' } });

export const config = { matcher: '/((?!_vercel/).*)' };

export default async function middleware(req) {
  const url = new URL(req.url);
  const path = url.pathname;
  const authed = safeEqual(getCookie(req, COOKIE), await expectedToken());

  // Envio do formulário
  if (path === '/acesso' || path === GATE) {
    if (req.method === 'POST') {
      let given = '';
      try { given = String((await req.formData()).get('codigo') || '').trim(); } catch (e) {}
      if (given && safeEqual(await sha256(SALT + given), await expectedHash())) {
        const cookie = `${COOKIE}=${await expectedToken()}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; SameSite=Lax${url.protocol === 'https:' ? '; Secure' : ''}`;
        return redirect(req.url, HOME, { 'Set-Cookie': cookie });
      }
      return redirect(req.url, GATE + '?erro=1');
    }
    if (path === '/acesso') return redirect(req.url, GATE + url.search);
    return authed ? redirect(req.url, HOME) : pass(); // quem já entrou vai direto ao protótipo
  }

  // Arquivos da própria tela de acesso e robots.txt são públicos
  if (path.startsWith(GATE) || path === '/robots.txt') return pass();

  // Sair: apaga o cookie
  if (path === '/sair') {
    return redirect(req.url, GATE, { 'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax` });
  }

  if (!authed) return redirect(req.url, GATE);
  if (path === '/') return redirect(req.url, HOME);
  return pass();
}
