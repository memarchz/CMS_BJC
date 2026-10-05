import { render, screen, fireEvent } from "@testing-library/react";
import { AddSupplierModal } from "../AddSupplierModal";
import { Suppliers } from "../../../lib/suppliers";

function fill(tax: string) {
  fireEvent.change(screen.getByLabelText(/ชื่อบริษัท/), { target: { value: "New Co" } });
  fireEvent.change(screen.getByLabelText(/เลขประจำตัวผู้เสียภาษี/), { target: { value: tax } });
  fireEvent.change(screen.getByLabelText(/ชื่อผู้ติดต่อ/), { target: { value: "Someone" } });
  fireEvent.change(screen.getByLabelText(/เบอร์โทรศัพท์/), { target: { value: "0211111111" } });
  fireEvent.change(screen.getByLabelText(/อีเมลติดต่อ/), { target: { value: "New@Sup.co.th" } });
}

describe("AddSupplierModal", () => {
  beforeEach(() => localStorage.clear());

  it("rejects a tax ID that is not 13 digits", () => {
    window.alert = jest.fn();
    const onSaved = jest.fn();
    render(<AddSupplierModal open={true} onClose={jest.fn()} onSaved={onSaved} />);
    fill("123");
    fireEvent.click(screen.getByText("บันทึกคู่ค้า"));
    expect(window.alert).toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("saves a valid new supplier (lower-casing the email) and calls onSaved with the company", () => {
    const onSaved = jest.fn();
    const onClose = jest.fn();
    render(<AddSupplierModal open={true} onClose={onClose} onSaved={onSaved} />);
    fill("1234567890123");
    fireEvent.click(screen.getByText("บันทึกคู่ค้า"));
    expect(onSaved).toHaveBeenCalledWith("New Co");
    expect(onClose).toHaveBeenCalled();
    const saved = Suppliers.get("new@sup.co.th");
    expect(saved?.company).toBe("New Co");
    expect(saved?.status).toBe("อนุมัติแล้ว");
  });
});
