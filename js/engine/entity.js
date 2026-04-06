/**
 * ENTITY BASE CLASS
 * Foundation for all game objects: characters, CPU box, projectiles.
 *
 * All physics state is plain data for easy network serialization.
 * Stat variables are declared even if not used yet so updates can plug in.
 */

import { applyGravity, applyFriction, decayKnockback, tickHitstun,
         integratePosition, resolvePlatformCollision, checkGrounded } from './physics.js';
import { drawModel } from './modelRepo.js';
import { drawCharacterHitbox } from './hitbox.js';

export class Entity {
  constructor(config = {}) {
    // ── Position & Size ────────────────────────────────────────────────────
    this.x      = config.x      ?? 400;
    this.y      = config.y      ?? 300;
    this.width  = config.width  ?? 48;
    this.height = config.height ?? 64;

    // ── Movement Velocities ────────────────────────────────────────────────
    this.vx  = 0;   // input-driven horizontal velocity
    this.vy  = 0;   // input-driven vertical velocity (jump)
    this.kbx = 0;   // knockback horizontal
    this.kby = 0;   // knockback vertical

    // ── State Flags ────────────────────────────────────────────────────────
    this.onGround   = false;
    this.facing     = 1;      // 1 = right, -1 = left
    this.hitstun    = 0;      // frames unable to act after being hit
    this.superArmor = false;  // if true, knockback is skipped

    // ── Jump System ────────────────────────────────────────────────────────
    this.maxJumps   = config.maxJumps  ?? 2;  // 2 = double jump
    this.jumpsLeft  = this.maxJumps;

    // ── Stats (all exposed for future balance / network sync) ─────────────
    this.health     = config.health    ?? 100;
    this.maxHealth  = config.maxHealth ?? 100;
    this.speed      = config.speed     ?? 5;    // base run speed (px/frame)
    this.jumpPower  = config.jumpPower ?? 13;   // initial jump velocity
    this.weight     = config.weight    ?? 1.0;  // knockback scale inverse
    this.airControl = config.airControl ?? 0.8; // multiplier for air movement
    this.fallSpeed  = config.fallSpeed ?? 18;   // personal terminal velocity cap
    this.dashSpeed  = config.dashSpeed ?? 8;    // future: dash mechanic

    // ── Visual ────────────────────────────────────────────────────────────
    this.modelKey   = config.modelKey ?? 'box_cpu';
    this.tint       = null;       // flash color on hit
    this._tintTimer = 0;

    // ── Identity ──────────────────────────────────────────────────────────
    this.id         = config.id   ?? Entity._nextId++;
    this.name       = config.name ?? 'Entity';
    this.isPlayer   = config.isPlayer ?? false;
    this.isCPU      = config.isCPU    ?? false;
    this.isDead     = false;

    // ── Frame data / animation ────────────────────────────────────────────
    this.frameData  = { state: 'idle', frame: 0 };
  }

  /** Take damage. Triggers hit flash. */
  takeDamage(amount) {
    if (this.superArmor) return 0;
    this.health = Math.max(0, this.health - amount);
    this.tint   = 'white';
    this._tintTimer = 8;
    if (this.health <= 0) this.isDead = true;
    return amount;
  }

  /** Restore health (future: healing mechanic) */
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  /**
   * Physics tick — call once per frame.
   * @param {Array} platforms
   */
  physicsTick(platforms) {
    checkGrounded(this, platforms);
    applyGravity(this);
    applyFriction(this);
    decayKnockback(this);
    tickHitstun(this);
    integratePosition(this);

    for (const p of platforms) {
      resolvePlatformCollision(this, p);
    }

    // Hit flash timer
    if (this._tintTimer > 0) {
      this._tintTimer--;
      if (this._tintTimer === 0) this.tint = null;
    }
  }

  /**
   * Render entity using the model repository.
   * @param {CanvasRenderingContext2D} ctx
   * @param {boolean} showHitbox
   */
  draw(ctx, showHitbox = false) {
    drawModel(
      ctx,
      this.modelKey,
      this.x,
      this.y,
      this.width,
      this.height,
      this.facing,
      this.frameData,
      this.tint
    );

    if (showHitbox) {
      drawCharacterHitbox(ctx, this);
    }
  }

  /**
   * Serialize to plain object (for network / replay).
   */
  serialize() {
    return {
      id: this.id, x: this.x, y: this.y,
      vx: this.vx, vy: this.vy, kbx: this.kbx, kby: this.kby,
      health: this.health, hitstun: this.hitstun,
      onGround: this.onGround, facing: this.facing,
      jumpsLeft: this.jumpsLeft, isDead: this.isDead,
    };
  }

  /** Apply a network update patch. */
  applyPatch(data) {
    Object.assign(this, data);
  }
}

Entity._nextId = 1;
