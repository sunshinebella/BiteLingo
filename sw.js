// 碎片学英语 · Service Worker（离线缓存应用壳）
// 策略：network-first（在线永远取最新，离线才回退缓存），避免部署后长期显示旧版
const CACHE = "eng-pwa-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./data.js",
  "./app.js",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // 仅处理同源静态资源
  e.respondWith(
    fetch(e.request)
      .then((resp) => {
        // 在线：取最新并静默更新缓存
        const cp = resp.clone();
        caches.open(CACHE).then((c) => c.put(e.request, cp));
        return resp;
      })
      .catch(() =>
        caches.match(e.request).then((cached) => cached || caches.match("./index.html"))
      )
  );
});
