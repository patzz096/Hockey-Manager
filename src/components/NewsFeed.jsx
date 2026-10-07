import { formatDay } from "../engine/calendar";
import { gameArticle } from "../engine/stats";
import { TeamCrest, PlayerLink } from "./common";

// Fil de nouvelles façon journal sportif (page Accueil) : un article par match joué récemment
// (manchette, résumé, fait saillant, étoile du match — voir engine/stats.js gameArticle).
function Article({ article, onSelectPlayer }) {
  const { paragraph, star, winner, home, away, day } = article;
  return (
    <div style={{ background: "var(--navy2)", border: "1px solid #ffffff1a", borderLeft: `4px solid ${winner.color}`, borderRadius: 4, padding: "12px 14px", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 10, letterSpacing: 0.5, color: "var(--iceMuted)" }}>RÉSULTAT DE MATCH</span>
        <span style={{ fontSize: 11, color: "var(--iceMuted)" }}>{formatDay(day)}</span>
      </div>
      <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 15, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
        <TeamCrest team={home} size={18} /><span>{home.name}</span>
        <span style={{ color: "var(--iceMuted)", fontWeight: 400 }}>{article.game.homeScore}–{article.game.awayScore}</span>
        <span>{away.name}</span><TeamCrest team={away} size={18} />
      </div>
      <div style={{ fontSize: 13, color: "var(--iceMuted)", marginBottom: star ? 8 : 0 }}>{paragraph}</div>
      {star && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--navy)", border: "1px solid var(--gold)33", borderRadius: 4, padding: "6px 10px", marginTop: 4 }}>
          <span style={{ fontSize: 10, color: "var(--gold)", fontWeight: 700, flexShrink: 0 }}>★ ÉTOILE DU MATCH</span>
          <PlayerLink player={star.player} team={star.team} onSelect={onSelectPlayer} style={{ fontWeight: 600 }} />
          <span style={{ fontSize: 12, color: "var(--iceMuted)" }}>— {star.line}</span>
        </div>
      )}
    </div>
  );
}

export function NewsFeed({ games, seasonYear, teamsById, onSelectPlayer, limit = 6 }) {
  const articles = games.map((g) => gameArticle(g, seasonYear, teamsById)).filter(Boolean).slice(0, limit);
  if (articles.length === 0) return <div style={{ fontSize: 12, color: "var(--iceMuted)" }}>Aucun match joué pour l'instant.</div>;
  return <div>{articles.map((a) => <Article key={a.id} article={a} onSelectPlayer={onSelectPlayer} />)}</div>;
}
