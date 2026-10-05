import { J } from "../safeStorage";

describe("J (safe localStorage JSON)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns the default when the key is missing", () => {
    expect(J.get("missing_key", "default")).toBe("default");
  });

  it("round-trips an object through set/get", () => {
    J.set("k", { a: 1 });
    expect(J.get("k", null)).toEqual({ a: 1 });
  });

  it("returns the default when stored value is corrupted JSON", () => {
    localStorage.setItem("corrupt", "{not json");
    expect(J.get("corrupt", "fallback")).toBe("fallback");
  });
});
