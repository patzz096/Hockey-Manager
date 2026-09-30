import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import HockeyGM from "./App";
import "./ui/global.css";
import { CustomizationProvider, useCustomization } from "./custom/CustomizationContext";

// Attend la personnalisation (base de données, équipes), puis lance une partie.
// « Nouvelle partie » change la clé et recrée la ligue avec la base active.
function GameRoot() {
  const { ready, rosterDb, teamInfo } = useCustomization();
  const [gameKey, setGameKey] = useState(0);
  if (!ready) return <div style={{ background: "#0B1B2E", color: "#C7D2DD", minHeight: 600, padding: 40, fontFamily: "Barlow, 'Segoe UI', system-ui, sans-serif" }}>Chargement…</div>;
  const custom = { teams: rosterDb?.teams || {}, teamInfo: mergeInfo(rosterDb?.teamInfo, teamInfo) };
  return <HockeyGM key={gameKey} custom={custom} onNewGame={() => setGameKey((k) => k + 1)} />;
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
