import { Fragment } from "react";
import { PlayerLink } from "../common";
import { goalTime } from "./LiveSimPanel";
import { seasonGoalNumber } from "../../engine/stats";
import { ordinalFr } from "../../ui/format";

// `game` (match déjà joué, terminé) ou `goalLog` (match en cours, sim en direct) : l'un des deux
// suffit. `schedule`/`seasonYear`, fournis seulement avec `game`, annotent chaque but du rang de
// la saison de son buteur ; sans eux (sim en direct, séries), pas d'annotation.
export function GoalSummary({ game, goalLog: goalLogProp, home, away, onSelectPlayer, schedule, seasonYear }) {
  const goalLog = goalLogProp || game?.box?.goalLog;
  if (!goalLog || goalLog.length === 0) return <div style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 14 }}>Aucun but.</div>;
  const periods = [1, 2, 3, 4, 5];
  const periodTitle = { 1: "1RE PÉRIODE", 2: "2E PÉRIODE", 3: "3E PÉRIODE", 4: "PROLONGATION", 5: "TIRS DE BARRAGE" };
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: "var(--iceMuted)", marginBottom: 8, letterSpacing: 0.5 }}>SOMMAIRE DES BUTS</div>
      {periods.map((p) => {
        const goals = goalLog.filter((g) => g.period === p);
        if (goals.length === 0) return null;
        return (
          <div key={p} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "var(--iceMuted)", background: "#ffffff0a", padding: "3px 8px", borderRadius: 3, marginBottom: 6, display: "inline-block" }}>{periodTitle[p]}</div>
            {goals.map((g, i) => {
              const team = g.side === "home" ? home : away;
              if (g.type === "SO") return <div key={i} style={{ fontSize: 13, padding: "4px 0" }}>Victoire de <strong>{team.name}</strong> en tirs de barrage (+1 au score final, sans buteur)</div>;
              const scorer = team.roster.find((pl) => pl.id === g.scorerId);
              const assists = g.assistIds.map((id) => team.roster.find((pl) => pl.id === id)).filter(Boolean);
              const seasonNo = scorer && game && schedule && seasonYear != null ? seasonGoalNumber(schedule, seasonYear, game, scorer.id, goalLog.indexOf(g)) : null;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 13 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: team.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: "var(--iceMuted)", width: 34, fontVariantNumeric: "tabular-nums" }}>{goalTime(g)}</span>
                  <span style={{ flex: 1 }}>
                    <PlayerLink player={scorer} team={team} onSelect={onSelectPlayer} />
                    {seasonNo != null && <span style={{ color: "var(--iceMuted)" }}> ({ordinalFr(seasonNo)} but de la saison)</span>}
                    {assists.length > 0 && <span style={{ color: "var(--iceMuted)" }}> ({assists.map((a, j) => <Fragment key={a.id}>{j > 0 && ", "}<PlayerLink player={a} team={team} onSelect={onSelectPlayer} /></Fragment>)})</span>}
                  </span>
                  {g.type === "PP" && <span style={{ fontSize: 10, background: "rgba(255,194,71,0.2)", color: "var(--gold)", padding: "1px 6px", borderRadius: 3 }}>AN</span>}
                {g.type === "SH" && <span style={{ fontSize: 10, background: "rgba(92,200,255,0.18)", color: "var(--accent)", padding: "1px 6px", borderRadius: 3 }}>DN</span>}
                  <span style={{ fontSize: 11, color: "var(--iceMuted)" }}>{team.name}</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
