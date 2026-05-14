(function(){
  'use strict';
  if(window.__SKY_FORCE_SINGLE_AUDIO_GUARD_V21__) return;
  window.__SKY_FORCE_SINGLE_AUDIO_GUARD_V21__ = true;

  var NativeAudio = window.Audio;
  var registry = [];

  function remember(audio) {
    if (audio && registry.indexOf(audio) === -1) registry.push(audio);
    return audio;
  }

  function pauseAll(except) {
    registry = registry.filter(function(item){ return item && typeof item.pause === 'function'; });
    registry.forEach(function(item){
      if (item !== except && !item.paused) {
        try { item.pause(); } catch (err) {}
      }
    });
  }

  window.Audio = function(src) {
    var audio = src === undefined ? new NativeAudio() : new NativeAudio(src);
    remember(audio);
    return audio;
  };
  window.Audio.prototype = NativeAudio.prototype;
  window.Audio.__nativeAudio = NativeAudio;

  var nativePlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function() {
    remember(this);
    pauseAll(this);
    return nativePlay.apply(this, arguments);
  };

  function bindOnce(id, fn) {
    var el = document.getElementById(id);
    if (!el || el.dataset.v21AudioBound) return;
    el.dataset.v21AudioBound = 'true';
    el.addEventListener('click', fn, true);
    el.addEventListener('pointerdown', fn, true);
    el.addEventListener('touchstart', fn, true);
  }

  function installBindings() {
    bindOnce('v10MusicNext', function(){ pauseAll(null); });
    bindOnce('v10MusicToggle', function(){
      var btn = document.getElementById('v10MusicToggle');
      if (btn && /ON/i.test(btn.textContent || '')) pauseAll(null);
    });
    bindOnce('pauseButton', function(){
      setTimeout(function(){
        if (typeof state !== 'undefined' && state.mode !== 'running') pauseAll(null);
      }, 80);
    });
    bindOnce('startButton', function(){
      setTimeout(function(){
        if (typeof state !== 'undefined' && state.mode !== 'running') pauseAll(null);
      }, 120);
    });
  }

  document.addEventListener('visibilitychange', function(){
    if (document.hidden) pauseAll(null);
  });
  window.addEventListener('pagehide', function(){ pauseAll(null); });
  window.addEventListener('blur', function(){ pauseAll(null); });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setInterval(installBindings, 250); });
  } else {
    setInterval(installBindings, 250);
  }
})();