import { useState } from "react";
import { teamOvrBenchmark, starsFor } from "../engine/attributes";
import { STAFF_ROLES } from "../engine/staff";
import { NATION_FLAG } from "../data/names";
import { h2Style, btnStyle } from "../ui/theme";
import { useSort, sortRows } from "../ui/useSort";
import { SortTh, StarRating, PlayerLink } from "./common";
import { money } from "../ui/format";
import { formatDay } from "../engine/calendar";

export function StaffCenter({ business, staffMarket, myTeam, month, progressionReport, onOffer, pendingStaffOffers = [], staffNegotiations = {}, onFire, onRefresh, onSetDelegation, onSelectPlayer, onSelectStaff }) {
  const [pok, pod, poToggle] = useSort("role");
  const poAcc = (row, key) => (key === "role" ? STAFF_ROLES[row.role] : key === "nationality" ? (row.hired?.nationality || "") : row.hired ? row.hired[key] : -1);
  const staffRows = Object.keys(STAFF_ROLES).map((role) => ({ role, hired: business.staff[role] }));
  const sortedStaffRows = sortRows(staffRows, pok, pod, poAcc);
  const [smk, smd, smToggle] = useSort("rating");
  const smAcc = (c, key) => (key === "role" ? STAFF_ROLES[c.role] : c[key]);
  const sortedStaffMarket = sortRows(staffMarket, smk, smd, smAcc);
  const benchmark = teamOvrBenchmark(myTeam);
  const [offers, setOffers] = useState({}); // { [candidateId]: montant offert en cours d'édition }
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
      <p style={{ fontSize: 11, color: "var(--iceMuted)", marginTop: -18, marginBottom: 26 }}>Finances déléguées: le directeur ajuste les prix des billets et investit dans les installations après chaque match local. Opérations hockey déléguées: le directeur comble automatiquement les postes vacants (entraîneurs, adjoints, dépisteurs) à chaque avancement de mois. Entraînement : réglages séparés dans l'onglet Entraînement.</p>

      <h2 style={h2Style}>Personnel en poste</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginBottom: 28 }}>
        <thead><tr>
          <SortTh label="Nom" sortKey="name" activeKey={pok} activeDir={pod} onSort={poToggle} />
          <th style={{ textAlign: "left", padding: "6px 10px", color: "var(--iceMuted)", fontWeight: 500, fontSize: 12, borderBottom: "1px solid #ffffff22" }}>Nat.</th>
          <SortTh label="Âge" sortKey="age" activeKey={pok} activeDir={pod} onSort={poToggle} />
          <SortTh label="Poste" sortKey="role" activeKey={pok} activeDir={pod} onSort={poToggle} />
          <SortTh label="Cote" sortKey="rating" activeKey={pok} activeDir={pod} onSort={poToggle} />
          <SortTh label="Salaire" sortKey="salary" activeKey={pok} activeDir={pod} onSort={poToggle} />
          <th></th>
        </tr></thead>
        <tbody>
          {sortedStaffRows.map(({ role, hired }) => (
            <tr key={role} style={{ borderBottom: "1px solid #ffffff11" }}>
              {hired ? (
                <>
                  <td style={{ padding: "7px 10px", cursor: "pointer", textDecoration: "underline", textDecorationColor: "#ffffff33" }} onClick={() => onSelectStaff(hired, role, true)}>{hired.name}</td>
                  <td style={{ padding: "7px 10px" }}>{NATION_FLAG[hired.nationality] || "—"}</td>
                  <td style={{ padding: "7px 10px", color: "var(--iceMuted)" }}>{hired.age ?? "—"}</td>
                  <td style={{ padding: "7px 10px" }}>{STAFF_ROLES[role]}</td>
                  <td style={{ padding: "7px 10px" }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><StarRating value={starsFor(hired.rating, benchmark)} size={12} />{hired.devSkill != null && <StarRating value={starsFor(hired.devSkill, benchmark)} size={11} color="#7A9EDB" />}</div></td>
                  <td style={{ padding: "7px 10px", color: "var(--iceMuted)" }}>{money(hired.salary)} par saison</td>
                  <td style={{ padding: "7px 10px" }}><button onClick={() => onFire(role)} style={{ ...btnStyle("var(--loss)"), fontSize: 11, padding: "3px 10px" }}>Congédier</button></td>
                </>
              ) : (
                <>
                  <td colSpan={6} style={{ padding: "7px 10px", color: "var(--iceMuted)" }}>{STAFF_ROLES[role]} — <em>poste vacant</em></td>
                  <td></td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ ...h2Style, marginBottom: 0 }}>Marché des candidats</h2>
        <button onClick={onRefresh} style={btnStyle("var(--steel)")}>Rafraîchir le marché</button>
      </div>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 12 }}>Embaucher un candidat remplace automatiquement la personne en poste pour ce rôle. Comme pour un joueur, une offre n'est pas acceptée sur-le-champ : le candidat prend quelques jours pour répondre, et une offre trop basse par rapport à son salaire demandé risque d'être refusée.</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginBottom: 30 }}>
        <thead><tr>
          <SortTh label="Nom" sortKey="name" activeKey={smk} activeDir={smd} onSort={smToggle} />
          <th style={{ textAlign: "left", padding: "6px 10px", color: "var(--iceMuted)", fontWeight: 500, fontSize: 12, borderBottom: "1px solid #ffffff22" }}>Nat.</th>
          <SortTh label="Âge" sortKey="age" activeKey={smk} activeDir={smd} onSort={smToggle} />
          <SortTh label="Poste" sortKey="role" activeKey={smk} activeDir={smd} onSort={smToggle} />
          <SortTh label="Cote" sortKey="rating" activeKey={smk} activeDir={smd} onSort={smToggle} />
          <SortTh label="Salaire demandé" sortKey="salary" activeKey={smk} activeDir={smd} onSort={smToggle} />
          <th>Offre</th>
        </tr></thead>
        <tbody>
          {sortedStaffMarket.map((c) => {
            const pending = pendingStaffOffers.find((o) => o.candidateId === c.id);
            const neg = staffNegotiations[c.id];
            const offered = offers[c.id] ?? c.salary;
            return (
              <tr key={c.id} style={{ borderBottom: "1px solid #ffffff11" }}>
                <td style={{ padding: "7px 10px", cursor: "pointer", textDecoration: "underline", textDecorationColor: "#ffffff33" }} onClick={() => onSelectStaff(c, c.role, false)}>{c.name}</td>
                <td style={{ padding: "7px 10px" }}>{NATION_FLAG[c.nationality] || "—"}</td>
                <td style={{ padding: "7px 10px", color: "var(--iceMuted)" }}>{c.age ?? "—"}</td>
                <td style={{ padding: "7px 10px" }}>{STAFF_ROLES[c.role]}</td>
                <td style={{ padding: "7px 10px" }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><StarRating value={starsFor(c.rating, benchmark)} size={12} />{c.devSkill != null && <StarRating value={starsFor(c.devSkill, benchmark)} size={11} color="#7A9EDB" />}</div></td>
                <td style={{ padding: "7px 10px" }}>{money(c.salary)} par saison</td>
                <td style={{ padding: "7px 10px" }}>
                  {pending ? (
                    <span style={{ fontSize: 12, color: "var(--iceMuted)", fontStyle: "italic" }}>Offre envoyée ({money(pending.offeredSalary)}) — réponse vers le {formatDay(pending.dueDay)}</span>
                  ) : neg?.stonewalled ? (
                    <span style={{ fontSize: 12, color: "var(--loss)" }}>Refuse toute négociation cette saison</span>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input type="number" min={0} step={25} value={offered} onChange={(e) => setOffers((prev) => ({ ...prev, [c.id]: Number(e.target.value) }))} style={{ width: 90, background: "var(--navy)", border: "1px solid #ffffff33", borderRadius: 3, color: "var(--ice)", padding: "4px 6px", fontSize: 12 }} />
                      <button onClick={() => onOffer(c, offered)} style={btnStyle("var(--win)")}>Offrir</button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
          {sortedStaffMarket.length === 0 && <tr><td colSpan={7} style={{ padding: 12, color: "var(--iceMuted)" }}>Aucun candidat sur le marché.</td></tr>}
        </tbody>
      </table>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <h2 style={{ ...h2Style, marginBottom: 0 }}>Rapport mensuel de progression</h2>
        <span style={{ fontSize: 12, color: "var(--iceMuted)" }}>Produit automatiquement au début de chaque mois · nous sommes en {month}</span>
      </div>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 12 }}>Les jeunes joueurs progressent plus vite vers leur potentiel; les vétérans stagnent ou déclinent. Un bon dépisteur professionnel accélère le développement.</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead><tr>{["Joueur", "Avant", "Après", "Δ"].map((h, i) => (<th key={i} style={{ textAlign: "left", padding: "6px 10px", color: "var(--iceMuted)", fontWeight: 500, fontSize: 12, borderBottom: "1px solid #ffffff22" }}>{h}</th>))}</tr></thead>
        <tbody>
          {progressionReport.map((r) => (
            <tr key={r.id} style={{ borderBottom: "1px solid #ffffff11" }}>
              <td style={{ padding: "7px 10px" }}><PlayerLink player={myTeam.roster.find((p) => p.id === r.id)} team={myTeam} onSelect={onSelectPlayer}>{r.name}</PlayerLink></td>
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
