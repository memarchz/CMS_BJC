import { RL } from "../roleLabels";

describe("RL", () => {
  it("has an entry for supplier, buyer, and admin", () => {
    expect(RL.supplier[1]).toBe("Supplier");
    expect(RL.buyer[1]).toBe("Buyer");
    expect(RL.admin[1]).toBe("Admin");
  });
});
