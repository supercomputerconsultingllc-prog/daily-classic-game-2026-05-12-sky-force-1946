(function(){
  'use strict';
  if(window.__SKY_FORCE_1945_SYSTEMS_V25__) return;
  window.__SKY_FORCE_1945_SYSTEMS_V25__ = true;

  var planes = [
    { id:'falcon', name:'FALCON', speed:1.00, shot:'balanced', bomb:'shockwave', color:'#7ee8ff' },
    { id:'raptor', name:'RAPTOR', speed:1.15, shot:'spread', bomb:'napalm', color:'#ffd86b' },
    { id:'titan', name:'TITAN', speed:0.88, shot:'heavy', bomb:'thunder', color:'#ff8f7e' },
    { id:'ghost', name:'GHOST', speed:1.25, shot:'needle', bomb:'timecut', color:'#b89cff' }
  ];

  var selectedPlane = loadPlane();
  var powerLevel = 1;
  var lastPowerDropAt = 0;
  var lastBombDropAt = 0;
  var lastPlaneFireAt = 0;
  var pickupItems = [];
  var stageBag = shuffle([1,2,3,4]);
  var stageCursor = 0;
  var lastMode = '';
  var installed = false;

  function now(){ return performance.now(); }
  function running(){ return typeof state !== 'undefined' && state.mode === 'running'; }
  function W(){ return typeof WIDTH !== 'undefined' ? WIDTH : 900; }
  function H(){ return typeof HEIGHT !== 'undefined' ? HEIGHT : 1200; }
  function rnd(a,b){ return a + Math.random()*(b-a); }
  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

  function shuffle(arr){
    arr = arr.slice();
    for(var i=arr.length-1;i>0;i--){
      var j=Math.floor(Math.random()*(i+1));
      var t=arr[i]; arr[i]=arr[j]; arr[j]=t;
    }
    return arr;
  }

  function savePlane(){
    try{ localStorage.setItem('skyForce1945PlaneV25', selectedPlane.id); }catch(e){}
  }

  function loadPlane(){
    var id = 'falcon';
    try{ id = localStorage.getItem('skyForce1945PlaneV25') || 'falcon'; }catch(e){}
    return planes.find(function(p){ return p.id === id; }) || planes[0];
  }

  function setPlane(id){
    selectedPlane = planes.find(function(p){ return p.id === id; }) || planes[0];
    savePlane();
    flash('PLANE: ' + selectedPlane.name, 1100);
    updateHud();
  }

  function updateHud(){
    var weapon = document.getElementById('weaponValue');
    var speed = document.getElementById('speedValue');
    if(weapon) weapon.textContent = 'P' + powerLevel;
    if(speed) speed.textContent = selectedPlane.name;
  }

  function installPlaneSelectUi(){
    if(document.getElementById('v25PlaneDock')) return;
    var dock = document.createElement('div');
    dock.id = 'v25PlaneDock';
    dock.innerHTML = planes.map(function(p){
      return '<button type="button" data-plane="'+p.id+'">'+p.name+'</button>';
    }).join('');
    document.body.appendChild(dock);
    dock.addEventListener('click', function(e){
      var id = e.target && e.target.dataset ? e.target.dataset.plane : '';
      if(id) setPlane(id);
    });

    var style = document.createElement('style');
    style.id = 'v25PlaneStyle';
    style.textContent = [
      '#v25PlaneDock{position:fixed;left:7px;right:7px;top:max(44px,env(safe-area-inset-top));z-index:10070;display:grid;grid-template-columns:repeat(4,1fr);gap:4px;pointer-events:auto;}',
      '#v25PlaneDock button{min-height:28px;border-radius:10px;border:1px solid rgba(190,235,255,.55);background:rgba(5,23,43,.58);color:#fff;font:900 9px/1 system-ui;text-shadow:0 1px 4px #000;}',
      'body.v25-running #v25PlaneDock{opacity:.12;pointer-events:none;}',
      'body.v25-menu #v25PlaneDock{opacity:1;pointer-events:auto;}',
      '#v25PickupFlash{position:fixed;top:94px;left:0;right:0;text-align:center;z-index:10110;color:#fff;font:900 18px/1 system-ui;text-shadow:0 3px 8px #000,0 0 18px #5ee7ff;pointer-events:none;opacity:0;transition:opacity .16s ease;}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function bodyModeClass(){
    if(typeof state === 'undefined') return;
    document.body.classList.toggle('v25-running', state.mode === 'running');
    document.body.classList.toggle('v25-menu', state.mode !== 'running');
  }

  function addShot(x,y,w,h,vx,vy,damage,kind){
    if(typeof playerBullets === 'undefined') return;
    playerBullets.push({ x:x, y:y, width:w, height:h, vx:vx, vy:vy, damage:damage, kind:kind, v25:true, life:180 });
  }

  function planeFire(){
    if(!running() || typeof player === 'undefined' || typeof playerBullets === 'undefined') return;
    var t = now();
    var cadence = selectedPlane.shot === 'heavy' ? 390 : selectedPlane.shot === 'needle' ? 250 : 315;
    if(t - lastPlaneFireAt < cadence) return;
    lastPlaneFireAt = t;

    var lvl = powerLevel;
    var cx = player.x + player.width/2;
    var y = player.y + player.height*.14;
    var dmg = selectedPlane.shot === 'heavy' ? 2.2 : selectedPlane.shot === 'needle' ? 1.15 : 1.45;

    if(selectedPlane.shot === 'spread'){
      addShot(cx-6,y-32,12,34,0,-10.5,dmg,'spread-center');
      if(lvl>=2){ addShot(cx-34,y-8,12,32,-1.1,-9.6,1.05,'spread-l'); addShot(cx+22,y-8,12,32,1.1,-9.6,1.05,'spread-r'); }
      if(lvl>=3){ addShot(cx-58,y+12,12,31,-1.8,-8.8,1.0,'spread-ol'); addShot(cx+46,y+12,12,31,1.8,-8.8,1.0,'spread-or'); }
      if(lvl>=4){ addShot(cx-10,y-58,20,46,0,-8.9,2.2,'spread-core'); }
    } else if(selectedPlane.shot === 'heavy'){
      addShot(cx-13,y-42,26,50,0,-8.5,dmg,'heavy-cannon');
      if(lvl>=2){ addShot(cx-38,y-14,18,38,-.45,-8.1,1.65,'heavy-l'); addShot(cx+20,y-14,18,38,.45,-8.1,1.65,'heavy-r'); }
      if(lvl>=3){ addShot(cx-7,y-76,14,60,0,-7.7,3.2,'heavy-pierce'); }
      if(lvl>=4){ addShot(cx-66,y+22,16,34,-1.1,-7.3,1.5,'heavy-ol'); addShot(cx+50,y+22,16,34,1.1,-7.3,1.5,'heavy-or'); }
    } else if(selectedPlane.shot === 'needle'){
      addShot(cx-4,y-46,8,52,0,-12.4,dmg,'needle');
      if(lvl>=2){ addShot(cx-20,y-24,8,48,-.35,-12.0,1.0,'needle-l'); addShot(cx+12,y-24,8,48,.35,-12.0,1.0,'needle-r'); }
      if(lvl>=3){ addShot(cx-36,y-4,8,44,-.8,-11.4,.95,'needle-ol'); addShot(cx+28,y-4,8,44,.8,-11.4,.95,'needle-or'); }
      if(lvl>=4){ addShot(cx-6,y-78,12,62,0,-13.1,2.1,'needle-core'); }
    } else {
      addShot(cx-7,y-38,14,38,0,-10.4,dmg,'balanced');
      if(lvl>=2){ addShot(cx-30,y-12,12,34,-.6,-9.8,1.1,'balanced-l'); addShot(cx+18,y-12,12,34,.6,-9.8,1.1,'balanced-r'); }
      if(lvl>=3){ addShot(cx-50,y+14,12,34,-1.1,-9.1,1.0,'balanced-ol'); addShot(cx+38,y+14,12,34,1.1,-9.1,1.0,'balanced-or'); }
      if(lvl>=4){ addShot(cx-10,y-62,20,48,0,-9.3,2.4,'balanced-core'); }
    }
  }

  function spawnPickup(type,x,y){
    pickupItems.push({ type:type, x:x, y:y, width:34, height:34, vy:2.15, wobble:rnd(0,6.28), born:now() });
  }

  function maybeDropPickups(){
    if(!running()) return;
    var t = now();
    if(t - lastPowerDropAt > 12500){
      lastPowerDropAt = t;
      spawnPickup('P', rnd(80,W()-115), -38);
    }
    if(t - lastBombDropAt > 27000){
      lastBombDropAt = t;
      spawnPickup('B', rnd(80,W()-115), -44);
    }
  }

  function updatePickups(){
    if(typeof player === 'undefined') return;
    for(var i=pickupItems.length-1;i>=0;i--){
      var p = pickupItems[i];
      p.y += p.vy;
      p.x += Math.sin((now()-p.born)/350 + p.wobble) * .65;
      if(p.y > H()+70){ pickupItems.splice(i,1); continue; }
      var hit = p.x < player.x + player.width && p.x+p.width > player.x && p.y < player.y+player.height && p.y+p.height > player.y;
      if(hit){
        if(p.type === 'P'){
          powerLevel = Math.min(4, powerLevel + 1);
          if(typeof state !== 'undefined') state.power = Math.max(state.power || 1, powerLevel);
          flash('POWER UP P' + powerLevel, 900);
        } else {
          if(typeof state !== 'undefined') state.bombs = Math.min(9, (state.bombs || 0) + 1);
          if(typeof updateHud === 'function') updateHud();
          flash('BOMB +1', 900);
        }
        updateHud();
        pickupItems.splice(i,1);
      }
    }
  }

  function drawPickups(){
    if(typeof ctx === 'undefined') return;
    pickupItems.forEach(function(p){
      ctx.save();
      ctx.globalAlpha = .95;
      ctx.translate(p.x+p.width/2, p.y+p.height/2);
      ctx.rotate(Math.sin((now()-p.born)/260)*.18);
      ctx.fillStyle = p.type === 'P' ? '#49e6ff' : '#ffcf4a';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0,0,18,0,Math.PI*2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#062337';
      ctx.font = '900 21px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.type,0,1);
      ctx.restore();
    });
  }

  function bombClear(){
    if(typeof enemyBullets !== 'undefined') enemyBullets.length = 0;
    if(typeof enemies !== 'undefined'){
      enemies.forEach(function(e){ if(e && !/boss/i.test(String(e.type||''))) e.hp = Math.max(0, (e.hp || 1) - 4); });
    }
    flash(selectedPlane.bomb.toUpperCase() + ' CLEAR', 900);
  }

  function installBombHook(){
    if(typeof triggerBomb === 'function' && !triggerBomb.__v25PickupClear){
      var original = triggerBomb;
      triggerBomb = function(){
        var result = original.apply(this, arguments);
        bombClear();
        return result;
      };
      triggerBomb.__v25PickupClear = true;
    }
  }

  function installRandomStageHook(){
    if(typeof startStage === 'function' && !startStage.__v25RandomOrder){
      var originalStartStage = startStage;
      startStage = function(){
        if(typeof state !== 'undefined' && state.stage <= 4){
          if(stageCursor >= stageBag.length){ stageBag = shuffle([1,2,3,4]); stageCursor = 0; }
          state.stage = stageBag[stageCursor++];
          flash('RANDOM STAGE ' + state.stage, 850);
        }
        return originalStartStage.apply(this, arguments);
      };
      startStage.__v25RandomOrder = true;
    }
  }

  function installDrawHook(){
    if(typeof draw === 'function' && !draw.__v25Pickups){
      var originalDraw = draw;
      draw = function(){
        var result = originalDraw.apply(this, arguments);
        drawPickups();
        return result;
      };
      draw.__v25Pickups = true;
    }
  }

  function flash(text,ms){
    var el = document.getElementById('v25PickupFlash');
    if(!el){
      el = document.createElement('div');
      el.id = 'v25PickupFlash';
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.style.opacity = '1';
    clearTimeout(el.__timer);
    el.__timer = setTimeout(function(){ el.style.opacity = '0'; }, ms || 900);
  }

  function modeWatch(){
    if(typeof state === 'undefined') return;
    if(state.mode !== lastMode){
      lastMode = state.mode;
      bodyModeClass();
      if(state.mode === 'running'){
        powerLevel = Math.max(1, Math.min(4, state.power || powerLevel || 1));
        lastPowerDropAt = now() - 8500;
        lastBombDropAt = now() - 20500;
      }
    }
  }

  function loop(){
    if(!installed){
      installPlaneSelectUi();
      installed = true;
    }
    installBombHook();
    installRandomStageHook();
    installDrawHook();
    modeWatch();
    bodyModeClass();
    updateHud();
    planeFire();
    maybeDropPickups();
    updatePickups();
    requestAnimationFrame(loop);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loop);
  else loop();
})();