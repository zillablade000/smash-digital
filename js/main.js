/**
 * MAIN ENTRY POINT
 * Sets up the canvas, runs the game loop state machine:
 *   MENU → GAME → RESULT → MENU
 *
 * Fixed timestep at 60 FPS using requestAnimationFrame accumulator.
 * Network-ready: game logic tick is decoupled from render.
 */

import { MenuScreen }    from './ui/menu.js';
import { ResultScreen }  from './ui/resultScreen.js';
import { GameScene }     from './GameScene.js';

// ─── Canvas setup ─────────────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

const W = 800;
const H = 500;
canvas.width  = W;
canvas.height = H;

// Scale canvas CSS to fit viewport while keeping 800×500 aspect ratio
function resizeCanvas() {
  const scaleX = window.innerWidth  / W;
  const scaleY = window.innerHeight / H;
  const scale  = Math.min(scaleX, scaleY);
  canvas.style.width  = `${W * scale}px`;
  canvas.style.height = `${H * scale}px`;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ─── State Machine ────────────────────────────────────────────────────────────
let currentState = null;   // 'menu' | 'game' | 'result'
let menu         = null;
let game         = null;
let result       = null;

function goToMenu() {
  currentState = 'menu';
  result?.detach();
  game   = null;
  result = null;
  menu   = new MenuScreen(W, H, (selection) => {
    startGame(selection);
  });
  menu.attach(canvas);
}

function startGame({ characterId, mapId }) {
  menu?.detach();
  menu = null;
  currentState = 'game';
  game = new GameScene({
    characterId,
    mapId,
    W,
    H,
    onGameOver: ({ winner, winnerName, winnerColor }) => {
      currentState = 'result';
      result = new ResultScreen(W, H, () => {
        goToMenu();
      });
      result.show(winner, winnerName, winnerColor, canvas);
    },
  });
}

// ─── Fixed-Timestep Loop ──────────────────────────────────────────────────────
const TARGET_FPS   = 60;
const FRAME_MS     = 1000 / TARGET_FPS;
let   lastTime     = 0;
let   accumulator  = 0;

function loop(timestamp) {
  requestAnimationFrame(loop);

  const delta   = Math.min(timestamp - lastTime, 50);   // cap at 50ms to avoid spiral
  lastTime      = timestamp;
  accumulator  += delta;

  while (accumulator >= FRAME_MS) {
    tick();
    accumulator -= FRAME_MS;
  }

  render(ctx);
}

function tick() {
  if (currentState === 'menu')   menu?.update();
  if (currentState === 'game')   game?.update();
  if (currentState === 'result') result?.update();
}

function render(ctx) {
  ctx.clearRect(0, 0, W, H);

  if (currentState === 'menu')   menu?.draw(ctx);
  if (currentState === 'game') {
    game?.draw(ctx);
    // Overlay result screen if game just ended
    result?.draw(ctx);
  }
  if (currentState === 'result') {
    // Draw frozen game world underneath
    game?.draw(ctx);
    result?.draw(ctx);
  }
}

// ─── Kick off ─────────────────────────────────────────────────────────────────
goToMenu();
requestAnimationFrame((t) => { lastTime = t; loop(t); });
