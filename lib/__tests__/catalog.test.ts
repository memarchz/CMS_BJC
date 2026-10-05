import { CATS, CATN, HIDE, STEPS, S, CARBON } from "../catalog";

describe("catalog data", () => {
  it("CATN matches the keys of CATS", () => {
    expect(CATN).toEqual(Object.keys(CATS));
  });

  it("has exactly 14 categories", () => {
    expect(CATN.length).toBe(14);
  });

  it("every HIDE entry only references field keys that exist somewhere in STEPS", () => {
    const allKeys = new Set(
      STEPS.flatMap((s) => s.groups.flatMap((g) => g.f.map((f) => f.k)))
    );
    for (const [, hiddenKeys] of Object.entries(HIDE)) {
      for (const k of hiddenKeys) {
        if (!CARBON.includes(k)) {
          expect(allKeys.has(k)).toBe(true);
        }
      }
    }
  });

  it("STEPS has 4 steps with the expected roles", () => {
    expect(STEPS).toHaveLength(4);
    expect(STEPS[0].roles).toEqual(["buyer", "admin"]);
    expect(STEPS[1].roles).toEqual(["supplier", "buyer", "admin"]);
  });

  it("the autofill demo record S provides a value for assetName", () => {
    expect(S.assetName).toBe("ตู้แช่เย็น Daikin");
  });
});
