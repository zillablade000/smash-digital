/**
 * RESULT SCREEN
 * Shown after a fighter's HP reaches 0.
 * Displays winner, then returns to menu on prompt.
 */

export class ResultScreen {
  constructor(W, H, onReturnToMenu) {
    this.W             = W;
    this.H             = H;
    this.onReturnToMenu= onReturnToMenu;
    this.winner        = null;    // 'player' | 'cpu'
    this.winnerName    = '';
    this.winnerColor   = '#ffffff';
    this._frame        = 0;
    this._mouseX       = 0;
    this._mouseY       = 0;
  }

  /**
   * Show the result screen.
   * @param {string} winner       'player' | 'cpu'
   * @param {string} winnerName   display name
   * @param {string} winnerColor  hex color
   */
  show(winner, winnerName, winnerColor, canvas) {
    this.winner      = winner;
    this.winnerName  = winnerName;
    this.winnerColor = winnerColor;
    this._frame      = 0;
    this._canvas     = canvas;

    this._onMouseMove = (e) => {
      const r = e.target.getBoundingClientRect();
      this._mouseX = e.clientX - r.left;
      this._mouseY = e.clientY - r.top;
    };
    this._onClick = (e) => {
      const r = e.target.getBoundingClientRect();
      this._handleClick(e.clientX - r.left, e.clientY - r.top);
    };
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
    const bx = W / 2 - 120, by = H / 2 + 80;
    if (mx >= bx && mx <= bx + 240 && my >= by && my <= by + 50) {
      this.detach();
      this.onReturnToMenu();
    }
  }

  update() { this._frame++; }

  draw(ctx) {
    const W = this.W, H = this.H;
    const f = this._frame;

    // Semi-transparent overlay
    const alpha = Math.min(0.82, f / 40);
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.fillRect(0, 0, W, H);

    if (f < 20) return;   // Brief delay before showing text

    const slideY = Math.max(0, 40 - (f - 20) * 3);

    // Winner banner
    ctx.textAlign  = 'center';
    ctx.shadowColor = this.winnerColor;
    ctx.shadowBlur  = 30;
    ctx.fillStyle   = this.winnerColor;
    ctx.font        = 'bold 18px monospace';
    ctx.fillText(
      this.winner === 'player' ? 'VICTORY!' : 'DEFEAT!',
      W / 2, H / 2 - 80 + slideY
    );

    ctx.shadowBlur = 0;
    ctx.fillStyle  = 'white';
    ctx.font       = 'bold 44px monospace';
    ctx.fillText(this.winnerName, W / 2, H / 2 - 20 + slideY);

    ctx.fillStyle  = 'rgba(255,255,255,0.6)';
    ctx.font       = '16px monospace';
    ctx.fillText(
      this.winner === 'player' ? 'You Win!' : 'The CPU Box won...',
      W / 2, H / 2 + 30 + slideY
    );

    // Menu button
    if (f > 50) {
      const bx = W / 2 - 120, by = H / 2 + 80;
      const hov = this._mouseX >= bx && this._mouseX <= bx + 240 &&
                  this._mouseY >= by  && this._mouseY <= by + 50;

      ctx.fillStyle = hov ? '#6080FF' : '#4060CC';
      ctx.beginPath();
      ctx.roundRect(bx, by, 240, 50, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth   = 1;
      ctx.stroke();

      ctx.fillStyle = 'white';
      ctx.font      = 'bold 16px monospace';
      ctx.fillText('BACK TO MENU', W / 2, by + 32);
    }

    ctx.textAlign = 'left';
    ctx.shadowBlur= 0;
  }
}
