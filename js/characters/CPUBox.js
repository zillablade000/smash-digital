/**
 * CPU BOX
 * Training dummy: wooden box with 100 HP and Smash-style physics.
 * Reacts to hits (knockback, hitstun) but does not attack.
 * Future: could be upgraded to a full AI fighter.
 */

import { Entity } from '../engine/entity.js';

export class CPUBox extends Entity {
  constructor(config = {}) {
    super({
      name:       'Training Box',
      modelKey:   'box_cpu',
      width:      52,
      height:     52,
      health:     100,
      maxHealth:  100,
      weight:     1.1,
      speed:      0,
      jumpPower:  0,
      maxJumps:   0,
      isCPU:      true,
      ...config,
    });

    this.hitboxes = [];   // box never attacks
  }

  tick(platforms) {
    this.physicsTick(platforms);
  }

  draw(ctx, showHitbox = false) {
    super.draw(ctx, showHitbox);

    // Draw HP label above box
    const barW  = this.width;
    const barH  = 6;
    const barX  = this.x;
    const barY  = this.y - 14;
    const ratio = Math.max(0, this.health / this.maxHealth);

    // Background
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);

    // HP fill
    const hpColor = ratio > 0.5 ? '#40C060' : ratio > 0.25 ? '#FFD040' : '#E84040';
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barW * ratio, barH);

    // HP text
    ctx.fillStyle = 'white';
    ctx.font      = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(this.health)} HP`, this.x + this.width / 2, this.y - 18);
    ctx.textAlign = 'left';
  }
}
