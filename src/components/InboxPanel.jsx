import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { h2Style, btnStyle } from "../ui/theme";
import { PlayerLink } from "./common";
import { formatDay } from "../engine/calendar";

export const CATEGORY_COLOR = { scout: "#7A4E9E", finance: "var(--win)", transaction: "var(--red)", general: "var(--steel)" };

// Initiales d'un expéditeur pour l'avatar rond (façon photo de contact) : jusqu'à 2 mots
// significatifs (ignore "de"/"du"/"des"/"la"/"le" etc.), sinon la première lettre.
const SKIP_WORDS = new Set(["de", "du", "des", "la", "le", "les", "l'", "et", "—"]);
function initials(name) {
  const words = name.replace(/—.*/, "").split(/\s+/).filter((w) => w && !SKIP_WORDS.has(w.toLowerCase()));
  if (words.length === 0) return name[0]?.toUpperCase() || "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function Avatar({ name, color, size = 40 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.38, flexShrink: 0, fontFamily: "Oswald, sans-serif" }}>
      {initials(name)}
    </div>
  );
}

// Regroupe les messages par expéditeur (un fil par agent de joueur, par DG adverse, par
// dépisteur...) façon liste de contacts d'une appli de messagerie — voir App.jsx addMessage
// (chaque "from" distinct crée naturellement son propre fil) et markThreadRead.
function groupThreads(messages) {
  const byFrom = new Map();
  messages.forEach((m) => {
    if (!byFrom.has(m.from)) byFrom.set(m.from, []);
    byFrom.get(m.from).push(m);
  });
  return [...byFrom.entries()].map(([from, msgs]) => {
    const sorted = [...msgs].sort((a, b) => (a.day ?? 0) - (b.day ?? 0) || a.id.localeCompare(b.id));
    const last = msgs[0]; // messages déjà triées du plus récent au plus vieux (voir App.jsx addMessage)
    return { from, messages: sorted, last, unread: msgs.filter((m) => !m.read).length, category: last.category };
  }).sort((a, b) => (b.last.day ?? 0) - (a.last.day ?? 0) || b.last.id.localeCompare(a.last.id));
}

function ThreadList({ threads, onOpen }) {
  if (threads.length === 0) return <div style={{ color: "var(--iceMuted)", fontSize: 13, padding: "8px 0" }}>Boîte de réception vide pour l'instant.</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {threads.map((t) => (
        <div key={t.from} onClick={() => onOpen(t.from)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", borderRadius: 8, cursor: "pointer", background: t.unread > 0 ? "var(--navy2)" : "transparent" }}
             onMouseEnter={(e) => (e.currentTarget.style.background = "#ffffff0a")} onMouseLeave={(e) => (e.currentTarget.style.background = t.unread > 0 ? "var(--navy2)" : "transparent")}>
          <Avatar name={t.from} color={CATEGORY_COLOR[t.category] || "var(--steel)"} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontWeight: t.unread > 0 ? 700 : 500, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.from}</span>
              <span style={{ fontSize: 11, color: "var(--iceMuted)", flexShrink: 0 }}>{t.last.day != null ? formatDay(t.last.day) : ""}</span>
            </div>
            <div style={{ fontSize: 12.5, color: t.unread > 0 ? "var(--ice)" : "var(--iceMuted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.last.subject}</div>
          </div>
          {t.unread > 0 && <span style={{ background: "var(--red)", color: "#fff", borderRadius: 10, fontSize: 11, minWidth: 19, height: 19, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, padding: "0 5px", flexShrink: 0 }}>{t.unread}</span>}
        </div>
      ))}
    </div>
  );
}

// Bulle de message façon iMessage : toujours "reçue" (alignée à gauche, fond gris) puisque le
// joueur ne répond jamais par écrit — seulement ses actions dans le jeu (offres, échanges...).
function Bubble({ m, color, findPlayer, onOpenPlayer }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", marginBottom: 12 }}>
      <div style={{ maxWidth: "78%", background: "var(--navy2)", border: `1px solid ${color}55`, borderRadius: "4px 16px 16px 16px", padding: "10px 14px", fontSize: 13.5 }}>
        <div style={{ fontWeight: 700, marginBottom: 4, color }}>{m.subject}</div>
        <div style={{ whiteSpace: "pre-wrap", color: "var(--ice)" }}>{m.body}</div>
        {m.playerIds?.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {m.playerIds.map((id) => findPlayer(id)).filter(Boolean).map((p) => (
              <PlayerLink key={p.id} player={p} onSelect={() => onOpenPlayer(p.id)} style={{ color: "var(--ice)", background: "#ffffff12", borderRadius: 3, padding: "1px 7px" }} />
            ))}
          </div>
        )}
      </div>
      <div style={{ fontSize: 10.5, color: "var(--iceMuted)", marginTop: 3, marginLeft: 4 }}>{m.day != null ? formatDay(m.day) : ""}</div>
    </div>
  );
}

function ThreadView({ thread, onBack, findPlayer, onOpenPlayer }) {
  const color = CATEGORY_COLOR[thread.category] || "var(--steel)";
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid #ffffff1a" }}>
        <button onClick={onBack} title="Retour" style={{ background: "none", border: "none", color: "var(--iceMuted)", cursor: "pointer", display: "flex", alignItems: "center", padding: 4 }}><ChevronLeft size={20} /></button>
        <Avatar name={thread.from} color={color} size={34} />
        <span style={{ fontWeight: 600, fontSize: 15 }}>{thread.from}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {thread.messages.map((m) => <Bubble key={m.id} m={m} color={color} findPlayer={findPlayer} onOpenPlayer={onOpenPlayer} />)}
      </div>
    </div>
  );
}

export function InboxPanel({ messages, onMarkAllRead, onMarkThreadRead, findPlayer, onOpenPlayer }) {
  const [openFrom, setOpenFrom] = useState(null);
  const threads = groupThreads(messages);
  const unread = messages.filter((m) => !m.read).length;
  const openThread = threads.find((t) => t.from === openFrom);

  function openThreadByFrom(from) {
    onMarkThreadRead(from);
    setOpenFrom(from);
  }

  if (openThread) {
    // Reflète la lecture tout de suite (onMarkThreadRead agit sur l'état parent de façon
    // asynchrone) : on affiche le fil tel qu'ouvert plutôt que d'attendre le prochain rendu.
    const readThread = { ...openThread, messages: openThread.messages.map((m) => ({ ...m, read: true })) };
    return <ThreadView thread={readThread} onBack={() => setOpenFrom(null)} findPlayer={findPlayer} onOpenPlayer={onOpenPlayer} />;
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ ...h2Style, marginBottom: 0 }}>Messagerie {unread > 0 && <span style={{ fontSize: 13, color: "var(--red)", fontWeight: 400 }}>({unread} non lu{unread > 1 ? "s" : ""})</span>}</h2>
        {unread > 0 && <button onClick={onMarkAllRead} style={{ ...btnStyle("var(--steel)"), fontSize: 12, padding: "5px 10px" }}>Tout marquer comme lu</button>}
      </div>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: 4, marginBottom: 14 }}>Un fil par interlocuteur — agents de joueurs, dépisteurs, directeurs généraux adverses, la ligue... Clique une conversation pour la lire.</p>
      <ThreadList threads={threads} onOpen={openThreadByFrom} />
    </div>
  );
}
