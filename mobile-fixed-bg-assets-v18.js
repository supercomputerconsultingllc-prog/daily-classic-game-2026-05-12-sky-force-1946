(function(){
  'use strict';
  if(window.__SKY_FORCE_FIXED_ASSET_BG_V18__) return;
  window.__SKY_FORCE_FIXED_ASSET_BG_V18__ = true;

  var assets = [
    "data:image/webp;base64,PLACEHOLDER_ONE",
    "data:image/webp;base64,PLACEHOLDER_TWO"
  ];

  var selected = assets[Math.floor(Date.now() / 1000) % assets.length];
  var proto = HTMLImageElement.prototype;
  var desc = Object.getOwnPropertyDescriptor(proto, 'src');
  if (!desc || !desc.set || !desc.get) return;

  Object.defineProperty(proto, 'src', {
    get: function() {
      return desc.get.call(this);
    },
    set: function(value) {
      if (typeof value === 'string' && value.indexOf('bg-cloud-' + 'warzone.png') !== -1) {
        value = selected;
      }
      return desc.set.call(this, value);
    },
    configurable: true,
    enumerable: desc.enumerable
  });
})();