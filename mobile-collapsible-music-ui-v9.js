/* Sky Force 1946 mobile v9: collapsible music controls.
   Keeps pause and weapon buttons usable by replacing the always-visible music bar
   with a small MUSIC button. Full music controls only appear after tapping MUSIC. */
(function () {
  'use strict';

  function installStyle() {
    if (document.getElementById('v9CollapsibleMusicStyle')) return;
    const style = document.createElement('style');
    style.id = 'v9CollapsibleMusicStyle';
    style.textContent = `
      .stage {
        inset: 0 0 86px 0 !important;
        height: calc(100dvh - 86px) !important;
      }
      .overlay {
        inset: 0 0 86px 0 !important;
        height: calc(100dvh - 86px) !important;
      }
      .controls {
        bottom: 48px !important;
        z-index: 10035 !important;
      }
      #v8WeaponDock {
        left: 7px !important;
        right: 92px !important;
        bottom: 7px !important;
        z-index: 10046 !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      }
      #v8WeaponDock button {
        min-height: 38px !important;
        font-size: 10px !important;
      }
      #v9MusicButton {
        position: fixed;
        right: 7px;
        bottom: 7px;
        z-index: 10060;
        width: 78px;
        min-height: 38px;
        border-radius: 12px;
        border: 1px solid rgba(185,235,255,.78);
        color: #fff;
        background: linear-gradient(180deg, rgba(17,92,141,.95), rgba(4,28,58,.98));
        font: 900 10px/1 system-ui, sans-serif;
        box-shadow: 0 0 14px rgba(76,201,255,.32);
      }
      #v8MusicDock {
        position: fixed !important;
        left: 7px !important;
        right: 7px !important;
        bottom: 52px !important;
        z-index: 10059 !important;
        display: none !important;
        grid-template-columns: 86px 56px 1fr !important;
        gap: 6px !important;
        align-items: center !important;
        padding: 8px !important;
        border: 1px solid rgba(144,224,255,.74) !important;
        border-radius: 14px !important;
        background: rgba(1, 8, 18, .96) !important;
        color: white !important;
        box-shadow: 0 -8px 26px rgba(0,0,0,.5) !important;
      }
      #v8MusicDock.v9-open {
        display: grid !important;
      }
      #v8MusicDock button {
        min-height: 36px !important;
      }
      #v8MusicStack {
        min-width: 0 !important;
      }
      #v8MusicTitle {
        font-size: 11px !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }
      #v8MusicVolume {
        width: 100% !important;
      }
    `;
    document.head.appendChild(style);
  }

  function installButton() {
    if (document.getElementById('v9MusicButton')) return;
    const button = document.createElement('button');
    button.id = 'v9MusicButton';
    button.type = 'button';
    button.textContent = 'MUSIC';
    button.addEventListener('click', () => {
      const dock = document.getElementById('v8MusicDock');
      if (dock) dock.classList.toggle('v9-open');
    });
    document.body.appendChild(button);
  }

  function closeMusicWhenGameAction(event) {
    const target = event.target;
    if (!target || !target.closest) return;
    if (target.closest('#v8MusicDock') || target.closest('#v9MusicButton')) return;
    if (target.closest('#v8WeaponDock') || target.closest('.controls') || target.closest('#pauseButton')) {
      const dock = document.getElementById('v8MusicDock');
      if (dock) dock.classList.remove('v9-open');
    }
  }

  function boot() {
    installStyle();
    const timer = setInterval(() => {
      installStyle();
      installButton();
      const dock = document.getElementById('v8MusicDock');
      if (dock && !dock.dataset.v9Ready) {
        dock.dataset.v9Ready = 'true';
        dock.classList.remove('v9-open');
      }
    }, 120);
    setTimeout(() => clearInterval(timer), 12000);
    document.addEventListener('click', closeMusicWhenGameAction, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
