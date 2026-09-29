import { attr20, starsFor, teamOvrBenchmark } from "../engine/attributes";
import { BASE_CONDITION, TRAINING_FOCUSES, conditionColor, conditionLabel, cohesionColor, cohesionLabel } from "../engine/training";
import { h2Style, btnStyle, attr20Color, selectStyle } from "../ui/theme";
import { StarRating } from "./common";
import { MonthlyCalendar } from "./MonthlyCalendar";

// Entraînement (forme physique, cohésion tactique, délégation) — séparé de Personnel : c'est un
// système à part entière (engine/training.js), même si l'entraîneur physique lui-même se gère
// toujours dans Personnel (embauche/congédiement, comme le reste du personnel). Le calendrier de
// planification des séances (matin/après-midi) vit ici plutôt que dans l'onglet Calendrier,
// puisqu'il s'agit d'entraînement et non de matchs.
export function TrainingCenter({ business, myTeam, cohesion, onSetDelegation, onSetTrainingFocus, calendarMonth, currentDay, teamsById, schedule, seasonYear, trainingPreview, onPrevMonth, onNextMonth, onScheduleTraining, onCancelTraining }) {
  const avgCondition = myTeam.roster.length ? myTeam.roster.reduce((a, p) => a + (p.condition ?? BASE_CONDITION), 0) / myTeam.roster.length : BASE_CONDITION;
  const coach = business.staff.fitnessCoach;
  const benchmark = teamOvrBenchmark(myTeam);
  const delegated = business.delegation.training === "delegated";
  return (
    <div>
      <h2 style={h2Style}>Délégation</h2>
      <div style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: 12, maxWidth: 420, marginBottom: 8 }}>
        <div style={{ fontSize: 12, marginBottom: 8 }}>Entraînement {coach ? `(${coach.name})` : "(poste vacant — embauche dans Personnel)"}</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => onSetDelegation("training", "manual")} style={{ ...btnStyle(!delegated ? "var(--red)" : "var(--steel)"), fontSize: 12, flex: 1, justifyContent: "center" }}>Contrôle</button>
          <button onClick={() => onSetDelegation("training", "delegated")} style={{ ...btnStyle(delegated ? "var(--win)" : "var(--steel)"), fontSize: 12, flex: 1, justifyContent: "center" }}>Délégué</button>
        </div>
      </div>
      <p style={{ fontSize: 11, color: "var(--iceMuted)", marginBottom: 26 }}>Délégué : l'accent (physique, tactique, repos) est choisi automatiquement, jour par jour, selon la forme de l'effectif, la cohésion et le calendrier à venir — visible dans l'onglet Calendrier.</p>

      <h2 style={h2Style}>État de l'équipe</h2>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
        <div style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: 12, flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, color: "var(--iceMuted)", marginBottom: 4 }}>FORME PHYSIQUE MOYENNE</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: 22, color: conditionColor(avgCondition) }}>{Math.round(avgCondition)}</span>
            <span style={{ fontSize: 12, color: conditionColor(avgCondition) }}>{conditionLabel(avgCondition)}</span>
          </div>
        </div>
        <div style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: 12, flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, color: "var(--iceMuted)", marginBottom: 4 }}>COHÉSION TACTIQUE</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: 22, color: cohesionColor(cohesion) }}>{Math.round(cohesion)}</span>
            <span style={{ fontSize: 12, color: cohesionColor(cohesion) }}>{cohesionLabel(cohesion)}</span>
          </div>
        </div>
        <div style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: 12, flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, color: "var(--iceMuted)", marginBottom: 4 }}>ENTRAÎNEUR PHYSIQUE</div>
          {coach ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <StarRating value={starsFor(coach.rating, benchmark)} size={12} />
              <span style={{ background: attr20Color(attr20(coach.rating)), color: "#0B1B2E", fontWeight: 700, fontSize: 11, borderRadius: 3, padding: "1px 7px" }}>{attr20(coach.rating)}</span>
            </div>
          ) : <div style={{ fontSize: 12, color: "var(--iceMuted)" }}>Poste vacant</div>}
        </div>
      </div>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 10 }}>La cohésion baisse quand tu changes ta stratégie et remonte à l'entraînement — un système bien rodé rend pleinement les bonus/malus de ta stratégie. Un entraîneur physique en poste accélère la récupération de la forme et contribue au développement des joueurs.</p>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 10 }}>Planifie jusqu'à 2 séances précises par jour (matin et après-midi) ci-dessous — un jour de match n'en permet qu'une, le matin. Le programme par défaut ci-dessous ne s'applique que les semaines où tu n'as rien planifié.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 10, marginBottom: 10 }}>
        {Object.entries(TRAINING_FOCUSES).map(([key, f]) => {
          const active = business.trainingFocus === key;
          return (
          <button key={key} disabled={delegated} onClick={() => onSetTrainingFocus(key)} style={{ ...selectStyle(active, { radius: 6, padding: 10 }), flexDirection: "column", alignItems: "flex-start", gap: 4, opacity: delegated ? 0.55 : 1, cursor: delegated ? "default" : "pointer" }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{f.label}</span>
            <span style={{ fontSize: 10, color: "var(--iceMuted)" }}>{f.desc}</span>
          </button>
          );
        })}
      </div>
      {delegated && <p style={{ fontSize: 11, color: "var(--iceMuted)" }}>Entraînement délégué — l'accent est choisi automatiquement chaque jour.</p>}

      <h2 style={h2Style}>Planification</h2>
      <MonthlyCalendar
        monthDay={calendarMonth} currentDay={currentDay} myTeam={myTeam} teamsById={teamsById} schedule={schedule} seasonYear={seasonYear}
        trainingSchedule={business.trainingSchedule} delegation={business.delegation.training} trainingPreview={trainingPreview}
        onPrevMonth={onPrevMonth} onNextMonth={onNextMonth} onSchedule={onScheduleTraining} onCancelTraining={onCancelTraining}
      />
    </div>
  );
}
