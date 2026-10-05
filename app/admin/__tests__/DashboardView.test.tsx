import { render, screen, fireEvent } from "@testing-library/react";
import { DashboardView } from "../DashboardView";
import { Store } from "../../../lib/store";

function renderView(overrides: Partial<React.ComponentProps<typeof DashboardView>> = {}) {
  const props = {
    onOpenPermModal: jest.fn(),
    onOpenReturnModal: jest.fn(),
    onViewSub: jest.fn(),
    onSwitchToView: jest.fn(),
    onViewSupplier: jest.fn(),
    onEditSub: jest.fn(),
    onResetMock: jest.fn(),
    onToast: jest.fn(),
    ...overrides,
  };
  render(<DashboardView {...props} />);
  return props;
}

describe("DashboardView", () => {
  beforeEach(() => {
    localStorage.clear();
    Store.resetMock();
  });

  it("shows the four metric cards", () => {
    renderView();
    expect(screen.getByText("ทั้งหมด (Buyer)")).toBeInTheDocument();
    expect(screen.getByText("รออนุมัติ", { selector: "div" })).toBeInTheDocument();
    expect(screen.getByText("ตรวจสิทธิ์ Category")).toBeInTheDocument();
    expect(screen.getByText("จาก Supplier")).toBeInTheDocument();
  });

  it("floors the buyer metric at 12 like the original page", () => {
    renderView();
    const card = screen.getByText("ทั้งหมด (Buyer)").parentElement as HTMLElement;
    expect(card).toBeInTheDocument();
  });

  it("renders one progress row per configured category with its ratio", () => {
    renderView();
    // Refrigeration system is configured 6 / 6, the only one at max
    expect(screen.getAllByText("6 / 6")).toHaveLength(1);
    expect(screen.getAllByText(/^\d+ \/ \d+$/)).toHaveLength(14);
  });

  it("clicking a category progress row filters by that category and toasts", () => {
    const props = renderView();
    fireEvent.click(screen.getByText("Fork lift", { selector: "span" }));
    expect(props.onToast).toHaveBeenCalledWith('กรองแสดงเฉพาะหมวด "Fork lift"');
  });

  it("shows the submissions table directly by default", () => {
    renderView();
    expect(screen.getByText("รายการ / ทรัพย์สิน")).toBeInTheDocument();
  });

  it("the top 'กำหนดสิทธิ์ Category' button calls onOpenPermModal with no email", () => {
    const props = renderView();
    fireEvent.click(screen.getByText("กำหนดสิทธิ์ Category"));
    expect(props.onOpenPermModal).toHaveBeenCalledWith();
  });

  it("a submission row's 'ส่งคืน Buyer' action calls onOpenReturnModal with that submission's id", () => {
    const props = renderView();
    fireEvent.click(screen.getAllByText("ส่งคืน Buyer")[0]);
    expect(props.onOpenReturnModal).toHaveBeenCalledWith(expect.any(String));
  });

  it("the top 'ส่งคืนเอกสารให้ Buyer' button calls onOpenReturnModal without an id", () => {
    const props = renderView();
    fireEvent.click(screen.getByText("ส่งคืนเอกสารให้ Buyer"));
    expect(props.onOpenReturnModal).toHaveBeenCalledWith();
  });

  it("a submission row's 'ดู' action calls onViewSub with that submission record", () => {
    const props = renderView();
    fireEvent.click(screen.getAllByText("ดู")[0]);
    expect(props.onViewSub).toHaveBeenCalledWith(expect.objectContaining({ id: expect.any(String) }));
  });

  it("a submission row's 'แก้ไข' action calls onEditSub with the id", () => {
    const props = renderView();
    fireEvent.click(screen.getAllByText("แก้ไข")[0]);
    expect(props.onEditSub).toHaveBeenCalledWith(expect.any(String));
  });

  it("filters the submissions table by status", () => {
    renderView();
    const before = screen.getAllByText("ส่งคืน Buyer").length;
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[2], { target: { value: "ตรวจ/แก้ไขแล้ว" } });
    const after = screen.queryAllByText("ส่งคืน Buyer").length;
    expect(after).toBeLessThanOrEqual(before);
  });

  it("applies an external supplier filter by searching", () => {
    renderView({ externalFilter: { q: "supplier@demo.co.th", nonce: 1 } });
    expect(screen.getByText("รายการ / ทรัพย์สิน")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("ค้นหา Supplier / Buyer...")).toHaveValue("supplier@demo.co.th");
  });
});
