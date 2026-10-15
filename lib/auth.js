// Where the login lives: localStorage when "Remember me" is ticked,
// sessionStorage when it isn't. Everything that reads or clears the login
// should go through these helpers so both cases behave the same.
const KEYS = ["token", "role", "userName", "userEmail"];

const inBrowser = () => typeof window !== "undefined";

// Same order api.js uses: remembered login first, then session-only.
export function getStored(key) {
  if (!inBrowser()) return null;
  return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
}

export function getToken() {
  return getStored("token");
}

// Saves into whichever storage currently holds the login.
export function setStored(key, value) {
  if (!inBrowser()) return;
  const sessionOnly =
    window.sessionStorage.getItem("token") &&
    !window.localStorage.getItem("token");
  (sessionOnly ? window.sessionStorage : window.localStorage).setItem(
    key,
    value,
  );
}

// Logs out of both storages.
export function clearAuth() {
  if (!inBrowser()) return;
  KEYS.forEach((k) => {
    window.localStorage.removeItem(k);
    window.sessionStorage.removeItem(k);
  });
}
