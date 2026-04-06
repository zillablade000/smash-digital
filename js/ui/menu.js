/**
 * MENU SCREEN
 * Renders the main menu, character selector, and map selector.
 * Fully data-driven — new characters and maps are auto-detected
 * from their respective repositories.
 *
 * State machine:
 *   'main'       → title + PLAY button
 *   'char_select'→ character picker
 *   'map_select' → map picker
 */

import { listMaps } from '../maps/mapRepo.js';
import { drawModel } from '../engine/modelRepo.js';

const CHARACTER_ROSTER = [
  { id: 'red',   displayName: 'Brawler',  modelKey: 'char_red',   primaryColor: '#E84040',
    desc: 'Short Range  |  Speed: ★★★★  |  Weight: ★★  |  SA: Short Attack' },
  { id: 'green', displayName: 'Balancer', modelKey: 'char_green', primaryColor: '#40C060',
    desc: 'Mid Range    |  Speed: ★★★   |  Weight: ★★★ |  SA: Mid Attack' },
  { id: 'blue',  displayName: 'Zoner',    modelKey: 'char_blue',  primaryColor: '#4080E8',
    desc: 'Long Range   |  Speed: ★★    |  Weight: ★★★★|  SA: Long Attack' },
];

export class MenuScreen {
  constructor(W, H, onStart) {
    this.W       = W;
    this.H       = H;
    this.onStart = onStart;   // callback({ characterId, mapId })

    this.state           = 'main';
    this.selectedChar    = 0;
    this.selectedMap     = 0;
    this.maps            = listMaps();

    // Hover tracking
    this._mouseX = 0;
    this._mouseY = 0;

    // Particle system for background
    this._particles = Array.from({ length: 40 }, () => this._newParticle());

    this._bindEvents();
  }

  _newParticle() {
    return {
      x:    Math.random() * this.W,
      y:    Math.random() * this.H,
      r:    Math.random() * 2 + 0.5,
      vx:   (Math.random() - 0.5) * 0.4,
      vy:   (Math.random() - 0.5) * 0.4,
      a:    Math.random() * 0.6 + 0.2,
    };
  }

  _bindEvents() {
    this._onMouseMove = (e) => {
      const rect = e.target.getBoundingClientRect();
      this._mouseX = e.clientX - rect.left;
      this._mouseY = e.clientY - rect.top;
    };
    this._onClick = (e) => {
      const rect = e.target.getBoundingClientRect();
      this._handleClick(e.clientX - rect.left, e.clientY - rect.top);
    };
  }

  attach(canvas) {
    this._canvas = canvas;
    canvas.addEventListener('mousemove', this._onMouseMove);
    canvas.addEventListener('click',     this._onClick);
  }

  detach() {
    if (this._canvas) {
      this._canvas.removeEventListener('mousemove', this._onMouseMove);
      this._canvas.removeEventListener('click',     this._onClick);
      this._canvas = null;
    }
  }

  _handleClick(mx, my) {
    const W = this.W, H = this.H;

    if (this.state === 'main') {
      // Play button
      const bx = W / 2 - 100, by = H / 2 - 25, bw = 200, bh = 55;
      if (mx >= bx && mx <= bx + bw && my >= by && my <= by + bh) {
        this.state = 'char_select';
      }
    } else if (this.state === 'char_select') {
      // Character cards
      const cardW = 160, cardH = 220, gap = 30;
      const totalW = CHARACTER_ROSTER.length * (cardW + gap) - gap;
      const startX = (W - totalW) / 2;
      const cardY  = H / 2 - cardH / 2 - 20;

      for (let i = 0; i < CHARACTER_ROSTER.length; i++) {
        const cx = startX + i * (cardW + gap);
        if (mx >= cx && mx <= cx + cardW && my >= cardY && my <= cardY + cardH) {
          this.selectedChar = i;
        }
      }
      // Confirm button
      const bx = W / 2 - 100, by = H - 80;
      if (mx >= bx && mx <= bx + 200 && my >= by && my <= by + 44) {
        this.state = 'map_select';
      }
      // Back
      if (mx >= 20 && mx <= 120 && my >= H - 55 && my <= H - 20) {
        this.state = 'main';
      }

    } else if (this.state === 'map_select') {
      // Map cards
      const cardW = 200, cardH = 130, gap = 24;
      const totalW = this.maps.length * (cardW + gap) - gap;
      const startX = (W - totalW) / 2;
      const cardY  = H / 2 - cardH / 2 - 20;

      for (let i = 0; i < this.maps.length; i++) {
        const cx = startX + i * (cardW + gap);
        if (mx >= cx && mx <= cx + cardW && my >= cardY && my <= cardY + cardH) {
          this.selectedMap = i;
        }
      }
      // Confirm / Play
      const bx = W / 2 - 100, by = H - 80;
      if (mx >= bx && mx <= bx + 200 && my >= by && my <= by + 44) {
        this._startGame();
      }
      // Back
      if (mx >= 20 && mx <= 120 && my >= H - 55 && my <= H - 20) {
        this.state = 'char_select';
      }
    }
  }

