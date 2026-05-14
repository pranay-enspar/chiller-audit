// Audit data → localStorage (JSON)
// Photos → IndexedDB (large binary-safe)

const AUDIT_KEY = 'enspar_audit_v1';
const SAVED_AT_KEY = 'enspar_saved_at';
const DB_NAME = 'enspar-photos';
const STORE_NAME = 'photos';

// ── Audit data ───────────────────────────────────────────────────────────────

export function saveAudit(data) {
  try {
    localStorage.setItem(AUDIT_KEY, JSON.stringify(data));
    localStorage.setItem(SAVED_AT_KEY, Date.now().toString());
    return true;
  } catch (e) {
    console.error('saveAudit failed', e);
    return false;
  }
}

export function loadAudit() {
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAudit() {
  localStorage.removeItem(AUDIT_KEY);
  localStorage.removeItem(SAVED_AT_KEY);
}

export function getLastSavedAt() {
  const v = localStorage.getItem(SAVED_AT_KEY);
  return v ? parseInt(v) : null;
}

// ── IndexedDB helpers ─────────────────────────────────────────────────────────

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function savePhoto(photo) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(photo);
    tx.oncomplete = () => resolve(photo);
    tx.onerror = e => reject(e.target.error);
  });
}

export async function getPhoto(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = e => resolve(e.target.result || null);
    req.onerror = e => reject(e.target.error);
  });
}

export async function getAllPhotos() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = e => resolve(e.target.result || []);
    req.onerror = e => reject(e.target.error);
  });
}

export async function deletePhoto(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = e => reject(e.target.error);
  });
}

export async function clearAllPhotos() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = e => reject(e.target.error);
  });
}

// ── Settings (API key, etc.) ──────────────────────────────────────────────────

export function getApiKey() {
  return localStorage.getItem('enspar_api_key') || '';
}

export function setApiKey(key) {
  if (key) localStorage.setItem('enspar_api_key', key);
  else localStorage.removeItem('enspar_api_key');
}
