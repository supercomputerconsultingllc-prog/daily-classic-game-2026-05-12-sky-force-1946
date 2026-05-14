/* Sky Force 1946 mobile v11: direct music/game sync.
   Fixes music not starting with Launch Mission by binding to the real game buttons.
   Also pauses/resumes audio when the game enters paused/running states. */
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

  let audio = null;
  let trackIndex = 0;
  let userDisabledMusic = false;
  let lastMode = '';
  let bound = false;

  window.__SKY_FORCE_V11_MUSIC_SYNC__ = { TRACKS };

  function getTrack() {
    return TRACKS[trackIndex % TRACKS.length];
  }

  function ensureAudio() {
    if (audio) return audio;
    audio = new Audio();
    audio.preload = 'auto';
    audio.volume = 0.52;
    audio.addEventListener('ended', nextTrack);
    audio.addEventListener('error', nextTrack);
    return audio;
  }

  function updateLegacyLabels() {
    const track = getTrack();
    const title = document.getElementById('v10MusicTitle');
    const toggle = document.getElementById('v10MusicToggle');
    const volume = document.getElementById('v10MusicVolume');
    if (title) title.textContent = `${track.title} • ${track.artist}`;
    if (toggle) toggle.textContent = userDisabledMusic ? 'MUSIC OFF' : 'MUSIC ON';
    if (volume && audio) volume.value = String(Math.round(audio.volume * 100));
  }

  async function playMusicFromGameGesture() {
    if (userDisabledMusic) return;
    const player = ensureAudio();
    const track = getTrack();
    if (player.src !== track.src) player.src = track.src;
    updateLegacyLabels();
    try {
      await player.play();
      document.documentElement.dataset.musicState = 'playing';
    } catch (err) {
      document.documentElement.dataset.musicState = 'blocked-until-next-tap';
      console.info('[Sky Force 1946] Music needs a user gesture or remote track was blocked', err);
    }
  }

  function pauseMusicForGame() {
    if (audio && !audio.paused) audio.pause();
    document.documentElement.dataset.musicState = 'paused-with-game';
  }

  function nextTrack() {
    trackIndex = (trackIndex + 1) % TRACKS.length;
    if (audio) audio.src = getTrack().src;
    updateLegacyLabels();
    if (!userDisabledMusic && typeof state !== 'undefined' && state.mode === 'running') {
      playMusicFromGameGesture();
    }
  }

  function toggleUserMusic() {
    userDisabledMusic = !userDisabledMusic;
    if (userDisabledMusic) pauseMusicForGame();
    else playMusicFromGameGesture();
    updateLegacyLabels();
  }

  function bindButtons() {
    const start = document.getElementById('startButton');
    const pause = document.getElementById('pauseButton');
    const legacyToggle = document.getElementById('v10MusicToggle');
    const legacyNext = document.getElementById('v10MusicNext');
    const legacyVolume = document.getElementById('v10MusicVolume');

    if (start && !start.dataset.v11MusicBound) {
      start.dataset.v11MusicBound = 'true';
      start.addEventListener('pointerdown', playMusicFromGameGesture, true);
      start.addEventListener('touchstart', playMusicFromGameGesture, true);
      start.addEventListener('click', () => setTimeout(playMusicFromGameGesture, 50), true);
    }

    if (pause && !pause.dataset.v11MusicBound) {
      pause.dataset.v11MusicBound = 'true';
      pause.addEventListener('click', () => {
        setTimeout(syncToGameMode, 40);
        setTimeout(syncToGameMode, 160);
      }, true);
    }

    if (legacyToggle && !legacyToggle.dataset.v11MusicBound) {
      legacyToggle.dataset.v11MusicBound = 'true';
      legacyToggle.addEventListener('click', (event) => {
        event.stopImmediatePropagation();
        toggleUserMusic();
      }, true);
    }

    if (legacyNext && !legacyNext.dataset.v11MusicBound) {
      legacyNext.dataset.v11MusicBound = 'true';
      legacyNext.addEventListener('click', (event) => {
        event.stopImmediatePropagation();
        nextTrack();
      }, true);
    }

    if (legacyVolume && !legacyVolume.dataset.v11MusicBound) {
      legacyVolume.dataset.v11MusicBound = 'true';
      legacyVolume.addEventListener('input', () => {
        const player = ensureAudio();
        player.volume = Number(legacyVolume.value) / 100;
      }, true);
    }
  }

  function wrapGameFunctions() {
    if (typeof startRun === 'function' && !startRun.__v11MusicWrapped) {
      const originalStartRun = startRun;
      startRun = function () {
        playMusicFromGameGesture();
        const result = originalStartRun.apply(this, arguments);
        setTimeout(playMusicFromGameGesture, 80);
        return result;
      };
      startRun.__v11MusicWrapped = true;
    }

    if (typeof startStage === 'function' && !startStage.__v11MusicWrapped) {
      const originalStartStage = startStage;
      startStage = function () {
        const result = originalStartStage.apply(this, arguments);
        setTimeout(playMusicFromGameGesture, 80);
        return result;
      };
      startStage.__v11MusicWrapped = true;
    }

    if (typeof togglePause === 'function' && !togglePause.__v11MusicWrapped) {
      const originalTogglePause = togglePause;
      togglePause = function () {
        const wasRunning = typeof state !== 'undefined' && state.mode === 'running';
        const result = originalTogglePause.apply(this, arguments);
        if (wasRunning) pauseMusicForGame();
        else setTimeout(playMusicFromGameGesture, 80);
        return result;
      };
      togglePause.__v11MusicWrapped = true;
    }

    if (typeof gameOver === 'function' && !gameOver.__v11MusicWrapped) {
      const originalGameOver = gameOver;
      gameOver = function () {
        pauseMusicForGame();
        return originalGameOver.apply(this, arguments);
      };
      gameOver.__v11MusicWrapped = true;
    }

    if (typeof stageClear === 'function' && !stageClear.__v11MusicWrapped) {
      const originalStageClear = stageClear;
      stageClear = function () {
        pauseMusicForGame();
        return originalStageClear.apply(this, arguments);
      };
      stageClear.__v11MusicWrapped = true;
    }
  }

  function syncToGameMode() {
    if (typeof state === 'undefined') return;
    const mode = state.mode;
    if (mode === lastMode) return;
    lastMode = mode;
    if (mode === 'running') playMusicFromGameGesture();
    else if (mode === 'paused' || mode === 'gameOver' || mode === 'stageClear') pauseMusicForGame();
  }

  function boot() {
    if (!bound) {
      bound = true;
      document.addEventListener('pointerdown', () => {
        if (typeof state !== 'undefined' && state.mode === 'running') playMusicFromGameGesture();
      }, true);
      document.addEventListener('touchstart', () => {
        if (typeof state !== 'undefined' && state.mode === 'running') playMusicFromGameGesture();
      }, true);
    }

    const timer = setInterval(() => {
      bindButtons();
      wrapGameFunctions();
      syncToGameMode();
      updateLegacyLabels();
    }, 150);

    setTimeout(() => clearInterval(timer), 20000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
