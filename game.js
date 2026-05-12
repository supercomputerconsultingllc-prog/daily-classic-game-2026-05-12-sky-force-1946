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

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const images = {
  background: new Image(),
  player: new Image(),
  enemyScout: new Image(),
  enemyFighter: new Image(),
  enemyBoss: new Image(),
  bulletPlayer: new Image(),
  bulletEnemy: new Image(),
  powerP: new Image(),
  powerB: new Image()
};

images.background.src = "assets/bg-cloud-warzone.svg";
images.player.src = "assets/player-plane.svg";
images.enemyScout.src = "assets/enemy-scout.svg";
images.enemyFighter.src = "assets/enemy-fighter.svg";
images.enemyBoss.src = "assets/enemy-boss.svg";
images.bulletPlayer.src = "assets/bullet-player.svg";
images.bulletEnemy.src = "assets/bullet-enemy.svg";
images.powerP.src = "assets/power-spread.svg";
images.powerB.src = "assets/power-bomb.svg";

const input = {
  keys: new Set(),
  pointerActive: false,
  pointerX: WIDTH / 2,
  pointerY: HEIGHT - 180
};

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
  stage: 1,
  waveLabel: "0/0",
  runningAction: null,
  lastFrame: performance.now(),
  scrollY: 0,
  elapsedMs: 0,
  script: [],
  scriptIndex: 0,
  bossActive: false,
  invulnerableUntil: 0,
  bombFlashUntil: 0
};

const player = {
  x: WIDTH / 2 - 44,
  y: HEIGHT - 165,
  width: 88,
  height: 108,
  speed: 7.2,
  fireBaseDelay: 126,
  lastShotAt: 0
};

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
}

function spawnBurst(x, y, count, color) {
  for (let i = 0; i < count; i += 1) {
    particles.push({
      x,
      y,
      vx: rand(-4.5, 4.5),
      vy: rand(-4.4, 3.8),
      size: rand(2, 5),
      color,
      life: rand(0.24, 0.86),
      age: 0
    });
  }
}

function makeEnemy(type, x, y, pattern = "straight", overrides = {}) {
  const defs = {
    scout: {
      sprite: "enemyScout",
      width: 62,
      height: 80,
      hp: 2,
      vy: rand(3.2, 4.0),
      score: 130,
      shot: [1100, 1650]
    },
    fighter: {
      sprite: "enemyFighter",
      width: 76,
      height: 98,
      hp: 5,
      vy: rand(2.8, 3.5),
      score: 320,
      shot: [850, 1300]
    },
    bomber: {
      sprite: "enemyFighter",
      width: 98,
      height: 120,
      hp: 11,
      vy: rand(2.1, 2.6),
      score: 680,
      shot: [730, 1080]
    },
    boss: {
      sprite: "enemyBoss",
      width: 252,
      height: 220,
      hp: 330 + state.stage * 110,
      vy: 1.1,
      score: 4600,
      shot: [280, 460]
    }
  };

  const def = defs[type];

  return {
    type,
    sprite: def.sprite,
    x,
    y,
    width: def.width,
    height: def.height,
    hp: def.hp,
    maxHp: def.hp,
    vy: def.vy,
    vx: 0,
    score: def.score,
    pattern,
    baseX: x,
    age: 0,
    waveAmp: type === "boss" ? 170 : rand(16, 52),
    waveSpeed: type === "boss" ? 0.03 : rand(0.038, 0.072),
    shotTimer: rand(def.shot[0], def.shot[1]),
    attackMode: 0,
    spiralPhase: 0,
    lockY: 126,
    ...overrides
  };
}

function spawnLine(type, count, y, spacing, pattern = "straight") {
  const total = (count - 1) * spacing;
  const startX = WIDTH / 2 - total / 2;
  for (let i = 0; i < count; i += 1) {
    enemies.push(makeEnemy(type, startX + i * spacing, y - rand(0, 120), pattern));
  }
}

function spawnV(type, count, y) {
  const mid = Math.floor(count / 2);
  for (let i = 0; i < count; i += 1) {
    const offset = i - mid;
    enemies.push(
      makeEnemy(type, WIDTH / 2 + offset * 68, y - Math.abs(offset) * 56, "sine", {
        waveAmp: 18 + Math.abs(offset) * 9
      })
    );
  }
}

