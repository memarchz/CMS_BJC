import { Suppliers, type Supplier } from "../../lib/suppliers";

/** Port of viewSupplierByEmail() lookup in js/admin.js:1192-1208. */
export function resolveSupplier(email: string, supString?: string): Supplier {
  let sup = Suppliers.get(email);
  if (!sup && supString) sup = Suppliers.get(supString);
  if (!sup) {
    sup = {
      code: "SUP-NEW",
      company: supString || email,
      taxId: "-",
      contact: "เจ้าหน้าที่ประสานงาน",
      phone: "-",
      email,
      address: "-",
      categories: [],
      status: "อนุมัติแล้ว",
      registeredAt: Date.now(),
    };
  }
  return sup;
}
