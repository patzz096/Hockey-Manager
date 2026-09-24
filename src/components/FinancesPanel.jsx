import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { FACILITY_LABELS, facilityUpgradeCost, customerExperienceScore, experienceLabel, experienceColor, engagementLabel, engagementColor } from "../engine/finance";
import { h2Style, btnStyle } from "../ui/theme";

export function FinancesPanel({ business, teamCapacity, winPct = 0.5, onSetTierPrice, onSetParkingPrice, onSetItemPrice, onSetMerchPrice, onUpgrade }) {
  const [expanded, setExpanded] = useState(null);
  const experience = customerExperienceScore(business, winPct);
  const engagement = business.fanEngagement ?? 50;
  return (
    <div>
      <h2 style={h2Style}>Finances</h2>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <div style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: "14px 20px" }}>
          <div style={{ fontSize: 11, color: "var(--iceMuted)" }}>SOLDE DE CAISSE</div>
          <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: 26, color: business.cash >= 0 ? "var(--win)" : "var(--loss)" }}>{business.cash.toLocaleString()} $</div>
        </div>
        <div style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: "14px 20px" }}>
          <div style={{ fontSize: 11, color: "var(--iceMuted)" }}>EXPÉRIENCE CLIENT</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: 26, color: experienceColor(experience) }}>{experience}</span>
            <span style={{ fontSize: 13, color: experienceColor(experience) }}>{experienceLabel(experience)}</span>
          </div>
        </div>
        <div style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: "14px 20px" }}>
          <div style={{ fontSize: 11, color: "var(--iceMuted)" }}>ENGAGEMENT DES PARTISANS</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: 26, color: engagementColor(engagement) }}>{engagement}</span>
            <span style={{ fontSize: 13, color: engagementColor(engagement) }}>{engagementLabel(engagement)}</span>
          </div>
        </div>
        {business.tvDeal && (
          <div style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: "14px 20px" }}>
            <div style={{ fontSize: 11, color: "var(--iceMuted)" }}>CONTRAT DE DIFFUSION</div>
            <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: 26 }}>{(business.tvDeal.value / 1000000).toLocaleString("fr-CA", { maximumFractionDigits: 2 })} M$<span style={{ fontSize: 13, fontFamily: "inherit", fontWeight: 500, color: "var(--iceMuted)" }}> /saison</span></div>
            <div style={{ fontSize: 11, color: "var(--iceMuted)" }}>{business.tvDeal.years} an{business.tvDeal.years > 1 ? "s" : ""} restant{business.tvDeal.years > 1 ? "s" : ""} · signé {business.tvDeal.signedYear}</div>
          </div>
        )}
      </div>
      <p style={{ fontSize: 11, color: "var(--iceMuted)", marginTop: -18, marginBottom: 20 }}>
        Expérience client : reflète tes prix (billets, concessions, marchandise) et le niveau de tes installations — la fais grimper vite si tu gonfles les prix. Engagement des partisans : évolue lentement selon l'affluence, les victoires et le marketing (installations + directeur des communications) ; détermine les ventes de marchandise et la valeur du prochain contrat de diffusion (renégocié tous les 4 ans, en saison morte).
      </p>

      <h2 style={h2Style}>Billetterie</h2>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: -8, marginBottom: 12 }}>Trois sections de l'aréna, chacune avec son propre prix et sa capacité.</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginBottom: 26 }}>
        <thead><tr>{["Section", "Capacité", "Prix"].map((h, i) => (<th key={i} style={{ textAlign: "left", padding: "6px 10px", color: "var(--iceMuted)", fontWeight: 500, fontSize: 12, borderBottom: "1px solid #ffffff22" }}>{h}</th>))}</tr></thead>
        <tbody>
          {business.ticketTiers.map((t) => (
            <tr key={t.key} style={{ borderBottom: "1px solid #ffffff11" }}>
              <td style={{ padding: "7px 10px" }}>{t.label}</td>
              <td style={{ padding: "7px 10px", color: "var(--iceMuted)" }}>{Math.round(teamCapacity * t.share).toLocaleString()} places</td>
              <td style={{ padding: "7px 10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, maxWidth: 240 }}>
                  <input type="range" min={5} max={t.basePrice * 3} step={1} value={t.price} onChange={(e) => onSetTierPrice(t.key, Number(e.target.value))} style={{ flex: 1 }} />
                  <span style={{ minWidth: 44 }}>{t.price} $</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={h2Style}>Stationnement</h2>
      <div style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: "14px 20px", maxWidth: 300, marginBottom: 26 }}>
        <div style={{ fontSize: 11, color: "var(--iceMuted)", marginBottom: 6 }}>Capacité: ~{Math.round(teamCapacity * 0.28).toLocaleString()} places</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input type="range" min={0} max={40} step={1} value={business.parking.price} onChange={(e) => onSetParkingPrice(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600 }}>{business.parking.price} $</span>
        </div>
      </div>

      <h2 style={h2Style}>Prix des concessions</h2>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: -8, marginBottom: 12 }}>Monter un prix augmente la marge par unité mais fait chuter le nombre vendu — et vice-versa.</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginBottom: 26 }}>
        <thead><tr>{["Article", "Prix"].map((h, i) => (<th key={i} style={{ textAlign: "left", padding: "6px 10px", color: "var(--iceMuted)", fontWeight: 500, fontSize: 12, borderBottom: "1px solid #ffffff22" }}>{h}</th>))}</tr></thead>
        <tbody>
          {business.concessionItems.map((item) => (
            <tr key={item.key} style={{ borderBottom: "1px solid #ffffff11" }}>
              <td style={{ padding: "7px 10px" }}>{item.label}</td>
              <td style={{ padding: "7px 10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, maxWidth: 220 }}>
                  <input type="range" min={1} max={item.basePrice * 3} step={0.5} value={item.price} onChange={(e) => onSetItemPrice(item.key, Number(e.target.value))} style={{ flex: 1 }} />
                  <span style={{ minWidth: 44 }}>{item.price.toFixed(2)} $</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={h2Style}>Marchandise (boutique)</h2>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: -8, marginBottom: 12 }}>Chandails, casquettes et souvenirs vendus les soirs de match — les ventes montent avec le niveau de la boutique et l'engagement des partisans.</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginBottom: 26 }}>
        <thead><tr>{["Article", "Prix"].map((h, i) => (<th key={i} style={{ textAlign: "left", padding: "6px 10px", color: "var(--iceMuted)", fontWeight: 500, fontSize: 12, borderBottom: "1px solid #ffffff22" }}>{h}</th>))}</tr></thead>
        <tbody>
          {(business.merchItems || []).map((item) => (
            <tr key={item.key} style={{ borderBottom: "1px solid #ffffff11" }}>
              <td style={{ padding: "7px 10px" }}>{item.label}</td>
              <td style={{ padding: "7px 10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, maxWidth: 220 }}>
                  <input type="range" min={1} max={item.basePrice * 3} step={1} value={item.price} onChange={(e) => onSetMerchPrice(item.key, Number(e.target.value))} style={{ flex: 1 }} />
                  <span style={{ minWidth: 50 }}>{item.price.toFixed(2)} $</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={h2Style}>Installations</h2>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: -8, marginBottom: 14 }}>Chaque niveau augmente les ventes ou la capacité — mais aussi les frais d'entretien.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 12, marginBottom: 26 }}>
        {Object.keys(business.facilities).map((key) => {
          const level = business.facilities[key];
          const cost = facilityUpgradeCost(level);
          const maxed = level >= 5;
          return (
            <div key={key} style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: 14 }}>
              <div style={{ fontSize: 13, marginBottom: 6 }}>{FACILITY_LABELS[key]}</div>
              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                {[1, 2, 3, 4, 5].map((n) => (<div key={n} style={{ flex: 1, height: 6, borderRadius: 3, background: n <= level ? "var(--win)" : "#ffffff1a" }} />))}
              </div>
              <button onClick={() => onUpgrade(key)} disabled={maxed || business.cash < cost} style={{ ...btnStyle(maxed ? "var(--steel)" : "var(--red)"), width: "100%", justifyContent: "center", fontSize: 12 }}>
                {maxed ? "Niveau maximum" : `Améliorer — ${cost.toLocaleString()} $`}
              </button>
            </div>
          );
        })}
      </div>

      <h2 style={h2Style}>Bilan des matchs locaux</h2>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: -8, marginBottom: 12 }}>Seuls tes matchs à domicile (la moitié du calendrier) génèrent des revenus d'aréna. Clique un match pour le détail complet.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {business.log.map((g, i) => (
          <div key={i}>
            <div onClick={() => setExpanded(expanded === i ? null : i)} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: "8px 12px", fontSize: 13, cursor: "pointer" }}>
              <span style={{ flex: 1 }}>vs {g.opponent}</span>
              <span style={{ color: "var(--iceMuted)" }}>{g.attendance.toLocaleString()} spect.</span>
              <span style={{ color: "var(--iceMuted)" }}>{g.revenue.toLocaleString()} $ revenus</span>
              <span style={{ color: g.profit >= 0 ? "var(--win)" : "var(--loss)", fontWeight: 600, minWidth: 90, textAlign: "right" }}>{g.profit >= 0 ? "+" : ""}{g.profit.toLocaleString()} $</span>
              {expanded === i ? <ChevronUp size={14} color="var(--iceMuted)" /> : <ChevronDown size={14} color="var(--iceMuted)" />}
            </div>
            {expanded === i && (
              <div style={{ background: "var(--navy2)", border: "1px solid #ffffff1a", borderTop: "none", borderRadius: "0 0 4px 4px", padding: 14, fontSize: 13 }}>
                <div style={{ fontSize: 11, color: "var(--iceMuted)", marginBottom: 6 }}>BILLETTERIE</div>
                {g.tiers.map((t) => (
                  <div key={t.key} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}><span>{t.label} ({t.attendance.toLocaleString()} / {t.capacity.toLocaleString()})</span><span>{t.revenue.toLocaleString()} $</span></div>
                ))}
                <div style={{ fontSize: 11, color: "var(--iceMuted)", margin: "10px 0 6px" }}>CONCESSIONS</div>
                {g.items.map((it) => (
                  <div key={it.key} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: "var(--iceMuted)" }}><span>{it.label} ({it.unitsSold.toLocaleString()} vendus)</span><span>{it.revenue.toLocaleString()} $</span></div>
                ))}
                <div style={{ fontSize: 11, color: "var(--iceMuted)", margin: "10px 0 6px" }}>MARCHANDISE</div>
                {(g.merch || []).map((it) => (
                  <div key={it.key} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: "var(--iceMuted)" }}><span>{it.label} ({it.unitsSold.toLocaleString()} vendus)</span><span>{it.revenue.toLocaleString()} $</span></div>
                ))}
                <div style={{ fontSize: 11, color: "var(--iceMuted)", margin: "10px 0 6px" }}>AUTRES REVENUS</div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}><span>Stationnement ({g.carsCount.toLocaleString()} / {g.parkingCapacity.toLocaleString()} véhicules)</span><span>{g.parkingRevenue.toLocaleString()} $</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: "var(--iceMuted)" }}><span>Contrat de diffusion (part du match)</span><span>{g.tvRevenue.toLocaleString()} $</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontWeight: 600, borderTop: "1px solid #ffffff1a", marginTop: 4 }}><span>Total revenus</span><span>{g.revenue.toLocaleString()} $</span></div>
                <div style={{ fontSize: 11, color: "var(--iceMuted)", margin: "10px 0 6px" }}>DÉPENSES</div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: "var(--iceMuted)" }}><span>Masse salariale (part du match)</span><span>{g.payroll.toLocaleString()} $</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: "var(--iceMuted)" }}><span>Salaires du personnel (part du match)</span><span>{g.staffPayroll.toLocaleString()} $</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: "var(--iceMuted)" }}><span>Entretien des installations</span><span>{g.maintenance.toLocaleString()} $</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: "var(--iceMuted)" }}><span>Frais fixes de l'aréna</span><span>{g.arenaBase.toLocaleString()} $</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontWeight: 600, borderTop: "1px solid #ffffff1a", marginTop: 4 }}><span>Total dépenses</span><span>{g.expenses.toLocaleString()} $</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 0", fontWeight: 700, fontSize: 15, color: g.profit >= 0 ? "var(--win)" : "var(--loss)" }}><span>Profit net</span><span>{g.profit >= 0 ? "+" : ""}{g.profit.toLocaleString()} $</span></div>
              </div>
            )}
          </div>
        ))}
        {business.log.length === 0 && <div style={{ color: "var(--iceMuted)", fontSize: 13 }}>Aucun match local joué encore.</div>}
      </div>
    </div>
  );
}
