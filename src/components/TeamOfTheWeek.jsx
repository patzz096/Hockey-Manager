import { formatDay } from "../engine/calendar";
import { PlayerLink } from "./common";

function Card({ label, s, statLine, onSelectPlayer }) {
  return (
    <div style={{ background: "var(--navy2)", border: "1px solid #ffffff1a", borderTop: `3px solid ${s.team?.color || "var(--steel)"}`, borderRadius: 4, padding: "10px 12px", flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 10, color: "var(--iceMuted)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600 }}><PlayerLink player={s.player} team={s.team} onSelect={onSelectPlayer} /></div>
      <div style={{ fontSize: 11, color: "var(--iceMuted)" }}>{s.team?.name || "—"}</div>
      <div style={{ fontSize: 12, color: "var(--gold)", marginTop: 4 }}>{statLine}</div>
    </div>
  );
}

// Équipe de la semaine (façon FM) : 3 attaquants, 2 défenseurs et un gardien, meilleurs
// performeurs des 7 derniers jours de calendrier (engine/stats.js teamOfTheWeek).
export function TeamOfTheWeek({ tow, onSelectPlayer }) {
  if (!tow) return null;
  const pct = tow.goalie.shotsAgainst ? Math.round((tow.goalie.saves / tow.goalie.shotsAgainst) * 1000) / 10 : 0;
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 11, color: "var(--iceMuted)", letterSpacing: 0.5, marginBottom: 8 }}>ÉQUIPE DE LA SEMAINE · {formatDay(tow.weekStart)} – {formatDay(tow.weekEnd)}</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {tow.forwards.map((s, i) => <Card key={s.player.id} label={`ATTAQUANT ${i + 1}`} s={s} statLine={`${s.pts} pts (${s.g} B, ${s.a} A)`} onSelectPlayer={onSelectPlayer} />)}
        {tow.defense.map((s, i) => <Card key={s.player.id} label={`DÉFENSEUR ${i + 1}`} s={s} statLine={`${s.pts} pts (${s.g} B, ${s.a} A)`} onSelectPlayer={onSelectPlayer} />)}
        <Card label="GARDIEN" s={tow.goalie} statLine={`${pct}% arrêts · ${tow.goalie.w} V`} onSelectPlayer={onSelectPlayer} />
      </div>
    </div>
  );
}
