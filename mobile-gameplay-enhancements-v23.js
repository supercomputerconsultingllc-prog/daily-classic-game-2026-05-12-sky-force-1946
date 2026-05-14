(function(){
  'use strict';
  if(window.__SKY_FORCE_GAMEPLAY_ENHANCEMENTS_V23__) return;
  window.__SKY_FORCE_GAMEPLAY_ENHANCEMENTS_V23__ = true;

  var cfg = {
    fireEveryMs: 330,
    checkpointEveryMs: 18000,
    formationEveryMs: 9000,
    slowMoMs: 1450,
    shakeMaxMs: 420
  };

  var lastSupportShot = 0;
  var lastCheckpoint = 0;
  var lastFormation = 0;
  var savedCheckpoint = null;
  var lastMode = '';
  var formationIndex = 0;
  var slowMoUntil = 0;
  var shakeUntil = 0;
  var shakePower = 0;

  function now(){ return performance.now(); }
  function running(){ return typeof state !== 'undefined' && state.mode === 'running'; }
  function rand(a,b){ return a + Math.random() * (b-a); }
  function width(){ return typeof WIDTH !== 'undefined' ? WIDTH : 900; }
  function height(){ return typeof HEIGHT !== 'undefined' ? HEIGHT : 1200; }

  function score(){
    var el = document.getElementById('scoreValue');
    var v = el ? parseInt((el.textContent || '0').replace(/[^0-9]/g,''),10) : 0;
    return Number.isFinite(v) ? v : 0;
  }

  function tier(){
    var s = score();
    var elapsed = typeof state !== 'undefined' ? (state.elapsedMs || 0) : 0;
    var t = 1;
    if(s >= 1200 || elapsed > 35000) t = 2;
    if(s >= 3200 || elapsed > 70000) t = 3;
    if(s >= 6200 || elapsed > 110000) t = 4;
    if(s >= 10000 || elapsed > 160000) t = 5;
    return t;
  }

  function setHudTier(){
    var el = document.getElementById('weaponValue');
    if(el) el.textContent = 'T' + tier();
  }

  function addShot(x,y,w,h,vx,vy,damage,kind){
    if(typeof playerBullets === 'undefined') return;
    playerBullets.push({
      x:x, y:y, width:w, height:h,
      vx:vx, vy:vy,
      damage:damage,
      v23:true,
      kind:kind || 'tier-shot',
      life:160
    });
  }

  function addWeaponTierFire(){
    if(!running() || typeof player === 'undefined' || typeof playerBullets === 'undefined') return;
    var t = now();
    if(t - lastSupportShot < cfg.fireEveryMs) return;
    lastSupportShot = t;

    var lvl = tier();
    var cx = player.x + player.width / 2;
    var y = player.y + player.height * 0.16;

    if(lvl >= 1){
      addShot(cx - 6, y - 28, 12, 32, 0, -10.8, 1.4, 'center');
    }
    if(lvl >= 2){
      addShot(cx - 28, y - 18, 11, 30, -0.7, -10.2, 1.1, 'wing-left');
      addShot(cx + 17, y - 18, 11, 30, 0.7, -10.2, 1.1, 'wing-right');
    }
    if(lvl >= 3){
      addShot(cx - 45, y + 2, 12, 34, -1.25, -9.2, 1.0, 'spread-left');
      addShot(cx + 33, y + 2, 12, 34, 1.25, -9.2, 1.0, 'spread-right');
    }
    if(lvl >= 4){
      addShot(cx - 9, y - 50, 18, 44, 0, -8.7, 2.6, 'pierce');
    }
    if(lvl >= 5){
      addShot(cx - 64, y + 28, 14, 36, -1.55, -8.5, 1.35, 'outer-left');
      addShot(cx + 50, y + 28, 14, 36, 1.55, -8.5, 1.35, 'outer-right');
    }
  }

  function saveCheckpoint(reason){
    if(!running() || typeof state === 'undefined' || typeof player === 'undefined') return;
    savedCheckpoint = {
      reason: reason || 'timer',
      at: Date.now(),
      score: score(),
      stage: state.stage || 1,
      lives: Math.max(2, state.lives || 3),
      bombs: Math.max(2, state.bombs || 3),
      power: Math.max(2, state.power || 1),
      speedLevel: Math.max(2, state.speedLevel || 1),
      elapsedMs: state.elapsedMs || 0
    };
    try { localStorage.setItem('skyForce1946CheckpointV23', JSON.stringify(savedCheckpoint)); } catch(e) {}
    flashMessage('CHECKPOINT', 900);
  }

  function checkpointLoop(){
    if(!running()) return;
    var t = now();
    if(t - lastCheckpoint > cfg.checkpointEveryMs){
      lastCheckpoint = t;
      saveCheckpoint('auto');
    }
  }

  function loadCheckpoint(){
    if(savedCheckpoint) return savedCheckpoint;
    try {
      var raw = localStorage.getItem('skyForce1946CheckpointV23');
      if(raw) savedCheckpoint = JSON.parse(raw);
    } catch(e) {}
    return savedCheckpoint;
  }

  function applyCheckpoint(){
    var cp = loadCheckpoint();
    if(!cp || typeof state === 'undefined') return false;
    state.lives = Math.max(state.lives || 0, cp.lives || 2);
    state.bombs = Math.max(state.bombs || 0, cp.bombs || 2);
    state.power = Math.max(state.power || 1, cp.power || 2);
    state.speedLevel = Math.max(state.speedLevel || 1, cp.speedLevel || 2);
    state.score = Math.max(state.score || 0, cp.score || 0);
    if(typeof updateHud === 'function') updateHud();
    flashMessage('CONTINUE FROM CHECKPOINT', 1500);
    return true;
  }

  function installCheckpointHooks(){
    if(typeof startRun === 'function' && !startRun.__v23Checkpoint){
      var originalStartRun = startRun;
      startRun = function(){
        var hadCheckpoint = !!loadCheckpoint();
        var result = originalStartRun.apply(this, arguments);
        if(hadCheckpoint) setTimeout(applyCheckpoint, 180);
        return result;
      };
      startRun.__v23Checkpoint = true;
    }

    if(typeof gameOver === 'function' && !gameOver.__v23Checkpoint){
      var originalGameOver = gameOver;
      gameOver = function(){
        var result = originalGameOver.apply(this, arguments);
        setTimeout(function(){ flashMessage('CHECKPOINT AVAILABLE', 1800); }, 250);
        return result;
      };
      gameOver.__v23Checkpoint = true;
    }
  }

  function spawn(type,x,y,pattern,overrides){
    if(typeof spawnEnemy !== 'function') return;
    spawnEnemy(type, x, y, pattern || 'straight', overrides || {});
  }

  function addEnemyFormations(){
    if(!running() || typeof spawnEnemy !== 'function') return;
    var t = now();
    if(t - lastFormation < cfg.formationEveryMs) return;
    lastFormation = t;
    formationIndex = (formationIndex + 1) % 4;

    var W = width();
    var startY = -90;

    if(formationIndex === 0){
      for(var i=0;i<5;i++){
        spawn('scout', W * (0.18 + i*0.16), startY - Math.abs(2-i)*42, 'sine', { vy: 2.35, waveAmp: 28 + i*5, phase: i*.8 });
      }
      flashMessage('V-WAVE', 800);
    } else if(formationIndex === 1){
      for(var j=0;j<4;j++){
        spawn('scout', j%2 ? W + 55 : -95, 135 + j*90, 'dive', { vx: j%2 ? -2.2 : 2.2, vy: 2.0, diveDelayMs: 250 + j*140 });
      }
      flashMessage('SIDE RAID', 800);
    } else if(formationIndex === 2){
      for(var k=0;k<6;k++){
        spawn('formation', W*(0.1+k*.15), startY - k*32, 'formation', { vy: 2.0, waveAmp: 22, waveSpeed: .055, phase: k*.9 });
      }
      flashMessage('STAGGERED WAVE', 800);
    } else {
      spawn('gunship', W*.28, -120, 'gunship', { vy: 1.75, stopY: 180, stopUntil: 1700 });
      spawn('gunship', W*.66, -160, 'gunship', { vy: 1.75, stopY: 220, stopUntil: 1700 });
      flashMessage('HEAVY ESCORT', 800);
    }
  }

  function activateSlowMo(){
    slowMoUntil = now() + cfg.slowMoMs;
    flashMessage('SLOW-MO BLAST', 1000);
  }

  function installBombSlowMo(){
    if(typeof triggerBomb === 'function' && !triggerBomb.__v23SlowMo){
      var originalBomb = triggerBomb;
      triggerBomb = function(){
        var result = originalBomb.apply(this, arguments);
        activateSlowMo();
        startShake(14, 360);
        return result;
      };
      triggerBomb.__v23SlowMo = true;
    }
  }

  function slowMoLoop(){
    if(!running()) return;
    if(now() > slowMoUntil) return;
    if(typeof enemies !== 'undefined'){
      enemies.forEach(function(e){ if(e){ e.x -= (e.vx || 0) * .38; e.y -= (e.vy || 0) * .38; }});
    }
    if(typeof enemyBullets !== 'undefined'){
      enemyBullets.forEach(function(b){ if(b){ b.x -= (b.vx || 0) * .48; b.y -= (b.vy || 0) * .48; }});
    }
  }

  function startShake(power, ms){
    shakePower = Math.max(shakePower, power || 8);
    shakeUntil = Math.max(shakeUntil, now() + (ms || cfg.shakeMaxMs));
  }

  function installShakeSources(){
    if(typeof spawnExplosion === 'function' && !spawnExplosion.__v23Shake){
      var originalExplosion = spawnExplosion;
      spawnExplosion = function(){
        startShake(5, 160);
        return originalExplosion.apply(this, arguments);
      };
      spawnExplosion.__v23Shake = true;
    }
  }

  function shakeLoop(){
    var stage = document.querySelector('.stage');
    if(!stage) return;
    if(now() > shakeUntil){
      stage.style.transform = '';
      shakePower = 0;
      return;
    }
    var remaining = Math.max(0, shakeUntil - now()) / cfg.shakeMaxMs;
    var p = shakePower * remaining;
    var dx = rand(-p,p).toFixed(1);
    var dy = rand(-p,p).toFixed(1);
    stage.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
  }

  function flashMessage(text, ms){
    var id = 'v23GameplayFlash';
    var el = document.getElementById(id);
    if(!el){
      el = document.createElement('div');
      el.id = id;
      el.style.cssText = 'position:fixed;top:64px;left:0;right:0;z-index:10100;text-align:center;color:#fff;font:900 18px/1.1 system-ui;text-shadow:0 3px 8px #000,0 0 18px #5ee7ff;pointer-events:none;opacity:0;transition:opacity .18s ease;';
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.style.opacity = '1';
    clearTimeout(el.__hideTimer);
    el.__hideTimer = setTimeout(function(){ el.style.opacity = '0'; }, ms || 900);
  }

  function modeWatch(){
    if(typeof state === 'undefined') return;
    if(state.mode !== lastMode){
      lastMode = state.mode;
      if(lastMode === 'running'){
        lastCheckpoint = now();
        saveCheckpoint('run-start');
      }
    }
  }

  function loop(){
    installCheckpointHooks();
    installBombSlowMo();
    installShakeSources();
    modeWatch();
    setHudTier();
    addWeaponTierFire();
    checkpointLoop();
    addEnemyFormations();
    slowMoLoop();
    shakeLoop();
    requestAnimationFrame(loop);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loop);
  else loop();
})();