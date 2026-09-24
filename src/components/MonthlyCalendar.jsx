import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { dayToDate, monthLabel, roundDay } from "../engine/calendar";
import { TRAINING_FOCUSES } from "../engine/training";
import { btnStyle } from "../ui/theme";
import { TeamCrest } from "./common";

const WEEKDAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const SLOT_LABEL = ["Matin", "Après-midi"];

// Vue mensuelle du calendrier pour ton équipe : matchs cédulés et séances d'entraînement
// planifiées, jusqu'à 2 par jour (matin/après-midi, voir engine/training.js SLOTS_PER_DAY). Un
// match occupe la case de l'après-midi (un match compte pour une séance) : un jour de match ne
// peut donc recevoir qu'une séance, le matin. `trainingSchedule[day]` est un tableau
// [séance du matin, séance de l'après-midi], chaque case pouvant être une clé de TRAINING_FOCUSES
// ou null. Cliquer une case libre à venir ouvre un petit sélecteur de programme ; cliquer une
// séance déjà planifiée l'annule. Les matchs joués ouvrent le visionneur. `monthDay` doit
// toujours être le 1er du mois affiché (voir engine/calendar.js `monthStartDay`/`addMonths`).
export function MonthlyCalendar({ monthDay, currentDay, myTeam, teamsById, schedule, seasonYear, trainingSchedule, delegation, onPrevMonth, onNextMonth, onSchedule, onCancelTraining, onWatchGame }) {
  const [picker, setPicker] = useState(null); // { day, slot }
  const monthStart = dayToDate(monthDay);
  const year = monthStart.getUTCFullYear(), month = monthStart.getUTCMonth();
  const firstWeekday = monthStart.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const gameByDay = {};
  schedule.forEach((g) => {
    if (g.home !== myTeam.id && g.away !== myTeam.id) return;
    gameByDay[roundDay(seasonYear, g.round)] = g;
  });
  const manual = delegation !== "delegated";

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(monthDay + (d - 1));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <button onClick={onPrevMonth} style={{ ...btnStyle("var(--steel)"), padding: "4px 8px" }}><ChevronLeft size={16} /></button>
        <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 15, textTransform: "capitalize" }}>{monthLabel(monthDay)}</div>
        <button onClick={onNextMonth} style={{ ...btnStyle("var(--steel)"), padding: "4px 8px" }}><ChevronRight size={16} /></button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
        {WEEKDAYS.map((w) => (<div key={w} style={{ fontSize: 10, color: "var(--iceMuted)", textAlign: "center" }}>{w}</div>))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map((day, i) => {
          if (day == null) return <div key={i} />;
          const game = gameByDay[day];
          const daySlots = (trainingSchedule || {})[day] || [null, null];
          const isPast = day < currentDay;
          const home = game && game.home === myTeam.id;
          const opp = game ? teamsById[home ? game.away : game.home] : null;

          const slotContent = (slot) => {
            if (slot === 1 && game) {
              return (
                <div onClick={() => game.played && onWatchGame(game)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, cursor: game.played ? "pointer" : "default" }}>
                  <TeamCrest team={opp} size={14} />
                  <span>{home ? "vs" : "@"} {opp.name.split(" ").slice(-1)[0]}</span>
                  {game.played && (
                    <span style={{ fontWeight: 700, color: (home ? game.homeScore > game.awayScore : game.awayScore > game.homeScore) ? "var(--win)" : "var(--loss)" }}>
                      {game.homeScore}–{game.awayScore}
                    </span>
                  )}
                </div>
              );
            }
            const focusKey = daySlots[slot];
            const focus = focusKey ? TRAINING_FOCUSES[focusKey] : null;
            if (focus) {
              return (
                <div onClick={() => manual && !isPast && onCancelTraining(day, slot)} title={focus.desc} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9, color: "var(--gold)", cursor: manual && !isPast ? "pointer" : "default" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)", flexShrink: 0 }} />
                  {focus.label}{manual && !isPast && <X size={9} />}
                </div>
              );
            }
            const canSchedule = manual && !isPast;
            if (!canSchedule) return null;
            return (
              <button onClick={() => setPicker(picker && picker.day === day && picker.slot === slot ? null : { day, slot })} style={{ fontSize: 9, color: "var(--accent)", background: "none", border: "1px dashed var(--accent)", borderRadius: 3, padding: "1px 4px", cursor: "pointer" }}>
                + {SLOT_LABEL[slot]}
              </button>
            );
          };

          return (
            <div key={i} style={{ minHeight: 82, background: day === currentDay ? "var(--navy2)" : "#ffffff08", border: `1px solid ${day === currentDay ? "var(--accent)" : "#ffffff14"}`, borderRadius: 4, padding: 5, position: "relative", opacity: isPast && !game ? 0.6 : 1 }}>
              <div style={{ fontSize: 10, color: "var(--iceMuted)", marginBottom: 3 }}>{dayToDate(day).getUTCDate()}</div>
              <div style={{ marginBottom: 3 }}>{slotContent(0)}</div>
              <div>{slotContent(1)}</div>
              {picker && picker.day === day && (
                <div style={{ position: "absolute", zIndex: 5, top: "100%", left: 0, background: "var(--navy)", border: "1px solid var(--accent)", borderRadius: 6, padding: 8, width: 180, boxShadow: "0 6px 18px #00000066" }}>
                  <div style={{ fontSize: 10, color: "var(--iceMuted)", marginBottom: 4 }}>{SLOT_LABEL[picker.slot]}</div>
                  {Object.entries(TRAINING_FOCUSES).map(([key, f]) => (
                    <button key={key} onClick={() => { onSchedule(day, picker.slot, key); setPicker(null); }} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: "var(--ice)", fontSize: 11, padding: "5px 4px", cursor: "pointer", borderRadius: 3 }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#ffffff14")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      {f.label}
                    </button>
                  ))}
                  <button onClick={() => setPicker(null)} style={{ display: "block", width: "100%", textAlign: "center", background: "none", border: "none", color: "var(--iceMuted)", fontSize: 10, padding: "4px 0 0", cursor: "pointer" }}>Annuler</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 11, color: "var(--iceMuted)", marginTop: 10 }}>
        {manual
          ? "Planifie jusqu'à 2 séances par jour (matin et après-midi) ; un jour de match ne permet qu'une seule séance, le matin, puisque le match compte pour l'autre case. Les séances planifiées remplacent le programme par défaut de l'onglet Personnel cette semaine-là."
          : "Entraînement délégué — les séances affichées ont été choisies automatiquement selon la forme de l'effectif et la cohésion."}
      </p>
    </div>
  );
}
