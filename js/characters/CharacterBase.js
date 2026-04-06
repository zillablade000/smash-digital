/**
 * CHARACTER BASE
 * Extends Entity with attack controller, input handling, animation state.
 * All three playable characters inherit from this.
 */

import { Entity } from '../engine/entity.js';
import { AttackController } from '../attacks/attackSystem.js';

export class CharacterBase extends Entity {
  /**
   * @param {Object} config - merged with Entity defaults + char-specific stats
   * @param {Object} attackDefs - { short, mid, long } attack definitions
   */
  constructor(config, attackDefs) {
    super(config);

    // Attack controller
    this.attackController = new AttackController(this, attackDefs);

    // Character-specific extended stats (exposed for network / UI)
    this.characterId   = config.characterId  ?? 'unknown';
    this.displayName   = config.displayName  ?? 'Fighter';
    this.primaryColor  = config.primaryColor ?? '#FF00FF';

    // Track animation state for model
    this.frameData = {
      state:     'idle',  // idle|run|jump|fall|attack_short|attack_mid|attack_long|hitstun
      frame:     0,
      direction: 1,
    };
  }

  /**
   * Process movement input.
   * @param {Object} input - { left, right, jump }
   */
  handleMovement(input) {
    if (this.hitstun > 0) return;   // Can't move in hitstun

    const moveSpeed = this.onGround ? this.speed : this.speed * this.airControl;

    if (input.left) {
      this.vx     = -moveSpeed;
      this.facing = -1;
    } else if (input.right) {
      this.vx     = moveSpeed;
      this.facing = 1;
    }

    // Jump
    if (input.jump && this.jumpsLeft > 0) {
      this.vy        = -this.jumpPower;
      this.onGround  = false;
      this.jumpsLeft--;
    }
  }

  /**
   * Process attack input.
   * @param {Object} input - { short, mid, long }
   */
  handleAttacks(input) {
    if (input.short) this.attackController.execute('short');
    if (input.mid)   this.attackController.execute('mid');
    if (input.long)  this.attackController.execute('long');
  }

  /**
   * Full character tick:
   *   1. Handle input (if provided)
   *   2. Tick attack controller
   *   3. Physics tick
   *   4. Update animation state
   *
   * @param {Array}  platforms
   * @param {Object} [input]     - if null, no movement input applied
   */
  tick(platforms, input = null) {
    if (input) {
      this.handleMovement(input);
      this.handleAttacks(input);
    }
    this.attackController.tick();
    this.physicsTick(platforms);
    this._updateAnimState();
  }

  _updateAnimState() {
    const ac = this.attackController;
    if (this.hitstun > 0) {
      this.frameData.state = 'hitstun';
    } else if (ac._pending || ac.activeHitboxes.length > 0) {
      // Determine which attack type is active
      if (ac.activeHitboxes.some(h => h.type === 'short')) this.frameData.state = 'attack_short';
      else if (ac.activeHitboxes.some(h => h.type === 'mid')) this.frameData.state = 'attack_mid';
      else if (ac.activeHitboxes.some(h => h.type === 'long')) this.frameData.state = 'attack_long';
      else this.frameData.state = 'attack_short';
    } else if (!this.onGround) {
      this.frameData.state = this.vy < 0 ? 'jump' : 'fall';
    } else if (Math.abs(this.vx) > 0.5) {
      this.frameData.state = 'run';
    } else {
      this.frameData.state = 'idle';
    }
    this.frameData.direction = this.facing;
    this.frameData.frame++;
  }

  /**
   * All hitboxes this character has active (for global hit resolution).
   */
  get hitboxes() {
    return this.attackController.activeHitboxes;
  }

  /** Serialize including attack state for network. */
  serialize() {
    return {
      ...super.serialize(),
      characterId:  this.characterId,
      frameData:    { ...this.frameData },
    };
  }
}
