// ==========================================================================
// 森嶼書屋 · 心靈微光圖書館 — 免伺服器單檔打包工具 (產生 dist/bundle.js)
// 用途：讓使用者即使直接雙擊 index.html (file:// 協定) 也能正常載入 3D 場景與互動
// 執行指令：node build.mjs
// ==========================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function transformEsmToFactory(code, moduleId) {
  const exportedBindings = [];

  // 1. Convert `import * as NS from "spec"`
  let out = code.replace(
    /^\s*import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]+)['"]\s*;?/gm,
    (_, ns, spec) => `const ${ns} = __require(${JSON.stringify(spec)});`
  );

  // 2. Convert `import { a, b as c } from "spec"` (supports multi-line)
  out = out.replace(
    /import\s*\{([\s\S]*?)\}\s*from\s*['"]([^'"]+)['"]\s*;?/g,
    (_, list, spec) => {
      const bindings = list
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((item) => {
          const parts = item.split(/\s+as\s+/);
          return parts.length === 2 ? `${parts[0].trim()}: ${parts[1].trim()}` : parts[0].trim();
        })
        .join(", ");
      return `const { ${bindings} } = __require(${JSON.stringify(spec)});`;
    }
  );

  // 3. Convert `export const/let/var Name =`
  out = out.replace(/^\s*export\s+(const|let|var)\s+([A-Za-z_$][\w$]*)/gm, (_, kw, name) => {
    exportedBindings.push(`${name}: ${name}`);
    return `${kw} ${name}`;
  });

  // 4. Convert `export class/function Name`
  out = out.replace(/^\s*export\s+(class|function)\s+([A-Za-z_$][\w$]*)/gm, (_, kw, name) => {
    exportedBindings.push(`${name}: ${name}`);
    return `${kw} ${name}`;
  });

  // 5. Convert `export { a, b as c };`
  out = out.replace(/export\s*\{([\s\S]*?)\}\s*;?/g, (_, list) => {
    const props = list
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((item) => {
        const parts = item.split(/\s+as\s+/);
        return parts.length === 2
          ? `${parts[1].trim()}: ${parts[0].trim()}`
          : `${parts[0].trim()}: ${parts[0].trim()}`;
      });
    exportedBindings.push(...props);
    return "";
  });

  const footer = exportedBindings.length > 0
    ? `\nObject.assign(__exports, { ${exportedBindings.join(", ")} });\n`
    : "";

  return `// --- Module: ${moduleId} ---\n__define(${JSON.stringify(moduleId)}, function(__exports, __require) {\n${out}\n${footer}});\n`;
}

const modules = [
  ["three", "vendor/three/three.module.js"],
  ["three/addons/controls/OrbitControls.js", "vendor/three/addons/controls/OrbitControls.js"],
  ["three/addons/renderers/CSS2DRenderer.js", "vendor/three/addons/renderers/CSS2DRenderer.js"],
  ["three/addons/geometries/RoundedBoxGeometry.js", "vendor/three/addons/geometries/RoundedBoxGeometry.js"],
  ["./data.js", "data.js"],
  ["./audio.js", "audio.js"],
  ["./scene3d.js", "scene3d.js"],
  ["./app.js", "app.js"]
];

const chunks = [
  `(function() {\n"use strict";\nconst __factories = Object.create(null);\nconst __cache = Object.create(null);\nfunction __define(id, fn) { __factories[id] = fn; }\nfunction __require(id) {\n  if (__cache[id]) return __cache[id];\n  const fn = __factories[id];\n  if (!fn) throw new Error("Module not found: " + id);\n  const exp = {};\n  __cache[id] = exp;\n  fn(exp, __require);\n  return exp;\n}\n`
];

for (const [id, relPath] of modules) {
  const src = fs.readFileSync(path.join(__dirname, relPath), "utf8");
  chunks.push(transformEsmToFactory(src, id));
}

chunks.push(`__require("./app.js");\n})();\n`);

const outDir = path.join(__dirname, "dist");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "bundle.js");
fs.writeFileSync(outFile, chunks.join("\n"), "utf8");
console.log(`已成功建立免伺服器打包檔：${outFile} (${(fs.statSync(outFile).size / 1024).toFixed(1)} KB)`);
