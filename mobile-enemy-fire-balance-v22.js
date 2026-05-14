(function(){
  'use strict';
  if(window.__SKY_FORCE_ENEMY_FIRE_BALANCE_V22__) return;
  window.__SKY_FORCE_ENEMY_FIRE_BALANCE_V22__ = true;

  function install(){
    if(typeof spawnEnemyBullet !== 'function') return false;
    if(spawnEnemyBullet.__v22HalfFire) return true;

    var original = spawnEnemyBullet;
    var counter = 0;

    spawnEnemyBullet = function(){
      counter += 1;
      if(counter % 2 === 1) return null;
      return original.apply(this, arguments);
    };

    spawnEnemyBullet.__v22HalfFire = true;
    document.documentElement.dataset.enemyFireBalance = 'half-rate-v22';
    return true;
  }

  var tries = 0;
  var timer = setInterval(function(){
    tries += 1;
    if(install() || tries > 120) clearInterval(timer);
  }, 100);
})();