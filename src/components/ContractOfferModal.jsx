import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { teamOvrBenchmark, starsFor } from "../engine/attributes";
import { agentAsk, evaluateOffer, interestFactors, interestLabel, bonusRules, BONUS_KINDS, minSalaryFor, maxSalaryFor, MAX_TERM, homeRegionLabel, gmEstimate, MAX_OFFER_ATTEMPTS } from "../engine/contracts";
import { formatMoney } from "../engine/cap";
import { btnStyle } from "../ui/theme";
import { StarRating } from "./common";
import { money as k$ } from "../ui/format";

// ---------------------------------------------------------------------------------------
// Offre de contrat. L'intérêt du joueur (équipe gagnante, proximité, rôle, attachement) fixe
// la demande de son agent ; l'offre (salaire, durée, un ou deux volets, primes, clauses) donne
// une chance d'acceptation affichée en direct, calculée comme lors de l'envoi.
// ---------------------------------------------------------------------------------------

const factorColor = (v) => (v >= 0.4 ? "var(--win)" : v >= 0.1 ? "#7FD6A0" : v > -0.1 ? "var(--gold)" : v > -0.4 ? "#F59A4A" : "var(--loss)");
const label = { display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--iceMuted)", marginBottom: 4 };
const input = { background: "var(--navy)", color: "var(--ice)", border: "1px solid var(--line)", borderRadius: 5, padding: "4px 6px", fontSize: 12, fontFamily: "inherit" };
const clampNum = (v, lo, hi) => (Number.isNaN(v) ? lo : Math.max(lo, Math.min(hi, v)));
// Suggestions rapides façon FM24 : ajoutent une prime déjà remplie, modifiable ensuite.
const SKATER_BONUS_PRESETS = [{ kind: "g", target: 15, amount: 300 }, { kind: "pts", target: 50, amount: 500 }, { kind: "a", target: 25, amount: 300 }];
const GOALIE_BONUS_PRESETS = [{ kind: "w", target: 25, amount: 100 }, { kind: "w", target: 40, amount: 200 }, { kind: "gp", target: 50, amount: 150 }];

function FactorBar({ f }) {
  const pct = (f.value + 1) * 50;
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
        <span>{f.label} <span style={{ color: "var(--iceMuted)", fontSize: 11 }}>· {f.note}</span></span>
        <span style={{ color: factorColor(f.value), fontWeight: 700 }}>{f.value > 0 ? "+" : ""}{Math.round(f.value * 100)}</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: "#ffffff14", position: "relative" }}>
        <div style={{ position: "absolute", left: "50%", top: -2, width: 1, height: 9, background: "#ffffff40" }} />
        <div style={{ position: "absolute", left: `${Math.min(50, pct)}%`, width: `${Math.abs(pct - 50)}%`, height: "100%", borderRadius: 3, background: factorColor(f.value) }} />
      </div>
    </div>
  );
}

