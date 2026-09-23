import { useState, useMemo } from "react";
import { h2Style, inputStyle } from "../ui/theme";
import { useSort, sortRows } from "../ui/useSort";
import { SortTh } from "./common";

export function StandingsTable({ standings, teamsById, myTeamId }) {
  const [sk, sd, toggle] = useSort("pts");
  const [divisionFilter, setDivisionFilter] = useState("Toutes");
  const divisions = useMemo(() => ["Toutes", ...Array.from(new Set(Object.values(teamsById).map((t) => t.division))).sort()], [teamsById]);
  const acc = (s, key) => { if (key === "team") return teamsById[s.id].name; if (key === "diff") return s.gf - s.ga; return s[key]; };
  const filtered = divisionFilter === "Toutes" ? standings : standings.filter((s) => teamsById[s.id].division === divisionFilter);
  const sorted = sortRows(filtered, sk, sd, acc);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h2 style={{ ...h2Style, marginBottom: 0 }}>Classement</h2>
        <select value={divisionFilter} onChange={(e) => setDivisionFilter(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
          {divisions.map((d) => (<option key={d} value={d}>{d === "Toutes" ? "Toutes les divisions" : d}</option>))}
        </select>
      </div>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: 6, marginBottom: 14 }}>{divisionFilter === "Toutes" ? "Classement général de la ligue." : `Division ${divisionFilter}.`}</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead><tr>
          <SortTh label="Équipe" sortKey="team" activeKey={sk} activeDir={sd} onSort={toggle} />
          <SortTh label="PJ" sortKey="gp" activeKey={sk} activeDir={sd} onSort={toggle} />
          <SortTh label="V" sortKey="w" activeKey={sk} activeDir={sd} onSort={toggle} />
          <SortTh label="D" sortKey="l" activeKey={sk} activeDir={sd} onSort={toggle} />
          <SortTh label="DIFF" sortKey="diff" activeKey={sk} activeDir={sd} onSort={toggle} />
          <SortTh label="PTS" sortKey="pts" activeKey={sk} activeDir={sd} onSort={toggle} />
        </tr></thead>
        <tbody>
          {sorted.map((s) => (
            <tr key={s.id} style={{ borderBottom: "1px solid #ffffff11" }}>
              <td style={{ padding: "7px 10px", color: s.id === myTeamId ? teamsById[s.id].color : "var(--ice)", fontWeight: s.id === myTeamId ? 600 : 400 }}>{teamsById[s.id].name}</td>
              <td style={{ padding: "7px 10px" }}>{s.gp}</td>
              <td style={{ padding: "7px 10px" }}>{s.w}</td>
              <td style={{ padding: "7px 10px" }}>{s.l}</td>
              <td style={{ padding: "7px 10px" }}>{s.gf - s.ga}</td>
              <td style={{ padding: "7px 10px" }}><strong>{s.pts}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
