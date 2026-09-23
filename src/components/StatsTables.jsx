import { useState, useMemo } from "react";
import { h2Style, inputStyle } from "../ui/theme";
import { useSort, sortRows } from "../ui/useSort";
import { SortTh } from "./common";

export function StatsTables({ leaders, standings, teamHitTotals, teamAdvancedTotals, teamsById, myTeamId, onSelectPlayer }) {
  const [lk, ld, lToggle] = useSort("pts");
  const [tk, td, tToggle] = useSort("pts");
  const [teamFilter, setTeamFilter] = useState("Toutes");
  const teamOptions = useMemo(() => ["Toutes", ...Object.values(teamsById).map((t) => t.id).sort((a, b) => teamsById[a].name.localeCompare(teamsById[b].name))], [teamsById]);
  const leaderAcc = (s, key) => {
    if (key === "name") return s.player.name;
    if (key === "team") return s.team.name;
    if (key === "gp") return s.gp;
    if (key === "g") return s.g;
    if (key === "a") return s.a;
    if (key === "pts") return s.pts;
    if (key === "hits") return s.hits;
    if (key === "pim") return s.pim;
    if (key === "shots") return s.shots;
    if (key === "plusMinus") return s.plusMinus;
    return 0;
  };
  const filteredLeaders = teamFilter === "Toutes" ? leaders : leaders.filter((s) => s.team.id === teamFilter);
  const sortedLeadersFull = sortRows(filteredLeaders, lk, ld, leaderAcc);
  const sortedLeaders = teamFilter === "Toutes" ? sortedLeadersFull.slice(0, 20) : sortedLeadersFull;
  const teamAcc = (s, key) => {
    if (key === "team") return teamsById[s.id].name;
    if (key === "diff") return s.gf - s.ga;
    if (key === "hits") return teamHitTotals[s.id] || 0;
    if (key === "corsi") return teamAdvancedTotals[s.id]?.corsiFor || 0;
    if (key === "fo") { const t = teamAdvancedTotals[s.id]; return t && t.faceoffTotal ? t.faceoffWins / t.faceoffTotal : 0; }
    return s[key];
  };
  const sortedTeams = sortRows(standings, tk, td, teamAcc);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h2 style={{ ...h2Style, marginBottom: 0 }}>Meneurs individuels</h2>
        <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
          {teamOptions.map((id) => (<option key={id} value={id}>{id === "Toutes" ? "Toutes les équipes (top 20)" : teamsById[id].name}</option>))}
        </select>
      </div>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: 6, marginBottom: 12 }}>{teamFilter === "Toutes" ? "Meilleurs pointeurs de la ligue." : `Tous les patineurs de ${teamsById[teamFilter].name} ayant joué.`}</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginBottom: 30 }}>
        <thead><tr>
          <SortTh label="Joueur" sortKey="name" activeKey={lk} activeDir={ld} onSort={lToggle} />
          <SortTh label="Équipe" sortKey="team" activeKey={lk} activeDir={ld} onSort={lToggle} />
          <SortTh label="PJ" sortKey="gp" activeKey={lk} activeDir={ld} onSort={lToggle} />
          <SortTh label="B" sortKey="g" activeKey={lk} activeDir={ld} onSort={lToggle} />
          <SortTh label="A" sortKey="a" activeKey={lk} activeDir={ld} onSort={lToggle} />
          <SortTh label="PTS" sortKey="pts" activeKey={lk} activeDir={ld} onSort={lToggle} />
          <SortTh label="MEC" sortKey="hits" activeKey={lk} activeDir={ld} onSort={lToggle} />
          <SortTh label="PUN" sortKey="pim" activeKey={lk} activeDir={ld} onSort={lToggle} />
          <SortTh label="Tirs" sortKey="shots" activeKey={lk} activeDir={ld} onSort={lToggle} />
          <SortTh label="+/-" sortKey="plusMinus" activeKey={lk} activeDir={ld} onSort={lToggle} />
        </tr></thead>
        <tbody>
          {sortedLeaders.map((s) => (
            <tr key={s.player.id} onClick={() => onSelectPlayer(s.player, s.team)} style={{ borderBottom: "1px solid #ffffff11", cursor: "pointer" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#ffffff0a")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <td style={{ padding: "7px 10px" }}>{s.player.name}</td>
              <td style={{ padding: "7px 10px", color: s.team.color }}>{s.team.name}</td>
              <td style={{ padding: "7px 10px" }}>{s.gp}</td>
              <td style={{ padding: "7px 10px" }}>{s.g}</td>
              <td style={{ padding: "7px 10px" }}>{s.a}</td>
              <td style={{ padding: "7px 10px" }}><strong>{s.pts}</strong></td>
              <td style={{ padding: "7px 10px" }}>{s.hits}</td>
              <td style={{ padding: "7px 10px" }}>{s.pim}</td>
              <td style={{ padding: "7px 10px" }}>{s.shots}</td>
              <td style={{ padding: "7px 10px", color: s.plusMinus > 0 ? "var(--win)" : s.plusMinus < 0 ? "var(--loss)" : "var(--iceMuted)" }}>{s.plusMinus > 0 ? "+" : ""}{s.plusMinus}</td>
            </tr>
          ))}
          {sortedLeaders.length === 0 && <tr><td colSpan={10} style={{ padding: 12, color: "var(--iceMuted)", fontSize: 13 }}>Aucun match joué encore.</td></tr>}
        </tbody>
      </table>

      <h2 style={h2Style}>Statistiques d'équipe</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead><tr>
          <SortTh label="Équipe" sortKey="team" activeKey={tk} activeDir={td} onSort={tToggle} />
          <SortTh label="PJ" sortKey="gp" activeKey={tk} activeDir={td} onSort={tToggle} />
          <SortTh label="V" sortKey="w" activeKey={tk} activeDir={td} onSort={tToggle} />
          <SortTh label="D" sortKey="l" activeKey={tk} activeDir={td} onSort={tToggle} />
          <SortTh label="BP" sortKey="gf" activeKey={tk} activeDir={td} onSort={tToggle} />
          <SortTh label="BC" sortKey="ga" activeKey={tk} activeDir={td} onSort={tToggle} />
          <SortTh label="DIFF" sortKey="diff" activeKey={tk} activeDir={td} onSort={tToggle} />
          <SortTh label="MEC" sortKey="hits" activeKey={tk} activeDir={td} onSort={tToggle} />
          <SortTh label="Corsi" sortKey="corsi" activeKey={tk} activeDir={td} onSort={tToggle} />
          <SortTh label="MAJ%" sortKey="fo" activeKey={tk} activeDir={td} onSort={tToggle} />
          <SortTh label="PTS" sortKey="pts" activeKey={tk} activeDir={td} onSort={tToggle} />
        </tr></thead>
        <tbody>
          {sortedTeams.map((s) => (
            <tr key={s.id} style={{ borderBottom: "1px solid #ffffff11" }}>
              <td style={{ padding: "7px 10px", color: s.id === myTeamId ? teamsById[s.id].color : "var(--ice)", fontWeight: s.id === myTeamId ? 600 : 400 }}>{teamsById[s.id].name}</td>
              <td style={{ padding: "7px 10px" }}>{s.gp}</td>
              <td style={{ padding: "7px 10px" }}>{s.w}</td>
              <td style={{ padding: "7px 10px" }}>{s.l}</td>
              <td style={{ padding: "7px 10px" }}>{s.gf}</td>
              <td style={{ padding: "7px 10px" }}>{s.ga}</td>
              <td style={{ padding: "7px 10px" }}>{s.gf - s.ga}</td>
              <td style={{ padding: "7px 10px" }}>{teamHitTotals[s.id] || 0}</td>
              <td style={{ padding: "7px 10px" }}>{teamAdvancedTotals[s.id]?.corsiFor || 0}</td>
              <td style={{ padding: "7px 10px" }}>{teamAdvancedTotals[s.id]?.faceoffTotal ? `${Math.round((teamAdvancedTotals[s.id].faceoffWins / teamAdvancedTotals[s.id].faceoffTotal) * 100)}%` : "—"}</td>
              <td style={{ padding: "7px 10px" }}><strong>{s.pts}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
