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
  powerSpread: new Image(),
  powerShield: new Image(),
  powerBomb: new Image()
};

images.background.src = "assets/bg-cloud-warzone.svg";
images.player.src = "assets/player-plane.svg";
images.enemyScout.src = "assets/enemy-scout.svg";
images.enemyFighter.src = "assets/enemy-fighter.svg";
images.enemyBoss.src = "assets/enemy-boss.svg";
images.bulletPlayer.src = "assets/bullet-player.svg";
images.bulletEnemy.src = "assets/bullet-enemy.svg";
images.powerSpread.src = "assets/power-spread.svg";
images.powerShield.src = "assets/power-shield.svg";
images.powerBomb.src = "assets/power-bomb.svg";

const input = {
  keys: new Set(),
  pointerActive: false,
  pointerX: WIDTH / 2,
  pointerY: HEIGHT - 150
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
    // localStorage can fail in restricted file:// contexts.
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

const state = {
  mode: "loading",
  score: 0,
  lives: 3,
  bombs: 3,
  weapon: 1,
  best: safeReadNumber("sky-force-1946-best", 0),
  runningAction: null,
  lastFrame: performance.now(),
  scrollY: 0,
  missionMs: 0,
  nextSpawnMs: 0,
  bossThreshold: 6500,
  bossActive: false,
  invulnerableUntil: 0
};

const player = {
  x: WIDTH / 2 - 48,
  y: HEIGHT - 180,
  width: 96,
  height: 120,
  speed: 8.3,
  fireDelay: 125,
  lastShotAt: 0
};

let playerBullets = [];
let enemyBullets = [];
let enemies = [];
let powerUps = [];
let particles = [];

let audioContext = null;

function syncHud() {
  scoreValue.textContent = String(state.score);
  livesValue.textContent = String(state.lives);
  bombsValue.textContent = String(state.bombs);
  weaponValue.textContent = `Lv${state.weapon}`;
  bestValue.textContent = String(state.best);
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

function setBestScore() {
  if (state.score > state.best) {
    state.best = state.score;
    safeWriteNumber("sky-force-1946-best", state.best);
  }
}

function makeEnemy(type, x, y) {
  if (type === "scout") {
    return {
      type,
      sprite: "enemyScout",
      x,
      y,
      width: 74,
      height: 92,
      hp: 2,
      maxHp: 2,
      vy: rand(2.7, 3.7),
      fireCooldown: rand(720, 1320),
      baseX: x,
      waveAge: 0,
      waveAmp: rand(14, 48),
      waveSpeed: rand(0.05, 0.09),
      score: 130
    };
  }

  if (type === "fighter") {
    return {
      type,
      sprite: "enemyFighter",
      x,
      y,
      width: 92,
      height: 116,
      hp: 5,
      maxHp: 5,
      vy: rand(2.2, 2.8),
      fireCooldown: rand(500, 920),
      baseX: x,
      waveAge: 0,
      waveAmp: rand(8, 24),
      waveSpeed: rand(0.04, 0.07),
      score: 330
    };
  }

  return {
    type: "boss",
    sprite: "enemyBoss",
    x,
    y,
    width: 260,
    height: 230,
    hp: 280,
    maxHp: 280,
    vy: 0.95,
    fireCooldown: 420,
    baseX: x,
    waveAge: 0,
    waveAmp: 190,
    waveSpeed: 0.03,
    score: 3500,
    lockY: 140
  };
}

function spawnFormation() {
  const lanes = 7;
  const spacing = WIDTH / (lanes + 1);
  const formationType = Math.random() < 0.68 ? "scout" : "fighter";
  const offset = Math.random() < 0.5 ? -36 : 36;

  for (let i = 1; i <= lanes; i += 1) {
    if (Math.random() < 0.2) continue;
    const x = i * spacing + (i % 2 === 0 ? offset : -offset);
    enemies.push(makeEnemy(formationType, x, -rand(120, 460)));
  }

  if (Math.random() < 0.4) {
    enemies.push(makeEnemy("fighter", rand(130, WIDTH - 130), -rand(160, 320)));
  }
}

function spawnBoss() {
  const boss = makeEnemy("boss", WIDTH / 2 - 130, -260);
  enemies.push(boss);
  state.bossActive = true;
  tone(120, 0.2, "sawtooth", 0.03);
}

function resetPlayer() {
  player.x = WIDTH / 2 - player.width / 2;
  player.y = HEIGHT - 190;
  input.pointerX = player.x + player.width / 2;
  input.pointerY = player.y + player.height / 2;
}

function startMission() {
  state.mode = "running";
  state.score = 0;
  state.lives = 3;
  state.bombs = 3;
  state.weapon = 1;
  state.scrollY = 0;
  state.missionMs = 0;
  state.nextSpawnMs = 200;
  state.bossThreshold = 6500;
  state.bossActive = false;
  state.invulnerableUntil = performance.now() + 1400;

  resetPlayer();
  playerBullets = [];
  enemyBullets = [];
  enemies = [];
  powerUps = [];
  particles = [];

  hideOverlay();
  syncHud();
  tone(480, 0.08, "triangle", 0.03);
}

function togglePause() {
  if (state.mode === "running") {
    state.mode = "paused";
    showOverlay("Mission Paused", "Regroup and resume your sortie.", "Resume", () => {
      state.mode = "running";
      hideOverlay();
      tone(520, 0.07, "triangle", 0.024);
    });
    return;
  }

  if (state.mode === "paused" && state.runningAction) {
    state.runningAction();
  }
}

function gameOver() {
  state.mode = "gameOver";
  setBestScore();
  syncHud();
  showOverlay(
    "Mission Failed",
    `Score ${state.score}. Best ${state.best}. Enemy skies remain contested.`,
    "Retry Mission",
    () => startMission()
  );
  tone(160, 0.26, "sawtooth", 0.03);
}

function rectHit(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function spawnBurst(x, y, count, color) {
  for (let i = 0; i < count; i += 1) {
    particles.push({
      x,
      y,
      vx: rand(-4.8, 4.8),
      vy: rand(-4.4, 3.2),
      size: rand(2, 6),
      color,
      life: rand(0.22, 0.9),
      age: 0
    });
  }
}

function maybeDropPower(enemy) {
  const chance = enemy.type === "fighter" ? 0.26 : enemy.type === "boss" ? 1 : 0.14;
  if (Math.random() > chance) return;

  const roll = Math.random();
  let type = "spread";
  if (roll > 0.64 && roll <= 0.84) type = "shield";
  if (roll > 0.84) type = "bomb";

  powerUps.push({
    type,
    x: enemy.x + enemy.width / 2 - 20,
    y: enemy.y + enemy.height / 2 - 20,
    width: 40,
    height: 40,
    vy: 2.2
  });
}

function firePlayer(nowMs) {
  if (nowMs - player.lastShotAt < player.fireDelay) return;
  player.lastShotAt = nowMs;

  const centerX = player.x + player.width / 2;
  const topY = player.y - 16;

  const pattern = {
    1: [0],
    2: [-10, 10],
    3: [-18, 0, 18],
    4: [-28, -10, 10, 28],
    5: [-36, -18, 0, 18, 36]
  }[state.weapon] || [0];

  pattern.forEach((offset, idx) => {
    const normalized = pattern.length > 1 ? (idx / (pattern.length - 1)) * 2 - 1 : 0;
    playerBullets.push({
      x: centerX + offset - 8,
      y: topY,
      width: 16,
      height: 34,
      vx: normalized * 1.6,
      vy: -12,
      damage: state.weapon >= 4 ? 1.2 : 1
    });
  });

  tone(780, 0.04, "square", 0.013);
}

function fireEnemy(enemy) {
  if (enemy.type === "boss") {
    const spread = [-2.8, -1.4, 0, 1.4, 2.8];
    spread.forEach((vx) => {
      enemyBullets.push({
        x: enemy.x + enemy.width / 2 - 9,
        y: enemy.y + enemy.height - 16,
        width: 18,
        height: 28,
        vx,
        vy: 5.2
      });
    });
    return;
  }

  enemyBullets.push({
    x: enemy.x + enemy.width / 2 - 7,
    y: enemy.y + enemy.height - 10,
    width: 14,
    height: 24,
    vx: rand(-0.7, 0.7),
    vy: rand(6.4, 7.4)
  });
}

function applyPower(type) {
  if (type === "spread") {
    state.weapon = clamp(state.weapon + 1, 1, 5);
    tone(620, 0.08, "triangle", 0.028);
  }

  if (type === "shield") {
    const now = performance.now();
    state.invulnerableUntil = Math.max(state.invulnerableUntil, now + 6500);
    tone(460, 0.1, "sine", 0.026);
  }

  if (type === "bomb") {
    state.bombs = clamp(state.bombs + 1, 0, 9);
    tone(340, 0.1, "triangle", 0.026);
  }

  syncHud();
}

function damagePlayer() {
  const now = performance.now();
  if (now < state.invulnerableUntil) return;

  state.lives -= 1;
  state.invulnerableUntil = now + 2200;
  spawnBurst(player.x + player.width / 2, player.y + player.height / 2, 26, "#ffb16f");
  tone(190, 0.12, "sawtooth", 0.03);

  if (state.lives <= 0) {
    gameOver();
    return;
  }

  syncHud();
}

function useBomb() {
  if (state.mode !== "running" || state.bombs <= 0) return;

  state.bombs -= 1;
  syncHud();
  tone(250, 0.15, "sawtooth", 0.03);

  let gained = 0;

  enemies = enemies.filter((enemy) => {
    if (enemy.type === "boss") {
      enemy.hp -= 45;
      spawnBurst(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 32, "#ffe7b0");
      if (enemy.hp <= 0) {
        state.bossActive = false;
        state.bossThreshold += 12000;
        state.score += enemy.score;
        maybeDropPower(enemy);
        tone(880, 0.1, "square", 0.03);
        return false;
      }
      return true;
    }

    gained += enemy.score;
    spawnBurst(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 14, "#ffd3a9");
    maybeDropPower(enemy);
    return false;
  });

  enemyBullets = [];
  state.score += gained;
  setBestScore();
  syncHud();
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
    player.x += clamp(targetX - player.x, -speed * 1.6, speed * 1.6);
    player.y += clamp(targetY - player.y, -speed * 1.6, speed * 1.6);
  }

  player.x = clamp(player.x, 20, WIDTH - player.width - 20);
  player.y = clamp(player.y, HEIGHT * 0.54, HEIGHT - player.height - 18);
}

function updateWaves(nowMs) {
  if (state.bossActive) return;
  if (nowMs < state.nextSpawnMs) return;

  spawnFormation();

  const spawnGap = clamp(880 - state.score * 0.006, 330, 880);
  state.nextSpawnMs = nowMs + spawnGap + rand(-110, 140);

  if (state.score >= state.bossThreshold) {
    spawnBoss();
  }
}

function updateEnemies(dt) {
  enemies = enemies.filter((enemy) => {
    enemy.waveAge += dt * 60;

    if (enemy.type === "boss") {
      if (enemy.y < enemy.lockY) {
        enemy.y += enemy.vy * dt * 60;
      }
      enemy.x = enemy.baseX + Math.sin(enemy.waveAge * enemy.waveSpeed) * enemy.waveAmp;
    } else {
      enemy.y += enemy.vy * dt * 60;
      enemy.x = enemy.baseX + Math.sin(enemy.waveAge * enemy.waveSpeed) * enemy.waveAmp;
    }

    enemy.fireCooldown -= dt * 1000;
    if (enemy.fireCooldown <= 0) {
      fireEnemy(enemy);
      if (enemy.type === "boss") {
        enemy.fireCooldown = rand(260, 460);
      } else if (enemy.type === "fighter") {
        enemy.fireCooldown = rand(620, 980);
      } else {
        enemy.fireCooldown = rand(900, 1400);
      }
    }

    if (enemy.type !== "boss" && enemy.y > HEIGHT + 160) return false;

    if (rectHit(enemy, player)) {
      damagePlayer();
      if (enemy.type !== "boss") return false;
    }

    return true;
  });
}

function updateBullets(dt) {
  playerBullets = playerBullets.filter((b) => {
    b.x += b.vx * dt * 60;
    b.y += b.vy * dt * 60;
    return b.y + b.height > -40;
  });

  enemyBullets = enemyBullets.filter((b) => {
    b.x += b.vx * dt * 60;
    b.y += b.vy * dt * 60;
    return b.y < HEIGHT + 70;
  });
}

function resolveCombat() {
  const keptPlayerBullets = [];

  for (const bullet of playerBullets) {
    let hit = false;

    for (const enemy of enemies) {
      if (!rectHit(bullet, enemy)) continue;
      hit = true;
      enemy.hp -= bullet.damage;

      if (enemy.hp <= 0) {
        state.score += enemy.score;
        setBestScore();
        maybeDropPower(enemy);
        spawnBurst(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.type === "boss" ? 48 : 18, "#ffe2b3");

        if (enemy.type === "boss") {
          state.bossActive = false;
          state.bossThreshold += 12000;
          state.bombs = clamp(state.bombs + 1, 0, 9);
          tone(1040, 0.11, "triangle", 0.03);
        } else {
          tone(enemy.type === "fighter" ? 510 : 430, 0.05, "square", 0.02);
        }
      } else {
        tone(280, 0.03, "triangle", 0.01);
      }

      break;
    }

    if (!hit) keptPlayerBullets.push(bullet);
  }

  playerBullets = keptPlayerBullets;
  enemies = enemies.filter((enemy) => enemy.hp > 0);

  enemyBullets = enemyBullets.filter((bullet) => {
    if (rectHit(bullet, player)) {
      damagePlayer();
      return false;
    }
    return true;
  });

  powerUps = powerUps.filter((power) => {
    power.y += power.vy;

    if (rectHit(power, player)) {
      applyPower(power.type);
      spawnBurst(power.x + power.width / 2, power.y + power.height / 2, 14, "#ccf4ff");
      return false;
    }

    return power.y < HEIGHT + 60;
  });

  syncHud();
}

function updateParticles(dt) {
  particles = particles.filter((p) => {
    p.age += dt;
    p.x += p.vx * dt * 60;
    p.y += p.vy * dt * 60;
    p.vy += 0.06 * dt * 60;
    return p.age < p.life;
  });
}

function update(dt, nowMs) {
  if (state.mode !== "running") {
    updateParticles(dt);
    return;
  }

  state.missionMs += dt * 1000;
  state.scrollY = (state.scrollY + dt * 180) % HEIGHT;

  updatePlayer(dt);
  firePlayer(nowMs);
  updateWaves(state.missionMs);
  updateEnemies(dt);
  updateBullets(dt);
  resolveCombat();
  updateParticles(dt);
}

function drawBackground() {
  ctx.drawImage(images.background, 0, state.scrollY - HEIGHT, WIDTH, HEIGHT);
  ctx.drawImage(images.background, 0, state.scrollY, WIDTH, HEIGHT);

  ctx.globalAlpha = 0.16;
  for (let y = 0; y < HEIGHT; y += 14) {
    ctx.fillStyle = y % 28 === 0 ? "#8ec9ef" : "#ffe0ac";
    ctx.fillRect(0, y, WIDTH, 1);
  }
  ctx.globalAlpha = 1;
}

function drawPlayer(nowMs) {
  if (nowMs < state.invulnerableUntil && Math.floor(nowMs / 80) % 2 === 0) {
    ctx.globalAlpha = 0.4;
  }

  ctx.save();
  ctx.shadowColor = "rgba(111, 217, 255, 0.65)";
  ctx.shadowBlur = 18;
  ctx.drawImage(images.player, player.x, player.y, player.width, player.height);
  ctx.restore();

  ctx.globalAlpha = 1;
}

function drawEnemies() {
  for (const enemy of enemies) {
    const sprite = images[enemy.sprite];
    ctx.save();
    ctx.shadowColor = enemy.type === "boss" ? "rgba(255, 181, 118, 0.85)" : "rgba(255, 102, 102, 0.64)";
    ctx.shadowBlur = enemy.type === "boss" ? 26 : 12;
    ctx.drawImage(sprite, enemy.x, enemy.y, enemy.width, enemy.height);
    ctx.restore();

    if (enemy.type === "boss") {
      const barW = 430;
      const barH = 14;
      const x = WIDTH / 2 - barW / 2;
      const y = 24;
      ctx.fillStyle = "rgba(10, 22, 35, 0.8)";
      ctx.fillRect(x, y, barW, barH);
      ctx.fillStyle = "#ffbe74";
      ctx.fillRect(x, y, barW * (enemy.hp / enemy.maxHp), barH);
      ctx.strokeStyle = "rgba(255, 238, 205, 0.85)";
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
    const sprite =
      power.type === "spread"
        ? images.powerSpread
        : power.type === "shield"
          ? images.powerShield
          : images.powerBomb;

    ctx.save();
    ctx.shadowColor = "rgba(205, 243, 255, 0.8)";
    ctx.shadowBlur = 16;
    ctx.drawImage(sprite, power.x, power.y, power.width, power.height);
    ctx.restore();
  }
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

function drawStatus(nowMs) {
  if (nowMs < state.invulnerableUntil) {
    ctx.fillStyle = "rgba(6, 14, 27, 0.58)";
    ctx.fillRect(18, HEIGHT - 44, 236, 24);
    ctx.fillStyle = "#d4f4ff";
    ctx.font = "14px Trebuchet MS, sans-serif";
    ctx.fillText("Shield Active", 26, HEIGHT - 27);
  }

  ctx.fillStyle = "rgba(6, 14, 27, 0.56)";
  ctx.fillRect(WIDTH - 196, HEIGHT - 44, 176, 24);
  ctx.fillStyle = "#e8f6ff";
  ctx.font = "14px Trebuchet MS, sans-serif";
  ctx.fillText(`Stage ${Math.floor(state.score / 4500) + 1}`, WIDTH - 186, HEIGHT - 27);
}

function render(nowMs) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawBackground();
  drawPowerUps();
  drawEnemies();
  drawBullets();
  drawPlayer(nowMs);
  drawParticles();
  drawStatus(nowMs);
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
    startMission();
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
    "A modern take on the 1945 vertical shooter formula: tighter controls, richer waves, and tactical bombs.",
    "Launch Mission",
    () => startMission()
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