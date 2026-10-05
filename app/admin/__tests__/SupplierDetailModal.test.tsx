import { render, screen, fireEvent } from "@testing-library/react";
import { SupplierDetailModal } from "../SupplierDetailModal";
import { Suppliers } from "../../../lib/suppliers";
import { Store } from "../../../lib/store";

describe("SupplierDetailModal", () => {
  beforeEach(() => {
    localStorage.clear();
    Store.resetMock();
  });

  it("shows the supplier's company, tax ID, and contact details", () => {
    const sup = Suppliers.all()[0];
    render(<SupplierDetailModal open={true} onClose={jest.fn()} supplier={sup} onFilterInMainList={jest.fn()} />);
    expect(screen.getByText(sup.company)).toBeInTheDocument();
    expect(screen.getByText(sup.taxId)).toBeInTheDocument();
    expect(screen.getByText(sup.contact)).toBeInTheDocument();
  });

  it("shows an empty-history row when the supplier has no submitted items", () => {
    const sup = { ...Suppliers.all()[0], email: "nobody-matches@x.com", code: "SUP-NOMATCH" };
    render(<SupplierDetailModal open={true} onClose={jest.fn()} supplier={sup} onFilterInMainList={jest.fn()} />);
    expect(screen.getByText("ยังไม่มีประวัติการส่งมอบเครื่องจักรในระบบ")).toBeInTheDocument();
  });

  it("lists the supplier's submitted items", () => {
    const sup = Suppliers.all()[0];
    const items = Store.all().filter((i) => i.email.toLowerCase() === sup.email.toLowerCase());
    render(<SupplierDetailModal open={true} onClose={jest.fn()} supplier={sup} onFilterInMainList={jest.fn()} />);
    expect(document.getElementById("sd-item-count")).toHaveTextContent(String(items.length));
  });

  it("'กรองดูรายการ...' calls onFilterInMainList", () => {
    const onFilterInMainList = jest.fn();
    render(<SupplierDetailModal open={true} onClose={jest.fn()} supplier={Suppliers.all()[0]} onFilterInMainList={onFilterInMainList} />);
    fireEvent.click(screen.getByText(/กรองดูรายการของ Supplier เจ้านี้/));
    expect(onFilterInMainList).toHaveBeenCalled();
  });

  it("renders the category breakdown chips when the supplier has items", () => {
    const sup = Suppliers.all()[0];
    render(<SupplierDetailModal open={true} onClose={jest.fn()} supplier={sup} onFilterInMainList={jest.fn()} />);
    expect(screen.getByText(/สรุปตามแต่ละบล็อก \/ หมวดหมู่ที่กรอกเข้ามา/)).toBeInTheDocument();
  });
});
