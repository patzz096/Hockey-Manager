import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ROUND_NAMES } from "../engine/playoffs";
import { h2Style } from "../ui/theme";
import { TeamCrest } from "./common";
import { BoxscoreView } from "./match/BoxscoreView";

function SeriesCard({ s, teamsById, myTeamId, rankOf, open, onToggle }) {
  const team = (id) => teamsById[id];
  const row = (id, wins) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0", opacity: s.winner && s.winner !== id ? 0.45 : 1 }}>
      <TeamCrest team={team(id)} size={20} />
      <span style={{ flex: 1, fontSize: 13, fontWeight: id === myTeamId ? 700 : 400, color: id === myTeamId ? team(id).color : "var(--ice)" }}>{team(id).name} <span style={{ fontSize: 10, color: "var(--iceMuted)" }}>({rankOf[id] + 1}e)</span></span>
      <span style={{ fontFamily: "Oswald, sans-serif", fontSize: 16, fontWeight: 700 }}>{wins}</span>
    </div>
  );
  const involved = s.high === myTeamId || s.low === myTeamId;
  return (
    <div onClick={onToggle} style={{ background: "var(--navy)", border: `1px solid ${involved ? "rgba(255,194,71,0.55)" : "#ffffff1a"}`, borderRadius: 4, padding: "8px 10px", cursor: "pointer", minWidth: 220 }}>
      {row(s.high, s.winsHigh)}
      {row(s.low, s.winsLow)}
      <div style={{ fontSize: 11, color: s.winner ? "var(--win)" : "var(--iceMuted)", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
        <span>{s.winner ? `${team(s.winner).name} l'emporte ${Math.max(s.winsHigh, s.winsLow)}-${Math.min(s.winsHigh, s.winsLow)}` : s.games.length ? `Série ${s.winsHigh === s.winsLow ? "égale" : "menée"} ${Math.max(s.winsHigh, s.winsLow)}-${Math.min(s.winsHigh, s.winsLow)}` : "À venir"}</span>
        {s.games.length > 0 && <span style={{ display: "flex", alignItems: "center", gap: 2, color: "var(--accent)" }}> · {open ? "masquer" : "voir"} les matchs {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}</span>}
      </div>
    </div>
  );
}

export function PlayoffsPanel({ playoffs, teamsById, myTeamId, linesByTeam, onSelectPlayer }) {
  const [openSeries, setOpenSeries] = useState(null);
  const [openGame, setOpenGame] = useState(null);
  // Ouvre automatiquement ta série en cours (façon "on ne voit pas les sommaires" — le clic pour
  // déplier une série n'était pas assez visible) ; se réajuste si ta série change (élimination,
  // tour suivant).
  const myActiveSeriesId = playoffs?.rounds.flat().find((s) => !s.winner && (s.high === myTeamId || s.low === myTeamId))?.id
    ?? playoffs?.rounds.flat().filter((s) => s.high === myTeamId || s.low === myTeamId).slice(-1)[0]?.id
    ?? null;
  useEffect(() => { if (myActiveSeriesId) setOpenSeries(myActiveSeriesId); }, [myActiveSeriesId]);
  if (!playoffs) return <div><h2 style={h2Style}>Séries éliminatoires</h2><p style={{ fontSize: 13, color: "var(--iceMuted)" }}>Les séries commencent à la fin de la saison régulière : 16 équipes (3 premières de chaque division + 2 équipes repêchées par association), séries 4 de 7.</p></div>;
  const all = playoffs.rounds.flat();
  const selected = all.find((s) => s.id === openSeries);
  return (
    <div>
      <h2 style={h2Style}>Séries éliminatoires {playoffs.year + 1}</h2>
      {playoffs.champion && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--navy2)", border: "1px solid #D9A404", borderRadius: 6, padding: 14, marginBottom: 16 }}>
          <TeamCrest team={teamsById[playoffs.champion]} size={44} />
          <div><div style={{ fontSize: 11, color: "var(--gold)", letterSpacing: 1 }}>CHAMPIONS DE LA COUPE STANLEY</div><div style={{ fontFamily: "Oswald, sans-serif", fontSize: 22 }}>{teamsById[playoffs.champion].name}</div></div>
        </div>
      )}
      <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
        {ROUND_NAMES.map((name, r) => (
          <div key={name} style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "space-around" }}>
            <div style={{ fontSize: 11, color: "var(--iceMuted)", letterSpacing: 0.5 }}>{name.toUpperCase()}</div>
            {(playoffs.rounds[r] || []).map((s) => (
              <SeriesCard key={s.id} s={s} teamsById={teamsById} myTeamId={myTeamId} rankOf={playoffs.rankOf} open={openSeries === s.id} onToggle={() => setOpenSeries(openSeries === s.id ? null : s.id)} />
            ))}
            {!playoffs.rounds[r] && <div style={{ fontSize: 12, color: "var(--iceMuted)", minWidth: 220 }}>À déterminer</div>}
          </div>
        ))}
      </div>
      {selected && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 16, marginBottom: 6 }}>{teamsById[selected.high].name} vs {teamsById[selected.low].name}</div>
          {selected.games.map((g, i) => (
            <div key={g.id} style={{ marginBottom: 4 }}>
              <div onClick={() => setOpenGame(openGame === g.id ? null : g.id)} style={{ display: "flex", alignItems: "center", gap: 10, background: openGame === g.id ? "var(--navy2)" : "#ffffff08", padding: "7px 12px", borderRadius: 3, fontSize: 13, cursor: "pointer", border: "1px solid transparent" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")} onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}>
                <span style={{ color: "var(--iceMuted)", width: 60 }}>Match {i + 1}</span>
                <span style={{ flex: 1 }}>{teamsById[g.home].name}</span>
                <span style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600 }}>{g.homeScore} – {g.awayScore}{g.decidedIn === "OT" ? " (P)" : ""}</span>
                <span style={{ flex: 1, textAlign: "right" }}>{teamsById[g.away].name}</span>
                {openGame === g.id ? <ChevronUp size={14} color="var(--iceMuted)" /> : <ChevronDown size={14} color="var(--iceMuted)" />}
              </div>
              {openGame === g.id && <BoxscoreView game={g} teamsById={teamsById} linesByTeam={linesByTeam} onSelectPlayer={onSelectPlayer} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
