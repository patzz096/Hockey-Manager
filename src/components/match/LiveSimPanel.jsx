import { btnStyle } from "../../ui/theme";
import { TeamCrest } from "../common";
import { StatLines } from "./BoxscoreView";
import { GoalSummary } from "./GoalSummary";

export const LIVE_PERIOD_MS = 9000;

export const LIVE_TOTAL_MS = LIVE_PERIOD_MS * 3;

// Moment d'apparition de chaque but dans le visionneur, selon sa minute de jeu.
// La prolongation et les tirs de barrage apparaissent juste avant la fin.
export function scheduleGoalTimeline(goalLog) {
  return (goalLog || [])
    .map((g, i) => {
      const minute = g.minute ?? (g.period - 1) * 20 + 10 + i * 0.01;
      return { ...g, t: (Math.min(minute, 59.5 + (g.period - 3) * 0.1) / 60) * LIVE_TOTAL_MS };
    })
    .sort((a, b) => a.t - b.t);
}

export function periodLabel(period) { return period === 4 ? "Prol." : period === 5 ? "TB" : `P${period}`; }
export function goalTime(g) {
  if (g.minute == null || g.period > 4) return "";
  const inPeriod = g.period === 4 ? g.minute - 60 : g.minute - (g.period - 1) * 20;
  const m = Math.floor(inPeriod), s = Math.floor((inPeriod - m) * 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Horloge de période comme à la télé : elle descend de 20:00 à 0:00.
export function clockDisplay(minute) {
  if (minute >= 60 || (minute > 0 && minute % 20 === 0)) return "00:00";
  const remaining = 20 - (minute % 20);
  const total = Math.round(remaining * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
export function livePeriod(minute) {
  if (minute >= 60) return 3;
  return minute > 0 && minute % 20 === 0 ? minute / 20 : Math.floor(minute / 20) + 1;
}

export function LiveSimPanel({ liveMatch, myTeamId, linesByTeam, onSelectPlayer, onNextPeriod, onEndOfPeriod, onFinish, onGoToLines, onGoToStrategy }) {
  const { home, away, minute, homeScore, awayScore, accum, lastStop } = liveMatch;
  const done = minute >= 60;
  const currentPeriod = livePeriod(minute);
  const intermission = !done && minute > 0 && minute % 20 === 0;
  const homeHits = Object.values(accum.home.hitsBy || {}).reduce((a, v) => a + v, 0);
  const awayHits = Object.values(accum.away.hitsBy || {}).reduce((a, v) => a + v, 0);
  return (
    <div style={{ background: "var(--navy2)", border: `1px solid ${done ? "var(--win)" : "#D9A404"}66`, borderRadius: 6, padding: 16, marginBottom: 22 }}>
      <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 10, color: "#D9A404" }}>SIMULATION EN DIRECT{liveMatch.game.playoff ? " · SÉRIES ÉLIMINATOIRES" : ""}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
        <div style={{ textAlign: "center" }}><TeamCrest team={home} size={34} /><div style={{ fontSize: 11, marginTop: 3 }}>{home.name}</div></div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: 28 }}>{homeScore} – {awayScore}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 2 }}>
            <span style={{ fontSize: 11, color: "var(--iceMuted)" }}>{done ? "FINAL" : intermission ? `Entracte (après la ${currentPeriod}${currentPeriod === 1 ? "re" : "e"})` : `${currentPeriod}${currentPeriod === 1 ? "re" : "e"} période`}</span>
            <span style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: 15, background: "#000", color: "#0f0", padding: "1px 8px", borderRadius: 3, letterSpacing: 1 }}>{clockDisplay(minute)}</span>
          </div>
        </div>
        <div style={{ textAlign: "center" }}><TeamCrest team={away} size={34} /><div style={{ fontSize: 11, marginTop: 3 }}>{away.name}</div></div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
            {[0, 1, 2].map((p) => (
              <div key={p} style={{ flex: 1, height: 5, borderRadius: 2, background: "#ffffff1a", overflow: "hidden" }}>
                <div style={{ width: `${Math.max(0, Math.min(1, (minute - p * 20) / 20)) * 100}%`, height: "100%", background: minute >= (p + 1) * 20 ? "var(--win)" : "#D9A404" }} />
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "var(--iceMuted)" }}>Tirs {accum.home.shots || 0}–{accum.away.shots || 0} · MEC {homeHits}–{awayHits} · Pun. {accum.home.penalties || 0}–{accum.away.penalties || 0}</div>
          {lastStop && <div style={{ fontSize: 11, color: "var(--ice)", marginTop: 4 }}>Arrêt de jeu — {lastStop}</div>}
        </div>
      </div>
      {!done ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
          <button onClick={onNextPeriod} style={btnStyle("var(--red)")}>{intermission || minute === 0 ? "Mise au jeu" : "Jouer jusqu'au prochain arrêt"}</button>
          <button onClick={onEndOfPeriod} style={btnStyle("var(--steel)")}>Jusqu'à la fin de la période</button>
          <button onClick={onGoToLines} style={btnStyle("var(--steel)")}>Ajuster les trios</button>
          <button onClick={onGoToStrategy} style={btnStyle("var(--steel)")}>Ajuster la stratégie</button>
          <span style={{ fontSize: 11, color: "var(--iceMuted)" }}>Le jeu s'arrête au prochain coup de sifflet (moment variable). Tes changements s'appliquent dès la mise au jeu suivante.</span>
        </div>
      ) : (
        <button onClick={onFinish} style={{ ...btnStyle("var(--win)"), marginBottom: 16 }}>Confirmer le résultat final</button>
      )}
      <GoalSummary goalLog={accum.goalLog} home={home} away={away} onSelectPlayer={onSelectPlayer} />
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <StatLines title={`${home.name} (dom.)`} box={accum.home} team={home} lines={linesByTeam[home.id]} onSelectPlayer={onSelectPlayer} />
        <StatLines title={`${away.name} (visit.)`} box={accum.away} team={away} lines={linesByTeam[away.id]} onSelectPlayer={onSelectPlayer} />
      </div>
    </div>
  );
}
