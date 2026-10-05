import { render, screen } from "@testing-library/react";
import Page from "../page";
import { Auth } from "../../lib/auth";

describe("/ index page", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("renders the three role cards", () => {
    render(<Page />);
    expect(screen.getByText("Supplier")).toBeInTheDocument();
    expect(screen.getByText("Buyer")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("hides the session banner when logged out", () => {
    render(<Page />);
    expect(screen.getByTestId("session-banner")).toHaveClass("hidden");
  });

  it("shows the session banner with the user's name and role when logged in", () => {
    Auth.login("admin", "admin@demo.co.th", "demo1234");
    render(<Page />);
    expect(screen.getByTestId("session-banner")).not.toHaveClass("hidden");
    expect(screen.getByTestId("session-user").textContent).toContain("Admin");
  });
});
