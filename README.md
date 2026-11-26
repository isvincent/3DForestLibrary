<div align="center">

<img src="icons/icon-192.png" width="96" alt="森嶼書屋圖示" />

# 森嶼書屋 · 心靈微光圖書館

**3D 閱讀群島 × 社會情緒學習（SEL）互動空間**

走訪六座主題閱讀島嶼與動物館員，依心情選書、跟著光球靜心呼吸、寫下閱讀反思書籤。<br/>
支援 **手機／平板／桌機（RWD）**，並可 **安裝成 App、離線使用（PWA）**。

![Three.js](https://img.shields.io/badge/Three.js-r160-000?logo=three.js)
![PWA](https://img.shields.io/badge/PWA-ready-4f735b)
![RWD](https://img.shields.io/badge/RWD-mobile%20%7C%20tablet%20%7C%20desktop-e6a145)
![No build deps](https://img.shields.io/badge/dependencies-0-8fb6b8)

</div>

---

## 目錄

- [功能特色](#功能特色)
- [六大閱讀島嶼](#六大閱讀島嶼)
- [快速開始](#快速開始)
- [部署到 GitHub Pages](#部署到-github-pages)
- [安裝為 App（PWA）](#安裝為-apppwa)
- [專案架構](#專案架構)
- [3D 效能與視覺優化](#3d-效能與視覺優化)
- [RWD 響應式設計](#rwd-響應式設計)
- [自訂內容（學校／圖書館）](#自訂內容學校圖書館)
- [瀏覽器支援](#瀏覽器支援)
- [常見問題](#常見問題)
- [授權](#授權)

---

## 功能特色

| 類別 | 說明 |
| --- | --- |
| 🏝️ 3D 閱讀群島 | 以 Three.js 程序化生成六座低多邊形島嶼、木橋、燈塔、樹屋、溫室與營火庭園 |
| 🦉 動物館員 | 貓頭鷹、水豚、小熊、垂耳兔、小狐狸、小鹿在島上自由漫步、避開障礙物，點擊會打招呼並響起木琴音 |
| 📚 心情選書 | 選擇「今天的心情天氣」，鏡頭自動飛往對應島嶼並推薦療癒書單 |
| 🫁 靜心呼吸 | 4-4-6 呼吸節奏，畫面與樹屋中的琥珀光球同步縮放 |
| 🏠 室內書屋 | 每座島都有專屬室內閱讀室，支援第一人稱漫步（WASD／方向鍵／螢幕方向鍵） |
| 🌅 四時光影 | 清晨、暖晝、夕照、星夜，天空／水面／燈光**平滑漸變**，夜晚出現星空與螢火蟲 |
| 🚚 跨島漂書 | 小動物沿木橋運送書籍，呈現班級／館區之間的共讀流動 |
| 🎧 白噪音混音台 | WebAudio 即時合成細雨、柴火、微風、翻書聲 |
| 🔖 心情書籤 | 反思筆記只存於本機（localStorage），可下載 .txt 閱讀反思卡 |
| 🌐 中英雙語 | 一鍵切換介面語言 |
| 📱 RWD | 手機底部抽屜（Bottom Sheet）、橫向手機、平板、教室大屏皆有專屬排版 |
| 📦 PWA | 可安裝到主畫面、離線瀏覽、啟動畫面、App 捷徑（心情選書／館區索引） |

## 六大閱讀島嶼

| 編號 | 島嶼 | SEL 能力 | 動物館員 |
| --- | --- | --- | --- |
| 00 | 晨光總館 · 心情選書廳 | 全館導覽 · 心情選書起點 | 貓頭鷹總館長 歐利 Ollie |
| 01 | 靜心水岸 · 覺察書席 | 自我覺察 Self-Awareness | 水豚情緒覺察員 卡皮 Capy |
| 02 | 呼吸樹屋 · 安定閣樓 | 自我管理 Self-Management | 小熊正念領讀員 巴尼 Barnaby |
| 03 | 暖陽溫室 · 同理書房 | 社會覺察 Social Awareness | 垂耳兔故事同理師 米米 Mimi |
| 04 | 營火庭園 · 共讀茶席 | 人際技巧 Relationship Skills | 小狐狸對話領航員 緋緋 Fifi |
| 05 | 觀星燈塔 · 領航書閣 | 負責任的決定 Responsible Decision | 小鹿領航思考員 諾亞 Noah |

---

## 快速開始

本專案 **零相依套件**，不需要 `npm install`。

### 方式 A：直接雙擊（最簡單）

直接雙擊 `index.html` 即可（`file://` 模式會自動改載入 `dist/bundle.js`）。
> 此模式不支援 PWA 安裝與離線快取，若要完整功能請用方式 B。

### 方式 B：本地伺服器（建議）

需要 [Node.js 18+](https://nodejs.org/)：

```bash
npm start          # 重新打包 dist/bundle.js 並啟動 http://127.0.0.1:8080
# 或
node server.mjs    # 只啟動伺服器
```

Windows 使用者也可以直接雙擊 `start-server.bat`。

> 其他靜態伺服器也可以，例如 `npx serve .`、`python -m http.server 8080`、VS Code Live Server。

---

## 部署到 GitHub Pages

### 1. 建立儲存庫並推送

```bash
git init
git add .
git commit -m "森嶼書屋 · 心靈微光圖書館 v2.0（3D 優化 + RWD + PWA）"
git branch -M main
git remote add origin https://github.com/<你的帳號>/<儲存庫名稱>.git
git push -u origin main
```

### 2. 開啟 Pages

到 GitHub 儲存庫 **Settings → Pages → Build and deployment → Source** 選擇 **GitHub Actions**。

推送後 `.github/workflows/pages.yml` 會自動：
1. 執行 `node build.mjs` 重新打包 `dist/bundle.js`
2. 部署整個網站到 `https://<你的帳號>.github.io/<儲存庫名稱>/`

> 也可以改選 **Deploy from a branch → main / (root)**，不使用 Actions；所有路徑皆為相對路徑（`./`），放在子目錄也能正常運作。
> PWA 需要 **HTTPS**，GitHub Pages 預設即為 HTTPS。

---

## 安裝為 App（PWA）

| 裝置 | 安裝方式 |
| --- | --- |
| Chrome／Edge（桌機、Android） | 工具列出現琥珀色「**安裝 App**」按鈕，或網址列右側的安裝圖示 |
| iPhone／iPad（Safari） | 分享 ⬆️ → **加入主畫面** |
| Android（其他瀏覽器） | 選單 → **安裝應用程式／加到主畫面** |

安裝後：
- 以獨立視窗全螢幕開啟、支援瀏海安全區（safe-area）。
- 第一次載入後即可 **離線使用**（App Shell 與 Three.js 已預先快取）。
- 長按 App 圖示可使用捷徑：**今日心情選書**、**館區與漂書索引**。

### 快取策略（`sw.js`）

| 資源 | 策略 | 說明 |
| --- | --- | --- |
| HTML、自家 JS／CSS、manifest | Network-First | 有網路時永遠取得最新版，離線時回退快取 |
| `vendor/`（Three.js）、`icons/` | Cache-First | 檔案大且幾乎不變 |
| Google Fonts | Cache-First | 字型離線也能顯示 |

> **更新 Three.js 或圖示時**，請修改 `sw.js` 最上方的 `CACHE_VERSION`，舊快取會自動清除。

---

## 專案架構

```
.
├── index.html                 # 首頁：HUD 介面、PWA meta、啟動畫面、載入器
├── styles.css                 # 設計系統 + RWD 斷點 + 啟動畫面樣式
├── app.js                     # 介面邏輯：抽屜、心情選書、書籤、語言切換、Tweaks
├── scene3d.js                 # 3D 引擎：群島、動物 AI、室內書屋、光影、水面、雲、星空
├── data.js                    # 內容設定：學校名稱、島嶼、館員、書單、心情、時段配色
├── audio.js                   # WebAudio 程序化白噪音與動物木琴音
├── pwa.js                     # Service Worker 註冊、安裝按鈕、離線提示、App 捷徑
├── sw.js                      # Service Worker（離線快取）
├── manifest.webmanifest       # PWA 設定（名稱、圖示、主題色、捷徑）
├── icons/
│   ├── icon.svg               # 向量圖示（favicon / 啟動畫面）
│   ├── icon-192.png           # PWA 圖示
│   ├── icon-512.png
│   ├── maskable-512.png       # Android 自適應圖示（安全區 80%）
│   ├── apple-touch-icon.png   # iOS 主畫面圖示 180×180
│   └── favicon-32.png
├── vendor/three/              # Three.js r160（本地化，離線可用、無 CDN 依賴）
│   ├── three.module.js
│   └── addons/
│       ├── controls/OrbitControls.js
│       ├── renderers/CSS2DRenderer.js
│       └── geometries/RoundedBoxGeometry.js
├── dist/bundle.js             # file:// 雙擊模式用的單檔打包（由 build.mjs 產生）
├── build.mjs                  # 零依賴 ES Module → 單檔打包工具
├── server.mjs                 # 零依賴本地靜態伺服器（正確的 MIME Type）
├── start-server.bat           # Windows 一鍵啟動
├── tools/make-icons.py        # 重新產生 PWA 圖示（需 Pillow）
├── .github/workflows/pages.yml# GitHub Pages 自動部署
├── .nojekyll                  # 讓 GitHub Pages 不經 Jekyll 處理
├── .gitignore
├── package.json
└── README.md
```

> 修改 `app.js`／`scene3d.js`／`data.js`／`audio.js` 後，請執行 `npm run build` 更新 `dist/bundle.js`（GitHub Actions 部署時也會自動執行）。

---

## 3D 效能與視覺優化

**效能**
- **自適應畫質**：依裝置（觸控／小螢幕／低記憶體）自動選擇陰影解析度（2048 / 1024）、抗鋸齒與像素比上限（2 / 1.5）。
- **動態解析度**：持續低於約 40 FPS 時自動逐步降低像素比，順暢後再回升。
- **GPU 水面**：波浪由頂點著色器計算，不再每幀用 CPU 更新數千個頂點。
- **GPU 螢火蟲**：粒子漂浮與閃爍完全在著色器中完成。
- **幾何與材質共用**：木橋、書本、書架、樹木改用共用快取，大幅減少 GPU 記憶體與 draw 建立成本。
- **室內資源釋放**：離開室內書屋時釋放專屬幾何與材質，避免反覆進出造成記憶體累積。
- **背景暫停**：分頁切到背景時停止渲染，節省電量。
- **尺寸防護**：在背景分頁或隱藏框架中開啟時，避免尺寸為 0 導致鏡頭錯亂。

**視覺**
- 天空加入太陽／月亮光暈與地平線柔光，並正確做色彩空間轉換。
- 水面依距離呈現 **深淺漸層** 與 **波光閃爍**。
- 群島後方的 **低多邊形雲朵** 緩慢飄移，顏色隨時段變化。
- 夜晚與黃昏淡入 **星空**；螢火蟲改用柔光貼圖與加法混色。
- 四時光影 **1.8 秒平滑漸變**（天空、霧、水、燈光、曝光度）。
- 開場 **鏡頭飛入動畫**、更柔和的 ease-in-out 運鏡；手動拖曳時立即交還控制權。
- 聚焦島嶼時水面出現 **琥珀光環**；桌機滑鼠懸停島嶼會微微發光。
- 支援 `prefers-reduced-motion`：關閉波浪、雲朵與運鏡動畫。

---

## RWD 響應式設計

| 斷點 | 排版重點 |
| --- | --- |
| ≥ 1600px 大螢幕／投影 | 抽屜加寬 |
| ≤ 1100px 平板橫向 | 抽屜與按鈕縮窄 |
| ≤ 820px 平板直向／大手機 | 島嶼卡片改為 **底部抽屜**、工具列橫向捲動、底部時段列全寬可滑動、Tweaks 縮為圖示 |
| ≤ 520px 手機 | 次要按鈕改純圖示、心情卡兩欄、隱藏漂書標籤、名牌縮小 |
| ≤ 360px 小手機 | 心情卡單欄 |
| 橫向手機（高度 ≤ 500px） | 抽屜改左右側邊、品牌列精簡為單行 |
| 觸控裝置 | 點擊範圍 ≥ 40px、方向鍵加大、取消 hover 位移 |
| 直式螢幕 3D | 鏡頭自動拉遠並加大俯角，讓整座群島入鏡 |

另支援 iPhone 瀏海／Home 指示條安全區（`env(safe-area-inset-*)`）與動態視窗高度（`dvh`）。

---

## 自訂內容（學校／圖書館）

所有內容集中在 **`data.js`**：

- `SITE_CONFIG`：學校名稱、標題、副標（中英文）。
- `ISLANDS`：島嶼名稱、SEL 能力、動物館員台詞、**推薦書單與索書號**。
- `MOOD_PRESETS`：心情選項與對應島嶼。
- `BOOK_FLOWS`：跨島漂書路線。
- `TIME_PRESETS`：四個時段的天空、水面、燈光配色。

也可以在網頁右下角 **Tweaks** 面板即時修改學校名稱、介面主題（羊皮紙／深林木質／教室高對比）、粒子密度與鏡頭視角。

修改後執行：

```bash
npm run build
```

若修改了 PWA 名稱或主題色，請同步編輯 `manifest.webmanifest`；重新設計圖示可編輯 `tools/make-icons.py` 後執行 `npm run icons`。

---

## 瀏覽器支援

| 瀏覽器 | 3D | PWA 安裝 | 離線 |
| --- | --- | --- | --- |
| Chrome／Edge 100+ | ✅ | ✅ | ✅ |
| Safari 16.4+（iOS／macOS） | ✅ | ✅（加入主畫面） | ✅ |
| Firefox 110+ | ✅ | ➖（桌機不支援安裝） | ✅ |

無 WebGL 的環境會顯示文字版提示，仍可使用心情選書、館區索引與書單。

---

## 常見問題

**Q：部署後畫面沒有更新？**
A：程式碼採 Network-First，有網路時重新整理即會取得最新版。若更新的是 `vendor/` 或 `icons/`，請修改 `sw.js` 的 `CACHE_VERSION`。

**Q：手機上 3D 很卡？**
A：系統會自動降低解析度；也可以在 Tweaks 關閉粒子，或於底部列按「暫停動態」。

**Q：心情書籤會上傳嗎？**
A：不會。書籤只存在使用者自己的瀏覽器（localStorage）。

**Q：沒有看到「安裝 App」按鈕？**
A：需透過 HTTPS（或 localhost）開啟，且瀏覽器支援 `beforeinstallprompt`（Chrome／Edge）。iOS 請使用 Safari 的「加入主畫面」。

---

## 授權

- 本專案程式碼可依學校／機構需求自由修改使用。
- [Three.js](https://threejs.org/) © three.js authors，MIT License。
- 字型：[Noto Sans TC／Noto Serif TC](https://fonts.google.com/)（SIL Open Font License）。
