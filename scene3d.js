// ==========================================================================
// 森嶼書屋 · 心靈微光圖書館 — Procedural 3D Archipelago, Cute Animals & Indoor Rooms
// ==========================================================================

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { ISLANDS, BOOK_FLOWS, TIME_PRESETS } from "./data.js";

export class LibraryWorld3D {
  constructor({ stageEl, css2dEl, onSelectIsland, onAnimalInteract, onFlowEvent }) {
    this.stageEl = stageEl;
    this.css2dEl = css2dEl;
    this.onSelectIsland = onSelectIsland;
    this.onAnimalInteract = onAnimalInteract;
    this.onFlowEvent = onFlowEvent;

    this.lang = "zh";
    this.timeKey = "day";
    this.isIndoor = false;
    this.isFpv = false;
    this.isPaused = false;
    this.showLabels = true;
    this.showCouriers = true;
    this.showArcs = true;
    this.particleMode = "normal";
    this.selectedIslandId = null;

    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.islandRecords = new Map();
    this.clickableMeshes = [];
    this.emissiveWindows = [];
    this.lanternLights = [];
    this.couriers = [];
    this.arcLines = [];
    this.outdoorPins = [];
    this.stationPins = [];
    this.breathOrbs = [];
    this.activeAnimals = [];
    this.indoorAnimals = [];

    this.moveState = { forward: false, backward: false, left: false, right: false };
    this.fpvYaw = 0;
    this.fpvPitch = -0.06;
    this._pointerDownPos = new THREE.Vector2();
    this._isLookingFpv = false;

    this.camAnim = null;
    this.clock = new THREE.Clock();
    this.webglAvailable = false;

    // 3D 優化：共用幾何/材質快取、天空雲朵、星空、時段平滑過渡、懸停高亮
    this.clouds = [];
    this._geoCache = new Map();
    this._matCache = new Map();
    this._timeTween = null;
    this._hoverIslandId = null;
    this._lastHoverCheck = 0;
    this._isRunning = true;
    this._fpsSamples = [];
    this._fpsCheckAt = 0;

    // 依裝置能力決定畫質等級（手機 / 低記憶體裝置採省電設定）
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const vw = window.innerWidth || screen.width || 1280;
    const vh = window.innerHeight || screen.height || 720;
    const smallScreen = Math.min(vw, vh) < 600;
    const lowMem = typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 4;
    this.quality = coarse || smallScreen || lowMem ? "low" : "high";
    this.maxPixelRatio = this.quality === "low" ? 1.5 : 2;
    this.currentPixelRatio = Math.min(window.devicePixelRatio || 1, this.maxPixelRatio);

    if (!this._initEngine()) {
      return;
    }
    this._buildSkyAndWater();
    this._buildSkyDecor();
    this._buildArchipelago();
    this._buildBridgesAndFlows();
    this._buildParticles();
    this._buildFocusRing();
    this._buildIndoorContainer();
    this.applyTimeOfDay("day", true);
    this._bindEvents();
    this._playIntroFlight();
    this._animate();
  }

  // 直式手機螢幕時自動拉遠鏡頭，讓整座群島完整入鏡
  _aspectFactor() {
    let aspect = this.camera ? this.camera.aspect : window.innerWidth / window.innerHeight;
    if (!Number.isFinite(aspect) || aspect <= 0) aspect = 1.6;
    if (aspect >= 1.3) return 1;
    return THREE.MathUtils.clamp(Math.pow(1.3 / aspect, 0.55), 1, 1.9);
  }

  _overviewPose() {
    const f = this._aspectFactor();
    const target = new THREE.Vector3(0, 1.0, -1.0);
    // 直式螢幕：俯角加大（更接近鳥瞰），讓上下延伸的群島填滿畫面高度
    const portrait = THREE.MathUtils.clamp((f - 1) / 0.9, 0, 1);
    const offset = new THREE.Vector3(0, 30 * (1 + portrait * 0.3), 48 * (1 - portrait * 0.38)).multiplyScalar(f * (1 + portrait * 0.16));
    return { pos: target.clone().add(offset), target };
  }

  _playIntroFlight() {
    const { pos, target } = this._overviewPose();
    if (this.reducedMotion) {
      this.camera.position.copy(pos);
      this.controls.target.copy(target);
      this.controls.update();
      return;
    }
    this.camera.position.set(-38, 52, 78).multiplyScalar(this._aspectFactor());
    this.controls.target.copy(target);
    this.controls.update();
    this._flyCamera(pos, target, 2.6);
  }

  _initEngine() {
    // 背景分頁或隱藏的 iframe 中開啟時，視窗尺寸可能暫時為 0，以安全預設值避免鏡頭 NaN
    const w = this.stageEl.clientWidth || window.innerWidth || 1280;
    const h = this.stageEl.clientHeight || window.innerHeight || 720;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xd9e6e4, 0.0082);

    this.camera = new THREE.PerspectiveCamera(44, w / h, 0.2, 320);
    this.camera.position.set(0, 31, 47);

