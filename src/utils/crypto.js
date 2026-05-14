// PIN authentication using Web Crypto API (SHA-256)
// PIN is stored as hash — never plaintext

const SALT = 'enspar-audit-v1-salt';
const STORAGE_KEY = 'enspar_pin_hash';
const SESSION_KEY = 'enspar_session';

async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function hasPin() {
  return !!localStorage.getItem(STORAGE_KEY);
}

export async function setPin(pin) {
  const hash = await hashPin(pin);
  localStorage.setItem(STORAGE_KEY, hash);
}

export async function verifyPin(pin) {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return false;
  const hash = await hashPin(pin);
  return hash === stored;
}

export function isSessionActive() {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

export function startSession() {
  sessionStorage.setItem(SESSION_KEY, '1');
}

export function endSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
