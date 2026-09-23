import { useMemo, useState } from "react";
import { NATION_FLAG } from "../data/names";
import { starsFor, teamOvrBenchmark } from "../engine/attributes";
import { staffViewPlayer, getScoutInfo, perceivedRatings } from "../engine/scouting";
import { formatDay } from "../engine/calendar";
import { h2Style, btnStyle } from "../ui/theme";
import { StarRating, PlayerLink, TeamCrest } from "./common";

export function DraftPanel({ draft, draftDay, teamsById, myTeam, staff, scoutKnowledge, onPick, onSimToMyPick, onSimAll, onSelectPlayer }) {
  const [posFilter, setPosFilter] = useState("Tous");
  const taken = useMemo(() => new Set(draft.picks.map((k) => k.playerId).filter(Boolean)), [draft]);
  const benchmark = teamOvrBenchmark(myTeam);
  // Classement selon TON dépisteur (rapport de dépistage s'il existe, sinon évaluation du personnel).
  const board = useMemo(() => draft.pool
    .filter((p) => !taken.has(p.id))
    .map((p) => {
      const info = getScoutInfo(p, null, myTeam.id, staff, scoutKnowledge);
      const seen = info.estOvr != null ? perceivedRatings(p, info) : staffViewPlayer(p, staff);
      return { p, ovr: seen.ovr, potential: seen.potential, report: info.estOvr != null };
    })
    .sort((a, b) => b.potential * 0.8 + b.ovr * 0.2 - (a.potential * 0.8 + a.ovr * 0.2)), [draft, taken, staff, scoutKnowledge, myTeam.id]);
  const current = draft.picks[draft.current];
  const myTurn = current && current.teamId === myTeam.id;
  const done = !current;
  const myPicks = draft.picks.filter((k) => k.teamId === myTeam.id);
  const rows = board.filter((r) => posFilter === "Tous" || r.p.pos === posFilter).slice(0, 80);
  const recent = draft.picks.slice(Math.max(0, draft.current - 8), draft.current).reverse();
  return (
    <div>
      <h2 style={h2Style}>Repêchage {draft.year + 1} — {formatDay(draftDay)}</h2>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", background: "var(--navy2)", border: `1px solid ${myTurn ? "var(--gold)" : "#ffffff1a"}`, borderRadius: 6, padding: 12, marginBottom: 14 }}>
        {done ? <strong>Repêchage terminé.</strong> : (
          <>
            <TeamCrest team={teamsById[current.teamId]} size={34} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "var(--iceMuted)" }}>RONDE {current.round} · CHOIX {current.overall}</div>
              <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 17 }}>{myTurn ? "À toi de choisir !" : `${teamsById[current.teamId].name} est au micro`}</div>
            </div>
            {!myTurn && <button onClick={onSimToMyPick} style={btnStyle("var(--red)")}>Avancer jusqu'à mon choix</button>}
            <button onClick={onSimAll} style={btnStyle("var(--steel)")}>Terminer le repêchage (choix auto)</button>
          </>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(220px, 1fr)", gap: 16 }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontSize: 12, color: "var(--iceMuted)" }}>Classement de ton dépisteur amateur (clique un nom pour son profil et demander un rapport)</div>
            <select value={posFilter} onChange={(e) => setPosFilter(e.target.value)} style={{ background: "var(--navy)", color: "var(--ice)", border: "1px solid #ffffff33", borderRadius: 3, padding: "4px 6px", fontSize: 12 }}>
              {["Tous", "C", "LW", "RW", "LD", "RD", "G"].map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr>{["#", "Espoir", "Pos", "Âge", "Actuel", "Potentiel", ""].map((h) => <th key={h} style={{ textAlign: "left", padding: "5px 8px", color: "var(--iceMuted)", fontWeight: 500, fontSize: 11, borderBottom: "1px solid #ffffff22" }}>{h}</th>)}</tr></thead>
            <tbody>{rows.map((r, i) => (
              <tr key={r.p.id} style={{ borderBottom: "1px solid #ffffff11" }}>
                <td style={{ padding: "5px 8px", color: "var(--iceMuted)" }}>{i + 1}</td>
                <td style={{ padding: "5px 8px" }}>{NATION_FLAG[r.p.nationality] || ""} <PlayerLink player={r.p} onSelect={(p) => onSelectPlayer(p, null)} />{r.report && <span title="Rapport de dépistage reçu" style={{ color: "var(--gold)", fontSize: 10 }}> ●</span>}</td>
                <td style={{ padding: "5px 8px" }}>{r.p.pos}</td>
                <td style={{ padding: "5px 8px" }}>{r.p.age}</td>
                <td style={{ padding: "5px 8px" }}><StarRating value={starsFor(r.ovr, benchmark)} size={11} /></td>
                <td style={{ padding: "5px 8px" }}><StarRating value={starsFor(r.potential, benchmark)} size={11} color="#7A9EDB" /></td>
                <td style={{ padding: "5px 8px" }}>{myTurn && <button onClick={() => onPick(r.p.id)} style={{ ...btnStyle("var(--win)"), fontSize: 11, padding: "3px 8px" }}>Repêcher</button>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div>
          {draft.lottery && (
            <div style={{ background: "var(--navy2)", border: "1px solid rgba(255,194,71,0.4)", borderRadius: 4, padding: 10, marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "var(--gold)", marginBottom: 6 }}>LOTERIE</div>
              {draft.lottery.draws.map((d) => (
                <div key={d.pick} style={{ fontSize: 12, padding: "2px 0" }}>
                  Choix n° {d.pick} : <strong>{teamsById[d.winner].name}</strong> <span style={{ color: "var(--iceMuted)" }}>({d.from}e pire dossier)</span>
                  {d.movedTo && <div style={{ fontSize: 11, color: "var(--iceMuted)" }}>{teamsById[d.drawn].name}, tirée au sort, ne peut monter que de 10 rangs : elle passe au {d.movedTo}e choix.</div>}
                </div>
              ))}
              <div style={{ fontSize: 11, color: "var(--iceMuted)", marginTop: 6 }}>16 équipes hors séries, 2 tirages, chances de 18,5 % (pire dossier) à 0,5 %. Montée maximale de 10 rangs.</div>
            </div>
          )}
          <div style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 6 }}>TES CHOIX</div>
          {myPicks.map((k) => { const p = k.playerId && draft.pool.find((x) => x.id === k.playerId); return (
            <div key={k.overall} style={{ fontSize: 13, padding: "4px 0", borderBottom: "1px solid #ffffff11" }}>R{k.round} · #{k.overall} — {p ? `${p.name} (${p.pos})` : <span style={{ color: "var(--iceMuted)" }}>à venir</span>}</div>
          ); })}
          <div style={{ fontSize: 12, color: "var(--iceMuted)", margin: "14px 0 6px" }}>DERNIERS CHOIX</div>
          {recent.map((k) => { const p = draft.pool.find((x) => x.id === k.playerId); return (
            <div key={k.overall} style={{ fontSize: 12, padding: "3px 0" }}>#{k.overall} {teamsById[k.teamId].name} — {p?.name} ({p?.pos})</div>
          ); })}
          <div style={{ fontSize: 11, color: "var(--iceMuted)", marginTop: 12 }}>Ordre : équipes hors séries (pire dossier d'abord, sauf les 2 choix de la loterie), puis selon la ronde d'élimination ; champion en dernier. Les joueurs repêchés rejoignent le club-école avec un contrat d'entrée (3 ans, 950 k$).</div>
        </div>
      </div>
    </div>
  );
}
