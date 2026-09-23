import { capStatus, formatMoney, capFor, ROSTER_MAX } from "../engine/cap";

// Résumé du plafond salarial : masse salariale LNH, espace disponible, plancher, joueurs.
export function CapSummary({ roster, year, compact = false }) {
  const s = capStatus(roster, year);
  const pct = Math.min(100, (s.used / s.cap) * 100);
  const nextYear = roster.filter((p) => (p.contract?.years ?? 0) > 1).reduce((a, p) => a + (p.contract?.salary || 0), 0);
  const color = s.overCap ? "var(--loss)" : s.space < 2000 ? "#D9A404" : "var(--win)";
  if (compact) return <span style={{ color }}>{formatMoney(s.space)} d'espace</span>;
  return (
    <div style={{ background: "var(--navy2)", border: "1px solid #ffffff1a", borderRadius: 4, padding: 12, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, fontSize: 13 }}>
        <span>Masse salariale LNH : <strong>{formatMoney(s.used)}</strong> / plafond {formatMoney(s.cap)}</span>
        <span style={{ color }}>{s.overCap ? `Au-delà du plafond de ${formatMoney(-s.space)}` : `Espace : ${formatMoney(s.space)}`}</span>
      </div>
      <div style={{ height: 8, background: "#ffffff14", borderRadius: 4, margin: "8px 0", position: "relative" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4 }} />
        <div title="Plancher salarial" style={{ position: "absolute", left: `${(s.floor / s.cap) * 100}%`, top: -3, width: 2, height: 14, background: "var(--iceMuted)" }} />
      </div>
      <div style={{ fontSize: 11, color: "var(--iceMuted)" }}>
        Plancher {formatMoney(s.floor)}{s.underFloor ? " (sous le plancher !)" : ""} · Alignement {s.rosterSize}/{ROSTER_MAX} joueurs · Engagé pour {year + 1}-{year + 2} : {formatMoney(nextYear)} (plafond {formatMoney(capFor(year + 1))}) · le club-école ne compte pas
      </div>
    </div>
  );
}
