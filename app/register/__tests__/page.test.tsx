// app/register/__tests__/page.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import Page from "../page";

const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

function fillValid() {
  fireEvent.change(screen.getByLabelText(/ชื่อบริษัท/), { target: { value: "Test Co" } });
  fireEvent.change(screen.getByLabelText(/เลขประจำตัวผู้เสียภาษี/), { target: { value: "1234567890123" } });
  fireEvent.change(screen.getByLabelText(/ชื่อผู้ติดต่อ/), { target: { value: "Someone" } });
  fireEvent.change(screen.getByLabelText(/เบอร์โทรศัพท์/), { target: { value: "0211111111" } });
  fireEvent.change(screen.getByLabelText(/^อีเมล/), { target: { value: "unique-reg@sup.co.th" } });
  fireEvent.change(screen.getByLabelText(/^รหัสผ่าน/), { target: { value: "password1" } });
  fireEvent.change(screen.getByLabelText(/ยืนยันรหัสผ่าน/), { target: { value: "password1" } });
}

describe("/register page", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    push.mockClear();
  });

  it("rejects a tax ID that is not exactly 13 digits", () => {
    render(<Page />);
    fillValid();
    fireEvent.change(screen.getByLabelText(/เลขประจำตัวผู้เสียภาษี/), { target: { value: "123" } });
    fireEvent.click(screen.getByText("ลงทะเบียน"));
    expect(screen.getByText(/13 หลัก/)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("rejects a password shorter than 8 characters", () => {
    render(<Page />);
    fillValid();
    fireEvent.change(screen.getByLabelText(/^รหัสผ่าน/), { target: { value: "short" } });
    fireEvent.change(screen.getByLabelText(/ยืนยันรหัสผ่าน/), { target: { value: "short" } });
    fireEvent.click(screen.getByText("ลงทะเบียน"));
    expect(screen.getByText(/อย่างน้อย 8 ตัวอักษร/)).toBeInTheDocument();
  });

  it("rejects mismatched password confirmation", () => {
    render(<Page />);
    fillValid();
    fireEvent.change(screen.getByLabelText(/ยืนยันรหัสผ่าน/), { target: { value: "different" } });
    fireEvent.click(screen.getByText("ลงทะเบียน"));
    expect(screen.getByText(/ไม่ตรงกัน/)).toBeInTheDocument();
  });

  it("registers successfully with valid input and redirects to /form", () => {
    render(<Page />);
    fillValid();
    fireEvent.click(screen.getByText("ลงทะเบียน"));
    expect(push).toHaveBeenCalledWith("/form");
  });
});
