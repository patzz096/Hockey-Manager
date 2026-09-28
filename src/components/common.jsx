import { useState } from "react";
import { Star } from "lucide-react";
import { attr20, teamOvrBenchmark, starsFor } from "../engine/attributes";
import { attr20Color, btnStyle } from "../ui/theme";
import { injuryLabel } from "../engine/injuries";
import { formatDay } from "../engine/calendar";
import { useCustomization, useFaceUrl } from "../custom/CustomizationContext";

export function SortTh({ label, sortKey, activeKey, activeDir, onSort }) {
  const active = sortKey === activeKey;
  return (
    <th onClick={() => onSort(sortKey)} style={{ textAlign: "left", padding: "6px 10px", color: active ? "var(--ice)" : "var(--iceMuted)", fontWeight: 500, fontSize: 12, borderBottom: "1px solid #ffffff22", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
      {label}{active ? (activeDir === "asc" ? " ▲" : " ▼") : ""}
    </th>
  );
}

export function teamInitials(name) {
  return name.split(" ").filter((w) => w.length > 1 || /[A-ZÀ-Ü]/.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export function TeamCrest({ team, size = 40 }) {
  const { logos } = useCustomization();
  const logo = logos[team.id];
  if (logo) return <img src={logo} alt={team.name} style={{ width: size, height: size, objectFit: "contain", flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `linear-gradient(145deg, ${team.color}, ${team.color}cc)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "2px solid #ffffff33", boxShadow: "0 2px 4px #00000055" }}>
      <span style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: size * 0.38, color: "#fff" }}>{teamInitials(team.name)}</span>
    </div>
  );
}

// Photo du joueur (facepack) ou, à défaut, silhouette avec ses initiales.
export function PlayerFace({ player, size = 44, color = "#5C7080" }) {
  const url = useFaceUrl(player);
  const box = { width: size, height: size, borderRadius: "50%", flexShrink: 0, border: "2px solid #ffffff55", overflow: "hidden", background: "#00000030", display: "flex", alignItems: "center", justifyContent: "center" };
  if (url) return <div style={box}><img src={url} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>;
  const initials = String(player.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return <div style={{ ...box, background: `${color}66` }}><span style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: size * 0.36, color: "#ffffffcc" }}>{initials}</span></div>;
}

export function StarRating({ value, size = 14, color = "var(--gold)" }) {
  const items = [];
  for (let i = 1; i <= 5; i++) {
    const fillPct = value >= i ? 100 : value >= i - 0.5 ? 50 : 0;
    items.push(
      <span key={i} style={{ position: "relative", width: size, height: size, display: "inline-block" }}>
        <Star size={size} color="#ffffff33" />
        <span style={{ position: "absolute", top: 0, left: 0, width: `${fillPct}%`, height: "100%", overflow: "hidden" }}>
          <Star size={size} color={color} fill={color} />
        </span>
      </span>
    );
  }
  return <div style={{ display: "inline-flex", gap: 1 }}>{items}</div>;
}

export function PlayerStars({ player, team, width }) {
  const bench = teamOvrBenchmark(team);
  const cur = starsFor(player.ovr, bench);
  const pot = starsFor(player.potential, bench);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: width ? "nowrap" : "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ fontSize: 11, color: "var(--iceMuted)" }}>Act.</span><StarRating value={cur} /></div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ fontSize: 11, color: "var(--iceMuted)" }}>Pot.</span><StarRating value={pot} color="#7A9EDB" /></div>
    </div>
  );
}

export function AttrRow({ label, val }) {
  const v20 = attr20(val);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" }}>
      <span style={{ fontSize: 12, color: "var(--iceMuted)" }}>{label}</span>
      <span style={{ background: attr20Color(v20), color: "#0B1B2E", fontWeight: 700, fontSize: 11, borderRadius: 3, padding: "1px 7px", minWidth: 24, textAlign: "center" }}>{v20}</span>
    </div>
  );
}

export function InfoCard({ label, children, accent }) {
  return (
    <div style={{ background: "var(--navy)", border: `1px solid ${accent ? accent + "55" : "#ffffff22"}`, borderTop: accent ? `3px solid ${accent}` : "1px solid #ffffff22", borderRadius: 4, padding: "10px 12px", flex: 1, minWidth: 130 }}>
      <div style={{ fontSize: 10, color: "var(--iceMuted)", letterSpacing: 0.5, marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  );
}

// Nom de joueur cliquable : ouvre son profil, où qu'il soit affiché. `onContextMenu` (optionnel) :
// clic droit → menu rapide (contrat, ballottage, rappel/renvoi, liste d'échange, etc. — voir
// App.jsx openPlayerContextMenu), partout où PlayerLink est déjà utilisé.
export function PlayerLink({ player, team, onSelect, onContextMenu, children, style }) {
  if (!player) return <span style={style}>{children ?? "?"}</span>;
  if (!onSelect) return <span style={style}>{children ?? player.name}</span>;
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSelect(player, team); }}
      onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onSelect(player, team); } }}
      onContextMenu={onContextMenu ? (e) => { e.preventDefault(); e.stopPropagation(); onContextMenu(e, player); } : undefined}
      style={{ cursor: "pointer", textDecoration: "underline dotted", textUnderlineOffset: 3, ...style }}
    >
      {children ?? player.name}
    </span>
  );
}

// Bouton à confirmation intégrée (deux clics) : les fenêtres confirm() sont bloquées dans
// certains lecteurs (artefacts Claude).
export function ConfirmButton({ label, confirmLabel, color, onConfirm, small = false, title }) {
  const [armed, setArmed] = useState(false);
  return (
    <button title={title} onClick={(e) => { e.stopPropagation(); if (armed) { setArmed(false); onConfirm(); } else setArmed(true); }} onBlur={() => setArmed(false)} style={{ ...btnStyle(armed ? "var(--red)" : color), fontSize: small ? 11 : 12, ...(small ? { padding: "3px 8px" } : {}) }}>
      {armed ? confirmLabel : label}
    </button>
  );
}

// Pastille « blessé » (croix rouge + durée), ou « LTIR ».
export function InjuryBadge({ injury, day }) {
  if (!injury || injury.until <= day) return null;
  return (
    <span title={`${injuryLabel(injury, day)} · retour vers le ${formatDay(injury.until)}`} style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700, color: "#fff", background: injury.ltir ? "#7A4E9E" : "var(--loss)", borderRadius: 4, padding: "1px 5px", marginLeft: 6, verticalAlign: "middle", whiteSpace: "nowrap" }}>
      ✚ {injury.ltir ? "LTIR" : injuryLabel(injury, day).split(" — ")[1]}
    </span>
  );
}
