import { gameDay, formatDay } from "../engine/calendar";
import { h2Style, btnStyle } from "../ui/theme";
import { TeamCrest, PlayerLink } from "./common";

const RESULT_COLOR = { V: "var(--win)", D: "var(--loss)", P: "var(--gold)" };
const RESULT_LABEL = { V: "V", D: "D", P: "DP" };

// Résultat d'un match joué, du point de vue de `myTeamId` : victoire, défaite, ou défaite en
// prolongation/tirs de barrage (P, comme dans le tableau de classement).
function resultFor(game, myTeamId) {
  const mine = game.home === myTeamId ? game.homeScore : game.awayScore;
  const theirs = game.home === myTeamId ? game.awayScore : game.homeScore;
  const extra = game.decidedIn === "OT" || game.decidedIn === "SO";
  if (mine > theirs) return "V";
  return extra ? "P" : "D";
}

// Page d'accueil : coup d'œil sur le dossier de l'équipe, sa division, ses derniers résultats
// (au fil de la simulation) et les meneurs au pointage de la ligue, avec des raccourcis vers les
// onglets complets (Classement, Statistiques).
export function HomeDashboard({ myTeamId, teamsById, standings, leaders, schedule, seasonYear, onSelectPlayer, onGoTo }) {
  const myRankIdx = standings.findIndex((s) => s.id === myTeamId);
  const my = standings[myRankIdx];
  const myTeam = teamsById[myTeamId];
  const myDivision = myTeam?.division;
  const divisionRows = standings.filter((s) => teamsById[s.id]?.division === myDivision);
  const recent = schedule
    .filter((g) => g.played && (g.home === myTeamId || g.away === myTeamId))
    .sort((a, b) => gameDay(seasonYear, b) - gameDay(seasonYear, a))
    .slice(0, 8);
  const topLeaders = leaders.slice(0, 8);

  return (
    <div>
      <h2 style={h2Style}>Accueil</h2>
      {my && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--navy2)", border: "1px solid #ffffff1a", borderRadius: 6, padding: 14, marginBottom: 18 }}>
          <TeamCrest team={myTeam} size={40} />
          <div>
            <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 18 }}>{myTeam.name}</div>
            <div style={{ fontSize: 12, color: "var(--iceMuted)" }}>
              {myRankIdx + 1}{myRankIdx === 0 ? "er" : "e"} au classement général · {my.w}-{my.l}-{my.otl} · <strong style={{ color: "var(--ice)" }}>{my.pts} pts</strong>
              {my.streak && ` · séquence ${my.streak}`}{recent.length > 0 && ` · 10 derniers : ${my.last10?.join("") || "—"}`}
            </div>
          </div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 20 }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 15 }}>Division {myDivision || ""}</div>
            <button onClick={() => onGoTo("standings")} style={{ ...btnStyle("var(--steel)"), fontSize: 11, padding: "3px 8px" }}>Classement complet</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 20 }}>
            <thead><tr>
              <th style={{ textAlign: "left", padding: "5px 8px", color: "var(--iceMuted)", fontWeight: 500, fontSize: 11, borderBottom: "1px solid #ffffff22" }}>Équipe</th>
              {["PJ", "V", "D", "DP", "PTS"].map((l) => <th key={l} style={{ padding: "5px 6px", color: "var(--iceMuted)", fontWeight: 500, fontSize: 11, borderBottom: "1px solid #ffffff22" }}>{l}</th>)}
            </tr></thead>
            <tbody>
              {divisionRows.map((s, i) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #ffffff11", background: s.id === myTeamId ? "#ffffff0d" : "transparent" }}>
                  <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 14, color: "var(--iceMuted)", fontSize: 11 }}>{i + 1}</span>
                      <TeamCrest team={teamsById[s.id]} size={18} />
                      <span style={{ color: s.id === myTeamId ? teamsById[s.id].color : "var(--ice)", fontWeight: s.id === myTeamId ? 600 : 400 }}>{teamsById[s.id].name}</span>
                    </span>
                  </td>
                  <td style={{ padding: "6px", textAlign: "center" }}>{s.gp}</td>
                  <td style={{ padding: "6px", textAlign: "center" }}>{s.w}</td>
                  <td style={{ padding: "6px", textAlign: "center" }}>{s.l}</td>
                  <td style={{ padding: "6px", textAlign: "center" }}>{s.otl}</td>
                  <td style={{ padding: "6px", textAlign: "center", fontWeight: 700 }}>{s.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 15, marginBottom: 8 }}>Résultats récents</div>
          {recent.length === 0 && <div style={{ fontSize: 12, color: "var(--iceMuted)" }}>Aucun match joué pour l'instant.</div>}
          {recent.map((g) => {
            const opponentId = g.home === myTeamId ? g.away : g.home;
            const home = g.home === myTeamId;
            const mine = home ? g.homeScore : g.awayScore;
            const theirs = home ? g.awayScore : g.homeScore;
            const res = resultFor(g, myTeamId);
            return (
              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 4px", borderBottom: "1px solid #ffffff11", fontSize: 13 }}>
                <span style={{ width: 22, textAlign: "center", fontWeight: 700, color: RESULT_COLOR[res] }}>{RESULT_LABEL[res]}</span>
                <span style={{ width: 20, color: "var(--iceMuted)", fontSize: 11 }}>{home ? "vs" : "@"}</span>
                <TeamCrest team={teamsById[opponentId]} size={20} />
                <span style={{ flex: 1 }}>{teamsById[opponentId]?.name}</span>
                <span style={{ color: "var(--iceMuted)" }}>{formatDay(gameDay(seasonYear, g))}</span>
                <span style={{ fontWeight: 600, width: 50, textAlign: "right" }}>{mine}–{theirs}</span>
              </div>
            );
          })}
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 15 }}>Meneurs au pointage</div>
            <button onClick={() => onGoTo("stats")} style={{ ...btnStyle("var(--steel)"), fontSize: 11, padding: "3px 8px" }}>Statistiques complètes</button>
          </div>
          {topLeaders.length === 0 && <div style={{ fontSize: 12, color: "var(--iceMuted)" }}>Aucune statistique pour l'instant.</div>}
          {topLeaders.map((l, i) => (
            <div key={l.player.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", borderBottom: "1px solid #ffffff11", fontSize: 13 }}>
              <span style={{ width: 18, color: "var(--iceMuted)", fontSize: 11 }}>{i + 1}</span>
              <TeamCrest team={l.team} size={18} />
              <PlayerLink player={l.player} team={l.team} onSelect={onSelectPlayer} style={{ flex: 1 }} />
              <span style={{ color: "var(--iceMuted)", fontSize: 12 }}>{l.gp} PJ</span>
              <span style={{ fontWeight: 700, width: 32, textAlign: "right" }}>{l.pts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
