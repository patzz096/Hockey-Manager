// Palette « patinoire de nuit » : fond bleu nuit, surfaces glace, rouge lumière de but pour
// l'action principale, bleu glace pour la sélection / le focus, or pour les étoiles.
export const VARS = {
  "--navy": "#0A1627",     // fond de page
  "--navy2": "#12223A",    // surfaces (cartes, barre latérale)
  "--navy3": "#1A2E4B",    // surfaces surélevées, survol
  "--line": "#2A4163",     // filets et bordures
  "--ice": "#EAF2FB",      // texte principal
  "--iceMuted": "#94A9C2", // texte secondaire
  "--accent": "#5CC8FF",   // sélection, focus, onglet actif
  "--gold": "#FFC247",     // étoiles, mises en valeur
  "--red": "#E8323F",      // action principale (lumière de but)
  "--steel": "#35527A",    // action secondaire
  "--win": "#2DBE74",
  "--loss": "#F0605D",
};

export const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Barlow:wght@400;500;600;700&display=swap');";
export const BODY_FONT = "Barlow, 'Segoe UI', system-ui, sans-serif";

export const h2Style = { fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 22, letterSpacing: 0.3, marginBottom: 14 };

// Bouton « de jeu » : relief léger, se soulève au survol et s'enfonce au clic (voir global.css).
// `color` : texte du bouton — blanc par défaut (fonds foncés : red/steel/win), à passer en
// "#06141F" pour un fond clair (accent, gold) où le blanc manquerait de contraste.
export function btnStyle(bg, color = "#fff") {
  return {
    display: "flex", alignItems: "center", gap: 6,
    background: bg,
    backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0) 55%, rgba(0,0,0,0.12))",
    color, border: "1px solid rgba(255,255,255,0.10)", borderRadius: 7,
    padding: "9px 15px", fontSize: 13, fontWeight: 600, letterSpacing: 0.2,
    fontFamily: BODY_FONT, cursor: "pointer",
    boxShadow: "0 2px 0 rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.18)",
  };
}
// Couleurs d'action cohérentes (plutôt que rouge/acier/vert façon feu de circulation) : accent
// pour l'action principale (faire avancer la partie), acier pour une alternative secondaire, or
// pour une action spéciale/mise en valeur (sim en direct). Texte foncé sur accent/or (fonds clairs).
export const ACTION_PRIMARY = ["var(--accent)", "#06141F"];
export const ACTION_SPECIAL = ["var(--gold)", "#06141F"];

export function ratingColor(val) { return val >= 85 ? "var(--win)" : val >= 65 ? "var(--gold)" : "var(--loss)"; }

export const inputStyle = { background: "var(--navy)", color: "var(--ice)", border: "1px solid var(--line)", borderRadius: 6, padding: "7px 9px", fontSize: 13, width: "100%", fontFamily: BODY_FONT };

export function attr20Color(v20) { return v20 >= 16 ? "var(--win)" : v20 >= 11 ? "var(--gold)" : "var(--loss)"; }

export function scoutQualityColor(quality) { return quality >= 65 ? "var(--gold)" : "var(--ice)"; }

// Bouton de sélection plat (choix, onglet, filtre) : plein d'accent à l'état actif (bien visible
// au premier coup d'œil, même langage de couleur que le reste de l'interface), gris neutre sinon.
export function selectStyle(active, opts = {}) {
  return {
    display: "inline-flex", alignItems: "center", gap: opts.gap ?? 6,
    padding: opts.padding ?? "7px 12px", borderRadius: opts.radius ?? 6,
    fontSize: opts.fontSize ?? 12, fontWeight: active ? 700 : 500,
    fontFamily: "inherit", cursor: "pointer",
    color: active ? "#06141F" : "var(--iceMuted)",
    background: active ? "var(--accent)" : "var(--navy2)",
    border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`,
    boxShadow: active ? "0 2px 8px rgba(92,200,255,0.35)" : "none",
  };
}
