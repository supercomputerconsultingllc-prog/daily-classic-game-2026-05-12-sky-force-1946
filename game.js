const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMessage = document.getElementById("overlayMessage");
const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");

const scoreValue = document.getElementById("scoreValue");
const livesValue = document.getElementById("livesValue");
const bombsValue = document.getElementById("bombsValue");
const weaponValue = document.getElementById("weaponValue");
const bestValue = document.getElementById("bestValue");
const stageValue = document.getElementById("stageValue");
const speedValue = document.getElementById("speedValue");
const optionValue = document.getElementById("optionValue");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const PLAY_X = 186;
const PLAY_W = WIDTH - PLAY_X * 2;
const PLAY_RIGHT = PLAY_X + PLAY_W;
const PLAY_CENTER = PLAY_X + PLAY_W / 2;

function playT(t) {
  return PLAY_X + PLAY_W * t;
}

const images = {
  background: new Image(),
  player: new Image(),
  enemyScout: new Image(),
  enemyFighter: new Image(),
  enemyBoss: new Image(),
  enemyGunship: new Image(),
  enemyHeavy: new Image(),
  enemyCarrier: new Image(),
  bulletPlayer: new Image(),
  bulletEnemy: new Image(),
  powerP: new Image(),
  powerB: new Image(),
  powerS: new Image(),
  powerO: new Image(),
  power1UP: new Image(),
  powerScore: new Image(),
  medal: new Image(),
  option: new Image(),
  explosionSmall: new Image(),
  explosionMedium: new Image(),
  explosionBoss: new Image(),
  vfxImpact: new Image(),
  weaponsProjectiles: new Image(),
  weaponsOrdnance: new Image(),
  cloudOverlay: new Image()
};

images.background.src = "assets/bg-cloud-warzone.png";
images.player.src = "assets/player-plane.png";
images.enemyScout.src = "assets/enemy-scout.png";
images.enemyFighter.src = "assets/enemy-fighter.png";
images.enemyBoss.src = "assets/enemy-boss.png";
images.enemyGunship.src = "assets/enemy-gunship.png";
images.enemyHeavy.src = "assets/enemy-heavy.png";
images.enemyCarrier.src = "assets/enemy-carrier.png";
images.bulletPlayer.src = "assets/bullet-player.png";
images.bulletEnemy.src = "assets/bullet-enemy.png";
images.powerP.src = "assets/power-spread.png";
images.powerB.src = "assets/power-bomb.png";
images.powerS.src = "assets/power-speed.png";
images.powerO.src = "assets/power-option.png";
images.power1UP.src = "assets/power-1up.png";
images.powerScore.src = "assets/power-score.png";
images.medal.src = "assets/medal.png";
images.option.src = "assets/option-drone.png";
images.explosionSmall.src = "assets/explosion-small-sheet.png";
images.explosionMedium.src = "assets/explosion-medium-sheet.png";
images.explosionBoss.src = "assets/explosion-boss-sheet.png";
images.vfxImpact.src = "assets/vfx-impact-sheet.png";
images.weaponsProjectiles.src = "assets/weapons-projectiles-sheet.png";
images.weaponsOrdnance.src = "assets/weapons-ordnance-sheet.png";
images.cloudOverlay.src = "assets/bg-cloud-overlay.png";

const input = {
  keys: new Set(),
  pointerActive: false,
  pointerX: PLAY_CENTER,
  pointerY: HEIGHT - 180
};

const ENEMY_TYPES = {
  scout: {
    sprite: "enemyScout",
    width: 62,
    height: 80,
    hp: 2,
    vy: 3.1,
    score: 120,
    shot: [1300, 1900]
  },
  fighter: {
    sprite: "enemyFighter",
    width: 76,
    height: 98,
    hp: 5,
    vy: 2.6,
    score: 320,
    shot: [850, 1300]
  },
  dive: {
    sprite: "enemyFighter",
    width: 74,
    height: 94,
    hp: 5,
    vy: 2.8,
    score: 330,
    shot: [820, 1280]
  },
  formation: {
    sprite: "enemyScout",
    width: 58,
    height: 74,
    hp: 4,
    vy: 2.4,
    score: 260,
    shot: [980, 1400]
  },
  bomber: {
    sprite: "enemyHeavy",
    width: 106,
    height: 126,
    hp: 12,
    vy: 1.9,
    score: 760,
    shot: [680, 980]
  },
  gunship: {
    sprite: "enemyGunship",
    width: 110,
    height: 116,
    hp: 18,
    vy: 1.7,
    score: 1250,
    shot: [460, 740]
  },
  heavyBomber: {
    sprite: "enemyHeavy",
    width: 136,
    height: 156,
    hp: 30,
    vy: 1.2,
    score: 2300,
    shot: [520, 760]
  },
  carrier: {
    sprite: "enemyCarrier",
    width: 174,
    height: 166,
    hp: 42,
    vy: 1.1,
    score: 3100,
    shot: [560, 860]
  },
  boss: {
    sprite: "enemyBoss",
    width: 272,
    height: 232,
    hp: 360,
    vy: 1.05,
    score: 50000,
    shot: [250, 420]
  }
};

const WEAPON_CONFIGS = [
  null,
  {
    fireInterval: 8 / 60,
    pattern: [{ angle: -Math.PI / 2, offsetX: 0, offsetY: -8, damage: 1, rear: false }]
  },
  {
    fireInterval: 7 / 60,
    pattern: [
      { angle: -Math.PI / 2, offsetX: -5, offsetY: -6, damage: 1, rear: false },
      { angle: -Math.PI / 2, offsetX: 5, offsetY: -6, damage: 1, rear: false }
    ]
  },
  {
    fireInterval: 6 / 60,
    pattern: [
      { angle: -Math.PI / 2, offsetX: 0, offsetY: -8, damage: 1, rear: false },
      { angle: -Math.PI / 2 - 0.18, offsetX: -8, offsetY: -4, damage: 1, rear: false },
      { angle: -Math.PI / 2 + 0.18, offsetX: 8, offsetY: -4, damage: 1, rear: false }
    ]
  },
  {
    fireInterval: 5 / 60,
    pattern: [
      { angle: -Math.PI / 2, offsetX: 0, offsetY: -8, damage: 1, rear: false },
      { angle: -Math.PI / 2 - 0.18, offsetX: -8, offsetY: -4, damage: 1, rear: false },
      { angle: -Math.PI / 2 + 0.18, offsetX: 8, offsetY: -4, damage: 1, rear: false },
      { angle: -Math.PI / 2 - 0.42, offsetX: -14, offsetY: 0, damage: 1, rear: false },
      { angle: -Math.PI / 2 + 0.42, offsetX: 14, offsetY: 0, damage: 1, rear: false }
    ]
  },
  {
    fireInterval: 4 / 60,
    pattern: [
      { angle: -Math.PI / 2, offsetX: 0, offsetY: -8, damage: 1, rear: false },
      { angle: -Math.PI / 2 - 0.18, offsetX: -8, offsetY: -4, damage: 1, rear: false },
      { angle: -Math.PI / 2 + 0.18, offsetX: 8, offsetY: -4, damage: 1, rear: false },
      { angle: -Math.PI / 2 - 0.42, offsetX: -14, offsetY: 0, damage: 1, rear: false },
      { angle: -Math.PI / 2 + 0.42, offsetX: 14, offsetY: 0, damage: 1, rear: false },
      { angle: -Math.PI / 2 - 0.32, offsetX: -4, offsetY: -10, damage: 1, rear: false },
      { angle: -Math.PI / 2 + 0.32, offsetX: 4, offsetY: -10, damage: 1, rear: false },
      { angle: Math.PI / 2, offsetX: 0, offsetY: 8, damage: 0.8, rear: true }
    ]
  }
];

