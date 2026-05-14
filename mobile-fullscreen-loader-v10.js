/* Sky Force 1946 mobile v10 real fullscreen loader with collapsed music controls.
   Loaded instead of game.js. It rewrites the hard-coded side-gutter playfield before execution.
   Music panel is hidden by default and only opens from the small MUSIC button.
*/
(function () {
  'use strict';

  const TRACKS = [
    { title: 'Monkeys Spinning Monkeys', artist: 'Kevin MacLeod', src: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Monkeys%20Spinning%20Monkeys.mp3' },
    { title: 'Sneaky Snitch', artist: 'Kevin MacLeod', src: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Sneaky%20Snitch.mp3' },
    { title: 'Fluffing a Duck', artist: 'Kevin MacLeod', src: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Fluffing%20a%20Duck.mp3' },
    { title: 'Hustle Hard', artist: 'Kevin MacLeod', src: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Hustle%20Hard.mp3' },
    { title: 'Almost Bliss', artist: 'Kevin MacLeod', src: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Almost%20Bliss.mp3' },
    { title: 'Raving Energy', artist: 'Kevin MacLeod', src: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Raving%20Energy.mp3' },
    { title: 'Beauty Flow', artist: 'Kevin MacLeod', src: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Beauty%20Flow.mp3' },
    { title: 'Sincerely', artist: 'Kevin MacLeod', src: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Sincerely.mp3' },
    { title: 'Past Sadness', artist: 'Kevin MacLeod', src: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Past%20Sadness.mp3' }
  ];

  const UI = {
    bottomReservePx: 92,
    weaponBottomPx: 7,
    musicPanelBottomPx: 52
  };

  let trackIndex = 0;
  let audio = null;
  let musicOn = true;
  let desiredVolume = 0.52;

  window.__SKY_FORCE_MOBILE_V10__ = { TRACKS, UI };

  function installCss() {
    if (document.getElementById('v10FullscreenStyle')) return;
    const style = document.createElement('style');
    style.id = 'v10FullscreenStyle';
    style.textContent = `
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        height: 100dvh !important;
        overflow: hidden !important;
        background: #020915 !important;
        touch-action: none !important;
        overscroll-behavior: none !important;
      }
      .app {
        position: fixed !important;
        inset: 0 !important;
        width: 100vw !important;
        height: 100dvh !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
        display: block !important;
        overflow: hidden !important;
        background: #020915 !important;
      }
      .stage {
        position: fixed !important;
        inset: 0 0 ${UI.bottomReservePx}px 0 !important;
        width: 100vw !important;
        height: calc(100dvh - ${UI.bottomReservePx}px) !important;
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
        inset: 0 !important;
        width: 100vw !important;
        height: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
        display: block !important;
        object-fit: fill !important;
      }
      .overlay {
        position: fixed !important;
        inset: 0 0 ${UI.bottomReservePx}px 0 !important;
        width: 100vw !important;
        height: calc(100dvh - ${UI.bottomReservePx}px) !important;
        background: rgba(1, 8, 18, .28) !important;
      }
      .hud {
        position: fixed !important;
        top: max(5px, env(safe-area-inset-top)) !important;
        left: 5px !important;
        right: 5px !important;
        z-index: 10020 !important;
        display: grid !important;
        grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        gap: 2px !important;
        background: transparent !important;
        pointer-events: none !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .chip {
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
        min-width: 0 !important;
        backdrop-filter: none !important;
        text-shadow: 0 2px 5px #000, 0 0 8px #000 !important;
      }
      .chip span {
        display: block !important;
        color: rgba(226, 244, 255, .9) !important;
        font-size: 8px !important;
        line-height: 1 !important;
      }
      .chip strong {
        display: block !important;
        color: white !important;
        font-size: 14px !important;
        line-height: 1.05 !important;
      }
      .controls {
        position: fixed !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 48px !important;
        z-index: 10030 !important;
        width: 100vw !important;
        margin: 0 !important;
        padding: 0 !important;
        max-height: 38px !important;
        overflow: hidden !important;
        display: flex !important;
        justify-content: center !important;
        background: transparent !important;
        box-shadow: none !important;
        pointer-events: auto !important;
      }
      .controls p { display: none !important; }
      .controls .ghost, .controls button {
        min-height: 32px !important;
        padding: 4px 12px !important;
        border-radius: 14px !important;
        color: #fff !important;
        background: rgba(5, 23, 43, .62) !important;
        border: 1px solid rgba(176,236,255,.45) !important;
      }
      #v10WeaponDock {
        position: fixed;
        left: 7px;
        right: 92px;
        bottom: ${UI.weaponBottomPx}px;
        z-index: 10046;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 6px;
        pointer-events: auto;
      }
      #v10WeaponDock button, #v10MusicButton, #v10MusicPanel button {
        min-height: 38px;
        border-radius: 12px;
        border: 1px solid rgba(185,235,255,.72);
        color: white;
        background: linear-gradient(180deg, rgba(17,92,141,.92), rgba(4,28,58,.98));
        font: 900 10px/1 system-ui, sans-serif;
        box-shadow: 0 0 14px rgba(76,201,255,.28);
      }
      #v10MusicButton {
        position: fixed;
        right: 7px;
        bottom: ${UI.weaponBottomPx}px;
        z-index: 10060;
        width: 78px;
        pointer-events: auto;
      }
      #v10MusicPanel {
        position: fixed;
        left: 7px;
        right: 7px;
        bottom: ${UI.musicPanelBottomPx}px;
        z-index: 10059;
        display: none;
        grid-template-columns: 86px 56px 1fr;
        gap: 6px;
        align-items: center;
        padding: 8px;
        border: 1px solid rgba(144,224,255,.74);
        border-radius: 14px;
        background: rgba(1, 8, 18, .96);
        color: white;
        box-shadow: 0 -8px 26px rgba(0,0,0,.5);
        pointer-events: auto;
      }
      #v10MusicPanel.open { display: grid; }
      #v10MusicStack { display: grid; gap: 2px; min-width: 0; }
      #v10MusicTitle { font: 800 11px/1.1 system-ui, sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      #v10MusicVolume { width: 100%; accent-color: #6de5ff; }
      #mobileFeatureDeck, #popularMusicRotationPanel, #curatedMusicSourcesPanel, #v5MusicDock, #v8MusicDock, #v9MusicButton, #v8WeaponDock { display: none !important; }
    `;
    document.head.appendChild(style);
  }

  function patchGameSource(source) {
    return source
      .replace('const PLAY_X = 186;', 'const PLAY_X = 0;')
      .replace('const PLAY_W = WIDTH - PLAY_X * 2;', 'const PLAY_W = WIDTH;')
      .replace('const PLAY_RIGHT = PLAY_X + PLAY_W;', 'const PLAY_RIGHT = WIDTH;')
      .replace('state.power = 1;', 'state.power = 2;')
      .replace('state.speedLevel = 1;', 'state.speedLevel = 2;')
      .replace('images.background.src = "assets/bg-cloud-warzone.png";', 'images.background.src = "assets/bg-cloud-warzone-seamless.png";')
      .replaceAll('width: 12,\n    height: 22,', 'width: 20,\n    height: 34,')
      .replaceAll('width: 12,\n      height: 22,', 'width: 20,\n      height: 34,')
      .replaceAll('const w = size >= 1.2 ? 13 : 10;', 'const w = size >= 1.2 ? 24 : 20;')
      .replaceAll('const h = size >= 1.2 ? 22 : 18;', 'const h = size >= 1.2 ? 38 : 32;');
  }

  function ensureAudio() {
    if (audio) return audio;
    audio = new Audio();
    audio.preload = 'auto';
    audio.volume = desiredVolume;
    audio.addEventListener('ended', nextTrack);
    audio.addEventListener('error', nextTrack);
    return audio;
  }

  function currentTrack() {
    return TRACKS[trackIndex % TRACKS.length];
  }

  function updateMusicUi() {
    const track = currentTrack();
    const title = document.getElementById('v10MusicTitle');
    const toggle = document.getElementById('v10MusicToggle');
    const volume = document.getElementById('v10MusicVolume');
    if (title) title.textContent = `${track.title} • ${track.artist}`;
    if (toggle) toggle.textContent = musicOn ? 'MUSIC ON' : 'MUSIC OFF';
    if (volume) volume.value = String(Math.round(desiredVolume * 100));
  }

  async function playMusic() {
    if (!musicOn) return;
    const player = ensureAudio();
    const track = currentTrack();
    if (player.src !== track.src) player.src = track.src;
    player.volume = desiredVolume;
    updateMusicUi();
    try {
      await player.play();
    } catch (err) {
      console.info('[Sky Force 1946] Music waits for user tap', err);
    }
  }

  function pauseMusic() {
    if (audio && !audio.paused) audio.pause();
  }

  function toggleMusic() {
    musicOn = !musicOn;
    if (musicOn) playMusic();
    else pauseMusic();
    updateMusicUi();
  }

  function nextTrack() {
    trackIndex = (trackIndex + 1) % TRACKS.length;
    if (audio) audio.src = currentTrack().src;
    updateMusicUi();
    if (musicOn) playMusic();
  }

  function installControls() {
    if (!document.getElementById('v10WeaponDock')) {
      const weaponDock = document.createElement('div');
      weaponDock.id = 'v10WeaponDock';
      weaponDock.innerHTML = '<button data-action="missile">MISSILE</button><button data-action="homing">HEAT SEEK</button><button data-action="bomb">BOMB</button>';
      document.body.appendChild(weaponDock);
      weaponDock.addEventListener('click', (event) => {
        const action = event.target && event.target.dataset ? event.target.dataset.action : '';
        if (action === 'bomb' && typeof triggerBomb === 'function') triggerBomb();
        if ((action === 'missile' || action === 'homing') && typeof playerBullets !== 'undefined' && typeof player !== 'undefined') {
          const homing = action === 'homing';
          const cx = player.x + player.width / 2;
          const cy = player.y + player.height * 0.2;
          [-22, 22].forEach((offset) => {
            playerBullets.push({ x: cx + offset - 9, y: cy - 24, width: 18, height: 44, vx: offset < 0 ? -0.55 : 0.55, vy: -10.5, damage: homing ? 7 : 5, missile: true, homing, turnRate: homing ? 0.12 : 0, life: 180 });
          });
        }
        const panel = document.getElementById('v10MusicPanel');
        if (panel) panel.classList.remove('open');
      });
    }

    if (!document.getElementById('v10MusicButton')) {
      const button = document.createElement('button');
      button.id = 'v10MusicButton';
      button.type = 'button';
      button.textContent = 'MUSIC';
      button.addEventListener('click', () => {
        const panel = document.getElementById('v10MusicPanel');
        if (panel) panel.classList.toggle('open');
      });
      document.body.appendChild(button);
    }

    if (!document.getElementById('v10MusicPanel')) {
      const panel = document.createElement('div');
      panel.id = 'v10MusicPanel';
      panel.innerHTML = '<button id="v10MusicToggle">MUSIC ON</button><button id="v10MusicNext">NEXT</button><div id="v10MusicStack"><div id="v10MusicTitle"></div><input id="v10MusicVolume" type="range" min="0" max="100" value="52"></div>';
      document.body.appendChild(panel);
      document.getElementById('v10MusicToggle').addEventListener('click', toggleMusic);
      document.getElementById('v10MusicNext').addEventListener('click', nextTrack);
      document.getElementById('v10MusicVolume').addEventListener('input', (event) => {
        desiredVolume = Number(event.target.value) / 100;
        if (audio) audio.volume = desiredVolume;
      });
      updateMusicUi();
    }
  }

  function installRuntimeHooks() {
    installControls();

    if (typeof togglePause === 'function' && !togglePause.__v10MusicSync) {
      const originalTogglePause = togglePause;
      togglePause = function () {
        const wasRunning = typeof state !== 'undefined' && state.mode === 'running';
        const wasPaused = typeof state !== 'undefined' && state.mode === 'paused';
        const result = originalTogglePause.apply(this, arguments);
        if (wasRunning) pauseMusic();
        if (wasPaused && musicOn) setTimeout(playMusic, 120);
        return result;
      };
      togglePause.__v10MusicSync = true;
    }

    if (typeof updatePlayerTrail === 'function' && !updatePlayerTrail.__v10Homing) {
      const originalTrail = updatePlayerTrail;
      updatePlayerTrail = function () {
        const result = originalTrail.apply(this, arguments);
        if (typeof playerBullets !== 'undefined' && typeof enemies !== 'undefined') {
          for (const bullet of playerBullets) {
            if (!bullet || !bullet.homing) continue;
            let best = null;
            let bestD = Infinity;
            const bx = bullet.x + bullet.width / 2;
            const by = bullet.y + bullet.height / 2;
            for (const enemy of enemies) {
              if (!enemy || enemy.dead) continue;
              const ex = enemy.x + enemy.width / 2;
              const ey = enemy.y + enemy.height / 2;
              const d = (ex - bx) ** 2 + (ey - by) ** 2;
              if (d < bestD) { bestD = d; best = enemy; }
            }
            if (best) {
              const tx = best.x + best.width / 2;
              const ty = best.y + best.height / 2;
              const dx = tx - bx;
              const dy = ty - by;
              const mag = Math.max(1, Math.hypot(dx, dy));
              bullet.vx += ((dx / mag) * 10.8 - bullet.vx) * bullet.turnRate;
              bullet.vy += ((dy / mag) * 10.8 - bullet.vy) * bullet.turnRate;
            }
          }
        }
        return result;
      };
      updatePlayerTrail.__v10Homing = true;
    }

    window.addEventListener('pointerdown', playMusic, { once: true, capture: true });
    window.addEventListener('touchstart', playMusic, { once: true, capture: true });
  }

  async function boot() {
    installCss();
    try {
      const response = await fetch('game.js', { cache: 'no-store' });
      let source = await response.text();
      source = patchGameSource(source);
      const script = document.createElement('script');
      script.textContent = source + '\n//# sourceURL=game.v10-fullscreen-patched.js';
      document.body.appendChild(script);
      setTimeout(installRuntimeHooks, 50);
    } catch (err) {
      console.error('[Sky Force 1946] v10 loader failed', err);
      const fallback = document.createElement('script');
      fallback.src = 'game.js';
      document.body.appendChild(fallback);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
