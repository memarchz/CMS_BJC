import { render, screen, fireEvent } from "@testing-library/react";
import { ReturnModal } from "../ReturnModal";
import { Store } from "../../../lib/store";
import { Auth } from "../../../lib/auth";
import { Permissions } from "../../../lib/permissions";

describe("ReturnModal", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    Store.resetMock();
    Auth.login("admin", "admin@demo.co.th", "demo1234");
  });

  it("preselects the document passed via subId and shows its category", () => {
    const target = Store.all()[1];
    render(<ReturnModal open={true} onClose={jest.fn()} subId={target.id} />);
    expect(screen.getByLabelText(/เลือกรายการเอกสาร/)).toHaveValue(target.id);
    expect(document.getElementById("ret-info-cat")).toHaveTextContent(String(target.values?.category));
  });

  it("pre-selects the buyer whose permissions include the document category", () => {
    Permissions.set("buyer2@demo.co.th", ["Fork lift"]);
    const target = { ...Store.all()[0], id: "fork-1", values: { ...Store.all()[0].values, category: "Fork lift" } };
    Store.put(target);
    render(<ReturnModal open={true} onClose={jest.fn()} subId="fork-1" />);
    expect(screen.getByLabelText(/ระบุ Buyer ผู้รับผิดชอบ/)).toHaveValue("buyer2@demo.co.th");
  });

  it("blocks submission when the reason is blank", () => {
    const target = Store.all()[0];
    window.alert = jest.fn();
    render(<ReturnModal open={true} onClose={jest.fn()} subId={target.id} />);
    fireEvent.change(screen.getByLabelText(/ระบุเหตุผล/), { target: { value: "   " } });
    fireEvent.click(screen.getByText("ยืนยันส่งคืนเอกสาร"));
    expect(window.alert).toHaveBeenCalled();
    expect(Store.all().find((r) => r.id === target.id)?.status).toBe(target.status);
  });

  it("a quick-remark chip fills the reason, and a second chip appends on a new line", () => {
    render(<ReturnModal open={true} onClose={jest.fn()} subId={Store.all()[0].id} />);
    fireEvent.click(screen.getByText("รูปเนมเพลทไม่ชัดเจน"));
    expect(screen.getByLabelText(/ระบุเหตุผล/)).toHaveValue("ขอรูปถ่ายเนมเพลท / Serial ให้ชัดเจน");
    fireEvent.click(screen.getByText("ราคาไม่ตรง PO"));
    expect(screen.getByLabelText(/ระบุเหตุผล/)).toHaveValue(
      "ขอรูปถ่ายเนมเพลท / Serial ให้ชัดเจน\n- ราคาซื้อไม่ตรงกับสัญญาและใบสั่งซื้อ PO ล่าสุด"
    );
  });

  it("confirming persists status, reason, returnedBy, assignedBuyer and history, then closes", () => {
    const target = Store.all()[0];
    const onClose = jest.fn();
    const onDone = jest.fn();
    render(<ReturnModal open={true} onClose={onClose} subId={target.id} onDone={onDone} />);
    fireEvent.change(screen.getByLabelText(/ระบุเหตุผล/), { target: { value: "ขอตรวจสอบเพิ่มเติม" } });
    fireEvent.click(screen.getByText("ยืนยันส่งคืนเอกสาร"));
    const updated = Store.all().find((r) => r.id === target.id) as ReturnType<typeof Store.all>[number] & {
      returnHistory?: unknown[];
    };
    expect(updated.status).toBe("ส่งคืนให้ Buyer แก้ไข");
    expect(updated.returnReason).toBe("ขอตรวจสอบเพิ่มเติม");
    expect(updated.returnedBy).toBe("admin@demo.co.th");
    expect(updated.assignedBuyer).toBeTruthy();
    expect(updated.returnHistory).toHaveLength(1);
    expect(onClose).toHaveBeenCalled();
    expect(onDone).toHaveBeenCalledWith(expect.stringContaining(target.title));
  });
});
