(function(){
  'use strict';
  if(window.__SKY_FORCE_REMOVE_MISSILES_LAYOUT_V29__) return;
  window.__SKY_FORCE_REMOVE_MISSILES_LAYOUT_V29__ = true;
  document.documentElement.dataset.v29Layout = 'active';

  function installLayoutCss(){
    if(document.getElementById('v29LayoutFix')) return;
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
        background: #020915 !important;
        border: 0 !important;
        box-shadow: none !important;
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
        background: #020915 !important;
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
        display: block !important;
        object-fit: fill !important;
        background: #020915 !important;
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
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
        pointer-events: none !important;
        overflow: visible !important;
      }
      .hud .chip:not(.v27-keep) { display: none !important; }
      .hud .chip.v27-keep {
        display: block !important;
        width: auto !important;
        min-width: 0 !important;
        max-width: 40vw !important;
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
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
        box-shadow: none !important;
        background: rgba(1, 8, 18, .16) !important;
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
        overflow: visible !important;
      }
      #v10WeaponDock { right: 92px !important; left: 7px !important; bottom: 7px !important; }
      #v10WeaponDock button[data-action="missile"],
      #v10WeaponDock button[data-action="homing"] { display: none !important; }
      #v10WeaponDock { grid-template-columns: 1fr !important; max-width: 180px !important; }
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

  function patchPlayerBulletsArray(){
    if(typeof playerBullets === 'undefined' || !Array.isArray(playerBullets)) return false;
    if(playerBullets.__v29NoBigMissiles) return true;

    var nativePush = playerBullets.push;
    playerBullets.push = function(){
      var kept = [];
      for(var i=0;i<arguments.length;i++){
        var b = arguments[i];
        if(b && (b.missile || b.homing || b.kind === 'heavy-pierce' || b.kind === 'heavy-cannon')){
          // Remove the oversized auto/weapon missile style shots entirely.
          continue;
        }
        if(b && typeof b === 'object'){
          // Clamp oversized projectile boxes from enhancement layers so they cannot look like huge missiles.
          if((b.width || 0) > 18) b.width = 18;
          if((b.height || 0) > 44) b.height = 44;
          if((b.damage || 0) > 2.4) b.damage = 2.4;
        }
        kept.push(b);
      }
      if(!kept.length) return this.length;
      return nativePush.apply(this, kept);
    };
    playerBullets.__v29NoBigMissiles = true;
    return true;
  }

  function patchRenderSizing(){
    // Override v28's visual missile treatment by forcing missile/homing bullets to look like normal bullets if any slip through.
    if(window.__SKY_FORCE_V29_PATCHED_CANVAS_DRAW__) return;
    window.__SKY_FORCE_V29_PATCHED_CANVAS_DRAW__ = true;
    var originalDrawImage = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function(){
      return originalDrawImage.apply(this, arguments);
    };
  }

  function removeExistingOversizedShots(){
    if(typeof playerBullets === 'undefined' || !Array.isArray(playerBullets)) return;
    for(var i=playerBullets.length-1;i>=0;i--){
      var b=playerBullets[i];
      if(b && (b.missile || b.homing || (b.width||0)>24 || (b.height||0)>60)){
        playerBullets.splice(i,1);
      }
    }
  }

  function normalizeCanvasSize(){
    var canvas = document.getElementById('game');
    if(!canvas) return;
    canvas.style.width = '100vw';
    canvas.style.height = '100dvh';
    canvas.style.left = '0';
    canvas.style.right = '0';
    canvas.style.top = '0';
    canvas.style.bottom = '0';
  }

  function loop(){
    installLayoutCss();
    patchPlayerBulletsArray();
    patchRenderSizing();
    removeExistingOversizedShots();
    normalizeCanvasSize();
    requestAnimationFrame(loop);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loop);
  else loop();
})();