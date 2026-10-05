import { renderHook, waitFor } from "@testing-library/react";
import { useRequireAuth } from "../useRequireAuth";
import { Auth } from "../auth";

const push = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: push }),
}));

describe("useRequireAuth", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    push.mockClear();
  });

  it("redirects to /login?role=<first allowed role> when there is no session", async () => {
    const { result } = renderHook(() => useRequireAuth(["buyer", "admin"]));
    expect(result.current).toBeNull();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/login?role=buyer"));
  });

  it("redirects to that role's home when the session role is not allowed", async () => {
    Auth.login("supplier", "supplier@demo.co.th", "demo1234");
    renderHook(() => useRequireAuth(["admin"]));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/form"));
  });

  it("returns the session once it is valid for one of the allowed roles", async () => {
    Auth.login("admin", "admin@demo.co.th", "demo1234");
    const { result } = renderHook(() => useRequireAuth(["buyer", "admin"]));
    await waitFor(() => expect(result.current?.role).toBe("admin"));
    expect(push).not.toHaveBeenCalled();
  });
});