    const useAA = this.quality === "high" || (window.devicePixelRatio || 1) < 2;
    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: useAA,
        powerPreference: this.quality === "high" ? "high-performance" : "default"
      });
    } catch (err) {
      try {
        this.renderer = new THREE.WebGLRenderer({ antialias: false });
      } catch (fallbackErr) {
        console.warn("WebGL initialization failed:", fallbackErr || err);
        this._renderWebglFallback();
        return false;
      }
    }
    this.webglAvailable = true;
    this.renderer.setPixelRatio(this.currentPixelRatio);
    this.renderer.setSize(w, h);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = this.quality === "high" ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.06;
    this.stageEl.appendChild(this.renderer.domElement);

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(w, h);
    this.css2dEl.appendChild(this.labelRenderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.065;
    this.controls.maxPolarAngle = Math.PI * 0.465;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 76 * this._aspectFactor();
    this.controls.target.set(0, 1.2, -1.5);
    this.controls.enablePan = true;
    this.controls.screenSpacePanning = false;
    this.controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    this.controls.addEventListener("start", () => {
      // 使用者手動拖曳時中斷自動運鏡，避免搶鏡頭
      this.camAnim = null;
    });

    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x6e7f63, 0.96);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff5e0, 1.35);
    this.sunLight.position.set(22, 38, 24);
    this.sunLight.castShadow = true;
    const shadowSize = this.quality === "high" ? 2048 : 1024;
    this.sunLight.shadow.mapSize.set(shadowSize, shadowSize);
    this.sunLight.shadow.normalBias = 0.02;
    this.sunLight.shadow.camera.near = 4;
    this.sunLight.shadow.camera.far = 110;
    const d = 34;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    this.archipelagoGroup = new THREE.Group();
    this.scene.add(this.archipelagoGroup);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    return true;
  }

  _renderWebglFallback() {
    if (!this.stageEl) return;
    const box = document.createElement("div");
    box.className = "webgl-fallback-card";
    box.innerHTML = `
      <h3>目前瀏覽器環境尚未啟用 3D 圖形加速（WebGL）</h3>
      <p>您仍可使用上方「今日心情選書」與右側「館區與漂書」瀏覽全部六座閱讀館區、動物館員語錄與療癒書單，並收藏閱讀反思書籤。</p>
    `;
    this.stageEl.appendChild(box);
  }

  _buildSkyAndWater() {
    // Gradient Sky Dome
    const skyGeo = new THREE.SphereGeometry(150, 32, 20);
    this.skyUniforms = {
      topColor: { value: new THREE.Color("#b8d6da") },
      bottomColor: { value: new THREE.Color("#eef3ec") },
      sunDir: { value: new THREE.Vector3(0.4, 0.6, 0.5).normalize() },
      sunColor: { value: new THREE.Color("#fff5e0") },
      sunGlow: { value: 0.6 }
    };
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: this.skyUniforms,
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform vec3 sunDir;
        uniform vec3 sunColor;
        uniform float sunGlow;
        varying vec3 vWorldPos;
        void main() {
          vec3 dir = normalize(vWorldPos);
          float h = clamp((dir.y + 0.08) * 1.35, 0.0, 1.0);
          vec3 col = mix(bottomColor, topColor, pow(h, 0.75));
          // 太陽／月亮光暈與地平線柔光
          float s = max(dot(dir, normalize(sunDir)), 0.0);
          col += sunColor * (pow(s, 900.0) * 1.6 + pow(s, 24.0) * 0.28 + pow(s, 4.0) * 0.08) * sunGlow;
          col += bottomColor * pow(1.0 - abs(dir.y), 10.0) * 0.12;
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }
      `
    });
    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.skyDome.renderOrder = -1;
    this.scene.add(this.skyDome);

    // Gentle Celadon Lake Water（GPU 頂點波動 + 深淺色漸層 + 波光閃爍）
    const waterSeg = this.quality === "high" ? 72 : 48;
    const waterGeo = new THREE.PlaneGeometry(220, 220, waterSeg, waterSeg);
    waterGeo.rotateX(-Math.PI / 2);
    this.waterUniforms = {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color("#679296") },
      uSparkle: { value: 0.5 },
      uWaveAmp: { value: this.reducedMotion ? 0.0 : 1.0 }
    };
    this.waterMat = new THREE.MeshStandardMaterial({
      color: 0x8fb6b8,
      roughness: 0.3,
      metalness: 0.1,
      flatShading: true
    });
    this.waterMat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.waterUniforms);
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          "#include <common>\nuniform float uTime;\nuniform float uWaveAmp;\nvarying vec3 vWaterPos;"
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          float w1 = sin(position.x * 0.14 + uTime * 1.1) * 0.08;
          float w2 = cos(position.z * 0.14 + uTime * 0.9) * 0.08;
          float w3 = sin((position.x + position.z) * 0.32 + uTime * 1.7) * 0.035;
          transformed.y += (w1 + w2 + w3) * uWaveAmp;
          vWaterPos = position;`
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          "#include <common>\nuniform float uTime;\nuniform vec3 uDeep;\nuniform float uSparkle;\nvarying vec3 vWaterPos;"
        )
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          float waterDist = length(vWaterPos.xz);
          diffuseColor.rgb = mix(diffuseColor.rgb, uDeep, smoothstep(16.0, 72.0, waterDist));`
        )
        .replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>
          vec2 wp2 = vWaterPos.xz;
          float sp = sin(wp2.x * 1.31 + uTime * 1.4 + sin(wp2.y * 0.47 + uTime * 0.3) * 2.6)
                   * sin(wp2.y * 1.73 - uTime * 1.1 + sin(wp2.x * 0.39 - uTime * 0.2) * 2.9);
          sp = pow(max(sp, 0.0), 48.0) * (1.0 - smoothstep(18.0, 55.0, waterDist)) * 0.7;
          totalEmissiveRadiance += vec3(1.0, 0.95, 0.82) * sp * uSparkle;`
        );
    };
    this.waterMesh = new THREE.Mesh(waterGeo, this.waterMat);
    this.waterMesh.position.y = -0.55;
    this.waterMesh.receiveShadow = true;
    this.archipelagoGroup.add(this.waterMesh);

    // Distant Forest Crescent & Scenic Islets
    const shoreMat = new THREE.MeshStandardMaterial({ color: 0xcfd6be, roughness: 0.9 });
    const distantPositions = [
      [-34, -0.45, -34, 15],
      [0, -0.45, -42, 18],
      [34, -0.45, -32, 14],
      [-38, -0.45, 8, 11],
      [38, -0.45, 10, 11]
    ];
    distantPositions.forEach(([x, y, z, r]) => {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.88, r, 1.4, 8), shoreMat);
      base.position.set(x, y, z);
      base.receiveShadow = true;
      this.archipelagoGroup.add(base);
      for (let i = 0; i < 9; i++) {
        const angle = (i / 9) * Math.PI * 2 + (x * 0.1);
        const dist = r * (0.25 + (i % 3) * 0.22);
        const tree = this._createStylizedTree(i % 2 === 0 ? "pine" : "oak", 0.85 + (i % 3) * 0.25);
        tree.position.set(x + Math.cos(angle) * dist, y + 0.7, z + Math.sin(angle) * dist);
        this.archipelagoGroup.add(tree);
      }
    });
  }

  // 柔光圓點貼圖（星星、螢火蟲共用）
  _getSoftDotTexture() {
    if (this._softDotTex) return this._softDotTex;
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.25, "rgba(255,255,255,0.85)");
    grad.addColorStop(0.6, "rgba(255,255,255,0.18)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    this._softDotTex = new THREE.CanvasTexture(canvas);
    this._softDotTex.colorSpace = THREE.SRGBColorSpace;
    return this._softDotTex;
  }

  _buildSkyDecor() {
    // 星空（夜晚與黃昏淡入）
    const starCount = this.quality === "high" ? 900 : 500;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(THREE.MathUtils.lerp(0.08, 1, Math.random()));
      const r = 138;
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.cos(phi);
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    this.starMat = new THREE.PointsMaterial({
      color: 0xfff6e0,
      size: 2.4,
      sizeAttenuation: false,
      map: this._getSoftDotTexture(),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      fog: false
    });
    this.stars = new THREE.Points(starGeo, this.starMat);
    this.stars.visible = false;
    this.scene.add(this.stars);

    // 低多邊形漂浮雲朵
    this.cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.32,
      roughness: 1,
      flatShading: true
    });
    const puffGeo = new THREE.IcosahedronGeometry(1, 1);
    const cloudCount = this.quality === "high" ? 9 : 6;
    for (let i = 0; i < cloudCount; i++) {
      const cloud = new THREE.Group();
      const puffs = 3 + (i % 3);
      for (let p = 0; p < puffs; p++) {
        const puff = new THREE.Mesh(puffGeo, this.cloudMat);
        const s = 1.4 + Math.random() * 1.3;
        puff.scale.set(s * 1.25, s * 0.8, s);
        puff.position.set((p - puffs / 2) * 1.7 + Math.random() * 0.6, Math.random() * 0.7, Math.random() * 1.2 - 0.6);
        cloud.add(puff);
      }
      // 雲朵只分布在群島後方的弧線上（遠景），沿弧線緩慢來回飄移，不會擋住鏡頭
      const arcStart = Math.PI * 1.08;
      const arcEnd = Math.PI * 1.92;
      const angle = THREE.MathUtils.lerp(arcStart, arcEnd, (i + Math.random() * 0.6) / cloudCount);
      const dist = 62 + Math.random() * 22;
      cloud.scale.setScalar(1.3 + Math.random() * 0.9);
      cloud.userData.angle = angle;
      cloud.userData.dist = dist;
      cloud.userData.arc = [arcStart, arcEnd];
      cloud.userData.dir = Math.random() < 0.5 ? 1 : -1;
      cloud.userData.speed = (0.25 + Math.random() * 0.35) / dist;
      cloud.userData.bob = Math.random() * Math.PI * 2;
      cloud.userData.baseY = 9 + Math.random() * 9;
      cloud.position.set(Math.cos(angle) * dist, cloud.userData.baseY, Math.sin(angle) * dist);
      this.scene.add(cloud);
      this.clouds.push(cloud);
    }
  }

  // 聚焦島嶼時，水面上的琥珀光環
  _buildFocusRing() {
    const ringGeo = new THREE.RingGeometry(1, 1.18, 48);
    ringGeo.rotateX(-Math.PI / 2);
    this.focusRingMat = new THREE.MeshBasicMaterial({
      color: 0xf0b562,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.focusRing = new THREE.Mesh(ringGeo, this.focusRingMat);
    this.focusRing.position.y = -0.36;
    this.focusRing.visible = false;
    this.scene.add(this.focusRing);
  }

  _buildArchipelago() {
    ISLANDS.forEach((island) => {
      const group = new THREE.Group();
      group.position.set(island.pos[0], island.pos[1], island.pos[2]);
      group.userData = { islandId: island.id };

      // Water Foam Ring
      const foamGeo = new THREE.CylinderGeometry(island.radius + 0.55, island.radius + 0.75, 0.12, 6);
      const foamMat = new THREE.MeshBasicMaterial({ color: 0xf7f6ee, transparent: true, opacity: 0.52 });
      const foam = new THREE.Mesh(foamGeo, foamMat);
      foam.position.y = -0.48;
      group.add(foam);

      // Stone Sub-base
      const subGeo = new THREE.CylinderGeometry(island.radius * 0.97, island.radius * 0.84, 1.35, 6);
      const subMat = new THREE.MeshStandardMaterial({ color: 0x9e9589, roughness: 0.88, flatShading: true });
      const subMesh = new THREE.Mesh(subGeo, subMat);
      subMesh.position.y = -0.62;
      subMesh.receiveShadow = true;
      group.add(subMesh);

      // Colored Accent Rim Band
      const rimGeo = new THREE.CylinderGeometry(island.radius * 1.0, island.radius * 0.98, 0.28, 6);
      const rimMat = new THREE.MeshStandardMaterial({ color: island.rimColor, roughness: 0.65 });
      const rimMesh = new THREE.Mesh(rimGeo, rimMat);
      rimMesh.position.y = 0.08;
      rimMesh.receiveShadow = true;
      group.add(rimMesh);

      // Top Reading Deck
      const topGeo = new THREE.CylinderGeometry(island.radius * 0.96, island.radius * 0.99, 0.34, 6);
      const topMat = new THREE.MeshStandardMaterial({ color: island.groundColor, roughness: 0.85 });
      const topMesh = new THREE.Mesh(topGeo, topMat);
      topMesh.position.y = 0.32;
      topMesh.receiveShadow = true;
      topMesh.userData = { islandId: island.id, kind: "island" };
      group.add(topMesh);
      this.clickableMeshes.push(topMesh);

      // Build Island-Specific Landmark & Props
      this._populateIslandLandmark(group, island);

      const islandObstacles = this._getIslandObstacles(island);
      const islandMaxRoamR = island.radius * 0.73;
      const islandAnimals = [];

      // Add Cute 3D Animal Librarian on the Island (roams freely around the island!)
      const animal = this._createCuteAnimal(island.librarian.species, {
        islandId: island.id,
        scale: 1.08,
        role: "librarian",
        hasBook: true
      });
      animal.position.set(1.55, 0.50, 2.35);
      animal.rotation.y = -0.35;
      this._initAnimalRoam(animal, {
        boundsType: "circle",
        maxR: islandMaxRoamR,
        groundY: 0.50,
        obstacles: islandObstacles,
        initialDelay: 0.2
      });
      group.add(animal);

      // Speech Bubble CSS2D above Animal (hidden until clicked or greeted)
      const bubbleEl = document.createElement("div");
      bubbleEl.className = "speech-bubble-2d";
      bubbleEl.style.opacity = "0";
      bubbleEl.textContent = island.librarian.greetingZh;
      const bubbleObj = new CSS2DObject(bubbleEl);
      bubbleObj.position.set(0, 2.55, 0);
      animal.add(bubbleObj);
      animal.userData.bubbleEl = bubbleEl;
      animal.userData.bubbleObj = bubbleObj;

      islandAnimals.push(animal);
      this.activeAnimals.push(animal);

      // Add 2 Visiting Cute Animal Friends per Island so diverse animals roam everywhere!
      const visitorMap = {
        atrium: ["capybara", "rabbit"],
        cove: ["deer", "owl"],
        treehouse: ["fox", "rabbit"],
        glasshouse: ["bear", "deer"],
        courtyard: ["capybara", "owl"],
        lighthouse: ["fox", "bear"]
      };
      const visitors = visitorMap[island.id] || ["rabbit", "fox"];
      visitors.forEach((visSpecies, vIdx) => {
        const visitor = this._createCuteAnimal(visSpecies, {
          islandId: island.id,
          scale: 0.88 + vIdx * 0.05,
          role: "visitor",
          hasBook: vIdx % 2 === 0
        });
        const startPos = this._findSafeSpot(
          { boundsType: "circle", maxR: islandMaxRoamR, obstacles: islandObstacles },
          islandAnimals
        );
        visitor.position.set(startPos.x, 0.50, startPos.z);
        visitor.rotation.y = Math.random() * Math.PI * 2;
        this._initAnimalRoam(visitor, {
          boundsType: "circle",
          maxR: islandMaxRoamR,
          groundY: 0.50,
          obstacles: islandObstacles,
          initialDelay: 0.1 + vIdx * 0.45
        });

        const visBubbleEl = document.createElement("div");
        visBubbleEl.className = "speech-bubble-2d";
        visBubbleEl.style.opacity = "0";
        const visBubbleObj = new CSS2DObject(visBubbleEl);
        visBubbleObj.position.set(0, 2.45, 0);
        visitor.add(visBubbleObj);
        visitor.userData.bubbleEl = visBubbleEl;
        visitor.userData.bubbleObj = visBubbleObj;

        group.add(visitor);
        islandAnimals.push(visitor);
        this.activeAnimals.push(visitor);
      });
      islandAnimals.forEach((a) => {
        a.userData.peers = islandAnimals;
      });

      // Island Overview CSS2D Pin
      const pinEl = document.createElement("button");
      pinEl.type = "button";
      pinEl.className = "island-pin";
      pinEl.innerHTML = `<span class="island-pin-code">${island.code}</span><span class="island-pin-text">${island.nameZh}</span>`;
      pinEl.addEventListener("click", (e) => {
        e.stopPropagation();
        this.focusIsland(island.id);
        this.onSelectIsland?.(island.id);
      });
      const pinObj = new CSS2DObject(pinEl);
      pinObj.position.set(0, -0.25, island.radius * 0.86);
      group.add(pinObj);
      this.outdoorPins.push({ obj: pinObj, el: pinEl, island });

      // Sub-station Pins (shown when focused on this island)
      island.stations.forEach((st, idx) => {
        const stEl = document.createElement("div");
        stEl.className = "station-pin";
        stEl.textContent = `${idx + 1}. ${st.titleZh}`;
        stEl.addEventListener("click", (e) => {
          e.stopPropagation();
          this.focusIsland(island.id);
          this.onSelectIsland?.(island.id);
        });
        const stObj = new CSS2DObject(stEl);
        stObj.position.set(st.offset[0], st.offset[1] + 0.8, st.offset[2]);
        stObj.visible = false;
        group.add(stObj);
        this.stationPins.push({ obj: stObj, el: stEl, islandId: island.id, station: st, index: idx });
      });

      this.archipelagoGroup.add(group);
      this.islandRecords.set(island.id, { group, island, animal, animals: islandAnimals, topMat });
    });
  }

  _populateIslandLandmark(group, island) {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xa67c52, roughness: 0.78 });
    const lightWoodMat = new THREE.MeshStandardMaterial({ color: 0xd9bf9c, roughness: 0.75 });
    const creamWallMat = new THREE.MeshStandardMaterial({ color: 0xf7f0e2, roughness: 0.82 });
    const sageRoofMat = new THREE.MeshStandardMaterial({ color: 0x4f735b, roughness: 0.68 });
    const windowMat = this._createWindowMaterial();

    // Decorative Trees & Lanterns common warmth
    const treeOffsets = [
      [-island.radius * 0.62, -island.radius * 0.42],
      [island.radius * 0.60, -island.radius * 0.40],
      [-island.radius * 0.56, island.radius * 0.45]
    ];
    treeOffsets.forEach(([tx, tz], idx) => {
      const t = this._createStylizedTree(idx % 2 === 0 ? "oak" : "pine", 0.92 + idx * 0.1);
      t.position.set(tx, 0.48, tz);
      group.add(t);
    });

    // Warm Street Lantern + Night Reading Glow on Animal Librarian
    const lantern = this._createStreetLantern();
    lantern.position.set(-2.5, 0.48, 2.7);
    group.add(lantern);

    const islandWarmLight = new THREE.PointLight(0xffc978, 0.1, 11);
    islandWarmLight.position.set(1.2, 2.8, 3.2);
    group.add(islandWarmLight);
    this.lanternLights.push({ light: islandWarmLight, baseIntensity: 1.45, alwaysWarm: false });

    // Decorative Stack of Giant Colorful Books
    const bookStack = this._createBookStack([0x4f735b, 0xe6a145, 0x679296]);
    bookStack.position.set(2.9, 0.5, 1.3);
    group.add(bookStack);

    if (island.id === "atrium") {
      // Domed Birch Library Rotunda
      const rotunda = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.0, 2.5, 12), creamWallMat);
      rotunda.position.set(0, 1.72, -1.4);
      rotunda.castShadow = true;
      rotunda.receiveShadow = true;
      rotunda.userData = { islandId: island.id };
      group.add(rotunda);
      this.clickableMeshes.push(rotunda);

      const dome = new THREE.Mesh(new THREE.SphereGeometry(2.95, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), sageRoofMat);
      dome.position.set(0, 2.92, -1.4);
      dome.castShadow = true;
      group.add(dome);

      // Glowing Windows around Rotunda
      for (let i = 0; i < 5; i++) {
        const ang = -Math.PI * 0.35 + (i / 4) * Math.PI * 0.7;
        const win = new THREE.Mesh(new RoundedBoxGeometry(0.65, 1.05, 0.12, 2, 0.05), windowMat);
        win.position.set(Math.sin(ang) * 2.88, 1.75, -1.4 + Math.cos(ang) * 2.88);
        win.rotation.y = ang;
        group.add(win);
      }

      // Belltower on the left
      const tower = new THREE.Mesh(new RoundedBoxGeometry(1.25, 3.4, 1.25, 3, 0.1), lightWoodMat);
      tower.position.set(-2.9, 2.15, -1.4);
      tower.castShadow = true;
      group.add(tower);
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.2, 4), sageRoofMat);
      spire.position.set(-2.9, 4.4, -1.4);
      spire.rotation.y = Math.PI / 4;
      group.add(spire);

      // Mood Compass Desk out front
      const desk = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.85, 0.65, 12), woodMat);
      desk.position.set(2.3, 0.82, 2.1);
      desk.castShadow = true;
      group.add(desk);
    } else if (island.id === "cove") {
      // Warm Spring Pool & Wooden Pergola
      const poolRim = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.5, 0.32, 16), lightWoodMat);
      poolRim.position.set(0.5, 0.62, -0.7);
      group.add(poolRim);
      const springWater = new THREE.Mesh(
        new THREE.CylinderGeometry(2.15, 2.15, 0.36, 16),
        new THREE.MeshStandardMaterial({ color: 0x8cc9c4, roughness: 0.2, emissive: 0x3b7875, emissiveIntensity: 0.22 })
      );
      springWater.position.set(0.5, 0.63, -0.7);
      group.add(springWater);

      // Floating Lotus Lanterns
      [[-0.2, -0.4], [1.2, -1.1], [0.8, 0.2]].forEach(([lx, lz]) => {
        const lotus = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), windowMat);
        lotus.position.set(lx, 0.86, lz);
        group.add(lotus);
      });

      // Waterside Cedar Pavilion
      const cabin = new THREE.Mesh(new RoundedBoxGeometry(2.8, 1.9, 2.1, 3, 0.12), creamWallMat);
      cabin.position.set(-1.6, 1.4, -2.0);
      cabin.castShadow = true;
      cabin.userData = { islandId: island.id };
      group.add(cabin);
      this.clickableMeshes.push(cabin);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(2.35, 1.1, 4), new THREE.MeshStandardMaterial({ color: 0x5c8589, roughness: 0.7 }));
      roof.position.set(-1.6, 2.85, -2.0);
      roof.rotation.y = Math.PI / 4;
      group.add(roof);

      const win = new THREE.Mesh(new RoundedBoxGeometry(1.1, 0.8, 0.12, 2, 0.04), windowMat);
      win.position.set(-1.6, 1.45, -0.94);
      group.add(win);
    } else if (island.id === "treehouse") {
      // Giant Trunk + Elevated Canopy Book Loft
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.55, 3.2, 9), woodMat);
      trunk.position.set(-1.1, 2.0, -1.2);
      trunk.castShadow = true;
      group.add(trunk);

      const loft = new THREE.Mesh(new RoundedBoxGeometry(3.1, 2.0, 2.6, 3, 0.14), lightWoodMat);
      loft.position.set(-1.1, 3.55, -1.2);
      loft.castShadow = true;
      loft.userData = { islandId: island.id };
      group.add(loft);
      this.clickableMeshes.push(loft);

      const canopy = new THREE.Mesh(
        new THREE.DodecahedronGeometry(2.6, 1),
        new THREE.MeshStandardMaterial({ color: 0x5d8464, roughness: 0.82, flatShading: true })
      );
      canopy.position.set(-1.1, 5.4, -1.3);
      canopy.castShadow = true;
      group.add(canopy);

      const loftWin = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.14, 16), windowMat);
      loftWin.rotation.x = Math.PI / 2;
      loftWin.position.set(-1.1, 3.6, 0.12);
      group.add(loftWin);

      // Synchronized 3D Breathing Glow-Orb on Pedestal
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 0.9, 10), creamWallMat);
      ped.position.set(2.1, 0.92, 0.5);
      group.add(ped);

      const orbMat = new THREE.MeshStandardMaterial({
        color: 0xfbe3b5,
        emissive: 0xe6a145,
        emissiveIntensity: 0.75,
        roughness: 0.2,
        transparent: true,
        opacity: 0.92
      });
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.68, 20, 16), orbMat);
      orb.position.set(2.1, 2.15, 0.5);
      group.add(orb);
      this.breathOrbs.push(orb);
    } else if (island.id === "glasshouse") {
      // Sunlit Botanical Glass Conservatory
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0xdcf0ea,
        roughness: 0.18,
        metalness: 0.1,
        transparent: true,
        opacity: 0.68
      });
      const baseWall = new THREE.Mesh(new RoundedBoxGeometry(3.8, 0.9, 2.8, 2, 0.08), creamWallMat);
      baseWall.position.set(0, 0.92, -1.3);
      baseWall.castShadow = true;
      group.add(baseWall);

      const glassBody = new THREE.Mesh(new RoundedBoxGeometry(3.65, 1.85, 2.65, 2, 0.08), glassMat);
      glassBody.position.set(0, 2.2, -1.3);
      glassBody.userData = { islandId: island.id };
      group.add(glassBody);
      this.clickableMeshes.push(glassBody);

      // Warm interior glow core inside Glasshouse
      const innerPlant = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.85, 0),
        new THREE.MeshStandardMaterial({ color: 0x5c8a67, roughness: 0.8, flatShading: true })
      );
      innerPlant.position.set(-0.7, 1.75, -1.3);
      group.add(innerPlant);

      const innerLamp = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), windowMat);
      innerLamp.position.set(0.8, 1.9, -1.3);
      group.add(innerLamp);

      // Shared Reading Table outside
      const table = new THREE.Mesh(new RoundedBoxGeometry(1.9, 0.55, 1.1, 2, 0.08), lightWoodMat);
      table.position.set(-2.0, 0.76, 1.8);
      table.castShadow = true;
      group.add(table);
    } else if (island.id === "courtyard") {
      // Warm Campfire Circle & Book-Sharing Pavilion
      const fireRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.78, 0.18, 8, 14),
        new THREE.MeshStandardMaterial({ color: 0x8b837a, roughness: 0.9 })
      );
      fireRing.rotation.x = Math.PI / 2;
      fireRing.position.set(0, 0.56, 0.6);
      group.add(fireRing);

      const flameMat = new THREE.MeshStandardMaterial({
        color: 0xffb84d,
        emissive: 0xe67e22,
        emissiveIntensity: 1.1,
        roughness: 0.3
      });
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.48, 1.05, 7), flameMat);
      flame.position.set(0, 1.05, 0.6);
      group.add(flame);
      this.campfireFlame = flame;

      const fireLight = new THREE.PointLight(0xffa447, 1.6, 11);
      fireLight.position.set(0, 1.6, 0.6);
      group.add(fireLight);
      this.lanternLights.push({ light: fireLight, baseIntensity: 1.5, alwaysWarm: true });

      // Log benches around campfire
      for (let i = 0; i < 3; i++) {
        const ang = Math.PI * 0.75 + i * 0.85;
        const bench = new THREE.Mesh(new RoundedBoxGeometry(1.35, 0.42, 0.52, 2, 0.1), woodMat);
        bench.position.set(Math.sin(ang) * 2.05, 0.68, 0.6 + Math.cos(ang) * 2.05);
        bench.rotation.y = ang;
        bench.castShadow = true;
        group.add(bench);
      }

      // Cozy Timber Book Pavilion
      const pav = new THREE.Mesh(new RoundedBoxGeometry(2.7, 2.1, 2.1, 3, 0.12), creamWallMat);
      pav.position.set(-1.7, 1.5, -2.0);
      pav.castShadow = true;
      pav.userData = { islandId: island.id };
      group.add(pav);
      this.clickableMeshes.push(pav);

      const pavRoof = new THREE.Mesh(
        new THREE.ConeGeometry(2.25, 1.15, 4),
        new THREE.MeshStandardMaterial({ color: 0xc97b36, roughness: 0.72 })
      );
      pavRoof.position.set(-1.7, 3.05, -2.0);
      pavRoof.rotation.y = Math.PI / 4;
      group.add(pavRoof);

      const pavWin = new THREE.Mesh(new RoundedBoxGeometry(0.95, 0.8, 0.12, 2, 0.04), windowMat);
      pavWin.position.set(-1.7, 1.55, -0.94);
      group.add(pavWin);
    } else if (island.id === "lighthouse") {
      // Stargazing Book-Lighthouse & Brass Telescope
      const towerBase = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.55, 4.2, 12), creamWallMat);
      towerBase.position.set(-1.3, 2.55, -1.3);
      towerBase.castShadow = true;
      towerBase.userData = { islandId: island.id };
      group.add(towerBase);
      this.clickableMeshes.push(towerBase);

      const stripe = new THREE.Mesh(
        new THREE.CylinderGeometry(1.28, 1.38, 0.95, 12),
        new THREE.MeshStandardMaterial({ color: 0x526b7a, roughness: 0.7 })
      );
      stripe.position.set(-1.3, 2.6, -1.3);
      group.add(stripe);

      const lanternRoom = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.05, 1.0, 10), windowMat);
      lanternRoom.position.set(-1.3, 5.1, -1.3);
      group.add(lanternRoom);

      const cap = new THREE.Mesh(
        new THREE.ConeGeometry(1.25, 1.0, 10),
        new THREE.MeshStandardMaterial({ color: 0x3b5260, roughness: 0.65 })
      );
      cap.position.set(-1.3, 6.05, -1.3);
      group.add(cap);

      // Brass Stargazing Telescope on Terrace
      const tripod = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.45, 0.95, 6), woodMat);
      tripod.position.set(2.0, 0.95, 0.8);
      group.add(tripod);
      const scope = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.19, 1.05, 10),
        new THREE.MeshStandardMaterial({ color: 0xe6a145, metalness: 0.45, roughness: 0.35 })
      );
      scope.position.set(2.0, 1.52, 0.8);
      scope.rotation.z = Math.PI / 3.2;
      group.add(scope);
    }
  }

  _createCuteAnimal(species, { islandId, scale = 1.0, isMini = false, registerClick, role = "librarian", hasBook = true } = {}) {
    const shouldRegisterClick = typeof registerClick === "boolean" ? registerClick : !isMini;
    const root = new THREE.Group();
    root.scale.setScalar(scale);
    root.userData = {
      kind: isMini ? "courier" : "animal",
      role,
      species,
      islandId,
      hasBook,
      pose: "roam",
      hopTime: -1,
      greetHoldTimer: 0,
      walkPhase: Math.random() * Math.PI * 2,
      isMoving: false,
      seed: Math.random() * 10
    };

    const palettes = {
      owl: { fur: 0x8d725b, belly: 0xf3e7d3, accent: 0x4f735b },
      capybara: { fur: 0xb98252, belly: 0xd6a87c, accent: 0xe68a2e },
      bear: { fur: 0x8c5f3e, belly: 0xe8d3b9, accent: 0x4f735b },
      rabbit: { fur: 0xf7f2ea, belly: 0xfffaf4, accent: 0xe6a7a1 },
      fox: { fur: 0xd9783b, belly: 0xf9efe2, accent: 0x2f2925 },
      deer: { fur: 0xc48f5a, belly: 0xf4e6d2, accent: 0x6e4e35 }
    };
    const pal = palettes[species] || palettes.owl;

    const furMat = new THREE.MeshStandardMaterial({ color: pal.fur, roughness: 0.82 });
    const bellyMat = new THREE.MeshStandardMaterial({ color: pal.belly, roughness: 0.85 });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x221e1d, roughness: 0.25 });
    const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const blushMat = new THREE.MeshBasicMaterial({ color: 0xeb9f96, transparent: true, opacity: 0.55 });

    const bodyPivot = new THREE.Group();
    root.add(bodyPivot);
    root.userData.bodyPivot = bodyPivot;

    // Chubby Torso
    const torso = new THREE.Mesh(new RoundedBoxGeometry(0.92, 0.96, 0.82, 4, 0.34), furMat);
    torso.position.y = 0.55;
    torso.castShadow = true;
    torso.userData = { islandId, kind: isMini ? "courier" : "animal", animalRoot: root };
    bodyPivot.add(torso);
    if (shouldRegisterClick) this.clickableMeshes.push(torso);

    // Soft Belly Patch
    const belly = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.66, 0.16, 3, 0.22), bellyMat);
    belly.position.set(0, 0.50, 0.38);
    bodyPivot.add(belly);

    // Head Pivot
    const head = new THREE.Group();
    head.position.set(0, 1.26, 0.04);
    bodyPivot.add(head);
    root.userData.head = head;

    const headGeo = species === "capybara"
      ? new RoundedBoxGeometry(0.84, 0.74, 0.98, 4, 0.30)
      : new RoundedBoxGeometry(0.88, 0.78, 0.82, 4, 0.34);
    const headMesh = new THREE.Mesh(headGeo, furMat);
    headMesh.castShadow = true;
    headMesh.userData = { islandId, kind: isMini ? "courier" : "animal", animalRoot: root };
    head.add(headMesh);
    if (shouldRegisterClick) this.clickableMeshes.push(headMesh);

    // Eyes, Catchlights & Rosy Cheeks
    const eyeZ = species === "capybara" ? 0.48 : 0.41;
    [-0.21, 0.21].forEach((ex) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), eyeMat);
      eye.position.set(ex, 0.05, eyeZ);
      if (species === "capybara") eye.scale.set(1.1, 0.55, 0.8);
      head.add(eye);

      const shine = new THREE.Mesh(new THREE.SphereGeometry(0.026, 6, 6), shineMat);
      shine.position.set(ex + 0.022, 0.075, eyeZ + 0.058);
      head.add(shine);

      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), blushMat);
      cheek.scale.set(1.2, 0.65, 0.4);
      cheek.position.set(ex * 1.38, -0.06, eyeZ - 0.02);
      head.add(cheek);
    });

    // Species-Specific Adorable Features
    if (species === "owl") {
      // Cream facial disc + round spectacles + amber beak + ear tufts
      const disc = new THREE.Mesh(new RoundedBoxGeometry(0.68, 0.52, 0.12, 3, 0.2), bellyMat);
      disc.position.set(0, 0.02, 0.37);
      head.add(disc);
      const beak = new THREE.Mesh(
        new THREE.ConeGeometry(0.09, 0.18, 6),
        new THREE.MeshStandardMaterial({ color: 0xe6a145, roughness: 0.5 })
      );
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, -0.04, 0.49);
      head.add(beak);
      const specMat = new THREE.MeshStandardMaterial({ color: 0xe6a145, metalness: 0.5, roughness: 0.3 });
      [-0.21, 0.21].forEach((gx) => {
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.018, 8, 16), specMat);
        rim.position.set(gx, 0.05, 0.44);
        head.add(rim);
      });
      [-0.32, 0.32].forEach((tx, idx) => {
        const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.26, 5), furMat);
        tuft.position.set(tx, 0.42, 0);
        tuft.rotation.z = idx === 0 ? 0.35 : -0.35;
        head.add(tuft);
      });
    } else if (species === "capybara") {
      // Darker snout front + tiny ears + Cute Tangerine on top of head!
      const snout = new THREE.Mesh(
        new RoundedBoxGeometry(0.46, 0.38, 0.22, 3, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x8c5e38, roughness: 0.85 })
      );
      snout.position.set(0, -0.05, 0.45);
      head.add(snout);
      [-0.28, 0.28].forEach((ex) => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), furMat);
        ear.position.set(ex, 0.36, -0.18);
        head.add(ear);
      });
      const yuzu = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 12, 10),
        new THREE.MeshStandardMaterial({ color: 0xf28c28, roughness: 0.45 })
      );
      yuzu.scale.set(1.08, 0.88, 1.08);
      yuzu.position.set(0, 0.47, 0.02);
      head.add(yuzu);
      const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 6, 6),
        new THREE.MeshStandardMaterial({ color: 0x4f735b })
      );
      leaf.scale.set(1.6, 0.4, 0.9);
      leaf.position.set(0.05, 0.60, 0.02);
      head.add(leaf);
    } else if (species === "bear") {
      // Round teddy ears + cream muzzle + knitted sage scarf
      [-0.33, 0.33].forEach((ex) => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 10), furMat);
        ear.position.set(ex, 0.38, -0.04);
        head.add(ear);
      });
      const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 10), bellyMat);
      muzzle.scale.set(1.15, 0.85, 0.8);
      muzzle.position.set(0, -0.08, 0.38);
      head.add(muzzle);
      const scarf = new THREE.Mesh(
        new THREE.TorusGeometry(0.36, 0.10, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0x4f735b, roughness: 0.85 })
      );
      scarf.rotation.x = Math.PI / 2;
      scarf.position.set(0, 0.96, 0.03);
      bodyPivot.add(scarf);
    } else if (species === "rabbit") {
      // Long soft drooping lop ears + pink nose + cotton tail
      [-0.42, 0.42].forEach((ex, idx) => {
        const lopEar = new THREE.Mesh(new RoundedBoxGeometry(0.20, 0.62, 0.22, 3, 0.10), furMat);
        lopEar.position.set(ex, 0.04, -0.02);
        lopEar.rotation.z = idx === 0 ? 0.28 : -0.28;
        head.add(lopEar);
      });
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), blushMat);
      nose.position.set(0, -0.04, 0.43);
      head.add(nose);
      const tail = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), furMat);
      tail.position.set(0, 0.38, -0.44);
      bodyPivot.add(tail);
    } else if (species === "fox") {
      // Pointed ears + fluffy russet/cream tail + white muzzle
      [-0.28, 0.28].forEach((ex, idx) => {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.36, 5), furMat);
        ear.position.set(ex, 0.48, -0.02);
        ear.rotation.z = idx === 0 ? 0.18 : -0.18;
        head.add(ear);
      });
      const muzzle = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.30, 8), bellyMat);
      muzzle.rotation.x = Math.PI / 2;
      muzzle.position.set(0, -0.08, 0.44);
      head.add(muzzle);
      const tail = new THREE.Mesh(new RoundedBoxGeometry(0.28, 0.28, 0.62, 3, 0.14), furMat);
      tail.position.set(0.18, 0.42, -0.56);
      tail.rotation.x = 0.45;
      tail.rotation.y = 0.35;
      bodyPivot.add(tail);
    } else if (species === "deer") {
      // Cute branched antlers + ears + brass collar
      const antlerMat = new THREE.MeshStandardMaterial({ color: 0x6e4e35, roughness: 0.8 });
      [-0.24, 0.24].forEach((ax, idx) => {
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.38, 6), antlerMat);
        stem.position.set(ax, 0.52, -0.04);
        stem.rotation.z = idx === 0 ? 0.28 : -0.28;
        head.add(stem);
        const tine = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.20, 6), antlerMat);
        tine.position.set(ax * 1.35, 0.58, -0.04);
        tine.rotation.z = idx === 0 ? 0.85 : -0.85;
        head.add(tine);
      });
      const collar = new THREE.Mesh(
        new THREE.TorusGeometry(0.34, 0.06, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0xe6a145, metalness: 0.4, roughness: 0.35 })
      );
      collar.rotation.x = Math.PI / 2;
      collar.position.set(0, 0.95, 0.03);
      bodyPivot.add(collar);
    }

    // Paws & Held Open Book
    const rightArm = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.42, 0.22, 2, 0.1), furMat);
    rightArm.position.set(0.46, 0.62, hasBook ? 0.20 : 0.06);
    rightArm.rotation.x = hasBook ? -0.5 : -0.12;
    bodyPivot.add(rightArm);
    root.userData.rightArm = rightArm;

    const leftArm = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.42, 0.22, 2, 0.1), furMat);
    leftArm.position.set(-0.46, 0.62, hasBook ? 0.20 : 0.06);
    leftArm.rotation.x = hasBook ? -0.5 : -0.12;
    bodyPivot.add(leftArm);
    root.userData.leftArm = leftArm;

    // Cute Open 3D Book held in front
    const bookGroup = new THREE.Group();
    bookGroup.position.set(0, 0.56, 0.56);
    bookGroup.rotation.x = -0.45;
    bookGroup.visible = hasBook;
    const coverMat = new THREE.MeshStandardMaterial({ color: pal.accent, roughness: 0.6 });
    const pageMat = new THREE.MeshStandardMaterial({ color: 0xfbf8f1, roughness: 0.85 });
    const leftPage = new THREE.Mesh(new RoundedBoxGeometry(0.28, 0.36, 0.05, 2, 0.02), coverMat);
    leftPage.position.x = -0.13;
    leftPage.rotation.y = 0.24;
    const rightPage = new THREE.Mesh(new RoundedBoxGeometry(0.28, 0.36, 0.05, 2, 0.02), coverMat);
    rightPage.position.x = 0.13;
    rightPage.rotation.y = -0.24;
    const innerSheet = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.33, 0.04, 2, 0.02), pageMat);
    innerSheet.position.z = 0.025;
    bookGroup.add(leftPage, rightPage, innerSheet);
    bodyPivot.add(bookGroup);
    root.userData.bookGroup = bookGroup;

    // Feet (stored for cute walking cycle)
    const leftFoot = new THREE.Mesh(new RoundedBoxGeometry(0.26, 0.18, 0.34, 2, 0.08), furMat);
    leftFoot.position.set(-0.24, 0.10, 0.10);
    bodyPivot.add(leftFoot);
    root.userData.leftFoot = leftFoot;

    const rightFoot = new THREE.Mesh(new RoundedBoxGeometry(0.26, 0.18, 0.34, 2, 0.08), furMat);
    rightFoot.position.set(0.24, 0.10, 0.10);
    bodyPivot.add(rightFoot);
    root.userData.rightFoot = rightFoot;

    return root;
  }

  // ========================================================================
  // Autonomous Animal Roaming & Smooth Obstacle Avoidance
  // ========================================================================
  _getIslandObstacles(island) {
    const r = island.radius;
    // Common trees, street lantern & giant book stack
    const obs = [
      [-r * 0.62, -r * 0.42, 0.95],
      [r * 0.60, -r * 0.40, 0.95],
      [-r * 0.56, r * 0.45, 0.95],
      [-2.5, 2.7, 0.55],
      [2.9, 1.3, 0.85]
    ];
    if (island.id === "atrium") {
      obs.push([0, -1.4, 3.45], [-2.9, -1.4, 1.15], [2.3, 2.1, 1.28]);
    } else if (island.id === "cove") {
      obs.push([0.5, -0.7, 2.88], [-1.6, -2.0, 2.05]);
    } else if (island.id === "treehouse") {
      obs.push([-1.1, -1.2, 1.95], [2.1, 0.5, 1.08]);
    } else if (island.id === "glasshouse") {
      obs.push([0, -1.3, 2.55], [-2.0, 1.8, 1.35]);
    } else if (island.id === "courtyard") {
      obs.push([0, 0.6, 2.65], [-1.7, -2.0, 2.02]);
    } else if (island.id === "lighthouse") {
      obs.push([-1.3, -1.3, 1.95], [2.0, 0.8, 0.88]);
    }
    return obs;
  }

  _findSafeSpot(roamCfg, peers = [], currentPos = null) {
    for (let attempt = 0; attempt < 28; attempt++) {
      let x = 0;
      let z = 0;
      if (roamCfg.boundsType === "rect") {
        x = THREE.MathUtils.randFloat(roamCfg.minX, roamCfg.maxX);
        z = THREE.MathUtils.randFloat(roamCfg.minZ, roamCfg.maxZ);
      } else {
        const ang = Math.random() * Math.PI * 2;
        const dist = (0.22 + Math.random() * 0.76) * roamCfg.maxR;
        x = Math.cos(ang) * dist;
        z = Math.sin(ang) * dist;
      }

      if (currentPos && Math.hypot(x - currentPos.x, z - currentPos.z) < 1.6) {
        continue;
      }

      const hitObstacle = roamCfg.obstacles.some(([ox, oz, orad]) => Math.hypot(x - ox, z - oz) < orad + 0.15);
      if (hitObstacle) continue;

      const hitPeer = peers.some((p) => Math.hypot(x - p.position.x, z - p.position.z) < 1.15);
      if (hitPeer) continue;

      return { x, z };
    }
    return currentPos ? { x: currentPos.x, z: currentPos.z } : { x: 1.5, z: 2.2 };
  }

  _initAnimalRoam(animal, { boundsType = "circle", maxR = 5.4, minX = -4.2, maxX = 4.2, minZ = -3.6, maxZ = 4.2, groundY = 0.50, obstacles = [], initialDelay = 0 }) {
    const speedBySpecies = {
      rabbit: 1.48,
      fox: 1.40,
      deer: 1.34,
      owl: 1.12,
      bear: 1.06,
      capybara: 0.94
    };
    const roamCfg = {
      boundsType,
      maxR,
      minX,
      maxX,
      minZ,
      maxZ,
      groundY,
      obstacles,
      speed: speedBySpecies[animal.userData.species] || 1.15,
      targetX: animal.position.x,
      targetZ: animal.position.z,
      pauseTimer: initialDelay,
      walkTimer: 0
    };
    const firstTarget = this._findSafeSpot(roamCfg, [], animal.position);
    roamCfg.targetX = firstTarget.x;
    roamCfg.targetZ = firstTarget.z;
    animal.userData.roam = roamCfg;
  }

  _updateAnimalRoamAndAnimation(animal, dt, elapsed) {
    const ud = animal.userData;
    const pivot = ud.bodyPivot;
    const head = ud.head;
    const roam = ud.roam;
    const t = elapsed * 2.2 + ud.seed;

    // Click / Greet Hop Animation
    if (ud.hopTime >= 0) {
      ud.hopTime += dt * 3.6;
      if (ud.hopTime >= Math.PI) {
        ud.hopTime = -1;
        pivot.position.y = 0;
      } else {
        pivot.position.y = Math.sin(ud.hopTime) * 0.42;
      }
    }

    if (ud.greetHoldTimer > 0) {
      ud.greetHoldTimer = Math.max(0, ud.greetHoldTimer - dt);
    }

    // Autonomous Roaming Logic (active when pose === "roam" and not briefly pausing for greeting)
    let movingNow = false;
    if (roam && ud.pose === "roam" && ud.greetHoldTimer <= 0) {
      if (roam.pauseTimer > 0) {
        roam.pauseTimer -= dt;
        if (roam.pauseTimer <= 0) {
          const next = this._findSafeSpot(roam, ud.peers || [], animal.position);
          roam.targetX = next.x;
          roam.targetZ = next.z;
          roam.walkTimer = 0;
        }
      } else {
        roam.walkTimer += dt;
        const dx = roam.targetX - animal.position.x;
        const dz = roam.targetZ - animal.position.z;
        const dist = Math.hypot(dx, dz);

        if (dist < 0.22 || roam.walkTimer > 6.5) {
          // Arrived at destination — pause briefly to read or look around, then pick next spot
          roam.pauseTimer = 0.65 + Math.random() * 1.75;
        } else {
          movingNow = true;
          const dirX = dx / dist;
          const dirZ = dz / dist;

          // Smoothly rotate toward movement direction
          const desiredYaw = Math.atan2(dirX, dirZ);
          let angleDiff = desiredYaw - animal.rotation.y;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          animal.rotation.y += angleDiff * Math.min(1, dt * 6.5);

          let nextX = animal.position.x + dirX * roam.speed * dt;
          let nextZ = animal.position.z + dirZ * roam.speed * dt;

          // Smooth tangent sliding & push-out around circular obstacles
          for (const [ox, oz, orad] of roam.obstacles) {
            const odx = nextX - ox;
            const odz = nextZ - oz;
            const odist = Math.hypot(odx, odz) || 0.001;
            if (odist < orad) {
              const nx = odx / odist;
              const nz = odz / odist;
              nextX = ox + nx * orad;
              nextZ = oz + nz * orad;
              // Nudge along tangent so the animal walks smoothly around buildings/pools
              const tanSign = (-nz * dirX + nx * dirZ) >= 0 ? 1 : -1;
              nextX += -nz * tanSign * roam.speed * dt * 0.65;
              nextZ += nx * tanSign * roam.speed * dt * 0.65;
            }
          }

          // Gentle separation between nearby animals
          const peers = ud.peers || [];
          for (const other of peers) {
            if (other === animal) continue;
            const pdx = nextX - other.position.x;
            const pdz = nextZ - other.position.z;
            const pdist = Math.hypot(pdx, pdz) || 0.001;
            if (pdist < 1.12) {
              const push = (1.12 - pdist) * 0.5;
              nextX += (pdx / pdist) * push;
              nextZ += (pdz / pdist) * push;
            }
          }

          // Keep strictly inside safe island / indoor bounds
          if (roam.boundsType === "rect") {
            nextX = THREE.MathUtils.clamp(nextX, roam.minX, roam.maxX);
            nextZ = THREE.MathUtils.clamp(nextZ, roam.minZ, roam.maxZ);
          } else {
            const rDist = Math.hypot(nextX, nextZ);
            if (rDist > roam.maxR) {
              nextX = (nextX / rDist) * roam.maxR;
              nextZ = (nextZ / rDist) * roam.maxR;
            }
          }

          animal.position.x = nextX;
          animal.position.z = nextZ;
          animal.position.y = roam.groundY;
        }
      }
    }
    ud.isMoving = movingNow;

    // Limb & Body Animation
    if (movingNow) {
      const cadence = ud.species === "rabbit" ? 10.5 : ud.species === "capybara" ? 6.8 : 8.4;
      ud.walkPhase += dt * cadence;
      const stride = Math.sin(ud.walkPhase);
      const bounce = ud.species === "rabbit"
        ? Math.abs(Math.sin(ud.walkPhase * 0.5)) * 0.13
        : Math.abs(stride) * 0.055;

      if (ud.hopTime < 0) {
        pivot.position.y = bounce;
      }
      pivot.rotation.z = stride * 0.055;
      pivot.scale.y = 1.0;

      if (ud.leftFoot && ud.rightFoot) {
        ud.leftFoot.position.z = 0.10 + stride * 0.14;
        ud.leftFoot.position.y = 0.10 + Math.max(0, stride) * 0.06;
        ud.rightFoot.position.z = 0.10 - stride * 0.14;
        ud.rightFoot.position.y = 0.10 + Math.max(0, -stride) * 0.06;
      }

      head.rotation.x = 0.04 + Math.sin(ud.walkPhase * 2) * 0.03;
      head.rotation.y = Math.sin(t * 0.7) * 0.08;
      head.rotation.z = -stride * 0.035;

      if (ud.hasBook) {
        ud.bookGroup.visible = true;
        ud.rightArm.rotation.x = -0.5 + stride * 0.08;
        ud.leftArm.rotation.x = -0.5 - stride * 0.08;
        ud.rightArm.rotation.z = 0;
      } else {
        ud.bookGroup.visible = false;
        ud.rightArm.rotation.x = -stride * 0.42;
        ud.leftArm.rotation.x = stride * 0.42;
        ud.rightArm.rotation.z = 0;
      }
    } else {
      // Reset walking tilt & feet neatly when standing still
      pivot.rotation.z *= 0.85;
      if (ud.hopTime < 0) pivot.position.y *= 0.85;
      if (ud.leftFoot && ud.rightFoot) {
        ud.leftFoot.position.z = 0.10;
        ud.leftFoot.position.y = 0.10;
        ud.rightFoot.position.z = 0.10;
        ud.rightFoot.position.y = 0.10;
      }

      if (ud.pose === "wave") {
        head.rotation.z = Math.sin(t * 1.6) * 0.12;
        ud.rightArm.rotation.x = -0.35;
        ud.rightArm.rotation.z = -0.6 + Math.sin(elapsed * 6.5) * 0.45;
        ud.leftArm.rotation.x = -0.15;
        ud.bookGroup.visible = false;
      } else if (ud.pose === "rest") {
        head.rotation.x = 0.16 + Math.sin(t * 0.7) * 0.05;
        head.rotation.z = 0;
        pivot.scale.y = 1 + Math.sin(t * 0.8) * 0.025;
        ud.rightArm.rotation.x = ud.hasBook ? -0.5 : -0.12;
        ud.rightArm.rotation.z = 0;
        ud.leftArm.rotation.x = ud.hasBook ? -0.5 : -0.12;
        ud.bookGroup.visible = ud.hasBook;
      } else {
        // Gentle idle look-around or page-reading nod
        head.rotation.x = (ud.hasBook ? 0.12 : 0.04) + Math.sin(t) * 0.06;
        head.rotation.y = Math.sin(t * 0.85) * 0.16;
        head.rotation.z = 0;
        ud.rightArm.rotation.x = ud.hasBook ? -0.5 : -0.12;
        ud.rightArm.rotation.z = 0;
        ud.leftArm.rotation.x = ud.hasBook ? -0.5 : -0.12;
        ud.bookGroup.visible = ud.hasBook;
      }
    }
  }

  _buildBridgesAndFlows() {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x9c7248, roughness: 0.82 });
    const postMat = new THREE.MeshStandardMaterial({ color: 0x6e4e32, roughness: 0.85 });
    // 共用幾何體，大幅減少 GPU 記憶體與建構時間
    const plankGeo = new RoundedBoxGeometry(1.35, 0.14, 0.46, 2, 0.04);
    const postGeo = new THREE.CylinderGeometry(0.055, 0.065, 0.55, 6);

    BOOK_FLOWS.forEach((flow, idx) => {
      const recA = this.islandRecords.get(flow.from);
      const recB = this.islandRecords.get(flow.to);
      if (!recA || !recB) return;

      const vA = new THREE.Vector3(...recA.island.pos);
      const vB = new THREE.Vector3(...recB.island.pos);
      const dir = new THREE.Vector3().subVectors(vB, vA).normalize();
      const start = vA.clone().addScaledVector(dir, recA.island.radius * 0.82);
      const end = vB.clone().addScaledVector(dir, -recB.island.radius * 0.82);
      start.y = 0.42;
      end.y = 0.42;
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      mid.y = 1.15;

      const bridgeCurve = new THREE.QuadraticBezierCurve3(start, mid, end);

      // Wooden Planks along Bridge Curve
      const plankCount = 14;
      for (let i = 0; i <= plankCount; i++) {
        const t = i / plankCount;
        const pt = bridgeCurve.getPoint(t);
        const tangent = bridgeCurve.getTangent(t);
        const plank = new THREE.Mesh(plankGeo, woodMat);
        plank.position.copy(pt);
        plank.lookAt(pt.clone().add(tangent));
        plank.receiveShadow = true;
        plank.castShadow = true;
        this.archipelagoGroup.add(plank);

        if (i % 4 === 0) {
          [-0.62, 0.62].forEach((side) => {
            const post = new THREE.Mesh(postGeo, postMat);
            const right = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
            post.position.copy(pt).addScaledVector(right, side);
            post.position.y += 0.28;
            this.archipelagoGroup.add(post);
          });
        }
      }

      // Luminous Collaboration Arc above Bridge
      const arcMid = mid.clone();
      arcMid.y = 4.4 + (idx % 2) * 0.9;
      const arcCurve = new THREE.QuadraticBezierCurve3(
        start.clone().setY(1.2),
        arcMid,
        end.clone().setY(1.2)
      );
      const arcPts = arcCurve.getPoints(32);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPts);
      const arcMat = new THREE.LineDashedMaterial({
        color: 0xe6a145,
        dashSize: 0.55,
        gapSize: 0.35,
        transparent: true,
        opacity: 0.72
      });
      const arcLine = new THREE.Line(arcGeo, arcMat);
      arcLine.computeLineDistances();
      this.archipelagoGroup.add(arcLine);
      this.arcLines.push(arcLine);

      // Cute Mini Animal Courier carrying Books on the Bridge
      const speciesCycle = ["rabbit", "fox", "capybara", "bear", "owl", "deer"];
      const courier = this._createCuteAnimal(speciesCycle[idx % speciesCycle.length], {
        scale: 0.54,
        isMini: true
      });
      this.archipelagoGroup.add(courier);

      const tagEl = document.createElement("div");
      tagEl.className = "courier-tag";
      tagEl.textContent = `漂書：${flow.cargoZh}`;
      const tagObj = new CSS2DObject(tagEl);
      tagObj.position.set(0, 2.2, 0);
      courier.add(tagObj);

      this.couriers.push({
        mesh: courier,
        tagObj,
        tagEl,
        flow,
        curve: bridgeCurve,
        progress: (idx * 0.19) % 1,
        direction: idx % 2 === 0 ? 1 : -1,
        speed: 0.055 + (idx % 3) * 0.008
      });
    });
  }

  _buildParticles() {
    const count = this.quality === "high" ? 220 : 140;
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 54;
      positions[i * 3 + 1] = 0.8 + Math.random() * 8.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 54;
      phases[i] = Math.random() * Math.PI * 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    this.particleUniforms = { uTime: { value: 0 } };
    this.particleMat = new THREE.PointsMaterial({
      color: 0xfbe3b5,
      size: 0.42,
      map: this._getSoftDotTexture(),
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    // GPU 螢火蟲：各自上下漂浮並呼吸閃爍
    this.particleMat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.particleUniforms);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uTime;\nattribute float aPhase;")
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          transformed.y += sin(uTime * 0.7 + aPhase) * 0.45;
          transformed.x += cos(uTime * 0.45 + aPhase * 1.7) * 0.35;`
        )
        .replace("gl_PointSize = size;", "gl_PointSize = size * (0.55 + 0.45 * sin(uTime * 2.2 + aPhase * 3.0));");
    };
    this.particles = new THREE.Points(geo, this.particleMat);
    this.scene.add(this.particles);
  }

  _buildIndoorContainer() {
    this.indoorGroup = new THREE.Group();
    this.indoorGroup.visible = false;
    this.scene.add(this.indoorGroup);
  }

  // ========================================================================
  // Indoor Cozy Library Reading Room Builder (per Island)
  // ========================================================================
  _clearIndoorRoom() {
    if (!this.indoorGroup) return;
    if (this.indoorAnimals && this.indoorAnimals.length > 0) {
      this.indoorAnimals.forEach((anim) => {
        window.clearTimeout(anim.userData._hideTimer);
        if (anim.userData.bubbleObj) {
          anim.remove(anim.userData.bubbleObj);
        }
        if (anim.userData.bubbleEl) {
          anim.userData.bubbleEl.remove();
        }
      });
    }
    this.indoorAnimals = [];
    this.indoorAnimal = null;
    this.indoorBreathOrb = null;
    this.indoorWindowPane = null;
    // 釋放室內專屬（非共用快取）的幾何與材質，避免反覆進出室內造成記憶體累積
    const sharedGeos = new Set(this._geoCache.values());
    const sharedMats = new Set(this._matCache.values());
    const indoorMats = new Set();
    this.indoorGroup.traverse((obj) => {
      if (!obj.isMesh) return;
      if (obj.geometry && !sharedGeos.has(obj.geometry)) obj.geometry.dispose();
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => {
        if (m && !sharedMats.has(m)) indoorMats.add(m);
      });
    });
    this.emissiveWindows = this.emissiveWindows.filter((m) => !indoorMats.has(m));
    indoorMats.forEach((m) => m.dispose());
    while (this.indoorGroup.children.length > 0) {
      const child = this.indoorGroup.children[0];
      this.indoorGroup.remove(child);
    }
  }

  enterIndoorRoom(islandId) {
    if (!this.webglAvailable) return;
    const rec = this.islandRecords.get(islandId || this.selectedIslandId || "atrium");
    if (!rec) return;
    const island = rec.island;
    this.selectedIslandId = island.id;
    this.isIndoor = true;

    // Clear previous indoor meshes & CSS2D labels cleanly
    this._clearIndoorRoom();

    // Hide Outdoor Archipelago & Outdoor CSS2D Pins
    this.archipelagoGroup.visible = false;
    this._syncLabelVisibility();

    const roomW = 13.0;
    const roomH = 6.6;
    const roomD = 12.0;

    const floorMat = new THREE.MeshStandardMaterial({ color: island.indoorFloorColor, roughness: 0.80 });
    const wallMat = new THREE.MeshStandardMaterial({ color: island.indoorWallColor, roughness: 0.88 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b623f, roughness: 0.76 });
    const rugMat = new THREE.MeshStandardMaterial({ color: island.rimColor, roughness: 0.92 });

    // Floor
    const floor = new THREE.Mesh(new RoundedBoxGeometry(roomW, 0.3, roomD, 2, 0.05), floorMat);
    floor.position.set(0, -0.15, 0);
    floor.receiveShadow = true;
    this.indoorGroup.add(floor);

    // Back Wall (with Panoramic Window opening) + Left & Right Walls
    const leftBack = new THREE.Mesh(new THREE.BoxGeometry(3.8, roomH, 0.35), wallMat);
    leftBack.position.set(-4.6, roomH / 2, -roomD / 2);
    const rightBack = new THREE.Mesh(new THREE.BoxGeometry(3.8, roomH, 0.35), wallMat);
    rightBack.position.set(4.6, roomH / 2, -roomD / 2);
    const bottomSill = new THREE.Mesh(new THREE.BoxGeometry(5.6, 1.35, 0.38), wallMat);
    bottomSill.position.set(0, 0.67, -roomD / 2);
    const topHeader = new THREE.Mesh(new THREE.BoxGeometry(5.6, 1.45, 0.38), wallMat);
    topHeader.position.set(0, roomH - 0.72, -roomD / 2);
    this.indoorGroup.add(leftBack, rightBack, bottomSill, topHeader);

    // Panoramic Window Frame & Scenic Sky Glass
    const preset = TIME_PRESETS[this.timeKey] || TIME_PRESETS.day;
    const glassPane = new THREE.Mesh(
      new THREE.PlaneGeometry(5.3, 3.85),
      new THREE.MeshBasicMaterial({ color: preset.skyBottom, transparent: true, opacity: 0.42 })
    );
    glassPane.position.set(0, 3.25, -roomD / 2 + 0.02);
    this.indoorGroup.add(glassPane);
    this.indoorWindowPane = glassPane;

    // Window Mullions
    [-2.65, 0, 2.65].forEach((mx) => {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.9, 0.22), woodMat);
      bar.position.set(mx, 3.25, -roomD / 2 + 0.04);
      this.indoorGroup.add(bar);
    });
    const hBar = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.12, 0.22), woodMat);
    hBar.position.set(0, 3.25, -roomD / 2 + 0.04);
    this.indoorGroup.add(hBar);

    // Side Walls
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.35, roomH, roomD), wallMat);
    leftWall.position.set(-roomW / 2, roomH / 2, 0);
    leftWall.receiveShadow = true;
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.35, roomH, roomD), wallMat);
    rightWall.position.set(roomW / 2, roomH / 2, 0);
    rightWall.receiveShadow = true;
    this.indoorGroup.add(leftWall, rightWall);

    // Warm Woven Center Rug
    const rug = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.07, 28), rugMat);
    rug.position.set(0, 0.04, 0.4);
    rug.receiveShadow = true;
    this.indoorGroup.add(rug);

    // Tall Timber Bookshelves packed with Colorful Books along Left & Right Walls
    [-4.8, -1.8].forEach((bz) => {
      const shelfL = this._createIndoorBookshelf();
      shelfL.position.set(-roomW / 2 + 0.65, 0, bz + 2.2);
      shelfL.rotation.y = Math.PI / 2;
      this.indoorGroup.add(shelfL);

      const shelfR = this._createIndoorBookshelf();
      shelfR.position.set(roomW / 2 - 0.65, 0, bz + 2.2);
      shelfR.rotation.y = -Math.PI / 2;
      this.indoorGroup.add(shelfR);
    });

    // Reading Table & Warm Brass Table Lamp
    const table = new THREE.Mesh(new RoundedBoxGeometry(2.5, 0.18, 1.35, 3, 0.06), woodMat);
    table.position.set(-0.9, 0.92, 0.3);
    table.castShadow = true;
    this.indoorGroup.add(table);
    [[-1.95, -0.22], [0.15, -0.22], [-1.95, 0.82], [0.15, 0.82]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.9, 8), woodMat);
      leg.position.set(lx, 0.45, lz);
      this.indoorGroup.add(leg);
    });

    // Glowing Reading Lamp
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.42, 10), woodMat);
    lampBase.position.set(-1.6, 1.22, 0.1);
    const lampShade = new THREE.Mesh(
      new THREE.ConeGeometry(0.36, 0.38, 14, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0xfbe3b5,
        emissive: 0xe6a145,
        emissiveIntensity: 0.95,
        side: THREE.DoubleSide
      })
    );
    lampShade.position.set(-1.6, 1.54, 0.1);
    this.indoorGroup.add(lampBase, lampShade);

    const roomLight = new THREE.PointLight(0xffd599, 2.6, 22);
    roomLight.position.set(0.4, 4.2, 2.2);
    roomLight.castShadow = true;
    this.indoorGroup.add(roomLight);

    const indoorFill = new THREE.AmbientLight(0xfff1db, 0.72);
    this.indoorGroup.add(indoorFill);

    // Soft Floor Cushions
    [[-0.9, 1.65], [0.5, 1.55]].forEach(([cx, cz], idx) => {
      const cushion = new THREE.Mesh(
        new RoundedBoxGeometry(0.95, 0.24, 0.95, 3, 0.10),
        new THREE.MeshStandardMaterial({ color: idx === 0 ? 0xe6a145 : 0xfbf8f1, roughness: 0.9 })
      );
      cushion.position.set(cx, 0.13, cz);
      cushion.rotation.y = idx * 0.3;
      this.indoorGroup.add(cushion);
    });

    // Island-Specific Indoor Feature (Breathing Orb on Treehouse / Hearth on Courtyard / Plants)
    if (island.id === "treehouse") {
      const orbStand = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.48, 0.85, 12), woodMat);
      orbStand.position.set(2.4, 0.42, -1.5);
      const indoorOrb = new THREE.Mesh(
        new THREE.SphereGeometry(0.58, 20, 16),
        new THREE.MeshStandardMaterial({ color: 0xfbe3b5, emissive: 0xe6a145, emissiveIntensity: 0.85 })
      );
      indoorOrb.position.set(2.4, 1.48, -1.5);
      this.indoorGroup.add(orbStand, indoorOrb);
      this.indoorBreathOrb = indoorOrb;
    } else if (island.id === "courtyard") {
      const hearth = new THREE.Mesh(
        new RoundedBoxGeometry(2.2, 2.1, 0.9, 2, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x9c6b56, roughness: 0.88 })
      );
      hearth.position.set(2.8, 1.05, -2.6);
      const fireGlow = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 12, 10),
        new THREE.MeshStandardMaterial({ color: 0xffb347, emissive: 0xe67e22, emissiveIntensity: 1.2 })
      );
      fireGlow.position.set(2.8, 0.55, -2.15);
      this.indoorGroup.add(hearth, fireGlow);
    } else {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.34, 0.65, 10), woodMat);
      pot.position.set(2.7, 0.32, -2.3);
      const plant = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.75, 1),
        new THREE.MeshStandardMaterial({ color: 0x4f735b, roughness: 0.82, flatShading: true })
      );
      plant.position.set(2.7, 1.15, -2.3);
      this.indoorGroup.add(pot, plant);
    }

    // Add Cute 3D Animal Librarian + Reading Friends roaming inside the Reading Room!
    const indoorObstacles = [
      [-0.9, 0.3, 1.75],   // Reading table & lamp
      [-0.9, 1.65, 0.78],  // Cushion 1
      [0.5, 1.55, 0.78],   // Cushion 2
      [2.6, -2.1, 1.50]    // Hearth / Orb pedestal / Plant
    ];
    const indoorRoamBounds = {
      boundsType: "rect",
      minX: -4.2,
      maxX: 4.2,
      minZ: -3.5,
      maxZ: 4.1,
      groundY: 0.08,
      obstacles: indoorObstacles
    };

    const indoorAnimal = this._createCuteAnimal(island.librarian.species, {
      islandId: island.id,
      scale: 1.28,
      registerClick: false,
      role: "librarian",
      hasBook: true
    });
    indoorAnimal.position.set(1.65, 0.08, -0.25);
    indoorAnimal.rotation.y = -0.45;
    indoorAnimal.userData.pose = rec.animal?.userData.pose || "roam";
    this._initAnimalRoam(indoorAnimal, { ...indoorRoamBounds, initialDelay: 0.4 });
    this.indoorGroup.add(indoorAnimal);
    this.indoorAnimal = indoorAnimal;

    const bubbleEl = document.createElement("div");
    bubbleEl.className = "speech-bubble-2d";
    bubbleEl.textContent = this.lang === "en" ? island.librarian.greetingEn : island.librarian.greetingZh;
    const bubbleObj = new CSS2DObject(bubbleEl);
    bubbleObj.position.set(0, 2.35, 0);
    indoorAnimal.add(bubbleObj);
    indoorAnimal.userData.bubbleEl = bubbleEl;
    indoorAnimal.userData.bubbleObj = bubbleObj;

    this.indoorAnimals = [indoorAnimal];

    const allSpecies = ["owl", "capybara", "bear", "rabbit", "fox", "deer"].filter(
      (sp) => sp !== island.librarian.species
    );
    const guestPair = [
      allSpecies[island.code.charCodeAt(1) % allSpecies.length],
      allSpecies[(island.code.charCodeAt(1) + 2) % allSpecies.length]
    ];
    guestPair.forEach((guestSpecies, gIdx) => {
      const guest = this._createCuteAnimal(guestSpecies, {
        islandId: island.id,
        scale: 1.02,
        registerClick: false,
        role: "visitor",
        hasBook: gIdx === 0
      });
      const spot = this._findSafeSpot(indoorRoamBounds, this.indoorAnimals);
      guest.position.set(spot.x, 0.08, spot.z);
      guest.rotation.y = Math.random() * Math.PI * 2;
      this._initAnimalRoam(guest, { ...indoorRoamBounds, initialDelay: 0.15 + gIdx * 0.5 });

      const gBubbleEl = document.createElement("div");
      gBubbleEl.className = "speech-bubble-2d";
      gBubbleEl.style.opacity = "0";
      const gBubbleObj = new CSS2DObject(gBubbleEl);
      gBubbleObj.position.set(0, 2.35, 0);
      guest.add(gBubbleObj);
      guest.userData.bubbleEl = gBubbleEl;
      guest.userData.bubbleObj = gBubbleObj;

      this.indoorGroup.add(guest);
      this.indoorAnimals.push(guest);
    });
    this.indoorAnimals.forEach((a) => {
      a.userData.peers = this.indoorAnimals;
    });

    this.indoorGroup.visible = true;

    if (this.isFpv) {
      this.setFirstPersonMode(true);
    } else {
      this.controls.enabled = true;
      this.controls.minDistance = 3.5;
      this.controls.maxDistance = 13.5;
      this._flyCamera(new THREE.Vector3(0, 3.8, 7.8), new THREE.Vector3(0.2, 1.3, -0.5));
    }
  }

  exitIndoorRoom() {
    if (!this.webglAvailable || !this.isIndoor) return;
    this._clearIndoorRoom();
    this.indoorGroup.visible = false;
    this.isIndoor = false;
    this.isFpv = false;
    this.archipelagoGroup.visible = true;
    this.controls.enabled = true;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 76 * this._aspectFactor();
    this._syncLabelVisibility();

    if (this.selectedIslandId) {
      this.focusIsland(this.selectedIslandId);
    } else {
      this.resetOverview();
    }
  }

  setFirstPersonMode(enable) {
    if (!this.webglAvailable) return;
    this.isFpv = Boolean(enable);
    if (this.isFpv) {
      this.camAnim = null;
      this.controls.enabled = false;
      if (this.isIndoor) {
        this.camera.position.set(0, 2.05, 4.2);
        this.fpvYaw = 0;
        this.fpvPitch = -0.06;
      } else {
        const rec = this.islandRecords.get(this.selectedIslandId || "atrium");
        const base = rec ? rec.island.pos : [0, 0, 0];
        this.camera.position.set(base[0], 2.25, base[2] + 4.4);
        this.fpvYaw = 0;
        this.fpvPitch = -0.05;
      }
      this._updateFpvCameraOrientation();
    } else {
      this.controls.enabled = true;
      if (this.isIndoor) {
        this._flyCamera(new THREE.Vector3(0, 3.8, 7.8), new THREE.Vector3(0.2, 1.3, -0.5));
      } else if (this.selectedIslandId) {
        this.focusIsland(this.selectedIslandId);
      } else {
        this.resetOverview();
      }
    }
  }

  _updateFpvCameraOrientation() {
    const euler = new THREE.Euler(this.fpvPitch, this.fpvYaw, 0, "YXZ");
    this.camera.quaternion.setFromEuler(euler);
  }

  setMoveDirection(dir, active) {
    if (dir in this.moveState) {
      this.moveState[dir] = active;
    }
  }

  getAnimalPose(islandId) {
    const rec = this.islandRecords.get(islandId);
    return rec?.animal?.userData.pose || "roam";
  }

  setAnimalPose(islandId, pose) {
    if (!this.webglAvailable) return;
    const rec = this.islandRecords.get(islandId);
    if (rec && rec.animal) {
      rec.animal.userData.pose = pose;
      rec.animal.userData.hopTime = 0;
      if (pose === "roam" && rec.animal.userData.roam) {
        rec.animal.userData.roam.pauseTimer = 0;
      }
    }
    if (this.isIndoor && this.indoorAnimal) {
      this.indoorAnimal.userData.pose = pose;
      this.indoorAnimal.userData.hopTime = 0;
      if (pose === "roam" && this.indoorAnimal.userData.roam) {
        this.indoorAnimal.userData.roam.pauseTimer = 0;
      }
    }
  }

  triggerAnimalGreeting(islandId, clickedAnimal = null) {
    if (!this.webglAvailable) return;
    const rec = this.islandRecords.get(islandId);
    if (!rec) return;
    const targetAnimal = clickedAnimal || (this.isIndoor && this.indoorAnimal ? this.indoorAnimal : rec.animal);
    if (!targetAnimal) return;
    targetAnimal.userData.hopTime = 0;
    targetAnimal.userData.greetHoldTimer = 2.2;

    // Face gently toward the camera when greeted
    const dx = this.camera.position.x - (this.isIndoor ? targetAnimal.position.x : rec.island.pos[0] + targetAnimal.position.x);
    const dz = this.camera.position.z - (this.isIndoor ? targetAnimal.position.z : rec.island.pos[2] + targetAnimal.position.z);
    targetAnimal.rotation.y = Math.atan2(dx, dz);

    const visitorQuotesZh = {
      owl: "咕咕～這座島上的書香好迷人呀！",
      capybara: "呼嚕……邊散步邊吹風真舒服～",
      bear: "慢步走一走，心情也跟著鬆開了呢！",
      rabbit: "蹦蹦！剛剛翻到一本超溫暖的故事喔！",
      fox: "嗨！你也來這座閱讀島嶼散步嗎？",
      deer: "踏著輕快的步伐，一起享受安靜時光吧！"
    };
    const visitorQuotesEn = {
      owl: "Hoo~ Such lovely books to explore on this island!",
      capybara: "Strolling gently in the breeze feels wonderful~",
      bear: "A slow mindful walk always clears the mind!",
      rabbit: "Hop hop! Just found a heartwarming story!",
      fox: "Hi there! Enjoying a stroll around the library?",
      deer: "Walking softly among the trees and stories!"
    };

    const isVisitor = targetAnimal.userData.role === "visitor";
    let picked;
    if (isVisitor) {
      const sp = targetAnimal.userData.species;
      picked = this.lang === "en" ? (visitorQuotesEn[sp] || visitorQuotesEn.owl) : (visitorQuotesZh[sp] || visitorQuotesZh.owl);
    } else {
      const quotes = this.lang === "en" && rec.island.librarian.greetingEn
        ? [rec.island.librarian.greetingEn]
        : rec.island.librarian.tapQuotesZh;
      picked = quotes[Math.floor(Math.random() * quotes.length)];
    }

    if (targetAnimal.userData.bubbleEl) {
      targetAnimal.userData.bubbleEl.textContent = picked;
      targetAnimal.userData.bubbleEl.style.opacity = "1";
      window.clearTimeout(targetAnimal.userData._hideTimer);
      targetAnimal.userData._hideTimer = window.setTimeout(() => {
        if (targetAnimal.userData.bubbleEl && (!this.isIndoor || isVisitor)) {
          targetAnimal.userData.bubbleEl.style.opacity = "0";
        }
      }, 4200);
    }
    this.onAnimalInteract?.(rec.island, isVisitor ? null : picked, targetAnimal.userData.species);
  }

  focusIsland(islandId) {
    if (!this.webglAvailable) return;
    const rec = this.islandRecords.get(islandId);
    if (!rec) return;
    this.selectedIslandId = islandId;
    if (this.isIndoor) {
      this.enterIndoorRoom(islandId);
      return;
    }
    this.isFpv = false;
    this.controls.enabled = true;
    const [ix, iy, iz] = rec.island.pos;
    const target = new THREE.Vector3(ix, iy + 1.4, iz);
    const zoomOut = Math.pow(this._aspectFactor(), 0.85);
    const camPos = new THREE.Vector3(3.2, 9.2, 14.2).multiplyScalar(zoomOut).add(new THREE.Vector3(ix, iy, iz));
    this._flyCamera(camPos, target);
    this.focusRing.position.x = ix;
    this.focusRing.position.z = iz;
    this.focusRing.scale.setScalar(rec.island.radius + 1.05);
    this._syncLabelVisibility();
  }

  resetOverview() {
    if (!this.webglAvailable) return;
    if (this.isIndoor) {
      this.selectedIslandId = null;
      this.exitIndoorRoom();
      return;
    }
    this.selectedIslandId = null;
    this.isFpv = false;
    this.controls.enabled = true;
    const { pos, target } = this._overviewPose();
    this._flyCamera(pos, target);
    this._syncLabelVisibility();
  }

  setBirdsEyeView() {
    if (!this.webglAvailable) return;
    if (this.isIndoor) this.exitIndoorRoom();
    this.isFpv = false;
    this.controls.enabled = true;
    this._flyCamera(new THREE.Vector3(0, 48, 8).multiplyScalar(this._aspectFactor()), new THREE.Vector3(0, 0, -2));
  }

  // 每個時段的額外視覺參數（雲色、星空、波光、太陽光暈、曝光）
  static get TIME_EXTRAS() {
    return {
      dawn: { cloud: "#fbe6d6", stars: 0.0, sparkle: 0.55, sunGlow: 0.85, exposure: 1.04, fogDensity: 0.0088 },
      day: { cloud: "#ffffff", stars: 0.0, sparkle: 0.5, sunGlow: 0.55, exposure: 1.06, fogDensity: 0.0078 },
      dusk: { cloud: "#f2b8a0", stars: 0.35, sparkle: 0.75, sunGlow: 1.0, exposure: 1.08, fogDensity: 0.0086 },
      night: { cloud: "#4a5a72", stars: 1.0, sparkle: 0.28, sunGlow: 0.45, exposure: 1.12, fogDensity: 0.0094 }
    };
  }

  _captureTimeState(preset) {
    const extra = LibraryWorld3D.TIME_EXTRAS[preset.id] || LibraryWorld3D.TIME_EXTRAS.day;
    return {
      skyTop: new THREE.Color(preset.skyTop),
      skyBottom: new THREE.Color(preset.skyBottom),
      fog: new THREE.Color(preset.fogColor),
      water: new THREE.Color(preset.waterColor),
      waterDeep: new THREE.Color(preset.waterDeep || preset.waterColor),
      hemiSky: new THREE.Color(preset.hemiSky),
      hemiGround: new THREE.Color(preset.hemiGround),
      sun: new THREE.Color(preset.sunColor),
      cloud: new THREE.Color(extra.cloud),
      sunPos: new THREE.Vector3(...preset.sunPos),
      hemiIntensity: preset.hemiIntensity,
      sunIntensity: preset.sunIntensity,
      lanternGlow: preset.lanternGlow,
      stars: extra.stars,
      sparkle: extra.sparkle,
      sunGlow: extra.sunGlow,
      exposure: extra.exposure,
      fogDensity: extra.fogDensity,
      particleOpacity: preset.id === "night" || preset.id === "dusk" ? 0.95 : 0.45
    };
  }

  _lerpTimeState(a, b, t) {
    const out = {};
    for (const k of Object.keys(b)) {
      const va = a[k];
      const vb = b[k];
      if (vb && vb.isColor) out[k] = va.clone().lerp(vb, t);
      else if (vb && vb.isVector3) out[k] = va.clone().lerp(vb, t);
      else out[k] = va + (vb - va) * t;
    }
    return out;
  }

  _applyTimeState(st) {
    this._timeState = st;
    this.skyUniforms.topColor.value.copy(st.skyTop);
    this.skyUniforms.bottomColor.value.copy(st.skyBottom);
    this.skyUniforms.sunColor.value.copy(st.sun);
    this.skyUniforms.sunGlow.value = st.sunGlow;
    this.skyUniforms.sunDir.value.copy(st.sunPos).normalize();
    this.scene.fog.color.copy(st.fog);
    this.scene.fog.density = st.fogDensity;
    this.waterMat.color.copy(st.water);
    this.waterUniforms.uDeep.value.copy(st.waterDeep);
    this.waterUniforms.uSparkle.value = st.sparkle;

    this.hemiLight.color.copy(st.hemiSky);
    this.hemiLight.groundColor.copy(st.hemiGround);
    this.hemiLight.intensity = st.hemiIntensity;
    this.sunLight.color.copy(st.sun);
    this.sunLight.intensity = st.sunIntensity;
    this.sunLight.position.copy(st.sunPos);
    this.renderer.toneMappingExposure = st.exposure;

    this.emissiveWindows.forEach((mat) => {
      mat.emissiveIntensity = st.lanternGlow * 1.15;
    });
    this.lanternLights.forEach((entry) => {
      entry.light.intensity = entry.alwaysWarm ? entry.baseIntensity : entry.baseIntensity * st.lanternGlow;
    });
    if (this.cloudMat) {
      this.cloudMat.color.copy(st.cloud);
      this.cloudMat.emissive.copy(st.cloud);
    }
    if (this.starMat) {
      this.starMat.opacity = st.stars;
      this.stars.visible = st.stars > 0.01 && !this.isIndoor;
    }
    if (this.indoorWindowPane) {
      this.indoorWindowPane.material.color.copy(st.skyBottom);
    }
    if (this.particleMat) {
      this.particleMat.opacity = st.particleOpacity;
    }
  }

  applyTimeOfDay(key, instant = false) {
    if (!this.webglAvailable) return;
    const preset = TIME_PRESETS[key] || TIME_PRESETS.day;
    this.timeKey = preset.id;
    const target = this._captureTimeState(preset);
    if (instant || this.reducedMotion || !this._timeState) {
      this._timeTween = null;
      this._applyTimeState(target);
      return;
    }
    // 光影色調平滑漸變（約 1.8 秒）
    this._timeTween = { from: this._timeState, to: target, elapsed: 0, duration: 1.8 };
  }

  setSimulationOptions({ showLabels, showCouriers, showArcs, isPaused, particleMode, fov }) {
    if (!this.webglAvailable) return;
    if (typeof showLabels === "boolean") this.showLabels = showLabels;
    if (typeof showCouriers === "boolean") this.showCouriers = showCouriers;
    if (typeof showArcs === "boolean") this.showArcs = showArcs;
    if (typeof isPaused === "boolean") this.isPaused = isPaused;
    if (particleMode) {
      this.particleMode = particleMode;
      if (this.particles) {
        this.particles.visible = particleMode !== "off";
        this.particleMat.size = particleMode === "lush" ? 0.62 : 0.42;
      }
    }
    if (typeof fov === "number") {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }

    this.couriers.forEach((c) => {
      c.mesh.visible = this.showCouriers && !this.isIndoor;
      c.tagObj.visible = this.showCouriers && this.showLabels && !this.isIndoor;
    });
    this.arcLines.forEach((line) => {
      line.visible = this.showArcs && !this.isIndoor;
    });
    this._syncLabelVisibility();
  }

  setLanguage(lang) {
    this.lang = lang;
    if (!this.webglAvailable) return;
    this.outdoorPins.forEach(({ el, island }) => {
      const name = lang === "en" ? island.nameEn : island.nameZh;
      el.innerHTML = `<span class="island-pin-code">${island.code}</span><span class="island-pin-text">${name}</span>`;
    });
    this.stationPins.forEach(({ el, station, index }) => {
      el.textContent = `${index + 1}. ${lang === "en" ? station.titleEn : station.titleZh}`;
    });
    this.couriers.forEach((c) => {
      c.tagEl.textContent = lang === "en" ? `Book: ${c.flow.cargoEn}` : `漂書：${c.flow.cargoZh}`;
    });
    if (this.isIndoor && this.indoorAnimal && this.selectedIslandId) {
      const rec = this.islandRecords.get(this.selectedIslandId);
      if (rec && this.indoorAnimal.userData.bubbleEl) {
        this.indoorAnimal.userData.bubbleEl.textContent = lang === "en"
          ? rec.island.librarian.greetingEn
          : rec.island.librarian.greetingZh;
      }
    }
  }

  _syncLabelVisibility() {
    const outdoor = !this.isIndoor;
    this.clouds.forEach((c) => {
      c.visible = outdoor;
    });
    if (this.stars) this.stars.visible = outdoor && this.starMat.opacity > 0.01;
    if (this.focusRing) this.focusRing.visible = outdoor && Boolean(this.selectedIslandId);
    this.outdoorPins.forEach(({ obj, island }) => {
      obj.visible = !this.isIndoor && this.showLabels && this.selectedIslandId !== island.id;
    });
    this.stationPins.forEach(({ obj, islandId }) => {
      obj.visible = !this.isIndoor && this.showLabels && this.selectedIslandId === islandId;
    });
    this.couriers.forEach((c) => {
      c.tagObj.visible = !this.isIndoor && this.showCouriers && this.showLabels;
    });
  }

  _flyCamera(destPos, destTarget, duration = 1.1) {
    if (this.reducedMotion) {
      this.camera.position.copy(destPos);
      this.controls.target.copy(destTarget);
      this.controls.update();
      return;
    }
    this.camAnim = {
      startPos: this.camera.position.clone(),
      startTarget: this.controls.target.clone(),
      endPos: destPos.clone(),
      endTarget: destTarget.clone(),
      elapsed: 0,
      duration
    };
  }

  // ========================================================================
  // Reusable Architectural & Botanical Prop Helpers
  // ========================================================================
  _cachedGeo(key, factory) {
    if (!this._geoCache.has(key)) this._geoCache.set(key, factory());
    return this._geoCache.get(key);
  }

  _cachedMat(color, roughness = 0.75) {
    const key = `${color}-${roughness}`;
    if (!this._matCache.has(key)) {
      this._matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness }));
    }
    return this._matCache.get(key);
  }

  _createWindowMaterial() {
    const mat = new THREE.MeshStandardMaterial({
      color: 0xfff3d6,
      emissive: 0xffbe6b,
      emissiveIntensity: 0.1,
      roughness: 0.35
    });
    this.emissiveWindows.push(mat);
    return mat;
  }

  _createStylizedTree(kind = "oak", scale = 1.0) {
    const g = new THREE.Group();
    g.scale.setScalar(scale);
    const trunk = new THREE.Mesh(
      this._cachedGeo("tree-trunk", () => new THREE.CylinderGeometry(0.14, 0.22, 0.95, 6)),
      this._cachedMat(0x7d5a3c, 0.88)
    );
    trunk.position.y = 0.45;
    trunk.castShadow = true;
    g.add(trunk);

    const leafPalette = [0x587d61, 0x6d9169, 0x7e9c6e, 0xd49b57];
    const leafColor = leafPalette[Math.floor(Math.random() * leafPalette.length)];
    const leafKey = `leaf-${leafColor}`;
    if (!this._matCache.has(leafKey)) {
      this._matCache.set(leafKey, new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.82, flatShading: true }));
    }
    const leafMat = this._matCache.get(leafKey);

    if (kind === "pine") {
      [0, 1, 2].forEach((tier) => {
        const cone = new THREE.Mesh(
          this._cachedGeo(`pine-${tier}`, () => new THREE.ConeGeometry(0.78 - tier * 0.18, 0.85, 7)),
          leafMat
        );
        cone.position.y = 1.05 + tier * 0.52;
        cone.castShadow = true;
        g.add(cone);
      });
    } else {
      const crown = new THREE.Mesh(this._cachedGeo("oak-crown", () => new THREE.DodecahedronGeometry(0.78, 1)), leafMat);
      crown.position.y = 1.32;
      crown.castShadow = true;
      g.add(crown);
    }
    return g;
  }

  _createStreetLantern() {
    const g = new THREE.Group();
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.075, 1.65, 6),
      new THREE.MeshStandardMaterial({ color: 0x36322e, roughness: 0.7 })
    );
    post.position.y = 0.82;
    post.castShadow = true;
    g.add(post);

    const bulbMat = this._createWindowMaterial();
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), bulbMat);
    bulb.position.y = 1.72;
    g.add(bulb);
    return g;
  }

  _createBookStack(colors) {
    const g = new THREE.Group();
    colors.forEach((hex, idx) => {
      const book = new THREE.Mesh(
        this._cachedGeo("book-flat", () => new RoundedBoxGeometry(0.75, 0.18, 0.54, 2, 0.04)),
        this._cachedMat(hex, 0.65)
      );
      book.position.y = 0.09 + idx * 0.18;
      book.rotation.y = (idx - 1) * 0.18;
      book.castShadow = true;
      g.add(book);
    });
    return g;
  }

  _createIndoorBookshelf() {
    const g = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b623f, roughness: 0.78 });
    const frame = new THREE.Mesh(new RoundedBoxGeometry(2.3, 4.2, 0.65, 2, 0.05), woodMat);
    frame.position.y = 2.1;
    frame.castShadow = true;
    frame.receiveShadow = true;
    g.add(frame);

    const spineColors = [0x4f735b, 0xe6a145, 0x679296, 0xc97b52, 0x526b7a, 0xd8c3a5];
    for (let row = 0; row < 4; row++) {
      const y = 0.68 + row * 0.92;
      for (let b = 0; b < 8; b++) {
        const spine = new THREE.Mesh(
          this._cachedGeo(`spine-${b % 3}`, () => new RoundedBoxGeometry(0.19, 0.64 + (b % 3) * 0.06, 0.44, 2, 0.03)),
          this._cachedMat(spineColors[(row + b) % spineColors.length], 0.65)
        );
        spine.position.set(-0.82 + b * 0.23, y, 0.16);
        g.add(spine);
      }
    }
    return g;
  }

  // ========================================================================
  // Input & Render Loop
  // ========================================================================
  _bindEvents() {
    // RWD：視窗、手機旋轉、網址列收合時都重新計算畫布尺寸
    let resizeRaf = 0;
    const scheduleResize = () => {
      window.clearTimeout(resizeRaf);
      resizeRaf = window.setTimeout(() => this._handleResize(), 60);
    };
    window.addEventListener("resize", scheduleResize);
    window.addEventListener("orientationchange", scheduleResize);
    if (window.visualViewport) window.visualViewport.addEventListener("resize", scheduleResize);
    if ("ResizeObserver" in window) new ResizeObserver(scheduleResize).observe(this.stageEl);

    // 分頁切到背景時暫停渲染，節省電量（PWA 安裝後尤其重要）
    document.addEventListener("visibilitychange", () => {
      this._isRunning = !document.hidden;
      if (this._isRunning) {
        this.clock.getDelta();
        this._animate();
      }
    });

    const dom = this.renderer.domElement;

    // 桌機滑鼠懸停島嶼：游標變手形並微微發光
    dom.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse" || this.isIndoor || this.isFpv) return;
      const now = performance.now();
      if (now - this._lastHoverCheck < 70) return;
      this._lastHoverCheck = now;
      const rect = dom.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hits = this.raycaster.intersectObjects(this.clickableMeshes, false);
      this._setHoverIsland(hits.length > 0 ? hits[0].object.userData.islandId : null);
    });
    dom.addEventListener("pointerleave", () => this._setHoverIsland(null));
    dom.addEventListener("pointerdown", (e) => {
      this._pointerDownPos.set(e.clientX, e.clientY);
      if (this.isFpv) {
        this._isLookingFpv = true;
        this._lastLookX = e.clientX;
        this._lastLookY = e.clientY;
      }
    });

    window.addEventListener("pointermove", (e) => {
      if (!this.isFpv || !this._isLookingFpv) return;
      const dx = e.clientX - this._lastLookX;
      const dy = e.clientY - this._lastLookY;
      this._lastLookX = e.clientX;
      this._lastLookY = e.clientY;
      this.fpvYaw -= dx * 0.0032;
      this.fpvPitch = THREE.MathUtils.clamp(this.fpvPitch - dy * 0.0026, -0.65, 0.65);
      this._updateFpvCameraOrientation();
    });

    window.addEventListener("pointerup", (e) => {
      this._isLookingFpv = false;
      if (e.target !== dom) return;
      const moved = Math.hypot(e.clientX - this._pointerDownPos.x, e.clientY - this._pointerDownPos.y);
      if (moved > 6) return;

      const rect = dom.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.pointer, this.camera);

      if (this.isIndoor && this.indoorAnimals.length > 0) {
        const hits = this.raycaster.intersectObjects(this.indoorAnimals, true);
        if (hits.length > 0) {
          let hitAnim = hits[0].object;
          while (hitAnim && !this.indoorAnimals.includes(hitAnim)) {
            hitAnim = hitAnim.parent;
          }
          this.triggerAnimalGreeting(this.selectedIslandId, hitAnim);
          return;
        }
      }

      if (!this.isIndoor) {
        const hits = this.raycaster.intersectObjects(this.clickableMeshes, false);
        if (hits.length > 0) {
          const { islandId, kind, animalRoot } = hits[0].object.userData;
          if (islandId) {
            if (kind === "animal") {
              this.focusIsland(islandId);
              this.onSelectIsland?.(islandId);
              this.triggerAnimalGreeting(islandId, animalRoot || null);
            } else {
              this.focusIsland(islandId);
              this.onSelectIsland?.(islandId);
            }
          }
        }
      }
    });

    window.addEventListener("keydown", (e) => {
      if (!this.isFpv) return;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
      if (e.code === "KeyW" || e.code === "ArrowUp") this.moveState.forward = true;
      if (e.code === "KeyS" || e.code === "ArrowDown") this.moveState.backward = true;
      if (e.code === "KeyA" || e.code === "ArrowLeft") this.moveState.left = true;
      if (e.code === "KeyD" || e.code === "ArrowRight") this.moveState.right = true;
    });

    window.addEventListener("keyup", (e) => {
      if (e.code === "KeyW" || e.code === "ArrowUp") this.moveState.forward = false;
      if (e.code === "KeyS" || e.code === "ArrowDown") this.moveState.backward = false;
      if (e.code === "KeyA" || e.code === "ArrowLeft") this.moveState.left = false;
      if (e.code === "KeyD" || e.code === "ArrowRight") this.moveState.right = false;
    });
  }

  _handleResize() {
    const w = this.stageEl.clientWidth || window.innerWidth;
    const h = this.stageEl.clientHeight || window.innerHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.labelRenderer.setSize(w, h);
    if (!this.isIndoor) this.controls.maxDistance = 76 * this._aspectFactor();
    // 安全網：若鏡頭因異常尺寸出現 NaN，重設回全景
    const p = this.camera.position;
    if (!Number.isFinite(p.x + p.y + p.z) || !Number.isFinite(this.controls.target.x)) {
      const pose = this._overviewPose();
      this.camAnim = null;
      this.camera.position.copy(pose.pos);
      this.controls.target.copy(pose.target);
      this.controls.update();
    }
  }

  _setHoverIsland(islandId) {
    if (this._hoverIslandId === islandId) return;
    const prev = this.islandRecords.get(this._hoverIslandId);
    if (prev && prev.topMat) prev.topMat.emissive.setHex(0x000000);
    this._hoverIslandId = islandId;
    const next = this.islandRecords.get(islandId);
    if (next && next.topMat) {
      next.topMat.emissive.setHex(0xf0b562);
      next.topMat.emissiveIntensity = 0.16;
    }
    this.renderer.domElement.style.cursor = islandId ? "pointer" : "";
  }

  // 自適應解析度：持續低於約 40 FPS 時逐步降低像素比，維持流暢
  _adaptQuality(dt) {
    if (dt <= 0) return;
    this._fpsSamples.push(dt);
    if (this._fpsSamples.length < 90) return;
    const avg = this._fpsSamples.reduce((a, b) => a + b, 0) / this._fpsSamples.length;
    this._fpsSamples.length = 0;
    const fps = 1 / avg;
    const ceiling = Math.min(window.devicePixelRatio || 1, this.maxPixelRatio);
    if (fps < 40 && this.currentPixelRatio > 1) {
      this.currentPixelRatio = Math.max(1, this.currentPixelRatio - 0.25);
      this.renderer.setPixelRatio(this.currentPixelRatio);
      this._handleResize();
    } else if (fps > 58 && this.currentPixelRatio < ceiling) {
      this.currentPixelRatio = Math.min(this.currentPixelRatio + 0.25, ceiling);
      this.renderer.setPixelRatio(this.currentPixelRatio);
      this._handleResize();
    }
  }

  _animate() {
    if (!this._isRunning) return;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = requestAnimationFrame(() => {
      this._rafId = 0;
      this._animate();
    });

    const dt = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;
    this._adaptQuality(dt);

    // 0. Time-of-Day Smooth Transition
    if (this._timeTween) {
      this._timeTween.elapsed += dt;
      const tt = Math.min(this._timeTween.elapsed / this._timeTween.duration, 1);
      const smooth = tt * tt * (3 - 2 * tt);
      this._applyTimeState(this._lerpTimeState(this._timeTween.from, this._timeTween.to, smooth));
      if (tt >= 1) this._timeTween = null;
    }

    // 1. Camera Fly-To Transition
    if (this.camAnim) {
      this.camAnim.elapsed += dt;
      const t = Math.min(this.camAnim.elapsed / this.camAnim.duration, 1);
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      this.camera.position.lerpVectors(this.camAnim.startPos, this.camAnim.endPos, ease);
      this.controls.target.lerpVectors(this.camAnim.startTarget, this.camAnim.endTarget, ease);
      if (t >= 1) this.camAnim = null;
    }

    // 2. First-Person Roaming Movement
    if (this.isFpv) {
      const speed = 5.2 * dt;
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.fpvYaw);
      const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.fpvYaw);
      if (this.moveState.forward) this.camera.position.addScaledVector(forward, speed);
      if (this.moveState.backward) this.camera.position.addScaledVector(forward, -speed);
      if (this.moveState.right) this.camera.position.addScaledVector(right, speed);
      if (this.moveState.left) this.camera.position.addScaledVector(right, -speed);

      if (this.isIndoor) {
        this.camera.position.x = THREE.MathUtils.clamp(this.camera.position.x, -5.2, 5.2);
        this.camera.position.z = THREE.MathUtils.clamp(this.camera.position.z, -4.6, 5.0);
        this.camera.position.y = 2.05;
      } else {
        const rec = this.islandRecords.get(this.selectedIslandId || "atrium");
        if (rec) {
          const [ix, , iz] = rec.island.pos;
          const maxR = rec.island.radius * 0.78;
          const dx = this.camera.position.x - ix;
          const dz = this.camera.position.z - iz;
          const dist = Math.hypot(dx, dz);
          if (dist > maxR) {
            this.camera.position.x = ix + (dx / dist) * maxR;
            this.camera.position.z = iz + (dz / dist) * maxR;
          }
          this.camera.position.y = 2.25;
        }
      }
    } else if (this.controls.enabled) {
      this.controls.update();
    }

    // 3. World & Animal Roaming Animations (when not paused)
    if (!this.isPaused) {
      // Gentle Lake Ripples（改由 GPU 計算，不再每幀更新數千個頂點）
      this.waterUniforms.uTime.value = elapsed;
      if (this.particleUniforms) this.particleUniforms.uTime.value = elapsed;

      // Drifting Clouds
      if (!this.isIndoor && !this.reducedMotion) {
        this.clouds.forEach((cloud) => {
          const ud = cloud.userData;
          ud.angle += ud.speed * ud.dir * dt;
          if (ud.angle > ud.arc[1] || ud.angle < ud.arc[0]) ud.dir *= -1;
          cloud.position.x = Math.cos(ud.angle) * ud.dist;
          cloud.position.z = Math.sin(ud.angle) * ud.dist;
          cloud.position.y = ud.baseY + Math.sin(elapsed * 0.3 + ud.bob) * 0.35;
        });
      }

      // 4-4-6 Calm Breathing Sync Orbs (14s cycle: 4s inhale, 4s hold, 6s exhale)
      const cycle = elapsed % 14;
      let orbScale = 0.85;
      if (cycle < 4) {
        orbScale = 0.82 + 0.34 * (cycle / 4);
      } else if (cycle < 8) {
        orbScale = 1.16;
      } else {
        orbScale = 1.16 - 0.34 * ((cycle - 8) / 6);
      }
      this.breathOrbs.forEach((orb) => {
        orb.scale.setScalar(orbScale);
        orb.position.y = 2.15 + Math.sin(elapsed * 1.4) * 0.08;
      });
      if (this.isIndoor && this.indoorBreathOrb) {
        this.indoorBreathOrb.scale.setScalar(orbScale);
      }

      if (this.campfireFlame) {
        this.campfireFlame.scale.y = 0.92 + Math.sin(elapsed * 7.5) * 0.12;
      }

      // Cute Animal Roaming, Avoidance & Walk-Cycle Animations
      const animalsToUpdate = this.isIndoor ? this.indoorAnimals : this.activeAnimals;
      animalsToUpdate.forEach((animal) => {
        this._updateAnimalRoamAndAnimation(animal, dt, elapsed);
      });

      // Bridge Book Couriers (with cute stepping feet!)
      if (!this.isIndoor && this.showCouriers) {
        this.couriers.forEach((c) => {
          c.progress += dt * c.speed * c.direction;
          if (c.progress >= 1) {
            c.progress = 1;
            c.direction = -1;
            this.onFlowEvent?.(c.flow, "arrived");
          } else if (c.progress <= 0) {
            c.progress = 0;
            c.direction = 1;
            this.onFlowEvent?.(c.flow, "returned");
          }
          const pt = c.curve.getPoint(c.progress);
          const lookT = THREE.MathUtils.clamp(c.progress + c.direction * 0.03, 0, 1);
          const nextPt = c.curve.getPoint(lookT);
          c.mesh.position.copy(pt);
          const stepWave = Math.sin(elapsed * 10 + c.progress * 18);
          c.mesh.position.y += Math.abs(stepWave) * 0.09;
          c.mesh.lookAt(nextPt.x, c.mesh.position.y, nextPt.z);
          const cud = c.mesh.userData;
          if (cud.leftFoot && cud.rightFoot) {
            cud.leftFoot.position.z = 0.10 + stepWave * 0.14;
            cud.rightFoot.position.z = 0.10 - stepWave * 0.14;
          }
          if (cud.bodyPivot) {
            cud.bodyPivot.rotation.z = stepWave * 0.06;
          }
        });
      }

      // Floating Sun-Motes / Fireflies
      if (this.particles && this.particles.visible) {
        this.particles.rotation.y = elapsed * 0.02;
      }

      // Slow star-field rotation
      if (this.stars && this.stars.visible) {
        this.stars.rotation.y = elapsed * 0.004;
      }
    }

    // Focus ring pulse
    if (this.focusRing && this.focusRing.visible) {
      this.focusRingMat.opacity = 0.42 + Math.sin(elapsed * 2.4) * 0.18;
    }

    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  }
}
