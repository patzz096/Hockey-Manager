import { attr20, teamOvrBenchmark, starsFor } from "../engine/attributes";
import { STAFF_ROLES } from "../engine/staff";
import { BASE_CONDITION, TRAINING_FOCUSES, conditionColor, conditionLabel, cohesionColor, cohesionLabel } from "../engine/training";
import { h2Style, btnStyle, attr20Color } from "../ui/theme";
import { useSort, sortRows } from "../ui/useSort";
import { SortTh, StarRating, PlayerLink } from "./common";
import { money } from "../ui/format";

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
          <div style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 10 }}>{money(hired.salary)} par saison</div>
          <button onClick={() => onFire(role)} style={{ ...btnStyle("var(--loss)"), width: "100%", justifyContent: "center", fontSize: 12 }}>Congédier</button>
        </>
      ) : (
        <div style={{ fontSize: 13, color: "var(--iceMuted)" }}>Poste vacant</div>
      )}
    </div>
  );
}

export function StaffCenter({ business, staffMarket, myTeam, month, progressionReport, onHire, onFire, onRefresh, onSetDelegation, onSelectPlayer, cohesion, onSetTrainingFocus }) {
  const [smk, smd, smToggle] = useSort("rating");
  const smAcc = (c, key) => (key === "role" ? STAFF_ROLES[c.role] : c[key]);
  const sortedStaffMarket = sortRows(staffMarket, smk, smd, smAcc);
  const benchmark = teamOvrBenchmark(myTeam);
  const avgCondition = myTeam.roster.length ? myTeam.roster.reduce((a, p) => a + (p.condition ?? BASE_CONDITION), 0) / myTeam.roster.length : BASE_CONDITION;
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
        <div style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: 12, flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 12, marginBottom: 8 }}>Entraînement {business.staff.fitnessCoach ? `(${business.staff.fitnessCoach.name})` : "(poste vacant)"}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => onSetDelegation("training", "manual")} style={{ ...btnStyle(business.delegation.training === "manual" ? "var(--red)" : "var(--steel)"), fontSize: 12, flex: 1, justifyContent: "center" }}>Contrôle</button>
            <button onClick={() => onSetDelegation("training", "delegated")} style={{ ...btnStyle(business.delegation.training === "delegated" ? "var(--win)" : "var(--steel)"), fontSize: 12, flex: 1, justifyContent: "center" }}>Délégué</button>
          </div>
        </div>
      </div>
      <p style={{ fontSize: 11, color: "var(--iceMuted)", marginTop: -18, marginBottom: 26 }}>Finances déléguées: le directeur ajuste les prix des billets et investit dans les installations après chaque match local. Opérations hockey déléguées: le directeur comble automatiquement les postes vacants (entraîneurs, adjoints, dépisteurs) à chaque avancement de mois. Entraînement délégué: l'accent hebdomadaire (physique, tactique, repos) est choisi automatiquement selon la forme de l'effectif, la cohésion et le calendrier à venir.</p>

      <h2 style={h2Style}>Entraînement</h2>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
        <div style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: 12, flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, color: "var(--iceMuted)", marginBottom: 4 }}>FORME PHYSIQUE MOYENNE</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: 22, color: conditionColor(avgCondition) }}>{Math.round(avgCondition)}</span>
            <span style={{ fontSize: 12, color: conditionColor(avgCondition) }}>{conditionLabel(avgCondition)}</span>
          </div>
        </div>
        <div style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: 12, flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, color: "var(--iceMuted)", marginBottom: 4 }}>COHÉSION TACTIQUE</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: 22, color: cohesionColor(cohesion) }}>{Math.round(cohesion)}</span>
            <span style={{ fontSize: 12, color: cohesionColor(cohesion) }}>{cohesionLabel(cohesion)}</span>
          </div>
        </div>
      </div>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 10 }}>La cohésion baisse quand tu changes ta stratégie et remonte à l'entraînement — un système bien rodé rend pleinement les bonus/malus de ta stratégie. Un entraîneur physique en poste accélère la récupération de la forme et contribue au développement des joueurs.</p>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 10 }}>Planifie jusqu'à 2 séances précises par jour (matin et après-midi) dans l'onglet <strong>Calendrier</strong> (vue « Mon équipe ») — un jour de match n'en permet qu'une, le matin. Le programme par défaut ci-dessous ne s'applique que les semaines où tu n'as rien planifié.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 10, marginBottom: 26 }}>
        {Object.entries(TRAINING_FOCUSES).map(([key, f]) => (
          <button key={key} disabled={business.delegation.training === "delegated"} onClick={() => onSetTrainingFocus(key)} style={{ ...btnStyle(business.trainingFocus === key ? "var(--accent)" : "var(--steel)"), flexDirection: "column", alignItems: "flex-start", gap: 4, padding: 10, opacity: business.delegation.training === "delegated" ? 0.55 : 1, cursor: business.delegation.training === "delegated" ? "default" : "pointer" }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{f.label}</span>
            <span style={{ fontSize: 10, color: business.trainingFocus === key ? "#0A1627" : "var(--iceMuted)" }}>{f.desc}</span>
          </button>
        ))}
      </div>
      {business.delegation.training === "delegated" && <p style={{ fontSize: 11, color: "var(--iceMuted)", marginTop: -18, marginBottom: 26 }}>Entraînement délégué — l'accent est choisi automatiquement chaque semaine.</p>}

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
              <td style={{ padding: "7px 10px" }}>{money(c.salary)} par saison</td>
              <td style={{ padding: "7px 10px" }}><button onClick={() => onHire(c)} style={btnStyle("var(--win)")}>Embaucher</button></td>
            </tr>
          ))}
          {sortedStaffMarket.length === 0 && <tr><td colSpan={5} style={{ padding: 12, color: "var(--iceMuted)" }}>Aucun candidat sur le marché.</td></tr>}
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
