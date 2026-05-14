/* Sky Force 1946 mobile v8 real fullscreen loader.
   This is intentionally loaded INSTEAD of game.js. It fetches game.js, rewrites the hard-coded
   side-gutter playfield constants before execution, then installs mobile controls/music.
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

  const V8 = {
    bottomReservePx: 102,
    bulletScale: 1.65,
    noFireMs: 5200,
    earlyCap: 10,
    midCap: 22,
    lateCap: 42
  };

  let trackIndex = 0;
  let audio = null;
  let musicOn = true;
  let desiredVolume = 0.52;
  let musicWasOnBeforePause = false;

  window.__SKY_FORCE_V8__ = { TRACKS, V8 };

  function css() {
    if (document.getElementById('v8TrueFullscreenStyle')) return;
    const style = document.createElement('style');
    style.id = 'v8TrueFullscreenStyle';
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
        inset: 0 0 ${V8.bottomReservePx}px 0 !important;
        width: 100vw !important;
        height: calc(100dvh - ${V8.bottomReservePx}px) !important;
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
        background: #020915 !important;
      }
      .overlay {
        position: fixed !important;
        inset: 0 0 ${V8.bottomReservePx}px 0 !important;
        background: rgba(1, 8, 18, .28) !important;
        width: 100vw !important;
        height: calc(100dvh - ${V8.bottomReservePx}px) !important;
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
        letter-spacing: .02em !important;
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
        bottom: 49px !important;
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
      #v8WeaponDock {
        position: fixed;
        left: 7px;
        right: 7px;
        bottom: 50px;
        z-index: 10040;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
        pointer-events: auto;
      }
      #v8WeaponDock button, #v8MusicDock button {
        min-height: 36px;
        border-radius: 12px;
        border: 1px solid rgba(185,235,255,.72);
        color: white;
        background: linear-gradient(180deg, rgba(17,92,141,.9), rgba(4,28,58,.96));
        font: 800 11px/1 system-ui, sans-serif;
        box-shadow: 0 0 14px rgba(76,201,255,.28);
      }
      #v8MusicDock {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10045;
        display: grid;
        grid-template-columns: 86px 56px 1fr;
        gap: 6px;
        align-items: center;
        padding: 6px 8px max(6px, env(safe-area-inset-bottom));
        background: linear-gradient(180deg, rgba(1,12,26,.9), rgba(1,7,16,.97));
        border-top: 1px solid rgba(144,224,255,.68);
        color: white;
        font: 700 11px/1.1 system-ui, sans-serif;
      }
      #v8MusicStack { display: grid; gap: 2px; min-width: 0; }
      #v8MusicTitle { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      #v8MusicVolume { width: 100%; accent-color: #6de5ff; }
      #mobileFeatureDeck, #popularMusicRotationPanel, #curatedMusicSourcesPanel, #v5MusicDock { display: none !important; }
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

  function track() { return TRACKS[trackIndex % TRACKS.length]; }

  function updateMusicUi() {
    const t = track();
    const title = document.getElementById('v8MusicTitle');
    const toggle = document.getElementById('v8MusicToggle');
    const volume = document.getElementById('v8MusicVolume');
    if (title) title.textContent = `${t.title} • ${t.artist}`;
    if (toggle) toggle.textContent = musicOn ? 'MUSIC ON' : 'MUSIC OFF';
    if (volume) volume.value = String(Math.round(desiredVolume * 100));
  }

  async function playMusic() {
    if (!musicOn) return;
    const a = ensureAudio();
    const t = track();
    if (a.src !== t.src) a.src = t.src;
    a.volume = desiredVolume;
    updateMusicUi();
    try { await a.play(); } catch (err) { console.info('[Sky Force 1946] Music waits for first tap', err); }
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
    if (audio) audio.src = track().src;
    updateMusicUi();
    if (musicOn) playMusic();
  }

  function installDocks() {
    if (!document.getElementById('v8WeaponDock')) {
      const weaponDock = document.createElement('div');
      weaponDock.id = 'v8WeaponDock';
      weaponDock.innerHTML = '<button data-v8="missile">MISSILE</button><button data-v8="homing">HEAT SEEK</button><button data-v8="bomb">BOMB</button>';
      document.body.appendChild(weaponDock);
      weaponDock.addEventListener('click', (event) => {
        const action = event.target && event.target.dataset ? event.target.dataset.v8 : '';
        if (action === 'bomb' && typeof triggerBomb === 'function') triggerBomb();
        if ((action === 'missile' || action === 'homing') && typeof playerBullets !== 'undefined' && typeof player !== 'undefined') {
          const homing = action === 'homing';
          const cx = player.x + player.width / 2;
          const cy = player.y + player.height * 0.2;
          [-22, 22].forEach((offset) => {
            playerBullets.push({ x: cx + offset - 9, y: cy - 24, width: 18, height: 44, vx: offset < 0 ? -0.55 : 0.55, vy: -10.5, damage: homing ? 7 : 5, missile: true, homing, turnRate: homing ? 0.12 : 0, life: 180 });
          });
        }
      });
    }

    if (!document.getElementById('v8MusicDock')) {
      const musicDock = document.createElement('div');
      musicDock.id = 'v8MusicDock';
      musicDock.innerHTML = '<button id="v8MusicToggle">MUSIC ON</button><button id="v8MusicNext">NEXT</button><div id="v8MusicStack"><div id="v8MusicTitle"></div><input id="v8MusicVolume" type="range" min="0" max="100" value="52"></div>';
      document.body.appendChild(musicDock);
      document.getElementById('v8MusicToggle').addEventListener('click', toggleMusic);
      document.getElementById('v8MusicNext').addEventListener('click', nextTrack);
      document.getElementById('v8MusicVolume').addEventListener('input', (event) => {
        desiredVolume = Number(event.target.value) / 100;
        if (audio) audio.volume = desiredVolume;
      });
      updateMusicUi();
    }
  }

  function installRuntimeAfterGame() {
    installDocks();

    if (typeof togglePause === 'function' && !togglePause.__v8MusicSync) {
      const originalTogglePause = togglePause;
      togglePause = function () {
        const wasRunning = typeof state !== 'undefined' && state.mode === 'running';
        const wasPaused = typeof state !== 'undefined' && state.mode === 'paused';
        const result = originalTogglePause.apply(this, arguments);
        if (wasRunning) pauseMusic();
        if (wasPaused && musicOn) setTimeout(playMusic, 120);
        return result;
      };
      togglePause.__v8MusicSync = true;
    }

    if (typeof updatePlayerTrail === 'function' && !updatePlayerTrail.__v8Homing) {
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
      updatePlayerTrail.__v8Homing = true;
    }

    window.addEventListener('pointerdown', playMusic, { once: true, capture: true });
    window.addEventListener('touchstart', playMusic, { once: true, capture: true });
  }

  async function boot() {
    css();
    try {
      const response = await fetch('game.js', { cache: 'no-store' });
      let source = await response.text();
      source = patchGameSource(source);
      const script = document.createElement('script');
      script.textContent = source + '\n//# sourceURL=game.v8-fullscreen-patched.js';
      document.body.appendChild(script);
      setTimeout(installRuntimeAfterGame, 50);
    } catch (err) {
      console.error('[Sky Force 1946] v8 loader failed', err);
      const fallback = document.createElement('script');
      fallback.src = 'game.js';
      document.body.appendChild(fallback);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
