export const VARS = { "--navy": "#0B1B2E", "--navy2": "#122A45", "--ice": "#F0F4F8", "--iceMuted": "#C7D2DD", "--red": "#C8102E", "--steel": "#5C7080", "--win": "#2E8B57", "--loss": "#B84A4A" };

export const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');";

export const h2Style = { fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 20, marginBottom: 14 };

export function btnStyle(bg) { return { display: "flex", alignItems: "center", gap: 6, background: bg, color: "#fff", border: "none", borderRadius: 3, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }; }

export function ratingColor(val) { return val >= 85 ? "var(--win)" : val >= 65 ? "#D9A404" : "var(--loss)"; }

export const inputStyle = { background: "var(--navy)", color: "var(--ice)", border: "1px solid #ffffff33", borderRadius: 3, padding: "7px 8px", fontSize: 13, width: "100%" };

export function attr20Color(v20) { return v20 >= 16 ? "var(--win)" : v20 >= 11 ? "#D9A404" : "var(--loss)"; }

export function scoutQualityColor(quality) { return quality >= 65 ? "#D9A404" : "var(--ice)"; }
