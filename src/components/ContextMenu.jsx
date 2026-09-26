import { useEffect, useLayoutEffect, useRef, useState } from "react";

// Menu contextuel générique (clic droit sur un joueur, façon FM) : `items` est une liste de
// { label, onClick, color, disabled } — `null` insère un séparateur, `{ status }` une ligne
// d'information non cliquable. Se ferme au clic extérieur, à Échap, ou si la page défile.
export function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x, y, ready: false });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ x: Math.max(4, Math.min(x, window.innerWidth - r.width - 8)), y: Math.max(4, Math.min(y, window.innerHeight - r.height - 8)), ready: true });
  }, [x, y]);
  useEffect(() => {
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onClose, true);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [onClose]);
  return (
    <div ref={ref} onClick={(e) => e.stopPropagation()} onContextMenu={(e) => e.preventDefault()}
      style={{ position: "fixed", top: pos.y, left: pos.x, visibility: pos.ready ? "visible" : "hidden", zIndex: 200, background: "var(--navy2)", border: "1px solid #ffffff33", borderRadius: 6, boxShadow: "0 8px 24px #00000066", minWidth: 230, maxHeight: "80vh", overflowY: "auto", padding: "4px 0" }}>
      {items.map((it, i) => it === null ? (
        <div key={i} style={{ height: 1, background: "#ffffff1a", margin: "4px 0" }} />
      ) : it.status ? (
        <div key={i} style={{ padding: "7px 14px", fontSize: 12, color: "var(--iceMuted)" }}>{it.status}</div>
      ) : (
        <button key={i} disabled={it.disabled} onClick={() => { if (!it.disabled) { it.onClick(); onClose(); } }}
          style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: "7px 14px", fontSize: 13, color: it.disabled ? "var(--iceMuted)" : (it.color || "var(--ice)"), cursor: it.disabled ? "not-allowed" : "pointer", opacity: it.disabled ? 0.5 : 1 }}
          onMouseEnter={(e) => !it.disabled && (e.currentTarget.style.background = "#ffffff14")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
          {it.label}
        </button>
      ))}
    </div>
  );
}
