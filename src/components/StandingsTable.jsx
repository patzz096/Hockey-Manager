import { useState } from "react";
import { CONFERENCES, conferenceOf, playoffSeeds, qualificationMarks } from "../engine/standings";
import { h2Style, btnStyle } from "../ui/theme";
import { TeamCrest } from "./common";

const COLS = [
  ["gp", "PJ"], ["w", "V"], ["l", "D"], ["otl", "DP"], ["pts", "PTS"], ["pct", "P%"], ["rw", "VR"], ["row", "VRP"],
  ["gf", "BP"], ["ga", "BC"], ["diff", "DIFF"], ["home", "DOM"], ["away", "EXT"], ["l10", "10 DER."], ["streak", "SÉQ."],
];
const MARK_LABEL = { y: "Champion de division", x: "Qualifié pour les séries", w: "Équipe repêchée (wild card)" };

function cell(s, key) {
  if (key === "pct") return s.pct.toFixed(3).replace(/^0/, "");
  if (key === "diff") { const d = s.gf - s.ga; return d > 0 ? `+${d}` : d; }
  if (key === "home") return `${s.homeW}-${s.homeL}-${s.homeOtl}`;
  if (key === "away") return `${s.awayW}-${s.awayL}-${s.awayOtl}`;
  return s[key] ?? "";
}

function Table({ rows, teamsById, myTeamId, marks, cutAfter = [], title }) {
  return (
    <div style={{ marginBottom: 20, overflowX: "auto" }}>
      {title && <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 15, margin: "4px 0 6px" }}>{title}</div>}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr>
          <th style={{ textAlign: "left", padding: "5px 8px", color: "var(--iceMuted)", fontWeight: 500, fontSize: 11, borderBottom: "1px solid #ffffff22" }}>Équipe</th>
          {COLS.map(([k, l]) => <th key={k} style={{ padding: "5px 6px", color: k === "pts" ? "var(--ice)" : "var(--iceMuted)", fontWeight: 500, fontSize: 11, borderBottom: "1px solid #ffffff22", whiteSpace: "nowrap" }}>{l}</th>)}
        </tr></thead>
        <tbody>
          {rows.map((s, i) => (
            <tr key={s.id} style={{ borderBottom: cutAfter.includes(i) ? "2px dashed rgba(255,194,71,0.55)" : "1px solid #ffffff11", background: s.id === myTeamId ? "#ffffff0d" : "transparent" }}>
              <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 16, color: "var(--iceMuted)", fontSize: 11 }}>{i + 1}</span>
                  <TeamCrest team={teamsById[s.id]} size={20} />
                  <span style={{ color: s.id === myTeamId ? teamsById[s.id].color : "var(--ice)", fontWeight: s.id === myTeamId ? 600 : 400 }}>{teamsById[s.id].name}</span>
                  {marks[s.id] && <span title={MARK_LABEL[marks[s.id]]} style={{ fontSize: 10, color: "var(--gold)", fontWeight: 700 }}>{marks[s.id]}</span>}
                </span>
              </td>
              {COLS.map(([k]) => <td key={k} style={{ padding: "6px", textAlign: "center", fontWeight: k === "pts" ? 700 : 400, color: k === "diff" ? (s.gf - s.ga > 0 ? "var(--win)" : s.gf - s.ga < 0 ? "var(--loss)" : "var(--ice)") : "var(--ice)", whiteSpace: "nowrap" }}>{cell(s, k)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StandingsTable({ standings, teamsById, myTeamId, history = [] }) {
  const [view, setView] = useState("division");
  const marks = standings.some((s) => s.gp > 0) ? qualificationMarks(standings, teamsById) : {};
  const seeds = playoffSeeds(standings, teamsById);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, gap: 8, flexWrap: "wrap" }}>
        <h2 style={{ ...h2Style, marginBottom: 0 }}>Classement</h2>
        <div style={{ display: "flex", gap: 6 }}>
          {[["division", "Division"], ["wildcard", "Équipes repêchées"], ["league", "Ligue"]].map(([k, l]) => (
            <button key={k} onClick={() => setView(k)} style={{ ...btnStyle(view === k ? "var(--red)" : "var(--steel)"), fontSize: 12 }}>{l}</button>
          ))}
        </div>
      </div>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: 6, marginBottom: 14 }}>
        Modèle LNH : victoire 2 pts, défaite en prolongation ou tirs de barrage (DP) 1 pt, défaite 0. Départage : points, % de points, victoires en temps réglementaire (VR), en temps réglementaire + prolongation (VRP), victoires, différentiel.
        Séries : 3 premiers de chaque division + 2 équipes repêchées par association. <strong style={{ color: "var(--gold)" }}>y</strong> champion de division · <strong style={{ color: "var(--gold)" }}>x</strong> qualifié · <strong style={{ color: "var(--gold)" }}>w</strong> équipe repêchée.
      </p>
      {view === "league" && <Table rows={standings} teamsById={teamsById} myTeamId={myTeamId} marks={marks} />}
      {view === "division" && Object.values(CONFERENCES).flat().map((d) => (
        <Table key={d} title={`Division ${d}`} rows={standings.filter((s) => teamsById[s.id].division === d)} teamsById={teamsById} myTeamId={myTeamId} marks={marks} cutAfter={[2]} />
      ))}
      {view === "wildcard" && Object.entries(seeds).map(([conf, c]) => {
        const top = new Set(Object.values(c.divisions).flat().map((s) => s.id));
        const rest = standings.filter((s) => conferenceOf(teamsById[s.id].division) === conf && !top.has(s.id));
        return (
          <div key={conf}>
            <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 18, margin: "6px 0" }}>Association de l'{conf}</div>
            {c.order.map((d) => <Table key={d} title={`${d} — 3 premiers`} rows={c.divisions[d]} teamsById={teamsById} myTeamId={myTeamId} marks={marks} />)}
            <Table title="Équipes repêchées (2 places)" rows={rest} teamsById={teamsById} myTeamId={myTeamId} marks={marks} cutAfter={[1]} />
          </div>
        );
      })}
      {history.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 18, margin: "6px 0" }}>Palmarès</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr>{["Saison", "Coupe Stanley", "Meilleur dossier", "Ton équipe", "Meilleur pointeur"].map((h) => <th key={h} style={{ textAlign: "left", padding: "5px 8px", color: "var(--iceMuted)", fontWeight: 500, fontSize: 11, borderBottom: "1px solid #ffffff22" }}>{h}</th>)}</tr></thead>
            <tbody>{history.map((h) => (
              <tr key={h.year} style={{ borderBottom: "1px solid #ffffff11" }}>
                <td style={{ padding: "6px 8px" }}>{h.year}-{h.year + 1}</td>
                <td style={{ padding: "6px 8px", fontWeight: 600 }}>{h.champion}</td>
                <td style={{ padding: "6px 8px" }}>{h.presidents}</td>
                <td style={{ padding: "6px 8px" }}>{h.myRecord}</td>
                <td style={{ padding: "6px 8px" }}>{h.topScorer}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
