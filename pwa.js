// ==========================================================================
// 森嶼書屋 · 心靈微光圖書館 — PWA 啟動器
// 功能：註冊 Service Worker、安裝按鈕、離線/上線提示、啟動畫面淡出、
//       manifest 捷徑 (?action=mood / ?action=directory)
// 以一般 <script> 載入，file:// 與 http(s):// 兩種模式皆可安全執行。
// ==========================================================================
(function () {
  "use strict";

  var isHttp = location.protocol === "http:" || location.protocol === "https:";
  var installBtn = document.getElementById("btnInstall");
  var netStatus = document.getElementById("netStatus");
  var splash = document.getElementById("splashScreen");
  var deferredPrompt = null;

  // ---- 1. Splash：主程式載入完成（app:ready）或逾時後淡出 ----
  function hideSplash() {
    if (!splash || splash.classList.contains("is-done")) return;
    splash.classList.add("is-done");
    window.setTimeout(function () {
      splash.hidden = true;
    }, 700);
  }
  window.addEventListener("app:ready", function () {
    window.setTimeout(hideSplash, 250);
  });
  window.setTimeout(hideSplash, 8000);

  // ---- 2. Service Worker ----
  if (isHttp && "serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker
        .register("./sw.js", { scope: "./" })
        .then(function (reg) {
          reg.addEventListener("updatefound", function () {
            var worker = reg.installing;
            if (!worker) return;
            worker.addEventListener("statechange", function () {
              if (worker.state === "installed" && navigator.serviceWorker.controller) {
                showNet("已下載新版內容，重新整理即可套用", 5000);
              }
            });
          });
        })
        .catch(function (err) {
          console.warn("Service Worker 註冊失敗：", err);
        });
    });
  }

  // ---- 3. 安裝到主畫面（Chrome / Edge / Android）----
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.hidden = false;
  });

  if (installBtn) {
    installBtn.addEventListener("click", function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function () {
        deferredPrompt = null;
        installBtn.hidden = true;
      });
    });
  }

  window.addEventListener("appinstalled", function () {
    if (installBtn) installBtn.hidden = true;
    showNet("已安裝森嶼書屋，可從主畫面直接開啟", 3500);
  });

  // ---- 4. 離線 / 上線提示 ----
  var netTimer = null;
  function showNet(msg, ms) {
    if (!netStatus) return;
    netStatus.textContent = msg;
    netStatus.hidden = false;
    window.clearTimeout(netTimer);
    if (ms) {
      netTimer = window.setTimeout(function () {
        netStatus.hidden = true;
      }, ms);
    }
  }
  window.addEventListener("offline", function () {
    showNet("目前為離線模式：仍可瀏覽已快取的群島與書單");
  });
  window.addEventListener("online", function () {
    showNet("網路已恢復連線", 2200);
  });

  // ---- 5. Manifest 捷徑：?action=mood / ?action=directory ----
  window.addEventListener("app:ready", function () {
    var action = new URLSearchParams(location.search).get("action");
    var target = action === "mood" ? "btnMoodMatcher" : action === "directory" ? "btnDirectory" : null;
    if (target) {
      window.setTimeout(function () {
        var btn = document.getElementById(target);
        if (btn) btn.click();
      }, 900);
    }
  });
})();
