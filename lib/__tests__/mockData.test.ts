import { LABELS_MAP, MOCK_SUBS } from "../mockData";

describe("mockData", () => {
  it("LABELS_MAP has a Thai label for assetName", () => {
    expect(LABELS_MAP.assetName).toBe("Asset Name");
  });

  it("MOCK_SUBS has exactly 6 seed records with unique ids", () => {
    expect(MOCK_SUBS).toHaveLength(6);
    const ids = new Set(MOCK_SUBS.map((r) => r.id));
    expect(ids.size).toBe(6);
  });

  it("every MOCK_SUBS record has a role of supplier or buyer", () => {
    for (const r of MOCK_SUBS) {
      expect(["supplier", "buyer"]).toContain(r.role);
    }
  });
});
