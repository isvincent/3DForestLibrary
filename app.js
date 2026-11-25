// ==========================================================================
// 森嶼書屋 · 心靈微光圖書館 — UI Controller, Mood Curation & SEL Bookmark Notes
// ==========================================================================

import { SITE_CONFIG, ISLANDS, MOOD_PRESETS, BOOK_FLOWS, TIME_PRESETS } from "./data.js";
import { LibrarySoundscape } from "./audio.js";
import { LibraryWorld3D } from "./scene3d.js";

const STORAGE_KEY_NOTES = "sel_library_bookmarks_v1";

const state = {
  lang: "zh",
  selectedIslandId: null,
  dirTab: "islands",
  dirQuery: "",
  showLabels: true,
  showCouriers: true,
  showArcs: true,
  isPaused: false,
  notes: loadSavedNotes()
};

function loadSavedNotes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_NOTES) || "{}");
  } catch {
    return {};
  }
}

function saveNotes() {
  try {
    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(state.notes));
  } catch {
    // Ignore storage quota issues
  }
}

const soundscape = new LibrarySoundscape();

const els = {
  stage: document.getElementById("stage"),
  css2d: document.getElementById("css2d-layer"),
  schoolNameLabel: document.getElementById("schoolNameLabel"),
  titleMainLabel: document.getElementById("titleMainLabel"),
  titleAccentLabel: document.getElementById("titleAccentLabel"),
  subtitleLabel: document.getElementById("subtitleLabel"),
  lblMoodBtn: document.getElementById("lblMoodBtn"),
  lblOverviewBtn: document.getElementById("lblOverviewBtn"),
  lblDirBtn: document.getElementById("lblDirBtn"),
  btnMoodMatcher: document.getElementById("btnMoodMatcher"),
  btnOverview: document.getElementById("btnOverview"),
  btnDirectory: document.getElementById("btnDirectory"),
  btnLang: document.getElementById("btnLang"),

  spaceStatusBadge: document.getElementById("spaceStatusBadge"),
  spaceStatusText: document.getElementById("spaceStatusText"),
  btnQuickIndoor: document.getElementById("btnQuickIndoor"),
  lblQuickIndoor: document.getElementById("lblQuickIndoor"),
  btnSoundToggle: document.getElementById("btnSoundToggle"),
  lblSoundBtn: document.getElementById("lblSoundBtn"),
  soundPopover: document.getElementById("soundPopover"),
  btnCloseSound: document.getElementById("btnCloseSound"),

  zoneDrawer: document.getElementById("zoneDrawer"),
  zoneDrawerBody: document.getElementById("zoneDrawerBody"),
  zoneSelTag: document.getElementById("zoneSelTag"),
  zoneTitle: document.getElementById("zoneTitle"),
  zoneDesc: document.getElementById("zoneDesc"),
  btnCloseZone: document.getElementById("btnCloseZone"),
  btnToggleIndoor: document.getElementById("btnToggleIndoor"),
  lblToggleIndoor: document.getElementById("lblToggleIndoor"),
  btnToggleFpv: document.getElementById("btnToggleFpv"),
  lblToggleFpv: document.getElementById("lblToggleFpv"),

  librarianAvatar: document.getElementById("librarianAvatar"),
  librarianName: document.getElementById("librarianName"),
  librarianRole: document.getElementById("librarianRole"),
  librarianQuote: document.getElementById("librarianQuote"),
  btnGreetAnimal: document.getElementById("btnGreetAnimal"),

  breathingWidget: document.getElementById("breathingWidget"),
  breathOrbUi: document.getElementById("breathOrbUi"),
  breathPhaseLabel: document.getElementById("breathPhaseLabel"),

  bookList: document.getElementById("bookList"),
  reflectionPrompt: document.getElementById("reflectionPrompt"),
  reflectionInput: document.getElementById("reflectionInput"),
  btnSaveBookmark: document.getElementById("btnSaveBookmark"),
  btnExportBookmark: document.getElementById("btnExportBookmark"),

  directoryDrawer: document.getElementById("directoryDrawer"),
  btnCloseDirectory: document.getElementById("btnCloseDirectory"),
  dirSearchInput: document.getElementById("dirSearchInput"),
  dirList: document.getElementById("dirList"),

  moodModalBackdrop: document.getElementById("moodModalBackdrop"),
  btnCloseMoodModal: document.getElementById("btnCloseMoodModal"),
  moodGrid: document.getElementById("moodGrid"),

  fpvPad: document.getElementById("fpvPad"),
  toastBanner: document.getElementById("toastBanner"),

  hudClockTime: document.getElementById("hudClockTime"),
  hudClockSub: document.getElementById("hudClockSub"),
  btnToggleLabels: document.getElementById("btnToggleLabels"),
  btnToggleCouriers: document.getElementById("btnToggleCouriers"),
  btnToggleArcs: document.getElementById("btnToggleArcs"),
  btnBirdsEye: document.getElementById("btnBirdsEye"),
  btnPauseSim: document.getElementById("btnPauseSim"),

  btnTweaks: document.getElementById("btnTweaks"),
  tweaksPanel: document.getElementById("tweaksPanel"),
  btnCloseTweaks: document.getElementById("btnCloseTweaks"),
  tweakSchoolInput: document.getElementById("tweakSchoolInput"),
  tweakSurfaceTheme: document.getElementById("tweakSurfaceTheme"),
  tweakParticles: document.getElementById("tweakParticles"),
  tweakCameraLens: document.getElementById("tweakCameraLens")
};

