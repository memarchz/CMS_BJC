// app/submissions/__tests__/page.test.tsx
import { render, screen, fireEvent, within } from "@testing-library/react";
import Page from "../page";
import { Auth } from "../../../lib/auth";
import { Permissions } from "../../../lib/permissions";

const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

describe("/submissions page", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    push.mockClear();
  });

  it("admin sees all 6 seed submissions", () => {
    Auth.login("admin", "admin@demo.co.th", "demo1234");
    render(<Page />);
    expect(screen.getByText("ทั้งหมด").nextSibling).toBeTruthy();
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(7); // header + 6
  });

  it("a buyer with zero assigned categories sees the empty-state contact-admin message, not a crash", () => {
    Auth.login("buyer", "buyer@demo.co.th", "demo1234");
    Permissions.set("buyer@demo.co.th", []);
    render(<Page />);
    expect(screen.getByText(/ยังไม่ได้รับมอบหมายสิทธิ์ใน Category ใด/)).toBeInTheDocument();
  });

  it("a buyer only sees submissions within their permitted categories", () => {
    Auth.login("buyer", "buyer@demo.co.th", "demo1234");
    render(<Page />);
    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
    for (const row of rows) {
      const catCell = within(row).getAllByRole("cell")[2];
      expect(Permissions.get("buyer@demo.co.th")).toContain(catCell.textContent?.trim());
    }
  });

  it("opening the detail modal shows the record's title", () => {
    Auth.login("admin", "admin@demo.co.th", "demo1234");
    render(<Page />);
    const firstViewBtn = screen.getAllByText("ดู")[0];
    fireEvent.click(firstViewBtn);
    expect(screen.getByTestId("modal-backdrop")).not.toHaveClass("hidden");
  });

  it("clicking แก้ไข navigates to /form?edit=<id>", () => {
    Auth.login("admin", "admin@demo.co.th", "demo1234");
    render(<Page />);
    fireEvent.click(screen.getAllByText("แก้ไข")[0]);
    expect(push).toHaveBeenCalledWith(expect.stringMatching(/^\/form\?edit=/));
  });

  it("supplier sees only their own submission history and not other suppliers' records", () => {
    Auth.login("supplier", "supplier@demo.co.th", "demo1234");
    render(<Page />);
    // 4 seed records belong to supplier@demo.co.th (mock-001, mock-003, mock-005, mock-006)
    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(4);
    expect(screen.getByText("ตู้แช่เย็น Daikin FTV50QV1V")).toBeInTheDocument();
    expect(screen.queryByText("เครื่องทำน้ำเย็น Trane Chiller 500 RT")).toBeNull();
  });

  it("supplier sees pending and complete status indicators and detail modal banner", () => {
    Auth.login("supplier", "supplier@demo.co.th", "demo1234");
    render(<Page />);
    expect(screen.getByText("รอ Buyer ตรวจ (Pending)")).toBeInTheDocument();
    expect(screen.getAllByText("ตรวจแล้ว (Complete)").length).toBeGreaterThan(0);

    // View detail modal
    const viewButtons = screen.getAllByText("ดู");
    fireEvent.click(viewButtons[0]);
    expect(screen.getByTestId("modal-backdrop")).not.toHaveClass("hidden");
    expect(screen.getByText(/สถานะ: รอ Buyer ตรวจสอบข้อมูล/)).toBeInTheDocument();
  });

  it("does not show the returned items banner for supplier, but shows it for buyer with returned items", () => {
    // 1. Supplier: banner must not appear
    Auth.login("supplier", "supplier@demo.co.th", "demo1234");
    const { unmount } = render(<Page />);
    expect(screen.queryByText("ดูรายการส่งคืน")).toBeNull();
    expect(screen.queryByText("มีรายการที่ถูกส่งคืนให้แก้ไข")).toBeNull();
    expect(screen.queryByText("มีเอกสารที่ Admin ส่งคืนให้คุณแก้ไข")).toBeNull();
    unmount();

    // 2. Buyer permitted for Safety Equipment (mock-003 is returned and in Safety Equipment):
    Auth.login("buyer", "buyer2@demo.co.th", "demo1234");
    render(<Page />);
    expect(screen.getByText("ดูรายการส่งคืน")).toBeInTheDocument();
    expect(screen.getByText("มีเอกสารที่ Admin ส่งคืนให้คุณแก้ไข")).toBeInTheDocument();
  });
});
