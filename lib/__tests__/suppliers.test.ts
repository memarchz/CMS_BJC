import { Suppliers, DEFAULT_SUPPLIERS } from "../suppliers";

describe("Suppliers", () => {
  beforeEach(() => localStorage.clear());

  it("all() seeds from DEFAULT_SUPPLIERS when empty", () => {
    expect(Suppliers.all().length).toBeGreaterThanOrEqual(DEFAULT_SUPPLIERS.length);
  });

  it("get() finds a supplier by code, email, or company substring", () => {
    expect(Suppliers.get("SUP-00001")?.company).toContain("ตัวอย่างซัพพลาย");
    expect(Suppliers.get("supplier@demo.co.th")?.code).toBe("SUP-00001");
  });

  it("save() adds a new supplier when the email is new", () => {
    Suppliers.save({
      company: "New Supplier Co",
      taxId: "1111111111111",
      contact: "Someone",
      phone: "02-111-1111",
      email: "new@sup.co.th",
      address: "Somewhere",
      categories: ["Chiller"],
      status: "อนุมัติแล้ว",
      registeredAt: Date.now(),
    });
    expect(Suppliers.get("new@sup.co.th")?.company).toBe("New Supplier Co");
  });

  it("save() updates an existing supplier matched by email", () => {
    Suppliers.save({ email: "supplier@demo.co.th", company: "Renamed Co" });
    expect(Suppliers.get("supplier@demo.co.th")?.company).toBe("Renamed Co");
  });

  it("delete() removes a supplier by email", () => {
    Suppliers.delete("supplier@demo.co.th");
    expect(Suppliers.get("supplier@demo.co.th")).toBeNull();
  });
});
