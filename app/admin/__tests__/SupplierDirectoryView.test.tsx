import { render, screen, fireEvent } from "@testing-library/react";
import { SupplierDirectoryView } from "../SupplierDirectoryView";
import { Suppliers } from "../../../lib/suppliers";
import { Store } from "../../../lib/store";

function renderView(props: Partial<React.ComponentProps<typeof SupplierDirectoryView>> = {}) {
  const p = { onBack: jest.fn(), onOpenAddSupplier: jest.fn(), onViewSupplierDetail: jest.fn(), ...props };
  render(<SupplierDirectoryView {...p} />);
  return p;
}

describe("SupplierDirectoryView", () => {
  beforeEach(() => {
    localStorage.clear();
    Store.resetMock();
  });

  it("renders the 4 stat cards with the supplier counts", () => {
    renderView();
    expect(screen.getByText("คู่ค้าทั้งหมด")).toBeInTheDocument();
    expect(screen.getByText("คู่ค้าทั้งหมด").nextElementSibling).toHaveTextContent(String(Suppliers.all().length));
    expect(screen.getByText("อนุมัติแล้ว", { selector: "div" })).toBeInTheDocument();
    expect(screen.getByText("รอตรวจสอบ", { selector: "div" })).toBeInTheDocument();
    expect(screen.getByText("มูลค่าสั่งซื้อรวม")).toBeInTheDocument();
  });

  it("filters the table by company/code/taxId/email search text", () => {
    renderView();
    fireEvent.change(screen.getByPlaceholderText(/ค้นหาชื่อบริษัท/), { target: { value: "SUP-00088" } });
    expect(screen.getByText(/เทรน \(ประเทศไทย\)/)).toBeInTheDocument();
    expect(screen.queryByText(/ตัวอย่างซัพพลาย/)).toBeNull();
  });

  it("shows the empty state when the search matches nothing", () => {
    renderView();
    fireEvent.change(screen.getByPlaceholderText(/ค้นหาชื่อบริษัท/), { target: { value: "no-such-company-xyz" } });
    expect(screen.getByText("ไม่พบคู่ค้าตามเงื่อนไขที่ค้นหา")).toBeInTheDocument();
  });

  it("clicking 'ดูรายละเอียด' on a row calls onViewSupplierDetail with that supplier", () => {
    const p = renderView();
    fireEvent.click(screen.getAllByText("ดูรายละเอียด")[0]);
    expect(p.onViewSupplierDetail).toHaveBeenCalledWith(expect.objectContaining({ code: "SUP-00001" }));
  });

  it("'+ เพิ่มคู่ค้าใหม่' calls onOpenAddSupplier and 'กลับหน้าหลัก' button calls onBack", () => {
    const p = renderView();
    fireEvent.click(screen.getByText("+ เพิ่มคู่ค้าใหม่"));
    expect(p.onOpenAddSupplier).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "กลับหน้าหลัก" }));
    expect(p.onBack).toHaveBeenCalled();
  });

  it("counts the submitted items per supplier by email match", () => {
    renderView();
    const row = screen.getByText("SUP-00001").closest("tr") as HTMLElement;
    const expected = Store.all().filter(
      (i) => i.email.toLowerCase() === "supplier@demo.co.th" || String(i.values?.sup || "").toLowerCase().includes("sup-00001")
    ).length;
    expect(row).toHaveTextContent(`${expected} เครื่อง`);
  });

  it("tapping on the item count button expands category breakdown and machine list, and clicking again collapses it", () => {
    const onViewSub = jest.fn();
    renderView({ onViewSub });
    const countBtn = screen.getByRole("button", { name: /4 เครื่อง/i });

    // Tap to expand
    fireEvent.click(countBtn);
    expect(screen.getByText(/จำนวนที่กรอกแยกตามแต่ละบล็อก \/ หมวดหมู่/)).toBeInTheDocument();
    expect(screen.getByText(/ตารางเครื่องจักรที่ส่งเข้ามาทั้งหมด/)).toBeInTheDocument();

    // Check that clicking 'ดูฟอร์ม' calls onViewSub
    const viewFormBtns = screen.getAllByRole("button", { name: /ดูฟอร์ม/i });
    expect(viewFormBtns.length).toBeGreaterThan(0);
    fireEvent.click(viewFormBtns[0]);
    expect(onViewSub).toHaveBeenCalled();

    // Tap again to collapse
    fireEvent.click(countBtn);
    expect(screen.queryByText(/จำนวนที่กรอกแยกตามแต่ละบล็อก \/ หมวดหมู่/)).toBeNull();
  });

  it("clicking the supplier company name directly expands and collapses the dropdown", () => {
    renderView();
    const supName = screen.getByText("บริษัท ตัวอย่างซัพพลาย จำกัด");

    // Click company name to expand
    fireEvent.click(supName);
    expect(screen.getByText(/จำนวนที่กรอกแยกตามแต่ละบล็อก \/ หมวดหมู่/)).toBeInTheDocument();
    expect(screen.getByText(/ตารางเครื่องจักรที่ส่งเข้ามาทั้งหมด/)).toBeInTheDocument();

    // Click company name again to collapse
    fireEvent.click(supName);
    expect(screen.queryByText(/จำนวนที่กรอกแยกตามแต่ละบล็อก \/ หมวดหมู่/)).toBeNull();
  });
});
