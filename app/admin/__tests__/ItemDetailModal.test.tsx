import { render, screen, fireEvent } from "@testing-library/react";
import { ItemDetailModal } from "../ItemDetailModal";
import { Store } from "../../../lib/store";

describe("ItemDetailModal", () => {
  beforeEach(() => {
    localStorage.clear();
    Store.resetMock();
  });

  it("renders every non-empty value field as a label/value pair", () => {
    const sub = Store.all()[0];
    render(<ItemDetailModal open={true} onClose={jest.fn()} sub={sub} onReturn={jest.fn()} onEdit={jest.fn()} />);
    expect(document.getElementById("m-t")).toHaveTextContent(sub.title);
    const dts = document.querySelectorAll("dt");
    const expected = Object.values(sub.values).filter((v) => v != null && v !== "").length;
    expect(dts).toHaveLength(expected);
  });

  it("shows the return notice only for returned submissions", () => {
    const sub = Store.all()[0];
    const { rerender } = render(
      <ItemDetailModal open={true} onClose={jest.fn()} sub={{ ...sub, status: "รอ Buyer ตรวจ", returnReason: undefined }} onReturn={jest.fn()} onEdit={jest.fn()} />
    );
    expect(screen.queryByText("เอกสารนี้ถูก Admin ส่งคืนให้ Buyer ตรวจสอบ / แก้ไข")).toBeNull();
    rerender(
      <ItemDetailModal open={true} onClose={jest.fn()} sub={{ ...sub, status: "ส่งคืนให้ Buyer แก้ไข", returnReason: "แก้รูป" }} onReturn={jest.fn()} onEdit={jest.fn()} />
    );
    expect(screen.getByText("เอกสารนี้ถูก Admin ส่งคืนให้ Buyer ตรวจสอบ / แก้ไข")).toBeInTheDocument();
    expect(screen.getByText("แก้รูป")).toBeInTheDocument();
  });

  it("'ส่งคืนให้ Buyer แก้ไข' calls onReturn with the submission id and closes", () => {
    const sub = Store.all()[0];
    const onReturn = jest.fn();
    const onClose = jest.fn();
    render(<ItemDetailModal open={true} onClose={onClose} sub={sub} onReturn={onReturn} onEdit={jest.fn()} />);
    fireEvent.click(screen.getByText("ส่งคืนให้ Buyer แก้ไข"));
    expect(onReturn).toHaveBeenCalledWith(sub.id);
    expect(onClose).toHaveBeenCalled();
  });

  it("'แก้ไขรายการนี้' calls onEdit with the submission id", () => {
    const sub = Store.all()[0];
    const onEdit = jest.fn();
    render(<ItemDetailModal open={true} onClose={jest.fn()} sub={sub} onReturn={jest.fn()} onEdit={onEdit} />);
    fireEvent.click(screen.getByText("แก้ไขรายการนี้"));
    expect(onEdit).toHaveBeenCalledWith(sub.id);
  });

  it("the supplier card's 'ดูโปรไฟล์' opens the supplier profile and closes", () => {
    const sub = { ...Store.all()[0], email: "supplier@demo.co.th" };
    const onViewSupplier = jest.fn();
    const onClose = jest.fn();
    render(<ItemDetailModal open={true} onClose={onClose} sub={sub} onReturn={jest.fn()} onEdit={jest.fn()} onViewSupplier={onViewSupplier} />);
    fireEvent.click(screen.getByText("ดูโปรไฟล์"));
    expect(onViewSupplier).toHaveBeenCalledWith(expect.objectContaining({ code: "SUP-00001" }));
    expect(onClose).toHaveBeenCalled();
  });
});
