import { formatDay } from "../engine/calendar";
import { fitsUnderCap, formatMoney, ROSTER_MAX } from "../engine/cap";
import { btnStyle } from "../ui/theme";
import { PlayerLink, TeamCrest } from "./common";

export function WaiversPanel({ waivers, myTeam, myTeamId, myClaims, year, teamsById, onToggleClaim, onSelectPlayer }) {
  return (
    <div style={{ marginTop: 26 }}>
      <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 18, marginBottom: 4 }}>Ballottage</div>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 10 }}>
        Un joueur de 23 ans et plus (ou avec 160 matchs LNH) doit passer 24 heures au ballottage avant d'aller au club-école. Toute équipe peut le réclamer avec son contrat ; priorité à la pire équipe au classement. Il faut une place (max. {ROSTER_MAX}) et de l'espace sous le plafond.
      </p>
      {waivers.length === 0 ? <div style={{ fontSize: 13, color: "var(--iceMuted)" }}>Aucun joueur au ballottage.</div> : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr>{["Joueur", "Pos", "Âge", "Équipe", "Contrat", "Échéance", ""].map((h) => <th key={h} style={{ textAlign: "left", padding: "5px 8px", color: "var(--iceMuted)", fontWeight: 500, fontSize: 11, borderBottom: "1px solid #ffffff22" }}>{h}</th>)}</tr></thead>
          <tbody>{waivers.map((w) => {
            const mine = w.fromTeamId === myTeamId;
            const claimed = myClaims.includes(w.player.id);
            const fits = fitsUnderCap(myTeam.roster, year, w.player.contract?.salary || 0) && myTeam.roster.length < ROSTER_MAX;
            return (
              <tr key={w.player.id} style={{ borderBottom: "1px solid #ffffff11" }}>
                <td style={{ padding: "5px 8px" }}><PlayerLink player={w.player} onSelect={(p) => onSelectPlayer(p, null)} /></td>
                <td style={{ padding: "5px 8px" }}>{w.player.pos}</td>
                <td style={{ padding: "5px 8px" }}>{w.player.age}</td>
                <td style={{ padding: "5px 8px" }}><span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><TeamCrest team={teamsById[w.fromTeamId]} size={18} />{teamsById[w.fromTeamId].name}</span></td>
                <td style={{ padding: "5px 8px" }}>{w.player.contract ? `${formatMoney(w.player.contract.salary)} × ${w.player.contract.years} an${w.player.contract.years > 1 ? "s" : ""}` : "—"}</td>
                <td style={{ padding: "5px 8px" }}>{formatDay(w.expiresDay)}</td>
                <td style={{ padding: "5px 8px" }}>{mine ? <span style={{ fontSize: 11, color: "var(--iceMuted)" }}>Ton joueur</span> : (
                  <button onClick={() => onToggleClaim(w.player.id)} disabled={!claimed && !fits} title={fits ? "" : "Pas de place ou d'espace sous le plafond"} style={{ ...btnStyle(claimed ? "var(--red)" : "var(--win)"), fontSize: 11, padding: "3px 8px", opacity: claimed || fits ? 1 : 0.5 }}>{claimed ? "Annuler la réclamation" : "Réclamer"}</button>
                )}</td>
              </tr>
            );
          })}</tbody>
        </table>
      )}
    </div>
  );
}
