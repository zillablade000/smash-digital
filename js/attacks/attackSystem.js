/**
 * ATTACK SYSTEM
 * Manages attack execution, cooldowns, super armor windows,
 * hitbox spawning, and hit resolution.
 *
 * Each attack definition is a plain data object — characters
 * just reference their attack definitions; no hard-coding.
 *
 * Attack definition shape:
 * {
 *   id:          string,       // unique key
 *   type:        'short'|'mid'|'long',
 *   cooldown:    number,       // frames before next attack
 *   startup:     number,       // frames before hitbox spawns
 *   active:      number,       // frames hitbox is alive (overrides hitbox duration)
 *   superArmor:  boolean,      // owner immune to knockback during active frames
 *   damage:      number,
 *   basePower:   number,       // knockback power
 *   angle:       number,       // launch angle in degrees
 *   // SHORT/MID specific:
 *   width, height, offsetX, offsetY,
 *   // LONG specific:
 *   speed, arcGravity, maxFrames,
 *   modelKey:    string,       // attack effect model key
 * }
 */

import {
  createShortHitbox,
  createMidHitbox,
  createLongHitbox,
  testHitboxVsEntity,
} from '../engine/hitbox.js';
import { applyKnockback } from '../engine/physics.js';

/** Per-character attack state */
export class AttackController {
  constructor(owner, attackDefs) {
    this.owner      = owner;
    this.attackDefs = attackDefs;   // { short, mid, long } → definition objects

    // Cooldown counters per type
    this._cooldowns  = { short: 0, mid: 0, long: 0 };

    // Current active hitboxes spawned by this controller
    this.activeHitboxes = [];

    // Startup timer (frames until hitbox spawns)
    this._pending = null;   // { framesLeft, def }

    // Super armor active window
    this._superArmorFrames = 0;
  }

  /** Tick cooldowns, startup timers, super armor. */
  tick() {
    // Tick cooldowns
    for (const type in this._cooldowns) {
      if (this._cooldowns[type] > 0) this._cooldowns[type]--;
    }

    // Super armor window
    if (this._superArmorFrames > 0) {
      this._superArmorFrames--;
      this.owner.superArmor = this._superArmorFrames > 0;
    }

    // Startup timer → spawn hitbox
    if (this._pending) {
      this._pending.framesLeft--;
      if (this._pending.framesLeft <= 0) {
        this._spawnHitbox(this._pending.def);
        this._pending = null;
      }
    }
  }

  /**
   * Try to execute an attack of the given type.
   * Returns false if on cooldown or in hitstun.
   * @param {string} type  'short'|'mid'|'long'
   */
  execute(type) {
    if (this.owner.hitstun > 0)       return false;
    if (this._cooldowns[type] > 0)    return false;
    if (this._pending)                return false;

    const def = this.attackDefs[type];
    if (!def) return false;

    // Start cooldown immediately (prevents input buffering abuse)
    this._cooldowns[type] = def.cooldown ?? 20;

    const startup = def.startup ?? 0;
    if (startup > 0) {
      this._pending = { framesLeft: startup, def };
    } else {
      this._spawnHitbox(def);
    }

    // Activate super armor if this move has it
    if (def.superArmor) {
      this._superArmorFrames = (def.startup ?? 0) + (def.active ?? 10);
      this.owner.superArmor  = true;
    }

    return true;
  }

  /** Internal: actually spawn the hitbox for a definition. */
  _spawnHitbox(def) {
    let hb;
    const params = { ...def, duration: def.active ?? def.duration };

    switch (def.type) {
      case 'short': hb = createShortHitbox(this.owner, params); break;
      case 'mid':   hb = createMidHitbox(this.owner, params);   break;
      case 'long':  hb = createLongHitbox(this.owner, params);  break;
      default: return;
    }
    this.activeHitboxes.push(hb);
  }

  /** Can any attack be fired right now? */
  canAttack(type) {
    return this.owner.hitstun === 0 && this._cooldowns[type] === 0 && !this._pending;
  }

  /** Cooldown remaining for a type (0–1 normalized). */
  cooldownRatio(type) {
    const def = this.attackDefs[type];
    if (!def) return 0;
    return this._cooldowns[type] / (def.cooldown ?? 20);
  }
}

/**
 * Resolve all active hitboxes against a list of targets.
 * Applies damage and knockback on hit.
 *
 * @param {Array}  hitboxes  - all active hitboxes this frame
 * @param {Array}  targets   - entities that can be hit
 */
export function resolveHits(hitboxes, targets) {
  for (const hb of hitboxes) {
    for (const target of targets) {
      if (testHitboxVsEntity(hb, target)) {
        // Don't damage dead entities
        if (target.isDead) continue;

        // Apply damage
        target.takeDamage(hb.damage);

        // Apply knockback (attacker facing determines direction)
        applyKnockback(target, hb, hb.owner.facing);
      }
    }
  }
}
