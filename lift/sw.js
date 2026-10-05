// СЕРВИС-ВОРКЕР веб-версии (собран build_release.py — руками не правится).
// Страница — «сеть первой»: есть сеть — свежая версия (и она же в кэш),
// нет сети — из кэша: игра открывается и без интернета. Остальные файлы
// (манифест, иконки) — из кэша. Имя кэша — хеш index.html: новая версия
// ставит новый кэш, старые удаляются при активации.
// ТОЛЬКО СВОИ СТРАНИЦЫ: на Pages вторая игра лежит в подпапке (color/),
// то есть внутри области этого воркера. Раньше любой переход в области
// кэшировался под 'index.html' — первый заход во вторую игру записал бы
// её страницу вместо своей. Чужие переходы и файлы — мимо, в сеть (у
// второй игры свой воркер с областью точнее, он и главный там).
const V = 'bbf-618b0429ee';
const HOME = new URL('./', self.registration.scope).pathname;
const own = u => u.pathname === HOME || u.pathname === HOME + 'index.html';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png',
               'icon-maskable-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('bbf-') && k !== V).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  const u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  if (r.mode === 'navigate') {
    if (!own(u)) return;
    e.respondWith(fetch(r).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(V).then(c => c.put('index.html', copy)); }
      return res;
    }).catch(() => caches.match('index.html')));
    return;
  }
  if (!u.pathname.startsWith(HOME) || u.pathname.slice(HOME.length).includes('/')) return;
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(hit => hit || fetch(r)));
});
