/* Sky Force 1946 mobile v6: force playable map to screen edges and sync music with game pause/resume. */
(function () {
  'use strict';

  const V6 = {
    label: 'mobile-screen-audio-sync-v6',
    // The original canvas has internal side gutters because the playfield starts at x=186.
    // This visual scale crops the gutters so the scrolling map reaches the phone edges.
    portraitCanvasScale: 1.56,
    landscapeCanvasScale: 1.16
  };

  window.__SKY_FORCE_MOBILE_V6__ = V6;

  let musicWasPlayingBeforePause = false;

  function installScreenFix() {
    if (document.getElementById('v6ScreenFixStyle')) return;
    const style = document.createElement('style');
    style.id = 'v6ScreenFixStyle';
    style.textContent = `
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: 100vw !important;
        min-width: 100vw !important;
        max-width: 100vw !important;
        overflow-x: hidden !important;
        background: #020915 !important;
        touch-action: none;
      }
      .app {
        width: 100vw !important;
        min-width: 100vw !important;
        max-width: 100vw !important;
        margin: 0 !important;
        padding: 0 !important;
        gap: 0 !important;
        overflow: hidden !important;
      }
      .stage {
        width: 100vw !important;
        min-width: 100vw !important;
        max-width: 100vw !important;
        height: calc(100vh - 94px) !important;
        height: calc(100dvh - 94px) !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        overflow: hidden !important;
        background: #020915 !important;
      }
      canvas#game {
        width: calc(100vw * ${V6.portraitCanvasScale}) !important;
        max-width: none !important;
        height: calc((100vw * ${V6.portraitCanvasScale}) * 1.3333333333) !important;
        min-height: calc(100vh - 94px) !important;
        min-height: calc(100dvh - 94px) !important;
        margin-left: calc((100vw - (100vw * ${V6.portraitCanvasScale})) / 2) !important;
        margin-right: 0 !important;
        display: block !important;
        object-fit: cover !important;
        transform: none !important;
        transform-origin: center center !important;
      }
      .overlay {
        width: 100vw !important;
        left: 0 !important;
        right: 0 !important;
      }
      .hud { display: none !important; }
      .controls {
        width: 100vw !important;
        margin: 0 !important;
        padding: 3px 6px 96px !important;
        justify-content: center !important;
        background: rgba(2,9,21,.92) !important;
      }
      #mobileFeatureDeck { bottom: 52px !important; }
      #v5MusicDock { bottom: 0 !important; }
      @media (orientation: landscape) {
        .stage {
          height: calc(100vh - 72px) !important;
          height: calc(100dvh - 72px) !important;
        }
        canvas#game {
          width: calc(100vw * ${V6.landscapeCanvasScale}) !important;
          height: calc((100vw * ${V6.landscapeCanvasScale}) * 1.3333333333) !important;
          margin-left: calc((100vw - (100vw * ${V6.landscapeCanvasScale})) / 2) !important;
        }
        .controls { padding-bottom: 78px !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function currentAudioElement() {
    const candidates = Array.from(document.querySelectorAll('audio'));
    if (candidates.length) return candidates[candidates.length - 1];
    // popular-music-rotation-v4 and v5 keep audio private, so create a bridge using their buttons when needed.
    return null;
  }

  function musicToggleButton() {
    return document.getElementById('v5MusicToggle') || document.getElementById('popularMusicPlayPause');
  }

  function musicLooksEnabled() {
    const btn = musicToggleButton();
    if (!btn) return false;
    const text = (btn.textContent || '').toUpperCase();
    return text.includes('ON') || text.includes('PAUSE');
  }

  function pauseMusicForGamePause() {
    musicWasPlayingBeforePause = musicLooksEnabled();
    const audio = currentAudioElement();
    if (audio && !audio.paused) {
      audio.pause();
      return;
    }
    const btn = musicToggleButton();
    if (btn && musicWasPlayingBeforePause) {
      const text = (btn.textContent || '').toUpperCase();
      if (text.includes('ON') || text.includes('PAUSE')) btn.click();
    }
  }

  function resumeMusicAfterGameResume() {
    if (!musicWasPlayingBeforePause) return;
    const audio = currentAudioElement();
    if (audio) {
      audio.play().catch(() => {
        const btn = musicToggleButton();
        if (btn && !musicLooksEnabled()) btn.click();
      });
      return;
    }
    const btn = musicToggleButton();
    if (btn && !musicLooksEnabled()) btn.click();
  }

  function installPauseSync() {
    if (window.__SKY_FORCE_V6_AUDIO_SYNC_INSTALLED__) return;
    if (typeof togglePause !== 'function' || typeof showOverlay !== 'function' || typeof hideOverlay !== 'function') return;
    window.__SKY_FORCE_V6_AUDIO_SYNC_INSTALLED__ = true;

    const originalTogglePause = togglePause;
    togglePause = function () {
      const wasRunning = typeof state !== 'undefined' && state.mode === 'running';
      const wasPaused = typeof state !== 'undefined' && state.mode === 'paused';
      const result = originalTogglePause.apply(this, arguments);
      if (wasRunning) {
        pauseMusicForGamePause();
      } else if (wasPaused) {
        setTimeout(resumeMusicAfterGameResume, 120);
      }
      return result;
    };

    if (typeof gameOver === 'function' && !gameOver.__v6Wrapped) {
      const originalGameOver = gameOver;
      gameOver = function () {
        pauseMusicForGamePause();
        return originalGameOver.apply(this, arguments);
      };
      gameOver.__v6Wrapped = true;
    }

    if (typeof stageClear === 'function' && !stageClear.__v6Wrapped) {
      const originalStageClear = stageClear;
      stageClear = function () {
        pauseMusicForGamePause();
        return originalStageClear.apply(this, arguments);
      };
      stageClear.__v6Wrapped = true;
    }

    if (typeof startRun === 'function' && !startRun.__v6Wrapped) {
      const originalStartRun = startRun;
      startRun = function () {
        const result = originalStartRun.apply(this, arguments);
        setTimeout(resumeMusicAfterGameResume, 250);
        return result;
      };
      startRun.__v6Wrapped = true;
    }
  }

  function boot() {
    installScreenFix();
    const timer = setInterval(() => {
      installScreenFix();
      installPauseSync();
    }, 200);
    setTimeout(() => clearInterval(timer), 10000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
