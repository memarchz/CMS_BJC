import { Auth, SEED } from "../auth";

describe("Auth", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("SEED contains the 7 demo accounts", () => {
    expect(SEED).toHaveLength(7);
    expect(SEED.find((u) => u.email === "admin@demo.co.th")?.role).toBe("admin");
  });

  it("login() succeeds with correct seed credentials and stores a session", () => {
    const s = Auth.login("supplier", "supplier@demo.co.th", "demo1234");
    expect(s?.role).toBe("supplier");
    expect(Auth.session()?.email).toBe("supplier@demo.co.th");
  });

  it("login() falls back to matching by email+password across roles", () => {
    const s = Auth.login("admin", "supplier@demo.co.th", "demo1234");
    expect(s?.role).toBe("supplier");
  });

  it("login() returns null for wrong password", () => {
    expect(Auth.login("supplier", "supplier@demo.co.th", "wrong")).toBeNull();
  });

  it("register() rejects a duplicate email", () => {
    const r = Auth.register({
      company: "x",
      taxId: "1",
      contact: "x",
      phone: "x",
      email: "supplier@demo.co.th",
      pw: "demo1234",
    });
    expect(r.error).toBeDefined();
  });

  it("register() creates a new supplier and logs them in", () => {
    const r = Auth.register({
      company: "New Co",
      taxId: "1234567890123",
      contact: "Someone",
      phone: "02-000-0000",
      email: "new-supplier@demo.co.th",
      pw: "demo1234",
    });
    expect(r.ok?.role).toBe("supplier");
    expect(r.error).toBeUndefined();
  });

  it("home() maps role to the correct route", () => {
    expect(Auth.home("supplier")).toBe("/form");
    expect(Auth.home("admin")).toBe("/admin");
    expect(Auth.home("buyer")).toBe("/submissions");
  });

  it("logout() clears the session", () => {
    Auth.login("supplier", "supplier@demo.co.th", "demo1234");
    Auth.logout();
    expect(Auth.session()).toBeNull();
  });
});