  _startGame() {
    const char = CHARACTER_ROSTER[this.selectedChar];
    const map  = this.maps[this.selectedMap];
    this.detach();
    this.onStart({ characterId: char.id, mapId: map.id });
  }

  /** Update particles. */
  update() {
    for (const p of this._particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > this.W || p.y < 0 || p.y > this.H) {
        Object.assign(p, this._newParticle());
      }
    }
  }

  /** Render the current menu state. */
  draw(ctx) {
    const W = this.W, H = this.H;

    // Background
    ctx.fillStyle = '#0d0d1e';
    ctx.fillRect(0, 0, W, H);

    // Particles
    for (const p of this._particles) {
      ctx.globalAlpha = p.a;
      ctx.fillStyle   = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (this.state === 'main')        this._drawMain(ctx, W, H);
    else if (this.state === 'char_select') this._drawCharSelect(ctx, W, H);
    else if (this.state === 'map_select')  this._drawMapSelect(ctx, W, H);
  }

  _drawMain(ctx, W, H) {
    // Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font      = 'bold 52px "Courier New", monospace';
    ctx.shadowColor = '#4080FF';
    ctx.shadowBlur  = 20;
    ctx.fillText('FIGHTER', W / 2, H / 2 - 100);
    ctx.shadowBlur  = 0;

    ctx.font      = '18px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('SMASH-STYLE ARENA', W / 2, H / 2 - 65);

    // Play button
    const bx = W / 2 - 100, by = H / 2 - 25, bw = 200, bh = 55;
    const hovered = this._mouseX >= bx && this._mouseX <= bx + bw &&
                    this._mouseY >= by && this._mouseY <= by + bh;
    this._drawButton(ctx, bx, by, bw, bh, 'PLAY', hovered, '#4060E0');

    // Controls hint
    ctx.font      = '12px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText('Move: A/D  Jump: W/Space  Short: J  Mid: K  Long: L', W / 2, H - 30);
    ctx.fillText('[H] toggle hitbox debug', W / 2, H - 14);
    ctx.textAlign = 'left';
  }

  _drawCharSelect(ctx, W, H) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font      = 'bold 30px monospace';
    ctx.fillText('SELECT FIGHTER', W / 2, 60);

    const cardW = 160, cardH = 220, gap = 30;
    const totalW = CHARACTER_ROSTER.length * (cardW + gap) - gap;
    const startX = (W - totalW) / 2;
    const cardY  = H / 2 - cardH / 2 - 20;

    for (let i = 0; i < CHARACTER_ROSTER.length; i++) {
      const ch  = CHARACTER_ROSTER[i];
      const cx  = startX + i * (cardW + gap);
      const sel = i === this.selectedChar;
      const hov = this._mouseX >= cx && this._mouseX <= cx + cardW &&
                  this._mouseY >= cardY && this._mouseY <= cardY + cardH;

      // Card background
      ctx.fillStyle = sel
        ? `${ch.primaryColor}55`
        : hov ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)';
      this._roundRect(ctx, cx, cardY, cardW, cardH, 10);
      ctx.fill();

      // Border
      ctx.strokeStyle = sel ? ch.primaryColor : 'rgba(255,255,255,0.2)';
      ctx.lineWidth   = sel ? 3 : 1;
      this._roundRect(ctx, cx, cardY, cardW, cardH, 10);
      ctx.stroke();

      // Model preview
      drawModel(ctx, ch.modelKey, cx + 30, cardY + 20, cardW - 60, 120, 1, { state: 'idle', frame: 0 });

      // Name
      ctx.fillStyle = ch.primaryColor;
      ctx.font      = 'bold 16px monospace';
      ctx.fillText(ch.displayName, cx + cardW / 2, cardY + 160);

      // Desc lines
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font      = '9px monospace';
      const descLines = ch.desc.split('|').map(s => s.trim());
      for (let d = 0; d < descLines.length; d++) {
        ctx.fillText(descLines[d], cx + cardW / 2, cardY + 178 + d * 14);
      }
    }

    // Confirm button
    const bx = W / 2 - 100, by = H - 80;
    const hov = this._mouseX >= bx && this._mouseX <= bx + 200 &&
                this._mouseY >= by && this._mouseY <= by + 44;
    this._drawButton(ctx, bx, by, 200, 44, 'SELECT  →', hov, '#4060E0');

    // Back button
    const bkHov = this._mouseX >= 20 && this._mouseX <= 120 &&
                  this._mouseY >= H - 55 && this._mouseY <= H - 20;
    this._drawButton(ctx, 20, H - 55, 100, 36, '← BACK', bkHov, '#333355');

    ctx.textAlign = 'left';
  }

  _drawMapSelect(ctx, W, H) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font      = 'bold 30px monospace';
    ctx.fillText('SELECT STAGE', W / 2, 60);

    const cardW = 200, cardH = 130, gap = 24;
    const totalW = this.maps.length * (cardW + gap) - gap;
    const startX = (W - totalW) / 2;
    const cardY  = H / 2 - cardH / 2 - 20;

    for (let i = 0; i < this.maps.length; i++) {
      const m   = this.maps[i];
      const cx  = startX + i * (cardW + gap);
      const sel = i === this.selectedMap;
      const hov = this._mouseX >= cx && this._mouseX <= cx + cardW &&
                  this._mouseY >= cardY && this._mouseY <= cardY + cardH;

      ctx.fillStyle = sel ? 'rgba(64,96,224,0.35)'
        : hov ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)';
      this._roundRect(ctx, cx, cardY, cardW, cardH, 10);
      ctx.fill();

      ctx.strokeStyle = sel ? '#4060E0' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth   = sel ? 3 : 1;
      this._roundRect(ctx, cx, cardY, cardW, cardH, 10);
      ctx.stroke();

      ctx.fillStyle = 'white';
      ctx.font      = 'bold 15px monospace';
      ctx.fillText(m.name, cx + cardW / 2, cardY + 60);

      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font      = '11px monospace';
      ctx.fillText(`ID: ${m.id}`, cx + cardW / 2, cardY + 82);
    }

    const bx = W / 2 - 100, by = H - 80;
    const hov = this._mouseX >= bx && this._mouseX <= bx + 200 &&
                this._mouseY >= by && this._mouseY <= by + 44;
    this._drawButton(ctx, bx, by, 200, 44, 'START GAME', hov, '#40A040');

    const bkHov = this._mouseX >= 20 && this._mouseX <= 120 &&
                  this._mouseY >= H - 55 && this._mouseY <= H - 20;
    this._drawButton(ctx, 20, H - 55, 100, 36, '← BACK', bkHov, '#333355');

    ctx.textAlign = 'left';
  }

  _drawButton(ctx, x, y, w, h, label, hovered, color) {
    ctx.fillStyle = hovered ? this._lighten(color, 30) : color;
    this._roundRect(ctx, x, y, w, h, 8);
    ctx.fill();

    ctx.strokeStyle = hovered ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)';
    ctx.lineWidth   = 1.5;
    this._roundRect(ctx, x, y, w, h, 8);
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.font      = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + h / 2 + 6);
    ctx.textAlign = 'left';
  }

  _roundRect(ctx, x, y, w, h, r) {
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

  _lighten(hex, amt) {
    const num = parseInt(hex.replace('#',''), 16);
    const r   = Math.min(255, (num >> 16) + amt);
    const g   = Math.min(255, ((num >> 8) & 0xFF) + amt);
    const b   = Math.min(255, (num & 0xFF) + amt);
    return `rgb(${r},${g},${b})`;
  }
}
