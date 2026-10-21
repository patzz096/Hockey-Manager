import { useState } from "react";
import { ChevronLeft, HeartPulse, Briefcase, Landmark, Shield, Building2, Binoculars, UserCog, DollarSign, Radio, TrendingUp } from "lucide-react";
import { h2Style, btnStyle } from "../ui/theme";
import { PlayerLink, PlayerFace } from "./common";
import { formatDay } from "../engine/calendar";

export const CATEGORY_COLOR = { scout: "#7A4E9E", finance: "var(--win)", transaction: "var(--red)", general: "var(--steel)" };

// Icône générique par poste/département pour les expéditeurs qui ne sont pas des joueurs (donc
// sans photo possible) — façon logo de service, plus parlant que de simples initiales dans une
// messagerie où presque tout le monde est fictif. D'abord par motif de nom reconnu (un thérapeute
// a sa propre icône même si sa catégorie est « general »), sinon une icône par défaut selon la
// catégorie du message (voir App.jsx addMessage, CATEGORY_COLOR ci-dessus).
const NAME_ICONS = [
  [/^Thérapeute/, HeartPulse],
  [/^Agent de /, Briefcase],
  [/^Directeur général/, Landmark],
  [/^Ligue$/, Shield],
  [/^Directeur du club-école/, Building2],
  [/^Service de dépistage/, Binoculars],
  [/^Ressources humaines/, UserCog],
  [/^Directeur des finances/, DollarSign],
  [/^Directeur des opérations hockey/, Briefcase],
  [/^Directeur des communications/, Radio],
  [/^Département de développement/, TrendingUp],
];
const CATEGORY_ICON = { scout: Binoculars, finance: DollarSign, transaction: Briefcase, general: Building2 };
function roleIcon(name, category) {
  return NAME_ICONS.find(([re]) => re.test(name))?.[1] || CATEGORY_ICON[category] || Building2;
}

function Avatar({ name, color, size = 40, category, player }) {
  if (player) return <PlayerFace player={player} size={size} color={color} />;
  const Icon = roleIcon(name, category);
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon size={size * 0.52} strokeWidth={2} />
    </div>
  );
}

// Regroupe les messages par expéditeur (un fil par agent de joueur, par DG adverse, par
// dépisteur...) façon liste de contacts d'une appli de messagerie — voir App.jsx addMessage
// (chaque "from" distinct crée naturellement son propre fil) et markThreadRead.
function groupThreads(messages, findPlayer) {
  const byFrom = new Map();
  messages.forEach((m) => {
    if (!byFrom.has(m.from)) byFrom.set(m.from, []);
    byFrom.get(m.from).push(m);
  });
  return [...byFrom.entries()].map(([from, msgs]) => {
    // Le plus récent en premier (pas l'ordre façon chat classique) : on veut voir l'état le plus
    // à jour d'un fil sans défiler, surtout utile pour un DG qui recoupe plusieurs conversations.
    const sorted = [...msgs].sort((a, b) => (b.day ?? 0) - (a.day ?? 0) || b.id.localeCompare(a.id));
    const last = msgs[0]; // messages déjà triées du plus récent au plus vieux (voir App.jsx addMessage)
    // Un joueur mécontent écrit lui-même (demande d'échange) : sa propre photo plutôt qu'une icône
    // générique de poste — seul cas où l'expéditeur est un vrai joueur, pas du personnel fictif.
    const senderPlayer = msgs[0].playerIds?.length === 1 ? findPlayer?.(msgs[0].playerIds[0]) : null;
    const player = senderPlayer?.name === from ? senderPlayer : null;
    return { from, messages: sorted, last, unread: msgs.filter((m) => !m.read).length, category: last.category, player };
  }).sort((a, b) => (b.last.day ?? 0) - (a.last.day ?? 0) || b.last.id.localeCompare(a.last.id));
}

function ThreadList({ threads, onOpen }) {
  if (threads.length === 0) return <div style={{ color: "var(--iceMuted)", fontSize: 13, padding: "8px 0" }}>Boîte de réception vide pour l'instant.</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {threads.map((t) => (
        <div key={t.from} onClick={() => onOpen(t.from)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", borderRadius: 8, cursor: "pointer", background: t.unread > 0 ? "var(--navy2)" : "transparent" }}
             onMouseEnter={(e) => (e.currentTarget.style.background = "#ffffff0a")} onMouseLeave={(e) => (e.currentTarget.style.background = t.unread > 0 ? "var(--navy2)" : "transparent")}>
          <Avatar name={t.from} color={CATEGORY_COLOR[t.category] || "var(--steel)"} category={t.category} player={t.player} />
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
        <Avatar name={thread.from} color={color} size={34} category={thread.category} player={thread.player} />
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
  const threads = groupThreads(messages, findPlayer);
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
