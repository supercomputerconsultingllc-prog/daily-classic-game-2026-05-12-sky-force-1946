/* Sky Force 1946 mobile balance test override.
   Goal: classic vertical shooter pacing: target shooting first, dodge pressure later.
   This does not copy any commercial game patterns, code, art, or stage layouts. */
(function () {
  'use strict';

  const BALANCE = {
    noEnemyFireMs: 12000,
    softFireMs: 35000,
    fullPressureMs: 95000,
    enemyBulletSpeedScale: 0.42,
    openingEnemyBulletCap: 5,
    midEnemyBulletCap: 12,
    lateEnemyBulletCap: 22,
    bossBulletCap: 36,
    firstWaveDelayMs: 2400
  };

  window.__SKY_FORCE_MOBILE_BALANCE_TEST__ = BALANCE;

  function tryInstall() {
    try {
      if (typeof state === 'undefined' || typeof enemyBullets === 'undefined') {
        return false;
      }

      function pressureRatio() {
        if (state.elapsedMs < BALANCE.noEnemyFireMs) return 0;
        if (state.elapsedMs < BALANCE.softFireMs) return 0.22;
        const t = (state.elapsedMs - BALANCE.softFireMs) / (BALANCE.fullPressureMs - BALANCE.softFireMs);
        return Math.max(0.35, Math.min(1, t));
      }

      function bulletCap() {
        if (state.bossActive) return BALANCE.bossBulletCap;
        if (state.elapsedMs < BALANCE.softFireMs) return BALANCE.openingEnemyBulletCap;
        if (state.elapsedMs < BALANCE.fullPressureMs) return BALANCE.midEnemyBulletCap;
        return BALANCE.lateEnemyBulletCap;
      }

      if (typeof spawnEnemyBullet === 'function') {
        spawnEnemyBullet = function (x, y, vx, vy, size = 1) {
          const pressure = pressureRatio();
          if (pressure <= 0) return;
          if (enemyBullets.length >= bulletCap()) return;

          const scale = BALANCE.enemyBulletSpeedScale + pressure * 0.24;
          const w = size >= 1.2 ? 13 : 10;
          const h = size >= 1.2 ? 22 : 18;
          enemyBullets.push({
            x: x - w / 2,
            y: y - h / 2,
            width: w,
            height: h,
            vx: vx * scale,
            vy: vy * scale
          });
        };
      }

      if (typeof startStage === 'function') {
        const originalStartStage = startStage;
        startStage = function (stageNumber, keepStats = true) {
          originalStartStage(stageNumber, keepStats);
          if (!keepStats || stageNumber === 1) {
            state.power = Math.max(state.power || 1, 2);
            state.speedLevel = Math.max(state.speedLevel || 1, 2);
            state.bombs = Math.max(state.bombs || 3, 3);
            state.lives = Math.max(state.lives || 3, 3);
            if (typeof syncHud === 'function') syncHud();
          }
        };
      }

      if (typeof buildStageScript === 'function') {
        const originalBuildStageScript = buildStageScript;
        buildStageScript = function (stage) {
          const script = originalBuildStageScript(stage);
          const rebuilt = [];
          for (const item of script) {
            const copy = { ...item };
            if (copy.kind === 'boss') {
              copy.at = Math.max(copy.at, 98000);
            } else if (copy.kind === 'wave') {
              if (rebuilt.length === 0) copy.at = BALANCE.firstWaveDelayMs;
              else copy.at = Math.max(copy.at * 1.7, BALANCE.firstWaveDelayMs + rebuilt.length * 6200);
            }
            rebuilt.push(copy);
          }
          return rebuilt;
        };
      }

      document.documentElement.dataset.skyForceBalance = 'mobile-psikyo-feel';
      console.info('[Sky Force 1946] Mobile balance test installed', BALANCE);
      return true;
    } catch (err) {
      console.error('[Sky Force 1946] Mobile balance install failed', err);
      return false;
    }
  }

  let tries = 0;
  const timer = setInterval(function () {
    tries += 1;
    if (tryInstall() || tries > 40) clearInterval(timer);
  }, 100);
})();
