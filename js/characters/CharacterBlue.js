/**
 * CHARACTER: BLUE — Long Range Specialist
 *
 * Playstyle: Zoner/keep-away fighter with powerful projectiles.
 * Signature: Super armor on long attack, low short/mid, fast projectile.
 *
 * Stats:
 *   speed:     4.5    (slower ground movement)
 *   weight:    1.2    (heavier — takes less knockback)
 *   jumpPower: 12
 *   airControl:0.75
 *
 * Attacks:
 *   Short — Quick poke, minimal range
 *   Mid   — Slow, decent damage
 *   Long  — Fast arcing orb, super armor, high damage, signature move
 */

import { CharacterBase } from './CharacterBase.js';
import { registerDrawFn } from '../engine/modelRepo.js';

registerDrawFn('char_blue', (ctx, x, y, w, h, facing, frameData) => {
  const state = frameData?.state ?? 'idle';

  let bodyColor = '#4080E8';
  if (state === 'attack_short') bodyColor = '#FF8080';
  if (state === 'attack_mid')   bodyColor = '#FFD040';
  if (state === 'attack_long')  bodyColor = '#A0E8FF';
  if (state === 'hitstun')      bodyColor = '#FFFFFF';

  // Body (slightly taller / heavier look)
  ctx.fillStyle = bodyColor;
  ctx.fillRect(x + w * 0.17, y + h * 0.26, w * 0.66, h * 0.52);

  // Head
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.5, y + h * 0.16, w * 0.24, h * 0.17, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + w * 0.55, y + h * 0.10, w * 0.09, h * 0.09);
  ctx.fillStyle = '#222';
  ctx.fillRect(x + w * 0.59, y + h * 0.12, w * 0.04, h * 0.05);

  // Legs (sturdier)
  const legShift = state === 'run' ? Math.sin(frameData.frame * 0.25) * 2 : 0;
  ctx.fillStyle = '#205090';
  ctx.fillRect(x + w * 0.20, y + h * 0.76, w * 0.26, h * 0.23 + legShift);
  ctx.fillRect(x + w * 0.54, y + h * 0.76, w * 0.26, h * 0.23 - legShift);

  // Arms — charge pose during long attack
  ctx.fillStyle = bodyColor;
  if (state === 'attack_long') {
    // Both arms extended forward
    ctx.fillRect(x + w * 0.78, y + h * 0.28, w * 0.40, h * 0.16);
  } else if (state === 'attack_short') {
    ctx.fillRect(x + w * 0.76, y + h * 0.30, w * 0.28, h * 0.12);
    ctx.fillRect(x + w * 0.04, y + h * 0.34, w * 0.16, h * 0.12);
  } else {
    ctx.fillRect(x + w * 0.78, y + h * 0.32, w * 0.18, h * 0.12);
    ctx.fillRect(x + w * 0.04, y + h * 0.32, w * 0.18, h * 0.12);
  }

  // Energy orb effect during long charge
  if (state === 'attack_long') {
    ctx.fillStyle = 'rgba(160, 232, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(x + w * 1.1, y + h * 0.37, 10, 0, Math.PI * 2);
    ctx.fill();
  }
});

const BLUE_ATTACKS = {
  short: {
    id:         'blue_short',
    type:       'short',
    cooldown:   24,
    startup:    4,
    active:     7,
    superArmor: false,
    damage:     6,
    basePower:  3.5,
    angle:      15,
    width:      44,
    height:     40,
    offsetX:    4,
    offsetY:    2,
    modelKey:   'atk_short',
  },
  mid: {
    id:         'blue_mid',
    type:       'mid',
    cooldown:   34,
    startup:    6,
    active:     11,
    superArmor: false,
    damage:     11,
    basePower:  7,
    angle:      40,
    width:      78,
    height:     46,
    offsetX:    12,
    offsetY:    -4,
    modelKey:   'atk_mid',
  },
  long: {
    id:         'blue_long',
    type:       'long',
    cooldown:   38,
    startup:    7,
    active:     55,
    superArmor: true,       // BLUE's signature: super armor on long
    damage:     18,
    basePower:  13,
    angle:      12,
    speed:      11,
    arcGravity: 0.22,
    maxFrames:  55,
    width:      30,
    height:     30,
    modelKey:   'atk_long',
  },
};

export class CharacterBlue extends CharacterBase {
  constructor(config = {}) {
    super(
      {
        characterId:  'blue',
        displayName:  'Zoner',
        primaryColor: '#4080E8',
        modelKey:     'char_blue',
        width:        50,
        height:       68,
        health:       100,
        maxHealth:    100,
        speed:        4.5,
        jumpPower:    12,
        weight:       1.2,
        airControl:   0.75,
        fallSpeed:    16,
        dashSpeed:    7,
        maxJumps:     2,
        ...config,
      },
      BLUE_ATTACKS
    );
  }
}
