import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { h2Style } from "../ui/theme";
import { PlayerLink } from "./common";

export const CATEGORY_COLOR = { scout: "#7A4E9E", finance: "var(--win)", transaction: "var(--red)", general: "var(--steel)" };

export function InboxPanel({ messages, onMarkRead, findPlayer, onOpenPlayer }) {
  const [openId, setOpenId] = useState(null);
  function toggle(m) {
    setOpenId(openId === m.id ? null : m.id);
    if (!m.read) onMarkRead(m.id);
  }
  const unread = messages.filter((m) => !m.read).length;
  return (
    <div>
      <h2 style={h2Style}>Messagerie {unread > 0 && <span style={{ fontSize: 13, color: "var(--red)", fontWeight: 400 }}>({unread} non lu{unread > 1 ? "s" : ""})</span>}</h2>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: -8, marginBottom: 14 }}>Rapports des dépisteurs, bilans financiers et confirmations de transactions arrivent ici.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {messages.map((m) => (
          <div key={m.id}>
            <div onClick={() => toggle(m)} style={{ display: "flex", alignItems: "center", gap: 10, background: m.read ? "var(--navy)" : "var(--navy2)", border: `1px solid ${m.read ? "#ffffff1a" : CATEGORY_COLOR[m.category] + "66"}`, borderLeft: `4px solid ${CATEGORY_COLOR[m.category] || "var(--steel)"}`, borderRadius: 4, padding: "9px 12px", fontSize: 13, cursor: "pointer" }}>
              {!m.read && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--red)", flexShrink: 0 }} />}
              <span style={{ color: "var(--iceMuted)", minWidth: 150 }}>{m.from}</span>
              <span style={{ flex: 1, fontWeight: m.read ? 400 : 600 }}>{m.subject}</span>
              {openId === m.id ? <ChevronUp size={14} color="var(--iceMuted)" /> : <ChevronDown size={14} color="var(--iceMuted)" />}
            </div>
            {openId === m.id && (
              <div style={{ background: "var(--navy2)", border: "1px solid #ffffff1a", borderTop: "none", borderRadius: "0 0 4px 4px", padding: 14, fontSize: 13, whiteSpace: "pre-wrap", color: "var(--iceMuted)" }}>
                {m.body}
                {m.playerIds?.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10, whiteSpace: "normal" }}>
                    <span>Profils :</span>
                    {m.playerIds.map((id) => findPlayer(id)).filter(Boolean).map((p) => (
                      <PlayerLink key={p.id} player={p} onSelect={() => onOpenPlayer(p.id)} style={{ color: "var(--ice)", background: "#ffffff12", borderRadius: 3, padding: "1px 7px" }} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {messages.length === 0 && <div style={{ color: "var(--iceMuted)", fontSize: 13 }}>Boîte de réception vide pour l'instant.</div>}
      </div>
    </div>
  );
}
