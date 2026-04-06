/**
 * PHYSICS ENGINE
 * Core physics simulation: gravity, velocity, knockback, hitstun, platform collision.
 * Network-ready: all state is plain data — serialize/deserialize cleanly.
 */

export const PHYSICS_CONFIG = {
  GRAVITY:           0.55,      // Pixels per frame² downward acceleration
  MAX_FALL_SPEED:    18,        // Terminal velocity (px/frame)
  GROUND_FRICTION:   0.78,      // Horizontal velocity multiplier when grounded
  AIR_FRICTION:      0.92,      // Horizontal velocity multiplier when airborne
  KNOCKBACK_DECAY:   0.88,      // Knockback velocity decay per frame
  HITSTUN_PER_KB:    0.4,       // Hitstun frames per unit of knockback magnitude
  MIN_HITSTUN:       6,         // Minimum hitstun frames on a hit
  MAX_HITSTUN:       60,        // Cap hitstun so gameplay stays responsive
};

/**
 * Apply gravity and clamp fall speed.
 * @param {Object} entity - must have .vy, .onGround
 */
export function applyGravity(entity) {
  if (!entity.onGround) {
    entity.vy += PHYSICS_CONFIG.GRAVITY;
    if (entity.vy > PHYSICS_CONFIG.MAX_FALL_SPEED) {
      entity.vy = PHYSICS_CONFIG.MAX_FALL_SPEED;
    }
  }
}

/**
 * Apply friction based on grounded state.
 * Only applied to base movement velocity (vx), NOT knockback velocity (kbx/kby).
 * @param {Object} entity - must have .vx, .onGround
 */
export function applyFriction(entity) {
  const friction = entity.onGround
    ? PHYSICS_CONFIG.GROUND_FRICTION
    : PHYSICS_CONFIG.AIR_FRICTION;
  entity.vx *= friction;
  if (Math.abs(entity.vx) < 0.05) entity.vx = 0;
}

/**
 * Decay knockback velocity each frame.
 * @param {Object} entity - must have .kbx, .kby
 */
export function decayKnockback(entity) {
  entity.kbx *= PHYSICS_CONFIG.KNOCKBACK_DECAY;
  entity.kby *= PHYSICS_CONFIG.KNOCKBACK_DECAY;
  if (Math.abs(entity.kbx) < 0.05) entity.kbx = 0;
  if (Math.abs(entity.kby) < 0.05) entity.kby = 0;
}

/**
 * Tick hitstun counter.
 * @param {Object} entity - must have .hitstun
 */
export function tickHitstun(entity) {
  if (entity.hitstun > 0) {
    entity.hitstun--;
  }
}

/**
 * Apply knockback to an entity from an attack.
 * Knockback direction is determined by attacker facing + attack data.
 *
 * @param {Object} entity        - target entity
 * @param {Object} attackData    - { basePower, angle (degrees), type }
 * @param {number} attackerFacing - 1 = right, -1 = left
 *
 * Knockback formula:
 *   raw = basePower * (1 + (100 - entity.health) / 200)
 *         scaled by entity weight (heavier = less knockback)
 *   kbx = raw * cos(angle) * attackerFacing
 *   kby = raw * sin(angle) * (-1 because canvas Y is inverted)
 */
export function applyKnockback(entity, attackData, attackerFacing) {
  // If entity has super armor active, skip knockback entirely
  if (entity.superArmor) return;

  const { basePower, angle = 45 } = attackData;
  const weightFactor = 1 / (entity.weight || 1);

  // Damage-based scaling: more damage = more knockback
  const damageFactor = 1 + (100 - Math.max(0, entity.health)) / 200;
  const raw = basePower * weightFactor * damageFactor;

  const rad = (angle * Math.PI) / 180;
  entity.kbx = raw * Math.cos(rad) * attackerFacing;
  entity.kby = raw * Math.sin(rad) * -1; // negative = upward in canvas space

  // Calculate hitstun proportional to knockback magnitude
  const magnitude = Math.sqrt(entity.kbx ** 2 + entity.kby ** 2);
  const hitstunFrames = Math.round(
    Math.min(
      PHYSICS_CONFIG.MAX_HITSTUN,
      Math.max(PHYSICS_CONFIG.MIN_HITSTUN, magnitude * PHYSICS_CONFIG.HITSTUN_PER_KB)
    )
  );
  entity.hitstun = hitstunFrames;

  // Knockback launches off the ground
  if (entity.onGround && entity.kby < 0) {
    entity.onGround = false;
    entity.jumpsLeft = entity.maxJumps || 1;
  }
}

/**
 * Integrate all velocities into position.
 * Total movement = input velocity (vx/vy) + knockback (kbx/kby)
 * @param {Object} entity - must have .x, .y, .vx, .vy, .kbx, .kby
 */
export function integratePosition(entity) {
  entity.x += entity.vx + entity.kbx;
  entity.y += entity.vy + entity.kby;
}

/**
 * Resolve collision with a platform (axis-aligned rectangle).
 * Only resolves top-surface landing (HP-based game, no blast zones yet).
 *
 * @param {Object} entity   - { x, y, width, height, vy, kby, onGround, jumpsLeft, maxJumps }
 * @param {Object} platform - { x, y, width, height }
 */
export function resolvePlatformCollision(entity, platform) {
  const eLeft   = entity.x;
  const eRight  = entity.x + entity.width;
  const eTop    = entity.y;
  const eBottom = entity.y + entity.height;

  const pLeft   = platform.x;
  const pRight  = platform.x + platform.width;
  const pTop    = platform.y;
  const pBottom = platform.y + platform.height;

  // AABB check
  if (eRight <= pLeft || eLeft >= pRight || eBottom <= pTop || eTop >= pBottom) {
    return false;
  }

  // Compute overlap on each axis
  const overlapX = Math.min(eRight - pLeft, pRight - eLeft);
  const overlapY = Math.min(eBottom - pTop, pBottom - eTop);

  if (overlapY < overlapX) {
    // Vertical collision
    if (eBottom - pTop < pBottom - eTop) {
      // Landing on top
      entity.y = pTop - entity.height;
      entity.vy = 0;
      entity.kby = 0;
      entity.onGround = true;
      entity.jumpsLeft = entity.maxJumps || 2;
    } else {
      // Hitting ceiling
      entity.y = pBottom;
      entity.vy = Math.max(0, entity.vy);
      entity.kby = Math.max(0, entity.kby);
    }
  } else {
    // Horizontal wall collision
    if (eLeft < pLeft) {
      entity.x = pLeft - entity.width;
    } else {
      entity.x = pRight;
    }
    entity.vx = 0;
    entity.kbx = 0;
  }

  return true;
}

/**
 * Check whether an entity is still touching ground this frame.
 * Called BEFORE applying gravity so we can lift the grounded flag.
 * @param {Object} entity
 * @param {Array}  platforms
 */
export function checkGrounded(entity, platforms) {
  const testY = entity.y + entity.height + 1;
  entity.onGround = false;
  for (const p of platforms) {
    if (
      entity.x + entity.width > p.x &&
      entity.x < p.x + p.width &&
      testY >= p.y &&
      entity.y + entity.height <= p.y + p.height
    ) {
      entity.onGround = true;
      return;
    }
  }
}
