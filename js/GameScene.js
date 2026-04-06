/**
 * GAME SCENE
 * Orchestrates the active fight:
 *   - Player + CPU box entities
 *   - Physics world
 *   - Hitbox collection & resolution
 *   - HUD rendering
 *   - Win condition checking
 *   - Hitbox debug toggle (H key)
 */

import { CharacterRed }   from './characters/CharacterRed.js';
import { CharacterGreen } from './characters/CharacterGreen.js';
import { CharacterBlue }  from './characters/CharacterBlue.js';
import { CPUBox }         from './characters/CPUBox.js';
import { getMap, drawMap }from './maps/mapRepo.js';
import { updateHitboxes, drawHitboxes } from './engine/hitbox.js';
import { resolveHits }    from './attacks/attackSystem.js';
import { drawHUD }        from './ui/hud.js';
import { P1, flushInput, isPressed } from './engine/input.js';
import { drawModel }      from './engine/modelRepo.js';

const CHARACTER_CLASSES = {
  red:   CharacterRed,
  green: CharacterGreen,
  blue:  CharacterBlue,
};

export class GameScene {
  /**
   * @param {Object} opts
   * @param {string} opts.characterId  - 'red'|'green'|'blue'
   * @param {string} opts.mapId        - registered map id
   * @param {number} opts.W            - canvas width
   * @param {number} opts.H            - canvas height
   * @param {Function} opts.onGameOver - callback({ winner, winnerName, winnerColor })
   */
  constructor(opts) {
    const { characterId, mapId, W, H, onGameOver } = opts;

    this.W          = W;
    this.H          = H;
    this.onGameOver = onGameOver;
    this._over      = false;

    // Map
    this.mapDef     = getMap(mapId) ?? getMap('training_flat');
    this.platforms  = this.mapDef.platforms;

    // Spawn points
    const spawns = this.mapDef.spawnPoints;

    // Player character
    const CharClass = CHARACTER_CLASSES[characterId] ?? CharacterRed;
    this.player = new CharClass({
      x:        spawns[0].x,
      y:        spawns[0].y,
      isPlayer: true,
      name:     'P1',
    });

    // CPU training box
    this.cpu = new CPUBox({
      x: spawns[1].x,
      y: spawns[1].y,
    });

    // Global hitbox list (all active hitboxes across all entities)
    this.hitboxes = [];

    // Debug
    this.showHitboxes = false;

    // Camera shake state
    this._shakeX     = 0;
    this._shakeY     = 0;
    this._shakeMag   = 0;
    this._shakeFrames= 0;
  }

  /** Trigger a camera shake. */
  triggerShake(magnitude = 6, frames = 8) {
    this._shakeMag   = magnitude;
    this._shakeFrames= frames;
  }

  /** One game logic tick. */
  update() {
    if (this._over) return;

    // Toggle hitbox debug
    if (isPressed('KeyH')) this.showHitboxes = !this.showHitboxes;

    // Build input snapshot for player
    const input = {
      left:  P1.left(),
      right: P1.right(),
      jump:  P1.jump(),
      short: P1.short(),
      mid:   P1.mid(),
      long:  P1.long(),
    };

    // Tick player
    this.player.tick(this.platforms, input);

    // Tick CPU box (physics only)
    this.cpu.tick(this.platforms);

    // Collect all hitboxes from player into global list
    for (const hb of this.player.hitboxes) {
      if (!this.hitboxes.includes(hb)) {
        this.hitboxes.push(hb);
      }
    }

    // Update all hitboxes (arc travel, expiry)
    updateHitboxes(this.hitboxes, this.platforms);

    // Resolve hits: player's hitboxes vs CPU
    const prevHp = this.cpu.health;
    resolveHits(this.hitboxes, [this.cpu]);

    // Trigger shake on hit
    if (this.cpu.health < prevHp) {
      this.triggerShake(5, 6);
    }

    // Update camera shake
    if (this._shakeFrames > 0) {
      this._shakeFrames--;
      this._shakeX = (Math.random() - 0.5) * this._shakeMag * 2;
      this._shakeY = (Math.random() - 0.5) * this._shakeMag * 2;
      this._shakeMag *= 0.85;
    } else {
      this._shakeX = 0;
      this._shakeY = 0;
    }

    // Check win condition
    this._checkWin();

    flushInput();
  }

  _checkWin() {
    if (this._over) return;
    if (this.cpu.isDead || this.cpu.health <= 0) {
      this._over = true;
      this.onGameOver({
        winner:      'player',
        winnerName:  this.player.displayName ?? 'P1',
        winnerColor: this.player.primaryColor ?? '#ffffff',
      });
    } else if (this.player.isDead || this.player.health <= 0) {
      this._over = true;
      this.onGameOver({
        winner:      'cpu',
        winnerName:  'CPU BOX',
        winnerColor: '#C89040',
      });
    }
  }

  /** Render the full scene. */
  draw(ctx) {
    ctx.save();
    ctx.translate(this._shakeX, this._shakeY);

    // Map
    drawMap(ctx, this.mapDef, this.W, this.H);

    // Entities
    this.cpu.draw(ctx, this.showHitboxes);
    this.player.draw(ctx, this.showHitboxes);

    // Attack models follow their hitboxes
    this._drawAttackModels(ctx);

    // Hitbox debug overlay
    if (this.showHitboxes) {
      drawHitboxes(ctx, this.hitboxes);
    }

    ctx.restore();

    // HUD (not shaken)
    drawHUD(ctx, this.W, this.H, this.player, this.cpu, this.showHitboxes);
  }

  /** Draw attack visual models at each hitbox position. */
  _drawAttackModels(ctx) {
    for (const hb of this.hitboxes) {
      if (!hb.active || !hb.modelKey) continue;
      drawModel(ctx, hb.modelKey, hb.x, hb.y, hb.width, hb.height, hb.owner?.facing ?? 1);
    }
  }
}
