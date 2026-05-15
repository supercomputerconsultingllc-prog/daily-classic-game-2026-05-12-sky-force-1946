(function(){
  'use strict';
  if(window.__SKY_FORCE_HEALTH_CONTROLLER_V34__) return;
  window.__SKY_FORCE_HEALTH_CONTROLLER_V34__ = true;
  document.documentElement.dataset.v34HealthController = 'active';

  const PLANE_HP = {
    falcon: { name: 'FALCON', hp: 5 },
    raptor: { name: 'RAPTOR', hp: 4 },
    titan: { name: 'TITAN', hp: 7 },
    ghost: { name: 'GHOST', hp: 3 }
  };

  let currentPlaneId = getPlaneId();
  let maxHp = getPlaneHp();
  let hp = maxHp;
  let lastMode = '';
  let installedDamageOverride = false;

  function getPlaneId(){
    try {
      return localStorage.getItem('skyForceV32SelectedPlane') || localStorage.getItem('skyForceV28Plane') || localStorage.getItem('skyForce1945PlaneV25') || 'falcon';
    } catch(e) {
      return 'falcon';
    }
  }

  function getPlane(){
    return PLANE_HP[getPlaneId()] || PLANE_HP.falcon;
  }

  function getPlaneHp(){
    return getPlane().hp;
  }

  function installCss(){
    let style = document.getElementById('v34HealthCss');
    if(!style){
      style = document.createElement('style');
      style.id = 'v34HealthCss';
      document.head.appendChild(style);
    }
    style.textContent = `
      #v27Health, #v28Health, #v32Health { display: none !important; visibility: hidden !important; pointer-events: none !important; }
      #v34Health {
        position: fixed !important;
        left: 6px !important;
        right: 6px !important;
        top: max(5px, env(safe-area-inset-top)) !important;
        height: 18px !important;
        z-index: 16000 !important;
        border: 1px solid rgba(255,255,255,.72) !important;
        border-radius: 999px !important;
        background: rgba(2,10,18,.52) !important;
        box-shadow: 0 2px 10px rgba(0,0,0,.5) !important;
        overflow: hidden !important;
        pointer-events: none !important;
      }
      #v34HealthFill {
        height: 100% !important;
        width: 100% !important;
        background: linear-gradient(90deg,#20ff7d,#f7ff42,#ff3b2f) !important;
        box-shadow: 0 0 16px rgba(80,255,168,.55) !important;
        transition: width .18s ease !important;
      }
      #v34HealthText {
        position: absolute !important;
        inset: 0 !important;
        text-align: center !important;
        color: #fff !important;
        font: 900 11px/18px system-ui, sans-serif !important;
        text-shadow: 0 1px 4px #000, 0 0 6px #000 !important;
      }
    `;
  }

  function installBar(){
    installCss();
    ['v27Health','v28Health','v32Health'].forEach(function(id){
      const el = document.getElementById(id);
      if(el) el.remove();
    });
    if(!document.getElementById('v34Health')){
      const bar = document.createElement('div');
      bar.id = 'v34Health';
      bar.innerHTML = '<div id="v34HealthFill"></div><div id="v34HealthText"></div>';
      document.body.appendChild(bar);
    }
  }

  function clamp(v, min, max){
    return Math.max(min, Math.min(max, v));
  }

  function updateBar(){
    installBar();
    const plane = getPlane();
    const fill = document.getElementById('v34HealthFill');
    const text = document.getElementById('v34HealthText');
    const pct = maxHp > 0 ? clamp(hp / maxHp, 0, 1) : 0;
    if(fill) fill.style.width = Math.round(pct * 100) + '%';
    if(text) text.textContent = plane.name + ' HEALTH ' + hp + '/' + maxHp;
  }

  function resetForPlaneOrRun(force){
    const planeId = getPlaneId();
    const mode = typeof state !== 'undefined' ? state.mode : '';
    if(force || planeId !== currentPlaneId || (mode === 'running' && lastMode !== 'running')){
      currentPlaneId = planeId;
      maxHp = getPlaneHp();
      hp = maxHp;
      updateBar();
    }
    lastMode = mode;
  }

  function visualHitFeedback(){
    try {
      if(typeof enemyBullets !== 'undefined') enemyBullets = [];
      if(typeof resetMedalChain === 'function') resetMedalChain();
      if(typeof state !== 'undefined') {
        state.power = Math.max(1, (state.power || 1) - 1);
        state.invulnerableUntil = performance.now() + 1800;
      }
      if(typeof player !== 'undefined' && typeof spawnBurst === 'function') {
        spawnBurst(player.x + player.width / 2, player.y + player.height / 2, 26, '#ffbe8d');
      }
      if(typeof tone === 'function') tone(180, 0.12, 'sawtooth', 0.03);
      if(typeof syncHud === 'function') syncHud();
    } catch(e) {}
  }

  function installDamageOverride(){
    if(installedDamageOverride) return true;
    if(typeof damagePlayer !== 'function') return false;

    damagePlayer = function(){
      const now = performance.now();
      if(typeof state !== 'undefined'){
        if(now < state.invulnerableUntil || now < state.bombActiveUntil) return;
      }

      resetForPlaneOrRun(false);
      hp -= 1;
      updateBar();

      if(hp > 0){
        visualHitFeedback();
        return;
      }

      // Health depleted: now consume exactly one life and either reset health or end the run.
      if(typeof state !== 'undefined'){
        state.lives -= 1;
        state.power = Math.max(1, (state.power || 1) - 1);
        if(typeof removeOptionDrone === 'function') removeOptionDrone();
        state.invulnerableUntil = now + 3000;
        if(typeof enemyBullets !== 'undefined') enemyBullets = [];
        if(typeof resetMedalChain === 'function') resetMedalChain();
      }

      try {
        if(typeof player !== 'undefined' && typeof spawnBurst === 'function') {
          spawnBurst(player.x + player.width / 2, player.y + player.height / 2, 34, '#ffbe8d');
        }
        if(typeof tone === 'function') tone(180, 0.12, 'sawtooth', 0.03);
      } catch(e) {}

      if(typeof state !== 'undefined' && state.lives <= 0){
        updateBar();
        if(typeof gameOver === 'function') gameOver();
        return;
      }

      hp = maxHp;
      updateBar();
      if(typeof resetPlayerPosition === 'function') resetPlayerPosition();
      if(typeof syncHud === 'function') syncHud();
    };

    damagePlayer.__v34HealthController = true;
    installedDamageOverride = true;
    return true;
  }

  function exposeDebug(){
    window.skyForceHealthV34 = {
      get: function(){ return { plane: getPlaneId(), hp: hp, maxHp: maxHp }; },
      damage: function(){ if(typeof damagePlayer === 'function') damagePlayer(); },
      heal: function(){ hp = maxHp; updateBar(); },
      set: function(value){ hp = clamp(Number(value) || maxHp, 0, maxHp); updateBar(); }
    };
  }

  function loop(){
    installBar();
    installDamageOverride();
    resetForPlaneOrRun(false);
    updateBar();
    exposeDebug();
    requestAnimationFrame(loop);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loop);
  else loop();
})();