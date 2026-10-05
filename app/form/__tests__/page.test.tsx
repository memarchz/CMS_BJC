// app/form/__tests__/page.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import Page from "../page";
import { Auth } from "../../../lib/auth";
import { Store } from "../../../lib/store";
import { Permissions } from "../../../lib/permissions";

const push = jest.fn();
let searchParamsValue = new URLSearchParams();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: push }),
  useSearchParams: () => searchParamsValue,
}));

window.scrollTo = jest.fn();

describe("/form page", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    push.mockClear();
    searchParamsValue = new URLSearchParams();
  });

  it("supplier sees only the Supplier & สเปค / ประกัน & อะไหล่ / อายุใช้งาน steps, not ทะเบียนทรัพย์สิน", () => {
    Auth.login("supplier", "supplier@demo.co.th", "demo1234");
    render(<Page />);
    expect(screen.queryByText("ทะเบียนทรัพย์สิน")).toBeNull();
    expect(screen.getByText("Supplier & สเปค")).toBeInTheDocument();
  });

  it("selecting a category with no sub-categories disables and clears the Sub Category field", () => {
    Auth.login("buyer", "buyer@demo.co.th", "demo1234");
    render(<Page />);
    fireEvent.change(screen.getByLabelText(/^Category/), { target: { value: "Chiller" } });
    expect(screen.getByLabelText(/Sub Category/)).toBeDisabled();
  });

  it("selecting a category that hides fields removes them from the DOM", () => {
    Auth.login("buyer", "buyer3@demo.co.th", "demo1234");
    render(<Page />);
    expect(screen.getByLabelText(/Utility Requirement/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/^Category/), { target: { value: "Super Equipment" } });
    expect(screen.queryByLabelText(/Utility Requirement/)).toBeNull();
  });

  it("a field hidden by a category switch does not block submission, even if it was marked bad first", () => {
    Auth.login("buyer", "buyer3@demo.co.th", "demo1234");
    render(<Page />);
    // Pick a category where Utility Requirement is visible and required-ish, trigger a failed
    // submit so it (and others) get marked bad, then switch to a category that hides it.
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByText(/ถัดไป/));
    fireEvent.click(screen.getByText(/ส่งข้อมูล/));
    expect(screen.getByText(/ยังขาดช่องบังคับ/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByText(/ทะเบียนทรัพย์สิน|Supplier & สเปค/)[0]);
    fireEvent.change(screen.getByLabelText(/^Category/), { target: { value: "Super Equipment" } });
    // Utility Requirement is hidden for Super Equipment (lib/catalog.ts HIDE) — it must no
    // longer be in the DOM, and therefore cannot still be counted as a blocking required field.
    expect(screen.queryByLabelText(/Utility Requirement/)).toBeNull();
  });

  it("a buyer with zero assigned categories sees only the placeholder option in the Category select, not a crash", () => {
    Auth.login("buyer", "buyer@demo.co.th", "demo1234");
    Permissions.set("buyer@demo.co.th", []);
    render(<Page />);
    const options = screen.getByLabelText(/^Category/).querySelectorAll("option");
    expect(options).toHaveLength(1);
    expect(options[0].textContent).toBe("-- เลือก --");
  });

  it("autofill() fills every field from the demo record S", () => {
    Auth.login("buyer", "buyer@demo.co.th", "demo1234");
    render(<Page />);
    fireEvent.click(screen.getByText("กรอกอัตโนมัติ"));
    expect(screen.getByDisplayValue("ตู้แช่เย็น Daikin")).toBeInTheDocument();
  });

  it("submit() blocks when a required field is empty and marks it bad", () => {
    Auth.login("buyer", "buyer@demo.co.th", "demo1234");
    render(<Page />);
    // advance to the last step without filling anything
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByText(/ถัดไป/));
    fireEvent.click(screen.getByText(/ส่งข้อมูล/));
    expect(screen.getByText(/ยังขาดช่องบังคับ/)).toBeInTheDocument();
  });

  it("a buyer opening ?edit=<id> for a submission outside their permitted category is blocked and not shown the form", () => {
    Store.resetMock();
    const outOfScope = Store.all().find((r) => r.values?.category === "Super Equipment");
    searchParamsValue = new URLSearchParams(`edit=${outOfScope?.id}`);
    Auth.login("buyer", "buyer@demo.co.th", "demo1234"); // buyer@demo has no Super Equipment permission
    jest.spyOn(window, "alert").mockImplementation(() => {});
    render(<Page />);
    expect(window.alert).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/submissions");
  });
});
