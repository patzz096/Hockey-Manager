import { useState } from "react";
import { X } from "lucide-react";
import { RosterTable } from "./RosterTable";
import { TeamCrest } from "./common";
import { btnStyle } from "../ui/theme";

const td = { padding: "5px 9px" };
const th = { textAlign: "left", padding: "6px 9px", color: "var(--iceMuted)", fontWeight: 500, fontSize: 12, borderBottom: "1px solid #ffffff22" };

// Statistiques individuelles de la saison en cours (aggregateStats, voir engine/stats.js) pour
// les joueurs du club affiché — visibles pour n'importe quelle équipe (les statistiques de match
// ne dépendent pas du dépistage, contrairement aux cotes/attributs affichés dans RosterTable).
function StatsTable({ roster, seasonStats, onSelect }) {
  const rows = roster
    .map((p) => ({ player: p, s: seasonStats[p.id] }))
    .filter((r) => r.s && r.s.gp > 0)
    .sort((a, b) => (b.s.pts - a.s.pts) || (b.s.g - a.s.g));
  if (rows.length === 0) return <div style={{ fontSize: 12, color: "var(--iceMuted)", padding: "8px 0" }}>Aucun match joué cette saison.</div>;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
      <thead><tr>
        <th style={th}>Joueur</th><th style={th}>Pos</th>
        {["PJ", "B", "A", "PTS", "+/-", "Mis.", "Tirs", "Blocs"].map((l) => <th key={l} style={th}>{l}</th>)}
      </tr></thead>
      <tbody>
        {rows.map(({ player: p, s }) => (
          <tr key={p.id} onClick={() => onSelect(p)} style={{ borderBottom: "1px solid #ffffff11", cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#ffffff0a")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            <td style={td}>{p.name}</td>
            <td style={td}>{p.pos}</td>
            <td style={td}>{s.gp}</td>
            <td style={td}>{s.g}</td>
            <td style={td}>{s.a}</td>
            <td style={{ ...td, fontWeight: 600 }}>{s.pts}</td>
            <td style={td}>{s.plusMinus > 0 ? `+${s.plusMinus}` : s.plusMinus}</td>
            <td style={td}>{s.pim}</td>
            <td style={td}>{s.shots}</td>
            <td style={td}>{s.blocks}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Fenêtre plein écran montrant l'alignement d'une équipe (la tienne ou une adverse) : mêmes
// cotes/valeurs que RosterTable (étoiles grisées/colorées selon le dépistage — tes propres
// joueurs sont toujours vus via ton personnel, voir RosterTable/getScoutInfo), plus les
// statistiques individuelles de la saison, qui elles ne dépendent pas du dépistage (données de
// match, pas une estimation de talent).
export function TeamRosterModal({ team, teamId, lines, myTeamId, staff, scoutKnowledge, seasonStats, injuries = {}, day = 0, onSelectPlayer, onClose }) {
  const [view, setView] = useState("roster");
  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--navy)", zIndex: 80, display: "flex", flexDirection: "column" }}>
      <div style={{ background: `linear-gradient(90deg, ${team.color}, ${team.color}99)`, padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <TeamCrest team={team} size={30} />
          <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 19, color: "#fff" }}>{team.name}</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><X size={22} /></button>
      </div>
      <div style={{ padding: "12px 28px 0", display: "flex", gap: 6, flexShrink: 0 }}>
        {[["roster", "Alignement"], ["stats", "Statistiques"]].map(([k, l]) => (
          <button key={k} onClick={() => setView(k)} style={{ ...btnStyle(view === k ? "var(--red)" : "var(--steel)"), fontSize: 12 }}>{l}</button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "14px 28px 28px" }}>
        {view === "roster" && (
          <RosterTable roster={team.roster} lines={lines} staff={staff} myTeamId={myTeamId} teamId={teamId} team={team} scoutKnowledge={scoutKnowledge} onSelect={(p) => onSelectPlayer(p, team)} injuries={injuries} day={day} />
        )}
        {view === "stats" && <StatsTable roster={team.roster} seasonStats={seasonStats} onSelect={(p) => onSelectPlayer(p, team)} />}
      </div>
    </div>
  );
}
