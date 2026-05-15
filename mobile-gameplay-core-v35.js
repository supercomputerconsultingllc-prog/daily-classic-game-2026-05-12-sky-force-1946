(function(){
  'use strict';
  if(window.__SKY_FORCE_GAMEPLAY_CORE_V35__) return;
  window.__SKY_FORCE_GAMEPLAY_CORE_V35__ = true;
  document.documentElement.dataset.v35GameplayCore = 'active';

  const PLANES = {
    falcon: {
      id: 'falcon', name: 'FALCON', role: 'Balanced Fighter', hp: 5, speed: 1.00,
      sprite: 'assets/player-plane.png', thumb: 'assets/player-plane.png', bullet: 'assets/bullet-player.png',
      weapon: 'Twin Cannon', bomb: 'Shockwave', fireMs: 140, width: 96, height: 118, flip: false
    },
    raptor: {
      id: 'raptor', name: 'RAPTOR', role: 'Agile Interceptor', hp: 4, speed: 1.18,
      sprite: 'assets/enemy-fighter.png', thumb: 'assets/enemy-fighter.png', bullet: 'assets/weapons-projectiles-sheet.png',
      weapon: 'Wide Spread Shot', bomb: 'Forward Burst', fireMs: 165, width: 96, height: 118, flip: true
    },
    titan: {
      id: 'titan', name: 'TITAN', role: 'Armored Gunship', hp: 7, speed: 0.82,
      sprite: 'assets/enemy-heavy.png', thumb: 'assets/enemy-heavy.png', bullet: 'assets/weapons-ordnance-sheet.png',
      weapon: 'Heavy Piercing Cannon', bomb: 'Thunder Blast', fireMs: 230, width: 120, height: 140, flip: true
    },
    ghost: {
      id: 'ghost', name: 'GHOST', role: 'Needle Striker', hp: 3, speed: 1.32,
      sprite: 'assets/enemy-scout.png', thumb: 'assets/enemy-scout.png', bullet: 'assets/bullet-player.png',
      weapon: 'Needle Lance', bomb: 'Time Cut', fireMs: 95, width: 82, height: 108, flip: false
    }
  };

  const ASSETS = {};
  for(const plane of Object.values(PLANES)){
    ASSETS[plane.id] = new Image();
    ASSETS[plane.id].src = plane.sprite;
    ASSETS[plane.id + '_bullet'] = new Image();
    ASSETS[plane.id + '_bullet'].src = plane.bullet;
  }
  ASSETS.missile = new Image();
  ASSETS.missile.src = 'assets/weapons-ordnance-sheet.png';
  ASSETS.heatseek = new Image();
  ASSETS.heatseek.src = 'assets/weapons-projectiles-sheet.png';
  ASSETS.enemyBullet = createEnemyBulletAsset();

  let selectedPlaneId = readPlaneId();
  let maxHp = activePlane().hp;
  let hp = maxHp;
  let lastMode = '';
  let lastFire = 0;
  let damageInstalled = false;
  let drawInstalled = false;
  let bulletsInstalled = false;
  let speedInstalled = false;
  let hudInstalled = false;
  let enemyBulletInstalled = false;
  let enemyCountInstalled = false;
  let weaponDockInstalled = false;
  let pausePatched = false;
  let lastMusicIndex = -1;
  let musicQueue = [];
  let currentMusic = null;

  function readPlaneId(){
    try { return localStorage.getItem('skyForceV35SelectedPlane') || localStorage.getItem('skyForceV32SelectedPlane') || 'falcon'; }
    catch(e){ return 'falcon'; }
  }

  function savePlaneId(){
    try {
      localStorage.setItem('skyForceV35SelectedPlane', selectedPlaneId);
      localStorage.setItem('skyForceV32SelectedPlane', selectedPlaneId);
    } catch(e) {}
  }

  function activePlane(){ return PLANES[selectedPlaneId] || PLANES.falcon; }
  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
  function now(){ return performance.now(); }
  function running(){ return typeof state !== 'undefined' && state.mode === 'running'; }

  function createEnemyBulletAsset(){
    const c = document.createElement('canvas');
    c.width = 160;
    c.height = 220;
    const g = c.getContext('2d');
    const glow = g.createRadialGradient(80,108,2,80,108,85);
    glow.addColorStop(0,'rgba(255,255,255,1)');
    glow.addColorStop(.22,'rgba(255,245,130,.96)');
    glow.addColorStop(.50,'rgba(255,122,42,.88)');
    glow.addColorStop(.78,'rgba(255,48,22,.46)');
    glow.addColorStop(1,'rgba(255,0,0,0)');
    g.fillStyle = glow;
    g.beginPath();
    g.ellipse(80,110,54,86,0,0,Math.PI*2);
    g.fill();

    const core = g.createLinearGradient(0,204,0,12);
    core.addColorStop(0,'rgba(255,66,20,.18)');
    core.addColorStop(.40,'rgba(255,128,32,.96)');
    core.addColorStop(.70,'rgba(255,240,100,.98)');
    core.addColorStop(1,'rgba(255,255,255,1)');
    g.fillStyle = core;
    g.strokeStyle = 'rgba(255,255,255,.86)';
    g.lineWidth = 7;
    g.beginPath();
    g.moveTo(80,8);
    g.bezierCurveTo(116,58,120,144,80,210);
    g.bezierCurveTo(40,144,44,58,80,8);
    g.closePath();
    g.fill();
    g.stroke();

    g.globalAlpha = .75;
    g.fillStyle = 'rgba(255,255,255,.9)';
    g.beginPath();
    g.ellipse(80,78,14,36,0,0,Math.PI*2);
    g.fill();
    g.globalAlpha = 1;

    const img = new Image();
    img.src = c.toDataURL('image/png');
    return img;
  }

  function installCss(){
    let style = document.getElementById('v35GameplayCoreCss');
    if(!style){
      style = document.createElement('style');
      style.id = 'v35GameplayCoreCss';
      document.head.appendChild(style);
    }
    style.textContent = `
      html, body {
        margin:0!important; padding:0!important; width:100vw!important; max-width:100vw!important;
        height:100vh!important; height:100dvh!important; overflow:hidden!important; background:#020915!important;
      }
      body * { box-sizing:border-box!important; }
      .app, .stage {
        position:fixed!important; inset:0!important; width:100vw!important; max-width:100vw!important; height:100dvh!important;
        margin:0!important; padding:0!important; border:0!important; border-radius:0!important; box-shadow:none!important;
        outline:0!important; overflow:hidden!important; background:transparent!important; transform:none!important;
      }
      canvas#game {
        position:fixed!important; inset:0!important; width:100vw!important; max-width:100vw!important; height:100dvh!important;
        margin:0!important; padding:0!important; display:block!important; border:0!important; border-radius:0!important;
        box-shadow:none!important; outline:0!important; object-fit:fill!important; background:#020915!important;
      }
      .hud, .hud *, .chip, .chip * { background:transparent!important; border:0!important; box-shadow:none!important; outline:0!important; backdrop-filter:none!important; }
      .hud {
        position:fixed!important; top:calc(max(5px, env(safe-area-inset-top)) + 20px)!important; left:6px!important;
        right:auto!important; width:auto!important; max-width:42vw!important; z-index:17020!important; padding:0!important; margin:0!important;
        pointer-events:none!important; overflow:visible!important; display:block!important;
      }
      .hud .chip:not(.v27-keep) { display:none!important; width:0!important; height:0!important; overflow:hidden!important; opacity:0!important; }
      .hud .chip.v27-keep { display:block!important; padding:0!important; margin:0!important; text-shadow:0 2px 5px #000,0 0 8px #000!important; }
      .hud .chip.v27-keep span { font-size:8px!important; line-height:1!important; }
      .hud .chip.v27-keep strong { font-size:14px!important; line-height:1.05!important; }
      .overlay { position:fixed!important; inset:0!important; width:100vw!important; height:100dvh!important; border:0!important; box-shadow:none!important; background:rgba(1,8,18,.08)!important; }
      .overlay p, .controls p { display:none!important; }
      .controls { position:fixed!important; left:0!important; right:0!important; bottom:48px!important; width:100vw!important; max-width:100vw!important; background:transparent!important; border:0!important; box-shadow:none!important; overflow:visible!important; }

      #v25PlaneDock, #v27PlaneTab, #v27PlanePanel, #v28PlaneTab, #v28PlanePanel,
      #v27Health, #v28Health, #v32Health { display:none!important; visibility:hidden!important; pointer-events:none!important; }
      #v32PlaneTab, #v32PlanePanel { display:none!important; visibility:hidden!important; pointer-events:none!important; }

      #v35Health {
        position:fixed!important; left:6px!important; right:6px!important; top:max(5px, env(safe-area-inset-top))!important;
        height:18px!important; z-index:18000!important; border:1px solid rgba(255,255,255,.72)!important; border-radius:999px!important;
        background:rgba(2,10,18,.52)!important; box-shadow:0 2px 10px rgba(0,0,0,.5)!important; overflow:hidden!important; pointer-events:none!important;
      }
      #v35HealthFill { height:100%!important; width:100%!important; background:linear-gradient(90deg,#20ff7d,#f7ff42,#ff3b2f)!important; box-shadow:0 0 16px rgba(80,255,168,.55)!important; transition:width .18s ease!important; }
      #v35HealthText { position:absolute!important; inset:0!important; text-align:center!important; color:#fff!important; font:900 11px/18px system-ui,sans-serif!important; text-shadow:0 1px 4px #000,0 0 6px #000!important; }

      #v35PlaneTab {
        position:fixed!important; left:7px!important; bottom:50px!important; z-index:18020!important; min-height:32px!important; padding:6px 14px!important;
        border-radius:13px!important; border:1px solid rgba(190,235,255,.8)!important; color:white!important;
        background:linear-gradient(180deg, rgba(17,92,141,.92), rgba(4,28,58,.98))!important;
        font:900 10px/1 system-ui,sans-serif!important; box-shadow:0 0 14px rgba(76,201,255,.28)!important;
      }
      #v35PlanePanel {
        position:fixed!important; left:8px!important; right:8px!important; bottom:94px!important; z-index:18019!important; display:none!important;
        padding:10px!important; border-radius:16px!important; border:1px solid rgba(157,227,255,.75)!important;
        background:rgba(2,12,26,.96)!important; box-shadow:0 16px 38px rgba(0,0,0,.5)!important; color:white!important;
      }
      #v35PlanePanel.open { display:block!important; }
      .v35Title { text-align:center; font:900 14px/1.1 system-ui,sans-serif; margin-bottom:8px; }
      .v35Grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
      .v35PlaneCard { min-height:116px!important; border-radius:14px!important; border:1px solid rgba(255,255,255,.24)!important; background:linear-gradient(180deg,rgba(18,79,118,.78),rgba(5,24,46,.95))!important; color:white!important; padding:7px!important; text-align:left!important; font:800 10px/1.15 system-ui,sans-serif!important; overflow:hidden!important; }
      .v35PlaneCard.active { outline:2px solid #7ee8ff!important; box-shadow:0 0 18px rgba(126,232,255,.45)!important; }
      .v35PlaneCard img { float:right; width:56px; height:78px; object-fit:contain; image-rendering:auto; filter:drop-shadow(0 0 8px rgba(120,220,255,.55)); }
      .v35PlaneCard[data-plane="raptor"] img, .v35PlaneCard[data-plane="titan"] img { transform:rotate(180deg)!important; transform-origin:center center!important; }
      .v35PlaneCard b { display:block; font-size:14px; margin-bottom:3px; letter-spacing:.5px; }
      .v35PlaneCard small { display:block; color:rgba(232,246,255,.9); font-weight:800; }

      #v10WeaponDock {
        position:fixed!important; left:7px!important; right:92px!important; bottom:7px!important; z-index:18030!important;
        display:grid!important; grid-template-columns:repeat(3,minmax(0,1fr))!important; gap:6px!important; max-width:none!important; width:auto!important;
        pointer-events:auto!important; visibility:visible!important; opacity:1!important;
      }
      #v10WeaponDock button { display:block!important; visibility:visible!important; opacity:1!important; min-height:38px!important; border-radius:12px!important; border:1px solid rgba(185,235,255,.72)!important; color:#fff!important; background:linear-gradient(180deg,rgba(17,92,141,.92),rgba(4,28,58,.98))!important; font:900 10px/1 system-ui,sans-serif!important; box-shadow:0 0 14px rgba(76,201,255,.28)!important; pointer-events:auto!important; }
    `;
  }

  function installHealth(){
    ['v27Health','v28Health','v32Health'].forEach(id => { const el = document.getElementById(id); if(el) el.remove(); });
    if(!document.getElementById('v35Health')){
      const bar = document.createElement('div');
      bar.id = 'v35Health';
      bar.innerHTML = '<div id="v35HealthFill"></div><div id="v35HealthText"></div>';
      document.body.appendChild(bar);
    }
  }

  function updateHealth(){
    installHealth();
    const p = activePlane();
    const fill = document.getElementById('v35HealthFill');
    const text = document.getElementById('v35HealthText');
    const pct = maxHp > 0 ? clamp(hp/maxHp,0,1) : 0;
    if(fill) fill.style.width = Math.round(pct*100) + '%';
    if(text) text.textContent = p.name + ' HEALTH ' + hp + '/' + maxHp;
  }

  function installPlaneUi(){
    ['v25PlaneDock','v27PlaneTab','v27PlanePanel','v28PlaneTab','v28PlanePanel','v32PlaneTab','v32PlanePanel'].forEach(id => { const el = document.getElementById(id); if(el) el.remove(); });
    if(!document.getElementById('v35PlaneTab')){
      const tab = document.createElement('button');
      tab.id = 'v35PlaneTab';
      tab.type = 'button';
      tab.textContent = 'PLANES';
      document.body.appendChild(tab);
      tab.addEventListener('click', () => {
        const panel = document.getElementById('v35PlanePanel');
        if(panel) panel.classList.toggle('open');
      });
    }
    if(!document.getElementById('v35PlanePanel')){
      const panel = document.createElement('div');
      panel.id = 'v35PlanePanel';
      panel.innerHTML = '<div class="v35Title">Select Plane</div><div class="v35Grid">' + Object.values(PLANES).map(p => `
        <button type="button" class="v35PlaneCard" data-plane="${p.id}">
          <img src="${p.thumb}" alt="${p.name} aircraft asset">
          <b>${p.name}</b>
          <small>${p.role}<br>${p.weapon}<br>${p.bomb} • HP ${p.hp}</small>
        </button>`).join('') + '</div>';
      document.body.appendChild(panel);
      panel.addEventListener('click', event => {
        const card = event.target.closest('.v35PlaneCard');
        if(!card) return;
        selectedPlaneId = card.dataset.plane || 'falcon';
        savePlaneId();
        maxHp = activePlane().hp;
        hp = maxHp;
        if(typeof state !== 'undefined') state.power = Math.max(state.power || 1, 2);
        if(typeof syncHud === 'function') syncHud();
        updatePlaneCards();
        updateHealth();
        panel.classList.remove('open');
      });
    }
    updatePlaneCards();
  }

  function updatePlaneCards(){
    document.querySelectorAll('.v35PlaneCard').forEach(card => card.classList.toggle('active', card.dataset.plane === selectedPlaneId));
  }

  function installWeaponDock(){
    let dock = document.getElementById('v10WeaponDock');
    if(!dock){
      dock = document.createElement('div');
      dock.id = 'v10WeaponDock';
      document.body.appendChild(dock);
    }
    const desired = [['missile','MISSILE'], ['homing','HEAT SEEK'], ['bomb','BOMB']];
    for(const [action,label] of desired){
      let btn = dock.querySelector(`[data-action="${action}"]`);
      if(!btn){
        btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.action = action;
        btn.textContent = label;
        dock.appendChild(btn);
      }
      btn.hidden = false; btn.disabled = false; btn.style.display = 'block'; btn.style.visibility = 'visible'; btn.style.opacity = '1';
    }
    if(!weaponDockInstalled){
      weaponDockInstalled = true;
      dock.addEventListener('click', event => {
        const btn = event.target.closest('button[data-action]');
        if(!btn) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        const action = btn.dataset.action;
        if(action === 'bomb'){
          if(typeof useBomb === 'function') useBomb();
          else if(typeof triggerBomb === 'function') triggerBomb();
          return;
        }
        if((action === 'missile' || action === 'homing') && typeof playerBullets !== 'undefined' && typeof player !== 'undefined'){
          const homing = action === 'homing';
          const cx = player.x + player.width/2;
          const cy = player.y + player.height*0.2;
          [-18,18].forEach(offset => {
            playerBullets.push({
              x: cx + offset - 7, y: cy - 22, width: 14, height: 36,
              vx: offset < 0 ? -0.38 : 0.38, vy: -10.2,
              damage: homing ? 4 : 3.2, missile: true, homing, manualWeapon: true,
              planeId: selectedPlaneId, turnRate: homing ? 0.10 : 0, life: 150
            });
          });
        }
      }, true);
    }
  }

  function drawAsset(img,x,y,w,h,rot){
    if(typeof ctx === 'undefined' || !img) return;
    ctx.save();
    ctx.translate(x+w/2, y+h/2);
    if(rot) ctx.rotate(rot);
    ctx.drawImage(img, -w/2, -h/2, w, h);
    ctx.restore();
  }

  function installOverrides(){
    if(typeof drawStageHints === 'function' && !hudInstalled){
      drawStageHints = function(){
        if(typeof state === 'undefined' || typeof ctx === 'undefined') return;
        if(performance.now() < state.bannerUntil){
          const width = typeof WIDTH !== 'undefined' ? WIDTH : 900;
          const height = typeof HEIGHT !== 'undefined' ? HEIGHT : 1200;
          const centerX = width/2;
          ctx.fillStyle = 'rgba(8,13,20,.34)';
          ctx.fillRect(centerX - 220, height/2 - 34, 440, 68);
          ctx.strokeStyle = 'rgba(255,230,180,.68)';
          ctx.strokeRect(centerX - 220, height/2 - 34, 440, 68);
          ctx.fillStyle = '#fff0cc';
          ctx.font = 'bold 24px Courier New, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(state.bannerText || '', centerX, height/2 + 9);
          ctx.textAlign = 'start';
        }
      };
      drawStageHints.__v35Clean = true;
      hudInstalled = true;
    }

    if(typeof currentPlayerSpeed === 'function' && !speedInstalled){
      currentPlayerSpeed = function(){
        const base = (typeof player !== 'undefined' ? player.speedBase : 240) + ((typeof state !== 'undefined' ? state.speedLevel : 1) - 1) * 30;
        return base * activePlane().speed;
      };
      currentPlayerSpeed.__v35PlaneSpeed = true;
      speedInstalled = true;
    }

    if(typeof firePlayer === 'function'){
      firePlayer = function(t){
        const p = activePlane();
        if(t - lastFire < p.fireMs) return;
        lastFire = t;
        if(typeof playerBullets === 'undefined' || typeof player === 'undefined') return;
        const cx = player.x + player.width/2;
        const cy = player.y + player.height*0.12;
        const power = typeof state !== 'undefined' ? Math.max(1, state.power || 1) : 1;
        const add = (x,y,vx,vy,w,h,damage,kind) => playerBullets.push({ x,y,vx,vy,width:w,height:h,damage,planeId:p.id,assetKind:kind || p.id,v35:true });
        if(p.id === 'falcon'){
          add(cx-17,cy-28,-0.08,-13.8,12,32,1.15,'falcon'); add(cx+5,cy-28,0.08,-13.8,12,32,1.15,'falcon');
          if(power >= 3){ add(cx-34,cy-10,-0.65,-12.6,11,30,.9,'falcon'); add(cx+23,cy-10,0.65,-12.6,11,30,.9,'falcon'); }
        } else if(p.id === 'raptor'){
          [-1.45,-.75,0,.75,1.45].forEach((vx,idx) => add(cx-6+vx*7,cy-22+Math.abs(vx)*4,vx,-12.2,12,30,idx===2?1.05:.82,'raptor'));
          if(power >= 4){ add(cx-52,cy+6,-2.25,-10.7,12,28,.7,'raptor'); add(cx+40,cy+6,2.25,-10.7,12,28,.7,'raptor'); }
        } else if(p.id === 'titan'){
          add(cx-14,cy-48,0,-10.2,28,58,3.6,'titan');
          if(power >= 2){ add(cx-42,cy-20,-.35,-9.1,18,42,1.8,'titan'); add(cx+24,cy-20,.35,-9.1,18,42,1.8,'titan'); }
        } else {
          add(cx-5,cy-62,0,-16.4,10,64,1.45,'ghost');
          if(power >= 2){ add(cx-20,cy-36,-.28,-15.1,9,54,.95,'ghost'); add(cx+11,cy-36,.28,-15.1,9,54,.95,'ghost'); }
          if(power >= 4){ add(cx-36,cy-8,-.55,-14.2,9,46,.85,'ghost'); add(cx+27,cy-8,.55,-14.2,9,46,.85,'ghost'); }
        }
        try { if(typeof tone === 'function') tone(p.id === 'titan' ? 420 : p.id === 'ghost' ? 980 : 760, .03, 'square', .012); } catch(e) {}
      };
      firePlayer.__v35PlaneWeapons = true;
    }

    if(typeof drawPlayer === 'function'){
      drawPlayer = function(t){
        if(typeof ctx === 'undefined' || typeof player === 'undefined') return;
        const p = activePlane();
        const sprite = ASSETS[p.id];
        const invul = typeof state !== 'undefined' && (t < state.invulnerableUntil || t < state.bombActiveUntil);
        if(invul && Math.floor(t/90)%2 === 0) ctx.globalAlpha = .45;
        ctx.save(); ctx.shadowColor = 'rgba(139,218,255,.78)'; ctx.shadowBlur = 16;
        const w = p.width, h = p.height;
        drawAsset(sprite, player.x + player.width/2 - w/2, player.y + player.height/2 - h/2, w, h, p.flip ? Math.PI : 0);
        ctx.restore(); ctx.globalAlpha = 1;
        if(typeof optionDrones !== 'undefined' && typeof images !== 'undefined'){
          for(const opt of optionDrones){ ctx.save(); ctx.shadowColor = 'rgba(170,225,255,.8)'; ctx.shadowBlur = 14; ctx.drawImage(images.option, opt.x - opt.width/2, opt.y - opt.height/2, opt.width, opt.height); ctx.restore(); }
        }
        if(typeof playerHitbox === 'function'){
          const hitbox = playerHitbox(); ctx.fillStyle = 'rgba(255,255,140,.75)'; ctx.beginPath(); ctx.arc(hitbox.x+3, hitbox.y+3, 2.2, 0, Math.PI*2); ctx.fill();
        }
      };
      drawPlayer.__v35RealAsset = true;
    }

    if(typeof drawBullets === 'function'){
      drawBullets = function(){
        if(typeof ctx === 'undefined') return;
        if(typeof playerBullets !== 'undefined'){
          for(const b of playerBullets){
            const key = b.homing ? 'heatseek' : b.missile ? 'missile' : `${b.planeId || selectedPlaneId}_bullet`;
            const sprite = ASSETS[key] || ASSETS[`${selectedPlaneId}_bullet`] || ASSETS.falcon_bullet;
            const w = b.missile || b.homing ? 22 : Math.max(14, (b.width || 12) + 6);
            const h = b.missile || b.homing ? 42 : Math.max(30, (b.height || 24) + 8);
            drawAsset(sprite, b.x + b.width/2 - w/2, b.y + b.height/2 - h/2, w, h, Math.atan2((b.vy || -1), (b.vx || 0)) + Math.PI/2);
          }
        }
        if(typeof enemyBullets !== 'undefined'){
          for(const b of enemyBullets){
            const w = 18, h = 27;
            drawAsset(ASSETS.enemyBullet, b.x + b.width/2 - w/2, b.y + b.height/2 - h/2, w, h, Math.atan2((b.vy || 1), (b.vx || 0)) - Math.PI/2);
          }
        }
      };
      drawBullets.__v35Assets = true;
      bulletsInstalled = true;
    }

    if(typeof damagePlayer === 'function' && !damageInstalled){
      damagePlayer = function(){
        const t = now();
        if(typeof state !== 'undefined' && (t < state.invulnerableUntil || t < state.bombActiveUntil)) return;
        hp -= 1;
        updateHealth();
        if(hp > 0){
          if(typeof state !== 'undefined'){
            state.power = Math.max(1, (state.power || 1) - 1);
            state.invulnerableUntil = t + 1800;
          }
          if(typeof enemyBullets !== 'undefined') enemyBullets = [];
          try { if(typeof player !== 'undefined' && typeof spawnBurst === 'function') spawnBurst(player.x + player.width/2, player.y + player.height/2, 26, '#ffbe8d'); } catch(e) {}
          if(typeof syncHud === 'function') syncHud();
          return;
        }
        if(typeof state !== 'undefined'){
          state.lives -= 1;
          state.power = Math.max(1, (state.power || 1) - 1);
          state.invulnerableUntil = t + 3000;
          if(typeof enemyBullets !== 'undefined') enemyBullets = [];
        }
        if(typeof state !== 'undefined' && state.lives <= 0){
          updateHealth(); if(typeof gameOver === 'function') gameOver(); return;
        }
        maxHp = activePlane().hp; hp = maxHp; updateHealth();
        if(typeof resetPlayerPosition === 'function') resetPlayerPosition();
        if(typeof syncHud === 'function') syncHud();
      };
      damagePlayer.__v35Health = true;
      damageInstalled = true;
    }

    if(typeof spawnEnemyBullet === 'function' && !enemyBulletInstalled){
      const original = spawnEnemyBullet;
      let counter = 0;
      spawnEnemyBullet = function(){ counter += 1; if(counter % 2 === 1) return null; return original.apply(this, arguments); };
      spawnEnemyBullet.__v35HalfFire = true;
      enemyBulletInstalled = true;
    }

    if(typeof spawnEnemy === 'function' && !enemyCountInstalled){
      const original = spawnEnemy;
      let counter = 0;
      let keepUntil = 0;
      spawnEnemy = function(type){
        counter += 1;
        const major = /boss|carrier|gunship|heavy/i.test(String(type || ''));
        if(major || now() < keepUntil) return original.apply(this, arguments);
        if(counter % 2 === 1) return null;
        return original.apply(this, arguments);
      };
      spawnEnemy.__v35HalfCount = true;
      setInterval(() => {
        if(typeof state === 'undefined') return;
        const key = String(state.stage || '') + ':' + String(state.mode || '');
        if(spawnEnemy.__lastKey !== key){ spawnEnemy.__lastKey = key; keepUntil = now() + 2200; }
      }, 500);
      enemyCountInstalled = true;
    }
  }

  function normalize(){
    installCss();
    installHealth();
    installPlaneUi();
    installWeaponDock();
    const canvas = document.getElementById('game');
    if(canvas){ canvas.style.position='fixed'; canvas.style.inset='0'; canvas.style.width='100vw'; canvas.style.height='100dvh'; canvas.style.border='0'; canvas.style.boxShadow='none'; canvas.style.borderRadius='0'; }
    ['.app','.stage','.hud','.chip','.controls'].forEach(sel => document.querySelectorAll(sel).forEach(el => { el.style.border='0'; el.style.boxShadow='none'; el.style.outline='0'; el.style.background='transparent'; }));
    ['v27Health','v28Health','v32Health','v25PlaneDock','v27PlaneTab','v27PlanePanel','v28PlaneTab','v28PlanePanel','v32PlaneTab','v32PlanePanel'].forEach(id => { const el = document.getElementById(id); if(el) el.remove(); });
  }

  function resetRunOrPlane(){
    const stored = readPlaneId();
    const mode = typeof state !== 'undefined' ? state.mode : '';
    if(stored !== selectedPlaneId){
      selectedPlaneId = stored;
      maxHp = activePlane().hp;
      hp = maxHp;
      updateHealth();
      updatePlaneCards();
    }
    if(mode === 'running' && lastMode !== 'running'){
      maxHp = activePlane().hp;
      hp = maxHp;
      updateHealth();
    }
    lastMode = mode;
  }

  function normalizeBullets(){
    if(typeof enemyBullets !== 'undefined'){
      for(const b of enemyBullets){
        if(!b) continue;
        if((b.width || 0) > 14){ const cx = b.x + b.width/2; b.width = 12; b.x = cx - 6; }
        if((b.height || 0) > 22){ const cy = b.y + b.height/2; b.height = 18; b.y = cy - 9; }
      }
    }
    if(typeof playerBullets !== 'undefined'){
      for(let i = playerBullets.length - 1; i >= 0; i -= 1){
        const b = playerBullets[i];
        if(b && (b.v23 || b.v25 || b.v27)) playerBullets.splice(i,1);
      }
    }
  }

  function loop(){
    normalize();
    installOverrides();
    resetRunOrPlane();
    normalizeBullets();
    updateHealth();
    requestAnimationFrame(loop);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loop);
  else loop();
})();