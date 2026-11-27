// The optional game cursor (decision LR48): the visitor's choice, kept on this device, and whether this device can show
// it. This is the only cursor code a page loads while the setting is off; the cursor itself (cursor.ts) is imported
// only once it is switched on, on a desktop mouse, without reduced motion. Storage blocked: the choice lasts for this
// page only.

export const CURSOR_KEY = 'vf-cursor';
export const CURSOR_EVENT = 'vf:cursor';
export type CursorChoice = 'off' | 'arrow' | 'pistol';

export const parseCursor = (v: string | null | undefined): CursorChoice => (v === 'arrow' || v === 'pistol' ? v : 'off');

// The choice in this page's memory, used only once storage has failed (so another tab's change is still followed).
let memory: CursorChoice | null = null;
export const readCursor = (): CursorChoice => {
  if (memory !== null) return memory;
  try { return parseCursor(localStorage.getItem(CURSOR_KEY)); } catch { return 'off'; }
};
export const writeCursor = (c: CursorChoice) => {
  try {
    if (c === 'off') localStorage.removeItem(CURSOR_KEY);
    else localStorage.setItem(CURSOR_KEY, c);
  } catch { memory = c; /* private mode or blocked storage: the choice lasts for this page */ }
  document.dispatchEvent(new CustomEvent(CURSOR_EVENT, { detail: c }));
};

/** Media queries that decide whether the cursor may show: a mouse or trackpad, and no reduced motion. */
export const CURSOR_POINTER = '(hover: hover) and (pointer: fine)';
export const CURSOR_REDUCED = '(prefers-reduced-motion: reduce)';
