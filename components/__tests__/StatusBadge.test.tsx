import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../StatusBadge";

describe("StatusBadge", () => {
  it("renders the rose 'returned' style for ส่งคืนให้ Buyer แก้ไข", () => {
    render(<StatusBadge status="ส่งคืนให้ Buyer แก้ไข" />);
    expect(screen.getByText("ส่งคืนให้ Buyer แก้ไข")).toHaveClass("text-rose-700");
  });

  it("renders the emerald 'done' style for ตรวจ/แก้ไขแล้ว", () => {
    render(<StatusBadge status="ตรวจ/แก้ไขแล้ว" />);
    expect(screen.getByText("ตรวจ/แก้ไขแล้ว")).toHaveClass("text-emerald-700");
  });

  it("renders the amber 'pending' style for any other status", () => {
    render(<StatusBadge status="รอ Buyer ตรวจ" />);
    expect(screen.getByText("รอ Buyer ตรวจ")).toHaveClass("text-amber-700");
  });
});
