/**
 * MODEL REPOSITORY
 * Central registry for all swappable character and attack models/sprites.
 *
 * "Models" here are canvas draw functions. When a real sprite image is dropped
 * into assets/models/ and registered here, the draw function is replaced
 * automatically — no changes needed elsewhere in the code.
 *
 * How to add a real sprite:
 *   1. Drop the image file into assets/models/
 *   2. Call ModelRepo.registerImage('myKey', 'assets/models/mySprite.png')
 *   3. The renderer picks it up on the next frame.
 *
 * Network-ready: only keys are transmitted over the wire, not draw functions.
 */

const _images   = {};   // key → HTMLImageElement (loaded)
const _drawFns  = {};   // key → function(ctx, x, y, width, height, facing, frameData)
const _pending  = {};   // key → Promise (loading)

/**
 * Register a procedural (canvas-drawn) model for a key.
 * The drawFn receives (ctx, x, y, width, height, facing, frameData).
 * facing: 1 = right, -1 = left
 */
export function registerDrawFn(key, drawFn) {
  _drawFns[key] = drawFn;
}

/**
 * Register a real image asset for a key.
 * Returns a Promise that resolves when the image is loaded.
 */
export function registerImage(key, src) {
  if (_pending[key]) return _pending[key];
  const img = new Image();
  _pending[key] = new Promise((resolve, reject) => {
    img.onload  = () => { _images[key] = img; resolve(img); };
    img.onerror = () => reject(new Error(`ModelRepo: failed to load ${src}`));
  });
  img.src = src;
  return _pending[key];
}

/**
 * Draw a model at the given rectangle.
 * Priority: loaded image > drawFn > fallback colored rect
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string}  key
 * @param {number}  x
 * @param {number}  y
 * @param {number}  width
 * @param {number}  height
 * @param {number}  facing    1 or -1
 * @param {Object}  [frameData]  optional animation state
 * @param {string}  [tintColor]  optional tint override (e.g. flash on hit)
 */
export function drawModel(ctx, key, x, y, width, height, facing = 1, frameData = {}, tintColor = null) {
  ctx.save();

  // Flip canvas horizontally if facing left
  if (facing === -1) {
    ctx.translate(x + width, y);
    ctx.scale(-1, 1);
    ctx.translate(-x, -y);
  }

  if (_images[key]) {
    // Real sprite
    ctx.drawImage(_images[key], x, y, width, height);
  } else if (_drawFns[key]) {
    // Procedural draw
    _drawFns[key](ctx, x, y, width, height, facing, frameData);
  } else {
    // Fallback: magenta placeholder
    ctx.fillStyle = tintColor || '#FF00FF';
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = 'white';
    ctx.font = '10px monospace';
    ctx.fillText(key, x + 2, y + 14);
  }

  // Hit flash tint overlay
  if (tintColor) {
    ctx.globalAlpha = 0.45;
    ctx.fillStyle   = tintColor;
    ctx.fillRect(x, y, width, height);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

/**
 * Check if a key has a registered model (image or drawFn).
 */
export function hasModel(key) {
  return !!(_images[key] || _drawFns[key]);
}

/**
 * Get all registered keys (for debug/editor use).
 */
export function listKeys() {
  const keys = new Set([...Object.keys(_images), ...Object.keys(_drawFns)]);
  return [...keys];
}

// ─── DEFAULT PLACEHOLDER MODELS ──────────────────────────────────────────────
// Three characters: RED (short), GREEN (mid), BLUE (long)
// For each attack range their body switches to the range color on attack.

/** Draw a humanoid stick figure with a colored body rectangle */
function drawCharFigure(ctx, x, y, w, h, color, eyeColor = 'white') {
  // Body
  ctx.fillStyle = color;
  ctx.fillRect(x + w * 0.2, y + h * 0.25, w * 0.6, h * 0.5);

  // Head
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.5, y + h * 0.15, w * 0.2, h * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = eyeColor;
  ctx.fillRect(x + w * 0.55, y + h * 0.1, w * 0.07, h * 0.07);

  // Legs
  ctx.fillStyle = color;
  ctx.fillRect(x + w * 0.25, y + h * 0.75, w * 0.2,  h * 0.22);
  ctx.fillRect(x + w * 0.55, y + h * 0.75, w * 0.2,  h * 0.22);

  // Arms
  ctx.fillRect(x + w * 0.05, y + h * 0.28, w * 0.18, h * 0.12);
  ctx.fillRect(x + w * 0.77, y + h * 0.28, w * 0.18, h * 0.12);
}

// Character: SHORT specialist — RED
registerDrawFn('char_short', (ctx, x, y, w, h) => {
  drawCharFigure(ctx, x, y, w, h, '#E84040', '#ffcccc');
});

// Character: MID specialist — GREEN
registerDrawFn('char_mid', (ctx, x, y, w, h) => {
  drawCharFigure(ctx, x, y, w, h, '#40C060', '#ccffcc');
});

// Character: LONG specialist — BLUE
registerDrawFn('char_long', (ctx, x, y, w, h) => {
  drawCharFigure(ctx, x, y, w, h, '#4080E8', '#cce0ff');
});

// CPU training box
registerDrawFn('box_cpu', (ctx, x, y, w, h) => {
  ctx.fillStyle = '#C89040';
  ctx.fillRect(x, y, w, h);
  // Wood grain lines
  ctx.strokeStyle = '#A07030';
  ctx.lineWidth = 2;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x, y + (h / 4) * i);
    ctx.lineTo(x + w, y + (h / 4) * i);
    ctx.stroke();
  }
  ctx.strokeStyle = '#A07030';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  // HP label rendered by entity itself
});

// ── Attack model: short hit flash
registerDrawFn('atk_short', (ctx, x, y, w, h) => {
  ctx.fillStyle   = 'rgba(255, 80, 80, 0.55)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#FF4040';
  ctx.lineWidth   = 2;
  ctx.strokeRect(x, y, w, h);
});

// Attack model: mid swing arc
registerDrawFn('atk_mid', (ctx, x, y, w, h) => {
  ctx.fillStyle   = 'rgba(255, 200, 50, 0.55)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#FFD000';
  ctx.lineWidth   = 2;
  ctx.strokeRect(x, y, w, h);
});

// Attack model: long projectile
registerDrawFn('atk_long', (ctx, x, y, w, h) => {
  ctx.fillStyle = '#60BEFF';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#A0DFFF';
  ctx.lineWidth   = 2;
  ctx.stroke();
});
