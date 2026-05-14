/* Sky Force 1946 mobile v12: persistent music resume sync.
   Fixes overlay Resume not restarting music by watching game state for the entire session.
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

  let audio = null;
  let trackIndex = 0;
  let musicEnabled = true;
  let desiredVolume = 0.52;
  let lastMode = null;
  let wasPausedByGame = false;
  let lastUserGestureAt = 0;

  window.__SKY_FORCE_V12_RESUME_SYNC__ = { TRACKS };

  function currentTrack() {
    return TRACKS[trackIndex % TRACKS.length];
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

  function getMode() {
    try {
      return typeof state !== 'undefined' ? state.mode : null;
    } catch {
      return null;
    }
  }

  function updateUi() {
    const track = currentTrack();
    const title = document.getElementById('v10MusicTitle');
    const toggle = document.getElementById('v10MusicToggle');
    const volume = document.getElementById('v10MusicVolume');
    if (title) title.textContent = `${track.title} • ${track.artist}`;
    if (toggle) toggle.textContent = musicEnabled ? 'MUSIC ON' : 'MUSIC OFF';
    if (volume) volume.value = String(Math.round(desiredVolume * 100));
  }

  async function playMusic(reason) {
    if (!musicEnabled) return;
    const player = ensureAudio();
    const track = currentTrack();
    if (player.src !== track.src) player.src = track.src;
    player.volume = desiredVolume;
    updateUi();
    try {
      await player.play();
      document.documentElement.dataset.musicState = `playing-${reason || 'sync'}`;
    } catch (err) {
      document.documentElement.dataset.musicState = `blocked-${reason || 'sync'}`;
      console.info('[Sky Force 1946] Music play blocked or failed', reason, err);
    }
  }

  function pauseMusic(reason) {
    if (audio && !audio.paused) audio.pause();
    document.documentElement.dataset.musicState = `paused-${reason || 'sync'}`;
  }

  function nextTrack() {
    trackIndex = (trackIndex + 1) % TRACKS.length;
    if (audio) audio.src = currentTrack().src;
    updateUi();
    if (musicEnabled && getMode() === 'running') playMusic('next-track');
  }

  function toggleMusic() {
    musicEnabled = !musicEnabled;
    if (!musicEnabled) pauseMusic('user-off');
    else if (getMode() === 'running') playMusic('user-on');
    updateUi();
  }

  function markGesture() {
    lastUserGestureAt = performance.now();
  }

  function syncMode(reason) {
    const mode = getMode();
    if (!mode) return;

    if (mode !== lastMode) {
      const previous = lastMode;
      lastMode = mode;

      if (mode === 'paused') {
        wasPausedByGame = true;
        pauseMusic('game-paused');
        return;
      }

      if (mode === 'running') {
        if (previous === 'paused' || wasPausedByGame || reason === 'resume-button') {
          wasPausedByGame = false;
          playMusic(reason || 'resume-to-running');
          setTimeout(() => playMusic('resume-confirm-250'), 250);
          setTimeout(() => playMusic('resume-confirm-800'), 800);
        } else if (!audio || audio.paused) {
          playMusic(reason || 'running-start');
        }
        return;
      }

      if (mode === 'gameOver' || mode === 'stageClear' || mode === 'loading') {
        wasPausedByGame = false;
        pauseMusic(mode);
      }
    } else if (mode === 'running' && musicEnabled && audio && audio.paused && performance.now() - lastUserGestureAt < 2200) {
      playMusic(reason || 'running-gesture-retry');
    }
  }

  function bindButton(id, handler) {
    const el = document.getElementById(id);
    if (!el || el.dataset.v12Bound) return;
    el.dataset.v12Bound = 'true';
    el.addEventListener('pointerdown', markGesture, true);
    el.addEventListener('touchstart', markGesture, true);
    el.addEventListener('click', handler, true);
  }

  function bindControls() {
    bindButton('startButton', () => {
      markGesture();
      const label = (document.getElementById('startButton')?.textContent || '').toLowerCase();
      setTimeout(() => syncMode(label.includes('resume') ? 'resume-button' : 'start-button'), 30);
      setTimeout(() => syncMode(label.includes('resume') ? 'resume-button-180' : 'start-button-180'), 180);
      setTimeout(() => syncMode(label.includes('resume') ? 'resume-button-700' : 'start-button-700'), 700);
    });

    bindButton('pauseButton', () => {
      markGesture();
      setTimeout(() => syncMode('bottom-pause-resume-30'), 30);
      setTimeout(() => syncMode('bottom-pause-resume-180'), 180);
      setTimeout(() => syncMode('bottom-pause-resume-700'), 700);
    });

    bindButton('v10MusicToggle', (event) => {
      event.stopImmediatePropagation();
      markGesture();
      toggleMusic();
    });

    bindButton('v10MusicNext', (event) => {
      event.stopImmediatePropagation();
      markGesture();
      nextTrack();
    });

    const volume = document.getElementById('v10MusicVolume');
    if (volume && !volume.dataset.v12Bound) {
      volume.dataset.v12Bound = 'true';
      volume.addEventListener('input', () => {
        desiredVolume = Number(volume.value) / 100;
        if (audio) audio.volume = desiredVolume;
      }, true);
    }
  }

  function wrapGameFunctions() {
    if (typeof togglePause === 'function' && !togglePause.__v12Wrapped) {
      const originalTogglePause = togglePause;
      togglePause = function () {
        const modeBefore = getMode();
        const result = originalTogglePause.apply(this, arguments);
        setTimeout(() => syncMode(modeBefore === 'paused' ? 'wrapped-resume' : 'wrapped-pause'), 40);
        setTimeout(() => syncMode(modeBefore === 'paused' ? 'wrapped-resume-250' : 'wrapped-pause-250'), 250);
        return result;
      };
      togglePause.__v12Wrapped = true;
    }

    if (typeof startRun === 'function' && !startRun.__v12Wrapped) {
      const originalStartRun = startRun;
      startRun = function () {
        const result = originalStartRun.apply(this, arguments);
        setTimeout(() => syncMode('wrapped-start-run'), 60);
        return result;
      };
      startRun.__v12Wrapped = true;
    }

    if (typeof startStage === 'function' && !startStage.__v12Wrapped) {
      const originalStartStage = startStage;
      startStage = function () {
        const result = originalStartStage.apply(this, arguments);
        setTimeout(() => syncMode('wrapped-start-stage'), 60);
        return result;
      };
      startStage.__v12Wrapped = true;
    }
  }

  function boot() {
    document.addEventListener('pointerdown', markGesture, true);
    document.addEventListener('touchstart', markGesture, true);

    setInterval(() => {
      bindControls();
      wrapGameFunctions();
      syncMode('persistent-watch');
      updateUi();
    }, 250);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
