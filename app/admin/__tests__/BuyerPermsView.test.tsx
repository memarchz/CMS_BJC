import { render, screen, fireEvent, within } from "@testing-library/react";
import { BuyerPermsView } from "../BuyerPermsView";
import { Permissions } from "../../../lib/permissions";
import { J } from "../../../lib/safeStorage";

function renderView(props: Partial<React.ComponentProps<typeof BuyerPermsView>> = {}) {
  const onToast = jest.fn();
  const onBack = jest.fn();
  render(<BuyerPermsView onBack={onBack} onToast={onToast} {...props} />);
  return { onToast, onBack };
}

describe("BuyerPermsView", () => {
  beforeEach(() => localStorage.clear());

  it("selects the first buyer by default and shows their enabled category count", () => {
    Permissions.set("buyer@demo.co.th", ["Chiller", "Fork lift"]);
    renderView();
    expect(screen.getByText("2 จาก 14 หมวดหมู่ (14%)")).toBeInTheDocument();
  });

  it("preselects the buyer passed via initialEmail", () => {
    renderView({ initialEmail: "buyer2@demo.co.th" });
    expect(screen.getByText("2 จาก 14 หมวดหมู่ (14%)")).toBeInTheDocument();
    expect(document.getElementById("full-active-buyer-email")).toHaveTextContent("buyer2@demo.co.th");
  });

  it("clicking a buyer in the list switches the editor to that buyer", () => {
    Permissions.set("buyer3@demo.co.th", ["Chiller"]);
    renderView();
    fireEvent.click(screen.getByText("buyer3@demo.co.th", { selector: "div.truncate" }));
    expect(screen.getByText("1 จาก 14 หมวดหมู่ (7%)")).toBeInTheDocument();
  });

  it("toggling a category card and saving persists the new permission set", () => {
    Permissions.set("buyer@demo.co.th", []);
    const { onToast } = renderView();
    fireEvent.click(screen.getByText("Chiller"));
    expect(screen.getByText("1 จาก 14 หมวดหมู่ (7%)")).toBeInTheDocument();
    fireEvent.click(screen.getByText("บันทึกสิทธิ์ Category"));
    expect(Permissions.get("buyer@demo.co.th")).toContain("Chiller");
    expect(onToast).toHaveBeenCalledWith(expect.stringContaining("(1 หมวด)"));
  });

  it("'เลือกทั้งหมด' enables all 14 categories and 'ยกเลิกทั้งหมด' clears them before saving", () => {
    renderView();
    fireEvent.click(screen.getByText("เลือกทั้งหมด"));
    expect(screen.getByText("14 จาก 14 หมวดหมู่ (100%)")).toBeInTheDocument();
    fireEvent.click(screen.getByText("ยกเลิกทั้งหมด"));
    expect(screen.getByText("0 จาก 14 หมวดหมู่ (0%)")).toBeInTheDocument();
  });

  it("a preset replaces the draft with its category group", () => {
    renderView();
    fireEvent.click(screen.getByText("ไฟฟ้า & ปลอดภัย"));
    expect(screen.getByText("2 จาก 14 หมวดหมู่ (14%)")).toBeInTheDocument();
  });

  it("'คืนค่าเดิม' discards unsaved changes", () => {
    Permissions.set("buyer@demo.co.th", ["Chiller"]);
    renderView();
    fireEvent.click(screen.getByText("เลือกทั้งหมด"));
    fireEvent.click(screen.getByText("คืนค่าเดิม"));
    expect(screen.getByText("1 จาก 14 หมวดหมู่ (7%)")).toBeInTheDocument();
  });

  it("filters the category cards by search text", () => {
    renderView();
    fireEvent.change(screen.getByPlaceholderText("ค้นหาชื่อหมวดหมู่..."), { target: { value: "fork" } });
    expect(screen.getByText("Fork lift").closest("[data-cat]")).not.toHaveClass("hidden");
    expect(screen.getByText("Chiller").closest("[data-cat]")).toHaveClass("hidden");
  });

  it("adding a new buyer by email creates an entry with zero categories and a login account", () => {
    renderView();
    fireEvent.change(screen.getByPlaceholderText("เช่น buyer5@demo.co.th"), {
      target: { value: "NewBuyer@demo.co.th" },
    });
    fireEvent.click(screen.getByText("+ เพิ่ม"));
    expect(Permissions.get("newbuyer@demo.co.th")).toEqual([]);
    expect(J.get<{ email: string }[]>("portal_users", []).some((u) => u.email === "newbuyer@demo.co.th")).toBe(true);
    expect(screen.getByText("0 จาก 14 หมวดหมู่ (0%)")).toBeInTheDocument();
    const list = screen.getByText("newbuyer@demo.co.th", { selector: "div.truncate" });
    expect(list).toBeInTheDocument();
  });

  it("rejects an invalid email with an alert", () => {
    window.alert = jest.fn();
    renderView();
    fireEvent.change(screen.getByPlaceholderText("เช่น buyer5@demo.co.th"), { target: { value: "nope" } });
    fireEvent.click(screen.getByText("+ เพิ่ม"));
    expect(window.alert).toHaveBeenCalled();
  });

  it("deleting the active buyer after confirming removes the permission entry", () => {
    jest.spyOn(window, "confirm").mockReturnValue(true);
    J.set("portal_users", [{ role: "buyer", email: "gone@demo.co.th", pw: "x", company: "Gone Co" }]);
    Permissions.set("gone@demo.co.th", ["Chiller"]);
    renderView({ initialEmail: "gone@demo.co.th" });
    fireEvent.click(screen.getByText("ลบ Buyer นี้ออกจากระบบ"));
    expect(Permissions.get("gone@demo.co.th")).toEqual([]);
  });

  it("'กลับหน้าหลัก' buttons call onBack", () => {
    const { onBack } = renderView();
    fireEvent.click(within(screen.getByRole("heading", { level: 1 }).closest("div.bg-white") as HTMLElement).getByRole("button", { name: "กลับหน้าหลัก" }));
    expect(onBack).toHaveBeenCalled();
  });
});
