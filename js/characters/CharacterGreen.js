/**
 * CHARACTER: GREEN — Mid Range Specialist
 *
 * Playstyle: Balanced all-rounder, great mid-range control.
 * Signature: Super armor on mid attack, good air control.
 *
 * Stats:
 *   speed:     5.5    (balanced)
 *   weight:    1.0    (average)
 *   jumpPower: 13
 *   airControl:0.9
 *
 * Attacks:
 *   Short — Quick jab, low damage
 *   Mid   — Wide sweep, super armor, high knockback angle
 *   Long  — Moderate-speed projectile
 */

import { CharacterBase } from './CharacterBase.js';
import { registerDrawFn } from '../engine/modelRepo.js';

registerDrawFn('char_green', (ctx, x, y, w, h, facing, frameData) => {
  const state = frameData?.state ?? 'idle';

  let bodyColor = '#40C060';
  if (state === 'attack_short') bodyColor = '#FF8080';
  if (state === 'attack_mid')   bodyColor = '#90FF90';
  if (state === 'attack_long')  bodyColor = '#60BEFF';
  if (state === 'hitstun')      bodyColor = '#FFFFFF';

  // Body (slightly wider than Red)
  ctx.fillStyle = bodyColor;
  ctx.fillRect(x + w * 0.18, y + h * 0.28, w * 0.64, h * 0.48);

  // Head
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.5, y + h * 0.17, w * 0.23, h * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + w * 0.55, y + h * 0.11, w * 0.09, h * 0.08);
  ctx.fillStyle = '#222';
  ctx.fillRect(x + w * 0.59, y + h * 0.12, w * 0.04, h * 0.05);

  // Legs
  const legShift = state === 'run' ? Math.sin(frameData.frame * 0.28) * 3 : 0;
  ctx.fillStyle = '#208040';
  ctx.fillRect(x + w * 0.22, y + h * 0.75, w * 0.24, h * 0.24 + legShift);
  ctx.fillRect(x + w * 0.54, y + h * 0.75, w * 0.24, h * 0.24 - legShift);

  // Arms — sweep pose during mid attack
  ctx.fillStyle = bodyColor;
  if (state === 'attack_mid') {
    ctx.fillRect(x + w * 0.80, y + h * 0.26, w * 0.30, h * 0.14);
    ctx.fillRect(x - w * 0.10, y + h * 0.26, w * 0.30, h * 0.14);
  } else if (state === 'attack_short') {
    ctx.fillRect(x + w * 0.78, y + h * 0.30, w * 0.32, h * 0.12);
    ctx.fillRect(x + w * 0.04, y + h * 0.34, w * 0.16, h * 0.12);
  } else {
    ctx.fillRect(x + w * 0.78, y + h * 0.32, w * 0.18, h * 0.12);
    ctx.fillRect(x + w * 0.04, y + h * 0.32, w * 0.18, h * 0.12);
  }
});

const GREEN_ATTACKS = {
  short: {
    id:         'green_short',
    type:       'short',
    cooldown:   20,
    startup:    3,
    active:     8,
    superArmor: false,
    damage:     7,
    basePower:  4,
    angle:      25,
    width:      48,
    height:     44,
    offsetX:    6,
    offsetY:    0,
    modelKey:   'atk_short',
  },
  mid: {
    id:         'green_mid',
    type:       'mid',
    cooldown:   24,
    startup:    3,
    active:     14,
    superArmor: true,       // GREEN's signature: super armor on mid
    damage:     14,
    basePower:  10,
    angle:      50,
    width:      90,
    height:     52,
    offsetX:    8,
    offsetY:    -8,
    modelKey:   'atk_mid',
  },
  long: {
    id:         'green_long',
    type:       'long',
    cooldown:   42,
    startup:    5,
    active:     50,
    superArmor: false,
    damage:     12,
    basePower:  9,
    angle:      10,
    speed:      9,
    arcGravity: 0.28,
    maxFrames:  50,
    width:      26,
    height:     26,
    modelKey:   'atk_long',
  },
};

export class CharacterGreen extends CharacterBase {
  constructor(config = {}) {
    super(
      {
        characterId:  'green',
        displayName:  'Balancer',
        primaryColor: '#40C060',
        modelKey:     'char_green',
        width:        48,
        height:       64,
        health:       100,
        maxHealth:    100,
        speed:        5.5,
        jumpPower:    13,
        weight:       1.0,
        airControl:   0.90,
        fallSpeed:    18,
        dashSpeed:    8,
        maxJumps:     2,
        ...config,
      },
      GREEN_ATTACKS
    );
  }
}
