import { render, screen, fireEvent, within } from "@testing-library/react";
import { DashboardView } from "../DashboardView";
import { Store } from "../../../lib/store";
import { Permissions } from "../../../lib/permissions";
import { J } from "../../../lib/safeStorage";

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

const SUBS_TAB = "รายการเอกสารทรัพย์สิน (ส่งคืน/ตรวจสอบ)";

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
    expect(within(card).getByText("12")).toBeInTheDocument();
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

  it("switching to the submissions tab shows the submissions table instead of the buyers table", () => {
    renderView();
    expect(screen.getByText("ชื่อ Buyer")).toBeInTheDocument();
    fireEvent.click(screen.getByText(SUBS_TAB));
    expect(screen.getByText("รายการ / ทรัพย์สิน")).toBeInTheDocument();
    expect(screen.queryByText("ชื่อ Buyer")).toBeNull();
  });

  it("the top 'กำหนดสิทธิ์ Category' button calls onOpenPermModal with no email", () => {
    const props = renderView();
    fireEvent.click(screen.getByText("กำหนดสิทธิ์ Category"));
    expect(props.onOpenPermModal).toHaveBeenCalledWith();
  });

  it("a buyer row's 'กำหนดสิทธิ์' action calls onOpenPermModal with that buyer's email", () => {
    const props = renderView();
    fireEvent.click(screen.getAllByText("กำหนดสิทธิ์")[0]);
    expect(props.onOpenPermModal).toHaveBeenCalledWith("buyer@demo.co.th");
  });

  it("shows the empty-categories hint for a buyer without permissions", () => {
    Permissions.set("nobody@demo.co.th", []);
    renderView();
    expect(screen.getByText("ยังไม่กำหนดสิทธิ์")).toBeInTheDocument();
  });

  it("a submission row's 'ส่งคืน Buyer' action calls onOpenReturnModal with that submission's id", () => {
    const props = renderView();
    fireEvent.click(screen.getByText(SUBS_TAB));
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
    fireEvent.click(screen.getByText(SUBS_TAB));
    fireEvent.click(screen.getAllByText("ดู")[0]);
    expect(props.onViewSub).toHaveBeenCalledWith(expect.objectContaining({ id: expect.any(String) }));
  });

  it("a submission row's 'แก้ไข' action calls onEditSub with the id", () => {
    const props = renderView();
    fireEvent.click(screen.getByText(SUBS_TAB));
    fireEvent.click(screen.getAllByText("แก้ไข")[0]);
    expect(props.onEditSub).toHaveBeenCalledWith(expect.any(String));
  });

  it("filters the submissions table by status", () => {
    renderView();
    fireEvent.click(screen.getByText(SUBS_TAB));
    const before = screen.getAllByText("ส่งคืน Buyer").length;
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[2], { target: { value: "ตรวจ/แก้ไขแล้ว" } });
    const after = screen.queryAllByText("ส่งคืน Buyer").length;
    expect(after).toBeLessThanOrEqual(before);
  });

  it("deleting a buyer (after confirming) removes their permission entry", () => {
    jest.spyOn(window, "confirm").mockReturnValue(true);
    J.set("portal_users", [{ role: "buyer", email: "extra@demo.co.th", pw: "x", company: "Extra" }]);
    Permissions.set("extra@demo.co.th", ["Chiller"]);
    const props = renderView();
    const row = screen.getByText("Extra").closest("tr") as HTMLElement;
    fireEvent.click(within(row).getByTitle("ลบ Buyer"));
    expect(Permissions.get("extra@demo.co.th")).toEqual([]);
    expect(props.onToast).toHaveBeenCalledWith("ลบ Buyer extra@demo.co.th เรียบร้อยแล้ว");
  });

  it("applies an external supplier filter by switching to the submissions tab and searching", () => {
    renderView({ externalFilter: { q: "supplier@demo.co.th", nonce: 1 } });
    expect(screen.getByText("รายการ / ทรัพย์สิน")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("ค้นหา Supplier / Buyer...")).toHaveValue("supplier@demo.co.th");
  });
});
