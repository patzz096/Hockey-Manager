import { attr20, teamOvrBenchmark, starsFor } from "../engine/attributes";
import { STAFF_ROLES } from "../engine/staff";
import { h2Style, btnStyle, attr20Color } from "../ui/theme";
import { useSort, sortRows } from "../ui/useSort";
import { SortTh, StarRating } from "./common";

export function StaffCard({ role, hired, benchmark, onFire }) {
  return (
    <div style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: 14 }}>
      <div style={{ fontSize: 11, color: "var(--iceMuted)", marginBottom: 6 }}>{STAFF_ROLES[role].toUpperCase()}</div>
      {hired ? (
        <>
          <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{hired.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <StarRating value={starsFor(hired.rating, benchmark)} size={12} />
            <span style={{ background: attr20Color(attr20(hired.rating)), color: "#0B1B2E", fontWeight: 700, fontSize: 11, borderRadius: 3, padding: "1px 7px" }}>{attr20(hired.rating)}</span>
          </div>
          {hired.devSkill != null && (
            <div style={{ fontSize: 11, color: "var(--iceMuted)", marginBottom: 4 }}>Développement: <span style={{ background: attr20Color(attr20(hired.devSkill)), color: "#0B1B2E", fontWeight: 700, fontSize: 10, borderRadius: 3, padding: "1px 6px" }}>{attr20(hired.devSkill)}</span></div>
          )}
          <div style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 10 }}>{hired.salary.toLocaleString()}k$/an</div>
          <button onClick={() => onFire(role)} style={{ ...btnStyle("var(--loss)"), width: "100%", justifyContent: "center", fontSize: 12 }}>Congédier</button>
        </>
      ) : (
        <div style={{ fontSize: 13, color: "var(--iceMuted)" }}>Poste vacant</div>
      )}
    </div>
  );
}

