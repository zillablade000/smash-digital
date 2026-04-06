/**
 * HUD — Heads-Up Display
 * Draws health bars, player labels, cooldown indicators, and super armor indicators.
 */

/**
 * Draw the full HUD.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} W        canvas width
 * @param {number} H        canvas height
 * @param {Object} player   - entity with .health, .maxHealth, .displayName, .attackController
 * @param {Object} cpu      - entity with .health, .maxHealth, .name
 * @param {boolean} showHitboxes
 */
export function drawHUD(ctx, W, H, player, cpu, showHitboxes) {
  const barW    = 240;
  const barH    = 22;
  const padding = 20;

  // ── Player HP bar (left) ──────────────────────────────────────────────────
  _drawHPBar(ctx, padding, padding, barW, barH,
    player.health, player.maxHealth,
    player.displayName ?? 'P1',
    player.primaryColor ?? '#E84040',
    false
  );

  // Super armor indicator
  if (player.superArmor) {
    ctx.fillStyle = 'rgba(255,220,50,0.9)';
    ctx.font      = 'bold 11px monospace';
    ctx.fillText('SUPER ARMOR', padding + 4, padding + barH + 16);
  }

  // ── CPU HP bar (right) ────────────────────────────────────────────────────
  _drawHPBar(ctx, W - padding - barW, padding, barW, barH,
    cpu.health, cpu.maxHealth,
    cpu.name ?? 'CPU BOX',
    '#C89040',
    true
  );

  // ── Cooldown icons (below player bar) ────────────────────────────────────
  if (player.attackController) {
    _drawCooldowns(ctx, padding, padding + barH + 24, player.attackController);
  }

  // ── Debug toggle hint ─────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font      = '11px monospace';
  ctx.fillText('[H] toggle hitboxes', W - 160, H - 10);

  if (showHitboxes) {
    ctx.fillStyle = 'rgba(100,255,100,0.7)';
    ctx.font      = '11px monospace';
    ctx.fillText('HITBOXES ON', W / 2 - 44, 18);
  }
}

/** Draw a single HP bar. */
function _drawHPBar(ctx, x, y, w, h, hp, maxHp, label, color, flipped) {
  const ratio  = Math.max(0, hp / maxHp);
  const fillW  = w * ratio;

  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  _roundRect(ctx, x, y, w, h + 2, 5);
  ctx.fill();

  // HP fill (draws left→right or right→left based on flipped)
  const barColor = ratio > 0.5 ? '#40C860' : ratio > 0.25 ? '#FFD040' : '#E84040';
  ctx.fillStyle  = barColor;
  if (flipped) {
    _roundRect(ctx, x + w - fillW, y, fillW, h + 2, 5);
  } else {
    _roundRect(ctx, x, y, fillW, h + 2, 5);
  }
  ctx.fill();

  // Character color accent strip at top
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, 3);

  // Border
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth   = 1;
  _roundRect(ctx, x, y, w, h + 2, 5);
  ctx.stroke();

  // Label
  ctx.fillStyle = 'white';
  ctx.font      = 'bold 12px monospace';
  ctx.textAlign = flipped ? 'right' : 'left';
  ctx.fillText(label.toUpperCase(), flipped ? x + w - 4 : x + 4, y + h - 4);
  ctx.textAlign = 'left';

  // HP number
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font      = '11px monospace';
  ctx.textAlign = flipped ? 'left' : 'right';
  ctx.fillText(`${Math.ceil(hp)}`, flipped ? x + 4 : x + w - 4, y + h - 4);
  ctx.textAlign = 'left';
}

/** Draw cooldown bars for short/mid/long attacks. */
function _drawCooldowns(ctx, x, y, attackController) {
  const types  = ['short', 'mid', 'long'];
  const colors = { short: '#FF6060', mid: '#FFD040', long: '#60BEFF' };
  const labels = { short: 'S', mid: 'M', long: 'L' };
  const bW = 18;
  const bH = 18;

  for (let i = 0; i < types.length; i++) {
    const type   = types[i];
    const ratio  = attackController.cooldownRatio(type);
    const bx     = x + i * (bW + 5);
    const by     = y;

    // Background circle
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.arc(bx + bW / 2, by + bH / 2, bW / 2 + 1, 0, Math.PI * 2);
    ctx.fill();

    // Cooldown arc
    if (ratio > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth   = 4;
      ctx.beginPath();
      ctx.arc(bx + bW / 2, by + bH / 2, bW / 2 - 1, -Math.PI / 2, -Math.PI / 2 + (ratio * Math.PI * 2));
      ctx.stroke();
    }

    // Ready indicator
    ctx.fillStyle = ratio > 0 ? 'rgba(255,255,255,0.2)' : colors[type];
    ctx.beginPath();
    ctx.arc(bx + bW / 2, by + bH / 2, bW / 2 - 3, 0, Math.PI * 2);
    ctx.fill();

    // Letter
    ctx.fillStyle = ratio > 0 ? 'rgba(255,255,255,0.3)' : 'white';
    ctx.font      = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(labels[type], bx + bW / 2, by + bH / 2 + 4);
    ctx.textAlign = 'left';
  }
}

/** Helper: rounded rectangle path. */
function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
