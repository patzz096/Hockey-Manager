import { useState, useMemo, useEffect, Fragment } from "react";
import { X } from "lucide-react";
import { btnStyle } from "../../ui/theme";
import { TeamCrest, PlayerLink } from "../common";
import { LIVE_PERIOD_MS, LIVE_TOTAL_MS, scheduleGoalTimeline } from "./LiveSimPanel";

export function LiveMatchViewer({ game, home, away, onClose, onSelectPlayer }) {
  const scheduled = useMemo(() => scheduleGoalTimeline(game.box.goalLog), [game]);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [revealedCount, setRevealedCount] = useState(0);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => { setElapsed((prev) => Math.min(LIVE_TOTAL_MS, prev + 150 * speed)); }, 150);
    return () => clearInterval(id);
  }, [playing, speed]);

  useEffect(() => {
    let count = 0;
    scheduled.forEach((g) => { if (g.t <= elapsed) count++; });
    if (count > revealedCount) { setFlash(scheduled[count - 1]); const t = setTimeout(() => setFlash(null), 1700); }
    if (count !== revealedCount) setRevealedCount(count);
    if (elapsed >= LIVE_TOTAL_MS) setPlaying(false);
  }, [elapsed]);

  const revealed = scheduled.slice(0, revealedCount);
  const liveHomeScore = revealed.filter((g) => g.side === "home").length;
  const liveAwayScore = revealed.filter((g) => g.side === "away").length;
  const finished = elapsed >= LIVE_TOTAL_MS;
  const dHome = finished ? game.homeScore : liveHomeScore;
  const dAway = finished ? game.awayScore : liveAwayScore;
  const period = Math.min(3, Math.floor(elapsed / LIVE_PERIOD_MS) + 1);
  const puckX = 50 + 40 * Math.sin(elapsed / 900);

  function skipToEnd() { setElapsed(LIVE_TOTAL_MS); setPlaying(false); }
  function restart() { setElapsed(0); setRevealedCount(0); setFlash(null); setPlaying(true); }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000000cc", zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--navy2)", border: "1px solid #ffffff33", borderRadius: 6, width: 520, maxWidth: "95vw", maxHeight: "92vh", overflow: "auto", padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 16 }}>Match en direct</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--iceMuted)", cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ textAlign: "center", flex: 1 }}><TeamCrest team={home} size={40} /><div style={{ fontSize: 12, marginTop: 4 }}>{home.name}</div></div>
          <div style={{ textAlign: "center", padding: "0 14px" }}>
            <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: 34 }}>{dHome} – {dAway}</div>
            <div style={{ fontSize: 11, color: "var(--iceMuted)" }}>{finished ? "FINAL" : `${period}e période`}</div>
          </div>
          <div style={{ textAlign: "center", flex: 1 }}><TeamCrest team={away} size={40} /><div style={{ fontSize: 12, marginTop: 4 }}>{away.name}</div></div>
        </div>
        <div style={{ position: "relative", height: 150, background: "linear-gradient(180deg,#cfe8f5,#a9d4e8)", borderRadius: 6, overflow: "hidden", marginBottom: 12, border: "2px solid #ffffff33" }}>
          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, background: "#c8102e88" }} />
          <div style={{ position: "absolute", left: "12%", top: 0, bottom: 0, width: 2, background: "#1e5f8c55" }} />
          <div style={{ position: "absolute", left: "88%", top: 0, bottom: 0, width: 2, background: "#1e5f8c55" }} />
          <div style={{ position: "absolute", left: "50%", top: "50%", width: 36, height: 36, marginLeft: -18, marginTop: -18, borderRadius: "50%", border: "2px solid #c8102e66" }} />
          <div style={{ position: "absolute", left: 6, top: "50%", marginTop: -10, width: 6, height: 20, background: home.color, borderRadius: 2 }} />
          <div style={{ position: "absolute", right: 6, top: "50%", marginTop: -10, width: 6, height: 20, background: away.color, borderRadius: 2 }} />
          <div style={{ position: "absolute", left: `${puckX}%`, top: "50%", width: 10, height: 10, marginLeft: -5, marginTop: -5, borderRadius: "50%", background: "#111", boxShadow: "0 0 6px #000", transition: "left 0.15s linear" }} />
          {flash && (
            <div style={{ position: "absolute", inset: 0, background: (flash.side === "home" ? home.color : away.color) + "33", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ background: "#00000099", padding: "8px 16px", borderRadius: 6, textAlign: "center" }}>
                <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: 20, color: "#fff" }}>BUT!</div>
                <div style={{ fontSize: 12, color: "#fff" }}>{(() => { const team = flash.side === "home" ? home : away; return team.roster.find((p) => p.id === flash.scorerId)?.name || "?"; })()}</div>
              </div>
            </div>
          )}
        </div>
        <div style={{ height: 5, background: "#ffffff22", borderRadius: 3, marginBottom: 14, position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(elapsed / LIVE_TOTAL_MS) * 100}%`, background: "var(--red)", borderRadius: 3 }} />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
          <button onClick={() => setPlaying((p) => !p)} style={btnStyle("var(--red)")}>{playing ? "Pause" : finished ? "Revoir" : "Reprendre"}</button>
          {finished && <button onClick={restart} style={btnStyle("var(--steel)")}>Recommencer</button>}
          {!finished && <button onClick={skipToEnd} style={btnStyle("var(--steel)")}>Passer à la fin</button>}
          <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
            {[0.5, 1, 2, 4].map((s) => (<button key={s} onClick={() => setSpeed(s)} style={{ ...btnStyle(speed === s ? "var(--win)" : "var(--steel)"), fontSize: 11, padding: "5px 8px" }}>{s}x</button>))}
          </div>
        </div>
        <div style={{ fontSize: 11, color: "var(--iceMuted)", marginBottom: 6 }}>SOMMAIRE EN DIRECT</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 160, overflow: "auto" }}>
          {revealed.length === 0 && <div style={{ fontSize: 12, color: "var(--iceMuted)" }}>Aucun but pour l'instant...</div>}
          {[...revealed].reverse().map((g, i) => {
            const team = g.side === "home" ? home : away;
            const scorer = team.roster.find((p) => p.id === g.scorerId);
            const assists = g.assistIds.map((id) => team.roster.find((p) => p.id === id)).filter(Boolean);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "3px 0" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: team.color }} />
                <span style={{ fontSize: 11, color: "var(--iceMuted)", width: 24 }}>P{g.period}</span>
                <span style={{ flex: 1 }}><PlayerLink player={scorer} team={team} onSelect={onSelectPlayer} /> {assists.length > 0 && <span style={{ color: "var(--iceMuted)" }}>({assists.map((a, j) => <Fragment key={a.id}>{j > 0 && ", "}<PlayerLink player={a} team={team} onSelect={onSelectPlayer} /></Fragment>)})</span>}</span>
                {g.type === "PP" && <span style={{ fontSize: 10, background: "#D9A40433", color: "#D9A404", padding: "1px 6px", borderRadius: 3 }}>AN</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