export function StaffCenter({ business, staffMarket, myTeam, month, progressionReport, onHire, onFire, onRefresh, onAdvanceMonth, onSetDelegation }) {
  const [smk, smd, smToggle] = useSort("rating");
  const smAcc = (c, key) => (key === "role" ? STAFF_ROLES[c.role] : c[key]);
  const sortedStaffMarket = sortRows(staffMarket, smk, smd, smAcc);
  const benchmark = teamOvrBenchmark(myTeam);
  return (
    <div>
      <h2 style={h2Style}>Délégation</h2>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: -8, marginBottom: 12 }}>Prends le contrôle toi-même ou délègue les décisions à ton directeur (s'il est en poste).</p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 26 }}>
        <div style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: 12, flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 12, marginBottom: 8 }}>Directeur des finances {business.staff.financeDirector ? `(${business.staff.financeDirector.name})` : "(poste vacant)"}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => onSetDelegation("finance", "manual")} style={{ ...btnStyle(business.delegation.finance === "manual" ? "var(--red)" : "var(--steel)"), fontSize: 12, flex: 1, justifyContent: "center" }}>Contrôle</button>
            <button onClick={() => onSetDelegation("finance", "delegated")} style={{ ...btnStyle(business.delegation.finance === "delegated" ? "var(--win)" : "var(--steel)"), fontSize: 12, flex: 1, justifyContent: "center" }}>Délégué</button>
          </div>
        </div>
        <div style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: 12, flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 12, marginBottom: 8 }}>Directeur des opérations hockey {business.staff.hockeyOpsDirector ? `(${business.staff.hockeyOpsDirector.name})` : "(poste vacant)"}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => onSetDelegation("hockeyOps", "manual")} style={{ ...btnStyle(business.delegation.hockeyOps === "manual" ? "var(--red)" : "var(--steel)"), fontSize: 12, flex: 1, justifyContent: "center" }}>Contrôle</button>
            <button onClick={() => onSetDelegation("hockeyOps", "delegated")} style={{ ...btnStyle(business.delegation.hockeyOps === "delegated" ? "var(--win)" : "var(--steel)"), fontSize: 12, flex: 1, justifyContent: "center" }}>Délégué</button>
          </div>
        </div>
      </div>
      <p style={{ fontSize: 11, color: "var(--iceMuted)", marginTop: -18, marginBottom: 26 }}>Finances déléguées: le directeur ajuste les prix des billets et investit dans les installations après chaque match local. Opérations hockey déléguées: le directeur comble automatiquement les postes vacants (entraîneurs, adjoints, dépisteurs) à chaque avancement de mois.</p>
      <h2 style={h2Style}>Personnel en poste</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 12, marginBottom: 28 }}>
        {Object.keys(STAFF_ROLES).map((role) => (<StaffCard key={role} role={role} hired={business.staff[role]} benchmark={benchmark} onFire={onFire} />))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ ...h2Style, marginBottom: 0 }}>Marché des candidats</h2>
        <button onClick={onRefresh} style={btnStyle("var(--steel)")}>Rafraîchir le marché</button>
      </div>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 12 }}>Embaucher un candidat remplace automatiquement la personne en poste pour ce rôle.</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginBottom: 30 }}>
        <thead><tr>
          <SortTh label="Nom" sortKey="name" activeKey={smk} activeDir={smd} onSort={smToggle} />
          <SortTh label="Poste" sortKey="role" activeKey={smk} activeDir={smd} onSort={smToggle} />
          <SortTh label="Cote" sortKey="rating" activeKey={smk} activeDir={smd} onSort={smToggle} />
          <SortTh label="Salaire demandé" sortKey="salary" activeKey={smk} activeDir={smd} onSort={smToggle} />
          <th></th>
        </tr></thead>
        <tbody>
          {sortedStaffMarket.map((c) => (
            <tr key={c.id} style={{ borderBottom: "1px solid #ffffff11" }}>
              <td style={{ padding: "7px 10px" }}>{c.name}</td>
              <td style={{ padding: "7px 10px" }}>{STAFF_ROLES[c.role]}</td>
              <td style={{ padding: "7px 10px" }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><StarRating value={starsFor(c.rating, benchmark)} size={12} /><span style={{ background: attr20Color(attr20(c.rating)), color: "#0B1B2E", fontWeight: 700, fontSize: 11, borderRadius: 3, padding: "1px 7px" }}>{attr20(c.rating)}</span>{c.devSkill != null && <span style={{ fontSize: 10, color: "var(--iceMuted)" }}>· dév. {attr20(c.devSkill)}</span>}</div></td>
              <td style={{ padding: "7px 10px" }}>{c.salary.toLocaleString()}k$/an</td>
              <td style={{ padding: "7px 10px" }}><button onClick={() => onHire(c)} style={btnStyle("var(--win)")}>Embaucher</button></td>
            </tr>
          ))}
          {sortedStaffMarket.length === 0 && <tr><td colSpan={5} style={{ padding: 12, color: "var(--iceMuted)" }}>Aucun candidat sur le marché.</td></tr>}
        </tbody>
      </table>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <h2 style={{ ...h2Style, marginBottom: 0 }}>Rapport mensuel de progression — Mois {month}</h2>
        <button onClick={onAdvanceMonth} style={btnStyle("var(--red)")}>Avancer au mois suivant</button>
      </div>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 12 }}>Les jeunes joueurs progressent plus vite vers leur potentiel; les vétérans stagnent ou déclinent. Un bon dépisteur professionnel accélère le développement.</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead><tr>{["Joueur", "Avant", "Après", "Δ"].map((h, i) => (<th key={i} style={{ textAlign: "left", padding: "6px 10px", color: "var(--iceMuted)", fontWeight: 500, fontSize: 12, borderBottom: "1px solid #ffffff22" }}>{h}</th>))}</tr></thead>
        <tbody>
          {progressionReport.map((r) => (
            <tr key={r.id} style={{ borderBottom: "1px solid #ffffff11" }}>
              <td style={{ padding: "7px 10px" }}>{r.name}</td>
              <td style={{ padding: "7px 10px" }}>{r.before}</td>
              <td style={{ padding: "7px 10px" }}>{r.after}</td>
              <td style={{ padding: "7px 10px", color: r.delta >= 0 ? "var(--win)" : "var(--loss)", fontWeight: 600 }}>{r.delta >= 0 ? "+" : ""}{r.delta}</td>
            </tr>
          ))}
          {progressionReport.length === 0 && <tr><td colSpan={4} style={{ padding: 12, color: "var(--iceMuted)" }}>Aucun rapport encore — avance d'un mois pour voir l'évolution de tes joueurs.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
