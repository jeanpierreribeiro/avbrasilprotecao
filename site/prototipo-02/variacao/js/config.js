/* ==========================================================================
   Protótipo 02 — configuração central
   Script clássico (sem módulos): funciona também aberto por duplo clique (file://).
   Todas as variáveis {{…}} do copy ficam AQUI (COPY_WEBSITE §9, "Dados ainda a preencher").
   Mensagens de WhatsApp: literais do copy §7.1 e §7.2 — não editar o texto.
   ========================================================================== */

const CONFIG = {
  WHATSAPP: '{{WHATSAPP}}', // somente dígitos com DDI, ex.: 5531999999999
  URL_AREA_ASSOCIADO: '{{URL_AREA_ASSOCIADO}}',
  URL_RASTREAMENTO: '{{URL_RASTREAMENTO}}',
  URL_GOOGLE_PLAY: '{{URL_GOOGLE_PLAY}}',
  URL_APP_STORE: '{{URL_APP_STORE}}',
  URL_VAGAS: '{{URL_VAGAS}}',
  INSTAGRAM: '{{INSTAGRAM}}',
  FACEBOOK: '{{FACEBOOK}}',
  LINKEDIN: '{{LINKEDIN}}',
  RAZAO_SOCIAL: '{{RAZÃO SOCIAL}}',
  CNPJ: '{{CNPJ}}',
};

const WA_MESSAGES = {
  padrao: 'Olá! Vim pelo site da AV Brasil Proteção e quero simular a proteção do meu veículo.',
  carro: 'Olá! Vim pelo site da AV Brasil Proteção e quero simular a proteção do meu carro.',
  van: 'Olá! Vim pelo site da AV Brasil Proteção e quero simular a proteção da minha van/furgão.',
  caminhao: 'Olá! Vim pelo site da AV Brasil Proteção e quero simular a proteção do meu caminhão.',
  carreta: 'Olá! Vim pelo site da AV Brasil Proteção e quero simular a proteção da minha carreta.',
};

const isPlaceholder = (v) => typeof v === 'string' && v.startsWith('{{');

function waLink(key = 'padrao') {
  const text = encodeURIComponent(WA_MESSAGES[key] ?? WA_MESSAGES.padrao);
  const phone = isPlaceholder(CONFIG.WHATSAPP) ? '' : CONFIG.WHATSAPP.replace(/\D/g, '');
  return `https://wa.me/${phone}?text=${text}`;
}

/** [data-wa] → WhatsApp · [data-url] → URL externa · [data-config] → texto · [data-year] → ano */
function applyConfig(root = document) {
  root.querySelectorAll('[data-wa]').forEach((a) => { a.href = waLink(a.dataset.wa); a.target = '_blank'; a.rel = 'noopener'; });
  root.querySelectorAll('[data-url]').forEach((a) => {
    const v = CONFIG[a.dataset.url];
    if (!v || isPlaceholder(v)) { a.href = '#'; a.dataset.todo = a.dataset.url; return; }
    a.href = v; a.target = '_blank'; a.rel = 'noopener';
  });
  root.querySelectorAll('[data-config]').forEach((el) => { el.textContent = CONFIG[el.dataset.config] ?? el.textContent; });
  root.querySelectorAll('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
}

window.AVB = { CONFIG, WA_MESSAGES, waLink, applyConfig };
