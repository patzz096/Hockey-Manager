// Sauvegarde de partie : la partie en cours (alignements, saison, finances, etc.) vivait
// uniquement dans l'état React — perdue à chaque rechargement de page. Magasin IndexedDB "game"
// (voir custom/storage.js), à plusieurs franchises :
//  - sauvegarde automatique (App.jsx, débattue à chaque changement) dans la franchise ACTIVE :
//    fermer l'onglet et revenir plus tard reprend exactement où on en était, comme un vrai logiciel ;
//  - plusieurs franchises peuvent coexister (CustomizationPanel, « Mes franchises ») : en quitter
//    une n'efface rien, elle reste listée et rechargeable — un seul pointeur ("franchise active")
//    décide laquelle se recharge automatiquement au démarrage (main.jsx) ;
//  - export/import manuel en fichier .json (ci-dessous) : une vraie sauvegarde portable, à
//    déplacer d'un appareil à l'autre ou garder en lieu sûr avant une modification risquée.
import { getItem, setItem, deleteItem } from "../custom/storage";
import { saveFile } from "../ui/saveFile";

const SAVE_VERSION = 1;
const ACTIVE_KEY = "__active__";
const INDEX_KEY = "franchiseIndex"; // magasin "settings" : liste légère (sans les alignements) pour afficher "Mes franchises" sans recharger chaque sauvegarde en entier.

const slotKey = (id) => `slot:${id}`;
const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

async function getIndex() { try { return (await getItem("settings", INDEX_KEY)) || []; } catch { return []; } }
async function setIndex(list) { try { await setItem("settings", INDEX_KEY, list); } catch { /* idem */ } }
async function removeFromIndex(id) { await setIndex((await getIndex()).filter((x) => x.id !== id)); }

export async function getActiveSlotId() {
  try { return (await getItem("game", ACTIVE_KEY)) || null; } catch { return null; }
}
async function setActiveSlotId(id) { try { await setItem("game", ACTIVE_KEY, id); } catch { /* idem */ } }

export async function loadSavedGame() {
  const id = await getActiveSlotId();
  if (!id) return null;
  try { return (await getItem("game", slotKey(id))) || null; } catch { return null; }
}

// Nom d'affichage d'une franchise : l'équipe choisie (une fois le choix fait), sinon générique.
function franchiseTeamName(bundle) {
  const team = bundle.teams?.find((t) => t.id === bundle.myTeamId);
  return team ? team.name : null;
}

export async function persistGame(bundle) {
  try {
    let id = await getActiveSlotId();
    if (!id) { id = newId(); await setActiveSlotId(id); }
    const savedAt = Date.now();
    const teamName = franchiseTeamName(bundle);
    await setItem("game", slotKey(id), { id, version: SAVE_VERSION, savedAt, ...bundle });
    const list = await getIndex();
    const entry = { id, savedAt, seasonYear: bundle.seasonYear, teamName };
    const i = list.findIndex((x) => x.id === id);
    if (i >= 0) list[i] = entry; else list.unshift(entry);
    await setIndex(list);
  } catch { /* quota, navigation privée : tant pis, pas bloquant */ }
}

// Franchises sauvegardées, la plus récemment jouée en premier (sans charger les alignements).
export async function listFranchises() {
  const [index, activeId] = await Promise.all([getIndex(), getActiveSlotId()]);
  return index.map((x) => ({ ...x, active: x.id === activeId })).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
}

// Quitte la franchise active SANS la supprimer (elle reste listée, rechargeable plus tard via
// switchFranchise) et prépare un nouveau départ — voir main.jsx startNewGame.
export async function startNewFranchise() {
  await setActiveSlotId(null);
}

// Change de franchise active et renvoie son contenu pour reprendre dessus (main.jsx).
export async function switchFranchise(id) {
  await setActiveSlotId(id);
  try { return (await getItem("game", slotKey(id))) || null; } catch { return null; }
}

export async function deleteFranchise(id) {
  try { await deleteItem("game", slotKey(id)); } catch { /* idem */ }
  await removeFromIndex(id);
  if ((await getActiveSlotId()) === id) await setActiveSlotId(null);
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
