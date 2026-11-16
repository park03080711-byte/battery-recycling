/* 실험 장치 3D 장면 (Three.js) — 실제 부품 모양으로, 선은 보기 쉽게 정리한 배치.
   단위는 cm. 브레드보드 구멍 간격 0.254 cm(0.1인치)를 그대로 쓴다.
   이 파일은 "3D로 돌려 보기"를 누를 때만 불러온다(동적 import). */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type RigHandle = {
  dispose: () => void;
  highlight: (n: number | null) => void;
  setFlow: (on: boolean) => void;
  setLevel: (lv: 0 | 1 | 2 | 3) => void;
  /** 모의실험용: 부품(과 그 부품 선)을 보이거나 숨김 */
  setPresent: (n: number, on: boolean) => void;
  /** 모의실험용: DS18B20 신호선이 빠진 모습 */
  setCut: (on: boolean) => void;
  /** 모의실험용: 히터 달아오름 0~1 (null이면 전류 흐름에 맞춰 깜빡임) */
  setHeat: (k: number | null) => void;
  /** 모의실험용: LED 색 · 깜빡임을 직접 정함 (null이면 단계 색) */
  setLed: (s: { color: number | null; blink: "none" | "fast" | "slow" } | null) => void;
  reset: () => void;
  /** 번호 표식의 화면 위치(0~1) */
  marks: () => { n: number; x: number; y: number; hidden: boolean }[];
  snapshot: (w: number, h: number) => string;
  onPick: (cb: (n: number | null) => void) => void;
  onFrame: (cb: () => void) => void;
};

const P = 0.254; // 핀 간격
const BB_TOP = 0.85; // 브레드보드 윗면 높이
const col = (c: number) => (c - 32) * P;
const ROW: Record<string, number> = { a: -1.397, b: -1.143, c: -0.889, d: -0.635, e: -0.381, f: 0.381, g: 0.635, h: 0.889, i: 1.143, j: 1.397 };
const RAIL = { top3v3: -2.25, topGnd: -2.5, bot5v: 2.25, botGnd: 2.5 };

const WIRE = { red: 0xe53935, black: 0x2b2f36, orange: 0xfb8c00, yellow: 0xfdd835, green: 0x43a047, blue: 0x1e88e5, purple: 0x8e24aa, white: 0xe9ecef, brown: 0x8d5a3b, gray: 0x90a4ae };
const BAND: Record<string, number> = { black: 0x141414, brown: 0x6d3b1f, red: 0xd32f2f, orange: 0xf07c12, gold: 0xc9a23a };
const LED = [0x2fdc5a, 0xffd23a, 0xff3b30, 0xff3b30];

