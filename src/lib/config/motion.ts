// Motion feature flags — sticky (finger-tracking) swipe per tab level.
// Release-to-navigate stays the behavior wherever a flag is off.

/** Outer tabs follow the finger during a swipe. */
export const USE_STICKY_SWIPE = true;

/** Inner tab groups follow the finger. Off by default. */
export const STICKY_SWIPE_INNER_TAB = false;

// Press-feedback gate (see `core/shell/press.ts`): press-driven navigation
// and overlay actions wait out the ripple expand phase before firing, like
// native Android. Zero it at runtime via `configurePress()` — e.g. to keep
// web navigation instant while native waits.

/** Gate delay in ms (ripple expand is 200ms). Reduced motion forces 0. */
export const PRESS_FEEDBACK_MS = 200;

/** Master switch for the gate. */
export const PRESS_FEEDBACK_ENABLED = true;
