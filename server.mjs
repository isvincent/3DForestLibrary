// ==========================================================================
// 森嶼書屋 · 心靈微光圖書館 — 零依賴本地靜態網頁伺服器
// 用途：確保在 Windows 環境下提供標準 ES Module MIME Type (text/javascript)
// 啟動指令：node server.mjs
// ==========================================================================

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || "127.0.0.1";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8"
};

const server = http.createServer((req, res) => {
  try {
    const rawUrl = (req.url || "/").split("?")[0].split("#")[0];
    const decodedPath = decodeURIComponent(rawUrl === "/" ? "/index.html" : rawUrl);
    const safeRel = path.normalize(decodedPath).replace(/^(\.\.(\/|\\|$))+/, "");
    const fullPath = path.resolve(__dirname, "." + path.sep + safeRel);

    if (!fullPath.startsWith(__dirname)) {
      res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("403 Forbidden");
      return;
    }

    fs.stat(fullPath, (err, stat) => {
      if (err || !stat.isFile()) {
        if (decodedPath === "/favicon.ico") {
          res.writeHead(204);
          res.end();
          return;
        }
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("404 Not Found");
        return;
      }

      const ext = path.extname(fullPath).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";
      res.writeHead(200, {
        "Content-Type": contentType,
        "Cache-Control": "no-cache"
      });
      fs.createReadStream(fullPath).pipe(res);
    });
  } catch {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("500 Internal Server Error");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`森嶼書屋伺服器已啟動：http://${HOST}:${PORT}`);
});
