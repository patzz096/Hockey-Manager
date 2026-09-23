import { NATION_FLAG } from "../data/names";
import { teamOvrBenchmark, starsFor } from "../engine/attributes";
import { lineLabel } from "../engine/lines";
import { getScoutInfo } from "../engine/scouting";
import { contractLabel } from "../ui/format";
import { scoutQualityColor } from "../ui/theme";
import { useSort, sortRows } from "../ui/useSort";
import { SortTh, StarRating, PlayerFace } from "./common";

export function RosterTable({ roster, lines, staff, myTeamId, teamId, scoutKnowledge, onSelect }) {
  const [sortKey, sortDir, toggleSort] = useSort("ovr");
  const benchmark = teamOvrBenchmark({ roster });
  const accessor = (p, key) => {
    if (key === "number") return p.number ?? -1;
    if (key === "name") return p.name;
    if (key === "pos") return p.pos;
    if (key === "age") return p.age;
    if (key === "line") return lineLabel(p.id, lines);
    if (key === "ovr") return p.ovr;
    if (key === "potential") return p.potential;
    if (key === "salary") return p.contract?.salary || 0;
    return 0;
  };
  const sorted = sortRows(roster, sortKey, sortDir, accessor);
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
      <thead><tr>
        <SortTh label="#" sortKey="number" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <SortTh label="Joueur" sortKey="name" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <SortTh label="Pos" sortKey="pos" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <SortTh label="Âge" sortKey="age" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <SortTh label="Trio/Paire" sortKey="line" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <SortTh label="Cote actuelle" sortKey="ovr" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <SortTh label="Potentiel" sortKey="potential" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <SortTh label="Contrat" sortKey="salary" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <th></th>
      </tr></thead>
      <tbody>
        {sorted.map((p) => {
          const scoutInfo = getScoutInfo(p, teamId, myTeamId, staff, scoutKnowledge);
          const qColor = scoutQualityColor(scoutInfo.quality);
          return (
          <tr key={p.id} onClick={() => onSelect(p)} style={{ borderBottom: "1px solid #ffffff11", cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#ffffff0a")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            <td style={{ padding: "7px 10px", color: "var(--iceMuted)" }}>{p.number ?? "—"}</td>
            <td style={{ padding: "5px 10px" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><PlayerFace player={p} size={26} />{NATION_FLAG[p.nationality] || ""} {p.name}</span></td>
            <td style={{ padding: "7px 10px" }}>{p.pos}</td>
            <td style={{ padding: "7px 10px" }}>{p.age}</td>
            <td style={{ padding: "7px 10px", color: "var(--iceMuted)" }}>{lineLabel(p.id, lines)}</td>
            <td style={{ padding: "7px 10px" }}><StarRating value={starsFor(p.ovr, benchmark)} size={12} color={qColor} /></td>
            <td style={{ padding: "7px 10px" }}><StarRating value={starsFor(p.potential, benchmark)} size={12} color={qColor === "#D9A404" ? "#7A9EDB" : "var(--iceMuted)"} /></td>
            <td style={{ padding: "7px 10px", color: "var(--iceMuted)", fontSize: 12 }}>{contractLabel(p.contract)}</td>
            <td style={{ padding: "7px 10px", color: "var(--iceMuted)", fontSize: 12 }}>Profil ›</td>
          </tr>
          );
        })}
      </tbody>
    </table>
  );
}
