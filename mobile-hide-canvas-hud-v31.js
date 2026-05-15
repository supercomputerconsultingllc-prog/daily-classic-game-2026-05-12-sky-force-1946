(function(){
  'use strict';
  if(window.__SKY_FORCE_HIDE_CANVAS_HUD_V31__) return;
  window.__SKY_FORCE_HIDE_CANVAS_HUD_V31__ = true;
  document.documentElement.dataset.v31CanvasHud = 'hidden';

  function install(){
    if(typeof drawStageHints !== 'function') return false;
    if(drawStageHints.__v31Hidden) return true;

    drawStageHints = function(nowMs){
      // The original drawStageHints painted the old side SCORE/POWER/MEDAL/WAVE/STAGE panels
      // directly into the canvas. Keep only the center banner behavior.
      try {
        if(typeof state !== 'undefined' && performance.now() < state.bannerUntil && typeof ctx !== 'undefined') {
          var width = typeof WIDTH !== 'undefined' ? WIDTH : 900;
          var height = typeof HEIGHT !== 'undefined' ? HEIGHT : 1200;
          var centerX = width / 2;
          ctx.fillStyle = 'rgba(8, 13, 20, 0.38)';
          ctx.fillRect(centerX - 220, height / 2 - 34, 440, 68);
          ctx.strokeStyle = 'rgba(255, 230, 180, 0.7)';
          ctx.strokeRect(centerX - 220, height / 2 - 34, 440, 68);
          ctx.fillStyle = '#fff0cc';
          ctx.font = 'bold 24px Courier New, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(state.bannerText || '', centerX, height / 2 + 9);
          ctx.textAlign = 'start';
        }
      } catch(e) {}
    };
    drawStageHints.__v31Hidden = true;
    return true;
  }

  var tries = 0;
  var timer = setInterval(function(){
    tries += 1;
    if(install() || tries > 160) clearInterval(timer);
  }, 60);
})();