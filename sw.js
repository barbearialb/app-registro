// --- CONFIGURAÇÃO ---
// Sempre que mudares os ícones ou o index.html, AUMENTA este número (v1 -> v2 -> v3)
const CACHE_NAME = 'app-shell-v1'; 

// Lista de arquivos que devem ser carregados instantaneamente (Sua "Casca")
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  // Seus ícones novos (IMPORTANTE: Os nomes têm de ser exatos)
  './novo_icon_any_192.png',
  './novo_icon_maskable_192.png',
  './novo_icon_any_512.png',
  './novo_icon_maskable_512.png'
];

// --- 1. INSTALAÇÃO (Baixa os arquivos para a memória) ---
self.addEventListener('install', event => {
  // Força o SW a ativar imediatamente, sem esperar o usuário fechar a aba
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// --- 2. ATIVAÇÃO (Limpa caches antigos para não ocupar espaço) ---
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Se o cache não for o atual (v1), apaga ele!
          if (cacheName !== CACHE_NAME) {
            console.log('Apagando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Garante que o SW controle a página imediatamente
  return self.clients.claim();
});

// --- 3. INTERCEPTAÇÃO DE PEDIDOS (A Lógica Inteligente) ---
self.addEventListener('fetch', event => {
  
  // A. Se for o arquivo de versão, OBRIGA a ir buscar na internet (Network Only)
  if (event.request.url.includes('versao.json')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Se estiver offline, não faz nada (ou retorna erro)
        return new Response(JSON.stringify({ versao_atual: 0 }), {
            headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // B. Para o resto (Ícones, Index), tenta o Cache primeiro. Se não tiver, vai na internet.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retorna o que achou no cache OU faz o fetch na internet
        return response || fetch(event.request);
      })
  );
});
