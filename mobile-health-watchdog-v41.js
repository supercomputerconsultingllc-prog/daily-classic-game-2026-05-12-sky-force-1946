(function(){
  'use strict';
  if(window.__SKY_FORCE_HEALTH_WATCHDOG_V41__) return;
  window.__SKY_FORCE_HEALTH_WATCHDOG_V41__ = true;
  document.documentElement.dataset.v41HealthWatchdog = 'active';

  const PLANE_HP = {
    falcon: { name: 'FALCON', hp: 5 },
    raptor: { name: 'RAPTOR', hp: 4 },
    titan: { name: 'TITAN', hp: 7 },
    ghost: { name: 'GHOST', hp: 3 }
  };

  let planeId = readPlaneId();
  let maxHp = planeHp(planeId);
  let hp = maxHp;
  let lastMode = '';
  let lastLives = null;
  let lastDamageAt = 0;
  let installed = false;

  function readPlaneId(){
    try {
      return localStorage.getItem('skyForceV35SelectedPlane') || localStorage.getItem('skyForceV32SelectedPlane') || 'falcon';
    } catch(e){ return 'falcon'; }
  }

  function planeHp(id){ return (PLANE_HP[id] || PLANE_HP.falcon).hp; }
  function planeName(id){ return (PLANE_HP[id] || PLANE_HP.falcon).name; }
  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

  function installCss(){
    let style = document.getElementById('v41HealthCss');
    if(!style){
      style = document.createElement('style');
      style.id = 'v41HealthCss';
      document.head.appendChild(style);
    }
    style.textContent = `
      #v35Health, #v40Health { display:none !important; visibility:hidden !important; pointer-events:none !important; }
      #v41Health {
        position: fixed !important;
        left: 6px !important;
        right: 6px !important;
        top: max(5px, env(safe-area-inset-top)) !important;
        height: 18px !important;
        z-index: 26000 !important;
        border: 1px solid rgba(255,255,255,.78) !important;
        border-radius: 999px !important;
        overflow: hidden !important;
        background: rgba(2,10,18,.62) !important;
        box-shadow: 0 2px 10px rgba(0,0,0,.6) !important;
        pointer-events: none !important;
      }
      #v41HealthFill {
        height: 100% !important;
        width: 100% !important;
        background: linear-gradient(90deg,#24ff7d,#f7ff42,#ff3b2f) !important;
        box-shadow: 0 0 16px rgba(80,255,168,.6) !important;
        transition: width .12s ease !important;
      }
      #v41HealthText {
        position: absolute !important;
        inset: 0 !important;
        color: white !important;
        text-align: center !important;
        font: 900 11px/18px system-ui, sans-serif !important;
        text-shadow: 0 1px 4px #000, 0 0 6px #000 !important;
      }
    `;
  }

  function installBar(){
    installCss();
    const h35 = document.getElementById('v35Health');
    if(h35) h35.style.display = 'none';
    const h40 = document.getElementById('v40Health');
    if(h40) h40.style.display = 'none';
    if(!document.getElementById('v41Health')){
      const bar = document.createElement('div');
      bar.id = 'v41Health';
      bar.innerHTML = '<div id="v41HealthFill"></div><div id="v41HealthText"></div>';
      document.body.appendChild(bar);
    }
  }

  function updateBar(){
    installBar();
    const fill = document.getElementById('v41HealthFill');
    const text = document.getElementById('v41HealthText');
    const pct = maxHp > 0 ? clamp(hp / maxHp, 0, 1) : 0;
    if(fill) fill.style.width = Math.round(pct * 100) + '%';
    if(text) text.textContent = planeName(planeId) + ' HEALTH ' + hp + '/' + maxHp;
  }

  function syncHudSafe(){
    try { if(typeof syncHud === 'function') syncHud(); } catch(e) {}
  }

  function clearEnemyBullets(){
    try { if(Array.isArray(enemyBullets)) enemyBullets.length = 0; } catch(e) {}
  }

  function setInvulnerable(ms){
    try {
      if(typeof state !== 'undefined') state.invulnerableUntil = performance.now() + ms;
    } catch(e) {}
  }

  function damageHealthOnly(){
    const t = performance.now();
    if(t - lastDamageAt < 220) return;
    lastDamageAt = t;

    hp = Math.max(0, hp - 1);
    updateBar();

    if(hp > 0){
      setInvulnerable(1700);
      clearEnemyBullets();
      try {
        if(typeof player !== 'undefined' && typeof spawnBurst === 'function') {
          spawnBurst(player.x + player.width / 2, player.y + player.height / 2, 22, '#ffbe8d');
        }
        if(typeof tone === 'function') tone(180, 0.09, 'sawtooth', 0.024);
      } catch(e) {}
      syncHudSafe();
      return false;
    }

    clearEnemyBullets();
    setInvulnerable(2800);
    try {
      if(typeof player !== 'undefined' && typeof spawnBurst === 'function') {
        spawnBurst(player.x + player.width / 2, player.y + player.height / 2, 34, '#ffbe8d');
      }
      if(typeof tone === 'function') tone(120, 0.14, 'sawtooth', 0.032);
    } catch(e) {}
    return true;
  }

  function resetForPlaneOrRun(force){
    const nextPlane = readPlaneId();
    const mode = typeof state !== 'undefined' ? state.mode : '';
    if(force || nextPlane !== planeId || (mode === 'running' && lastMode !== 'running')){
      planeId = nextPlane;
      maxHp = planeHp(planeId);
      hp = maxHp;
      if(typeof state !== 'undefined') lastLives = state.lives;
      updateBar();
    }
    lastMode = mode;
  }

  function patchDamagePlayer(){
    if(installed) return true;
    if(typeof damagePlayer !== 'function') return false;

    damagePlayer = function(){
      if(typeof state !== 'undefined'){
        const t = performance.now();
        if(t < state.invulnerableUntil || t < state.bombActiveUntil) return;
      }

      resetForPlaneOrRun(false);
      const shouldLoseLife = damageHealthOnly();

      if(shouldLoseLife && typeof state !== 'undefined'){
        state.lives -= 1;
        lastLives = state.lives;
        hp = maxHp;
        updateBar();
        if(state.lives <= 0){
          hp = 0;
          updateBar();
          syncHudSafe();
          if(typeof gameOver === 'function') gameOver();
          return;
        }
        try { if(typeof resetPlayerPosition === 'function') resetPlayerPosition(); } catch(e) {}
      }
      syncHudSafe();
    };

    damagePlayer.__v41WatchdogDamage = true;
    installed = true;
    return true;
  }

  function watchLifeDelta(){
    if(typeof state === 'undefined') return;
    if(lastLives === null) lastLives = state.lives;

    if(state.lives < lastLives){
      const lost = lastLives - state.lives;
      for(let i = 0; i < lost; i += 1){
        if(hp > 1){
          state.lives += 1;
          hp -= 1;
          setInvulnerable(1700);
          clearEnemyBullets();
        } else {
          hp = maxHp;
        }
      }
      lastLives = state.lives;
      updateBar();
      syncHudSafe();
      return;
    }

    if(state.lives > lastLives){
      lastLives = state.lives;
    }
  }

  function exposeDebug(){
    window.skyForceHealthV41 = {
      get: function(){ return { plane: planeId, hp: hp, maxHp: maxHp, lives: typeof state !== 'undefined' ? state.lives : null, lastLives: lastLives }; },
      damage: function(){ if(typeof damagePlayer === 'function') damagePlayer(); },
      set: function(v){ hp = clamp(Number(v) || maxHp, 0, maxHp); updateBar(); },
      heal: function(){ hp = maxHp; updateBar(); }
    };
  }

  function loop(){
    installBar();
    patchDamagePlayer();
    resetForPlaneOrRun(false);
    watchLifeDelta();
    updateBar();
    exposeDebug();
    requestAnimationFrame(loop);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loop);
  else loop();
})();