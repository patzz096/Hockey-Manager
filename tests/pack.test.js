import { describe, it, expect } from "vitest";
import { initLeague } from "../src/engine/league";
import { buildPack, parsePackFile, exportSheetCsv, normalizeContract } from "../src/custom/pack";

const lg = initLeague();

describe("pack de personnalisation", () => {
  it("lit les montants en millions, en milliers ou en dollars", () => {
    expect(normalizeContract({ salaryM: 12.5, years: 8 }).salary).toBe(12500);
    expect(normalizeContract({ salary: 7875, years: 7 }).salary).toBe(7875);
    expect(normalizeContract({ salary: 950000, years: 3 }).salary).toBe(950);
    expect(normalizeContract({ salaryM: "0,85", years: 1, type: "two", ahlSalaryM: 0.1 })).toMatchObject({ salary: 850, type: "two", ahlSalary: 100 });
  });

  it("exporte puis réimporte un pack complet (alignements, contrats, images)", async () => {
    const img = new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" });
    const pack = await buildPack(lg.teams.slice(0, 2), { logos: { [lg.teams[0].id]: img }, faces: { cole_caufield: img } }, { name: "Test", author: "Moi" });
    const p0 = lg.teams[0].roster[0];
    expect(pack.teams[lg.teams[0].id][0].contract.salaryM).toBe(p0.contract.salary / 1000);
    const back = await parsePackFile(JSON.stringify(pack), "pack.json");
    expect(back.meta).toMatchObject({ name: "Test", author: "Moi" });
    expect(back.db.teams[lg.teams[0].id][0].contract.salary).toBe(p0.contract.salary);
    expect(Object.keys(back.logos)).toEqual([lg.teams[0].id]);
    expect(back.faces.cole_caufield).toBeInstanceOf(Blob);
  });

  it("accepte un pack d'images seulement", async () => {
    const back = await parsePackFile(JSON.stringify({ format: "hockey-gm-pack", logos: { MTL: "data:image/png;base64,iVBORw0KGgo=" } }));
    expect(back.db).toBeNull();
    expect(back.logos.MTL).toBeInstanceOf(Blob);
  });

  it("fait l'aller-retour par le CSV du tableur (Excel en français)", async () => {
    const csv = exportSheetCsv(lg.teams.slice(0, 1));
    expect(csv.split("\n")[0]).toMatch(/^﻿?equipe;nom;position/);
    const back = await parsePackFile(csv, "alignements.csv");
    const orig = lg.teams[0].roster[0];
    const got = back.db.teams[lg.teams[0].id][0];
    expect(got.name).toBe(orig.name);
    expect(got.contract.salary).toBe(orig.contract.salary);
    expect(got.attrs.passing).toBe(orig.attrs.passing);
  });
});
