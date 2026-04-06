/**
 * MAP REPOSITORY
 * All maps are plain data objects describing platforms and visual config.
 * Adding a new map = registering an object here. No code changes elsewhere needed.
 *
 * Map shape:
 * {
 *   id:          string,
 *   name:        string,
 *   background:  string | function(ctx, W, H),    // color or draw fn
 *   platforms:   Array<{ x, y, width, height, color? }>,
 *   spawnPoints: Array<{ x, y }>,   // player/CPU spawn positions
 *   bounds:      { left, right, top, bottom },    // future: blast zone / out of bounds
 * }
 */

const _maps = {};

/**
 * Register a map definition.
 * @param {Object} mapDef
 */
export function registerMap(mapDef) {
  _maps[mapDef.id] = mapDef;
}

/**
 * Get a map by ID.
 * @param {string} id
 * @returns {Object|null}
 */
export function getMap(id) {
  return _maps[id] ?? null;
}

/**
 * List all registered maps (for map selector UI).
 * @returns {Array<{ id, name }>}
 */
export function listMaps() {
  return Object.values(_maps).map(m => ({ id: m.id, name: m.name }));
}

// ─── Draw a map to canvas ─────────────────────────────────────────────────────
/**
 * Render the map background and platforms.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} mapDef
 * @param {number} W  canvas width
 * @param {number} H  canvas height
 */
export function drawMap(ctx, mapDef, W, H) {
  // Background
  if (typeof mapDef.background === 'function') {
    mapDef.background(ctx, W, H);
  } else {
    ctx.fillStyle = mapDef.background ?? '#1a1a2e';
    ctx.fillRect(0, 0, W, H);
  }

  // Platforms
  for (const p of mapDef.platforms) {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(p.x + 4, p.y + 4, p.width, p.height);

    // Platform body
    ctx.fillStyle = p.color ?? '#4a4a6a';
    ctx.fillRect(p.x, p.y, p.width, p.height);

    // Top highlight strip
    ctx.fillStyle = p.topColor ?? '#6a6a9a';
    ctx.fillRect(p.x, p.y, p.width, 6);

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth   = 1;
    ctx.strokeRect(p.x, p.y, p.width, p.height);
  }
}

// ─── BUILT-IN MAPS ────────────────────────────────────────────────────────────

registerMap({
  id:   'training_flat',
  name: 'Training Stage',
  background: (ctx, W, H) => {
    // Deep space gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0d0d1e');
    grad.addColorStop(1, '#1a1a35');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    // deterministic "random" stars
    const stars = [
      [50,30],[120,80],[200,25],[300,60],[420,15],[530,90],[650,40],
      [720,70],[80,160],[350,130],[600,150],[160,200],[480,180],[710,140],
    ];
    for (const [sx, sy] of stars) {
      ctx.beginPath();
      ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  platforms: [
    // Main stage
    { x: 80,  y: 430, width: 640, height: 20, color: '#3a4a6a', topColor: '#6080B0' },
  ],
  spawnPoints: [
    { x: 220, y: 360 },   // Player
    { x: 540, y: 360 },   // CPU
  ],
  bounds: { left: -200, right: 1000, top: -300, bottom: 700 },
});

registerMap({
  id:   'arena_multi',
  name: 'Arena (3 Platforms)',
  background: (ctx, W, H) => {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#1a0a0a');
    grad.addColorStop(1, '#2a1020');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Distant glow
    const glow = ctx.createRadialGradient(W / 2, H * 0.4, 20, W / 2, H * 0.4, 280);
    glow.addColorStop(0, 'rgba(180,60,60,0.12)');
    glow.addColorStop(1, 'rgba(180,60,60,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
  },
  platforms: [
    { x: 80,  y: 460, width: 640, height: 20, color: '#5a2a2a', topColor: '#8a4a4a' },
    { x: 190, y: 340, width: 180, height: 16, color: '#6a3030', topColor: '#9a5050' },
    { x: 430, y: 340, width: 180, height: 16, color: '#6a3030', topColor: '#9a5050' },
  ],
  spawnPoints: [
    { x: 200, y: 390 },
    { x: 520, y: 390 },
  ],
  bounds: { left: -200, right: 1000, top: -300, bottom: 700 },
});