function spawnDive(type, side = "left") {
  const fromLeft = side === "left";
  for (let i = 0; i < 4; i += 1) {
    const x = fromLeft ? -70 - i * 42 : WIDTH + 70 + i * 42;
    const vx = fromLeft ? rand(1.8, 2.6) : -rand(1.8, 2.6);
    enemies.push(
      makeEnemy(type, x, 110 + i * 72, "dive", {
        vx,
        vy: rand(2.6, 3.2)
      })
    );
  }
}

function spawnBoss() {
  enemies.push(makeEnemy("boss", WIDTH / 2 - 126, -250, "boss"));
  state.bossActive = true;
  tone(132, 0.26, "sawtooth", 0.03);
}

function buildStageScript(stage) {
  const gap = clamp(980 - stage * 80, 640, 980);

  return [
    { at: 500, kind: "wave", run: () => spawnLine("scout", 7, -80, 96) },
    { at: 500 + gap, kind: "wave", run: () => spawnV("scout", 7, -120) },
    { at: 500 + gap * 2, kind: "wave", run: () => spawnDive("fighter", "left") },
    { at: 500 + gap * 3, kind: "wave", run: () => spawnDive("fighter", "right") },
    { at: 500 + gap * 4, kind: "wave", run: () => spawnLine("fighter", 6, -90, 118, "sine") },
    { at: 500 + gap * 5, kind: "wave", run: () => spawnLine("bomber", 3, -120, 220, "straight") },
    { at: 500 + gap * 6, kind: "wave", run: () => spawnV("fighter", 9, -160) },
    {
      at: 500 + gap * 7,
      kind: "wave",
      run: () => {
        spawnDive("bomber", "left");
        spawnDive("bomber", "right");
      }
    },
    { at: 500 + gap * 8 + 600, kind: "boss", run: () => spawnBoss() }
  ];
}

function resetPlayerPosition() {
  player.x = WIDTH / 2 - player.width / 2;
  player.y = HEIGHT - 165;
  input.pointerX = player.x + player.width / 2;
  input.pointerY = player.y + player.height / 2;
}

function startStage(stageNumber, keepStats = true) {
  state.mode = "running";
  state.stage = stageNumber;
  state.waveLabel = "0/0";
  state.script = buildStageScript(stageNumber);
  state.scriptIndex = 0;
  state.elapsedMs = 0;
  state.scrollY = 0;
  state.bossActive = false;
  state.invulnerableUntil = performance.now() + 1300;

  if (!keepStats) {
    state.score = 0;
    state.lives = 3;
    state.bombs = 3;
    state.power = 1;
  }

  playerBullets = [];
  enemyBullets = [];
  enemies = [];
  powerUps = [];
  particles = [];
  resetPlayerPosition();
  syncHud();
  hideOverlay();
  tone(470, 0.08, "triangle", 0.03);
}

function startRun() {
  startStage(1, false);
}

