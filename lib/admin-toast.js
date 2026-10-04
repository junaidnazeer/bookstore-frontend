// A tiny toast channel that works from ANY component — including the page
// component itself, which sits above <AdminLayout> and so can't read a React
// context provided inside it. Toasts fired just before a navigation (for
// example "Product created" followed by a redirect) are replayed to the layout
// of the next page, so they aren't lost when the old layout unmounts.
const listeners = new Set();
let recent = []; // { id, message, type, at }
const REPLAY_MS = 2500;

export function toast(message, type = "success") {
  const item = {
    id: Math.random().toString(36).slice(2),
    message,
    type,
    at: Date.now(),
  };
  recent = [...recent.filter((r) => item.at - r.at < REPLAY_MS), item];
  listeners.forEach((fn) => fn(item));
}

export function subscribeToasts(fn) {
  listeners.add(fn);
  const now = Date.now();
  recent.filter((r) => now - r.at < REPLAY_MS).forEach((r) => fn(r));
  return () => listeners.delete(fn);
}