let toastTimer = null;
function showToast(message) {
  els.toastBanner.textContent = message;
  els.toastBanner.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    els.toastBanner.hidden = true;
  }, 3100);
}

// Initialize 3D Archipelago & Indoor Book Rooms
let world;
try {
  world = new LibraryWorld3D({
    stageEl: els.stage,
    css2dEl: els.css2d,
    onSelectIsland: (islandId) => openZoneDrawer(islandId),
    onAnimalInteract: (island, quote, species) => {
      soundscape.playAnimalChime(species || island.librarian.species);
      if (state.selectedIslandId === island.id && quote) {
        els.librarianQuote.textContent = quote;
      }
    }
  });
} catch (err) {
  console.error("Failed to initialize 3D scene:", err);
  world = {
    isIndoor: false,
    isFpv: false,
    exitIndoorRoom() {},
    enterIndoorRoom() {},
    focusIsland() {},
    triggerAnimalGreeting() {},
    resetOverview() {},
    setLanguage() {},
    setFirstPersonMode() {},
    setMoveDirection() {},
    setAnimalPose() {},
    applyTimeOfDay() {},
    setSimulationOptions() {},
    setBirdsEyeView() {}
  };
}

// ==========================================================================
// Zone Drawer Rendering & Spatial Mode Sync
// ==========================================================================
function openZoneDrawer(islandId) {
  const island = ISLANDS.find((it) => it.id === islandId);
  if (!island) return;
  state.selectedIslandId = island.id;

  const isEn = state.lang === "en";
  els.zoneSelTag.textContent = isEn ? island.selCompetencyEn : island.selCompetencyZh;
  els.zoneTitle.textContent = isEn ? island.nameEn : island.nameZh;
  els.zoneDesc.textContent = isEn ? island.descEn : island.descZh;

  els.librarianAvatar.textContent = island.librarian.nameZh.slice(0, 1);
  els.librarianAvatar.style.background = island.librarian.accentHex;
  els.librarianName.textContent = isEn ? island.librarian.nameEn : island.librarian.nameZh;
  els.librarianRole.textContent = isEn ? island.librarian.roleEn : island.librarian.roleZh;
  els.librarianQuote.textContent = isEn ? island.librarian.greetingEn : island.librarian.greetingZh;

  // Sync pose pill highlight with current librarian pose (defaults to "roam")
  const activePose = typeof world.getAnimalPose === "function" ? world.getAnimalPose(island.id) : "roam";
  document.querySelectorAll(".pose-pill").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.pose === activePose);
  });

  // Breathing Widget visibility (shown on Island 02 Treehouse)
  els.breathingWidget.hidden = !island.hasBreathingCoach;

  // Render Curated Books
  els.bookList.innerHTML = "";
  island.books.forEach((book) => {
    const card = document.createElement("article");
    card.className = "book-card";
    card.innerHTML = `
      <div class="book-header">
        <div class="book-title">《${isEn ? book.titleEn : book.titleZh}》</div>
        <div class="book-author">${book.author}</div>
      </div>
      <p class="book-excerpt">${book.excerptZh}</p>
      <div class="book-meta-row">
        <span class="book-tag">${book.tagZh}</span>
        <span class="call-number-placeholder">${book.callNumber}</span>
      </div>
    `;
    els.bookList.appendChild(card);
  });

  // Reflection Bookmark Note
  els.reflectionPrompt.textContent = island.reflectionPromptZh;
  els.reflectionInput.value = state.notes[island.id] || "";

  els.zoneDrawer.classList.remove("is-hidden");
  els.zoneDrawerBody.scrollTop = 0;
  syncSpatialStatusUI();
}

