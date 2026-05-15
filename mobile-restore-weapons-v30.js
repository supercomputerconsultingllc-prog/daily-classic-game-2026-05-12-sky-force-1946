(function(){
  'use strict';
  if(window.__SKY_FORCE_RESTORE_WEAPONS_V30__) return;
  window.__SKY_FORCE_RESTORE_WEAPONS_V30__ = true;
  document.documentElement.dataset.v30Weapons = 'restored';

  function installStyle(){
    var old = document.getElementById('v30RestoreWeaponsStyle');
    if(old) old.remove();
    var style = document.createElement('style');
    style.id = 'v30RestoreWeaponsStyle';
    style.textContent = `
      #v10WeaponDock {
        position: fixed !important;
        left: 7px !important;
        right: 92px !important;
        bottom: 7px !important;
        z-index: 12000 !important;
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 6px !important;
        max-width: none !important;
        width: auto !important;
        pointer-events: auto !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
      #v10WeaponDock button,
      #v10WeaponDock button[data-action="missile"],
      #v10WeaponDock button[data-action="homing"],
      #v10WeaponDock button[data-action="bomb"] {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        min-height: 38px !important;
        border-radius: 12px !important;
        border: 1px solid rgba(185,235,255,.72) !important;
        color: #fff !important;
        background: linear-gradient(180deg, rgba(17,92,141,.92), rgba(4,28,58,.98)) !important;
        font: 900 10px/1 system-ui, sans-serif !important;
        box-shadow: 0 0 14px rgba(76,201,255,.28) !important;
        pointer-events: auto !important;
      }
    `;
    document.head.appendChild(style);
  }

  function ensureDock(){
    var dock = document.getElementById('v10WeaponDock');
    if(!dock){
      dock = document.createElement('div');
      dock.id = 'v10WeaponDock';
      document.body.appendChild(dock);
    }

    if(!dock.querySelector('[data-action="missile"]')){
      var missile = document.createElement('button');
      missile.type = 'button';
      missile.dataset.action = 'missile';
      missile.textContent = 'MISSILE';
      dock.appendChild(missile);
    }
    if(!dock.querySelector('[data-action="homing"]')){
      var homing = document.createElement('button');
      homing.type = 'button';
      homing.dataset.action = 'homing';
      homing.textContent = 'HEAT SEEK';
      dock.appendChild(homing);
    }
    if(!dock.querySelector('[data-action="bomb"]')){
      var bomb = document.createElement('button');
      bomb.type = 'button';
      bomb.dataset.action = 'bomb';
      bomb.textContent = 'BOMB';
      dock.appendChild(bomb);
    }

    ['missile','homing','bomb'].forEach(function(action){
      var btn = dock.querySelector('[data-action="'+action+'"]');
      if(!btn) return;
      btn.style.display = 'block';
      btn.style.visibility = 'visible';
      btn.style.opacity = '1';
      btn.hidden = false;
      btn.disabled = false;
    });

    if(!dock.__v30WeaponClick){
      dock.__v30WeaponClick = true;
      dock.addEventListener('click', function(event){
        var btn = event.target && event.target.closest ? event.target.closest('button[data-action]') : null;
        if(!btn) return;
        var action = btn.dataset.action;
        if(action === 'bomb'){
          if(typeof useBomb === 'function') useBomb();
          else if(typeof triggerBomb === 'function') triggerBomb();
          return;
        }
        if((action === 'missile' || action === 'homing') && typeof playerBullets !== 'undefined' && typeof player !== 'undefined'){
          var homing = action === 'homing';
          var cx = player.x + player.width / 2;
          var cy = player.y + player.height * 0.2;
          [-18, 18].forEach(function(offset){
            playerBullets.push({
              x: cx + offset - 7,
              y: cy - 22,
              width: 14,
              height: 36,
              vx: offset < 0 ? -0.38 : 0.38,
              vy: -10.2,
              damage: homing ? 4 : 3.2,
              missile: true,
              homing: homing,
              manualWeapon: true,
              turnRate: homing ? 0.10 : 0,
              life: 150
            });
          });
        }
      }, true);
    }
  }

  function protectManualWeapons(){
    if(typeof playerBullets === 'undefined' || !Array.isArray(playerBullets)) return;
    playerBullets.forEach(function(b){
      if(b && b.manualWeapon){
        b.width = Math.min(b.width || 14, 14);
        b.height = Math.min(b.height || 36, 36);
      }
    });
  }

  function loop(){
    installStyle();
    ensureDock();
    protectManualWeapons();
    requestAnimationFrame(loop);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loop);
  else loop();
})();