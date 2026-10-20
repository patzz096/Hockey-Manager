// Sauvegarde de partie : la partie en cours (alignements, saison, finances, etc.) vivait
// uniquement dans l'état React — perdue à chaque rechargement de page. Deux mécanismes, tous deux
// branchés sur le même magasin IndexedDB ("game", voir custom/storage.js) :
//  - sauvegarde automatique (App.jsx, débattue à chaque changement) : fermer l'onglet et revenir
//    plus tard reprend exactement où on en était, comme un vrai logiciel ;
//  - export/import manuel en fichier .json (ci-dessous) : une vraie sauvegarde portable, à
//    déplacer d'un appareil à l'autre ou garder en lieu sûr avant une modification risquée.
import { getItem, setItem, deleteItem } from "../custom/storage";
import { saveFile } from "../ui/saveFile";

const SAVE_VERSION = 1;

export async function loadSavedGame() {
  try { return (await getItem("game", "state")) || null; } catch { return null; }
}
export async function persistGame(bundle) {
  try { await setItem("game", "state", { version: SAVE_VERSION, savedAt: Date.now(), ...bundle }); } catch { /* quota, navigation privée : tant pis, pas bloquant */ }
}
export async function clearSavedGame() {
  try { await deleteItem("game", "state"); } catch { /* idem */ }
}

export async function exportSaveFile(bundle) {
  const text = JSON.stringify({ version: SAVE_VERSION, savedAt: Date.now(), ...bundle });
  const date = new Date().toISOString().slice(0, 10);
  return { result: await saveFile(`hockey-gm-sauvegarde-${date}.json`, text, "application/json"), size: text.length };
}

// Valide grossièrement un fichier importé (forme attendue) avant de l'installer : une sauvegarde
// corrompue ou d'un autre jeu ne doit pas planter la partie au prochain chargement.
export function parseSaveFile(text) {
  let data;
  try { data = JSON.parse(text); } catch { throw new Error("Ce fichier n'est pas un JSON valide."); }
  if (!data || typeof data !== "object" || !Array.isArray(data.teams) || typeof data.seasonYear !== "number") {
    throw new Error("Ce fichier ne ressemble pas à une sauvegarde Hockey GM.");
  }
  return data;
}
