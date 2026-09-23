// Stockage local de la personnalisation (base de données, équipes, logos, facepack).
// IndexedDB : les images d'un facepack dépassent vite la limite de localStorage.
// Si IndexedDB est indisponible (navigation privée, aperçu), on garde tout en mémoire.
const DB_NAME = "hockey-gm-custom";
const STORES = ["settings", "logos", "faces"];
const memory = Object.fromEntries(STORES.map((s) => [s, new Map()]));
let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => STORES.forEach((s) => { if (!req.result.objectStoreNames.contains(s)) req.result.createObjectStore(s); });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

function run(store, mode, fn) {
  return openDb().then((db) => {
    if (!db) return fn(null);
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(store, mode);
        const req = fn(tx.objectStore(store));
        tx.oncomplete = () => resolve(req?.result);
        tx.onerror = () => resolve(undefined);
      } catch {
        resolve(undefined);
      }
    });
  });
}

export function getItem(store, key) {
  return run(store, "readonly", (s) => (s ? s.get(key) : { result: memory[store].get(key) })).then((r) => (r === undefined ? memory[store].get(key) : r));
}
export function setItem(store, key, value) {
  memory[store].set(key, value);
  return run(store, "readwrite", (s) => s && s.put(value, key));
}
export function deleteItem(store, key) {
  memory[store].delete(key);
  return run(store, "readwrite", (s) => s && s.delete(key));
}
export function clearStore(store) {
  memory[store].clear();
  return run(store, "readwrite", (s) => s && s.clear());
}
// Toutes les entrées d'un magasin : { clé: valeur }.
export async function getAll(store) {
  const db = await openDb();
  if (!db) return Object.fromEntries(memory[store]);
  return new Promise((resolve) => {
    const out = {};
    try {
      const req = db.transaction(store, "readonly").objectStore(store).openCursor();
      req.onsuccess = () => {
        const c = req.result;
        if (c) { out[c.key] = c.value; c.continue(); } else resolve(out);
      };
      req.onerror = () => resolve(Object.fromEntries(memory[store]));
    } catch {
      resolve(Object.fromEntries(memory[store]));
    }
  });
}
