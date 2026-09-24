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

const lastName = (team, id) => { const p = team.roster.find((x) => x.id === id); return p ? p.name.split(" ").slice(-1)[0] : "—"; };
function shiftLabel(team, lines, idx) {
  if (!idx) return "—";
  const fl = lines.forwards[idx.forwardIdx], dl = lines.defense[idx.defenseIdx];
  return `Trio ${idx.forwardIdx + 1} (${[fl.LW, fl.C, fl.RW].map((id) => lastName(team, id)).join("-")}) · Paire ${idx.defenseIdx + 1} (${[dl.LD, dl.RD].map((id) => lastName(team, id)).join("-")})`;
}

// Trios et paires cliquables : sert à choisir sa propre ligne (interactive) ou à afficher
// celle déjà envoyée par l'adversaire (lecture seule).
function LineChoice({ team, lines, forwardIdx, defenseIdx, onPickForward, onPickDefense, interactive }) {
  const chip = (active) => ({
    textAlign: "left", fontSize: 11, padding: "5px 8px", borderRadius: 6, cursor: interactive ? "pointer" : "default", fontFamily: "inherit", color: "var(--ice)",
    background: active ? "rgba(92,200,255,0.22)" : "var(--navy)", border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`, opacity: interactive || active ? 1 : 0.6,
  });
  return (
    <div>
      <div role={interactive ? "radiogroup" : undefined} aria-label="Trios" style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
        {lines.forwards.map((l, i) => (
          <button key={i} type="button" role={interactive ? "radio" : undefined} aria-checked={interactive ? i === forwardIdx : undefined} disabled={!interactive} onClick={() => onPickForward(i)} style={chip(i === forwardIdx)}>
            <div style={{ fontSize: 9, color: "var(--iceMuted)" }}>TRIO {i + 1}</div>
            {[l.LW, l.C, l.RW].map((id) => lastName(team, id)).join(" · ")}
          </button>
        ))}
      </div>
      <div role={interactive ? "radiogroup" : undefined} aria-label="Paires" style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {lines.defense.map((l, i) => (
          <button key={i} type="button" role={interactive ? "radio" : undefined} aria-checked={interactive ? i === defenseIdx : undefined} disabled={!interactive} onClick={() => onPickDefense(i)} style={chip(i === defenseIdx)}>
            <div style={{ fontSize: 9, color: "var(--iceMuted)" }}>PAIRE {i + 1}</div>
            {[l.LD, l.RD].map((id) => lastName(team, id)).join(" · ")}
          </button>
        ))}
      </div>
    </div>
  );
}

// Sélecteur de trio/paire pour la prochaine mise au jeu, avec l'avantage du dernier changement :
// les visiteurs envoient toujours leur ligne en premier (visible), l'équipe locale réplique en
// dernier. Si tu es à domicile, tu vois la ligne adverse avant de choisir la tienne ; à
// l'étranger, la réplique des locaux reste cachée jusqu'au prochain arrêt.
function ShiftPicker({ liveMatch, shiftPicker, onPickForward, onPickDefense, onSend, onCancel }) {
  const { home, away, linesHome, linesAway } = liveMatch;
  const { myIsHome, oppShift, forwardIdx, defenseIdx } = shiftPicker;
  const mine = { forwardIdx, defenseIdx };
  const awayInteractive = !myIsHome;
  const homeInteractive = myIsHome;
  const awayIdx = awayInteractive ? mine : oppShift;
  const side = (team, lines, interactive, idx, badge) => (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <TeamCrest team={team} size={20} /><strong style={{ fontSize: 12 }}>{team.name}</strong>
        {badge && <span style={{ fontSize: 10, color: interactive ? "var(--accent)" : "var(--gold)" }}>{badge}</span>}
      </div>
      {interactive || idx
        ? <LineChoice team={team} lines={lines} forwardIdx={idx.forwardIdx} defenseIdx={idx.defenseIdx} onPickForward={onPickForward} onPickDefense={onPickDefense} interactive={interactive} />
        : <div style={{ fontSize: 12, color: "var(--iceMuted)", padding: "10px 0" }}>Réplique des locaux — connue après l'envoi de ta ligne.</div>}
    </div>
  );
  return (
    <div style={{ background: "var(--navy)", border: "1px solid var(--accent)", borderRadius: 8, padding: 12, marginBottom: 16 }}>
      <div style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 10 }}>
        {myIsHome
          ? "Dernier changement : les visiteurs ont déjà envoyé leur trio et leur paire. Choisis ta réplique."
          : "Les visiteurs changent en premier : envoie ton trio et ta paire. L'équipe locale répliquera après — tu verras son choix au prochain arrêt."}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14, marginBottom: 12 }}>
        {side(away, linesAway, awayInteractive, awayIdx, "Visiteurs · envoient en premier")}
        {side(home, linesHome, homeInteractive, homeInteractive ? mine : null, "Locaux · dernier changement")}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onSend} style={btnStyle("var(--win)")}>Envoyer sur la glace</button>
        <button onClick={onCancel} style={btnStyle("var(--steel)")}>Annuler (déploiement automatique)</button>
      </div>
    </div>
  );
}

export function LiveSimPanel({ liveMatch, myTeamId, linesByTeam, onSelectPlayer, onNextPeriod, onEndOfPeriod, onFinish, onGoToLines, onGoToStrategy, shiftPicker, onOpenShiftPicker, onPickForward, onPickDefense, onSendShift, onCancelShift }) {
  const { home, away, minute, homeScore, awayScore, accum, lastStop, lastShift } = liveMatch;
  const done = minute >= 60;
  const currentPeriod = livePeriod(minute);
  const intermission = !done && minute > 0 && minute % 20 === 0;
  const homeHits = Object.values(accum.home.hitsBy || {}).reduce((a, v) => a + v, 0);
  const awayHits = Object.values(accum.away.hitsBy || {}).reduce((a, v) => a + v, 0);
  return (
    <div style={{ background: "var(--navy2)", border: `1px solid ${done ? "var(--win)" : "var(--gold)"}66`, borderRadius: 6, padding: 16, marginBottom: 22 }}>
      <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 10, color: "var(--gold)" }}>SIMULATION EN DIRECT{liveMatch.game.playoff ? " · SÉRIES ÉLIMINATOIRES" : ""}</div>
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
                <div style={{ width: `${Math.max(0, Math.min(1, (minute - p * 20) / 20)) * 100}%`, height: "100%", background: minute >= (p + 1) * 20 ? "var(--win)" : "var(--gold)" }} />
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "var(--iceMuted)" }}>Tirs {accum.home.shots || 0}–{accum.away.shots || 0} · MEC {homeHits}–{awayHits} · Pun. {accum.home.penalties || 0}–{accum.away.penalties || 0}</div>
          {lastStop && <div style={{ fontSize: 11, color: "var(--ice)", marginTop: 4 }}>Arrêt de jeu — {lastStop}</div>}
          {lastShift && (
            <div style={{ fontSize: 11, color: "var(--iceMuted)", marginTop: 2 }}>
              Mise en jeu — Dom. : {shiftLabel(home, liveMatch.linesHome, lastShift.home)} · Vis. : {shiftLabel(away, liveMatch.linesAway, lastShift.away)}
            </div>
          )}
        </div>
      </div>
      {!done && shiftPicker && <ShiftPicker liveMatch={liveMatch} shiftPicker={shiftPicker} onPickForward={onPickForward} onPickDefense={onPickDefense} onSend={onSendShift} onCancel={onCancelShift} />}
      {!done ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
          {!shiftPicker && <>
            <button onClick={onNextPeriod} style={btnStyle("var(--red)")}>{intermission || minute === 0 ? "Mise au jeu (auto)" : "Jouer jusqu'au prochain arrêt (auto)"}</button>
            <button onClick={onOpenShiftPicker} style={{ ...btnStyle("var(--accent)"), color: "#0A1627" }}>Choisir le trio et la paire</button>
            <button onClick={onEndOfPeriod} style={btnStyle("var(--steel)")}>Jusqu'à la fin de la période</button>
            <button onClick={onGoToLines} style={btnStyle("var(--steel)")}>Ajuster les trios</button>
            <button onClick={onGoToStrategy} style={btnStyle("var(--steel)")}>Ajuster la stratégie</button>
            <span style={{ fontSize: 11, color: "var(--iceMuted)" }}>Le jeu s'arrête au prochain coup de sifflet (moment variable). « Auto » déploie tes trios selon leur temps de glace habituel ; « Choisir » t'en fait envoyer un précis pour cette mise au jeu.</span>
          </>}
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
