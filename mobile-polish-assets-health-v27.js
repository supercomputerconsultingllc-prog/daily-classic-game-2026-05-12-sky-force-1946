(function(){
  'use strict';
  if(window.__SKY_FORCE_POLISH_ASSETS_HEALTH_V27__) return;
  window.__SKY_FORCE_POLISH_ASSETS_HEALTH_V27__ = true;

  var TRACKS = [
    { title:'Monkeys Spinning Monkeys', artist:'Kevin MacLeod', src:'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Monkeys%20Spinning%20Monkeys.mp3' },
    { title:'Sneaky Snitch', artist:'Kevin MacLeod', src:'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Sneaky%20Snitch.mp3' },
    { title:'Fluffing a Duck', artist:'Kevin MacLeod', src:'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Fluffing%20a%20Duck.mp3' },
    { title:'Hustle Hard', artist:'Kevin MacLeod', src:'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Hustle%20Hard.mp3' },
    { title:'Almost Bliss', artist:'Kevin MacLeod', src:'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Almost%20Bliss.mp3' },
    { title:'Raving Energy', artist:'Kevin MacLeod', src:'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Raving%20Energy.mp3' },
    { title:'Beauty Flow', artist:'Kevin MacLeod', src:'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Beauty%20Flow.mp3' },
    { title:'Sincerely', artist:'Kevin MacLeod', src:'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Sincerely.mp3' },
    { title:'Past Sadness', artist:'Kevin MacLeod', src:'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Past%20Sadness.mp3' }
  ];

  var PLANES = [
    { id:'falcon', name:'FALCON', role:'Balanced fighter', speed:1.00, hp:5, color:'#67e9ff', accent:'#fff27c', weapon:'Twin Cannon', bomb:'Shockwave' },
    { id:'raptor', name:'RAPTOR', role:'Wide spread assault', speed:1.14, hp:4, color:'#ffd35a', accent:'#ff6248', weapon:'Spread Fan', bomb:'Napalm Line' },
    { id:'titan', name:'TITAN', role:'Heavy armor cannon', speed:.86, hp:7, color:'#ff7e72', accent:'#a8f0ff', weapon:'Piercing Rail', bomb:'Thunder Burst' },
    { id:'ghost', name:'GHOST', role:'Fast needle striker', speed:1.26, hp:3, color:'#bd9cff', accent:'#64ffe4', weapon:'Needle Lance', bomb:'Time Cut' }
  ];

  var music = {
    audio:null, enabled:true, queue:[], last:-1, index:-1, volume:.52, started:false
  };

  var selectedPlaneId = loadPlaneId();
  var playerHp = getPlane().hp;
  var maxHp = getPlane().hp;
  var lastLives = null;
  var lastMode = '';
  var assets = {};
  var lastAssetFire = 0;
  var explosionSprites = [];

  function svgUri(svg){ return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }
  function img(svg){ var im = new Image(); im.src = svgUri(svg); return im; }
  function now(){ return performance.now(); }
  function running(){ return typeof state !== 'undefined' && state.mode === 'running'; }
  function W(){ return typeof WIDTH !== 'undefined' ? WIDTH : 900; }
  function H(){ return typeof HEIGHT !== 'undefined' ? HEIGHT : 1200; }
  function getPlane(){ return PLANES.find(function(p){return p.id===selectedPlaneId;}) || PLANES[0]; }
  function savePlaneId(){ try{ localStorage.setItem('skyForceV27Plane', selectedPlaneId); }catch(e){} }
  function loadPlaneId(){ try{ return localStorage.getItem('skyForceV27Plane') || 'falcon'; }catch(e){ return 'falcon'; } }
  function shuffle(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
  function pauseAllAudio(){ document.querySelectorAll('audio,video').forEach(function(a){ try{a.pause();}catch(e){} }); }

  function buildAssets(){
    assets.playerBullets = {
      falcon: img('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 160"><defs><linearGradient id="g" x1="0" x2="0" y1="1" y2="0"><stop stop-color="#0cf"/><stop offset=".48" stop-color="#fff"/><stop offset="1" stop-color="#ffff7a"/></linearGradient><filter id="f"><feGaussianBlur stdDeviation="3"/></filter></defs><ellipse cx="32" cy="82" rx="18" ry="70" fill="#0cf" opacity=".35" filter="url(#f)"/><path d="M32 2 C50 38 49 118 32 158 C15 118 14 38 32 2Z" fill="url(#g)" stroke="#fff" stroke-width="4"/></svg>'),
      raptor: img('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 160"><defs><linearGradient id="g" x1="0" x2="0" y1="1" y2="0"><stop stop-color="#ff4b1e"/><stop offset=".55" stop-color="#ffd35a"/><stop offset="1" stop-color="#fff"/></linearGradient></defs><path d="M40 0 L70 92 L50 160 L40 136 L30 160 L10 92Z" fill="url(#g)" stroke="#fff0a0" stroke-width="4"/><circle cx="40" cy="67" r="18" fill="#fff" opacity=".55"/></svg>'),
      titan: img('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 86 170"><defs><linearGradient id="g" x1="0" x2="0" y1="1" y2="0"><stop stop-color="#702222"/><stop offset=".45" stop-color="#ff7d64"/><stop offset="1" stop-color="#fff"/></linearGradient></defs><rect x="24" y="12" width="38" height="142" rx="18" fill="url(#g)" stroke="#ffd0c8" stroke-width="5"/><path d="M43 0 L64 42 L43 31 L22 42Z" fill="#fff"/><path d="M18 72 H68" stroke="#390b0b" stroke-width="8" opacity=".45"/></svg>'),
      ghost: img('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 178"><defs><linearGradient id="g" x1="0" x2="0" y1="1" y2="0"><stop stop-color="#5b26ff"/><stop offset=".6" stop-color="#b99cff"/><stop offset="1" stop-color="#64ffe4"/></linearGradient></defs><path d="M27 0 L46 104 L27 178 L8 104Z" fill="url(#g)" stroke="#fff" stroke-width="3"/><path d="M27 16 L34 116 L27 160 L20 116Z" fill="#fff" opacity=".42"/></svg>')
    };
    assets.enemyBullet = img('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 120"><defs><radialGradient id="r"><stop stop-color="#fff"/><stop offset=".35" stop-color="#ffef6a"/><stop offset=".72" stop-color="#ff5a2a"/><stop offset="1" stop-color="#7a1000" stop-opacity=".2"/></radialGradient></defs><ellipse cx="36" cy="60" rx="30" ry="52" fill="url(#r)"/><path d="M36 6 C55 40 55 80 36 114 C17 80 17 40 36 6Z" fill="none" stroke="#fff3b3" stroke-width="5" opacity=".72"/></svg>');
    assets.missile = img('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 180"><defs><linearGradient id="b" x1="0" x2="0" y1="1" y2="0"><stop stop-color="#283540"/><stop offset=".5" stop-color="#d9f0ff"/><stop offset="1" stop-color="#ffffff"/></linearGradient><linearGradient id="f" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#fffa76"/><stop offset="1" stop-color="#ff3b16"/></linearGradient></defs><path d="M45 2 C72 38 72 118 45 166 C18 118 18 38 45 2Z" fill="url(#b)" stroke="#91c8e8" stroke-width="4"/><path d="M14 92 L2 142 L31 123Z M76 92 L88 142 L59 123Z" fill="#6d7982"/><path d="M28 164 L45 180 L62 164Z" fill="url(#f)"/></svg>');
    assets.homing = img('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 180"><defs><linearGradient id="b" x1="0" x2="0" y1="1" y2="0"><stop stop-color="#0b2c44"/><stop offset=".5" stop-color="#61ffe8"/><stop offset="1" stop-color="#ffffff"/></linearGradient></defs><path d="M50 0 C78 42 78 110 50 158 C22 110 22 42 50 0Z" fill="url(#b)" stroke="#d6fff9" stroke-width="4"/><path d="M50 26 C78 52 78 96 50 124 C22 96 22 52 50 26Z" fill="none" stroke="#fff" stroke-width="5" opacity=".6"/><path d="M20 100 L0 148 L40 128Z M80 100 L100 148 L60 128Z" fill="#26ddca"/></svg>');
    assets.hit = img('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><defs><radialGradient id="x"><stop stop-color="#fff"/><stop offset=".25" stop-color="#fffa73"/><stop offset=".55" stop-color="#ff6b24"/><stop offset="1" stop-color="#ff0000" stop-opacity="0"/></radialGradient></defs><path d="M80 0 L96 54 L151 20 L111 70 L160 80 L105 96 L140 144 L88 112 L80 160 L64 106 L9 140 L49 90 L0 80 L55 64 L20 16 L72 48Z" fill="url(#x)"/></svg>');
    PLANES.forEach(function(p){ assets['plane_'+p.id] = planeSprite(p); });
  }

  function planeSprite(p){
    var body = p.id==='titan' ? 'M70 0 C118 54 116 150 70 210 C24 150 22 54 70 0Z' : p.id==='ghost' ? 'M70 0 C96 60 108 128 70 218 C32 128 44 60 70 0Z' : p.id==='raptor' ? 'M70 0 L122 142 L92 124 L70 218 L48 124 L18 142Z' : 'M70 0 C104 62 106 132 70 218 C34 132 36 62 70 0Z';
    var wing = p.id==='titan' ? 'M18 82 L0 164 L54 130 M122 82 L140 164 L86 130' : p.id==='ghost' ? 'M35 92 L4 178 L58 132 M105 92 L136 178 L82 132' : 'M28 78 L2 152 L58 124 M112 78 L138 152 L82 124';
    return img('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 230"><defs><linearGradient id="g" x1="0" x2="0" y1="1" y2="0"><stop stop-color="#101a24"/><stop offset=".45" stop-color="'+p.color+'"/><stop offset="1" stop-color="#fff"/></linearGradient><filter id="s"><feDropShadow dx="0" dy="8" stdDeviation="5" flood-color="#000" flood-opacity=".45"/></filter></defs><g filter="url(#s)"><path d="'+wing+'" fill="'+p.color+'" stroke="#e9fbff" stroke-width="5" stroke-linejoin="round"/><path d="'+body+'" fill="url(#g)" stroke="#f4fdff" stroke-width="5"/><ellipse cx="70" cy="76" rx="18" ry="34" fill="'+p.accent+'" opacity=".86"/><path d="M50 156 L70 218 L90 156" fill="#222a33" opacity=".75"/><circle cx="48" cy="126" r="8" fill="'+p.accent+'"/><circle cx="92" cy="126" r="8" fill="'+p.accent+'"/></g></svg>');
  }

  function refillMusicQueue(){
    var idxs = TRACKS.map(function(_,i){return i;});
    music.queue = shuffle(idxs);
    if(music.last >= 0 && music.queue[0] === music.last && music.queue.length > 1){
      var t = music.queue[0]; music.queue[0] = music.queue[1]; music.queue[1] = t;
    }
  }
  function ensureAudio(){ if(music.audio) return music.audio; music.audio = new Audio(); music.audio.preload='auto'; music.audio.volume=music.volume; music.audio.addEventListener('ended', nextMusic); return music.audio; }
  function nextTrackIndex(){ if(!music.queue.length) refillMusicQueue(); var idx = music.queue.shift(); music.last = idx; music.index = idx; return idx; }
  function setMusicLabel(){ var tr = TRACKS[music.index] || TRACKS[0]; var title=document.getElementById('v10MusicTitle'); var toggle=document.getElementById('v10MusicToggle'); var vol=document.getElementById('v10MusicVolume'); if(title) title.textContent = tr.title + ' • ' + tr.artist; if(toggle) toggle.textContent = music.enabled ? 'MUSIC ON' : 'MUSIC OFF'; if(vol) vol.value = String(Math.round(music.volume*100)); }
  function playMusicRandomStart(){ if(!music.enabled) return; pauseAllAudio(); var a=ensureAudio(); if(music.index < 0) music.index = nextTrackIndex(); a.src = TRACKS[music.index].src; a.volume = music.volume; setMusicLabel(); a.play().catch(function(){}); music.started=true; }
  function nextMusic(e){ if(e){ e.preventDefault(); e.stopImmediatePropagation(); } pauseAllAudio(); music.index = nextTrackIndex(); playMusicRandomStart(); }
  function toggleMusic(e){ if(e){ e.preventDefault(); e.stopImmediatePropagation(); } music.enabled = !music.enabled; if(!music.enabled){ pauseAllAudio(); } else { if(music.index < 0) music.index = nextTrackIndex(); playMusicRandomStart(); } setMusicLabel(); }
  function installMusic(){ var next=document.getElementById('v10MusicNext'); var tog=document.getElementById('v10MusicToggle'); var vol=document.getElementById('v10MusicVolume'); var start=document.getElementById('startButton'); if(next && !next.dataset.v27){ next.dataset.v27='1'; next.addEventListener('click',nextMusic,true); next.addEventListener('pointerdown',function(e){e.stopImmediatePropagation();},true); } if(tog && !tog.dataset.v27){ tog.dataset.v27='1'; tog.addEventListener('click',toggleMusic,true); tog.addEventListener('pointerdown',function(e){e.stopImmediatePropagation();},true); } if(vol && !vol.dataset.v27){ vol.dataset.v27='1'; vol.addEventListener('input',function(){ music.volume=Number(vol.value)/100; if(music.audio) music.audio.volume=music.volume;},true); } if(start && !start.dataset.v27Music){ start.dataset.v27Music='1'; start.addEventListener('click',function(){ setTimeout(playMusicRandomStart,60); },true); } setMusicLabel(); }

  function installPlaneTabs(){
    var old=document.getElementById('v25PlaneDock'); if(old) old.style.display='none';
    if(document.getElementById('v27PlaneTab')) return;
    var tab=document.createElement('button'); tab.id='v27PlaneTab'; tab.type='button'; tab.textContent='PLANES'; document.body.appendChild(tab);
    var panel=document.createElement('div'); panel.id='v27PlanePanel'; panel.innerHTML='<div class="v27-title">Plane Selection</div><div class="v27-grid">'+PLANES.map(function(p){return '<button type="button" class="v27-plane" data-plane="'+p.id+'"><span class="v27-preview" data-preview="'+p.id+'"></span><b>'+p.name+'</b><small>'+p.role+'<br>'+p.weapon+' • '+p.bomb+'</small></button>';}).join('')+'</div>'; document.body.appendChild(panel);
    var style=document.createElement('style'); style.id='v27Style'; style.textContent='#v27PlaneTab{position:fixed;left:7px;bottom:50px;z-index:10120;min-height:32px;border-radius:13px;border:1px solid rgba(190,235,255,.7);background:rgba(5,23,43,.7);color:white;font:900 10px system-ui}#v27PlanePanel{position:fixed;left:8px;right:8px;top:max(58px,env(safe-area-inset-top));z-index:10119;display:none;padding:10px;border-radius:16px;border:1px solid rgba(157,227,255,.7);background:rgba(2,12,26,.94);box-shadow:0 16px 38px rgba(0,0,0,.48);color:white}#v27PlanePanel.open{display:block}.v27-title{font:900 13px system-ui;margin-bottom:8px;text-align:center}.v27-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.v27-plane{min-height:92px;border-radius:14px;border:1px solid rgba(255,255,255,.2);background:linear-gradient(180deg,rgba(18,79,118,.75),rgba(5,24,46,.92));color:white;text-align:left;padding:7px;font:800 10px system-ui}.v27-plane.active{outline:2px solid #7ee8ff}.v27-plane b{display:block;font-size:13px}.v27-plane small{display:block;color:rgba(230,246,255,.86);font-weight:700}.v27-preview{float:right;width:38px;height:58px;background-size:contain;background-repeat:no-repeat;background-position:center}.hud .chip:nth-child(n+2):not(.v27-keep){display:none!important}#v27Health{position:fixed;left:6px;right:6px;top:max(5px,env(safe-area-inset-top));z-index:10200;height:18px;border:1px solid rgba(255,255,255,.72);border-radius:999px;background:rgba(2,10,18,.44);box-shadow:0 2px 10px rgba(0,0,0,.5);overflow:hidden;pointer-events:none}#v27HealthFill{height:100%;width:100%;background:linear-gradient(90deg,#22ff88,#ffec4a,#ff4a3d);box-shadow:0 0 16px rgba(80,255,168,.6)}#v27HealthText{position:absolute;inset:0;text-align:center;color:white;font:900 11px/18px system-ui;text-shadow:0 1px 4px #000}.overlay p{display:none!important}.overlay h1{font-size:28px!important;margin-bottom:10px!important}.controls p{display:none!important}'; document.head.appendChild(style);
    tab.addEventListener('click',function(){ panel.classList.toggle('open'); });
    panel.addEventListener('click',function(e){ var id=e.target.closest('.v27-plane') && e.target.closest('.v27-plane').dataset.plane; if(!id) return; selectedPlaneId=id; savePlaneId(); maxHp=getPlane().hp; playerHp=maxHp; updateHealth(); panel.classList.remove('open'); flash(getPlane().name+' READY'); });
    PLANES.forEach(function(p){ var node=panel.querySelector('[data-preview="'+p.id+'"]'); if(node) node.style.backgroundImage='url("'+assets['plane_'+p.id].src+'")'; });
  }

  function drawImageAsset(im,x,y,w,h,rot){ if(typeof ctx==='undefined'||!im) return; ctx.save(); ctx.translate(x+w/2,y+h/2); if(rot) ctx.rotate(rot); ctx.drawImage(im,-w/2,-h/2,w,h); ctx.restore(); }
  function installDrawOverlay(){ if(typeof draw !== 'function' || draw.__v27Assets) return; var original=draw; draw=function(){ var r=original.apply(this,arguments); try{ renderAssets(); }catch(e){} return r; }; draw.__v27Assets=true; }
  function renderAssets(){
    var p=getPlane();
    if(typeof player!=='undefined') drawImageAsset(assets['plane_'+p.id], player.x-18, player.y-24, player.width+36, player.height+54, 0);
    if(typeof playerBullets!=='undefined') playerBullets.forEach(function(b){ if(!b) return; var im=b.homing?assets.homing:(b.missile?assets.missile:(assets.playerBullets[p.id]||assets.playerBullets.falcon)); drawImageAsset(im,b.x-7,b.y-10,(b.width||12)+14,(b.height||28)+22, Math.atan2((b.vy||-1),(b.vx||0))+Math.PI/2); });
    if(typeof enemyBullets!=='undefined') enemyBullets.forEach(function(b){ if(!b) return; drawImageAsset(assets.enemyBullet,b.x-8,b.y-8,(b.width||16)+16,(b.height||22)+18, Math.atan2((b.vy||1),(b.vx||0))-Math.PI/2); });
    explosionSprites.forEach(function(e){ var life=(now()-e.t)/e.ms; if(life<1){ var s=e.size*(1+life*.9); if(typeof ctx!=='undefined'){ ctx.globalAlpha=1-life; drawImageAsset(assets.hit,e.x-s/2,e.y-s/2,s,s,life*2); ctx.globalAlpha=1; } } });
    explosionSprites=explosionSprites.filter(function(e){return now()-e.t<e.ms;});
  }
  function installExplosionHook(){ if(typeof spawnExplosion==='function' && !spawnExplosion.__v27Asset){ var orig=spawnExplosion; spawnExplosion=function(x,y,size){ explosionSprites.push({x:x||W()/2,y:y||H()/2,size:size||120,ms:520,t:now()}); return orig.apply(this,arguments); }; spawnExplosion.__v27Asset=true; } }
  function extraPlaneFire(){ if(!running()||typeof player==='undefined'||typeof playerBullets==='undefined') return; var t=now(); if(t-lastAssetFire<420) return; lastAssetFire=t; var p=getPlane(), cx=player.x+player.width/2, y=player.y; if(p.id==='raptor'){ playerBullets.push({x:cx-58,y:y+6,width:18,height:42,vx:-2.1,vy:-9.1,damage:1.4,v27:true}); playerBullets.push({x:cx+40,y:y+6,width:18,height:42,vx:2.1,vy:-9.1,damage:1.4,v27:true}); } else if(p.id==='titan'){ playerBullets.push({x:cx-16,y:y-42,width:32,height:74,vx:0,vy:-7.7,damage:4.2,missile:true,v27:true}); } else if(p.id==='ghost'){ playerBullets.push({x:cx-6,y:y-68,width:12,height:88,vx:0,vy:-14.2,damage:2.0,v27:true}); } else { playerBullets.push({x:cx-36,y:y-26,width:18,height:48,vx:-.35,vy:-10.4,damage:1.7,v27:true}); playerBullets.push({x:cx+18,y:y-26,width:18,height:48,vx:.35,vy:-10.4,damage:1.7,v27:true}); }
  }

  function installHealth(){ if(document.getElementById('v27Health')) return; var h=document.createElement('div'); h.id='v27Health'; h.innerHTML='<div id="v27HealthFill"></div><div id="v27HealthText">HEALTH</div>'; document.body.appendChild(h); }
  function updateHealth(){ installHealth(); var fill=document.getElementById('v27HealthFill'), txt=document.getElementById('v27HealthText'); var pct=Math.max(0,Math.min(1,playerHp/maxHp)); if(fill) fill.style.width=(pct*100).toFixed(0)+'%'; if(txt) txt.textContent=getPlane().name+' HEALTH '+playerHp+'/'+maxHp; }
  function watchDamage(){ if(typeof state==='undefined') return; if(lastLives===null) lastLives=state.lives; if(state.mode!==lastMode){ lastMode=state.mode; if(state.mode==='running'){ maxHp=getPlane().hp; playerHp=maxHp; lastLives=state.lives; } } if(typeof state.lives==='number' && state.lives<lastLives){ playerHp-=1; if(playerHp>0){ state.lives=lastLives; if(typeof updateHud==='function') updateHud(); flash('HIT - ARMOR '+playerHp+'/'+maxHp); } else { lastLives=state.lives; } } else if(typeof state.lives==='number'){ lastLives=state.lives; } updateHealth(); }
  function flash(text){ var el=document.getElementById('v25PickupFlash')||document.getElementById('v23GameplayFlash'); if(!el){ el=document.createElement('div'); el.id='v27Flash'; el.style.cssText='position:fixed;top:84px;left:0;right:0;text-align:center;z-index:10300;color:#fff;font:900 18px system-ui;text-shadow:0 2px 8px #000;pointer-events:none'; document.body.appendChild(el); } el.textContent=text; el.style.opacity='1'; clearTimeout(el.__v27); el.__v27=setTimeout(function(){el.style.opacity='0';},1000); }

  function loop(){ installMusic(); installPlaneTabs(); installDrawOverlay(); installExplosionHook(); installHealth(); watchDamage(); extraPlaneFire(); updateHealth(); requestAnimationFrame(loop); }

  buildAssets();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',loop); else loop();
})();