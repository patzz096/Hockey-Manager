import { CHUNK_MIN, CHUNKS_PER_PERIOD, TOTAL_CHUNKS } from "../../engine/simulation";
import { btnStyle } from "../../ui/theme";
import { TeamCrest } from "../common";
import { StatLines } from "./BoxscoreView";
import { GoalSummary } from "./GoalSummary";

export const LIVE_PERIOD_MS = 9000;

export const LIVE_TOTAL_MS = LIVE_PERIOD_MS * 3;

export function scheduleGoalTimeline(goalLog) {
  const byPeriod = { 1: [], 2: [], 3: [] };
  (goalLog || []).forEach((g) => { if (byPeriod[g.period]) byPeriod[g.period].push(g); });
  const scheduled = [];
  [1, 2, 3].forEach((p) => {
    const list = byPeriod[p];
    list.forEach((g, i) => { scheduled.push({ ...g, t: (p - 1) * LIVE_PERIOD_MS + ((i + 1) / (list.length + 1)) * LIVE_PERIOD_MS }); });
  });
  return scheduled.sort((a, b) => a.t - b.t);
}

export function clockDisplay(min) { return `${String(min).padStart(2, "0")}:00`; }

export function LiveSimPanel({ liveMatch, myTeamId, linesByTeam, onSelectPlayer, onNextPeriod, onFinish, onGoToLines, onGoToStrategy }) {
  const { home, away, chunk, homeScore, awayScore, accum } = liveMatch;
  const done = chunk > TOTAL_CHUNKS;
  const currentPeriod = Math.min(3, Math.ceil(chunk / CHUNKS_PER_PERIOD));
  const minuteInPeriod = ((chunk - 1) % CHUNKS_PER_PERIOD) * CHUNK_MIN;
  const clockMinute = done ? 20 : minuteInPeriod;
  const homeHits = Object.values(accum.home.hitsBy || {}).reduce((a, v) => a + v, 0);
  const awayHits = Object.values(accum.away.hitsBy || {}).reduce((a, v) => a + v, 0);
  return (
    <div style={{ background: "var(--navy2)", border: `1px solid ${done ? "var(--win)" : "#D9A404"}66`, borderRadius: 6, padding: 16, marginBottom: 22 }}>
      <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 10, color: "#D9A404" }}>SIMULATION EN DIRECT</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
        <div style={{ textAlign: "center" }}><TeamCrest team={home} size={34} /><div style={{ fontSize: 11, marginTop: 3 }}>{home.name}</div></div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: 28 }}>{homeScore} – {awayScore}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 2 }}>
            <span style={{ fontSize: 11, color: "var(--iceMuted)" }}>{done ? "FINAL" : `${currentPeriod}e période`}</span>
            <span style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: 15, background: "#000", color: "#0f0", padding: "1px 8px", borderRadius: 3, letterSpacing: 1 }}>{clockDisplay(clockMinute)}</span>
          </div>
        </div>
        <div style={{ textAlign: "center" }}><TeamCrest team={away} size={34} /><div style={{ fontSize: 11, marginTop: 3 }}>{away.name}</div></div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
            {Array.from({ length: TOTAL_CHUNKS }, (_, i) => i + 1).map((c) => (<div key={c} style={{ flex: 1, height: 5, borderRadius: 2, background: c < chunk ? "var(--win)" : c === chunk ? "#D9A404" : "#ffffff1a" }} />))}
          </div>
          <div style={{ fontSize: 11, color: "var(--iceMuted)" }}>Tirs {accum.home.shots || 0}–{accum.away.shots || 0} · MEC {homeHits}–{awayHits} · Pun. {accum.home.penalties || 0}–{accum.away.penalties || 0}</div>
        </div>
      </div>
      {!done ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
          <button onClick={onNextPeriod} style={btnStyle("var(--red)")}>Simuler 5 minutes</button>
          <button onClick={onGoToLines} style={btnStyle("var(--steel)")}>Ajuster les trios</button>
          <button onClick={onGoToStrategy} style={btnStyle("var(--steel)")}>Ajuster la stratégie</button>
          <span style={{ fontSize: 11, color: "var(--iceMuted)" }}>Tes changements s'appliquent aux 5 prochaines minutes.</span>
        </div>
      ) : (
        <button onClick={onFinish} style={{ ...btnStyle("var(--win)"), marginBottom: 16 }}>Confirmer le résultat final</button>
      )}
      <GoalSummary goalLog={accum.goalLog} home={home} away={away} />
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <StatLines title={`${home.name} (dom.)`} box={accum.home} team={home} lines={linesByTeam[home.id]} onSelectPlayer={onSelectPlayer} />
        <StatLines title={`${away.name} (visit.)`} box={accum.away} team={away} lines={linesByTeam[away.id]} onSelectPlayer={onSelectPlayer} />
      </div>
    </div>
  );
}