function stageClear() {
  state.mode = "stageClear";
  setBestScore();
  syncHud();
  showOverlay(
    `Stage ${state.stage} Cleared`,
    "Enemy formation broken. Advance to next sortie.",
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

function spawnPlayerBullet(x, y, vx = 0, vy = -14, damage = 1) {
  playerBullets.push({
    x: x - 6,
    y,
    width: 12,
    height: 26,
    vx,
    vy,
    damage
  });
}

function firePlayer(nowMs) {
  const delay = clamp(player.fireBaseDelay - (state.power - 1) * 12, 62, 126);
  if (nowMs - player.lastShotAt < delay) return;
  player.lastShotAt = nowMs;

  const cx = player.x + player.width / 2;
  const top = player.y - 12;

  if (state.power === 1) {
    spawnPlayerBullet(cx, top, 0, -14, 1);
  } else if (state.power === 2) {
    spawnPlayerBullet(cx - 12, top, -0.25, -14, 1);
    spawnPlayerBullet(cx + 12, top, 0.25, -14, 1);
  } else if (state.power === 3) {
    spawnPlayerBullet(cx - 18, top, -0.85, -14, 1);
    spawnPlayerBullet(cx, top, 0, -14.5, 1.08);
    spawnPlayerBullet(cx + 18, top, 0.85, -14, 1);
  } else if (state.power === 4) {
    spawnPlayerBullet(cx - 28, top, -1.3, -14, 1);
    spawnPlayerBullet(cx - 10, top, -0.45, -14.4, 1.08);
    spawnPlayerBullet(cx + 10, top, 0.45, -14.4, 1.08);
    spawnPlayerBullet(cx + 28, top, 1.3, -14, 1);
  } else {
    spawnPlayerBullet(cx - 34, top, -1.65, -14, 1);
    spawnPlayerBullet(cx - 18, top, -1.05, -14.2, 1.05);
    spawnPlayerBullet(cx, top, 0, -14.8, 1.15);
    spawnPlayerBullet(cx + 18, top, 1.05, -14.2, 1.05);
    spawnPlayerBullet(cx + 34, top, 1.65, -14, 1);

    // wingmen-style extra streams for near-replica 1945 feel
    spawnPlayerBullet(player.x + 8, player.y + 8, -0.4, -13.2, 0.82);
    spawnPlayerBullet(player.x + player.width - 8, player.y + 8, 0.4, -13.2, 0.82);
  }

  tone(760, 0.03, "square", 0.012);
}

function fireEnemy(enemy) {
  if (enemy.type === "boss") {
    if (enemy.attackMode === 0) {
      const fan = [-2.6, -1.9, -1.2, -0.6, 0, 0.6, 1.2, 1.9, 2.6];
      fan.forEach((vx) => {
        enemyBullets.push({
          x: enemy.x + enemy.width / 2 - 7,
          y: enemy.y + enemy.height - 18,
          width: 14,
          height: 24,
          vx,
          vy: 5
        });
      });
    } else if (enemy.attackMode === 1) {
      const px = player.x + player.width / 2;
      const py = player.y + player.height / 2;
      const ex = enemy.x + enemy.width / 2;
      const ey = enemy.y + enemy.height - 10;
      const dx = px - ex;
      const dy = py - ey;
      const length = Math.max(1, Math.hypot(dx, dy));
      const ux = dx / length;
      const uy = dy / length;
      [-0.18, 0, 0.18].forEach((angleOffset) => {
        enemyBullets.push({
          x: ex - 7,
          y: ey,
          width: 14,
          height: 24,
          vx: ux * 4.2 + angleOffset,
          vy: uy * 4.2 + 4.6,
          aimed: true
        });
      });
    } else {
      enemy.spiralPhase += 0.4;
      const s = enemy.spiralPhase;
      enemyBullets.push({
        x: enemy.x + enemy.width / 2 - 7,
        y: enemy.y + enemy.height - 18,
        width: 14,
        height: 24,
        vx: Math.sin(s) * 2.2,
        vy: 4.9
      });
      enemyBullets.push({
        x: enemy.x + enemy.width / 2 - 7,
        y: enemy.y + enemy.height - 18,
        width: 14,
        height: 24,
        vx: -Math.sin(s) * 2.2,
        vy: 4.9
      });
    }

    enemy.attackMode = (enemy.attackMode + 1) % 3;
    return;
  }

  const px = player.x + player.width / 2;
  const ex = enemy.x + enemy.width / 2;
  const aim = clamp((px - ex) / 280, -1.1, 1.1);

  enemyBullets.push({
    x: ex - 6,
    y: enemy.y + enemy.height - 6,
    width: 12,
    height: 22,
    vx: aim,
    vy: enemy.type === "bomber" ? 7.2 : 6.2
  });
}

function maybeDropPower(enemy) {
  let chance = 0;
  if (enemy.type === "fighter") chance = 0.22;
  if (enemy.type === "bomber") chance = 0.34;
  if (enemy.type === "boss") chance = 1;
  if (Math.random() > chance) return;

  if (enemy.type === "boss") {
    powerUps.push({ type: "P", x: enemy.x + enemy.width * 0.35, y: enemy.y + enemy.height * 0.5, width: 40, height: 40, vy: 2.1 });
    powerUps.push({ type: "B", x: enemy.x + enemy.width * 0.58, y: enemy.y + enemy.height * 0.5, width: 40, height: 40, vy: 2.1 });
    return;
  }

  const type = Math.random() < 0.72 ? "P" : "B";
  powerUps.push({
    type,
    x: enemy.x + enemy.width / 2 - 20,
    y: enemy.y + enemy.height / 2 - 20,
    width: 40,
    height: 40,
    vy: 2.1
  });
}

function applyPower(type) {
  if (type === "P") {
    state.power = clamp(state.power + 1, 1, 5);
    state.score += 150;
    tone(620, 0.08, "triangle", 0.026);
  }

  if (type === "B") {
    state.bombs = clamp(state.bombs + 1, 0, 9);
    state.score += 100;
    tone(330, 0.08, "triangle", 0.026);
  }

  setBestScore();
  syncHud();
}

function playerHitbox() {
  return {
    x: player.x + 20,
    y: player.y + 24,
    width: player.width - 40,
    height: player.height - 42
  };
}

function damagePlayer() {
  const now = performance.now();
  if (now < state.invulnerableUntil) return;

  state.lives -= 1;
  state.power = Math.max(1, state.power - 1);
  state.invulnerableUntil = now + 2300;
  enemyBullets = [];

  spawnBurst(player.x + player.width / 2, player.y + player.height / 2, 28, "#ffbe8d");
  tone(180, 0.12, "sawtooth", 0.03);

  if (state.lives <= 0) {
    gameOver();
    return;
  }

  resetPlayerPosition();
  syncHud();
}

function useBomb() {
  if (state.mode !== "running" || state.bombs <= 0) return;

  state.bombs -= 1;
  state.bombFlashUntil = performance.now() + 180;
  enemyBullets = [];

  let gained = 0;

  enemies = enemies.filter((enemy) => {
    if (enemy.type === "boss") {
      enemy.hp -= 95;
      spawnBurst(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 34, "#ffe8b8");
      if (enemy.hp <= 0) {
        gained += enemy.score;
        maybeDropPower(enemy);
        state.bossActive = false;
        return false;
      }
      return true;
    }

    gained += enemy.score;
    maybeDropPower(enemy);
    spawnBurst(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 16, "#ffe8b8");
    return false;
  });

  state.score += gained;
  setBestScore();
  syncHud();
  tone(250, 0.15, "sawtooth", 0.03);
}

function updatePlayer(dt) {
  const speed = player.speed * dt * 60;

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
    player.x += clamp(targetX - player.x, -speed * 1.55, speed * 1.55);
    player.y += clamp(targetY - player.y, -speed * 1.55, speed * 1.55);
  }

  player.x = clamp(player.x, 14, WIDTH - player.width - 14);
  player.y = clamp(player.y, 110, HEIGHT - player.height - 18);
}

function updateScript() {
  while (state.scriptIndex < state.script.length && state.elapsedMs >= state.script[state.scriptIndex].at) {
    const entry = state.script[state.scriptIndex];
    state.scriptIndex += 1;
    state.waveLabel = `${state.scriptIndex}/${state.script.length}`;
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
      enemy.x = enemy.baseX + Math.sin(enemy.age * enemy.waveSpeed) * enemy.waveAmp;
    } else if (enemy.pattern === "dive") {
      enemy.x += enemy.vx * dt * 60;
      enemy.y += enemy.vy * dt * 60;
      if (enemy.y > HEIGHT * 0.42) {
        enemy.vx *= 1.018;
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
        enemy.shotTimer = rand(300, 460);
      } else if (enemy.type === "bomber") {
        enemy.shotTimer = rand(620, 980);
      } else if (enemy.type === "fighter") {
        enemy.shotTimer = rand(780, 1250);
      } else {
        enemy.shotTimer = rand(1050, 1650);
      }
    }

    if (enemy.type !== "boss" && enemy.y > HEIGHT + 140) return false;

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
    return bullet.y + bullet.height > -40 && bullet.x > -30 && bullet.x < WIDTH + 30;
  });

  enemyBullets = enemyBullets.filter((bullet) => {
    bullet.x += bullet.vx * dt * 60;
    bullet.y += bullet.vy * dt * 60;
    return bullet.y < HEIGHT + 50 && bullet.x > -40 && bullet.x < WIDTH + 40;
  });
}

