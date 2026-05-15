(function(){
  'use strict';
  if(window.__SKY_FORCE_ROUND_END_AUDIO_STOP_V26__) return;
  window.__SKY_FORCE_ROUND_END_AUDIO_STOP_V26__ = true;

  function pauseEveryAudio(){
    var media = Array.prototype.slice.call(document.querySelectorAll('audio,video'));
    media.forEach(function(item){
      try { item.pause(); } catch(e) {}
      try { item.currentTime = 0; } catch(e) {}
    });

    if(window.Audio && window.Audio.__nativeAudioRegistry){
      window.Audio.__nativeAudioRegistry.forEach(function(item){
        try { item.pause(); } catch(e) {}
        try { item.currentTime = 0; } catch(e) {}
      });
    }

    document.documentElement.dataset.roundMusicState = 'stopped-v26';
  }

  function isEndMode(mode){
    mode = String(mode || '').toLowerCase();
    return mode === 'gameover' || mode === 'game_over' || mode === 'stageclear' || mode === 'stage_clear' || mode === 'victory' || mode === 'complete' || mode === 'ended' || mode === 'menu';
  }

  function overlayLooksEnded(){
    var title = document.getElementById('overlayTitle');
    var msg = document.getElementById('overlayMessage');
    var text = ((title && title.textContent) || '') + ' ' + ((msg && msg.textContent) || '');
    return /game\s*over|run\s*over|mission\s*complete|victory|stage\s*clear|defeat|continue/i.test(text);
  }

  function wrap(name){
    if(typeof window[name] !== 'function' || window[name].__v26StopMusic) return;
    var original = window[name];
    window[name] = function(){
      var result = original.apply(this, arguments);
      setTimeout(pauseEveryAudio, 40);
      setTimeout(pauseEveryAudio, 250);
      return result;
    };
    window[name].__v26StopMusic = true;
  }

  function installHooks(){
    wrap('gameOver');
    wrap('stageClear');
    wrap('showGameOver');
    wrap('showVictory');
    wrap('endRun');
    wrap('missionComplete');
  }

  var lastMode = '';
  function watchState(){
    installHooks();

    var mode = '';
    try { mode = typeof state !== 'undefined' ? String(state.mode || '') : ''; } catch(e) {}

    if(mode !== lastMode){
      lastMode = mode;
      if(isEndMode(mode)) pauseEveryAudio();
    }

    if(overlayLooksEnded()) pauseEveryAudio();
  }

  document.addEventListener('visibilitychange', function(){
    if(document.hidden) pauseEveryAudio();
  });
  window.addEventListener('pagehide', pauseEveryAudio);
  window.addEventListener('beforeunload', pauseEveryAudio);
  window.addEventListener('blur', function(){
    setTimeout(function(){
      try {
        if(typeof state !== 'undefined' && state.mode !== 'running') pauseEveryAudio();
      } catch(e) { pauseEveryAudio(); }
    }, 80);
  });

  setInterval(watchState, 180);
})();