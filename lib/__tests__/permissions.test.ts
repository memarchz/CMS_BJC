import { Permissions, DEFAULT_BUYER_PERMS } from "../permissions";

describe("Permissions", () => {
  beforeEach(() => localStorage.clear());

  it("get() returns the default categories for a known buyer email (case-insensitive)", () => {
    expect(Permissions.get("BUYER@demo.co.th")).toEqual(
      DEFAULT_BUYER_PERMS["buyer@demo.co.th"]
    );
  });

  it("get() returns an empty array for an unknown email", () => {
    expect(Permissions.get("nobody@demo.co.th")).toEqual([]);
  });

  it("set() then get() round-trips custom categories", () => {
    Permissions.set("buyer@demo.co.th", ["Chiller"]);
    expect(Permissions.get("buyer@demo.co.th")).toEqual(["Chiller"]);
  });

  it("canView() is always true for admin and supplier regardless of category", () => {
    expect(Permissions.canView("x@x.com", "Anything", "admin")).toBe(true);
    expect(Permissions.canView("x@x.com", "Anything", "supplier")).toBe(true);
  });

  it("canView() is true for a buyer only within their assigned categories", () => {
    expect(Permissions.canView("buyer@demo.co.th", "Chiller", "buyer")).toBe(true);
    expect(Permissions.canView("buyer@demo.co.th", "Fork lift", "buyer")).toBe(false);
  });

  it("canView() is false for a buyer with no category given", () => {
    expect(Permissions.canView("buyer@demo.co.th", undefined, "buyer")).toBe(false);
  });
});
