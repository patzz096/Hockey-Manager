import { useState } from "react";
import { formatDay } from "../engine/calendar";
import { gameArticle } from "../engine/stats";
import { TeamCrest, PlayerLink, TeamLink } from "./common";
import { BoxscoreView } from "./match/BoxscoreView";

// Fil de nouvelles façon journal sportif (page Accueil) : un article par match joué récemment
// (manchette, résumé, fait saillant, étoile du match — voir engine/stats.js gameArticle), avec un
// bouton pour déplier le sommaire complet (score détaillé, stats de chaque joueur).
function Article({ article, onSelectPlayer, onSelectTeam, onContextMenu, teamsById, linesByTeam, schedule, seasonYear, expanded, onToggle }) {
  const { paragraph, star, winner, home, away, day, game } = article;
  return (
    <div style={{ background: "var(--navy2)", border: "1px solid #ffffff1a", borderLeft: `4px solid ${winner.color}`, borderRadius: 4, padding: "12px 14px", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 10, letterSpacing: 0.5, color: "var(--iceMuted)" }}>RÉSULTAT DE MATCH</span>
        <span style={{ fontSize: 11, color: "var(--iceMuted)" }}>{formatDay(day)}</span>
      </div>
      <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 15, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
        <TeamCrest team={home} size={18} /><TeamLink team={home} onSelect={onSelectTeam} />
        <span style={{ color: "var(--iceMuted)", fontWeight: 400 }}>{article.game.homeScore}–{article.game.awayScore}</span>
        <TeamLink team={away} onSelect={onSelectTeam} /><TeamCrest team={away} size={18} />
      </div>
      <div style={{ fontSize: 13, color: "var(--iceMuted)", marginBottom: star ? 8 : 0 }}>{paragraph}</div>
      {star && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--navy)", border: "1px solid var(--gold)33", borderRadius: 4, padding: "6px 10px", marginTop: 4 }}>
          <span style={{ fontSize: 10, color: "var(--gold)", fontWeight: 700, flexShrink: 0 }}>★ ÉTOILE DU MATCH</span>
          <PlayerLink player={star.player} team={star.team} onSelect={onSelectPlayer} style={{ fontWeight: 600 }} />
          <span style={{ fontSize: 12, color: "var(--iceMuted)" }}>— {star.line}</span>
        </div>
      )}
      {game.box && (
        <button onClick={onToggle} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 11.5, padding: "8px 0 0", cursor: "pointer", fontWeight: 600 }}>
          {expanded ? "▲ Masquer le sommaire" : "▼ Voir le sommaire du match"}
        </button>
      )}
      {expanded && game.box && <div style={{ marginTop: 8 }}><BoxscoreView game={game} teamsById={teamsById} linesByTeam={linesByTeam} onSelectPlayer={onSelectPlayer} onSelectTeam={onSelectTeam} onContextMenu={onContextMenu} schedule={schedule} seasonYear={seasonYear} /></div>}
    </div>
  );
}

export function NewsFeed({ games, schedule, seasonYear, teamsById, linesByTeam, onSelectPlayer, onSelectTeam, onContextMenu, limit = 6 }) {
  const [expandedId, setExpandedId] = useState(null);
  const articles = games.map((g) => gameArticle(g, seasonYear, teamsById)).filter(Boolean).slice(0, limit);
  if (articles.length === 0) return <div style={{ fontSize: 12, color: "var(--iceMuted)" }}>Aucun match joué pour l'instant.</div>;
  return <div>{articles.map((a) => (
    <Article key={a.id} article={a} onSelectPlayer={onSelectPlayer} onSelectTeam={onSelectTeam} onContextMenu={onContextMenu} teamsById={teamsById} linesByTeam={linesByTeam} schedule={schedule || games} seasonYear={seasonYear}
      expanded={expandedId === a.id} onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)} />
  ))}</div>;
}
