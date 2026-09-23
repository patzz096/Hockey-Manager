import { teamOvrBenchmark, starsFor } from "../engine/attributes";
import { h2Style, btnStyle } from "../ui/theme";
import { useSort, sortRows } from "../ui/useSort";
import { SortTh, StarRating } from "./common";

export function ContractsPanel({ myTeam, onOfferContract }) {
  const [ck, cd, cToggle] = useSort("salary");
  const cAcc = (p, key) => {
    if (key === "salary") return p.contract?.salary || 0;
    if (key === "years") return p.contract?.years || 0;
    return p[key];
  };
  const sorted = sortRows(myTeam.roster, ck, cd, cAcc);
  const totalPayroll = myTeam.roster.reduce((a, p) => a + (p.contract?.salary || 0), 0);
  const benchmark = teamOvrBenchmark(myTeam);
  return (
    <div>
      <h2 style={h2Style}>Contrats de l'équipe</h2>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: -8, marginBottom: 6 }}>Masse salariale totale: <strong style={{ color: "var(--ice)" }}>{totalPayroll.toLocaleString()}k$/an</strong></p>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 14 }}>Clique "Nouveau contrat" pour renégocier avant l'échéance.</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead><tr>
          <SortTh label="Joueur" sortKey="name" activeKey={ck} activeDir={cd} onSort={cToggle} />
          <SortTh label="Pos" sortKey="pos" activeKey={ck} activeDir={cd} onSort={cToggle} />
          <SortTh label="Âge" sortKey="age" activeKey={ck} activeDir={cd} onSort={cToggle} />
          <SortTh label="Étoiles" sortKey="ovr" activeKey={ck} activeDir={cd} onSort={cToggle} />
          <SortTh label="Durée" sortKey="years" activeKey={ck} activeDir={cd} onSort={cToggle} />
          <SortTh label="Salaire" sortKey="salary" activeKey={ck} activeDir={cd} onSort={cToggle} />
          <th></th>
        </tr></thead>
        <tbody>
          {sorted.map((p) => (
            <tr key={p.id} style={{ borderBottom: "1px solid #ffffff11" }}>
              <td style={{ padding: "7px 10px" }}>{p.name}</td>
              <td style={{ padding: "7px 10px" }}>{p.pos}</td>
              <td style={{ padding: "7px 10px" }}>{p.age}</td>
              <td style={{ padding: "7px 10px" }}><StarRating value={starsFor(p.ovr, benchmark)} size={12} /></td>
              <td style={{ padding: "7px 10px" }}>{p.contract ? `${p.contract.years} an${p.contract.years > 1 ? "s" : ""}` : "—"}</td>
              <td style={{ padding: "7px 10px" }}>{p.contract ? `${p.contract.salary.toLocaleString()}k$${p.contract.noTrade ? " · NTC" : ""}` : "—"}</td>
              <td style={{ padding: "7px 10px" }}><button onClick={() => onOfferContract(p)} style={btnStyle("var(--win)")}>Nouveau contrat</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