function syncSpatialStatusUI() {
  const island = ISLANDS.find((it) => it.id === state.selectedIslandId);
  const isIndoor = world.isIndoor;
  const isFpv = world.isFpv;

  els.spaceStatusBadge.classList.toggle("is-indoor", isIndoor);
  if (isIndoor && island) {
    els.spaceStatusText.textContent = isFpv
      ? `室內漫步：${island.indoorTitleZh}`
      : `室內書屋：${island.indoorTitleZh}`;
  } else if (island) {
    els.spaceStatusText.textContent = isFpv
      ? `島上漫步：${island.nameZh}`
      : `戶外館區：${island.code} ${island.nameZh}`;
  } else {
    els.spaceStatusText.textContent = state.lang === "en" ? "Archipelago Overview" : "戶外群島漫遊";
  }

  els.btnQuickIndoor.hidden = !isIndoor;
  els.btnToggleIndoor.classList.toggle("is-active", isIndoor);
  els.lblToggleIndoor.textContent = isIndoor ? "返回戶外群島" : "進入室內書屋";

  els.btnToggleFpv.classList.toggle("is-active", isFpv);
  els.lblToggleFpv.textContent = isFpv ? "結束漫步視角" : "第一人稱漫步";
  els.fpvPad.hidden = !isFpv;
}

// ==========================================================================
// Mood-to-Book Matcher Modal
// ==========================================================================
function renderMoodModal() {
  const isEn = state.lang === "en";
  els.moodGrid.innerHTML = "";
  MOOD_PRESETS.forEach((m) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mood-option-card";
    btn.innerHTML = `
      <span class="mood-swatch" style="background:${m.swatch}"></span>
      <span class="mood-option-title">${isEn ? m.titleEn : m.titleZh}</span>
      <span class="mood-option-desc">${isEn ? m.descEn : m.descZh}</span>
      <span class="mood-option-dest">${m.destLabelZh}</span>
    `;
    btn.addEventListener("click", () => {
      els.moodModalBackdrop.hidden = true;
      if (world.isIndoor) world.exitIndoorRoom();
      world.focusIsland(m.islandId);
      openZoneDrawer(m.islandId);
      world.triggerAnimalGreeting(m.islandId);
      const targetIsland = ISLANDS.find((it) => it.id === m.islandId);
      if (targetIsland) {
        showToast(`已為你導航至「${targetIsland.nameZh}」，${targetIsland.librarian.nameZh}正在等你！`);
      }
    });
    els.moodGrid.appendChild(btn);
  });
}

// ==========================================================================
// Directory & Cross-Island Drift-Book Routes Drawer
// ==========================================================================
function renderDirectory() {
  const q = state.dirQuery.trim().toLowerCase();
  els.dirList.innerHTML = "";

  if (state.dirTab === "islands") {
    ISLANDS.filter((isl) => {
      if (!q) return true;
      const hay = [
        isl.nameZh,
        isl.nameEn,
        isl.selCompetencyZh,
        isl.librarian.nameZh,
        ...isl.books.map((b) => b.titleZh)
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    }).forEach((isl) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dir-item";
      btn.innerHTML = `
        <div class="dir-item-top">
          <span class="dir-item-title">${isl.code} · ${state.lang === "en" ? isl.nameEn : isl.nameZh}</span>
          <span class="book-tag">${isl.librarian.nameZh.split(" ")[0]}</span>
        </div>
        <span class="dir-item-sub">${isl.selCompetencyZh}｜館藏：${isl.books.map((b) => `《${b.titleZh}》`).join("、")}</span>
      `;
      btn.addEventListener("click", () => {
        if (world.isIndoor) world.exitIndoorRoom();
        world.focusIsland(isl.id);
        openZoneDrawer(isl.id);
        syncSpatialStatusUI();
      });
      els.dirList.appendChild(btn);
    });
  } else {
    BOOK_FLOWS.filter((f) => !q || (f.cargoZh + f.noteZh).toLowerCase().includes(q)).forEach((flow) => {
      const fromIsl = ISLANDS.find((i) => i.id === flow.from);
      const toIsl = ISLANDS.find((i) => i.id === flow.to);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dir-item";
      btn.innerHTML = `
        <div class="dir-item-top">
          <span class="dir-item-title">${flow.cargoZh}</span>
          <span class="book-tag">${fromIsl?.code} ⇄ ${toIsl?.code}</span>
        </div>
        <span class="dir-item-sub">${flow.noteZh}</span>
      `;
      btn.addEventListener("click", () => {
        if (world.isIndoor) world.exitIndoorRoom();
        world.focusIsland(flow.to);
        openZoneDrawer(flow.to);
        syncSpatialStatusUI();
      });
      els.dirList.appendChild(btn);
    });
  }
}

