import { useState } from "react";
import { gameDay, formatDay } from "../engine/calendar";
import { teamOvrBenchmark, starsFor } from "../engine/attributes";
import { getScoutInfo, perceivedRatings } from "../engine/scouting";
import { injuryLabel, ltirEligible, atRisk } from "../engine/injuries";
import { MINOR_LEAGUES } from "../engine/minorLeagues";
import { h2Style, btnStyle, scoutQualityColor } from "../ui/theme";
import { TeamCrest, PlayerLink, TeamLink, StarRating, ConfirmButton } from "./common";
import { TeamOfTheWeek } from "./TeamOfTheWeek";
import { BoxscoreView } from "./match/BoxscoreView";

// Page d'accueil : coup d'œil sur le dossier de l'équipe, sa division, ses 5 derniers matchs (clic
// pour ouvrir le sommaire), l'infirmerie, l'équipe de la semaine, les meilleurs agents libres et
// les meneurs au pointage de la ligue, avec des raccourcis vers les onglets complets.
export function HomeDashboard({ myTeamId, teamsById, standings, leaders, schedule, seasonYear, weeklyTeam, linesByTeam, freeAgents = [], myTeam: myTeamFull, staff, scoutKnowledge, injuries = {}, currentDay, onRushReturn, onSelectPlayer, onSelectTeam, onContextMenu, onGoTo }) {
  const [expandedGameId, setExpandedGameId] = useState(null);
  const myRankIdx = standings.findIndex((s) => s.id === myTeamId);
  const my = standings[myRankIdx];
  const myTeam = teamsById[myTeamId];
  const myDivision = myTeam?.division;
  const divisionRows = standings.filter((s) => teamsById[s.id]?.division === myDivision);
  const last5 = schedule
    .filter((g) => g.played && (g.home === myTeamId || g.away === myTeamId))
    .sort((a, b) => gameDay(seasonYear, b) - gameDay(seasonYear, a))
    .slice(0, 5);
  const topLeaders = leaders.slice(0, 8);
  const benchmark = teamOvrBenchmark(myTeamFull || myTeam);
  const topFreeAgents = freeAgents
    .map((p) => ({ p, info: getScoutInfo(p, null, myTeamId, staff, scoutKnowledge) }))
    .filter((r) => r.info.known)
    .sort((a, b) => perceivedRatings(b.p, b.info).ovr - perceivedRatings(a.p, a.info).ovr)
    .slice(0, 5);
  const infirmary = (myTeam?.roster || [])
    .map((p) => ({ p, injury: injuries[p.id] }))
    .filter((r) => r.injury && r.injury.until > currentDay)
    .sort((a, b) => a.injury.until - b.injury.until);
  const fragile = (myTeam?.roster || [])
    .map((p) => ({ p, injury: injuries[p.id] }))
    .filter((r) => r.injury && r.injury.until <= currentDay && atRisk(r.injury, currentDay));

  return (
    <div>
      <h2 style={h2Style}>Accueil</h2>
      {my && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--navy2)", border: "1px solid #ffffff1a", borderRadius: 6, padding: 14, marginBottom: 18 }}>
          <TeamCrest team={myTeam} size={40} />
          <div>
            <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 18 }}><TeamLink team={myTeam} onSelect={onSelectTeam} /></div>
            <div style={{ fontSize: 12, color: "var(--iceMuted)" }}>
              {myRankIdx + 1}{myRankIdx === 0 ? "er" : "e"} au classement général · {my.w}-{my.l}-{my.otl} · <strong style={{ color: "var(--ice)" }}>{my.pts} pts</strong>
              {my.streak && ` · séquence ${my.streak}`}{last5.length > 0 && ` · 10 derniers : ${my.last10?.join("") || "—"}`}
            </div>
          </div>
        </div>
      )}
      {last5.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 15, marginBottom: 8 }}>5 derniers matchs</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {last5.map((g) => {
              const home = g.home === myTeamId;
              const opp = teamsById[home ? g.away : g.home];
              const won = home ? g.homeScore > g.awayScore : g.awayScore > g.homeScore;
              const expanded = expandedGameId === g.id;
              return (
                <div key={g.id}>
                  <div onClick={() => setExpandedGameId(expanded ? null : g.id)} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--navy2)", padding: "8px 12px", borderRadius: 3, fontSize: 13, cursor: "pointer", borderLeft: `3px solid ${won ? "var(--win)" : "var(--loss)"}` }}
                       onMouseEnter={(e) => (e.currentTarget.style.background = "#ffffff12")} onMouseLeave={(e) => (e.currentTarget.style.background = "var(--navy2)")}>
                    <span style={{ fontSize: 11, color: "var(--iceMuted)", minWidth: 68 }}>{formatDay(gameDay(seasonYear, g))}</span>
                    <TeamCrest team={opp} size={18} />
                    <span style={{ flex: 1 }}>{home ? "vs" : "@"} <TeamLink team={opp} onSelect={onSelectTeam} /></span>
                    <span style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, color: won ? "var(--win)" : "var(--loss)" }}>
                      {g.homeScore}–{g.awayScore}{g.decidedIn === "OT" ? " (P)" : g.decidedIn === "SO" ? " (TB)" : ""}
                    </span>
                  </div>
                  {expanded && <BoxscoreView game={g} teamsById={teamsById} linesByTeam={linesByTeam} onSelectPlayer={onSelectPlayer} onSelectTeam={onSelectTeam} onContextMenu={onContextMenu} schedule={schedule} seasonYear={seasonYear} />}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {(infirmary.length > 0 || fragile.length > 0) && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 15, marginBottom: 8 }}>Infirmerie ({infirmary.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {infirmary.map(({ p, injury }) => {
              const eligible = ltirEligible(injury, currentDay);
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--navy2)", padding: "8px 12px", borderRadius: 3, fontSize: 13, borderLeft: `3px solid ${injury.ltir ? "#7A4E9E" : "var(--loss)"}` }}>
                  <PlayerLink player={p} team={myTeam} onSelect={onSelectPlayer} style={{ flex: 1 }} />
                  <span style={{ color: "var(--iceMuted)", fontSize: 12 }}>{injuryLabel(injury, currentDay)}{injury.ltir ? " · LTIR" : eligible ? " · admissible LTIR" : ""}</span>
                  <span style={{ fontSize: 11, color: "var(--iceMuted)", whiteSpace: "nowrap" }}>retour {formatDay(injury.until)}</span>
                  {onRushReturn && <ConfirmButton small label="Revenir avant 100 %" confirmLabel="Confirmer : risque accru" color="var(--gold)" onConfirm={() => onRushReturn(p.id)} />}
                </div>
              );
            })}
            {fragile.map(({ p, injury }) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--navy2)", padding: "8px 12px", borderRadius: 3, fontSize: 13, borderLeft: "3px solid var(--gold)" }}>
                <PlayerLink player={p} team={myTeam} onSelect={onSelectPlayer} style={{ flex: 1 }} />
                <span title="Revenu avant 100 % : risque de rechute accru" style={{ fontSize: 10, fontWeight: 700, color: "var(--gold)", border: "1px solid rgba(255,194,71,0.45)", borderRadius: 3, padding: "0 4px" }}>FRAGILE</span>
                <span style={{ fontSize: 11, color: "var(--iceMuted)", whiteSpace: "nowrap" }}>risque accru jusqu'au {formatDay(injury.riskUntil)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <TeamOfTheWeek tow={weeklyTeam} onSelectPlayer={onSelectPlayer} />
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
                      <TeamLink team={teamsById[s.id]} onSelect={onSelectTeam} style={{ color: s.id === myTeamId ? teamsById[s.id].color : "var(--ice)", fontWeight: s.id === myTeamId ? 600 : 400 }} />
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

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, marginBottom: 8 }}>
            <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 15 }}>Meilleurs agents libres</div>
            <button onClick={() => onGoTo("freeagents")} style={{ ...btnStyle("var(--steel)"), fontSize: 11, padding: "3px 8px" }}>Agents libres</button>
          </div>
          {topFreeAgents.length === 0 && <div style={{ fontSize: 12, color: "var(--iceMuted)" }}>Aucun agent libre dépisté pour l'instant.</div>}
          {topFreeAgents.map(({ p, info }) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", borderBottom: "1px solid #ffffff11", fontSize: 13 }}>
              <span style={{ width: 24, color: "var(--iceMuted)", fontSize: 11 }}>{p.pos}</span>
              <PlayerLink player={p} onSelect={onSelectPlayer} style={{ flex: 1 }} />
              <span style={{ color: "var(--iceMuted)", fontSize: 11, whiteSpace: "nowrap" }}>{p.league ? `${MINOR_LEAGUES[p.league]?.short || p.league}${p.club ? ` (${p.club})` : ""}` : ""}</span>
              <StarRating value={starsFor(perceivedRatings(p, info).ovr, benchmark)} size={12} color={scoutQualityColor(info.quality)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