function safeReadNumber(key, fallback) {
  try {
    const value = Number(window.localStorage.getItem(key));
    return Number.isFinite(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function safeWriteNumber(key, value) {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // file:// may block storage in some embedded webviews.
  }
}

function loadAll(imageMap) {
  return Promise.all(
    Object.values(imageMap).map(
      (img) =>
        new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        })
    )
  );
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function rectHit(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

const state = {
  mode: "loading",
  score: 0,
  best: safeReadNumber("sky-force-1946-best", 0),
  lives: 3,
  bombs: 3,
  power: 1,
  speedLevel: 1,
  stage: 1,
  waveLabel: "0/0",
  runningAction: null,
  lastFrame: performance.now(),
  scrollY: 0,
  elapsedMs: 0,
  script: [],
  scriptIndex: 0,
  combatEventsTotal: 0,
  bossActive: false,
  invulnerableUntil: 0,
  bombActiveUntil: 0,
  bombFlashUntil: 0,
  bombPulseAt: 0,
  bannerText: "",
  bannerUntil: 0,
  medalValue: 100
};

const player = {
  x: PLAY_CENTER - 44,
  y: HEIGHT - 165,
  width: 88,
  height: 108,
  speedBase: 240,
  fireStamp: 0,
  trail: []
};

let optionDrones = [];
let playerBullets = [];
let enemyBullets = [];
let enemies = [];
let powerUps = [];
let particles = [];

let audioContext = null;

function ensureAudio() {
  if (!audioContext) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audioContext = new Ctx();
  }
}

function tone(freq, duration = 0.06, type = "square", volume = 0.02) {
  if (!audioContext) return;
  const now = audioContext.currentTime;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start(now);
  osc.stop(now + duration);
}

function showOverlay(title, message, actionLabel, action) {
  overlayTitle.textContent = title;
  overlayMessage.textContent = message;
  startButton.textContent = actionLabel;
  state.runningAction = action;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function setBestScore() {
  if (state.score > state.best) {
    state.best = state.score;
    safeWriteNumber("sky-force-1946-best", state.best);
  }
}

function syncHud() {
  scoreValue.textContent = String(state.score);
  bestValue.textContent = String(state.best);
  livesValue.textContent = String(state.lives);
  bombsValue.textContent = String(state.bombs);
  weaponValue.textContent = `P${state.power}`;
  stageValue.textContent = `${state.stage}-${state.waveLabel}`;
  if (speedValue) speedValue.textContent = `S${state.speedLevel}`;
  if (optionValue) optionValue.textContent = String(optionDrones.length);
}

function showBanner(text, durationMs = 1400) {
  state.bannerText = text;
  state.bannerUntil = performance.now() + durationMs;
}

function spawnBurst(x, y, count, color) {
  for (let i = 0; i < count; i += 1) {
    particles.push({
      x,
      y,
      vx: rand(-4.6, 4.6),
      vy: rand(-4.6, 3.9),
      size: rand(2, 5),
      color,
      life: rand(0.25, 0.92),
      age: 0
    });
  }
}

function resetPlayerPosition() {
  player.x = PLAY_CENTER - player.width / 2;
  player.y = HEIGHT - 165;
  input.pointerX = player.x + player.width / 2;
  input.pointerY = player.y + player.height / 2;
  player.trail = [];
}

function addOptionDrone() {
  if (optionDrones.length >= 2) return;
  optionDrones.push({
    x: player.x + player.width / 2,
    y: player.y + player.height * 0.75,
    width: 34,
    height: 34,
    lag: 18 * (optionDrones.length + 1),
    phase: Math.random() * Math.PI * 2
  });
  syncHud();
}

function removeOptionDrone() {
  if (optionDrones.length === 0) return;
  optionDrones.pop();
  syncHud();
}

function updatePlayerTrail() {
  player.trail.push({
    x: player.x + player.width / 2,
    y: player.y + player.height * 0.75
  });

  if (player.trail.length > 260) {
    player.trail.shift();
  }
}

function updateOptionDrones(nowMs) {
  optionDrones.forEach((opt, idx) => {
    const lagIndex = Math.max(0, player.trail.length - 1 - opt.lag);
    const target = player.trail[lagIndex] || {
      x: player.x + player.width / 2,
      y: player.y + player.height * 0.75
    };

    const bob = Math.sin(nowMs * 0.004 + idx * Math.PI) * 3;
    opt.x += (target.x - opt.x) * 0.25;
    opt.y += (target.y + bob - opt.y) * 0.25;
  });
}

function playerHitbox() {
  const cx = player.x + player.width / 2;
  const cy = player.y + player.height / 2;
  return {
    x: cx - 3,
    y: cy - 3,
    width: 6,
    height: 6
  };
}

function currentPlayerSpeed() {
  return player.speedBase + (state.speedLevel - 1) * 30;
}

function spawnPlayerBullet(originX, originY, angle, damage = 1, speed = 14.5) {
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;
  playerBullets.push({
    x: originX - 6,
    y: originY - 12,
    width: 12,
    height: 24,
    vx,
    vy,
    damage
  });
}

function fireVolley(originX, originY, damageMult = 1) {
  const config = WEAPON_CONFIGS[state.power];
  for (const shot of config.pattern) {
    const speed = shot.rear ? 11 : 14.5;
    spawnPlayerBullet(originX + shot.offsetX, originY + shot.offsetY, shot.angle, shot.damage * damageMult, speed);
  }
}

function firePlayer(nowMs) {
  const config = WEAPON_CONFIGS[state.power];
  const delayMs = config.fireInterval * 1000;
  if (nowMs - player.fireStamp < delayMs) return;

  player.fireStamp = nowMs;
  const cx = player.x + player.width / 2;
  const cy = player.y + player.height * 0.1;
  fireVolley(cx, cy, 1);

  for (const option of optionDrones) {
    fireVolley(option.x, option.y - 8, 0.5);
  }

  tone(760, 0.03, "square", 0.012);
}

function spawnEnemy(type, x, y, pattern = "straight", overrides = {}) {
  const def = ENEMY_TYPES[type];
  if (!def) return null;

  const hp = type === "boss" ? def.hp + (state.stage - 1) * 60 : def.hp + Math.floor((state.stage - 1) * 0.5);
  const enemy = {
    type,
    sprite: def.sprite,
    x,
    y,
    width: def.width,
    height: def.height,
    hp,
    maxHp: hp,
    vy: def.vy,
    vx: 0,
    score: def.score,
    pattern,
    baseX: x,
    age: 0,
    waveAmp: rand(22, 60),
    waveSpeed: rand(0.035, 0.075),
    shotTimer: rand(def.shot[0], def.shot[1]),
    attackMode: 0,
    spiralPhase: 0,
    lockY: 126,
    stopY: 160,
    stopUntil: 0,
    diveDelayMs: 0,
    phase: rand(0, Math.PI * 2),
    burstCount: 0,
    launchTimer: rand(2300, 3600),
    spreadTimer: rand(1800, 2900),
    dead: false,
    ...overrides
  };

  enemies.push(enemy);
  return enemy;
}

function spawnLine(type, count, y, spacing, pattern = "straight", overrides = {}) {
  const total = (count - 1) * spacing;
  const startX = PLAY_CENTER - total / 2;
  for (let i = 0; i < count; i += 1) {
    spawnEnemy(type, startX + i * spacing, y - rand(0, 120), pattern, { ...overrides });
  }
}

function spawnStaggeredScouts(y) {
  spawnEnemy("scout", playT(0.12), y, "straight", { vy: 3.6 });
  spawnEnemy("scout", playT(0.26), y - 46, "straight", { vy: 3.1 });
  spawnEnemy("scout", playT(0.41), y, "straight", { vy: 3.7 });
  spawnEnemy("scout", playT(0.56), y - 46, "straight", { vy: 3.2 });
  spawnEnemy("scout", playT(0.72), y, "straight", { vy: 3.8 });
}

function spawnV(type, count, y, pattern = "sine") {
  const mid = Math.floor(count / 2);
  for (let i = 0; i < count; i += 1) {
    const offset = i - mid;
    spawnEnemy(type, PLAY_CENTER + offset * 70, y - Math.abs(offset) * 54, pattern, {
      waveAmp: 18 + Math.abs(offset) * 8,
      phase: Math.abs(offset) * 0.5
    });
  }
}

function spawnDive(type, side = "left", count = 4) {
  const fromLeft = side === "left";
  for (let i = 0; i < count; i += 1) {
    const x = fromLeft ? -74 - i * 46 : WIDTH + 74 + i * 46;
    const vx = fromLeft ? rand(2.0, 2.9) : -rand(2.0, 2.9);
    spawnEnemy(type, x, 100 + i * 62, "dive", {
      vx,
      vy: rand(2.4, 3.0),
      diveDelayMs: rand(220, 940)
    });
  }
}

function spawnFormation(count, y) {
  const spacing = 74;
  const total = (count - 1) * spacing;
  const startX = PLAY_CENTER - total / 2;
  for (let i = 0; i < count; i += 1) {
    spawnEnemy("formation", startX + i * spacing, y - Math.abs(i - Math.floor(count / 2)) * 25, "formation", {
      waveAmp: 26,
      waveSpeed: 0.065,
      phase: i * 1.24
    });
  }
}

function spawnGunshipPair(y) {
  spawnEnemy("gunship", playT(0.2), y, "gunship", { stopY: 180, stopUntil: 2200 });
  spawnEnemy("gunship", playT(0.68), y - 25, "gunship", { stopY: 210, stopUntil: 2200 });
}

function spawnHeavyRun(y) {
  spawnEnemy("heavyBomber", playT(0.18), y, "heavy", { stopY: 140, stopUntil: 2500, waveAmp: 20 });
  spawnEnemy("heavyBomber", playT(0.62), y - 50, "heavy", { stopY: 165, stopUntil: 2500, waveAmp: 18 });
}

function spawnCarrierWave(y) {
  spawnEnemy("carrier", PLAY_CENTER - 85, y, "carrier", {
    stopY: 110,
    stopUntil: 3400,
    vx: 1.2
  });
}

function spawnBoss() {
  spawnEnemy("boss", PLAY_CENTER - 136, -260, "boss", {
    lockY: 124,
    waveAmp: 190,
    waveSpeed: 0.028,
    shotTimer: 380
  });

  state.bossActive = true;
  showBanner("WARNING - BOSS APPROACH", 2200);
  tone(130, 0.28, "sawtooth", 0.03);
}

function buildStageScript(stage) {
  const squeeze = clamp(1 - (stage - 1) * 0.06, 0.72, 1);

  return [
    { at: 900 * squeeze, kind: "wave", run: () => spawnLine("scout", 5, -70, 132) },
    { at: 2800 * squeeze, kind: "wave", run: () => spawnStaggeredScouts(-90) },
    { at: 5200 * squeeze, kind: "wave", run: () => spawnV("fighter", 5, -120, "sine") },
    {
      at: 7600 * squeeze,
      kind: "wave",
      run: () => {
        spawnDive("dive", "left", 4);
        spawnDive("dive", "right", 4);
      }
    },
    { at: 10100 * squeeze, kind: "wave", run: () => spawnFormation(5, -80) },
    { at: 12800 * squeeze, kind: "wave", run: () => spawnLine("bomber", 3, -120, 210, "bomber") },
    { at: 15800 * squeeze, kind: "wave", run: () => spawnGunshipPair(-120) },
    {
      at: 18900 * squeeze,
      kind: "wave",
      run: () => {
        spawnV("fighter", 7, -140, "sine");
        spawnDive("dive", "left", 2);
      }
    },
    { at: 22000 * squeeze, kind: "wave", run: () => spawnHeavyRun(-170) },
    { at: 25200 * squeeze, kind: "wave", run: () => spawnCarrierWave(-190) },
    {
      at: 28800 * squeeze,
      kind: "wave",
      run: () => {
        spawnFormation(6, -120);
        spawnDive("dive", "right", 3);
      }
    },
    { at: 32600 * squeeze, kind: "wave", run: () => spawnLine("gunship", 3, -130, 240, "gunship") },
    {
      at: 36400 * squeeze,
      kind: "wave",
      run: () => {
        spawnLine("bomber", 4, -140, 190, "bomber");
        spawnDive("dive", "left", 3);
        spawnDive("dive", "right", 3);
      }
    },
    {
      at: 40800 * squeeze,
      kind: "wave",
      run: () => {
        spawnHeavyRun(-180);
        spawnCarrierWave(-220);
      }
    },
    {
      at: 46200 * squeeze,
      kind: "wave",
      run: () => {
        spawnLine("fighter", 6, -90, 134, "sine", { waveAmp: 34 });
        spawnFormation(5, -180);
      }
    },
    { at: 53000 * squeeze, kind: "boss", run: () => spawnBoss() }
  ];
}

function startStage(stageNumber, keepStats = true) {
  state.mode = "running";
  state.stage = stageNumber;
  state.script = buildStageScript(stageNumber);
  state.combatEventsTotal = state.script.filter((s) => s.kind === "wave" || s.kind === "boss").length;
  state.scriptIndex = 0;
  state.waveLabel = `0/${state.combatEventsTotal}`;
  state.elapsedMs = 0;
  state.scrollY = 0;
  state.bossActive = false;
  state.invulnerableUntil = performance.now() + 1350;
  state.bannerUntil = 0;
  state.bombActiveUntil = 0;
  state.bombFlashUntil = 0;
  state.bombPulseAt = 0;

  if (!keepStats) {
    state.score = 0;
    state.lives = 3;
    state.bombs = 3;
    state.power = 1;
    state.speedLevel = 1;
    state.medalValue = 100;
    optionDrones = [];
  }

  playerBullets = [];
  enemyBullets = [];
  enemies = [];
  powerUps = [];
  particles = [];

  resetPlayerPosition();
  syncHud();
  hideOverlay();
  showBanner(`STAGE ${state.stage} START`, 1650);
  tone(470, 0.08, "triangle", 0.03);
}

function startRun() {
  startStage(1, false);
}

function seedDemoScene() {
  state.waveLabel = `6/${state.combatEventsTotal}`;
  state.invulnerableUntil = performance.now() + 1000;
  state.bannerUntil = 0;

  spawnEnemy("fighter", playT(0.34), 210, "sine", { vy: 0.8, waveAmp: 28, waveSpeed: 0.05 });
  spawnEnemy("fighter", playT(0.66), 230, "sine", { vy: 0.9, waveAmp: 26, waveSpeed: 0.052, phase: 1.4 });
  spawnEnemy("scout", playT(0.5), 165, "straight", { vy: 1.3 });

  enemyBullets.push({ x: playT(0.44), y: 330, width: 12, height: 22, vx: -0.3, vy: 4.6 });
  enemyBullets.push({ x: playT(0.58), y: 348, width: 12, height: 22, vx: 0.25, vy: 4.9 });

  playerBullets.push({ x: PLAY_CENTER - 6, y: HEIGHT - 270, width: 12, height: 24, vx: 0, vy: -12, damage: 1 });
  playerBullets.push({ x: PLAY_CENTER - 22, y: HEIGHT - 236, width: 12, height: 24, vx: -0.7, vy: -12, damage: 1 });
  playerBullets.push({ x: PLAY_CENTER + 10, y: HEIGHT - 236, width: 12, height: 24, vx: 0.7, vy: -12, damage: 1 });

  powerUps.push({ type: "P", x: playT(0.38), y: 420, width: 40, height: 40, vy: 0.5 });
  powerUps.push({ type: "M", x: playT(0.58), y: 392, width: 42, height: 42, vy: 0.45 });
}

function stageClear() {
  state.mode = "stageClear";
  setBestScore();
  syncHud();

  showOverlay(
    `Stage ${state.stage} Cleared`,
    "Air corridor secured. Re-arm and push to the next front.",
    `Start Stage ${state.stage + 1}`,
    () => startStage(state.stage + 1, true)
  );

  tone(880, 0.08, "triangle", 0.03);
  setTimeout(() => tone(1060, 0.09, "triangle", 0.03), 120);
}

function gameOver() {
  state.mode = "gameOver";
  setBestScore();
  syncHud();

  showOverlay(
    "Mission Failed",
    `Score ${state.score}. Hi-Score ${state.best}.`,
    "Retry From Stage 1",
    () => startRun()
  );

  tone(170, 0.26, "sawtooth", 0.03);
}

function togglePause() {
  if (state.mode === "running") {
    state.mode = "paused";
    showOverlay("Paused", "Tap resume when ready.", "Resume", () => {
      state.mode = "running";
      hideOverlay();
    });
    return;
  }

  if (state.mode === "paused" && state.runningAction) {
    state.runningAction();
  }
}

function spawnEnemyBullet(x, y, vx, vy, size = 1) {
  const w = size >= 1.2 ? 16 : 12;
  const h = size >= 1.2 ? 26 : 22;
  enemyBullets.push({
    x: x - w / 2,
    y: y - h / 2,
    width: w,
    height: h,
    vx,
    vy
  });
}

function emitAimedSpread(enemyX, enemyY, targetX, targetY, count, speed, spread) {
  const dx = targetX - enemyX;
  const dy = targetY - enemyY;
  const base = Math.atan2(dy, dx);
  const start = base - spread / 2;
  const step = count <= 1 ? 0 : spread / (count - 1);

  for (let i = 0; i < count; i += 1) {
    const angle = start + step * i;
    spawnEnemyBullet(enemyX, enemyY, Math.cos(angle) * speed, Math.sin(angle) * speed);
  }
}

function emitRadial(enemyX, enemyY, count, speed, offset = 0, size = 1.2) {
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + offset;
    spawnEnemyBullet(enemyX, enemyY, Math.cos(angle) * speed, Math.sin(angle) * speed, size);
  }
}

function fireEnemy(enemy) {
  const ex = enemy.x + enemy.width / 2;
  const ey = enemy.y + enemy.height * 0.65;
  const px = player.x + player.width / 2;
  const py = player.y + player.height / 2;

  if (enemy.type === "boss") {
    if (enemy.attackMode === 0) {
      emitAimedSpread(ex, ey, px, py, 9, 4.7, 1.65);
    } else if (enemy.attackMode === 1) {
      emitAimedSpread(ex, ey, px, py, 3, 5.8, 0.33);
      emitAimedSpread(ex - 80, ey - 18, px, py, 5, 4.2, 0.75);
      emitAimedSpread(ex + 80, ey - 18, px, py, 5, 4.2, 0.75);
    } else {
      enemy.spiralPhase += 0.33;
      emitRadial(ex, ey, 10, 4.1, enemy.spiralPhase, 1.25);
      emitRadial(ex, ey, 10, 4.1, enemy.spiralPhase + Math.PI / 10, 1.25);
    }

    enemy.attackMode = (enemy.attackMode + 1) % 3;
    return;
  }

  if (enemy.type === "scout") {
    emitAimedSpread(ex, ey, px, py, 1, 5.4, 0);
    return;
  }

  if (enemy.type === "fighter" || enemy.type === "formation") {
    emitAimedSpread(ex, ey, px, py, 3, 5.3, 0.32);
    return;
  }

  if (enemy.type === "dive") {
    emitAimedSpread(ex, ey, px, py, 2, 6.1, 0.2);
    return;
  }

  if (enemy.type === "bomber") {
    emitAimedSpread(ex, ey, px, py, 5, 5, 0.85);
    return;
  }

  if (enemy.type === "gunship") {
    enemy.burstCount += 1;
    emitAimedSpread(ex, ey, px, py, 4, 5.5, 0.65);
    if (enemy.burstCount % 3 === 0) {
      emitRadial(ex, ey, 8, 3.8, enemy.age * 0.02);
    }
    return;
  }

  if (enemy.type === "heavyBomber") {
    emitAimedSpread(ex, ey, px, py, 7, 4.9, 1.2);
    emitRadial(ex, ey, 6, 3.4, enemy.phase + enemy.age * 0.015);
    return;
  }

  if (enemy.type === "carrier") {
    emitAimedSpread(ex, ey, px, py, 6, 4.8, 1.18);
  }
}

function maybeDropPower(enemy) {
  const centerX = enemy.x + enemy.width / 2;
  const centerY = enemy.y + enemy.height / 2;

  if (enemy.type === "boss") {
    const guaranteed = ["P", "B", "S", "O", "1UP", "Score", "M"];
    guaranteed.forEach((type, idx) => {
      powerUps.push({
        type,
        x: centerX - 26 + (idx - 3) * 24,
        y: centerY - 12,
        width: type === "M" ? 42 : 40,
        height: type === "M" ? 42 : 40,
        vy: 1.9
      });
    });
    return;
  }

  let chance = 0.1;
  if (enemy.type === "fighter" || enemy.type === "dive" || enemy.type === "formation") chance = 0.24;
  if (enemy.type === "bomber" || enemy.type === "gunship") chance = 0.34;
  if (enemy.type === "heavyBomber" || enemy.type === "carrier") chance = 0.46;

  if (Math.random() > chance) return;

  const roll = Math.random();
  let type = "M";
  if (roll < 0.18) type = "P";
  else if (roll < 0.3) type = "B";
  else if (roll < 0.43) type = "S";
  else if (roll < 0.55) type = "O";
  else if (roll < 0.62) type = "Score";
  else type = "M";

  if (enemy.type === "heavyBomber" && roll > 0.85) type = "1UP";

  powerUps.push({
    type,
    x: centerX - 20,
    y: centerY - 20,
    width: type === "M" ? 42 : 40,
    height: type === "M" ? 42 : 40,
    vy: 2.1
  });
}

function collectMedal() {
  state.score += state.medalValue;
  state.medalValue = clamp(state.medalValue + 100, 100, 1000);
  tone(700, 0.05, "triangle", 0.02);
}

function resetMedalChain() {
  state.medalValue = 100;
}

function applyPower(type) {
  if (type === "P") {
    state.power = clamp(state.power + 1, 1, 5);
    state.score += 150;
    tone(620, 0.08, "triangle", 0.026);
  } else if (type === "B") {
    state.bombs = clamp(state.bombs + 1, 0, 9);
    state.score += 100;
    tone(330, 0.08, "triangle", 0.026);
  } else if (type === "S") {
    state.speedLevel = clamp(state.speedLevel + 1, 1, 7);
    state.score += 100;
    tone(540, 0.08, "triangle", 0.026);
  } else if (type === "O") {
    addOptionDrone();
    state.score += 120;
    tone(470, 0.08, "triangle", 0.026);
  } else if (type === "1UP") {
    state.lives = clamp(state.lives + 1, 0, 9);
    state.score += 500;
    tone(860, 0.1, "triangle", 0.028);
  } else if (type === "Score") {
    state.score += 1000;
    tone(920, 0.09, "triangle", 0.02);
  } else {
    collectMedal();
  }

  setBestScore();
  syncHud();
}

function damagePlayer() {
  const now = performance.now();
  if (now < state.invulnerableUntil || now < state.bombActiveUntil) return;

  state.lives -= 1;
  state.power = Math.max(1, state.power - 1);
  removeOptionDrone();
  state.invulnerableUntil = now + 3000;
  enemyBullets = [];
  resetMedalChain();

  spawnBurst(player.x + player.width / 2, player.y + player.height / 2, 34, "#ffbe8d");
  tone(180, 0.12, "sawtooth", 0.03);

  if (state.lives <= 0) {
    gameOver();
    return;
  }

  resetPlayerPosition();
  syncHud();
}

function killEnemy(enemy) {
  if (enemy.dead) return;
  enemy.dead = true;
  state.score += enemy.score;
  maybeDropPower(enemy);
  spawnBurst(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.type === "boss" ? 56 : 18, "#ffe5b8");

  if (enemy.type === "boss") {
    state.bossActive = false;
    state.bombs = clamp(state.bombs + 1, 0, 9);
    showBanner(`STAGE ${state.stage} BOSS DOWN`, 1800);
    tone(980, 0.11, "triangle", 0.03);
  } else {
    tone(enemy.type === "bomber" || enemy.type === "heavyBomber" ? 470 : 410, 0.045, "square", 0.017);
  }
}

function applyBombTick(nowMs, instant = false) {
  if (nowMs >= state.bombActiveUntil) return;
  if (!instant && nowMs < state.bombPulseAt) return;

  state.bombPulseAt = nowMs + 260;

  enemies = enemies.filter((enemy) => {
    const damage = Math.max(1, Math.ceil(enemy.hp * 0.3));
    enemy.hp -= damage;

    if (enemy.hp <= 0) {
      killEnemy(enemy);
      return false;
    }

    spawnBurst(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.type === "boss" ? 18 : 8, "#ffe8b8");
    return true;
  });

  setBestScore();
  syncHud();
}

function useBomb() {
  if (state.mode !== "running" || state.bombs <= 0) return;
  const now = performance.now();
  if (now < state.bombActiveUntil) return;

  state.bombs -= 1;
  state.bombActiveUntil = now + 2000;
  state.bombFlashUntil = now + 2000;
  state.bombPulseAt = now;
  enemyBullets = [];

  applyBombTick(now, true);

  syncHud();
  tone(250, 0.15, "sawtooth", 0.03);
}

function updatePlayer(dt) {
  const speed = currentPlayerSpeed() * dt;

  if (input.keys.has("arrowleft") || input.keys.has("a")) {
    player.x -= speed;
    input.pointerActive = false;
  }
  if (input.keys.has("arrowright") || input.keys.has("d")) {
    player.x += speed;
    input.pointerActive = false;
  }
  if (input.keys.has("arrowup") || input.keys.has("w")) {
    player.y -= speed;
    input.pointerActive = false;
  }
  if (input.keys.has("arrowdown") || input.keys.has("s")) {
    player.y += speed;
    input.pointerActive = false;
  }

  if (input.pointerActive) {
    const targetX = input.pointerX - player.width / 2;
    const targetY = input.pointerY - player.height / 2;
    player.x += clamp(targetX - player.x, -speed * 1.6, speed * 1.6);
    player.y += clamp(targetY - player.y, -speed * 1.6, speed * 1.6);
  }

  player.x = clamp(player.x, PLAY_X + 14, PLAY_RIGHT - player.width - 14);
  player.y = clamp(player.y, 110, HEIGHT - player.height - 18);
}

function updateScript() {
  while (state.scriptIndex < state.script.length && state.elapsedMs >= state.script[state.scriptIndex].at) {
    const entry = state.script[state.scriptIndex];
    state.scriptIndex += 1;

    if (entry.kind === "wave" || entry.kind === "boss") {
      state.waveLabel = `${state.scriptIndex}/${state.combatEventsTotal}`;
    }

    entry.run();
    syncHud();
  }

  if (state.scriptIndex >= state.script.length && enemies.length === 0 && !state.bossActive) {
    stageClear();
  }
}

function updateEnemies(dt) {
  enemies = enemies.filter((enemy) => {
    enemy.age += dt * 60;

    if (enemy.pattern === "straight") {
      enemy.y += enemy.vy * dt * 60;
    } else if (enemy.pattern === "sine") {
      enemy.y += enemy.vy * dt * 60;
      enemy.x = enemy.baseX + Math.sin(enemy.age * enemy.waveSpeed + enemy.phase) * enemy.waveAmp;
    } else if (enemy.pattern === "dive") {
      if (enemy.diveDelayMs > 0) {
        enemy.diveDelayMs -= dt * 1000;
        enemy.y += enemy.vy * dt * 36;
      } else {
        enemy.x += enemy.vx * dt * 60;
        enemy.y += enemy.vy * dt * 60;
        if (enemy.y > HEIGHT * 0.42) {
          enemy.vx *= 1.018;
        }
      }
    } else if (enemy.pattern === "formation") {
      enemy.y += enemy.vy * dt * 60;
      enemy.x = enemy.baseX + Math.sin(enemy.age * enemy.waveSpeed + enemy.phase) * enemy.waveAmp;
    } else if (enemy.pattern === "bomber") {
      enemy.y += enemy.vy * dt * 60;
      enemy.x = enemy.baseX + Math.sin(enemy.age * 0.02 + enemy.phase) * 12;
    } else if (enemy.pattern === "gunship") {
      if (enemy.y < enemy.stopY) {
        enemy.y += enemy.vy * dt * 60;
      } else if (enemy.stopUntil > 0) {
        enemy.stopUntil -= dt * 1000;
        enemy.x = enemy.baseX + Math.sin(enemy.age * 0.04 + enemy.phase) * 40;
      } else {
        enemy.y += enemy.vy * dt * 60 * 0.65;
      }
    } else if (enemy.pattern === "heavy") {
      if (enemy.y < enemy.stopY) {
        enemy.y += enemy.vy * dt * 60;
      } else if (enemy.stopUntil > 0) {
        enemy.stopUntil -= dt * 1000;
        enemy.x = enemy.baseX + Math.sin(enemy.age * 0.03 + enemy.phase) * enemy.waveAmp;
      } else {
        enemy.y += enemy.vy * dt * 60 * 0.8;
      }
    } else if (enemy.pattern === "carrier") {
      if (enemy.y < enemy.stopY) {
        enemy.y += enemy.vy * dt * 60;
      } else {
        enemy.x += enemy.vx * dt * 60;
        if (enemy.x < PLAY_X + 36 || enemy.x + enemy.width > PLAY_RIGHT - 36) {
          enemy.vx *= -1;
        }

        enemy.launchTimer -= dt * 1000;
        enemy.spreadTimer -= dt * 1000;

        if (enemy.launchTimer <= 0) {
          enemy.launchTimer = rand(2600, 4200);
          const side = Math.random() < 0.5 ? -1 : 1;
          spawnEnemy("dive", enemy.x + enemy.width / 2 + side * 36, enemy.y + enemy.height * 0.66, "dive", {
            vx: side * rand(1.8, 2.5),
            vy: rand(2.4, 2.9),
            diveDelayMs: rand(120, 560)
          });
        }

        if (enemy.spreadTimer <= 0) {
          enemy.spreadTimer = rand(1800, 3000);
          fireEnemy(enemy);
        }
      }
    } else if (enemy.pattern === "boss") {
      if (enemy.y < enemy.lockY) {
        enemy.y += enemy.vy * dt * 60;
      } else {
        enemy.x = enemy.baseX + Math.sin(enemy.age * enemy.waveSpeed) * enemy.waveAmp;
      }
    }

    enemy.shotTimer -= dt * 1000;
    if (enemy.shotTimer <= 0) {
      fireEnemy(enemy);

      if (enemy.type === "boss") {
        enemy.shotTimer = rand(260, 410);
      } else if (enemy.type === "heavyBomber") {
        enemy.shotTimer = rand(520, 760);
      } else if (enemy.type === "gunship") {
        enemy.shotTimer = rand(460, 700);
      } else if (enemy.type === "bomber") {
        enemy.shotTimer = rand(680, 980);
      } else if (enemy.type === "fighter" || enemy.type === "dive" || enemy.type === "formation") {
        enemy.shotTimer = rand(850, 1320);
      } else {
        enemy.shotTimer = rand(1200, 1900);
      }
    }

    if (enemy.type !== "boss" && enemy.y > HEIGHT + 160) return false;

    if (rectHit(enemy, playerHitbox())) {
      damagePlayer();
      if (enemy.type !== "boss") return false;
    }

    return true;
  });
}

function updateBullets(dt) {
  playerBullets = playerBullets.filter((bullet) => {
    bullet.x += bullet.vx * dt * 60;
    bullet.y += bullet.vy * dt * 60;
    return bullet.y + bullet.height > -40 && bullet.y < HEIGHT + 40 && bullet.x > -40 && bullet.x < WIDTH + 40;
  });

  enemyBullets = enemyBullets.filter((bullet) => {
    bullet.x += bullet.vx * dt * 60;
    bullet.y += bullet.vy * dt * 60;
    return bullet.y < HEIGHT + 60 && bullet.x > -50 && bullet.x < WIDTH + 50;
  });
}

function updatePowerUps(dt) {
  const hitbox = playerHitbox();

  powerUps = powerUps.filter((power) => {
    power.y += power.vy * dt * 60;

    if (rectHit(power, hitbox)) {
      applyPower(power.type);
      spawnBurst(power.x + power.width / 2, power.y + power.height / 2, 14, "#d3f3ff");
      return false;
    }

    if (power.y >= HEIGHT + 44) {
      if (power.type === "M") {
        resetMedalChain();
      }
      return false;
    }

    return true;
  });
}

function resolveCombat() {
  const keptBullets = [];

  for (const bullet of playerBullets) {
    let hit = false;

    for (const enemy of enemies) {
      if (enemy.dead) continue;
      if (!rectHit(bullet, enemy)) continue;
      hit = true;
      enemy.hp -= bullet.damage;

      if (enemy.hp <= 0) {
        killEnemy(enemy);
      } else {
        tone(280, 0.024, "triangle", 0.008);
      }

      break;
    }

    if (!hit) keptBullets.push(bullet);
  }

  playerBullets = keptBullets;
  enemies = enemies.filter((enemy) => enemy.hp > 0);

  const hitbox = playerHitbox();
  enemyBullets = enemyBullets.filter((bullet) => {
    if (rectHit(bullet, hitbox)) {
      damagePlayer();
      return false;
    }
    return true;
  });

  setBestScore();
  syncHud();
}

function updateParticles(dt) {
  particles = particles.filter((p) => {
    p.age += dt;
    p.x += p.vx * dt * 60;
    p.y += p.vy * dt * 60;
    p.vy += 0.07 * dt * 60;
    return p.age < p.life;
  });
}

function update(dt, nowMs) {
  if (state.mode !== "running") {
    updateParticles(dt);
    return;
  }

  state.elapsedMs += dt * 1000;
  state.scrollY = (state.scrollY + dt * 218) % HEIGHT;

  updatePlayer(dt);
  updatePlayerTrail();
  updateOptionDrones(nowMs);
  firePlayer(nowMs);
  updateScript();
  updateEnemies(dt);
  updateBullets(dt);
  updatePowerUps(dt);
  resolveCombat();
  applyBombTick(nowMs);
  updateParticles(dt);
}

function drawBackground(nowMs) {
  ctx.fillStyle = "#121924";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.save();
  ctx.beginPath();
  ctx.rect(PLAY_X, 0, PLAY_W, HEIGHT);
  ctx.clip();
  ctx.drawImage(images.background, PLAY_X, state.scrollY - HEIGHT, PLAY_W, HEIGHT);
  ctx.drawImage(images.background, PLAY_X, state.scrollY, PLAY_W, HEIGHT);

  ctx.globalAlpha = 0.1;
  for (let y = 0; y < HEIGHT; y += 14) {
    ctx.fillStyle = y % 28 === 0 ? "#d2e5f8" : "#9ab9d4";
    ctx.fillRect(PLAY_X, y, PLAY_W, 1);
  }
  ctx.restore();
  ctx.globalAlpha = 1;

  const leftGrad = ctx.createLinearGradient(0, 0, PLAY_X, 0);
  leftGrad.addColorStop(0, "#070b14");
  leftGrad.addColorStop(1, "#161e2c");
  ctx.fillStyle = leftGrad;
  ctx.fillRect(0, 0, PLAY_X, HEIGHT);

  const rightGrad = ctx.createLinearGradient(PLAY_RIGHT, 0, WIDTH, 0);
  rightGrad.addColorStop(0, "#161e2c");
  rightGrad.addColorStop(1, "#070b14");
  ctx.fillStyle = rightGrad;
  ctx.fillRect(PLAY_RIGHT, 0, WIDTH - PLAY_RIGHT, HEIGHT);

  ctx.strokeStyle = "rgba(205, 228, 247, 0.48)";
  ctx.lineWidth = 2;
  ctx.strokeRect(PLAY_X + 1, 1, PLAY_W - 2, HEIGHT - 2);

  if (nowMs < state.bombFlashUntil) {
    const t = clamp((state.bombFlashUntil - nowMs) / 2000, 0, 1);
    const alpha = 0.18 + t * 0.28;
    ctx.fillStyle = `rgba(255, 244, 188, ${alpha})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const progress = 1 - t;
    const radius = progress * Math.hypot(WIDTH, HEIGHT);
    const cx = player.x + player.width / 2;
    const cy = player.y + player.height / 2;

    ctx.strokeStyle = "rgba(140, 210, 255, 0.6)";
    ctx.lineWidth = 7 * (1 - progress) + 3;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawEnemies() {
  for (const enemy of enemies) {
    ctx.save();
    ctx.shadowColor = enemy.type === "boss" ? "rgba(255, 195, 132, 0.82)" : "rgba(255, 120, 120, 0.58)";
    ctx.shadowBlur = enemy.type === "boss" ? 26 : 10;
    ctx.drawImage(images[enemy.sprite], enemy.x, enemy.y, enemy.width, enemy.height);
    ctx.restore();

    if (enemy.type === "boss") {
      const barW = PLAY_W - 28;
      const barH = 12;
      const x = PLAY_CENTER - barW / 2;
      const y = 20;
      ctx.fillStyle = "rgba(8, 17, 26, 0.82)";
      ctx.fillRect(x, y, barW, barH);
      ctx.fillStyle = "#ffc27f";
      ctx.fillRect(x, y, barW * (enemy.hp / enemy.maxHp), barH);
      ctx.strokeStyle = "rgba(255, 241, 214, 0.9)";
      ctx.strokeRect(x, y, barW, barH);
    }
  }
}

function drawBullets() {
  for (const bullet of playerBullets) {
    ctx.drawImage(images.bulletPlayer, bullet.x, bullet.y, bullet.width, bullet.height);
  }

  for (const bullet of enemyBullets) {
    ctx.drawImage(images.bulletEnemy, bullet.x, bullet.y, bullet.width, bullet.height);
  }
}

function spriteForPower(type) {
  if (type === "P") return images.powerP;
  if (type === "B") return images.powerB;
  if (type === "S") return images.powerS;
  if (type === "O") return images.powerO;
  if (type === "1UP") return images.power1UP;
  if (type === "Score") return images.powerScore;
  return images.medal;
}

function drawPowerUps() {
  for (const power of powerUps) {
    const sprite = spriteForPower(power.type);
    ctx.drawImage(sprite, power.x, power.y, power.width, power.height);

    if (power.type !== "M") {
      ctx.fillStyle = "#14334c";
      ctx.font = "bold 16px Trebuchet MS, sans-serif";
      ctx.textAlign = "center";
      const label = power.type === "Score" ? "1K" : power.type;
      ctx.fillText(label, power.x + power.width / 2, power.y + power.height / 2 + 6);
      ctx.textAlign = "start";
    }
  }
}

function drawPlayer(nowMs) {
  const invul = nowMs < state.invulnerableUntil || nowMs < state.bombActiveUntil;
  if (invul && Math.floor(nowMs / 90) % 2 === 0) {
    ctx.globalAlpha = 0.45;
  }

  ctx.save();
  ctx.shadowColor = "rgba(139, 218, 255, 0.7)";
  ctx.shadowBlur = 16;
  ctx.drawImage(images.player, player.x, player.y, player.width, player.height);
  ctx.restore();
  ctx.globalAlpha = 1;

  for (const opt of optionDrones) {
    const ox = opt.x - opt.width / 2;
    const oy = opt.y - opt.height / 2;
    ctx.save();
    ctx.shadowColor = "rgba(170, 225, 255, 0.8)";
    ctx.shadowBlur = 14;
    ctx.drawImage(images.option, ox, oy, opt.width, opt.height);
    ctx.restore();
  }

  const hitbox = playerHitbox();
  ctx.fillStyle = "rgba(255, 255, 140, 0.75)";
  ctx.beginPath();
  ctx.arc(hitbox.x + 3, hitbox.y + 3, 2.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawParticles() {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const p of particles) {
    const lifeLeft = 1 - p.age / p.life;
    const alpha = Math.round(clamp(lifeLeft, 0, 1) * 255)
      .toString(16)
      .padStart(2, "0");
    ctx.fillStyle = `${p.color}${alpha}`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * lifeLeft, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawStageHints(nowMs) {
  ctx.fillStyle = "rgba(220, 234, 248, 0.2)";
  ctx.fillRect(10, 10, PLAY_X - 20, 108);
  ctx.fillRect(10, 126, PLAY_X - 20, 74);
  ctx.fillRect(10, 208, PLAY_X - 20, 140);
  ctx.fillRect(PLAY_RIGHT + 10, 10, WIDTH - PLAY_RIGHT - 20, 72);
  ctx.fillRect(PLAY_RIGHT + 10, 90, WIDTH - PLAY_RIGHT - 20, 110);

  ctx.strokeStyle = "rgba(246, 250, 255, 0.42)";
  ctx.strokeRect(10, 10, PLAY_X - 20, 108);
  ctx.strokeRect(10, 126, PLAY_X - 20, 74);
  ctx.strokeRect(10, 208, PLAY_X - 20, 140);
  ctx.strokeRect(PLAY_RIGHT + 10, 10, WIDTH - PLAY_RIGHT - 20, 72);
  ctx.strokeRect(PLAY_RIGHT + 10, 90, WIDTH - PLAY_RIGHT - 20, 110);

  ctx.fillStyle = "#ecf7ff";
  ctx.font = "bold 15px Courier New, monospace";
  ctx.fillText("SCORE", 22, 36);
  ctx.fillText(String(state.score).padStart(7, "0"), 22, 58);
  ctx.fillText("1P", 22, 88);
  ctx.fillText(`L ${state.lives}  B ${state.bombs}`, 22, 108);

  ctx.fillStyle = "#bde9ff";
  ctx.fillText("POWER", 22, 152);
  ctx.fillText(`P${state.power}  S${state.speedLevel}`, 22, 174);
  ctx.fillText(`OPT ${optionDrones.length}`, 22, 194);

  ctx.fillStyle = "#ffdca6";
  ctx.fillText("MEDAL", 22, 236);
  ctx.fillText(String(state.medalValue), 22, 258);
  ctx.fillText(`WAVE ${state.waveLabel}`, 22, 282);
  ctx.fillText(`STAGE ${state.stage}`, 22, 306);

  if (nowMs < state.invulnerableUntil || nowMs < state.bombActiveUntil) {
    ctx.fillStyle = "#ffefc8";
    ctx.fillText("INVINCIBLE", 22, 336);
  }

  ctx.fillStyle = "#d6e8f8";
  ctx.fillText("HI", PLAY_RIGHT + 22, 36);
  ctx.fillText(String(state.best).padStart(7, "0"), PLAY_RIGHT + 22, 58);
  ctx.fillText("SKY FORCE", PLAY_RIGHT + 22, 126);
  ctx.fillText("1946", PLAY_RIGHT + 22, 148);
  ctx.fillText("P:PAUSE", PLAY_RIGHT + 22, 172);
  ctx.fillText("SP:BOMB", PLAY_RIGHT + 22, 194);

  if (performance.now() < state.bannerUntil) {
    ctx.fillStyle = "rgba(8, 13, 20, 0.56)";
    ctx.fillRect(PLAY_CENTER - 220, HEIGHT / 2 - 34, 440, 68);
    ctx.strokeStyle = "rgba(255, 230, 180, 0.8)";
    ctx.strokeRect(PLAY_CENTER - 220, HEIGHT / 2 - 34, 440, 68);
    ctx.fillStyle = "#fff0cc";
    ctx.font = "bold 24px Courier New, monospace";
    ctx.textAlign = "center";
    ctx.fillText(state.bannerText, PLAY_CENTER, HEIGHT / 2 + 9);
    ctx.textAlign = "start";
  }
}

function render(nowMs) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawBackground(nowMs);
  drawPowerUps();
  drawEnemies();
  drawBullets();
  drawPlayer(nowMs);
  drawParticles();
  drawStageHints(nowMs);
}

function frame(nowMs) {
  const dt = Math.min((nowMs - state.lastFrame) / 1000, 0.033);
  state.lastFrame = nowMs;
  update(dt, nowMs);
  render(nowMs);
  requestAnimationFrame(frame);
}

function updatePointer(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  input.pointerX = ((clientX - rect.left) / rect.width) * WIDTH;
  input.pointerY = ((clientY - rect.top) / rect.height) * HEIGHT;
  input.pointerActive = true;
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowleft", "arrowright", "arrowup", "arrowdown", "a", "d", "w", "s"].includes(key)) {
    input.keys.add(key);
    event.preventDefault();
  }

  if (key === " ") {
    useBomb();
    event.preventDefault();
  }

  if (key === "p") {
    togglePause();
  }
});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowleft", "arrowright", "arrowup", "arrowdown", "a", "d", "w", "s"].includes(key)) {
    input.keys.delete(key);
    event.preventDefault();
  }
});

canvas.addEventListener("mousemove", (event) => {
  updatePointer(event.clientX, event.clientY);
});

canvas.addEventListener(
  "touchmove",
  (event) => {
    const touch = event.touches[0];
    if (!touch) return;
    updatePointer(touch.clientX, touch.clientY);
    event.preventDefault();
  },
  { passive: false }
);

canvas.addEventListener("pointerdown", (event) => {
  ensureAudio();
  updatePointer(event.clientX, event.clientY);
});

startButton.addEventListener("click", () => {
  ensureAudio();
  if (state.runningAction) {
    state.runningAction();
  } else {
    startRun();
  }
});

pauseButton.addEventListener("click", () => {
  ensureAudio();
  togglePause();
});

function boot() {
  const params = new URLSearchParams(window.location.search);
  const autoStart = params.get("autostart") === "1" || params.get("demo") === "1";
  const demoSnapshot = params.get("demo") === "1";

  if (autoStart) {
    state.lastFrame = performance.now();
    startRun();
    if (demoSnapshot) {
      seedDemoScene();
    }
    requestAnimationFrame(frame);
    return;
  }

  syncHud();
  showOverlay(
    "Sky Force 1946",
    "PRESS START TO DEPLOY",
    "START",
    () => startRun()
  );
  state.mode = "menu";
  state.lastFrame = performance.now();
  requestAnimationFrame(frame);
}

loadAll(images)
  .then(() => {
    boot();
  })
  .catch(() => {
    showOverlay("Asset Error", "One or more game assets failed to load.", "Retry", () => {
      window.location.reload();
    });
  });

