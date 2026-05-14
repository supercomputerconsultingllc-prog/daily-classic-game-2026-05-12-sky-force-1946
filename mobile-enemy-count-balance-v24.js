(function(){
  'use strict';
  if(window.__SKY_FORCE_ENEMY_COUNT_BALANCE_V24__) return;
  window.__SKY_FORCE_ENEMY_COUNT_BALANCE_V24__ = true;

  var spawnCounter = 0;
  var forcedKeepWindowUntil = 0;

  function now(){ return performance.now(); }

  function importantType(type){
    return /boss|carrier|gunship|heavy/i.test(String(type || ''));
  }

  function install(){
    if(typeof spawnEnemy !== 'function') return false;
    if(spawnEnemy.__v24HalfEnemies) return true;

    var originalSpawnEnemy = spawnEnemy;

    spawnEnemy = function(type){
      spawnCounter += 1;

      // Keep major enemies and boss-type units so progression does not break.
      if(importantType(type) || now() < forcedKeepWindowUntil){
        return originalSpawnEnemy.apply(this, arguments);
      }

      // Drop every other standard enemy spawn.
      if(spawnCounter % 2 === 1){
        return null;
      }

      return originalSpawnEnemy.apply(this, arguments);
    };

    spawnEnemy.__v24HalfEnemies = true;
    document.documentElement.dataset.enemyCountBalance = 'half-count-v24';
    return true;
  }

  // Preserve boss/important scripted waves briefly after stage transitions.
  function watchStage(){
    if(typeof state === 'undefined') return;
    var stageKey = String(state.stage || '') + ':' + String(state.mode || '');
    if(watchStage.last !== stageKey){
      watchStage.last = stageKey;
      forcedKeepWindowUntil = now() + 2200;
    }
  }

  var tries = 0;
  var timer = setInterval(function(){
    tries += 1;
    watchStage();
    if(install() || tries > 160) clearInterval(timer);
  },100);

  setInterval(watchStage,500);
})();