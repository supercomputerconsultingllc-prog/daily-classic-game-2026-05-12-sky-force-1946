(function(){
  'use strict';
  if(window.__SKY_FORCE_V35_BULLETS_HEALTH_FIX_V40__) return;
  window.__SKY_FORCE_V35_BULLETS_HEALTH_FIX_V40__ = true;
  document.documentElement.dataset.v40BulletsHealthFix = 'active';

  const PLANE_HP = {
    falcon: { name: 'FALCON', hp: 5 },
    raptor: { name: 'RAPTOR', hp: 4 },
    titan: { name: 'TITAN', hp: 7 },
    ghost: { name: 'GHOST', hp: 3 }
  };

  let selectedPlane = readPlaneId();
  let maxHp = getPlaneHp(selectedPlane);
  let hp = maxHp;
  let lastMode = '';
  let fireWrapped = false;
  let healthWrapped = false;
  let enemyFireAttempt = 0;
  let lastEnemyShotAt = 0;

  function readPlaneId(){
    try {
      return localStorage.getItem('skyForceV35SelectedPlane') || localStorage.getItem('skyForceV32SelectedPlane') || 'falcon';
    } catch(e){
      return 'falcon';
    }
  }

  function getPlaneHp(id){
    return (PLANE_HP[id] || PLANE_HP.falcon).hp;
  }

  function getPlaneName(id){
    return (PLANE_HP[id] || PLANE_HP.falcon).name;
  }

  function stageNumber(){
    try {
      const raw = typeof state !== 'undefined' ? Number(state.stage || 1) : 1;
      return Number.isFinite(raw) ? Math.max(1, raw) : 1;
    } catch(e){ return 1; }
  }

  function elapsedMs(){
    try {
      const raw = typeof state !== 'undefined' ? Number(state.elapsedMs || 0) : 0;
      return Number.isFinite(raw) ? Math.max(0, raw) : 0;
    } catch(e){ return 0; }
  }

  function enemyFireSettings(){
    const s = stageNumber();
    const e = elapsedMs();
    // v35 already halves base fire. This layer reduces it further early, then ramps back up.
    if(s >= 6 || e >= 210000) return { passEvery: 1, minGapMs: 220, cap: 20, label: 'final' };
    if(s >= 5 || e >= 165000) return { passEvery: 1, minGapMs: 285, cap: 16, label: 'late' };
    if(s >= 4 || e >= 120000) return { passEvery: 2, minGapMs: 320, cap: 13, label: 'hard' };
    if(s >= 3 || e >= 75000) return { passEvery: 2, minGapMs: 390, cap: 10, label: 'mid' };
    if(s >= 2 || e >= 35000) return { passEvery: 3, minGapMs: 450, cap: 8, label: 'early' };
    return { passEvery: 4, minGapMs: 560, cap: 6, label: 'intro' };
  }

  function activeEnemyShots(){
    try { return Array.isArray(enemyBullets) ? enemyBullets.length : 0; }
    catch(e){ return 0; }
  }

  function trimEnemyShots(){
    try {
      if(!Array.isArray(enemyBullets)) return;
      const cap = enemyFireSettings().cap;
      while(enemyBullets.length > cap) enemyBullets.shift();
    } catch(e) {}
  }

  function installEnemyFireFix(){
    if(fireWrapped) return true;
    if(typeof spawnEnemyBullet !== 'function') return false;

    const previousSpawnEnemyBullet = spawnEnemyBullet;
    spawnEnemyBullet = function(){
      const cfg = enemyFireSettings();
      const t = performance.now();
      enemyFireAttempt += 1;
      trimEnemyShots();

      if(activeEnemyShots() >= cfg.cap) return null;
      if(t - lastEnemyShotAt < cfg.minGapMs) return null;
      if(enemyFireAttempt % cfg.passEvery !== 0) return null;

      lastEnemyShotAt = t;
      return previousSpawnEnemyBullet.apply(this, arguments);
    };
    spawnEnemyBullet.__v40ReducedProgressiveFire = true;
    fireWrapped = true;
    return true;
  }

  function installHealthCss(){
    let style = document.getElementById('v40HealthCss');
    if(!style){
      style = document.createElement('style');
      style.id = 'v40HealthCss';
      document.head.appendChild(style);
    }
    style.textContent = `
      #v35Health { display:none !important; visibility:hidden !important; pointer-events:none !important; }
      #v40Health {
        position: fixed !important;
        left: 6px !important;
        right: 6px !important;
        top: max(5px, env(safe-area-inset-top)) !important;
        height: 18px !important;
        z-index: 22000 !important;
        border: 1px solid rgba(255,255,255,.75) !important;
        border-radius: 999px !important;
        overflow: hidden !important;
        background: rgba(2,10,18,.58) !important;
        box-shadow: 0 2px 10px rgba(0,0,0,.55) !important;
        pointer-events: none !important;
      }
      #v40HealthFill {
        height: 100% !important;
        width: 100% !important;
        background: linear-gradient(90deg,#24ff7d,#f7ff42,#ff3b2f) !important;
        box-shadow: 0 0 16px rgba(80,255,168,.6) !important;
        transition: width .16s ease !important;
      }
      #v40HealthText {
        position: absolute !important;
        inset: 0 !important;
        color: white !important;
        text-align: center !important;
        font: 900 11px/18px system-ui, sans-serif !important;
        text-shadow: 0 1px 4px #000, 0 0 6px #000 !important;
      }
    `;
  }

  function installHealthBar(){
    installHealthCss();
    const old = document.getElementById('v35Health');
    if(old) old.style.display = 'none';
    if(!document.getElementById('v40Health')){
      const bar = document.createElement('div');
      bar.id = 'v40Health';
      bar.innerHTML = '<div id="v40HealthFill"></div><div id="v40HealthText"></div>';
      document.body.appendChild(bar);
    }
    updateHealthBar();
  }

  function updateHealthBar(){
    const fill = document.getElementById('v40HealthFill');
    const text = document.getElementById('v40HealthText');
    const pct = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
    if(fill) fill.style.width = Math.round(pct * 100) + '%';
    if(text) text.textContent = getPlaneName(selectedPlane) + ' HEALTH ' + hp + '/' + maxHp;
  }

  function resetHealthForRunOrPlane(force){
    const plane = readPlaneId();
    const mode = typeof state !== 'undefined' ? state.mode : '';
    if(force || plane !== selectedPlane || (mode === 'running' && lastMode !== 'running')){
      selectedPlane = plane;
      maxHp = getPlaneHp(plane);
      hp = maxHp;
      updateHealthBar();
    }
    lastMode = mode;
  }

  function safeSyncHud(){
    try { if(typeof syncHud === 'function') syncHud(); } catch(e) {}
  }

  function clearEnemyBullets(){
    try { if(Array.isArray(enemyBullets)) enemyBullets.length = 0; } catch(e) {}
  }

  function installHealthFix(){
    if(healthWrapped) return true;
    if(typeof damagePlayer !== 'function') return false;

    damagePlayer = function(){
      const t = performance.now();
      if(typeof state !== 'undefined' && (t < state.invulnerableUntil || t < state.bombActiveUntil)) return;

      resetHealthForRunOrPlane(false);
      hp = Math.max(0, hp - 1);
      updateHealthBar();

      if(hp > 0){
        if(typeof state !== 'undefined'){
          state.power = Math.max(1, (state.power || 1) - 1);
          state.invulnerableUntil = t + 1700;
        }
        clearEnemyBullets();
        try {
          if(typeof player !== 'undefined' && typeof spawnBurst === 'function') {
            spawnBurst(player.x + player.width / 2, player.y + player.height / 2, 24, '#ffbe8d');
          }
          if(typeof tone === 'function') tone(180, 0.10, 'sawtooth', 0.025);
        } catch(e) {}
        safeSyncHud();
        return;
      }

      if(typeof state !== 'undefined'){
        state.lives -= 1;
        state.power = Math.max(1, (state.power || 1) - 1);
        state.invulnerableUntil = t + 2800;
      }
      clearEnemyBullets();

      try {
        if(typeof player !== 'undefined' && typeof spawnBurst === 'function') {
          spawnBurst(player.x + player.width / 2, player.y + player.height / 2, 34, '#ffbe8d');
        }
        if(typeof tone === 'function') tone(120, 0.16, 'sawtooth', 0.035);
      } catch(e) {}

      if(typeof state !== 'undefined' && state.lives <= 0){
        updateHealthBar();
        safeSyncHud();
        if(typeof gameOver === 'function') gameOver();
        return;
      }

      maxHp = getPlaneHp(readPlaneId());
      selectedPlane = readPlaneId();
      hp = maxHp;
      updateHealthBar();
      try { if(typeof resetPlayerPosition === 'function') resetPlayerPosition(); } catch(e) {}
      safeSyncHud();
    };
    damagePlayer.__v40SingleHealthController = true;
    healthWrapped = true;
    return true;
  }

  function exposeDebug(){
    window.skyForceV40 = {
      health: function(){ return { plane: selectedPlane, hp: hp, maxHp: maxHp }; },
      damage: function(){ if(typeof damagePlayer === 'function') damagePlayer(); },
      heal: function(){ hp = maxHp; updateHealthBar(); },
      enemyFire: function(){ return enemyFireSettings(); },
      enemyShots: activeEnemyShots
    };
  }

  function loop(){
    installHealthBar();
    installEnemyFireFix();
    installHealthFix();
    resetHealthForRunOrPlane(false);
    trimEnemyShots();
    updateHealthBar();
    exposeDebug();
    requestAnimationFrame(loop);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loop);
  else loop();
})();