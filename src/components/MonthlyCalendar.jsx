import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { dayToDate, monthLabel, roundDay, weekBucket } from "../engine/calendar";
import { TRAINING_FOCUSES, MAX_SESSIONS_PER_WEEK } from "../engine/training";
import { btnStyle } from "../ui/theme";
import { TeamCrest } from "./common";

const WEEKDAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

// Vue mensuelle du calendrier pour ton équipe : matchs cédulés et séances d'entraînement
// planifiées (max MAX_SESSIONS_PER_WEEK par semaine, voir engine/training.js). Cliquer un jour
// libre à venir ouvre un petit sélecteur de programme ; cliquer une séance déjà planifiée
// l'annule. Les matchs joués ouvrent le visionneur. `monthDay` doit toujours être le 1er du mois
// affiché (voir engine/calendar.js `monthStartDay`/`addMonths`).
export function MonthlyCalendar({ monthDay, currentDay, myTeam, teamsById, schedule, seasonYear, trainingSchedule, delegation, onPrevMonth, onNextMonth, onSchedule, onCancelTraining, onWatchGame }) {
  const [pickerDay, setPickerDay] = useState(null);
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
          const focusKey = (trainingSchedule || {})[day];
          const focus = focusKey ? TRAINING_FOCUSES[focusKey] : null;
          const isPast = day < currentDay;
          const isToday = day === currentDay;
          const bucket = weekBucket(day);
          const weekCount = Object.keys(trainingSchedule || {}).filter((d) => weekBucket(Number(d)) === bucket).length;
          const canSchedule = manual && !isPast && !game && !focusKey && weekCount < MAX_SESSIONS_PER_WEEK;
          const home = game && game.home === myTeam.id;
          const opp = game ? teamsById[home ? game.away : game.home] : null;
          return (
            <div key={i} style={{ minHeight: 74, background: isToday ? "var(--navy2)" : "#ffffff08", border: `1px solid ${isToday ? "var(--accent)" : "#ffffff14"}`, borderRadius: 4, padding: 5, position: "relative", opacity: isPast && !game ? 0.6 : 1 }}>
              <div style={{ fontSize: 10, color: "var(--iceMuted)", marginBottom: 3 }}>{dayToDate(day).getUTCDate()}</div>
              {game && (
                <div onClick={() => game.played && onWatchGame(game)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, cursor: game.played ? "pointer" : "default", marginBottom: 3 }}>
                  <TeamCrest team={opp} size={14} />
                  <span>{home ? "vs" : "@"} {opp.name.split(" ").slice(-1)[0]}</span>
                </div>
              )}
              {game?.played && (
                <div style={{ fontSize: 10, fontWeight: 700, color: (home ? game.homeScore > game.awayScore : game.awayScore > game.homeScore) ? "var(--win)" : "var(--loss)" }}>
                  {game.homeScore}–{game.awayScore}
                </div>
              )}
              {focus && (
                <div onClick={() => manual && !isPast && onCancelTraining(day)} title={focus.desc} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9, color: "var(--gold)", cursor: manual && !isPast ? "pointer" : "default", marginTop: 2 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)", flexShrink: 0 }} />
                  {focus.label}{manual && !isPast && <X size={9} />}
                </div>
              )}
              {canSchedule && (
                <button onClick={() => setPickerDay(pickerDay === day ? null : day)} style={{ fontSize: 9, color: "var(--accent)", background: "none", border: "1px dashed var(--accent)", borderRadius: 3, padding: "1px 4px", cursor: "pointer", marginTop: 2 }}>+ Séance</button>
              )}
              {pickerDay === day && (
                <div style={{ position: "absolute", zIndex: 5, top: "100%", left: 0, background: "var(--navy)", border: "1px solid var(--accent)", borderRadius: 6, padding: 8, width: 180, boxShadow: "0 6px 18px #00000066" }}>
                  {Object.entries(TRAINING_FOCUSES).map(([key, f]) => (
                    <button key={key} onClick={() => { onSchedule(day, key); setPickerDay(null); }} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: "var(--ice)", fontSize: 11, padding: "5px 4px", cursor: "pointer", borderRadius: 3 }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#ffffff14")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      {f.label}
                    </button>
                  ))}
                  <button onClick={() => setPickerDay(null)} style={{ display: "block", width: "100%", textAlign: "center", background: "none", border: "none", color: "var(--iceMuted)", fontSize: 10, padding: "4px 0 0", cursor: "pointer" }}>Annuler</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 11, color: "var(--iceMuted)", marginTop: 10 }}>
        {manual
          ? `Planifie jusqu'à ${MAX_SESSIONS_PER_WEEK} séances d'entraînement par semaine (jamais un jour de match) : elles remplacent le programme par défaut de l'onglet Personnel pour cette semaine-là.`
          : "Entraînement délégué — les séances affichées ont été choisies automatiquement selon la forme de l'effectif et la cohésion."}
      </p>
    </div>
  );
}
