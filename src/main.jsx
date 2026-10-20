import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import HockeyGM from "./App";
import "./ui/global.css";
import { CustomizationProvider, useCustomization } from "./custom/CustomizationContext";
import { loadSavedGame, clearSavedGame } from "./engine/gameSave";

// Attend la personnalisation (base de données, équipes) et la sauvegarde de partie, puis lance
// une partie — reprise là où elle était si une sauvegarde existe (voir engine/gameSave.js),
// nouvelle sinon. « Nouvelle partie » efface la sauvegarde puis change la clé pour tout recréer.
function GameRoot() {
  const { ready, rosterDb, teamInfo } = useCustomization();
  const [gameKey, setGameKey] = useState(0);
  const [savedGame, setSavedGame] = useState(undefined); // undefined = en cours de chargement
  useEffect(() => { loadSavedGame().then(setSavedGame); }, [gameKey]);
  if (!ready || savedGame === undefined) return <div style={{ background: "#0B1B2E", color: "#C7D2DD", minHeight: 600, padding: 40, fontFamily: "Barlow, 'Segoe UI', system-ui, sans-serif" }}>Chargement…</div>;
  const custom = { teams: rosterDb?.teams || {}, teamInfo: mergeInfo(rosterDb?.teamInfo, teamInfo) };
  async function startNewGame() {
    setSavedGame(undefined);
    await clearSavedGame();
    setGameKey((k) => k + 1);
  }
  // Après l'import d'un fichier de sauvegarde (déjà écrit dans IndexedDB par App.jsx), remonte
  // tout HockeyGM pour que les ~40 états se réinitialisent depuis cette sauvegarde — même
  // précaution que startNewGame : repasser par l'écran de chargement plutôt que de garder
  // `savedGame` périmé le temps que l'effet ci-dessus le recharge.
  function gameImported() {
    setSavedGame(undefined);
    setGameKey((k) => k + 1);
  }
  return <HockeyGM key={gameKey} custom={custom} savedGame={savedGame} onNewGame={startNewGame} onGameImported={gameImported} />;
}
function mergeInfo(a = {}, b = {}) {
  const out = { ...a };
  Object.entries(b).forEach(([id, v]) => { out[id] = { ...(out[id] || {}), ...v }; });
  return out;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <CustomizationProvider>
      <GameRoot />
    </CustomizationProvider>
  </StrictMode>
);

// Mode hors ligne (PWA, "Ajouter à l'écran d'accueil") : uniquement en production (jamais en dev,
// pour ne pas mettre en cache un état obsolète pendant le rechargement à chaud) ; sans effet dans
// l'artefact Claude (iframe isolée), utile une fois le site hébergé (voir build:pages).
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}
