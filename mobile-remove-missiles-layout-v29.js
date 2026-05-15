(function(){
  'use strict';
  if(window.__SKY_FORCE_REMOVE_MISSILES_LAYOUT_V29__) return;
  window.__SKY_FORCE_REMOVE_MISSILES_LAYOUT_V29__ = true;
  document.documentElement.dataset.v29Layout = 'active-revised';

  function installLayoutCss(){
    var old = document.getElementById('v29LayoutFix');
    if(old) old.remove();
    var style=document.createElement('style');
    style.id='v29LayoutFix';
    style.textContent = `
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: 100vw !important;
        min-width: 100vw !important;
        max-width: 100vw !important;
        height: 100vh !important;
        height: 100dvh !important;
        overflow: hidden !important;
        background: #020915 !important;
      }
      body * { box-sizing: border-box !important; }
      body::before, body::after, .app::before, .app::after, .stage::before, .stage::after { display: none !important; content: none !important; }
      .app {
        position: fixed !important;
        inset: 0 !important;
        width: 100vw !important;
        min-width: 100vw !important;
        max-width: 100vw !important;
        height: 100dvh !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        background: transparent !important;
        border: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        outline: 0 !important;
      }
      .stage {
        position: fixed !important;
        inset: 0 !important;
        width: 100vw !important;
        min-width: 100vw !important;
        max-width: 100vw !important;
        height: 100dvh !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        border: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        outline: 0 !important;
        background: transparent !important;
        transform: none !important;
      }
      canvas#game {
        position: fixed !important;
        inset: 0 !important;
        width: 100vw !important;
        min-width: 100vw !important;
        max-width: 100vw !important;
        height: 100dvh !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        outline: 0 !important;
        display: block !important;
        object-fit: fill !important;
        background: #020915 !important;
      }
      .hud, .hud *, .chip, .chip * {
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
        outline: 0 !important;
        backdrop-filter: none !important;
      }
      .hud {
        position: fixed !important;
        top: calc(max(5px, env(safe-area-inset-top)) + 20px) !important;
        left: 6px !important;
        right: auto !important;
        width: auto !important;
        max-width: 40vw !important;
        display: block !important;
        z-index: 10610 !important;
        pointer-events: none !important;
        overflow: visible !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .hud .chip:not(.v27-keep) { display: none !important; width: 0 !important; height: 0 !important; overflow: hidden !important; opacity: 0 !important; }
      .hud .chip.v27-keep {
        display: block !important;
        width: auto !important;
        min-width: 0 !important;
        max-width: 40vw !important;
        padding: 0 !important;
        margin: 0 !important;
        text-shadow: 0 2px 5px #000, 0 0 8px #000 !important;
      }
      .hud .chip.v27-keep span { font-size: 8px !important; line-height: 1 !important; }
      .hud .chip.v27-keep strong { font-size: 14px !important; line-height: 1.05 !important; }
      .overlay {
        position: fixed !important;
        inset: 0 !important;
        width: 100vw !important;
        height: 100dvh !important;
        border: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        outline: 0 !important;
        background: rgba(1, 8, 18, .08) !important;
      }
      .overlay p, .controls p { display: none !important; }
      .controls {
        position: fixed !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 48px !important;
        width: 100vw !important;
        max-width: 100vw !important;
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
        outline: 0 !important;
        overflow: visible !important;
      }
      #v10WeaponDock {
        left: 7px !important;
        right: 92px !important;
        bottom: 7px !important;
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        max-width: none !important;
      }
      #v10WeaponDock button[data-action="missile"],
      #v10WeaponDock button[data-action="homing"],
      #v10WeaponDock button[data-action="bomb"] { display: block !important; }
      #v28PlanePanel, #v27PlanePanel {
        max-width: calc(100vw - 16px) !important;
        overflow: hidden !important;
      }
      #v28Health, #v27Health {
        left: 6px !important;
        right: 6px !important;
        width: auto !important;
        max-width: calc(100vw - 12px) !important;
      }
    `;
    document.head.appendChild(style);
  }

  function isAutoMiniPlaneShot(b){
    if(!b || typeof b !== 'object') return false;
    // Remove only the automatic enhancement projectiles that appeared like oversized small planes.
    if(b.v23 || b.v25 || b.v27) return true;
    if(/^heavy-|^spread-|^needle-|^balanced-|^wing-|^outer-|^center$|^pierce$/.test(String(b.kind || ''))) return true;
    return false;
  }

  function patchPlayerBulletsArray(){
    if(typeof playerBullets === 'undefined' || !Array.isArray(playerBullets)) return false;
    if(playerBullets.__v29NoAutoMiniPlanes) return true;

    var nativePush = playerBullets.push;
    playerBullets.push = function(){
      var kept = [];
      for(var i=0;i<arguments.length;i++){
        var b = arguments[i];
        if(isAutoMiniPlaneShot(b)) continue;
        if(b && typeof b === 'object'){
          // Keep manual MISSILE and HEAT SEEK button shots, but make sure they are sane sized.
          if((b.width || 0) > 20) b.width = 20;
          if((b.height || 0) > 48) b.height = 48;
          if((b.damage || 0) > 4.5) b.damage = 4.5;
        }
        kept.push(b);
      }
      if(!kept.length) return this.length;
      return nativePush.apply(this, kept);
    };
    playerBullets.__v29NoAutoMiniPlanes = true;
    return true;
  }

  function removeExistingAutoMiniPlaneShots(){
    if(typeof playerBullets === 'undefined' || !Array.isArray(playerBullets)) return;
    for(var i=playerBullets.length-1;i>=0;i--){
      var b=playerBullets[i];
      if(isAutoMiniPlaneShot(b)) playerBullets.splice(i,1);
    }
  }

  function normalizeCanvasSize(){
    var canvas = document.getElementById('game');
    if(!canvas) return;
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100dvh';
    canvas.style.left = '0';
    canvas.style.right = '0';
    canvas.style.top = '0';
    canvas.style.bottom = '0';
    canvas.style.border = '0';
    canvas.style.boxShadow = 'none';
    canvas.style.borderRadius = '0';
  }

  function neutralizeOldFieldEdges(){
    var selectors = ['.app','.stage','.hud','.chip','.controls','.overlay'];
    selectors.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){
        el.style.border = '0';
        el.style.boxShadow = 'none';
        el.style.outline = '0';
        if(sel === '.app' || sel === '.stage' || sel === '.hud' || sel === '.chip' || sel === '.controls') el.style.background = 'transparent';
      });
    });
  }

  function loop(){
    installLayoutCss();
    patchPlayerBulletsArray();
    removeExistingAutoMiniPlaneShots();
    normalizeCanvasSize();
    neutralizeOldFieldEdges();
    requestAnimationFrame(loop);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loop);
  else loop();
})();