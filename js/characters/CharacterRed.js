/**
 * CHARACTER: RED — Short Range Specialist
 *
 * Playstyle: Fast, close-quarters brawler.
 * Signature: Super armor on short attack, high speed, light weight.
 *
 * Stats:
 *   speed:     7      (fast)
 *   weight:    0.8    (light — takes more knockback)
 *   jumpPower: 14
 *   airControl:0.85
 *
 * Attacks:
 *   Short — Wide swing, super armor, very low cooldown
 *   Mid   — Forward lunge, medium range
 *   Long  — Weak thrown punch (not their specialty)
 */

import { CharacterBase } from './CharacterBase.js';
import { registerDrawFn } from '../engine/modelRepo.js';

// ── Placeholder model: RED character with attack state color changes ──────────
registerDrawFn('char_red', (ctx, x, y, w, h, facing, frameData) => {
  const state = frameData?.state ?? 'idle';

  let bodyColor = '#E84040';
  if (state === 'attack_short') bodyColor = '#FF8080';
  if (state === 'attack_mid')   bodyColor = '#FFD040';
  if (state === 'attack_long')  bodyColor = '#60BEFF';
  if (state === 'hitstun')      bodyColor = '#FFFFFF';

  // Body
  ctx.fillStyle = bodyColor;
  ctx.fillRect(x + w * 0.2, y + h * 0.28, w * 0.6, h * 0.48);

  // Head
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.5, y + h * 0.17, w * 0.22, h * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eye (always on right side pre-flip)
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + w * 0.56, y + h * 0.11, w * 0.08, h * 0.08);
  ctx.fillStyle = '#222';
  ctx.fillRect(x + w * 0.60, y + h * 0.12, w * 0.04, h * 0.05);

  // Legs
  const legShift = state === 'run' ? Math.sin(frameData.frame * 0.3) * 3 : 0;
  ctx.fillStyle = '#B02020';
  ctx.fillRect(x + w * 0.24, y + h * 0.75, w * 0.22, h * 0.24 + legShift);
  ctx.fillRect(x + w * 0.54, y + h * 0.75, w * 0.22, h * 0.24 - legShift);

  // Arms
  ctx.fillStyle = bodyColor;
  if (state === 'attack_short' || state === 'attack_mid') {
    // Punch out
    ctx.fillRect(x + w * 0.78, y + h * 0.30, w * 0.35, h * 0.14);
  } else {
    ctx.fillRect(x + w * 0.78, y + h * 0.32, w * 0.18, h * 0.12);
    ctx.fillRect(x + w * 0.04, y + h * 0.32, w * 0.18, h * 0.12);
  }
});

const RED_ATTACKS = {
  short: {
    id:         'red_short',
    type:       'short',
    cooldown:   16,
    startup:    2,
    active:     9,
    superArmor: true,       // RED's signature: super armor on short
    damage:     10,
    basePower:  6,
    angle:      20,
    width:      58,
    height:     50,
    offsetX:    5,
    offsetY:    -5,
    modelKey:   'atk_short',
  },
  mid: {
    id:         'red_mid',
    type:       'mid',
    cooldown:   28,
    startup:    4,
    active:     12,
    superArmor: false,
    damage:     13,
    basePower:  8,
    angle:      35,
    width:      75,
    height:     44,
    offsetX:    10,
    offsetY:    -2,
    modelKey:   'atk_mid',
  },
  long: {
    id:         'red_long',
    type:       'long',
    cooldown:   50,
    startup:    6,
    active:     45,
    superArmor: false,
    damage:     9,
    basePower:  6,
    angle:      15,
    speed:      7,
    arcGravity: 0.35,
    maxFrames:  45,
    width:      22,
    height:     22,
    modelKey:   'atk_long',
  },
};

export class CharacterRed extends CharacterBase {
  constructor(config = {}) {
    super(
      {
        characterId:  'red',
        displayName:  'Brawler',
        primaryColor: '#E84040',
        modelKey:     'char_red',
        width:        46,
        height:       62,
        health:       100,
        maxHealth:    100,
        speed:        7,
        jumpPower:    14,
        weight:       0.8,
        airControl:   0.85,
        fallSpeed:    18,
        dashSpeed:    10,
        maxJumps:     2,
        ...config,
      },
      RED_ATTACKS
    );
  }
}
