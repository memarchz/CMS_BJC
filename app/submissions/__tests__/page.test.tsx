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
});
