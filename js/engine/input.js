/**
 * INPUT MANAGER
 * Tracks keyboard state for P1 and P2 (local co-op ready).
 * Designed so network layer can inject remote input for P2.
 *
 * P1 Controls:
 *   Move:       A / D  or  ←→
 *   Jump:       W  or  ↑  or  Space
 *   Short atk:  J
 *   Mid atk:    K
 *   Long atk:   L
 *
 * P2 Controls (local placeholder — same board):
 *   Move:       ← →  (numpad 4/6)
 *   Jump:       Numpad 8
 *   Short:      Numpad 1
 *   Mid:        Numpad 2
 *   Long:       Numpad 3
 */

const _held    = {};   // key → true while held
const _pressed = {};   // key → true for ONE frame (cleared after read)
const _released= {};   // key → true for ONE frame

window.addEventListener('keydown', (e) => {
  if (!_held[e.code]) {
    _pressed[e.code] = true;
  }
  _held[e.code] = true;
  // Prevent page scroll on arrow keys / space
  if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
    e.preventDefault();
  }
});

window.addEventListener('keyup', (e) => {
  _held[e.code]     = false;
  _released[e.code] = true;
});

/** Call at end of each frame to clear single-frame states. */
export function flushInput() {
  for (const k in _pressed)  delete _pressed[k];
  for (const k in _released) delete _released[k];
}

export function isHeld(code)     { return !!_held[code]; }
export function isPressed(code)  { return !!_pressed[code]; }
export function isReleased(code) { return !!_released[code]; }

// ─── Named Input Queries ──────────────────────────────────────────────────────

export const P1 = {
  left:    () => isHeld('KeyA')     || isHeld('ArrowLeft'),
  right:   () => isHeld('KeyD')     || isHeld('ArrowRight'),
  jump:    () => isPressed('KeyW')  || isPressed('ArrowUp') || isPressed('Space'),
  short:   () => isPressed('KeyJ'),
  mid:     () => isPressed('KeyK'),
  long:    () => isPressed('KeyL'),
};

// P2 will be remote-injected in multiplayer mode; for now placeholder
export const P2 = {
  left:    () => isHeld('Numpad4'),
  right:   () => isHeld('Numpad6'),
  jump:    () => isPressed('Numpad8'),
  short:   () => isPressed('Numpad1'),
  mid:     () => isPressed('Numpad2'),
  long:    () => isPressed('Numpad3'),
};

/**
 * Returns a plain snapshot of P1 input for a single frame.
 * This is the structure that will be sent over the network for prediction/rollback.
 */
export function snapshotP1() {
  return {
    left:  isHeld('KeyA')     || isHeld('ArrowLeft'),
    right: isHeld('KeyD')     || isHeld('ArrowRight'),
    jump:  isPressed('KeyW')  || isPressed('ArrowUp') || isPressed('Space'),
    short: isPressed('KeyJ'),
    mid:   isPressed('KeyK'),
    long:  isPressed('KeyL'),
  };
}
