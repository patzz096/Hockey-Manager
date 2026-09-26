import { useState } from "react";
import { X } from "lucide-react";
import { starsFor } from "../engine/attributes";
import { STAFF_ROLES } from "../engine/staff";
import { formatDay } from "../engine/calendar";
import { money } from "../ui/format";
import { btnStyle } from "../ui/theme";
import { StarRating, ConfirmButton, InfoCard } from "./common";

// Profil plein écran d'un membre du personnel (en poste ou candidat du marché), même traitement
// que le profil joueur (PlayerModal) : occupe toute la page plutôt qu'une fenêtre flottante.
// Pas de cote numérique générale à côté des étoiles (seulement les étoiles) — la précision brute
// reste réservée aux joueurs dépistés.
export function StaffProfileModal({ staff, role, isHired, benchmark, team, pendingOffer, negotiation, onOffer, onFire, onClose }) {
  const [offered, setOffered] = useState(staff.salary);
  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--navy)", zIndex: 80, display: "flex", flexDirection: "column" }}>
      <div style={{ background: `linear-gradient(90deg, ${team.color}, ${team.color}99)`, padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div>
          <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 19, color: "#fff" }}>{staff.name}</div>
          <div style={{ fontSize: 12, color: "#ffffffcc" }}>{STAFF_ROLES[role]} · {isHired ? `en poste — ${team.name}` : "candidat du marché"}</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><X size={22} /></button>
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "24px 28px" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            <InfoCard label="COTE" accent="var(--gold)">
              <StarRating value={starsFor(staff.rating, benchmark)} size={16} />
            </InfoCard>
            {staff.devSkill != null && (
              <InfoCard label="DÉVELOPPEMENT DES JOUEURS" accent="var(--steel)">
                <StarRating value={starsFor(staff.devSkill, benchmark)} size={16} color="#7A9EDB" />
              </InfoCard>
            )}
            <InfoCard label={isHired ? "SALAIRE" : "SALAIRE DEMANDÉ"} accent="var(--win)">
              <div style={{ fontSize: 14, fontWeight: 600 }}>{money(staff.salary)} par saison</div>
            </InfoCard>
          </div>

          <div style={{ background: "var(--navy2)", border: "1px solid #ffffff22", borderRadius: 4, padding: 16 }}>
            {isHired ? (
              <>
                <div style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 12 }}>Ce membre du personnel occupe le poste de {STAFF_ROLES[role].toLowerCase()}.</div>
                <ConfirmButton label="Congédier" confirmLabel="Confirmer le congédiement" color="var(--loss)" onConfirm={() => { onFire(role); onClose(); }} />
              </>
            ) : pendingOffer ? (
              <div style={{ fontSize: 13, color: "var(--iceMuted)", fontStyle: "italic" }}>Offre envoyée ({money(pendingOffer.offeredSalary)}) — réponse attendue vers le {formatDay(pendingOffer.dueDay)}.</div>
            ) : negotiation?.stonewalled ? (
              <div style={{ fontSize: 13, color: "var(--loss)" }}>Refuse toute négociation pour le reste de la saison — trop d'offres refusées.</div>
            ) : (
              <>
                <div style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 10 }}>Comme pour un joueur, l'offre n'est pas acceptée sur-le-champ : réponse après 1 à 3 jours, avec un risque de refus si l'offre est trop basse par rapport au salaire demandé.</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="number" min={0} step={25} value={offered} onChange={(e) => setOffered(Number(e.target.value))} style={{ width: 110, background: "var(--navy)", border: "1px solid #ffffff33", borderRadius: 3, color: "var(--ice)", padding: "6px 8px", fontSize: 13 }} />
                  <button onClick={() => { onOffer(staff, offered); onClose(); }} style={btnStyle("var(--win)")}>Offrir</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
