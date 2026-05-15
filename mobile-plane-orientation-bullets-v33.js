(function(){
  'use strict';
  if(window.__SKY_FORCE_PLANE_ORIENTATION_BULLETS_V33__) return;
  window.__SKY_FORCE_PLANE_ORIENTATION_BULLETS_V33__ = true;
  document.documentElement.dataset.v33PlaneBulletFix = 'active';

  const PLANES = {
    falcon: { id:'falcon', name:'FALCON', hp:5, speed:1.00, sprite:'assets/player-plane.png', bullet:'assets/bullet-player.png', width:96, height:118, flip:false },
    raptor: { id:'raptor', name:'RAPTOR', hp:4, speed:1.18, sprite:'assets/enemy-fighter.png', bullet:'assets/weapons-projectiles-sheet.png', width:96, height:118, flip:true },
    titan: { id:'titan', name:'TITAN', hp:7, speed:0.82, sprite:'assets/enemy-heavy.png', bullet:'assets/weapons-ordnance-sheet.png', width:120, height:140, flip:true },
    ghost: { id:'ghost', name:'GHOST', hp:3, speed:1.32, sprite:'assets/enemy-scout.png', bullet:'assets/bullet-player.png', width:82, height:108, flip:false }
  };

  const sprites = {};
  Object.values(PLANES).forEach(function(p){
    sprites[p.id] = new Image();
    sprites[p.id].src = p.sprite;
    sprites[p.id + '_bullet'] = new Image();
    sprites[p.id + '_bullet'].src = p.bullet;
  });
  sprites.missile = new Image();
  sprites.missile.src = 'assets/weapons-ordnance-sheet.png';
  sprites.heatseek = new Image();
  sprites.heatseek.src = 'assets/weapons-projectiles-sheet.png';

  const enemyBulletAsset = createEnemyBulletAsset();

  function activePlaneId(){
    try { return localStorage.getItem('skyForceV32SelectedPlane') || 'falcon'; }
    catch(e){ return 'falcon'; }
  }

  function activePlane(){
    return PLANES[activePlaneId()] || PLANES.falcon;
  }

  function createEnemyBulletAsset(){
    const c = document.createElement('canvas');
    c.width = 192;
    c.height = 288;
    const g = c.getContext('2d');

    function ellipse(x,y,w,h,fill,blur){
      const l = document.createElement('canvas');
      l.width = c.width;
      l.height = c.height;
      const xg = l.getContext('2d');
      xg.fillStyle = fill;
      xg.beginPath();
      xg.ellipse(x,y,w,h,0,0,Math.PI*2);
      xg.fill();
      if(blur){ xg.filter = 'blur(' + blur + 'px)'; }
      g.drawImage(l,0,0);
    }

    const outer = g.createRadialGradient(96,140,2,96,140,118);
    outer.addColorStop(0,'rgba(255,255,255,1)');
    outer.addColorStop(.18,'rgba(255,246,145,.96)');
    outer.addColorStop(.48,'rgba(255,126,42,.92)');
    outer.addColorStop(.78,'rgba(255,42,20,.54)');
    outer.addColorStop(1,'rgba(255,20,0,0)');
    g.fillStyle = outer;
    g.beginPath();
    g.ellipse(96,142,70,126,0,0,Math.PI*2);
    g.fill();

    const core = g.createLinearGradient(0,268,0,12);
    core.addColorStop(0,'rgba(255,52,17,.15)');
    core.addColorStop(.38,'rgba(255,122,30,.95)');
    core.addColorStop(.68,'rgba(255,240,102,.98)');
    core.addColorStop(1,'rgba(255,255,255,1)');
    g.fillStyle = core;
    g.strokeStyle = 'rgba(255,255,255,.88)';
    g.lineWidth = 8;
    g.beginPath();
    g.moveTo(96,8);
    g.bezierCurveTo(142,70,146,184,96,278);
    g.bezierCurveTo(46,184,50,70,96,8);
    g.closePath();
    g.fill();
    g.stroke();

    g.globalAlpha = .78;
    g.fillStyle = 'rgba(255,255,255,.86)';
    g.beginPath();
    g.ellipse(96,102,18,54,0,0,Math.PI*2);
    g.fill();
    g.globalAlpha = 1;

    g.strokeStyle = 'rgba(255,245,180,.7)';
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(72,42);
    g.bezierCurveTo(48,106,52,182,82,240);
    g.stroke();
    g.beginPath();
    g.moveTo(120,44);
    g.bezierCurveTo(142,108,138,180,110,238);
    g.stroke();

    const tail = g.createRadialGradient(96,260,4,96,260,58);
    tail.addColorStop(0,'rgba(255,238,88,.9)');
    tail.addColorStop(.5,'rgba(255,64,16,.5)');
    tail.addColorStop(1,'rgba(255,0,0,0)');
    g.fillStyle = tail;
    g.beginPath();
    g.ellipse(96,258,46,60,0,0,Math.PI*2);
    g.fill();

    const img = new Image();
    img.src = c.toDataURL('image/png');
    return img;
  }

  function installCss(){
    let style = document.getElementById('v33PlaneBulletCss');
    if(!style){
      style = document.createElement('style');
      style.id = 'v33PlaneBulletCss';
      document.head.appendChild(style);
    }
    style.textContent = `
      #v32PlanePanel .v32PlaneCard[data-plane="raptor"] img,
      #v32PlanePanel .v32PlaneCard[data-plane="titan"] img {
        transform: rotate(180deg) !important;
        transform-origin: center center !important;
      }
    `;
  }

  function drawImage(img, x, y, w, h, radians){
    if(typeof ctx === 'undefined' || !img) return;
    ctx.save();
    ctx.translate(x + w/2, y + h/2);
    if(radians) ctx.rotate(radians);
    ctx.drawImage(img, -w/2, -h/2, w, h);
    ctx.restore();
  }

  function installDrawPlayerOverride(){
    if(typeof drawPlayer !== 'function') return false;
    if(drawPlayer.__v33FlippedPlanes) return true;

    drawPlayer = function(nowMs){
      if(typeof ctx === 'undefined' || typeof player === 'undefined') return;
      const p = activePlane();
      const sprite = sprites[p.id];
      const invul = typeof state !== 'undefined' && (nowMs < state.invulnerableUntil || nowMs < state.bombActiveUntil);

      if(invul && Math.floor(nowMs / 90) % 2 === 0) ctx.globalAlpha = 0.45;
      ctx.save();
      ctx.shadowColor = 'rgba(139, 218, 255, 0.78)';
      ctx.shadowBlur = 16;
      const w = p.width;
      const h = p.height;
      const x = player.x + player.width / 2 - w / 2;
      const y = player.y + player.height / 2 - h / 2;
      drawImage(sprite, x, y, w, h, p.flip ? Math.PI : 0);
      ctx.restore();
      ctx.globalAlpha = 1;

      if(typeof optionDrones !== 'undefined' && typeof images !== 'undefined'){
        for(const opt of optionDrones){
          const ox = opt.x - opt.width / 2;
          const oy = opt.y - opt.height / 2;
          ctx.save();
          ctx.shadowColor = 'rgba(170, 225, 255, 0.8)';
          ctx.shadowBlur = 14;
          ctx.drawImage(images.option, ox, oy, opt.width, opt.height);
          ctx.restore();
        }
      }

      if(typeof playerHitbox === 'function'){
        const hitbox = playerHitbox();
        ctx.fillStyle = 'rgba(255, 255, 140, 0.75)';
        ctx.beginPath();
        ctx.arc(hitbox.x + 3, hitbox.y + 3, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    drawPlayer.__v33FlippedPlanes = true;
    drawPlayer.__v32RealAsset = true;
    return true;
  }

  function installDrawBulletsOverride(){
    if(typeof drawBullets !== 'function') return false;
    if(drawBullets.__v33SmallerEnemyBullets) return true;

    drawBullets = function(){
      if(typeof ctx === 'undefined') return;

      if(typeof playerBullets !== 'undefined'){
        for(const bullet of playerBullets){
          const planeId = bullet.planeId || activePlaneId();
          const key = bullet.homing ? 'heatseek' : bullet.missile ? 'missile' : `${planeId}_bullet`;
          const sprite = sprites[key] || sprites[`${activePlaneId()}_bullet`] || sprites.falcon_bullet;
          const w = bullet.missile || bullet.homing ? 22 : Math.max(14, (bullet.width || 12) + 6);
          const h = bullet.missile || bullet.homing ? 42 : Math.max(30, (bullet.height || 24) + 8);
          const rot = Math.atan2((bullet.vy || -1), (bullet.vx || 0)) + Math.PI / 2;
          drawImage(sprite, bullet.x + bullet.width/2 - w/2, bullet.y + bullet.height/2 - h/2, w, h, rot);
        }
      }

      if(typeof enemyBullets !== 'undefined'){
        for(const bullet of enemyBullets){
          const w = 18;
          const h = 27;
          const rot = Math.atan2((bullet.vy || 1), (bullet.vx || 0)) - Math.PI / 2;
          drawImage(enemyBulletAsset, bullet.x + bullet.width/2 - w/2, bullet.y + bullet.height/2 - h/2, w, h, rot);
        }
      }
    };
    drawBullets.__v33SmallerEnemyBullets = true;
    drawBullets.__v32RealAssets = true;
    return true;
  }

  function normalizeEnemyBulletHitboxes(){
    if(typeof enemyBullets === 'undefined') return;
    for(const b of enemyBullets){
      if(!b) continue;
      if((b.width || 0) > 14){
        const cx = b.x + b.width/2;
        b.width = 12;
        b.x = cx - b.width/2;
      }
      if((b.height || 0) > 22){
        const cy = b.y + b.height/2;
        b.height = 18;
        b.y = cy - b.height/2;
      }
    }
  }

  function loop(){
    installCss();
    installDrawPlayerOverride();
    installDrawBulletsOverride();
    normalizeEnemyBulletHitboxes();
    requestAnimationFrame(loop);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loop);
  else loop();
})();