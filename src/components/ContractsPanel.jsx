import { teamOvrBenchmark, starsFor } from "../engine/attributes";
import { h2Style } from "../ui/theme";
import { useSort, sortRows } from "../ui/useSort";
import { SortTh, StarRating, PlayerLink } from "./common";
import { buyoutTerms, formatMoney } from "../engine/cap";
import { money } from "../ui/format";

export function ContractsPanel({ myTeam, onSelectPlayer, seasonYear, buyoutOpen = false, deadCap = [] }) {
  const [ck, cd, cToggle] = useSort("salary");
  const cAcc = (p, key) => {
    if (key === "salary") return p.contract?.salary || 0;
    if (key === "years") return p.contract?.years || 0;
    return p[key];
  };
  const sorted = sortRows(myTeam.roster, ck, cd, cAcc);
  const totalPayroll = myTeam.roster.reduce((a, p) => a + (p.contract?.salary || 0) + (p.contract?.bonuses || []).reduce((x, b) => x + b.amount, 0), 0);
  const benchmark = teamOvrBenchmark(myTeam);
  return (
    <div>
      <h2 style={h2Style}>Contrats de l'équipe</h2>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: -8, marginBottom: 6 }}>Masse salariale totale (primes de rendement maximales comprises) : <strong style={{ color: "var(--ice)" }}>{money(totalPayroll)} par saison</strong></p>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 14 }}>Clique un joueur pour ouvrir son profil : prolongation et rachat se font dans son volet « Gestion du joueur ». {buyoutOpen ? "Période de rachat ouverte (jusqu'au 1er juillet) : 2/3 du salaire restant (1/3 avant 26 ans), étalé sur le double des années." : "Les rachats sont permis entre la fin des séries et le 1er juillet."}</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead><tr>
          <SortTh label="Joueur" sortKey="name" activeKey={ck} activeDir={cd} onSort={cToggle} />
          <SortTh label="Pos" sortKey="pos" activeKey={ck} activeDir={cd} onSort={cToggle} />
          <SortTh label="Âge" sortKey="age" activeKey={ck} activeDir={cd} onSort={cToggle} />
          <SortTh label="Étoiles" sortKey="ovr" activeKey={ck} activeDir={cd} onSort={cToggle} />
          <SortTh label="Durée" sortKey="years" activeKey={ck} activeDir={cd} onSort={cToggle} />
          <SortTh label="Salaire" sortKey="salary" activeKey={ck} activeDir={cd} onSort={cToggle} />
          <th style={{ textAlign: "left", padding: "7px 10px", fontSize: 11, color: "var(--iceMuted)", fontWeight: 500 }}>Type</th>
          <th style={{ textAlign: "left", padding: "7px 10px", fontSize: 11, color: "var(--iceMuted)", fontWeight: 500 }}>Statut</th>
        </tr></thead>
        <tbody>
          {sorted.map((p) => (
            <tr key={p.id} style={{ borderBottom: "1px solid #ffffff11" }}>
              <td style={{ padding: "7px 10px" }}><PlayerLink player={p} team={myTeam} onSelect={onSelectPlayer} /></td>
              <td style={{ padding: "7px 10px" }}>{p.pos}</td>
              <td style={{ padding: "7px 10px" }}>{p.age}</td>
              <td style={{ padding: "7px 10px" }}><StarRating value={starsFor(p.ovr, benchmark)} size={12} /></td>
              <td style={{ padding: "7px 10px" }}>{p.contract ? `${p.contract.years} an${p.contract.years > 1 ? "s" : ""}` : "—"}</td>
              <td style={{ padding: "7px 10px" }}>{p.contract ? `${money(p.contract.salary)}${p.contract.noTrade ? " · NTC" : ""}` : "—"}</td>
              <td style={{ padding: "7px 10px", fontSize: 12, color: "var(--iceMuted)" }}>{p.contract ? <>{p.contract.elc ? "Entrée · " : ""}{p.contract.type === "two" ? `2 volets (LAH ${money(p.contract.ahlSalary || 80)})` : "1 volet"}{(p.contract.bonuses || []).length ? <span style={{ color: "var(--gold)" }}> · primes {money(p.contract.bonuses.reduce((x, b) => x + b.amount, 0))}</span> : ""}</> : "—"}</td>
              <td style={{ padding: "7px 10px", fontSize: 11, color: "var(--iceMuted)" }}>
                {p.contract?.years === 1 ? <span style={{ color: "var(--gold)" }}>Échéance cette saison</span> : null}
                {buyoutOpen && buyoutTerms(p, seasonYear) ? <span style={{ marginLeft: 6 }}>Rachat possible</span> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {deadCap.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 17, marginBottom: 6 }}>Cap mort</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr>{["Engagement", "Par saison", "Saisons"].map((h) => <th key={h} style={{ textAlign: "left", padding: "5px 10px", color: "var(--iceMuted)", fontWeight: 500, fontSize: 11, borderBottom: "1px solid #ffffff22" }}>{h}</th>)}</tr></thead>
            <tbody>{deadCap.filter((e) => e.seasons[e.seasons.length - 1] >= seasonYear).map((e, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #ffffff11" }}>
                <td style={{ padding: "6px 10px" }}>{e.label}</td>
                <td style={{ padding: "6px 10px" }}>{formatMoney(e.amount)}</td>
                <td style={{ padding: "6px 10px", color: "var(--iceMuted)" }}>{e.seasons[0]}-{String(e.seasons[0] + 1).slice(2)} à {e.seasons[e.seasons.length - 1]}-{String(e.seasons[e.seasons.length - 1] + 1).slice(2)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
