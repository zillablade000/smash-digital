/**
 * HITBOX SYSTEM
 * Three distinct hitbox types:
 *   SHORT  – tight rectangle near the character
 *   MID    – medium rectangle, adaptable range
 *   LONG   – smaller rectangle traveling on an arc trajectory
 *
 * All hitboxes are rectangular (drawn as colored outlines).
 * Attack model sprites follow the hitbox rect position.
 *
 * Network-ready: hitbox state is plain serializable data.
 */

/** Hitbox types */
export const HitboxType = {
  SHORT: 'short',
  MID:   'mid',
  LONG:  'long',
};

/** Visual colors for debug hitbox rendering */
export const HitboxColors = {
  [HitboxType.SHORT]: 'rgba(255, 80,  80,  0.7)',   // red
  [HitboxType.MID]:   'rgba(255, 200, 50,  0.7)',   // yellow
  [HitboxType.LONG]:  'rgba(80,  180, 255, 0.7)',   // blue
  CHARACTER:          'rgba(100, 255, 100, 0.5)',   // green
};

let _hitboxIdCounter = 0;

/**
 * Create a SHORT-range hitbox.
 * Stays close to the owner for a fixed duration.
 *
 * @param {Object} owner       - the attacking entity
 * @param {Object} attackData  - { width, height, offsetX, offsetY, damage, basePower, angle, duration, superArmor, id }
 * @returns {Object} hitbox
 */
export function createShortHitbox(owner, attackData) {
  const {
    width    = 50,
    height   = 50,
    offsetX  = 30,
    offsetY  = 0,
    damage   = 8,
    basePower= 5,
    angle    = 30,
    duration = 10,
    superArmor = false,
    modelKey = null,
  } = attackData;

  return {
    id:          _hitboxIdCounter++,
    type:        HitboxType.SHORT,
    owner,
    x:           0,
    y:           0,
    width,
    height,
    offsetX,
    offsetY,
    damage,
    basePower,
    angle,
    duration,
    framesLeft:  duration,
    active:      true,
    hitEntities: new Set(),   // prevent multi-hit in one swing
    superArmor,
    modelKey,
  };
}

/**
 * Create a MID-range hitbox.
 * Larger reach than short; can be tuned between short and long.
 *
 * @param {Object} owner
 * @param {Object} attackData
 * @returns {Object} hitbox
 */
export function createMidHitbox(owner, attackData) {
  const {
    width    = 80,
    height   = 45,
    offsetX  = 55,
    offsetY  = -5,
    damage   = 12,
    basePower= 8,
    angle    = 45,
    duration = 14,
    superArmor = false,
    modelKey = null,
  } = attackData;

  return {
    id:          _hitboxIdCounter++,
    type:        HitboxType.MID,
    owner,
    x:           0,
    y:           0,
    width,
    height,
    offsetX,
    offsetY,
    damage,
    basePower,
    angle,
    duration,
    framesLeft:  duration,
    active:      true,
    hitEntities: new Set(),
    superArmor,
    modelKey,
  };
}

/**
 * Create a LONG-range hitbox.
 * Travels on an arc (projectile-style).
 *
 * Arc physics:
 *   Each frame: x += speed * facing, y += vy; vy += arcGravity
 *   Box is smaller to reward aim.
 *
 * @param {Object} owner
 * @param {Object} attackData
 * @returns {Object} hitbox
 */
export function createLongHitbox(owner, attackData) {
  const {
    width      = 24,
    height     = 24,
    offsetX    = 20,
    offsetY    = 0,
    damage     = 15,
    basePower  = 11,
    angle      = 20,
    speed      = 9,
    arcGravity = 0.3,   // gravity applied to projectile
    maxFrames  = 60,    // max lifetime in frames
    superArmor = false,
    modelKey   = null,
  } = attackData;

  const facing = owner.facing || 1;
  // Initial arc velocity from launch angle
  const rad  = (angle * Math.PI) / 180;
  const launchVx = speed * Math.cos(rad) * facing;
  const launchVy = speed * Math.sin(rad) * -1;  // upward = negative

  // Spawn near owner
  const startX = owner.x + (facing > 0 ? owner.width + offsetX : -(width + offsetX));
  const startY = owner.y + (owner.height / 2) + offsetY;

  return {
    id:          _hitboxIdCounter++,
    type:        HitboxType.LONG,
    owner,
    x:           startX,
    y:           startY,
    width,
    height,
    vx:          launchVx,
    vy:          launchVy,
    arcGravity,
    damage,
    basePower,
    angle,
    maxFrames,
    framesLeft:  maxFrames,
    active:      true,
    hitEntities: new Set(),
    superArmor,
    modelKey,
  };
}