function resolveCombat() {
  const keptBullets = [];

  for (const bullet of playerBullets) {
    let hit = false;

    for (const enemy of enemies) {
      if (!rectHit(bullet, enemy)) continue;
      hit = true;
      enemy.hp -= bullet.damage;

      if (enemy.hp <= 0) {
        state.score += enemy.score;
        maybeDropPower(enemy);
        spawnBurst(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.type === "boss" ? 48 : 18, "#ffe5b8");

        if (enemy.type === "boss") {
          state.bossActive = false;
          state.bombs = clamp(state.bombs + 1, 0, 9);
          tone(980, 0.11, "triangle", 0.03);
        } else {
          tone(enemy.type === "bomber" ? 470 : 410, 0.045, "square", 0.017);
        }
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

  powerUps = powerUps.filter((power) => {
    power.y += power.vy;

    if (rectHit(power, hitbox)) {
      applyPower(power.type);
      spawnBurst(power.x + power.width / 2, power.y + power.height / 2, 14, "#d3f3ff");
      return false;
    }

    return power.y < HEIGHT + 60;
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
  state.scrollY = (state.scrollY + dt * 214) % HEIGHT;

  updatePlayer(dt);
  firePlayer(nowMs);
  updateScript();
  updateEnemies(dt);
  updateBullets(dt);
  resolveCombat();
  updateParticles(dt);
}

function drawBackground() {
  ctx.drawImage(images.background, 0, state.scrollY - HEIGHT, WIDTH, HEIGHT);
  ctx.drawImage(images.background, 0, state.scrollY, WIDTH, HEIGHT);

  ctx.globalAlpha = 0.12;
  for (let y = 0; y < HEIGHT; y += 16) {
    ctx.fillStyle = y % 32 === 0 ? "#b2d9f8" : "#ffe5bb";
    ctx.fillRect(0, y, WIDTH, 1);
  }
  ctx.globalAlpha = 1;

  if (performance.now() < state.bombFlashUntil) {
    ctx.fillStyle = "rgba(255, 244, 188, 0.34)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
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
      const barW = 430;
      const barH = 12;
      const x = WIDTH / 2 - barW / 2;
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

function drawPowerUps() {
  for (const power of powerUps) {
    const sprite = power.type === "P" ? images.powerP : images.powerB;
    ctx.drawImage(sprite, power.x, power.y, power.width, power.height);

    ctx.fillStyle = "#14334c";
    ctx.font = "bold 18px Trebuchet MS, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(power.type, power.x + power.width / 2, power.y + power.height / 2 + 6);
    ctx.textAlign = "start";
  }
}

function drawPlayer(nowMs) {
  if (nowMs < state.invulnerableUntil && Math.floor(nowMs / 90) % 2 === 0) {
    ctx.globalAlpha = 0.42;
  }

  ctx.save();
  ctx.shadowColor = "rgba(139, 218, 255, 0.7)";
  ctx.shadowBlur = 16;
  ctx.drawImage(images.player, player.x, player.y, player.width, player.height);
  ctx.restore();
  ctx.globalAlpha = 1;
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
  if (nowMs < state.invulnerableUntil) {
    ctx.fillStyle = "rgba(7, 14, 24, 0.58)";
    ctx.fillRect(16, HEIGHT - 42, 170, 24);
    ctx.fillStyle = "#e4f5ff";
    ctx.font = "14px Trebuchet MS, sans-serif";
    ctx.fillText("INVULNERABLE", 24, HEIGHT - 25);
  }

  ctx.fillStyle = "rgba(7, 14, 24, 0.58)";
  ctx.fillRect(WIDTH - 250, HEIGHT - 42, 232, 24);
  ctx.fillStyle = "#f1fbff";
  ctx.font = "14px Trebuchet MS, sans-serif";
  ctx.fillText(`Wave ${state.waveLabel}  |  Stage ${state.stage}`, WIDTH - 240, HEIGHT - 25);
}

function render(nowMs) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawBackground();
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
  syncHud();
  showOverlay(
    "Sky Force 1946",
    "Near-replica 1945-style run: scripted waves, P/B pickups, heavy bomber lines, and boss barrages.",
    "Launch Stage 1",
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