(function(){
  'use strict';
  if(window.__SKY_FORCE_REAL_PLANE_ASSETS_V32__) return;
  window.__SKY_FORCE_REAL_PLANE_ASSETS_V32__ = true;
  document.documentElement.dataset.v32RealPlaneAssets = 'active';

  const PLANES = {
    falcon: {
      id: 'falcon', name: 'FALCON', role: 'Balanced Fighter', hp: 5, speed: 1.00,
      sprite: 'assets/player-plane.png', thumb: 'assets/player-plane.png',
      weapon: 'Twin Cannon', bomb: 'Shockwave', bullet: 'assets/bullet-player.png',
      fireMs: 140, width: 96, height: 118
    },
    raptor: {
      id: 'raptor', name: 'RAPTOR', role: 'Agile Interceptor', hp: 4, speed: 1.18,
      sprite: 'assets/enemy-fighter.png', thumb: 'assets/enemy-fighter.png',
      weapon: 'Wide Spread Shot', bomb: 'Forward Burst', bullet: 'assets/weapons-projectiles-sheet.png',
      fireMs: 165, width: 96, height: 118
    },
    titan: {
      id: 'titan', name: 'TITAN', role: 'Armored Gunship', hp: 7, speed: 0.82,
      sprite: 'assets/enemy-heavy.png', thumb: 'assets/enemy-heavy.png',
      weapon: 'Heavy Piercing Cannon', bomb: 'Thunder Blast', bullet: 'assets/weapons-ordnance-sheet.png',
      fireMs: 230, width: 120, height: 140
    },
    ghost: {
      id: 'ghost', name: 'GHOST', role: 'Needle Striker', hp: 3, speed: 1.32,
      sprite: 'assets/enemy-scout.png', thumb: 'assets/enemy-scout.png',
      weapon: 'Needle Lance', bomb: 'Time Cut', bullet: 'assets/bullet-player.png',
      fireMs: 95, width: 82, height: 108
    }
  };

  const SPRITES = {};
  Object.values(PLANES).forEach((p) => {
    SPRITES[p.id] = new Image();
    SPRITES[p.id].src = p.sprite;
    SPRITES[p.id + '_bullet'] = new Image();
    SPRITES[p.id + '_bullet'].src = p.bullet;
  });
  SPRITES.enemyBullet = new Image();
  SPRITES.enemyBullet.src = 'assets/bullet-enemy.png';
  SPRITES.missile = new Image();
  SPRITES.missile.src = 'assets/weapons-ordnance-sheet.png';
  SPRITES.heatseek = new Image();
  SPRITES.heatseek.src = 'assets/weapons-projectiles-sheet.png';

  let selectedPlaneId = localStorage.getItem('skyForceV32SelectedPlane') || 'falcon';
  let maxHealth = activePlane().hp;
  let health = maxHealth;
  let lastLives = null;
  let lastMode = '';
  let lastFire = 0;

  function activePlane(){ return PLANES[selectedPlaneId] || PLANES.falcon; }
  function savePlane(){ localStorage.setItem('skyForceV32SelectedPlane', selectedPlaneId); }
  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

  function installCss(){
    if(document.getElementById('v32RealPlaneCss')) return;
    const style = document.createElement('style');
    style.id = 'v32RealPlaneCss';
    style.textContent = `
      #v25PlaneDock, #v27PlaneTab, #v27PlanePanel, #v28PlaneTab, #v28PlanePanel { display: none !important; visibility: hidden !important; pointer-events: none !important; }
      #v32PlaneTab {
        position: fixed !important; left: 7px !important; bottom: 50px !important; z-index: 14000 !important;
        min-height: 32px !important; padding: 6px 14px !important; border-radius: 13px !important;
        border: 1px solid rgba(190,235,255,.8) !important; color: white !important;
        background: linear-gradient(180deg, rgba(17,92,141,.92), rgba(4,28,58,.98)) !important;
        font: 900 10px/1 system-ui, sans-serif !important; box-shadow: 0 0 14px rgba(76,201,255,.28) !important;
      }
      #v32PlanePanel {
        position: fixed !important; left: 8px !important; right: 8px !important; bottom: 94px !important; z-index: 13999 !important;
        display: none !important; padding: 10px !important; border-radius: 16px !important;
        border: 1px solid rgba(157,227,255,.75) !important; background: rgba(2,12,26,.96) !important;
        box-shadow: 0 16px 38px rgba(0,0,0,.5) !important; color: white !important;
      }
      #v32PlanePanel.open { display: block !important; }
      .v32Title { text-align: center; font: 900 14px/1.1 system-ui, sans-serif; margin-bottom: 8px; }
      .v32Grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 8px; }
      .v32PlaneCard {
        min-height: 116px !important; border-radius: 14px !important; border: 1px solid rgba(255,255,255,.24) !important;
        background: linear-gradient(180deg, rgba(18,79,118,.78), rgba(5,24,46,.95)) !important;
        color: white !important; padding: 7px !important; text-align: left !important; font: 800 10px/1.15 system-ui, sans-serif !important;
        overflow: hidden !important;
      }
      .v32PlaneCard.active { outline: 2px solid #7ee8ff !important; box-shadow: 0 0 18px rgba(126,232,255,.45) !important; }
      .v32PlaneCard img { float: right; width: 56px; height: 78px; object-fit: contain; image-rendering: auto; filter: drop-shadow(0 0 8px rgba(120,220,255,.55)); }
      .v32PlaneCard b { display: block; font-size: 14px; margin-bottom: 3px; letter-spacing: .5px; }
      .v32PlaneCard small { display: block; color: rgba(232,246,255,.9); font-weight: 800; }
      #v32Health {
        position: fixed !important; left: 6px !important; right: 6px !important; top: max(5px, env(safe-area-inset-top)) !important;
        z-index: 14100 !important; height: 18px !important; border: 1px solid rgba(255,255,255,.72) !important;
        border-radius: 999px !important; background: rgba(2,10,18,.46) !important; overflow: hidden !important;
        box-shadow: 0 2px 10px rgba(0,0,0,.5) !important; pointer-events: none !important;
      }
      #v32HealthFill { height: 100%; width: 100%; background: linear-gradient(90deg,#22ff88,#ffec4a,#ff4a3d); box-shadow: 0 0 16px rgba(80,255,168,.6); }
      #v32HealthText { position:absolute; inset:0; text-align:center; color:white; font:900 11px/18px system-ui; text-shadow:0 1px 4px #000; }
      .hud .chip:not(.v27-keep) { display:none !important; }
    `;
    document.head.appendChild(style);
  }

  function installPlaneUi(){
    installCss();
    ['v25PlaneDock','v27PlaneTab','v27PlanePanel','v28PlaneTab','v28PlanePanel'].forEach((id) => {
      const el = document.getElementById(id);
      if(el) el.remove();
    });
    if(!document.getElementById('v32PlaneTab')){
      const tab = document.createElement('button');
      tab.id = 'v32PlaneTab';
      tab.type = 'button';
      tab.textContent = 'PLANES';
      document.body.appendChild(tab);
      tab.addEventListener('click', () => {
        const panel = document.getElementById('v32PlanePanel');
        if(panel) panel.classList.toggle('open');
      });
    }
    if(!document.getElementById('v32PlanePanel')){
      const panel = document.createElement('div');
      panel.id = 'v32PlanePanel';
      panel.innerHTML = '<div class="v32Title">Select Plane</div><div class="v32Grid">' +
        Object.values(PLANES).map((p) => `
          <button type="button" class="v32PlaneCard" data-plane="${p.id}">
            <img src="${p.thumb}" alt="${p.name} aircraft asset">
            <b>${p.name}</b>
            <small>${p.role}<br>${p.weapon}<br>${p.bomb} • HP ${p.hp}</small>
          </button>`).join('') + '</div>';
      document.body.appendChild(panel);
      panel.addEventListener('click', (event) => {
        const card = event.target.closest('.v32PlaneCard');
        if(!card) return;
        selectedPlaneId = card.dataset.plane || 'falcon';
        savePlane();
        maxHealth = activePlane().hp;
        health = maxHealth;
        if(typeof state !== 'undefined'){
          state.power = Math.max(state.power || 1, 2);
          syncHudSafe();
        }
        updatePlaneCards();
        updateHealthBar();
        panel.classList.remove('open');
      });
    }
    updatePlaneCards();
  }

  function updatePlaneCards(){
    document.querySelectorAll('.v32PlaneCard').forEach((card) => {
      card.classList.toggle('active', card.dataset.plane === selectedPlaneId);
    });
  }

  function installHealth(){
    const old27 = document.getElementById('v27Health');
    if(old27) old27.remove();
    const old28 = document.getElementById('v28Health');
    if(old28) old28.remove();
    if(document.getElementById('v32Health')) return;
    const bar = document.createElement('div');
    bar.id = 'v32Health';
    bar.innerHTML = '<div id="v32HealthFill"></div><div id="v32HealthText"></div>';
    document.body.appendChild(bar);
  }

  function updateHealthBar(){
    installHealth();
    const fill = document.getElementById('v32HealthFill');
    const text = document.getElementById('v32HealthText');
    const p = activePlane();
    const pct = clamp(health / maxHealth, 0, 1);
    if(fill) fill.style.width = `${Math.round(pct * 100)}%`;
    if(text) text.textContent = `${p.name} HEALTH ${health}/${maxHealth}`;
  }

  function syncHudSafe(){
    try { if(typeof syncHud === 'function') syncHud(); } catch(e) {}
  }

  function installCoreOverrides(){
    if(typeof drawStageHints === 'function' && !drawStageHints.__v32Clean){
      drawStageHints = function(nowMs){
        if(typeof state === 'undefined' || typeof ctx === 'undefined') return;
        if(performance.now() < state.bannerUntil){
          const width = typeof WIDTH !== 'undefined' ? WIDTH : 900;
          const height = typeof HEIGHT !== 'undefined' ? HEIGHT : 1200;
          const centerX = width / 2;
          ctx.fillStyle = 'rgba(8, 13, 20, 0.34)';
          ctx.fillRect(centerX - 220, height / 2 - 34, 440, 68);
          ctx.strokeStyle = 'rgba(255, 230, 180, 0.68)';
          ctx.strokeRect(centerX - 220, height / 2 - 34, 440, 68);
          ctx.fillStyle = '#fff0cc';
          ctx.font = 'bold 24px Courier New, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(state.bannerText || '', centerX, height / 2 + 9);
          ctx.textAlign = 'start';
        }
      };
      drawStageHints.__v32Clean = true;
    }

    if(typeof currentPlayerSpeed === 'function' && !currentPlayerSpeed.__v32PlaneSpeed){
      currentPlayerSpeed = function(){
        const base = (typeof player !== 'undefined' ? player.speedBase : 240) + ((typeof state !== 'undefined' ? state.speedLevel : 1) - 1) * 30;
        return base * activePlane().speed;
      };
      currentPlayerSpeed.__v32PlaneSpeed = true;
    }

    if(typeof firePlayer === 'function' && !firePlayer.__v32PlaneWeapons){
      firePlayer = function(nowMs){
        const p = activePlane();
        if(nowMs - lastFire < p.fireMs) return;
        lastFire = nowMs;
        if(typeof playerBullets === 'undefined' || typeof player === 'undefined') return;
        const cx = player.x + player.width / 2;
        const cy = player.y + player.height * 0.12;
        const power = typeof state !== 'undefined' ? Math.max(1, state.power || 1) : 1;
        const add = (x,y,vx,vy,w,h,damage,kind) => playerBullets.push({ x, y, vx, vy, width:w, height:h, damage, planeId:p.id, assetKind:kind || p.id, v32:true });

        if(p.id === 'falcon'){
          add(cx - 17, cy - 28, -0.08, -13.8, 12, 32, 1.15, 'falcon');
          add(cx + 5, cy - 28, 0.08, -13.8, 12, 32, 1.15, 'falcon');
          if(power >= 3){ add(cx - 34, cy - 10, -0.65, -12.6, 11, 30, 0.9, 'falcon'); add(cx + 23, cy - 10, 0.65, -12.6, 11, 30, 0.9, 'falcon'); }
        } else if(p.id === 'raptor'){
          [-1.45,-0.75,0,0.75,1.45].forEach((vx,idx) => add(cx - 6 + vx*7, cy - 22 + Math.abs(vx)*4, vx, -12.2, 12, 30, idx===2 ? 1.05 : 0.82, 'raptor'));
          if(power >= 4){ add(cx - 52, cy + 6, -2.25, -10.7, 12, 28, 0.7, 'raptor'); add(cx + 40, cy + 6, 2.25, -10.7, 12, 28, 0.7, 'raptor'); }
        } else if(p.id === 'titan'){
          add(cx - 14, cy - 48, 0, -10.2, 28, 58, 3.6, 'titan');
          if(power >= 2){ add(cx - 42, cy - 20, -0.35, -9.1, 18, 42, 1.8, 'titan'); add(cx + 24, cy - 20, 0.35, -9.1, 18, 42, 1.8, 'titan'); }
        } else {
          add(cx - 5, cy - 62, 0, -16.4, 10, 64, 1.45, 'ghost');
          if(power >= 2){ add(cx - 20, cy - 36, -0.28, -15.1, 9, 54, 0.95, 'ghost'); add(cx + 11, cy - 36, 0.28, -15.1, 9, 54, 0.95, 'ghost'); }
          if(power >= 4){ add(cx - 36, cy - 8, -0.55, -14.2, 9, 46, 0.85, 'ghost'); add(cx + 27, cy - 8, 0.55, -14.2, 9, 46, 0.85, 'ghost'); }
        }
        try { if(typeof tone === 'function') tone(p.id === 'titan' ? 420 : p.id === 'ghost' ? 980 : 760, 0.03, 'square', 0.012); } catch(e) {}
      };
      firePlayer.__v32PlaneWeapons = true;
    }

    if(typeof drawPlayer === 'function' && !drawPlayer.__v32RealAsset){
      drawPlayer = function(nowMs){
        if(typeof ctx === 'undefined' || typeof player === 'undefined') return;
        const p = activePlane();
        const sprite = SPRITES[p.id];
        const invul = typeof state !== 'undefined' && (nowMs < state.invulnerableUntil || nowMs < state.bombActiveUntil);
        if(invul && Math.floor(nowMs / 90) % 2 === 0) ctx.globalAlpha = 0.45;
        ctx.save();
        ctx.shadowColor = 'rgba(139, 218, 255, 0.78)';
        ctx.shadowBlur = 16;
        const w = p.width;
        const h = p.height;
        ctx.drawImage(sprite, player.x + player.width/2 - w/2, player.y + player.height/2 - h/2, w, h);
        ctx.restore();
        ctx.globalAlpha = 1;
        if(typeof optionDrones !== 'undefined' && typeof images !== 'undefined'){
          for(const opt of optionDrones){
            const ox = opt.x - opt.width / 2;
            const oy = opt.y - opt.height / 2;
            ctx.save(); ctx.shadowColor = 'rgba(170, 225, 255, 0.8)'; ctx.shadowBlur = 14;
            ctx.drawImage(images.option, ox, oy, opt.width, opt.height); ctx.restore();
          }
        }
        if(typeof playerHitbox === 'function'){
          const hitbox = playerHitbox();
          ctx.fillStyle = 'rgba(255, 255, 140, 0.75)';
          ctx.beginPath(); ctx.arc(hitbox.x + 3, hitbox.y + 3, 2.2, 0, Math.PI * 2); ctx.fill();
        }
      };
      drawPlayer.__v32RealAsset = true;
    }

    if(typeof drawBullets === 'function' && !drawBullets.__v32RealAssets){
      drawBullets = function(){
        if(typeof ctx === 'undefined') return;
        if(typeof playerBullets !== 'undefined'){
          for(const bullet of playerBullets){
            const key = bullet.homing ? 'heatseek' : bullet.missile ? 'missile' : `${bullet.planeId || selectedPlaneId}_bullet`;
            const sprite = SPRITES[key] || SPRITES[`${selectedPlaneId}_bullet`] || SPRITES.falcon_bullet;
            const w = Math.max(bullet.width + 10, bullet.missile || bullet.homing ? 22 : bullet.width + 6);
            const h = Math.max(bullet.height + 14, bullet.missile || bullet.homing ? 44 : bullet.height + 8);
            ctx.save();
            ctx.translate(bullet.x + bullet.width/2, bullet.y + bullet.height/2);
            ctx.rotate(Math.atan2(bullet.vy || -1, bullet.vx || 0) + Math.PI/2);
            ctx.drawImage(sprite, -w/2, -h/2, w, h);
            ctx.restore();
          }
        }
        if(typeof enemyBullets !== 'undefined'){
          for(const bullet of enemyBullets){
            const sprite = SPRITES.enemyBullet;
            ctx.save(); ctx.translate(bullet.x + bullet.width/2, bullet.y + bullet.height/2);
            ctx.rotate(Math.atan2(bullet.vy || 1, bullet.vx || 0) - Math.PI/2);
            ctx.drawImage(sprite, -18, -24, 36, 48); ctx.restore();
          }
        }
      };
      drawBullets.__v32RealAssets = true;
    }
  }

  function watchHealth(){
    if(typeof state === 'undefined') return;
    if(lastLives === null) lastLives = state.lives;
    if(state.mode !== lastMode){
      lastMode = state.mode;
      if(state.mode === 'running'){
        maxHealth = activePlane().hp;
        health = maxHealth;
        lastLives = state.lives;
      }
    }
    if(typeof state.lives === 'number' && state.lives < lastLives){
      health -= 1;
      if(health > 0){
        state.lives = lastLives;
        syncHudSafe();
      } else {
        lastLives = state.lives;
      }
    } else if(typeof state.lives === 'number'){
      lastLives = state.lives;
    }
    updateHealthBar();
  }

  function ensureWeaponDockVisible(){
    const dock = document.getElementById('v10WeaponDock');
    if(!dock) return;
    dock.style.display = 'grid';
    dock.style.visibility = 'visible';
    dock.style.opacity = '1';
    ['missile','homing','bomb'].forEach((action) => {
      const btn = dock.querySelector(`[data-action="${action}"]`);
      if(btn){ btn.style.display = 'block'; btn.style.visibility = 'visible'; btn.style.opacity = '1'; btn.disabled = false; btn.hidden = false; }
    });
  }

  function loop(){
    installPlaneUi();
    installHealth();
    installCoreOverrides();
    watchHealth();
    ensureWeaponDockVisible();
    requestAnimationFrame(loop);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loop);
  else loop();
})();