/* Sky Force 1946 mobile v7: full-width playfield, no side dead-space, transparent HUD overlay.
   This fixes the underlying runtime behavior as much as possible from an additive mobile branch:
   - playT now maps across the full canvas width
   - player/touch movement is clamped to the full canvas width
   - enemy spawn helpers are remapped away from the old centered side-gutter playfield
   - visual display fills/covers the phone viewport
   - HUD chips float transparently over the gameplay background
*/
(function () {
  'use strict';

  const V7 = {
    label: 'mobile-full-width-playfield-v7',
    edgePad: 8,
    bottomDockReserve: 96
  };

  window.__SKY_FORCE_MOBILE_V7__ = V7;

  function numberOr(value, fallback) {
    return Number.isFinite(value) ? value : fallback;
  }

  function canReachGame() {
    return typeof WIDTH !== 'undefined' && typeof HEIGHT !== 'undefined' &&
      typeof player !== 'undefined' && typeof input !== 'undefined';
  }

  function installFullBleedCss() {
    if (document.getElementById('v7FullBleedStyle')) return;
    const style = document.createElement('style');
    style.id = 'v7FullBleedStyle';
    style.textContent = `
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: 100vw !important;
        max-width: 100vw !important;
        min-width: 100vw !important;
        height: 100vh !important;
        height: 100dvh !important;
        max-height: 100dvh !important;
        overflow: hidden !important;
        background: #020915 !important;
        overscroll-behavior: none !important;
        touch-action: none !important;
      }
      .app {
        width: 100vw !important;
        max-width: 100vw !important;
        min-width: 100vw !important;
        height: 100vh !important;
        height: 100dvh !important;
        margin: 0 !important;
        padding: 0 !important;
        gap: 0 !important;
        display: block !important;
        overflow: hidden !important;
        background: #020915 !important;
      }
      .stage {
        position: fixed !important;
        inset: 0 0 ${V7.bottomDockReserve}px 0 !important;
        width: 100vw !important;
        height: calc(100dvh - ${V7.bottomDockReserve}px) !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        overflow: hidden !important;
        background: #020915 !important;
        box-shadow: none !important;
      }
      canvas#game {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100vw !important;
        height: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        object-fit: fill !important;
        display: block !important;
        transform: none !important;
      }
      .overlay {
        position: fixed !important;
        inset: 0 0 ${V7.bottomDockReserve}px 0 !important;
        width: 100vw !important;
        height: calc(100dvh - ${V7.bottomDockReserve}px) !important;
        background: rgba(2, 8, 16, .26) !important;
      }
      .hud {
        position: fixed !important;
        top: max(4px, env(safe-area-inset-top)) !important;
        left: 4px !important;
        right: 4px !important;
        z-index: 10020 !important;
        display: grid !important;
        grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        gap: 3px !important;
        pointer-events: none !important;
        background: transparent !important;
      }
      .chip {
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
        padding: 0 2px !important;
        min-width: 0 !important;
        text-shadow: 0 2px 4px rgba(0,0,0,.95), 0 0 7px rgba(0,0,0,.75) !important;
      }
      .chip span {
        color: rgba(210, 239, 255, .86) !important;
        font-size: 9px !important;
        line-height: 1 !important;
      }
      .chip strong {
        color: #fff !important;
        font-size: 14px !important;
        line-height: 1 !important;
      }
      .controls {
        position: fixed !important;
        left: 0 !important;
        right: 0 !important;
        bottom: ${V7.bottomDockReserve}px !important;
        z-index: 10010 !important;
        width: 100vw !important;
        max-height: 34px !important;
        overflow: hidden !important;
        margin: 0 !important;
        padding: 2px 4px !important;
        justify-content: center !important;
        background: transparent !important;
        color: rgba(235,248,255,.92) !important;
        text-shadow: 0 2px 4px rgba(0,0,0,.9) !important;
        pointer-events: auto !important;
      }
      .controls p { display: none !important; }
      .controls button { min-height: 28px !important; padding: 4px 10px !important; }
      #mobileFeatureDeck { bottom: 52px !important; z-index: 10040 !important; }
      #v5MusicDock { bottom: 0 !important; z-index: 10045 !important; }
      @media (orientation: landscape) {
        .hud { grid-template-columns: repeat(8, minmax(0, 1fr)) !important; }
        .stage { inset-bottom: 78px !important; height: calc(100dvh - 78px) !important; }
        .overlay { inset-bottom: 78px !important; height: calc(100dvh - 78px) !important; }
        .controls { bottom: 78px !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function fullPlayX(t) {
    const w = numberOr(WIDTH, 900);
    return V7.edgePad + (w - V7.edgePad * 2) * t;
  }

  function clampPlayerToFullWidth() {
    if (!canReachGame()) return;
    const width = numberOr(WIDTH, 900);
    player.x = Math.max(V7.edgePad, Math.min(width - player.width - V7.edgePad, player.x));
    input.pointerX = Math.max(V7.edgePad, Math.min(width - V7.edgePad, input.pointerX));
  }

  function installRuntimePlayfieldPatch() {
    if (!canReachGame() || window.__SKY_FORCE_V7_RUNTIME_PATCHED__) return false;
    window.__SKY_FORCE_V7_RUNTIME_PATCHED__ = true;

    // Override global playT helper used by later/rebuilt wave scripts.
    if (typeof playT === 'function') {
      playT = fullPlayX;
    }

    if (typeof resetPlayerPosition === 'function') {
      const originalReset = resetPlayerPosition;
      resetPlayerPosition = function () {
        originalReset.apply(this, arguments);
        player.x = numberOr(WIDTH, 900) / 2 - player.width / 2;
        input.pointerX = player.x + player.width / 2;
        clampPlayerToFullWidth();
      };
    }

    if (typeof updatePlayerTrail === 'function') {
      const originalTrail = updatePlayerTrail;
      updatePlayerTrail = function () {
        clampPlayerToFullWidth();
        return originalTrail.apply(this, arguments);
      };
    }

    if (typeof spawnLine === 'function') {
      spawnLine = function (type, count, y, spacing, pattern = 'straight', overrides = {}) {
        const width = numberOr(WIDTH, 900);
        const usable = width - V7.edgePad * 2;
        const actualSpacing = Math.min(spacing, usable / Math.max(1, count));
        const total = (count - 1) * actualSpacing;
        const startX = width / 2 - total / 2;
        for (let i = 0; i < count; i += 1) {
          const x = Math.max(V7.edgePad, Math.min(width - V7.edgePad - 80, startX + i * actualSpacing));
          spawnEnemy(type, x, y - rand(0, 120), pattern, { ...overrides });
        }
      };
    }

    if (typeof spawnStaggeredScouts === 'function') {
      spawnStaggeredScouts = function (y) {
        const positions = [0.08, 0.26, 0.44, 0.62, 0.80];
        positions.forEach((t, i) => {
          spawnEnemy('scout', fullPlayX(t), y - (i % 2) * 46, 'straight', { vy: i % 2 ? 3.15 : 3.65 });
        });
      };
    }

    if (typeof spawnV === 'function') {
      spawnV = function (type, count, y, pattern = 'sine') {
        const mid = Math.floor(count / 2);
        const spread = Math.min(86, (numberOr(WIDTH, 900) - V7.edgePad * 2) / Math.max(2, count));
        for (let i = 0; i < count; i += 1) {
          const offset = i - mid;
          spawnEnemy(type, numberOr(WIDTH, 900) / 2 + offset * spread, y - Math.abs(offset) * 54, pattern, {
            waveAmp: 18 + Math.abs(offset) * 8,
            phase: Math.abs(offset) * 0.5
          });
        }
      };
    }

    if (typeof spawnFormation === 'function') {
      spawnFormation = function (count, y) {
        const width = numberOr(WIDTH, 900);
        const spacing = Math.min(92, (width - V7.edgePad * 2) / Math.max(2, count));
        const total = (count - 1) * spacing;
        const startX = width / 2 - total / 2;
        for (let i = 0; i < count; i += 1) {
          spawnEnemy('formation', startX + i * spacing, y - Math.abs(i - Math.floor(count / 2)) * 25, 'formation', {
            waveAmp: 26,
            waveSpeed: 0.065,
            phase: i * 1.24
          });
        }
      };
    }

    if (typeof spawnGunshipPair === 'function') {
      spawnGunshipPair = function (y) {
        spawnEnemy('gunship', fullPlayX(0.16), y, 'gunship', { stopY: 180, stopUntil: 2200 });
        spawnEnemy('gunship', fullPlayX(0.68), y - 25, 'gunship', { stopY: 210, stopUntil: 2200 });
      };
    }

    if (typeof spawnHeavyRun === 'function') {
      spawnHeavyRun = function (y) {
        spawnEnemy('heavyBomber', fullPlayX(0.14), y, 'heavy', { stopY: 140, stopUntil: 2500, waveAmp: 20 });
        spawnEnemy('heavyBomber', fullPlayX(0.62), y - 50, 'heavy', { stopY: 165, stopUntil: 2500, waveAmp: 18 });
      };
    }

    if (typeof spawnCarrierWave === 'function') {
      spawnCarrierWave = function (y) {
        spawnEnemy('carrier', fullPlayX(0.5) - 85, y, 'carrier', { stopY: 110, stopUntil: 3400, vx: 1.2 });
      };
    }

    if (typeof spawnBoss === 'function') {
      spawnBoss = function () {
        spawnEnemy('boss', numberOr(WIDTH, 900) / 2 - 136, -260, 'boss', {
          lockY: 124,
          waveAmp: 190,
          waveSpeed: 0.028,
          shotTimer: 380
        });
        state.bossActive = true;
        showBanner('WARNING - BOSS APPROACH', 2200);
        tone(130, 0.28, 'sawtooth', 0.03);
      };
    }

    if (typeof spawnDive === 'function') {
      spawnDive = function (type, side = 'left', count = 4) {
        const width = numberOr(WIDTH, 900);
        const fromLeft = side === 'left';
        for (let i = 0; i < count; i += 1) {
          const x = fromLeft ? V7.edgePad + i * 34 : width - V7.edgePad - 74 - i * 34;
          const vx = fromLeft ? rand(1.2, 2.1) : -rand(1.2, 2.1);
          spawnEnemy(type, x, 100 + i * 62, 'dive', {
            vx,
            vy: rand(2.4, 3.0),
            diveDelayMs: rand(220, 940)
          });
        }
      };
    }

    // Keep existing enemies/bullets from living outside the canvas boundary after any spawn.
    const boundaryTimer = setInterval(() => {
      try {
        clampPlayerToFullWidth();
        if (typeof enemies !== 'undefined') {
          const width = numberOr(WIDTH, 900);
          for (const enemy of enemies) {
            if (!enemy) continue;
            enemy.x = Math.max(-enemy.width * 0.25, Math.min(width - enemy.width * 0.75, enemy.x));
          }
        }
      } catch (err) {
        clearInterval(boundaryTimer);
      }
    }, 120);

    console.info('[Sky Force 1946] v7 full-width playfield patch installed');
    return true;
  }

  function boot() {
    installFullBleedCss();
    const timer = setInterval(() => {
      installFullBleedCss();
      if (installRuntimePlayfieldPatch()) clearInterval(timer);
    }, 100);
    setTimeout(() => clearInterval(timer), 12000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
