/* Sky Force 1946 popular royalty-free music rotation.
   Tracks are by Kevin MacLeod / Incompetech and require attribution under CC-BY unless separately licensed.
   This file rotates through three actual playable songs using browser Audio after a user tap. */
(function () {
  'use strict';

  const TRACKS = [
    {
      title: 'Monkeys Spinning Monkeys',
      artist: 'Kevin MacLeod',
      src: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Monkeys%20Spinning%20Monkeys.mp3',
      attribution: 'Monkeys Spinning Monkeys by Kevin MacLeod (incompetech.com), licensed under Creative Commons: By Attribution.'
    },
    {
      title: 'Sneaky Snitch',
      artist: 'Kevin MacLeod',
      src: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Sneaky%20Snitch.mp3',
      attribution: 'Sneaky Snitch by Kevin MacLeod (incompetech.com), licensed under Creative Commons: By Attribution.'
    },
    {
      title: 'Fluffing a Duck',
      artist: 'Kevin MacLeod',
      src: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Fluffing%20a%20Duck.mp3',
      attribution: 'Fluffing a Duck by Kevin MacLeod (incompetech.com), licensed under Creative Commons: By Attribution.'
    }
  ];

  window.__SKY_FORCE_POPULAR_MUSIC_ROTATION__ = TRACKS;

  let index = 0;
  let audio = null;
  let playing = false;
  let titleEl = null;
  let creditEl = null;
  let errorEl = null;

  function currentTrack() {
    return TRACKS[index % TRACKS.length];
  }

  function updateLabels() {
    const track = currentTrack();
    if (titleEl) titleEl.textContent = `${track.title} — ${track.artist}`;
    if (creditEl) creditEl.textContent = track.attribution;
  }

  function ensureAudio() {
    if (audio) return audio;
    audio = new Audio();
    audio.volume = 0.45;
    audio.preload = 'metadata';
    audio.addEventListener('ended', nextTrack);
    audio.addEventListener('error', () => {
      if (errorEl) {
        errorEl.textContent = 'Music failed to load from the remote source. Tap NEXT.';
        errorEl.style.display = 'block';
      }
    });
    return audio;
  }

  async function loadAndPlay() {
    const track = currentTrack();
    const player = ensureAudio();
    if (player.src !== track.src) player.src = track.src;
    updateLabels();
    if (errorEl) errorEl.style.display = 'none';
    try {
      await player.play();
      playing = true;
      const button = document.getElementById('popularMusicPlayPause');
      if (button) button.textContent = 'PAUSE MUSIC';
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = 'Tap PLAY again. Mobile browsers require user interaction before audio starts.';
        errorEl.style.display = 'block';
      }
      console.warn('[Sky Force 1946] Music playback blocked or failed', err);
    }
  }

  function nextTrack() {
    index = (index + 1) % TRACKS.length;
    if (playing) loadAndPlay();
    else updateLabels();
  }

  function togglePlay() {
    const player = ensureAudio();
    if (!playing || player.paused) {
      loadAndPlay();
      return;
    }
    player.pause();
    playing = false;
    const button = document.getElementById('popularMusicPlayPause');
    if (button) button.textContent = 'PLAY MUSIC';
  }

  function installPopularMusicPlayer() {
    if (document.getElementById('popularMusicRotationPanel')) return;

    const style = document.createElement('style');
    style.textContent = `
      #popularMusicRotationPanel {
        position: fixed;
        left: 8px;
        right: 8px;
        top: 8px;
        z-index: 10005;
        display: grid;
        gap: 6px;
        padding: 8px;
        border-radius: 14px;
        border: 1px solid rgba(130,225,255,.72);
        background: rgba(2, 10, 22, .94);
        color: #f7fcff;
        font: 12px/1.25 system-ui, sans-serif;
        box-shadow: 0 8px 26px rgba(0,0,0,.42);
      }
      #popularMusicRotationPanel .row { display: grid; grid-template-columns: 1fr auto auto; gap: 6px; align-items: center; }
      #popularMusicRotationPanel button {
        border: 1px solid rgba(185,235,255,.7);
        border-radius: 10px;
        padding: 7px 8px;
        color: white;
        background: linear-gradient(180deg, rgba(20,85,130,.9), rgba(5,26,52,.95));
        font: 800 11px/1 system-ui, sans-serif;
      }
      #popularMusicTitle { font-weight: 800; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      #popularMusicCredit { color: #bfeeff; font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      #popularMusicError { color: #ffd08a; font-size: 10px; display: none; }
    `;
    document.head.appendChild(style);

    const panel = document.createElement('div');
    panel.id = 'popularMusicRotationPanel';
    panel.innerHTML = `
      <div class="row">
        <div id="popularMusicTitle"></div>
        <button type="button" id="popularMusicPlayPause">PLAY MUSIC</button>
        <button type="button" id="popularMusicNext">NEXT</button>
      </div>
      <div id="popularMusicCredit"></div>
      <div id="popularMusicError"></div>
    `;
    document.body.appendChild(panel);

    titleEl = document.getElementById('popularMusicTitle');
    creditEl = document.getElementById('popularMusicCredit');
    errorEl = document.getElementById('popularMusicError');
    document.getElementById('popularMusicPlayPause').addEventListener('click', togglePlay);
    document.getElementById('popularMusicNext').addEventListener('click', nextTrack);
    updateLabels();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installPopularMusicPlayer);
  else installPopularMusicPlayer();
})();
