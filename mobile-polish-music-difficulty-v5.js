/* Sky Force 1946 mobile polish v5.
   Adds edge-to-edge mobile canvas, bottom music controls, autoplay attempt, larger enemy bullets,
   and progressive difficulty ramp. Uses royalty-free / Creative Commons attributed music sources. */
(function () {
  'use strict';

  const TRACKS = [
    { title: 'Monkeys Spinning Monkeys', artist: 'Kevin MacLeod', style: 'popular', src: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Monkeys%20Spinning%20Monkeys.mp3' },
    { title: 'Sneaky Snitch', artist: 'Kevin MacLeod', style: 'popular', src: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Sneaky%20Snitch.mp3' },
    { title: 'Fluffing a Duck', artist: 'Kevin MacLeod', style: 'popular', src: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Fluffing%20a%20Duck.mp3' },
    { title: 'Hustle Hard', artist: 'Kevin MacLeod', style: 'hiphop', src: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Hustle%20Hard.mp3' },
    { title: 'Almost Bliss', artist: 'Kevin MacLeod', style: 'hiphop', src: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Almost%20Bliss.mp3' },
    { title: 'Raving Energy', artist: 'Kevin MacLeod', style: 'hiphop', src: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Raving%20Energy.mp3' },
    { title: 'Beauty Flow', artist: 'Kevin MacLeod', style: 'lofi', src: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Beauty%20Flow.mp3' },
    { title: 'Sincerely', artist: 'Kevin MacLeod', style: 'lofi', src: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Sincerely.mp3' },
    { title: 'Past Sadness', artist: 'Kevin MacLeod', style: 'lofi', src: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Past%20Sadness.mp3' }
  ].map((track) => ({
    ...track,
    attribution: `${track.title} by Kevin MacLeod (incompetech.com). Licensed under Creative Commons: By Attribution.`
  }));

  const BALANCE = {
    bulletVisualScale: 1.75,
    difficultyStartMs: 18000,
    fullDifficultyMs: 118000,
    maxExtraSpawnScale: 1.55,
    bulletSpeedBase: 0.58,
    bulletSpeedRamp: 0.34,
    fireCapStart: 10,
    fireCapEnd: 48
  };

  let musicIndex = 0;
  let audio = null;
  let musicEnabled = true;
  let desiredVolume = 0.52;
  let installed = false;

  window.__SKY_FORCE_MOBILE_V5__ = { TRACKS, BALANCE };

  function difficultyRatio() {
    if (typeof state === 'undefined') return 0;
    if (state.elapsedMs < BALANCE.difficultyStartMs) return 0;
    return Math.max(0, Math.min(1, (state.elapsedMs - BALANCE.difficultyStartMs) / (BALANCE.fullDifficultyMs - BALANCE.difficultyStartMs)));
  }

  function currentTrack() {
    return TRACKS[musicIndex % TRACKS.length];
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

  async function playCurrentTrack() {
    if (!musicEnabled) return;
    const player = ensureAudio();
    const track = currentTrack();
    if (player.src !== track.src) player.src = track.src;
    player.volume = desiredVolume;
    updateMusicLabels();
    try {
      await player.play();
      musicEnabled = true;
      updateMusicLabels();
    } catch (err) {
      // Mobile Safari/Chrome may block audio until the user taps. First game tap or ON/OFF will retry.
      console.info('[Sky Force 1946] Audio autoplay blocked until user gesture', err);
    }
  }

  function nextTrack() {
    musicIndex = (musicIndex + 1) % TRACKS.length;
    if (audio) audio.src = currentTrack().src;
    updateMusicLabels();
    if (musicEnabled) playCurrentTrack();
  }

  function toggleMusic() {
    const player = ensureAudio();
    musicEnabled = !musicEnabled;
    if (musicEnabled) playCurrentTrack();
    else player.pause();
    updateMusicLabels();
  }

  function updateMusicLabels() {
    const track = currentTrack();
    const title = document.getElementById('v5MusicTitle');
    const toggle = document.getElementById('v5MusicToggle');
    const volume = document.getElementById('v5MusicVolume');
    if (title) title.textContent = `${track.title} • ${track.style}`;
    if (toggle) toggle.textContent = musicEnabled ? 'MUSIC ON' : 'MUSIC OFF';
    if (volume) volume.value = String(Math.round(desiredVolume * 100));
  }

  function installMobileLayout() {
    if (document.getElementById('v5MobilePolishStyle')) return;
    const style = document.createElement('style');
    style.id = 'v5MobilePolishStyle';
    style.textContent = `
      html, body { width: 100%; min-height: 100%; overflow-x: hidden; }
      body { margin: 0 !important; padding: 0 !important; background: #020915 !important; }
      .app { width: 100vw !important; max-width: none !important; margin: 0 !important; gap: 0 !important; }
      .stage { width: 100vw !important; max-width: none !important; border-left: 0 !important; border-right: 0 !important; border-radius: 0 !important; }
      canvas#game { width: 100vw !important; max-width: none !important; height: auto !important; display: block !important; }
      .controls { padding-bottom: 82px !important; }
      #popularMusicRotationPanel { display: none !important; }
      #licensedMusicPlayer { display: none !important; }
      #curatedMusicSourcesPanel { bottom: 96px !important; }
      #mobileFeatureDeck { bottom: 52px !important; width: min(96vw, 500px) !important; }
      #v5MusicDock {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10050;
        display: grid;
        grid-template-columns: 82px 54px 1fr;
        gap: 6px;
        align-items: center;
        padding: 6px 8px max(6px, env(safe-area-inset-bottom));
        border-top: 1px solid rgba(144,224,255,.68);
        background: linear-gradient(180deg, rgba(1,12,26,.88), rgba(1,7,16,.97));
        color: #f7fcff;
        font: 700 11px/1.1 system-ui, sans-serif;
        box-shadow: 0 -8px 24px rgba(0,0,0,.44);
      }
      #v5MusicDock button {
        min-height: 34px;
        border: 1px solid rgba(185,235,255,.74);
        border-radius: 10px;
        color: white;
        background: linear-gradient(180deg, rgba(17,92,141,.95), rgba(4,28,58,.96));
        font: 800 10px/1 system-ui, sans-serif;
      }
      #v5MusicStack { display: grid; gap: 2px; min-width: 0; }
      #v5MusicTitle { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: #ffffff; }
      #v5MusicVolume { width: 100%; accent-color: #6de5ff; }
      @media (orientation: landscape) {
        canvas#game { width: min(100vw, 72vh) !important; margin: 0 auto !important; }
        .stage { background: #020915 !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function installMusicDock() {
    if (document.getElementById('v5MusicDock')) return;
    const dock = document.createElement('div');
    dock.id = 'v5MusicDock';
    dock.innerHTML = `
      <button type="button" id="v5MusicToggle">MUSIC ON</button>
      <button type="button" id="v5MusicNext">NEXT</button>
      <div id="v5MusicStack">
        <div id="v5MusicTitle"></div>
        <input id="v5MusicVolume" type="range" min="0" max="100" value="52" aria-label="Music volume">
      </div>
    `;
    document.body.appendChild(dock);
    document.getElementById('v5MusicToggle').addEventListener('click', toggleMusic);
    document.getElementById('v5MusicNext').addEventListener('click', nextTrack);
    document.getElementById('v5MusicVolume').addEventListener('input', (event) => {
      desiredVolume = Number(event.target.value) / 100;
      if (audio) audio.volume = desiredVolume;
    });
    updateMusicLabels();
  }

  function canReachGame() {
    return typeof state !== 'undefined' && typeof enemyBullets !== 'undefined' && typeof enemies !== 'undefined';
  }

  function installGameplayOverrides() {
    if (!canReachGame() || installed) return false;
    installed = true;

    if (typeof spawnEnemyBullet === 'function' && !spawnEnemyBullet.__v5Wrapped) {
      const originalSpawnEnemyBullet = spawnEnemyBullet;
      spawnEnemyBullet = function (x, y, vx, vy, size = 1) {
        const t = difficultyRatio();
        const cap = Math.round(BALANCE.fireCapStart + (BALANCE.fireCapEnd - BALANCE.fireCapStart) * t);
        if (enemyBullets.length >= cap) return;
        const scale = BALANCE.bulletSpeedBase + BALANCE.bulletSpeedRamp * t;
        return originalSpawnEnemyBullet(x, y, vx * scale, vy * scale, Math.max(size * BALANCE.bulletVisualScale, 1.45));
      };
      spawnEnemyBullet.__v5Wrapped = true;
    }

    if (typeof spawnEnemy === 'function' && !spawnEnemy.__v5Wrapped) {
      const originalSpawnEnemy = spawnEnemy;
      spawnEnemy = function (type, x, y, pattern = 'straight', overrides = {}) {
        const t = difficultyRatio();
        const tuned = { ...overrides };
        if (t > 0.18) tuned.vy = (overrides.vy || 0) || undefined;
        const enemy = originalSpawnEnemy(type, x, y, pattern, tuned);
        if (enemy) {
          enemy.hp = Math.ceil(enemy.hp * (1 + t * 0.42));
          enemy.maxHp = Math.max(enemy.maxHp || enemy.hp, enemy.hp);
          enemy.vy *= (1 + t * 0.18);
          enemy.score = Math.round(enemy.score * (1 + t * 0.22));
          if (enemy.shotTimer) enemy.shotTimer *= Math.max(0.58, 1 - t * 0.32);
        }
        return enemy;
      };
      spawnEnemy.__v5Wrapped = true;
    }

    if (typeof buildStageScript === 'function' && !buildStageScript.__v5Wrapped) {
      const originalBuildStageScript = buildStageScript;
      buildStageScript = function (stage) {
        const script = originalBuildStageScript(stage).map((item) => ({ ...item }));
        let waveIndex = 0;
        for (const item of script) {
          if (item.kind === 'wave') {
            const stagePressure = Math.min(1, Math.max(0, stage - 1) * 0.12);
            item.at = item.at * Math.max(0.72, 1 - stagePressure) + waveIndex * 180;
            waveIndex += 1;
          }
          if (item.kind === 'boss') item.at = Math.max(42000, item.at * 0.86);
        }
        return script;
      };
      buildStageScript.__v5Wrapped = true;
    }

    document.documentElement.dataset.skyForceV5 = 'edge-map-larger-bullets-progressive-difficulty-bottom-music';
    return true;
  }

  function armAutoplayOnUserGesture() {
    const startOnGesture = () => {
      playCurrentTrack();
      window.removeEventListener('pointerdown', startOnGesture, true);
      window.removeEventListener('touchstart', startOnGesture, true);
      window.removeEventListener('keydown', startOnGesture, true);
    };
    window.addEventListener('pointerdown', startOnGesture, true);
    window.addEventListener('touchstart', startOnGesture, true);
    window.addEventListener('keydown', startOnGesture, true);
  }

  function boot() {
    installMobileLayout();
    installMusicDock();
    armAutoplayOnUserGesture();
    playCurrentTrack();
    const timer = setInterval(() => {
      if (installGameplayOverrides()) clearInterval(timer);
    }, 100);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
