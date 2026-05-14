/* Sky Force 1946 mobile weapons, music catalog, and balance v2.
   Changes are additive and test-only. This does not clone any commercial shooter. */
(function () {
  'use strict';

  const BALANCE = {
    label: 'mobile-weapons-music-balance-v2',
    noEnemyFireMs: 8000,
    softFireMs: 28000,
    fullPressureMs: 78000,
    enemyBulletSpeedScale: 0.48,
    openingEnemyBulletCap: 8,
    midEnemyBulletCap: 16,
    lateEnemyBulletCap: 28,
    bossBulletCap: 42,
    firstWaveDelayMs: 1800
  };

  const MUSIC_CATALOGS = [
    {
      name: 'Free Music Archive',
      detail: 'Large royalty-free / Creative Commons music archive. Track licenses vary.',
      url: 'https://freemusicarchive.org/'
    },
    {
      name: 'OpenGameArt Music',
      detail: 'Game-focused free music and audio. Track licenses vary.',
      url: 'https://opengameart.org/art-search-advanced?field_art_type_tid%5B%5D=12'
    },
    {
      name: 'Freesound Music Loops',
      detail: 'Creative Commons loops and audio clips. Track licenses vary.',
      url: 'https://freesound.org/browse/tags/music-loop/'
    }
  ];

  window.__SKY_FORCE_MOBILE_BALANCE_TEST__ = BALANCE;
  window.__SKY_FORCE_FREE_MUSIC_CATALOGS__ = MUSIC_CATALOGS;

  function clampLocal(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function canReachGame() {
    return typeof state !== 'undefined' && typeof player !== 'undefined' &&
      typeof playerBullets !== 'undefined' && typeof enemyBullets !== 'undefined' &&
      typeof enemies !== 'undefined';
  }

  function pressureRatio() {
    if (state.elapsedMs < BALANCE.noEnemyFireMs) return 0;
    if (state.elapsedMs < BALANCE.softFireMs) return 0.32;
    return clampLocal((state.elapsedMs - BALANCE.softFireMs) / (BALANCE.fullPressureMs - BALANCE.softFireMs), 0.45, 1);
  }

  function bulletCap() {
    if (state.bossActive) return BALANCE.bossBulletCap;
    if (state.elapsedMs < BALANCE.softFireMs) return BALANCE.openingEnemyBulletCap;
    if (state.elapsedMs < BALANCE.fullPressureMs) return BALANCE.midEnemyBulletCap;
    return BALANCE.lateEnemyBulletCap;
  }

  function findNearestEnemy(x, y) {
    let best = null;
    let bestDistance = Infinity;
    for (const enemy of enemies) {
      if (!enemy || enemy.dead) continue;
      const cx = enemy.x + enemy.width / 2;
      const cy = enemy.y + enemy.height / 2;
      const dx = cx - x;
      const dy = cy - y;
      const dist = dx * dx + dy * dy;
      if (dist < bestDistance) {
        bestDistance = dist;
        best = enemy;
      }
    }
    return best;
  }

  function fireMissilePair(homing) {
    if (!canReachGame() || state.mode !== 'running') return;
    const cx = player.x + player.width / 2;
    const cy = player.y + player.height * 0.2;
    const offsets = [-20, 20];
    for (const offset of offsets) {
      playerBullets.push({
        x: cx + offset - 9,
        y: cy - 24,
        width: 18,
        height: 44,
        vx: offset < 0 ? -0.55 : 0.55,
        vy: -10.5,
        damage: homing ? 7 : 5,
        missile: true,
        homing,
        turnRate: homing ? 0.12 : 0,
        life: 180
      });
    }
    if (typeof tone === 'function') tone(homing ? 520 : 360, 0.08, 'sawtooth', 0.025);
  }

  function fireSmartBomb() {
    if (!canReachGame() || state.mode !== 'running') return;
    if (typeof triggerBomb === 'function') {
      triggerBomb();
      return;
    }
    if (typeof input !== 'undefined' && input.keys) {
      input.keys.add(' ');
      setTimeout(() => input.keys.delete(' '), 80);
    }
  }

  function installBalance() {
    if (!canReachGame()) return false;

    if (typeof spawnEnemyBullet === 'function' && !spawnEnemyBullet.__v2Wrapped) {
      const original = spawnEnemyBullet;
      spawnEnemyBullet = function (x, y, vx, vy, size = 1) {
        const pressure = pressureRatio();
        if (pressure <= 0) return;
        if (enemyBullets.length >= bulletCap()) return;
        const scale = BALANCE.enemyBulletSpeedScale + pressure * 0.28;
        return original(x, y, vx * scale, vy * scale, size);
      };
      spawnEnemyBullet.__v2Wrapped = true;
    }

    if (typeof startStage === 'function' && !startStage.__v2Wrapped) {
      const originalStartStage = startStage;
      startStage = function (stageNumber, keepStats = true) {
        originalStartStage(stageNumber, keepStats);
        if (!keepStats || stageNumber === 1) {
          state.power = Math.max(state.power || 1, 2);
          state.speedLevel = Math.max(state.speedLevel || 1, 2);
          if (typeof syncHud === 'function') syncHud();
        }
      };
      startStage.__v2Wrapped = true;
    }

    if (typeof buildStageScript === 'function' && !buildStageScript.__v2Wrapped) {
      const originalBuildStageScript = buildStageScript;
      buildStageScript = function (stage) {
        const script = originalBuildStageScript(stage).map((item) => ({ ...item }));
        let waveIndex = 0;
        for (const item of script) {
          if (item.kind === 'boss') {
            item.at = Math.max(item.at, 88000);
          } else if (item.kind === 'wave') {
            item.at = Math.max(item.at * 1.35, BALANCE.firstWaveDelayMs + waveIndex * 4700);
            waveIndex += 1;
          }
        }
        return script;
      };
      buildStageScript.__v2Wrapped = true;
    }

    if (typeof updatePlayerTrail === 'function' && !updatePlayerTrail.__missileWrapped) {
      const originalTrail = updatePlayerTrail;
      updatePlayerTrail = function () {
        originalTrail();
        for (const bullet of playerBullets) {
          if (!bullet || !bullet.missile) continue;
          bullet.life -= 1;
          if (bullet.homing) {
            const target = findNearestEnemy(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2);
            if (target) {
              const tx = target.x + target.width / 2;
              const ty = target.y + target.height / 2;
              const bx = bullet.x + bullet.width / 2;
              const by = bullet.y + bullet.height / 2;
              const dx = tx - bx;
              const dy = ty - by;
              const mag = Math.max(1, Math.hypot(dx, dy));
              const desiredVx = (dx / mag) * 10.8;
              const desiredVy = (dy / mag) * 10.8;
              bullet.vx += (desiredVx - bullet.vx) * bullet.turnRate;
              bullet.vy += (desiredVy - bullet.vy) * bullet.turnRate;
            }
          }
        }
      };
      updatePlayerTrail.__missileWrapped = true;
    }

    document.documentElement.dataset.skyForceBalance = 'mobile-weapons-music-v2';
    console.info('[Sky Force 1946] Mobile weapons/music/balance v2 installed', BALANCE);
    return true;
  }

  function injectControls() {
    if (document.getElementById('mobileFeatureDeck')) return;
    const style = document.createElement('style');
    style.textContent = `
      #mobileFeatureDeck {
        position: fixed;
        left: 50%;
        bottom: 10px;
        transform: translateX(-50%);
        z-index: 9999;
        display: grid;
        grid-template-columns: repeat(4, minmax(64px, 1fr));
        gap: 7px;
        width: min(94vw, 460px);
        pointer-events: auto;
      }
      #mobileFeatureDeck button {
        border: 1px solid rgba(185,235,255,.72);
        border-radius: 12px;
        padding: 9px 6px;
        color: white;
        background: linear-gradient(180deg, rgba(14,86,130,.88), rgba(6,22,43,.92));
        box-shadow: 0 0 14px rgba(76,201,255,.35), inset 0 0 10px rgba(255,255,255,.09);
        font: 700 11px/1.1 system-ui, sans-serif;
        text-shadow: 0 1px 2px rgba(0,0,0,.6);
      }
      #mobileMusicPanel {
        position: fixed;
        inset: auto 10px 64px 10px;
        z-index: 9998;
        border: 1px solid rgba(185,235,255,.65);
        border-radius: 14px;
        padding: 12px;
        color: #f4fbff;
        background: rgba(3, 10, 21, .94);
        box-shadow: 0 8px 28px rgba(0,0,0,.45);
        font: 13px/1.35 system-ui, sans-serif;
        display: none;
      }
      #mobileMusicPanel.open { display: block; }
      #mobileMusicPanel a { color: #79dcff; font-weight: 700; }
      #mobileMusicPanel p { margin: 5px 0 9px; color: #c9e8f7; }
    `;
    document.head.appendChild(style);

    const deck = document.createElement('div');
    deck.id = 'mobileFeatureDeck';
    deck.innerHTML = `
      <button type="button" data-action="missile">MISSILE</button>
      <button type="button" data-action="homing">HEAT SEEK</button>
      <button type="button" data-action="bomb">BOMB</button>
      <button type="button" data-action="music">MUSIC</button>
    `;
    document.body.appendChild(deck);

    const panel = document.createElement('div');
    panel.id = 'mobileMusicPanel';
    panel.innerHTML = `<strong>Free music catalogs</strong><p>Track licenses vary. Pick tracks from these catalogs and add only the ones with licenses that fit your use.</p>` +
      MUSIC_CATALOGS.map((item) => `<p><a href="${item.url}" target="_blank" rel="noopener">${item.name}</a><br>${item.detail}</p>`).join('');
    document.body.appendChild(panel);

    deck.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      const action = button.dataset.action;
      if (action === 'missile') fireMissilePair(false);
      if (action === 'homing') fireMissilePair(true);
      if (action === 'bomb') fireSmartBomb();
      if (action === 'music') panel.classList.toggle('open');
    });
  }

  let tries = 0;
  const timer = setInterval(function () {
    tries += 1;
    injectControls();
    if (installBalance() || tries > 50) clearInterval(timer);
  }, 100);
})();
