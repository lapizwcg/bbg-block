// СЕРВИС-ВОРКЕР веб-версии (собран build_release.py — руками не правится).
// Страница — «сеть первой»: есть сеть — свежая версия (и она же в кэш),
// нет сети — из кэша: игра открывается и без интернета. Остальные файлы
// (манифест, иконки) — из кэша. Имя кэша — хеш index.html: новая версия
// ставит новый кэш, старые удаляются при активации.
const V = 'bbg-d3ac5474c3';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png',
               'icon-maskable-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('bbg-') && k !== V).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(V).then(c => c.put('index.html', copy)); }
      return res;
    }).catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(hit => hit || fetch(r)));
});
