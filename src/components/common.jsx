import { Star } from "lucide-react";
import { attr20, teamOvrBenchmark, starsFor } from "../engine/attributes";
import { attr20Color } from "../ui/theme";

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
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `linear-gradient(145deg, ${team.color}, ${team.color}cc)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "2px solid #ffffff33", boxShadow: "0 2px 4px #00000055" }}>
      <span style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: size * 0.38, color: "#fff" }}>{teamInitials(team.name)}</span>
    </div>
  );
}

export function StarRating({ value, size = 14, color = "#D9A404" }) {
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
