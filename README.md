# AV Brasil Proteção — protótipo 02 (variação) com código de acesso

Pasta pronta para o GitHub → Vercel. Ao abrir o endereço, a pessoa vê a tela de código; só depois de acertar chega ao protótipo.

## Como funciona
- `middleware.js` roda na Vercel **antes** de entregar qualquer arquivo. Sem o cookie de acesso, nada do protótipo é servido (nem HTML, CSS ou imagens): tudo vai para `/acesso/`.
- Código certo → cookie `avb_acesso` (HttpOnly, 7 dias) → redireciona para `/prototipo-02/variacao/`.
- `/sair` apaga o cookie e volta à tela de código.
- Fora dos buscadores: `robots.txt` (Disallow: /), cabeçalho `X-Robots-Tag: noindex, nofollow` em tudo (`vercel.json`) e `<meta name="robots">` nas páginas.
- O código não está em texto no repositório, só o hash SHA-256. Para trocar o código sem mexer no código-fonte, crie na Vercel a variável de ambiente `ACCESS_CODE` (Settings → Environment Variables); ela tem prioridade sobre o hash.

## Atualizar o protótipo
`node sync.mjs` copia a variação (pasta acima) e o `design-system` para `site/` (rode antes de cada commit). Esta pasta `publicar` inteira é o repositório: `git init` aqui dentro.

## Testar localmente
`node test/gate.test.mjs` (testes automáticos) ou `node test/serve.mjs` e abrir http://localhost:8787

## Publicar na Vercel
Importar o repositório na Vercel (Framework Preset: Other). `vercel.json` já define a pasta `site` como saída. Sem build e sem dependências.