export function createRig(canvas: HTMLCanvasElement): RigHandle {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 16 / 10, 0.5, 200);
  const HOME = { pos: new THREE.Vector3(6.0, 17.8, 19.4), target: new THREE.Vector3(2.9, 0, 1.9) };
  camera.position.copy(HOME.pos);

  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(HOME.target);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 12;
  controls.maxDistance = 42;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.update();

  /* 빛 */
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9e1f2, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 2.1);
  sun.position.set(-8, 20, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera as THREE.OrthographicCamera;
  sc.left = -16;
  sc.right = 16;
  sc.top = 14;
  sc.bottom = -14;
  sun.shadow.bias = -0.0004;
  sun.shadow.radius = 4;
  scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.12 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  /* 도우미 */
  const mats: THREE.Material[] = [];
  const geos: THREE.BufferGeometry[] = [];
  const texs: THREE.Texture[] = [];
  const mat = (c: number, o: THREE.MeshStandardMaterialParameters = {}) => {
    const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, metalness: 0.05, ...o });
    mats.push(m);
    return m;
  };
  const mesh = (g: THREE.BufferGeometry, m: THREE.Material, shadow = true) => {
    geos.push(g);
    const o = new THREE.Mesh(g, m);
    o.castShadow = shadow;
    o.receiveShadow = true;
    return o;
  };
  const box = (w: number, h: number, d: number, m: THREE.Material) => mesh(new THREE.BoxGeometry(w, h, d), m);
  const cyl = (rt: number, rb: number, h: number, m: THREE.Material, seg = 24) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  const at = <T extends THREE.Object3D>(o: T, x: number, y: number, z: number) => {
    o.position.set(x, y, z);
    return o;
  };
  const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D, W: number, H: number) => void) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d")!, w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texs.push(t);
    return t;
  };
  /** 윗면만 그림이 있는 상자 */
  const texBox = (w: number, h: number, d: number, side: number, top: THREE.Texture) => {
    const s = mat(side);
    const t = mat(0xffffff, { map: top, roughness: 0.7 });
    mats.push(t);
    return mesh(new THREE.BoxGeometry(w, h, d), [s, s, t, s, s, s] as unknown as THREE.Material);
  };

  /* 부품별 그룹 — 번호 표식 · 강조에 쓴다 */
  const parts = new Map<number, { group: THREE.Group; anchor: THREE.Vector3 }>();
  const part = (n: number, anchor: THREE.Vector3) => {
    const g = new THREE.Group();
    g.userData.part = n;
    scene.add(g);
    parts.set(n, { group: g, anchor });
    return g;
  };

  /* ── 브레드보드 (830구멍) ── */
  {
    const W = 16.5,
      D = 5.5,
      ppu = 64;
    const t = canvasTex(W * ppu, D * ppu, (g, Wp, Hp) => {
      g.fillStyle = "#f3f2ec";
      g.fillRect(0, 0, Wp, Hp);
      const X = (x: number) => (x + W / 2) * ppu;
      const Z = (z: number) => (z + D / 2) * ppu;
      // 가운데 홈
      g.fillStyle = "#e3e1d8";
      g.fillRect(0, Z(-0.17), Wp, 0.34 * ppu);
      const hole = (x: number, z: number) => {
        g.fillStyle = "#6b6a63";
        g.fillRect(X(x) - 3, Z(z) - 3, 6, 6);
      };
      for (let c = 1; c <= 63; c++) for (const r of Object.values(ROW)) hole(col(c), r);
      for (let c = 3; c <= 61; c++) {
        if ((c - 3) % 6 === 5) continue;
        for (const z of Object.values(RAIL)) hole(col(c), z);
      }
      // 레일 색 줄
      const line = (z: number, color: string) => {
        g.fillStyle = color;
        g.fillRect(X(col(2)), Z(z) - 2, X(col(62)) - X(col(2)), 4);
      };
      line(-2.66, "#2f6fd6");
      line(-2.09, "#d83a3a");
      line(2.09, "#d83a3a");
      line(2.66, "#2f6fd6");
      g.fillStyle = "#9a978c";
      g.font = `600 ${0.16 * ppu}px sans-serif`;
      g.textAlign = "center";
      for (let c = 5; c <= 60; c += 5) {
        g.fillText(String(c), X(col(c)), Z(-1.62));
        g.fillText(String(c), X(col(c)), Z(1.72));
      }
      g.fillText("3.3V", X(col(1)), Z(-2.2));
      g.fillText("5V", X(col(1)), Z(2.3));
    });
    const bb = texBox(W, BB_TOP, D, 0xe9e8e1, t);
    at(bb, 0, BB_TOP / 2, 0);
    scene.add(bb);
  }

  /* 구멍 위치 */
  const hole = (c: number, r: string | number) => new THREE.Vector3(col(c), BB_TOP, typeof r === "number" ? r : ROW[r]);

  /* ── 저항: 몸통 · 색띠 · 다리 ── */
  const resistor = (n: number | null, c1: number, c2: number, r: string, body: number, bands: string[], into?: THREE.Group) => {
    const g = new THREE.Group();
    const a = hole(c1, r),
      b = hole(c2, r);
    const len = b.x - a.x;
    const y = BB_TOP + 0.42;
    const prof = [
      [0, -0.44],
      [0.15, -0.44],
      [0.185, -0.37],
      [0.165, -0.25],
      [0.155, 0],
      [0.165, 0.25],
      [0.185, 0.37],
      [0.15, 0.44],
      [0, 0.44],
    ].map(([rr, yy]) => new THREE.Vector2(rr, yy));
    const bodyM = mesh(new THREE.LatheGeometry(prof, 28), mat(body, { roughness: 0.45 }));
    bodyM.rotation.z = Math.PI / 2;
    at(bodyM, a.x + len / 2, y, a.z);
    g.add(bodyM);
    bands.forEach((bc, i) => {
      const xs = [-0.27, -0.15, -0.03, 0.27][i];
      const bm = cyl(0.172, 0.172, 0.06, mat(BAND[bc], { roughness: 0.5 }), 28);
      bm.rotation.z = Math.PI / 2;
      at(bm, a.x + len / 2 + xs, y, a.z);
      g.add(bm);
    });
    const lead = mat(0xc9ccd1, { metalness: 0.8, roughness: 0.3 });
    const legLen = (len - 0.88) / 2;
    for (const s of [-1, 1]) {
      const hx = cyl(0.022, 0.022, legLen, lead, 8);
      hx.rotation.z = Math.PI / 2;
      at(hx, a.x + len / 2 + s * (0.44 + legLen / 2), y, a.z);
      const vx = cyl(0.022, 0.022, y - BB_TOP + 0.05, lead, 8);
      at(vx, s < 0 ? a.x : b.x, (y + BB_TOP) / 2 - 0.02, a.z);
      g.add(hx, vx);
    }
    (into ?? (n === null ? scene : part(n, new THREE.Vector3(a.x + len / 2, y + 0.2, a.z)))).add(g);
    return g;
  };

  /* ── 작은 모듈 기판(KY 계열): 검은 PCB + 핀 헤더 ── */
  const headerPins = (g: THREE.Group, x0: number, z0: number, n: number, dir: "x" | "z", out: 1 | -1) => {
    const plastic = mat(0x1d1f23);
    const gold = mat(0xd4b04c, { metalness: 0.8, roughness: 0.3 });
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < n; i++) {
      const x = dir === "z" ? x0 + (i - (n - 1) / 2) * P : x0;
      const z = dir === "x" ? z0 + (i - (n - 1) / 2) * P : z0;
      const base = box(P * 0.9, 0.25, P * 0.9, plastic);
      at(base, x, 0.2, z);
      const pin = box(0.06, 0.06, 0.6, gold);
      if (dir === "x") pin.rotation.y = Math.PI / 2;
      at(pin, x + (dir === "x" ? out * 0.35 : 0), 0.2, z + (dir === "z" ? out * 0.35 : 0));
      g.add(base, pin);
      pts.push(new THREE.Vector3(x + (dir === "x" ? out * 0.62 : 0), 0.2, z + (dir === "z" ? out * 0.62 : 0)));
    }
    return pts;
  };
  const pcb = (w: number, d: number, color = 0x17191c) => {
    const b = box(w, 0.16, d, mat(color, { roughness: 0.55 }));
    b.position.y = 0.08;
    return b;
  };

  /* ── 1 ESP32 DevKit 38핀 — 안테나가 왼쪽, USB가 오른쪽. 안쪽 줄 핀이 브레드보드 열과 맞도록 놓았다 ── */
  const ESP = { x: -1, z: 6.4 };
  const L = 5.5;
  const espPin: Record<string, THREE.Vector3> = {};
  {
    const g = part(1, new THREE.Vector3(ESP.x + 0.9, 1.2, ESP.z));
    const board = box(L, 0.16, 2.8, mat(0x15171b, { roughness: 0.5 }));
    at(board, ESP.x, 0.9, ESP.z);
    g.add(board);
    const LEFT = ["3V3", "EN", "36", "39", "34", "35", "32", "33", "25", "26", "27", "14", "12", "GND", "13", "D2", "D3", "CMD", "5V"];
    const RIGHT = ["GND", "23", "22", "TX", "RX", "21", "GND2", "19", "18", "5", "17", "16", "4", "0", "2", "15", "D1", "D0", "CLK"];
    const plastic = mat(0x1d1f23);
    const gold = mat(0xd4b04c, { metalness: 0.85, roughness: 0.28 });
    [
      { names: LEFT, z: ESP.z - 1.27, k: "L" },
      { names: RIGHT, z: ESP.z + 1.27, k: "R" },
    ].forEach(({ names, z, k }) => {
      const strip = box(19 * P, 0.25, P, plastic);
      at(strip, ESP.x, 0.69, z);
      g.add(strip);
      names.forEach((nm, i) => {
        const x = ESP.x + (i - 9) * P;
        const pin = box(0.06, 0.82, 0.06, gold);
        at(pin, x, 0.6, z);
        const top = box(0.06, 0.12, 0.06, gold);
        at(top, x, 1.04, z);
        g.add(pin, top);
        espPin[k + nm] = new THREE.Vector3(x, 1.1, z);
      });
    });
    const left = ESP.x - L / 2;
    // WROOM-32 모듈: 안테나 기판 + 금속 덮개
    const modBoard = box(1.9, 0.08, 1.8, mat(0x1b1d22));
    at(modBoard, left + 1.15, 1.02, ESP.z);
    const shieldTex = canvasTex(256, 256, (c, W, H) => {
      c.fillStyle = "#c8ccd3";
      c.fillRect(0, 0, W, H);
      c.fillStyle = "#6c717b";
      c.font = "bold 26px sans-serif";
      c.textAlign = "center";
      c.save();
      c.translate(W / 2, H / 2);
      c.rotate(Math.PI / 2);
      c.fillText("ESP32-WROOM-32", 0, -10);
      c.font = "20px sans-serif";
      c.fillText("Wi-Fi · BT", 0, 22);
      c.restore();
    });
    const shield = texBox(1.3, 0.3, 1.6, 0xb7bcc4, shieldTex);
    shield.material = (shield.material as unknown as THREE.Material[]).map((m, i) => (i === 2 ? m : mat(0xb7bcc4, { metalness: 0.75, roughness: 0.35 }))) as unknown as THREE.Material;
    at(shield, left + 1.55, 1.2, ESP.z);
    const goldTrace = mat(0xd4b04c, { metalness: 0.7, roughness: 0.3 });
    const ant = box(0.06, 0.02, 1.2, goldTrace);
    at(ant, left + 0.35, 1.07, ESP.z);
    const ant2 = box(0.4, 0.02, 0.06, goldTrace);
    at(ant2, left + 0.55, 1.07, ESP.z - 0.57);
    // USB 단자 · 버튼 · 칩
    const usb = box(0.6, 0.25, 0.75, mat(0xb9bec6, { metalness: 0.85, roughness: 0.25 }));
    at(usb, ESP.x + L / 2 - 0.22, 1.1, ESP.z);
    const btnM = mat(0x2a2d33);
    for (const dz of [-0.75, 0.75]) {
      const base = box(0.4, 0.14, 0.32, mat(0xb9bec6, { metalness: 0.7 }));
      at(base, ESP.x + L / 2 - 0.85, 1.05, ESP.z + dz);
      const b = cyl(0.09, 0.09, 0.1, btnM, 16);
      at(b, ESP.x + L / 2 - 0.85, 1.15, ESP.z + dz);
      g.add(base, b);
    }
    const chip = box(0.55, 0.12, 0.55, mat(0x222428));
    at(chip, ESP.x + 0.9, 1.04, ESP.z);
    const reg = box(0.35, 0.14, 0.6, mat(0x222428));
    at(reg, ESP.x + 1.7, 1.05, ESP.z - 0.5);
    const pwr = box(0.12, 0.06, 0.08, mat(0xff4040, { emissive: 0xff2020, emissiveIntensity: 1.5 }));
    at(pwr, ESP.x + 1.3, 1.02, ESP.z + 0.9);
    g.add(modBoard, shield, ant, ant2, usb, chip, reg, pwr);
  }

  /* ── 9 Wi-Fi 물결 (안테나 위) ── */
  const wifi = new THREE.Group();
  {
    const tm = new THREE.MeshBasicMaterial({ color: 0x1a9e90, transparent: true, opacity: 0.85, depthWrite: false });
    mats.push(tm);
    [0.35, 0.65, 0.95].forEach((r, i) => {
      const t = mesh(new THREE.TorusGeometry(r, 0.045, 8, 32, Math.PI * 0.55), tm, false);
      t.rotation.z = Math.PI / 2 - Math.PI * 0.275;
      t.userData.ring = i;
      wifi.add(t);
    });
    wifi.add(mesh(new THREE.SphereGeometry(0.08, 12, 8), tm, false));
    const wx = ESP.x - L / 2 + 0.4;
    at(wifi, wx, 1.7, ESP.z);
    const g = part(9, new THREE.Vector3(wx, 2.95, ESP.z));
    g.add(wifi);
  }

  /* ── 2 릴레이 모듈 (KY-019) — 브레드보드 오른쪽 ── */
  const REL = { x: 10.9, z: -0.9 };
  const relPin: Record<string, THREE.Vector3> = {};
  {
    const g = part(2, new THREE.Vector3(REL.x + 0.2, 2.3, REL.z));
    const inner = new THREE.Group();
    inner.add(pcb(2.7, 3.5, 0x1a1c20));
    const relTex = canvasTex(256, 220, (c, W) => {
      c.fillStyle = "#2f62e0";
      c.fillRect(0, 0, W, 220);
      c.fillStyle = "#e9eefc";
      c.font = "bold 22px sans-serif";
      c.textAlign = "center";
      c.fillText("SONGLE", W / 2, 60);
      c.font = "18px sans-serif";
      c.fillText("SRD-05VDC-SL-C", W / 2, 100);
      c.fillText("10A 250VAC", W / 2, 135);
      c.fillText("10A 30VDC", W / 2, 165);
    });
    const relay = texBox(1.9, 1.55, 1.55, 0x2556cf, relTex);
    at(relay, 0.25, 0.16 + 0.78, 0.35);
    inner.add(relay);
    const term = box(0.8, 0.95, 1.55, mat(0x2a6fdb, { roughness: 0.5 }));
    at(term, -0.92, 0.16 + 0.48, -0.4);
    inner.add(term);
    ["NC", "COM", "NO"].forEach((nm, i) => {
      const z = -0.4 + (i - 1) * 0.5;
      const screw = cyl(0.17, 0.17, 0.06, mat(0xc0c5cc, { metalness: 0.85, roughness: 0.25 }), 18);
      at(screw, -0.92, 1.12, z);
      const slot = box(0.3, 0.02, 0.05, mat(0x5b6068));
      at(slot, -0.92, 1.16, z);
      const mouth = box(0.04, 0.26, 0.3, mat(0x0d0e10));
      at(mouth, -1.33, 0.45, z);
      inner.add(screw, slot, mouth);
      relPin[nm] = new THREE.Vector3(REL.x - 1.4, 0.45, REL.z + z);
    });
    const led = box(0.14, 0.08, 0.1, mat(0xff4646, { emissive: 0xff2020, emissiveIntensity: 1.2 }));
    at(led, 0.85, 0.22, -1.3);
    inner.add(led);
    const pins = headerPins(inner, 0.6, 1.75, 3, "z", 1);
    ["S", "+", "-"].forEach((nm, i) => (relPin[nm] = new THREE.Vector3(REL.x + pins[i].x, 0.2, REL.z + pins[i].z)));
    at(inner, REL.x, 0, REL.z);
    g.add(inner);
  }

  /* ── 3 · 6 · 7 저항 ── */
  resistor(3, 44, 50, "c", 0xe8d2a6, ["red", "red", "brown", "gold"]); // 220 Ω 히터
  const heaterBody = parts.get(3)!.group.children[0].children[0] as THREE.Mesh;
  resistor(6, 50, 56, "d", 0x6f9be8, ["red", "red", "black", "gold"]); // 22 Ω 션트
  {
    const g = part(7, new THREE.Vector3(col(26), BB_TOP + 0.65, ROW.h));
    resistor(null, 20, 26, "h", 0x6f9be8, ["brown", "black", "orange", "gold"], g);
    resistor(null, 26, 32, "i", 0x6f9be8, ["brown", "black", "orange", "gold"], g);
  }
  const glowTex = canvasTex(128, 128, (c, W, H) => {
    const gr = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
    gr.addColorStop(0, "rgba(255,150,60,0.75)");
    gr.addColorStop(1, "rgba(255,150,60,0)");
    c.fillStyle = gr;
    c.fillRect(0, 0, W, H);
  });
  const glowMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, opacity: 0.8 });
  mats.push(glowMat);
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(3.6, 2, 1);
  at(glow, (col(44) + col(50)) / 2, BB_TOP + 0.45, ROW.c);
  scene.add(glow);

  /* ── 4 DS18B20 모듈: 브레드보드 뒤에 두고, 다리를 굽혀 머리를 히터 저항에 기댐 ── */
  const dsPin: Record<string, THREE.Vector3> = {};
  const DSZ = -5.1;
  {
    const cx = (col(44) + col(50)) / 2;
    const g = part(4, new THREE.Vector3(cx + 0.3, 1.0, DSZ));
    const base = new THREE.Group();
    base.add(pcb(1.9, 1.4));
    const pins = headerPins(base, -1.05, 0, 3, "x", -1);
    ["G", "R", "Y"].forEach((nm, i) => (dsPin[nm] = new THREE.Vector3(cx + pins[i].x, 0.2, DSZ + pins[i].z)));
    const smd = box(0.3, 0.1, 0.2, mat(0x2a2d33));
    at(smd, 0.3, 0.2, -0.35);
    base.add(smd);
    at(base, cx, 0, DSZ);
    g.add(base);
    const leg = mat(0xc9ccd1, { metalness: 0.8, roughness: 0.3 });
    const headPos = new THREE.Vector3(cx, BB_TOP + 0.62, ROW.c - 0.46);
    [-0.1, 0, 0.1].forEach((dx) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(cx + dx * 2.5, 0.18, DSZ + 0.6),
        new THREE.Vector3(cx + dx * 2, 1.25, DSZ + 1.4),
        new THREE.Vector3(cx + dx * 1.4, BB_TOP + 0.95, -2.4),
        new THREE.Vector3(headPos.x + dx, headPos.y + 0.1, headPos.z - 0.3),
      ]);
      g.add(mesh(new THREE.TubeGeometry(curve, 32, 0.022, 6), leg));
    });
    const to92 = mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.55, 24, 1, false, 0, Math.PI), mat(0x15161a, { roughness: 0.4 }));
    to92.rotation.x = -Math.PI / 2 + 0.35;
    at(to92, headPos.x, headPos.y, headPos.z);
    g.add(to92);
  }

  /* ── 5 NTC 모듈 (KY-013): 히터에서 떨어진 왼쪽 뒤 ── */
  const ntcPin: Record<string, THREE.Vector3> = {};
  {
    const NX = col(21),
      NZ = -5.1;
    const g = part(5, new THREE.Vector3(NX, 1.1, NZ - 0.2));
    const base = new THREE.Group();
    base.add(pcb(1.9, 1.4));
    const pins = headerPins(base, 0, 0.82, 3, "z", 1);
    ["-", "+", "S"].forEach((nm, i) => (ntcPin[nm] = new THREE.Vector3(NX + pins[i].x, 0.2, NZ + pins[i].z)));
    const bead = mesh(new THREE.SphereGeometry(0.17, 16, 12), mat(0x1c1c1c, { roughness: 0.3 }));
    bead.scale.set(1, 0.8, 1.2);
    at(bead, 0.1, 0.62, -0.3);
    const legM = mat(0xc9ccd1, { metalness: 0.8, roughness: 0.3 });
    for (const dx of [-0.05, 0.25]) {
      const l = cyl(0.02, 0.02, 0.45, legM, 6);
      at(l, dx, 0.38, -0.3);
      base.add(l);
    }
    const res = box(0.3, 0.1, 0.18, mat(0x2a2d33));
    at(res, -0.45, 0.2, 0.1);
    base.add(bead, res);
    at(base, NX, 0, NZ);
    g.add(base);
  }

  /* ── 8 RGB LED 모듈 (KY-016) — 브레드보드 아래쪽 열 27~30에 세워 꽂음 ── */
  let ledMat: THREE.MeshStandardMaterial;
  let ledLight: THREE.PointLight;
  {
    const cx = (col(27) + col(30)) / 2,
      cz = ROW.f;
    const g = part(8, new THREE.Vector3(cx, BB_TOP + 2.1, cz));
    const board = box(1.5, 1.6, 0.16, mat(0x17191c, { roughness: 0.55 }));
    at(board, cx, BB_TOP + 1.05, cz - 0.15);
    g.add(board);
    const gold = mat(0xd4b04c, { metalness: 0.8, roughness: 0.3 });
    const plastic = mat(0x1d1f23);
    const strip = box(4 * P, 0.25, P * 0.9, plastic);
    at(strip, cx, BB_TOP + 0.15, cz);
    g.add(strip);
    for (const c of [27, 28, 29, 30]) {
      const pin = box(0.06, 0.4, 0.06, gold);
      at(pin, col(c), BB_TOP + 0.05, cz);
      g.add(pin);
    }
    ledMat = mat(LED[0], { emissive: LED[0], emissiveIntensity: 1.6, transparent: true, opacity: 0.92, roughness: 0.2 });
    const dome = mesh(new THREE.SphereGeometry(0.25, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), ledMat);
    dome.rotation.x = Math.PI / 2;
    at(dome, cx, BB_TOP + 1.25, cz + 0.4);
    const stem = cyl(0.25, 0.25, 0.42, ledMat);
    stem.rotation.x = Math.PI / 2;
    at(stem, cx, BB_TOP + 1.25, cz + 0.12);
    g.add(dome, stem);
    ledLight = new THREE.PointLight(LED[0], 2.2, 4, 2);
    at(ledLight, cx, BB_TOP + 1.3, cz + 0.9);
    scene.add(ledLight);
  }

  /* ── 점퍼선: 둥근 모서리 경로 ── */
  const plug = mat(0x1d1f23);
  /** 선을 부품별 묶음에 담는다 (모의실험에서 부품을 빼면 선도 같이 숨김) */
  const wireGroups = new Map<string, THREE.Group>();
  let owner: THREE.Group | null = null;
  const own = <T>(key: string, fn: () => T): T => {
    let g = wireGroups.get(key);
    if (!g) {
      g = new THREE.Group();
      scene.add(g);
      wireGroups.set(key, g);
    }
    const prev = owner;
    owner = g;
    const r = fn();
    owner = prev;
    return r;
  };
  const put = (o: THREE.Object3D) => (owner ?? scene).add(o);
  const route = (pts: THREE.Vector3[], color: number, r = 0.28, rad = 0.055) => {
    const path = new THREE.CurvePath<THREE.Vector3>();
    let prev = pts[0];
    for (let i = 1; i < pts.length - 1; i++) {
      const v = pts[i];
      const a = v.clone().add(pts[i - 1].clone().sub(v).setLength(Math.min(r, v.distanceTo(pts[i - 1]) / 2)));
      const b = v.clone().add(pts[i + 1].clone().sub(v).setLength(Math.min(r, v.distanceTo(pts[i + 1]) / 2)));
      if (prev.distanceTo(a) > 1e-4) path.add(new THREE.LineCurve3(prev, a));
      path.add(new THREE.QuadraticBezierCurve3(a, v, b));
      prev = b;
    }
    path.add(new THREE.LineCurve3(prev, pts[pts.length - 1]));
    const segs = Math.max(24, Math.round(path.getLength() * 10));
    put(mesh(new THREE.TubeGeometry(path as unknown as THREE.Curve<THREE.Vector3>, segs, rad, 8), mat(color, { roughness: 0.45 })));
    return path;
  };
  const ends = (...ps: THREE.Vector3[]) =>
    ps.forEach((p) => {
      const c = box(0.2, 0.42, 0.2, plug);
      at(c, p.x, p.y + 0.24, p.z);
      put(c);
    });
  const H = (c: number, r: string | number, dy = 0) => hole(c, r).setY(BB_TOP + dy);
  const AIR = BB_TOP + 1.05; // ESP에서 브레드보드로 건너가는 높이
  /** ESP 안쪽 줄 핀 → 브레드보드 구멍: 같은 x로 곧게 (열을 맞춰 두었다) */
  const straight = (pin: THREE.Vector3, h: THREE.Vector3, color: number, air = AIR) => {
    const pts = [pin.clone().setY(pin.y + 0.05), pin.clone().setY(air), new THREE.Vector3(pin.x, air, pin.z - 0.6), new THREE.Vector3(h.x, air, h.z + 0.5), h.clone().setY(BB_TOP + 0.45), h.clone().setY(BB_TOP + 0.02)];
    ends(pin, h);
    return route(pts, color);
  };
  /** 브레드보드 위 짧은 선 (낮게) */
  const flat = (pts: THREE.Vector3[], color: number) => {
    const a = pts[0],
      b = pts[pts.length - 1];
    const lift = (p: THREE.Vector3) => p.clone().setY(BB_TOP + 0.12);
    return route([a.clone().setY(BB_TOP + 0.02), lift(a), ...pts.slice(1, -1).map(lift), lift(b), b.clone().setY(BB_TOP + 0.02)], color, 0.14, 0.05);
  };
  /** 브레드보드 뒤 모듈 핀 → 뒤 통로(탁자 높이) → 보드 위 구멍 */
  const fromBack = (tip: THREE.Vector3, dir: THREE.Vector3, lane: number, h: THREE.Vector3, color: number) => {
    const o = tip.clone().add(dir.clone().multiplyScalar(0.35));
    const pts = [tip, o.clone().setY(0.18)];
    pts.push(new THREE.Vector3(o.x, 0.18, lane), new THREE.Vector3(h.x, 0.18, lane), new THREE.Vector3(h.x, BB_TOP + 0.45, -2.85), h.clone().setY(BB_TOP + 0.45), h.clone().setY(BB_TOP + 0.02));
    ends(h);
    return route(pts, color, 0.24);
  };

  // ESP → 브레드보드 (곧은 선 묶음)
  const w5v = straight(espPin.L5V, H(37, RAIL.bot5v), WIRE.red);
  const wGnd = straight(espPin.LGND, H(31, RAIL.botGnd), WIRE.black);
  straight(espPin.L3V3, H(19, RAIL.top3v3), WIRE.orange, AIR + 0.25);
  own("p5", () => straight(espPin.L36, H(21, "e"), WIRE.gray, AIR + 0.2));
  own("p6", () => straight(espPin.L32, H(25, "e"), WIRE.blue, AIR + 0.2));
  own("p7", () => straight(espPin.L33, H(26, "g"), WIRE.green));
  own("p8", () => {
    straight(espPin.L25, H(27, "j"), WIRE.red, AIR - 0.3);
    straight(espPin.L26, H(28, "j"), WIRE.green, AIR - 0.3);
    straight(espPin.L27, H(29, "j"), WIRE.blue, AIR - 0.3);
  });
  own("p4sig", () => straight(espPin.L13, H(33, "e"), WIRE.white, AIR + 0.2));
  // 보드 위 짧은 선
  const wBridge = flat([H(3, RAIL.botGnd), H(3, 0), H(3, RAIL.topGnd)], WIRE.black);
  own("p6", () => flat([H(25, "b"), H(50, "b")], WIRE.blue)); // GPIO32 → A점(50열)
  const wShuntGnd = flat([H(56, "a"), H(56, -2.0), H(57, -2.0), H(57, RAIL.topGnd)], WIRE.black);
  own("p7", () => {
    flat([H(20, "j"), H(21, RAIL.bot5v)], WIRE.red); // 분압 위
    flat([H(32, "j"), H(33, RAIL.botGnd)], WIRE.black); // 분압 아래
  });
  own("p8", () => flat([H(30, "j"), H(30, RAIL.botGnd)], WIRE.black)); // RGB −
  // 브레드보드 뒤 모듈
  own("p5", () => {
    fromBack(ntcPin.S, new THREE.Vector3(0, 0, 1), -3.0, H(21, "a"), WIRE.gray);
    fromBack(ntcPin["+"], new THREE.Vector3(0, 0, 1), -3.25, H(21, RAIL.top3v3), WIRE.orange);
    fromBack(ntcPin["-"], new THREE.Vector3(0, 0, 1), -3.5, H(19, RAIL.topGnd), WIRE.black);
  });
  own("p4sig", () => fromBack(dsPin.Y, new THREE.Vector3(-1, 0, 0), -3.0, H(33, "a"), WIRE.white));
  own("p4", () => {
    fromBack(dsPin.R, new THREE.Vector3(-1, 0, 0), -3.25, H(40, RAIL.top3v3), WIRE.orange);
    fromBack(dsPin.G, new THREE.Vector3(-1, 0, 0), -3.5, H(41, RAIL.topGnd), WIRE.black);
  });
  // 릴레이
  const relayIn = (tip: THREE.Vector3, h: THREE.Vector3, color: number, air: number) => {
    const pts = [tip, tip.clone().add(new THREE.Vector3(0, 0, 0.35)), new THREE.Vector3(tip.x, air, tip.z + 0.6), new THREE.Vector3(h.x + 0.4, air, h.z), h.clone().setY(BB_TOP + 0.45), h.clone().setY(BB_TOP + 0.02)];
    ends(h);
    return route(pts, color);
  };
  own("p2", () => {
    relayIn(relPin["+"], H(61, RAIL.bot5v), WIRE.red, BB_TOP + 0.7);
    relayIn(relPin["-"], H(60, RAIL.botGnd), WIRE.black, BB_TOP + 0.5);
  });
  const termOut = (tip: THREE.Vector3, h: THREE.Vector3, color: number, air: number) => {
    const pts = [tip, tip.clone().add(new THREE.Vector3(-0.35, 0, 0)), new THREE.Vector3(tip.x - 0.6, air, tip.z), new THREE.Vector3(h.x + 0.5, air, h.z), h.clone().setY(BB_TOP + 0.45), h.clone().setY(BB_TOP + 0.02)];
    ends(h);
    return route(pts, color);
  };
  const wCom = own("p2", () => termOut(relPin.COM, H(58, RAIL.bot5v), WIRE.red, BB_TOP + 0.9));
  const wNo = own("p2", () => termOut(relPin.NO, H(44, "e"), WIRE.yellow, BB_TOP + 1.2));
  // GPIO22: ESP 바깥 줄 → ESP 뒤 통로 → 오른쪽 통로 → 릴레이 S
  {
    const p = espPin.R22,
      t = relPin.S;
    const y = 2.45;
    const pts = [p.clone().setY(p.y + 0.05), p.clone().setY(y), new THREE.Vector3(p.x, y, 3.5), new THREE.Vector3(t.x, y, 3.5), new THREE.Vector3(t.x, y, t.z + 0.9), new THREE.Vector3(t.x, 0.2, t.z + 0.55), t];
    own("p2", () => {
      ends(p);
      route(pts, WIRE.purple, 0.35);
    });
  }

  /* ── 전류 흐름: 5V → 레일 → 릴레이 COM → NO → 220 Ω → A → 22 Ω → GND ── */
  const R = BB_TOP + 0.42;
  const seg = (a: THREE.Vector3, b: THREE.Vector3) => new THREE.LineCurve3(a, b);
  const rev = (cp: THREE.CurvePath<THREE.Vector3>) => {
    const out = new THREE.CurvePath<THREE.Vector3>();
    const pts = cp.getSpacedPoints(80).reverse();
    for (let i = 1; i < pts.length; i++) out.add(new THREE.LineCurve3(pts[i - 1], pts[i]));
    return out;
  };
  const path = new THREE.CurvePath<THREE.Vector3>();
  const addAll = (cp: THREE.CurvePath<THREE.Vector3>) => cp.curves.forEach((c) => path.add(c));
  addAll(w5v);
  path.add(seg(H(37, RAIL.bot5v, 0.05), H(58, RAIL.bot5v, 0.05)));
  addAll(rev(wCom));
  path.add(seg(relPin.COM, relPin.NO));
  addAll(wNo);
  path.add(seg(H(44, "e", 0.05), H(44, "c", R - BB_TOP)));
  path.add(seg(H(44, "c", R - BB_TOP), H(50, "c", R - BB_TOP)));
  path.add(seg(H(50, "c", R - BB_TOP), H(50, "d", R - BB_TOP)));
  path.add(seg(H(50, "d", R - BB_TOP), H(56, "d", R - BB_TOP)));
  path.add(seg(H(56, "d", R - BB_TOP), H(56, "a", 0.05)));
  addAll(wShuntGnd);
  path.add(seg(H(57, RAIL.topGnd, 0.05), H(3, RAIL.topGnd, 0.05)));
  addAll(rev(wBridge));
  path.add(seg(H(3, RAIL.botGnd, 0.05), H(31, RAIL.botGnd, 0.05)));
  addAll(rev(wGnd));
  const dotMat = new THREE.MeshBasicMaterial({ color: 0xffd23a });
  mats.push(dotMat);
  const dotGeo = new THREE.SphereGeometry(0.085, 10, 8);
  geos.push(dotGeo);
  const NDOT = 80;
  const dots = new THREE.InstancedMesh(dotGeo, dotMat, NDOT);
  scene.add(dots);
  const tmp = new THREE.Object3D();

  /* ── 상태 ── */
  let flowOn = true;
  let level: 0 | 1 | 2 | 3 = 0;
  let heatK: number | null = null;
  let cut = false;
  let ledOv: { color: number | null; blink: "none" | "fast" | "slow" } | null = null;
  let ledOn = true;
  let hi: number | null = null;
  const baseEmissive = new Map<THREE.MeshStandardMaterial, { c: THREE.Color; i: number }>();
  const setHighlight = (n: number | null) => {
    hi = n;
    baseEmissive.forEach((v, m) => {
      m.emissive.copy(v.c);
      m.emissiveIntensity = v.i;
    });
    baseEmissive.clear();
    if (n === null) return;
    parts.get(n)?.group.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[] | undefined;
      const list = Array.isArray(m) ? m : m ? [m] : [];
      list.forEach((mm) => {
        if (!(mm instanceof THREE.MeshStandardMaterial) || baseEmissive.has(mm) || mm === ledMat) return;
        baseEmissive.set(mm, { c: mm.emissive.clone(), i: mm.emissiveIntensity });
        mm.emissive.set(0x3b5bdb);
        mm.emissiveIntensity = 0.55;
      });
    });
  };

  /* ── 고르기 ── */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let pickCb: ((n: number | null) => void) | null = null;
  let downAt = { x: 0, y: 0 };
  const onDown = (e: PointerEvent) => (downAt = { x: e.clientX, y: e.clientY });
  const onUp = (e: PointerEvent) => {
    if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 5) return;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const groups = [...parts.values()].map((p) => p.group);
    const hit = ray.intersectObjects(groups, true)[0];
    let n: number | null = null;
    for (let o: THREE.Object3D | null = hit?.object ?? null; o; o = o.parent)
      if (typeof o.userData.part === "number") {
        n = o.userData.part;
        break;
      }
    pickCb?.(n);
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointerup", onUp);

  /* ── 크기 · 루프 ── */
  const size = () => {
    const w = canvas.clientWidth,
      h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(size);
  ro.observe(canvas);
  size();

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let frameCb: (() => void) | null = null;
  let raf = 0;
  let visible = true;
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(loop);
  });
  io.observe(canvas);
  const clock = new THREE.Clock();
  const v = new THREE.Vector3();

  function drawFlow(t: number) {
    dots.visible = flowOn;
    if (!flowOn) return;
    for (let i = 0; i < NDOT; i++) {
      const u = (i / NDOT + (reduce ? 0 : t * 0.045)) % 1;
      path.getPointAt(u, v);
      tmp.position.copy(v);
      tmp.updateMatrix();
      dots.setMatrixAt(i, tmp.matrix);
    }
    dots.instanceMatrix.needsUpdate = true;
  }
  function animate(t: number) {
    drawFlow(t);
    const hm = heaterBody.material as THREE.MeshStandardMaterial;
    hm.emissive.set(0xff7a1a);
    if (heatK === null) {
      const k = flowOn ? 0.55 + 0.25 * Math.sin(t * 2.2) * (reduce ? 0 : 1) : 0;
      hm.emissiveIntensity = k;
      glowMat.opacity = flowOn ? 0.55 + 0.25 * k : 0;
    } else {
      hm.emissiveIntensity = heatK * 1.1;
      glowMat.opacity = Math.min(1, heatK * 1.15);
      glow.scale.set(2.4 + heatK * 1.6, 1.4 + heatK * 0.9, 1);
    }
    const mode = ledOv ? ledOv.blink : level === 3 ? "fast" : "none";
    const blink = reduce || mode === "none" ? true : mode === "fast" ? Math.floor(t / 0.15) % 2 === 0 : Math.floor(t / 0.5) % 2 === 0;
    const lit = ledOn && blink && !(ledOv && ledOv.color === null);
    ledMat.emissiveIntensity = lit ? 1.6 : 0.02;
    ledMat.opacity = lit ? 0.92 : 0.55;
    ledLight.intensity = lit ? 2.2 : 0;
    wifi.children.forEach((c) => {
      const ring = c.userData.ring as number | undefined;
      if (ring === undefined) return;
      ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.85;
      c.visible = reduce ? true : (Math.floor(t * 2.5) % 4) >= ring;
    });
    wifi.lookAt(camera.position.x, wifi.position.y, camera.position.z);
  }
  function loop() {
    raf = 0;
    if (!visible) return;
    controls.update();
    animate(clock.getElapsedTime());
    renderer.render(scene, camera);
    frameCb?.();
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);

  const handle: RigHandle = {
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      controls.dispose();
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      texs.forEach((t) => t.dispose());
      dots.dispose();
      renderer.dispose();
    },
    highlight: setHighlight,
    setFlow(on) {
      flowOn = on;
    },
    setLevel(lv) {
      level = lv;
      if (ledOv) return;
      ledMat.color.set(LED[lv]);
      ledMat.emissive.set(LED[lv]);
      ledLight.color.set(LED[lv]);
    },
    setPresent(n, on) {
      const p = parts.get(n);
      if (p) p.group.visible = on;
      const w = wireGroups.get(`p${n}`);
      if (w) w.visible = on;
      if (n === 4) {
        const s = wireGroups.get("p4sig");
        if (s) s.visible = on && !cut;
      }
      if (n === 8) ledOn = on;
    },
    setCut(on) {
      cut = on;
      const s = wireGroups.get("p4sig");
      if (s) s.visible = !on && (parts.get(4)?.group.visible ?? true);
    },
    setHeat(k) {
      heatK = k === null ? null : Math.max(0, Math.min(1, k));
    },
    setLed(st) {
      ledOv = st;
      const c = st ? (st.color ?? 0x3a3d44) : LED[level];
      ledMat.color.set(c);
      ledMat.emissive.set(c);
      ledLight.color.set(c);
    },
    reset() {
      camera.position.copy(HOME.pos);
      controls.target.copy(HOME.target);
      controls.update();
    },
    marks() {
      const out: { n: number; x: number; y: number; hidden: boolean }[] = [];
      parts.forEach((p, n) => {
        v.copy(p.anchor).project(camera);
        out.push({ n, x: (v.x + 1) / 2, y: (1 - v.y) / 2, hidden: v.z > 1 });
      });
      return out.sort((a, b) => a.n - b.n);
    },
    snapshot(w, h) {
      const pr = renderer.getPixelRatio();
      renderer.setPixelRatio(1);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      animate(1.3);
      renderer.render(scene, camera);
      const url = canvas.toDataURL("image/png");
      renderer.setPixelRatio(pr);
      size();
      return url;
    },
    onPick(cb) {
      pickCb = cb;
    },
    onFrame(cb) {
      frameCb = cb;
    },
  };
  void hi;
  return handle;
}