// ==========================================================================
// 4-4-6 Breathing UI Synchronizer
// ==========================================================================
function startBreathingUiLoop() {
  const tick = () => {
    const sec = (performance.now() / 1000) % 14;
    els.breathOrbUi.classList.remove("is-inhale", "is-hold", "is-exhale");
    if (sec < 4) {
      els.breathOrbUi.classList.add("is-inhale");
      els.breathPhaseLabel.textContent = "吸氣 4 秒 · 感受微風與書香";
    } else if (sec < 8) {
      els.breathOrbUi.classList.add("is-hold");
      els.breathPhaseLabel.textContent = "停留 4 秒 · 溫柔覺察當下";
    } else {
      els.breathOrbUi.classList.add("is-exhale");
      els.breathPhaseLabel.textContent = "吐氣 6 秒 · 慢慢放下緊繃";
    }
  };
  tick();
  window.setInterval(tick, 1000);
}

// ==========================================================================
// Event Listeners
// ==========================================================================
els.btnMoodMatcher.addEventListener("click", () => {
  renderMoodModal();
  els.moodModalBackdrop.hidden = false;
});

els.btnCloseMoodModal.addEventListener("click", () => {
  els.moodModalBackdrop.hidden = true;
});

els.moodModalBackdrop.addEventListener("click", (e) => {
  if (e.target === els.moodModalBackdrop) els.moodModalBackdrop.hidden = true;
});

els.btnOverview.addEventListener("click", () => {
  els.zoneDrawer.classList.add("is-hidden");
  state.selectedIslandId = null;
  world.resetOverview();
  syncSpatialStatusUI();
});

els.btnDirectory.addEventListener("click", () => {
  const willOpen = els.directoryDrawer.classList.contains("is-hidden");
  els.directoryDrawer.classList.toggle("is-hidden", !willOpen);
  els.btnDirectory.classList.toggle("is-active", willOpen);
  if (willOpen) renderDirectory();
});

els.btnCloseDirectory.addEventListener("click", () => {
  els.directoryDrawer.classList.add("is-hidden");
  els.btnDirectory.classList.remove("is-active");
});

document.querySelectorAll("[data-dir-tab]").forEach((tabBtn) => {
  tabBtn.addEventListener("click", () => {
    state.dirTab = tabBtn.dataset.dirTab;
    document.querySelectorAll("[data-dir-tab]").forEach((b) => b.classList.toggle("is-active", b === tabBtn));
    renderDirectory();
  });
});

els.dirSearchInput.addEventListener("input", (e) => {
  state.dirQuery = e.target.value;
  renderDirectory();
});

els.btnLang.addEventListener("click", () => {
  state.lang = state.lang === "zh" ? "en" : "zh";
  const isEn = state.lang === "en";
  els.btnLang.querySelector("span").textContent = isEn ? "中" : "EN";
  els.schoolNameLabel.textContent = isEn ? SITE_CONFIG.schoolNameEn : els.tweakSchoolInput.value || SITE_CONFIG.schoolNameZh;
  els.titleMainLabel.textContent = isEn ? SITE_CONFIG.titleMainEn : SITE_CONFIG.titleMainZh;
  els.titleAccentLabel.textContent = isEn ? SITE_CONFIG.titleAccentEn : SITE_CONFIG.titleAccentZh;
  els.subtitleLabel.textContent = isEn ? SITE_CONFIG.subtitleEn : SITE_CONFIG.subtitleZh;
  els.lblMoodBtn.textContent = isEn ? "Mood & Books" : "今日心情選書";
  els.lblOverviewBtn.textContent = isEn ? "Overview" : "群島全景";
  els.lblDirBtn.textContent = isEn ? "Directory" : "館區與漂書";
  world.setLanguage(state.lang);
  if (state.selectedIslandId && !els.zoneDrawer.classList.contains("is-hidden")) {
    openZoneDrawer(state.selectedIslandId);
  }
  renderDirectory();
  syncSpatialStatusUI();
});

