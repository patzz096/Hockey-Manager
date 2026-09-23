import { useState } from "react";
import { X } from "lucide-react";
import { teamOvrBenchmark, starsFor } from "../engine/attributes";
import { expectedSalary, expectedYears } from "../engine/contracts";
import { btnStyle } from "../ui/theme";
import { StarRating } from "./common";

export function ContractOfferModal({ player, isRenewal, team, capSpace = null, onClose, onSubmit }) {
  const expSalary = expectedSalary(player);
  const expYears = expectedYears(player);
  const [salary, setSalary] = useState(expSalary);
  const [years, setYears] = useState(expYears);
  const [signingBonus, setSigningBonus] = useState(0);
  const [noTrade, setNoTrade] = useState(false);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#00000099", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--navy2)", border: "1px solid #ffffff33", borderTop: "4px solid var(--win)", borderRadius: 4, padding: 24, width: 420, maxWidth: "92vw", maxHeight: "88vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--iceMuted)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>{isRenewal ? "Renouvellement de contrat" : "Offre de contrat"} · {player.pos} · {player.age} ans · <StarRating value={starsFor(player.ovr, teamOvrBenchmark(team))} size={12} /></div>
            <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 20 }}>{player.name}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--iceMuted)", cursor: "pointer" }}><X size={18} /></button>
        </div>
        <p style={{ fontSize: 12, color: "var(--iceMuted)", margin: "10px 0 18px" }}>Attentes estimées de l'agent: ~{expSalary.toLocaleString()}k$/an sur {expYears} an{expYears > 1 ? "s" : ""}. Trop loin de ces attentes, l'offre risque d'être refusée.</p>

        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--iceMuted)", marginBottom: 4 }}><span>Salaire annuel</span><span>{salary.toLocaleString()}k${capSpace != null && <span style={{ color: salary > capSpace ? "var(--loss)" : "var(--win)" }}> · espace sous le plafond : {capSpace.toLocaleString()}k$</span>}</span></div>
          <input type="range" min={200} max={12000} step={100} value={salary} onChange={(e) => setSalary(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--iceMuted)", marginBottom: 4 }}><span>Durée du contrat</span><span>{years} an{years > 1 ? "s" : ""}</span></div>
          <input type="range" min={1} max={7} step={1} value={years} onChange={(e) => setYears(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--iceMuted)", marginBottom: 4 }}><span>Prime à la signature</span><span>{signingBonus.toLocaleString()}k$</span></div>
          <input type="range" min={0} max={3000} step={100} value={signingBonus} onChange={(e) => setSigningBonus(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 20, cursor: "pointer" }}>
          <input type="checkbox" checked={noTrade} onChange={(e) => setNoTrade(e.target.checked)} />
          Clause de non-échange (les vedettes y tiennent davantage)
        </label>
        <button onClick={() => onSubmit(player, { salary, years, signingBonus, noTrade }, isRenewal)} style={{ ...btnStyle("var(--win)"), width: "100%", justifyContent: "center" }}>Envoyer l'offre</button>
      </div>
    </div>
  );
}