/**
 * Update all active hitboxes.
 * - SHORT/MID: snap to owner position + offset
 * - LONG: integrate arc trajectory
 * - Decrements framesLeft; deactivates when expired
 *
 * @param {Array} hitboxes
 * @param {Array} platforms  - for LONG hitbox ground collision
 */
export function updateHitboxes(hitboxes, platforms = []) {
  for (let i = hitboxes.length - 1; i >= 0; i--) {
    const hb = hitboxes[i];
    if (!hb.active) {
      hitboxes.splice(i, 1);
      continue;
    }

    hb.framesLeft--;
    if (hb.framesLeft <= 0) {
      hb.active = false;
      hitboxes.splice(i, 1);
      continue;
    }

    if (hb.type === HitboxType.SHORT || hb.type === HitboxType.MID) {
      // Follow owner
      const facing = hb.owner.facing || 1;
      if (facing > 0) {
        hb.x = hb.owner.x + hb.owner.width + hb.offsetX;
      } else {
        hb.x = hb.owner.x - hb.width - hb.offsetX;
      }
      hb.y = hb.owner.y + (hb.owner.height / 2) - (hb.height / 2) + hb.offsetY;

    } else if (hb.type === HitboxType.LONG) {
      // Arc travel
      hb.vy += hb.arcGravity;
      hb.x  += hb.vx;
      hb.y  += hb.vy;

      // Deactivate on platform contact
      for (const p of platforms) {
        if (
          hb.x + hb.width  > p.x &&
          hb.x             < p.x + p.width &&
          hb.y + hb.height > p.y &&
          hb.y             < p.y + p.height
        ) {
          hb.active = false;
          hitboxes.splice(i, 1);
          break;
        }
      }
    }
  }
}

/**
 * Test one hitbox against one target entity.
 * Returns true if it lands a hit (and registers in hitEntities).
 *
 * @param {Object} hitbox
 * @param {Object} target  - must have .x, .y, .width, .height, .health, .hitstun
 * @returns {boolean}
 */
export function testHitboxVsEntity(hitbox, target) {
  if (!hitbox.active)             return false;
  if (hitbox.owner === target)    return false;
  if (hitbox.hitEntities.has(target)) return false;

  // AABB
  if (
    hitbox.x < target.x + target.width  &&
    hitbox.x + hitbox.width  > target.x &&
    hitbox.y < target.y + target.height &&
    hitbox.y + hitbox.height > target.y
  ) {
    hitbox.hitEntities.add(target);
    return true;
  }
  return false;
}

/**
 * Get character bounding rect (for external use).
 * Character hitbox = entity.width × entity.height at entity position.
 */
export function getCharacterRect(entity) {
  return {
    x:      entity.x,
    y:      entity.y,
    width:  entity.width,
    height: entity.height,
  };
}

/**
 * Draw all active hitboxes (debug overlay).
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} hitboxes
 */
export function drawHitboxes(ctx, hitboxes) {
  for (const hb of hitboxes) {
    if (!hb.active) continue;
    ctx.save();
    ctx.strokeStyle = HitboxColors[hb.type] || 'white';
    ctx.lineWidth   = 2;
    ctx.strokeRect(hb.x, hb.y, hb.width, hb.height);
    ctx.restore();
  }
}

/**
 * Draw character hitbox (green outline).
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} entity
 */
export function drawCharacterHitbox(ctx, entity) {
  ctx.save();
  ctx.strokeStyle = HitboxColors.CHARACTER;
  ctx.lineWidth   = 1.5;
  ctx.strokeRect(entity.x, entity.y, entity.width, entity.height);
  ctx.restore();
}
