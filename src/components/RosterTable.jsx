import { teamOvrBenchmark, starsFor } from "../engine/attributes";
import { lineLabel } from "../engine/lines";
import { getScoutInfo } from "../engine/scouting";
import { BASE_CONDITION, conditionColor, conditionLabel } from "../engine/training";
import { playerHappiness } from "../engine/contracts";
import { roleFit, roleOf } from "../engine/roles";
import { NATION_FLAG, NATION_NAME } from "../data/names";
import { money } from "../ui/format";
import { scoutQualityColor } from "../ui/theme";
import { useSort, sortRows } from "../ui/useSort";
import { SortTh, StarRating, PlayerFace, InjuryBadge } from "./common";

const td = { padding: "3px 7px" };
const th = { textAlign: "left", padding: "6px 7px", color: "var(--iceMuted)", fontWeight: 500, fontSize: 12, borderBottom: "1px solid #ffffff22", whiteSpace: "nowrap" };
const HAPPY_FACE = (interest) => (interest == null ? { face: "—", color: "var(--iceMuted)", label: "" } : interest >= 0.3 ? { face: "😊", color: "var(--win)", label: "Content" } : interest >= -0.15 ? { face: "😐", color: "var(--gold)", label: "Neutre" } : { face: "😞", color: "var(--loss)", label: "Mécontent" });
const fitColor = (pct) => (pct >= 65 ? "var(--win)" : pct >= 40 ? "var(--gold)" : "var(--loss)");

export function RosterTable({ roster, lines, staff, myTeamId, teamId, team = null, standings = [], scoutKnowledge, onSelect, onContextMenu, injuries = {}, day = 0 }) {
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
    if (key === "condition") return p.condition ?? BASE_CONDITION;
    if (key === "fit") return roleFit(p, roleOf(lines, p));
    if (key === "happiness") return playerHappiness(p, team, standings, roster) ?? 0;
    if (key === "salary") return p.contract?.salary || 0;
    return 0;
  };
  const sorted = sortRows(roster, sortKey, sortDir, accessor);
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
      <thead><tr>
        <SortTh label="#" sortKey="number" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <SortTh label="Joueur" sortKey="name" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <SortTh label="Pos" sortKey="pos" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <th style={th} title="Nationalité">Nat.</th>
        <SortTh label="Hum." sortKey="happiness" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <SortTh label="Âge" sortKey="age" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <SortTh label="Adéq." sortKey="fit" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <SortTh label="Trio/Paire" sortKey="line" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <SortTh label="Cote" sortKey="ovr" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <SortTh label="Potentiel" sortKey="potential" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <SortTh label="Forme" sortKey="condition" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <SortTh label="Salaire" sortKey="salary" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <th style={th}>Durée</th>
        <th></th>
      </tr></thead>
      <tbody>
        {sorted.map((p) => {
          const scoutInfo = getScoutInfo(p, teamId, myTeamId, staff, scoutKnowledge);
          const qColor = scoutQualityColor(scoutInfo.quality);
          const cond = p.condition ?? BASE_CONDITION;
          const fitPct = Math.round((roleFit(p, roleOf(lines, p)) + 1) * 50);
          const happy = HAPPY_FACE(playerHappiness(p, team, standings, roster));
          return (
          <tr key={p.id} onClick={() => onSelect(p)} onContextMenu={onContextMenu ? (e) => { e.preventDefault(); onContextMenu(e, p); } : undefined} style={{ borderBottom: "1px solid #ffffff11", cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#ffffff0a")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            <td style={{ ...td, color: "var(--iceMuted)" }}>{p.number ?? "—"}</td>
            <td style={{ ...td, padding: "3px 7px" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><PlayerFace player={p} size={22} />{p.name}{lines?.captain === p.id && <span title="Capitaine" style={{ fontSize: 9, fontWeight: 700, color: "var(--gold)", border: "1px solid var(--gold)", borderRadius: 3, padding: "0 3px" }}>C</span>}{(lines?.alternates || []).includes(p.id) && <span title="Adjoint" style={{ fontSize: 9, fontWeight: 700, color: "var(--iceMuted)", border: "1px solid var(--iceMuted)", borderRadius: 3, padding: "0 3px" }}>A</span>}<InjuryBadge injury={injuries[p.id]} day={day} /></span></td>
            <td style={td}>{p.pos}</td>
            <td style={td} title={NATION_NAME[p.nationality] || p.nationality}>{NATION_FLAG[p.nationality] || "—"}</td>
            <td style={{ ...td, fontSize: 14 }} title={happy.label}>{happy.face}</td>
            <td style={td}>{p.age}</td>
            <td style={{ ...td, color: fitColor(fitPct), fontWeight: 600 }} title="Adéquation au rôle assigné">{fitPct}%</td>
            <td style={{ ...td, color: "var(--iceMuted)" }}>{lineLabel(p.id, lines)}</td>
            <td style={td}><StarRating value={starsFor(p.ovr, benchmark)} size={11} color={qColor} /></td>
            <td style={td}><StarRating value={starsFor(p.potential, benchmark)} size={11} color={qColor === "var(--gold)" ? "#7A9EDB" : "var(--iceMuted)"} /></td>
            <td style={td}><span title={conditionLabel(cond)} style={{ fontSize: 12, fontWeight: 600, color: conditionColor(cond) }}>{cond}</span></td>
            <td style={{ ...td, color: "var(--iceMuted)" }}>{p.contract ? money(p.contract.salary) : "Agent libre"}</td>
            <td style={{ ...td, color: "var(--iceMuted)" }}>{p.contract ? `${p.contract.years} an${p.contract.years > 1 ? "s" : ""} · ${p.contract.type === "two" ? "2v" : "1v"}` : "—"}</td>
            <td style={{ ...td, color: "var(--iceMuted)" }}>Profil ›</td>
          </tr>
          );
        })}
      </tbody>
    </table>
  );
}