els.btnCloseZone.addEventListener("click", () => {
  els.zoneDrawer.classList.add("is-hidden");
});

els.btnToggleIndoor.addEventListener("click", () => {
  if (!state.selectedIslandId) state.selectedIslandId = "atrium";
  if (world.isIndoor) {
    world.exitIndoorRoom();
    showToast("已回到戶外閱讀群島");
  } else {
    world.enterIndoorRoom(state.selectedIslandId);
    const isl = ISLANDS.find((i) => i.id === state.selectedIslandId);
    showToast(`已進入「${isl?.indoorTitleZh || "室內書屋"}」，可拖曳環視或切換第一人稱漫步`);
  }
  syncSpatialStatusUI();
});

els.btnQuickIndoor.addEventListener("click", () => {
  world.exitIndoorRoom();
  syncSpatialStatusUI();
});

els.btnToggleFpv.addEventListener("click", () => {
  const next = !world.isFpv;
  world.setFirstPersonMode(next);
  if (next) {
    showToast("已開啟第一人稱漫步：拖曳畫面轉頭，使用 WASD／方向鍵或左下按鈕移動");
  }
  syncSpatialStatusUI();
});

// On-screen FPV D-Pad bindings
document.querySelectorAll("[data-move]").forEach((btn) => {
  const dir = btn.dataset.move;
  const press = (e) => {
    e.preventDefault();
    btn.classList.add("is-pressed");
    world.setMoveDirection(dir, true);
  };
  const release = () => {
    btn.classList.remove("is-pressed");
    world.setMoveDirection(dir, false);
  };
  btn.addEventListener("pointerdown", press);
  btn.addEventListener("pointerup", release);
  btn.addEventListener("pointerleave", release);
  btn.addEventListener("pointercancel", release);
});

// Animal Librarian Greeting & Poses
els.btnGreetAnimal.addEventListener("click", () => {
  if (state.selectedIslandId) {
    world.triggerAnimalGreeting(state.selectedIslandId);
  }
});

document.querySelectorAll(".pose-pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    const pose = pill.dataset.pose;
    document.querySelectorAll(".pose-pill").forEach((p) => p.classList.toggle("is-active", p === pill));
    if (state.selectedIslandId) {
      world.setAnimalPose(state.selectedIslandId, pose);
      soundscape.playAnimalChime(ISLANDS.find((i) => i.id === state.selectedIslandId)?.librarian.species);
    }
  });
});

// Save & Export Personal SEL Reading Bookmark
els.btnSaveBookmark.addEventListener("click", () => {
  if (!state.selectedIslandId) return;
  state.notes[state.selectedIslandId] = els.reflectionInput.value.trim();
  saveNotes();
  showToast("已將這張心情書籤保存在本機瀏覽器中");
});

