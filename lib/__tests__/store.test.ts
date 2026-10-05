import { Store } from "../store";
import { MOCK_SUBS } from "../mockData";

describe("Store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("seeds from MOCK_SUBS when localStorage is empty", () => {
    expect(Store.all()).toHaveLength(MOCK_SUBS.length);
  });

  it("put() upserts a record by id", () => {
    const rec = { ...MOCK_SUBS[0], title: "edited title" };
    Store.put(rec);
    const found = Store.all().find((r) => r.id === rec.id);
    expect(found?.title).toBe("edited title");
    expect(Store.all()).toHaveLength(MOCK_SUBS.length);
  });

  it("update() merges a partial record and returns it", () => {
    const target = Store.all()[0];
    const updated = Store.update(target.id, { status: "ส่งคืนให้ Buyer แก้ไข" });
    expect(updated?.status).toBe("ส่งคืนให้ Buyer แก้ไข");
    expect(Store.all().find((r) => r.id === target.id)?.status).toBe(
      "ส่งคืนให้ Buyer แก้ไข"
    );
  });

  it("update() returns null for an unknown id", () => {
    expect(Store.update("nonexistent", { status: "x" })).toBeNull();
  });

  it("resetMock() restores the original 6 seed records", () => {
    Store.put({ ...MOCK_SUBS[0], id: "extra-one" });
    expect(Store.all().length).toBeGreaterThan(MOCK_SUBS.length);
    Store.resetMock();
    expect(Store.all()).toHaveLength(MOCK_SUBS.length);
  });
});