export function ContractOfferModal({ player, realPlayer, isRenewal, team, context, stats, capSpace = null, gmRating = null, rejections = 0, onClose, onSubmit }) {
  const real = realPlayer || player;
  const { ctx, year, perf } = context;
  const ask = agentAsk(real, ctx, year, perf, rejections);
  const estimate = gmEstimate(real, ask, gmRating);
  const { factors, interest } = interestFactors(real, ctx);
  const min = minSalaryFor(year), max = maxSalaryFor(year);
  const maxTerm = isRenewal ? MAX_TERM.renewal : MAX_TERM.freeAgent;
  const [salary, setSalary] = useState(estimate.salary);
  const [years, setYears] = useState(Math.min(estimate.years, maxTerm));
  const [type, setType] = useState("one");
  const [ahlSalary, setAhlSalary] = useState(150);
  const [signingBonus, setSigningBonus] = useState(0);
  const [noTrade, setNoTrade] = useState(false);
  const [bonuses, setBonuses] = useState([]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const rules = bonusRules(real, { years, elc: false }, year);
  const activeBonuses = rules.allowed ? bonuses : [];
  const bonusSum = activeBonuses.reduce((a, b) => a + (b.amount || 0), 0);
  const ntcAllowed = real.age >= 27;
  const offer = { salary, years, type, ahlSalary, signingBonus, noTrade: ntcAllowed && noTrade, bonuses: activeBonuses };
  // Chance d'acceptation : même calcul que l'envoi, sans tirage.
  const ev = evaluateOffer(real, offer, ctx, year, perf, () => 1, rejections);
  const pct = Math.round(ev.probability * 100);
  const hit = salary + bonusSum + Math.round((signingBonus || 0) / Math.max(1, years));
  const isGoalie = real.pos === "G";
  const bench = teamOvrBenchmark(team);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#00000099", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--navy2)", border: "1px solid #ffffff33", borderTop: "4px solid var(--win)", borderRadius: 8, padding: 20, width: 560, maxWidth: "94vw", maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--iceMuted)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>{isRenewal ? "Prolongation de contrat" : "Offre à un agent libre"} · {player.pos} · {player.age} ans · <StarRating value={starsFor(player.ovr, bench)} size={12} /></div>
            <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 20 }}>{player.name}</div>
            <div style={{ fontSize: 11, color: "var(--iceMuted)" }}>Contrat à partir de {year}-{String(year + 1).slice(2)} · origine : {homeRegionLabel(real)}{stats?.gp ? ` · cette saison : ${stats.gp} PJ, ${stats.g} B, ${stats.a} A, ${stats.pts} PTS` : ""}</div>
          </div>
          <button onClick={onClose} aria-label="Fermer" style={{ background: "none", border: "none", color: "var(--iceMuted)", cursor: "pointer" }}><X size={18} /></button>
        </div>

        <section style={{ background: "var(--navy)", border: "1px solid var(--line)", borderRadius: 8, padding: 12, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
            <strong style={{ letterSpacing: 0.4 }}>INTÉRÊT POUR TON ÉQUIPE</strong>
            <strong style={{ color: factorColor(interest) }}>{interestLabel(interest)}</strong>
          </div>
          {factors.map((f) => <FactorBar key={f.key} f={f} />)}
          <div style={{ fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>
            Estimation du DG : <strong style={{ color: "var(--gold)" }}>{k$(Math.round(estimate.salary * (1 - estimate.spread) / 25) * 25)} – {k$(Math.round(estimate.salary * (1 + estimate.spread) / 25) * 25)}/an</strong>, autour de {estimate.years} an{estimate.years > 1 ? "s" : ""}
            <span style={{ color: "var(--iceMuted)" }}> · {gmRating == null ? "aucun DG en poste : estimation à l'aveugle" : estimate.spread <= 0.12 ? "DG expérimenté : estimation fiable" : estimate.spread <= 0.25 ? "estimation approximative" : "DG peu expérimenté : estimation très large"}{!isRenewal && real.ovr >= 62 ? " · d'autres équipes s'intéressent probablement à lui" : ""}</span>
          </div>
          {rejections > 0 && (
            <div style={{ fontSize: 12, marginTop: 6, color: "#F59A4A" }}>
              {rejections} offre{rejections > 1 ? "s" : ""} refusée{rejections > 1 ? "s" : ""} d'affilée — ses attentes ont grimpé.{rejections >= MAX_OFFER_ATTEMPTS - 1 ? ` Dernière chance avant qu'il ne refuse toute négociation (max ${MAX_OFFER_ATTEMPTS}).` : ""}
            </div>
          )}
        </section>

        <div style={{ marginBottom: 12 }}>
          <div style={label}><span>Salaire annuel (impact sur le plafond)</span><span style={{ color: "var(--ice)", fontWeight: 700 }}>{k$(salary)}</span></div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input aria-label="Salaire" type="range" min={min} max={max} step={25} value={salary} onChange={(e) => setSalary(Number(e.target.value))} style={{ flex: 1 }} />
            <input aria-label="Salaire (milliers de $, exact)" type="number" min={min} max={max} step={25} value={salary} onChange={(e) => setSalary(clampNum(Number(e.target.value), min, max))} style={{ ...input, width: 84 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--iceMuted)" }}><span>Minimum LNH {k$(min)}</span><span>Maximum (20 % du plafond) {k$(max)}</span></div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={label}><span>Durée</span><span style={{ color: "var(--ice)", fontWeight: 700 }}>{years} an{years > 1 ? "s" : ""}</span></div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input aria-label="Durée" type="range" min={1} max={maxTerm} step={1} value={years} onChange={(e) => setYears(Number(e.target.value))} style={{ flex: 1 }} />
            <input aria-label="Durée (années, exacte)" type="number" min={1} max={maxTerm} step={1} value={years} onChange={(e) => setYears(clampNum(Number(e.target.value), 1, maxTerm))} style={{ ...input, width: 56 }} />
          </div>
          <div style={{ fontSize: 10, color: "var(--iceMuted)" }}>Maximum {maxTerm} ans ({isRenewal ? "prolongation avec ton équipe" : "agent libre"}).</div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={label}><span>Type de contrat</span></div>
          <div role="radiogroup" aria-label="Type de contrat" style={{ display: "flex", gap: 6 }}>
            {[["one", "Un volet", "Même salaire en LNH et dans la LAH"], ["two", "Deux volets", "Salaire réduit s'il joue dans la LAH"]].map(([k, l, d]) => (
              <button key={k} role="radio" aria-checked={type === k} onClick={() => setType(k)} style={{ flex: 1, textAlign: "left", padding: "7px 10px", borderRadius: 7, cursor: "pointer", fontFamily: "inherit", color: "var(--ice)", background: type === k ? "rgba(92,200,255,0.16)" : "var(--navy)", border: `1px solid ${type === k ? "var(--accent)" : "var(--line)"}` }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{l}</div><div style={{ fontSize: 11, color: "var(--iceMuted)" }}>{d}</div>
              </button>
            ))}
          </div>
          {type === "two" && (
            <div style={{ marginTop: 8 }}>
              <div style={label}><span>Salaire dans la LAH</span><span style={{ color: "var(--ice)" }}>{k$(ahlSalary)}</span></div>
              <input aria-label="Salaire LAH" type="range" min={75} max={800} step={25} value={ahlSalary} onChange={(e) => setAhlSalary(Number(e.target.value))} style={{ width: "100%" }} />
              {real.ovr >= 60 && <div style={{ fontSize: 11, color: "#F59A4A" }}>Un joueur de calibre LNH accepte mal un contrat à deux volets.</div>}
            </div>
          )}
          {type === "one" && <div style={{ fontSize: 11, color: "var(--iceMuted)", marginTop: 6 }}>Envoyé dans la LAH, il garde son plein salaire ; la part au-delà de {k$(min + 375)} compte encore sur ton plafond.</div>}
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={label}><span>Prime à la signature (payée tout de suite)</span><span style={{ color: "var(--ice)" }}>{k$(signingBonus)}</span></div>
          <input aria-label="Prime à la signature" type="range" min={0} max={Math.round(salary * years * 0.5 / 50) * 50} step={50} value={Math.min(signingBonus, Math.round(salary * years * 0.5 / 50) * 50)} onChange={(e) => setSigningBonus(Number(e.target.value))} style={{ width: "100%" }} />
        </div>

        <section style={{ marginBottom: 12 }}>
          <div style={label}><span>Primes de rendement</span>{rules.allowed && <span>{k$(bonusSum)} / {k$(rules.max)} maximum</span>}</div>
          {!rules.allowed ? <div style={{ fontSize: 11, color: "var(--iceMuted)" }}>{rules.why}</div> : (<>
            <div style={{ fontSize: 11, color: "var(--iceMuted)", marginBottom: 6 }}>{rules.why} Le montant maximal compte sur le plafond ; la prime est versée à la fin de la saison régulière si l'objectif est atteint.</div>
            {bonuses.length < 4 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {(isGoalie ? GOALIE_BONUS_PRESETS : SKATER_BONUS_PRESETS).map((p, i) => (
                  <button key={i} onClick={() => setBonuses([...bonuses, { kind: p.kind, target: p.target, amount: p.amount }])} style={{ ...btnStyle("var(--steel)"), fontSize: 10, padding: "3px 8px" }}>
                    +{p.target} {BONUS_KINDS[p.kind].short} → {k$(p.amount)}
                  </button>
                ))}
              </div>
            )}
            {bonuses.map((b, i) => (
              <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 5, flexWrap: "wrap" }}>
                <select aria-label="Objectif" value={b.kind} onChange={(e) => setBonuses(bonuses.map((x, j) => (j === i ? { ...x, kind: e.target.value } : x)))} style={input}>
                  {Object.entries(BONUS_KINDS).filter(([, v]) => (isGoalie ? v.goalie : v.skater)).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <span style={{ fontSize: 12 }}>≥</span>
                <input aria-label="Seuil" type="number" min={1} value={b.target} onChange={(e) => setBonuses(bonuses.map((x, j) => (j === i ? { ...x, target: Number(e.target.value) } : x)))} style={{ ...input, width: 64 }} />
                <span style={{ fontSize: 12 }}>→</span>
                <input aria-label="Montant (milliers de $)" type="number" min={25} step={25} value={b.amount} onChange={(e) => setBonuses(bonuses.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) } : x)))} style={{ ...input, width: 80 }} />
                <span style={{ fontSize: 12 }}>k$ ({k$(b.amount)})</span>
                <button aria-label="Retirer la prime" onClick={() => setBonuses(bonuses.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "var(--iceMuted)", cursor: "pointer" }}><X size={14} /></button>
              </div>
            ))}
            {bonuses.length < 4 && <button onClick={() => setBonuses([...bonuses, { kind: isGoalie ? "gp" : "pts", target: isGoalie ? 40 : 40, amount: 250 }])} style={{ ...btnStyle("var(--steel)"), fontSize: 11, padding: "4px 10px" }}><Plus size={12} /> Ajouter une prime</button>}
            {bonusSum > rules.max && <div style={{ fontSize: 11, color: "var(--loss)", marginTop: 4 }}>Total au-delà du maximum permis ({k$(rules.max)}).</div>}
          </>)}
        </section>

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 14, cursor: ntcAllowed ? "pointer" : "not-allowed", opacity: ntcAllowed ? 1 : 0.5 }}>
          <input type="checkbox" checked={ntcAllowed && noTrade} disabled={!ntcAllowed} onChange={(e) => setNoTrade(e.target.checked)} />
          Clause de non-échange {ntcAllowed ? "(les vedettes y tiennent)" : "(permise à partir de 27 ans, âge de l'autonomie complète)"}
        </label>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", background: "var(--navy)", borderRadius: 8, padding: "10px 12px", marginBottom: 12, fontSize: 12 }}>
          <span>Plafond : <strong style={{ color: capSpace != null && hit > capSpace ? "var(--loss)" : "var(--ice)" }}>{formatMoney(hit)}</strong>{capSpace != null && <span style={{ color: "var(--iceMuted)" }}> sur {formatMoney(capSpace)} d'espace</span>}</span>
          <span style={{ marginLeft: "auto" }}>Chance d'acceptation : <strong style={{ color: pct >= 65 ? "var(--win)" : pct >= 40 ? "var(--gold)" : "var(--loss)" }}>{pct} %</strong></span>
        </div>

        <button disabled={bonusSum > rules.max} onClick={() => onSubmit(player, offer, isRenewal)} style={{ ...btnStyle("var(--win)"), width: "100%", justifyContent: "center", opacity: bonusSum > rules.max ? 0.5 : 1 }}>Envoyer l'offre</button>
      </div>
    </div>
  );
}
