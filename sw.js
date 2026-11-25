// ==========================================================================
// 森嶼書屋 · 心靈微光圖書館 — Service Worker（PWA 離線快取）
// 策略：
//   1. 安裝時預先快取 App Shell（HTML / CSS / JS / Three.js / 圖示）
//   2. HTML / 自家 JS / CSS：網路優先（Network-First），離線時回退快取
//   3. vendor/ 與 icons/：快取優先（Cache-First），檔案大且幾乎不變
//   4. Google Fonts：快取優先（Cache-First）
// 更新版本時請修改 CACHE_VERSION，舊快取會在 activate 時自動清除。
// ==========================================================================

const CACHE_VERSION = "v2.0.0";
const SHELL_CACHE = `senyu-shell-${CACHE_VERSION}`;
const FONT_CACHE = "senyu-fonts-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./data.js",
  "./audio.js",
  "./scene3d.js",
  "./pwa.js",
  "./manifest.webmanifest",
  "./vendor/three/three.module.js",
  "./vendor/three/addons/controls/OrbitControls.js",
  "./vendor/three/addons/renderers/CSS2DRenderer.js",
  "./vendor/three/addons/geometries/RoundedBoxGeometry.js",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([SHELL_CACHE, FONT_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Google Fonts：Cache-First
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }

  if (url.origin !== self.location.origin) return;

  // 第三方函式庫與圖示：Cache-First（檔案大、幾乎不變）
  if (url.pathname.includes("/vendor/") || url.pathname.includes("/icons/")) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  // HTML 導覽與自家程式碼 (JS / CSS / manifest)：Network-First
  // 有網路時永遠拿最新版（GitHub Pages 更新後立即生效），離線時回退快取
  event.respondWith(networkFirst(request, request.mode === "navigate"));
});

async function networkFirst(request, isNavigation) {
  try {
    const res = await fetch(request, { cache: "no-cache" });
    if (res && res.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, res.clone());
    }
    return res;
  } catch (err) {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;
    if (isNavigation) {
      const shell = await caches.match("./index.html");
      if (shell) return shell;
    }
    return new Response("", { status: 504, statusText: "Offline" });
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res && (res.ok || res.type === "opaque")) {
      const cache = await caches.open(cacheName);
      cache.put(request, res.clone());
    }
    return res;
  } catch (err) {
    return new Response("", { status: 504, statusText: "Offline" });
  }
}