els.btnExportBookmark.addEventListener("click", () => {
  const isl = ISLANDS.find((i) => i.id === state.selectedIslandId) || ISLANDS[0];
  const currentNote = els.reflectionInput.value.trim() || "（尚未填寫個人筆記）";
  const lines = [
    `【${SITE_CONFIG.titleMainZh} · ${SITE_CONFIG.titleAccentZh}｜閱讀與心情書籤卡】`,
    `學校／單位：${els.schoolNameLabel.textContent}`,
    `造訪館區：${isl.code} ${isl.nameZh}（${isl.selCompetencyZh}）`,
    `陪伴館員：${isl.librarian.nameZh}（${isl.librarian.roleZh}）`,
    `館員悄悄話：${isl.librarian.greetingZh}`,
    "",
    "── 推薦共讀書單 ──",
    ...isl.books.map((b, i) => `${i + 1}. 《${b.titleZh}》／${b.author}\n   書摘：${b.excerptZh}`),
    "",
    "── 我的心情反思書籤 ──",
    `提問：${isl.reflectionPromptZh}`,
    `紀錄：${currentNote}`,
    `匯出時間：${new Date().toLocaleString("zh-TW")}`
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `森嶼書屋_心情書籤_${isl.code}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("已下載閱讀反思書籤卡 (.txt)");
});

// WebAudio Soundscape Controls
els.btnSoundToggle.addEventListener("click", () => {
  const isNowOn = soundscape.toggle();
  els.btnSoundToggle.classList.toggle("is-active", isNowOn);
  els.lblSoundBtn.textContent = isNowOn ? "書屋白噪音：開" : "書屋白噪音：關";
  els.soundPopover.hidden = !isNowOn;
});

els.btnCloseSound.addEventListener("click", () => {
  els.soundPopover.hidden = true;
});

document.querySelectorAll("[data-sound-channel]").forEach((slider) => {
  slider.addEventListener("input", (e) => {
    const ch = slider.dataset.soundChannel;
    const val = Number(e.target.value);
    soundscape.setChannelLevel(ch, val / 100);
    const label = document.querySelector(`[data-sound-val="${ch}"]`);
    if (label) label.textContent = `${val}%`;
    if (!soundscape.enabled && val > 0) {
      soundscape.toggle(true);
      els.btnSoundToggle.classList.add("is-active");
      els.lblSoundBtn.textContent = "書屋白噪音：開";
    }
  });
});

// Bottom HUD Time-of-Day & Simulation Toggles
document.querySelectorAll("[data-time]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.time;
    const preset = TIME_PRESETS[key];
    if (!preset) return;
    document.querySelectorAll("[data-time]").forEach((b) => b.classList.toggle("is-active", b === btn));
    els.hudClockTime.textContent = preset.clock;
    els.hudClockSub.textContent = `${preset.labelZh}閱讀`;
    world.applyTimeOfDay(key);
  });
});

els.btnToggleLabels.addEventListener("click", () => {
  state.showLabels = !state.showLabels;
  els.btnToggleLabels.classList.toggle("is-active", state.showLabels);
  world.setSimulationOptions({ showLabels: state.showLabels });
});

els.btnToggleCouriers.addEventListener("click", () => {
  state.showCouriers = !state.showCouriers;
  els.btnToggleCouriers.classList.toggle("is-active", state.showCouriers);
  world.setSimulationOptions({ showCouriers: state.showCouriers });
});

els.btnToggleArcs.addEventListener("click", () => {
  state.showArcs = !state.showArcs;
  els.btnToggleArcs.classList.toggle("is-active", state.showArcs);
  world.setSimulationOptions({ showArcs: state.showArcs });
});

els.btnBirdsEye.addEventListener("click", () => {
  world.setBirdsEyeView();
  syncSpatialStatusUI();
});

els.btnPauseSim.addEventListener("click", () => {
  state.isPaused = !state.isPaused;
  els.btnPauseSim.classList.toggle("is-active", state.isPaused);
  els.btnPauseSim.textContent = state.isPaused ? "恢復動態" : "暫停動態";
  world.setSimulationOptions({ isPaused: state.isPaused });
});

// Tweaks Panel Bindings
els.btnTweaks.addEventListener("click", () => {
  const willShow = els.tweaksPanel.hidden;
  els.tweaksPanel.hidden = !willShow;
  els.btnTweaks.setAttribute("aria-expanded", String(willShow));
});

els.btnCloseTweaks.addEventListener("click", () => {
  els.tweaksPanel.hidden = true;
  els.btnTweaks.setAttribute("aria-expanded", "false");
});

els.tweakSchoolInput.addEventListener("input", (e) => {
  const v = e.target.value.trim();
  els.schoolNameLabel.textContent = v || SITE_CONFIG.schoolNameZh;
});

els.tweakSurfaceTheme.addEventListener("change", (e) => {
  const val = e.target.value;
  if (val === "parchment") {
    delete document.body.dataset.surfaceTheme;
  } else {
    document.body.dataset.surfaceTheme = val;
  }
});

els.tweakParticles.addEventListener("change", (e) => {
  world.setSimulationOptions({ particleMode: e.target.value });
});

els.tweakCameraLens.addEventListener("change", (e) => {
  world.setSimulationOptions({ fov: Number(e.target.value) });
});

// Kick off breathing loop & render initial mood options
startBreathingUiLoop();
renderMoodModal();

// 通知 PWA 啟動器：3D 場景與介面已就緒（淡出啟動畫面、處理捷徑）
window.dispatchEvent(new Event("app:ready"));
