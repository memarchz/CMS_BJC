// app/login/__tests__/page.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import Page from "../page";

const push = jest.fn();
let searchParams = new URLSearchParams();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => searchParams,
}));

describe("/login page", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    push.mockClear();
    searchParams = new URLSearchParams();
  });

  it("defaults to the supplier tab and pre-fills supplier demo credentials", () => {
    render(<Page />);
    expect(screen.getByDisplayValue("supplier@demo.co.th")).toBeInTheDocument();
  });

  it("honors ?role=admin from the query string", () => {
    searchParams = new URLSearchParams("role=admin");
    render(<Page />);
    expect(screen.getByDisplayValue("admin@demo.co.th")).toBeInTheDocument();
  });

  it("pre-fills buyer demo credentials when the buyer tab is active", () => {
    render(<Page />);
    fireEvent.click(screen.getByText("Buyer"));
    expect(screen.getByDisplayValue("buyer@demo.co.th")).toBeInTheDocument();
  });

  it("logs in successfully and redirects to the role's home route", () => {
    render(<Page />);
    fireEvent.click(screen.getByRole("button", { name: /เข้าสู่ระบบ Supplier/ }));
    expect(push).toHaveBeenCalledWith("/form");
  });

  it("shows an error and does not redirect on wrong credentials", () => {
    render(<Page />);
    fireEvent.change(screen.getByPlaceholderText("email@company.com"), {
      target: { value: "nope@demo.co.th" },
    });
    fireEvent.click(screen.getByRole("button", { name: /เข้าสู่ระบบ Supplier/ }));
    expect(screen.getByText("อีเมลหรือรหัสผ่านไม่ถูกต้อง")).not.toHaveClass("hidden");
    expect(push).not.toHaveBeenCalled();
  });
});
