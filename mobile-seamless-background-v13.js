/* Sky Force 1946 mobile v13: seamless scrolling map processor.
   The generated background has different color at the top and bottom, so the vertical loop seam is visible.
   This patches canvas drawImage before the game starts, detects the warzone background image, and draws
   a processed offscreen canvas whose top/bottom edges are blended to the same color range.
*/
(function () {
  'use strict';

  if (window.__SKY_FORCE_SEAMLESS_BG_V13__) return;
  window.__SKY_FORCE_SEAMLESS_BG_V13__ = true;

  const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage;
  const processed = new WeakMap();

  function isBackgroundImage(source) {
    return source && source.tagName === 'IMG' && typeof source.src === 'string' && source.src.includes('bg-cloud-warzone');
  }

  function makeSeamless(source) {
    if (processed.has(source)) return processed.get(source);

    const width = source.naturalWidth || source.width;
    const height = source.naturalHeight || source.height;
    if (!width || !height) return source;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(source, 0, 0, width, height);

    try {
      const band = Math.max(80, Math.min(260, Math.floor(height * 0.18)));
      const image = ctx.getImageData(0, 0, width, height);
      const data = image.data;

      function idx(x, y) {
        return (y * width + x) * 4;
      }

      // Blend top and bottom edge color bands toward a common midpoint.
      // At the exact seam, top and bottom are forced close together. The effect fades inward.
      for (let y = 0; y < band; y += 1) {
        const edgeStrength = Math.pow(1 - y / band, 1.65);
        const topY = y;
        const bottomY = height - 1 - y;

        for (let x = 0; x < width; x += 1) {
          const ti = idx(x, topY);
          const bi = idx(x, bottomY);

          const avgR = (data[ti] + data[bi]) * 0.5;
          const avgG = (data[ti + 1] + data[bi + 1]) * 0.5;
          const avgB = (data[ti + 2] + data[bi + 2]) * 0.5;

          data[ti] = data[ti] * (1 - edgeStrength) + avgR * edgeStrength;
          data[ti + 1] = data[ti + 1] * (1 - edgeStrength) + avgG * edgeStrength;
          data[ti + 2] = data[ti + 2] * (1 - edgeStrength) + avgB * edgeStrength;

          data[bi] = data[bi] * (1 - edgeStrength) + avgR * edgeStrength;
          data[bi + 1] = data[bi + 1] * (1 - edgeStrength) + avgG * edgeStrength;
          data[bi + 2] = data[bi + 2] * (1 - edgeStrength) + avgB * edgeStrength;
        }
      }

      // Add a mild vertical haze layer so the banding transition reads as atmospheric clouds/ocean mist.
      for (let y = 0; y < height; y += 1) {
        const phase = Math.sin((y / height) * Math.PI * 2);
        const haze = 0.035 + Math.max(0, phase) * 0.025;
        for (let x = 0; x < width; x += 1) {
          const i = idx(x, y);
          data[i] = data[i] * (1 - haze) + 33 * haze;
          data[i + 1] = data[i + 1] * (1 - haze) + 76 * haze;
          data[i + 2] = data[i + 2] * (1 - haze) + 104 * haze;
        }
      }

      ctx.putImageData(image, 0, 0);
    } catch (err) {
      console.info('[Sky Force 1946] Seamless background processing unavailable, using original image', err);
      processed.set(source, source);
      return source;
    }

    processed.set(source, canvas);
    console.info('[Sky Force 1946] v13 seamless background generated', { width, height });
    return canvas;
  }

  CanvasRenderingContext2D.prototype.drawImage = function patchedDrawImage(source, ...args) {
    if (isBackgroundImage(source) && source.complete) {
      return originalDrawImage.call(this, makeSeamless(source), ...args);
    }
    return originalDrawImage.call(this, source, ...args);
  };
})();
