import { render, screen } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";
import { Toast } from "../Toast";
import { useToast } from "../../lib/useToast";

describe("Toast", () => {
  it("renders nothing visible when visible is false", () => {
    render(<Toast message="" visible={false} />);
    expect(screen.getByTestId("toast")).toHaveClass("hidden");
  });

  it("shows the message text when visible is true", () => {
    render(<Toast message="Saved!" visible={true} />);
    expect(screen.getByTestId("toast")).not.toHaveClass("hidden");
    expect(screen.getByText("Saved!")).toBeInTheDocument();
  });
});

describe("useToast", () => {
  jest.useFakeTimers();

  it("shows a message then auto-hides after 2200ms", () => {
    const { result } = renderHook(() => useToast());
    act(() => result.current.show("Hello"));
    expect(result.current.visible).toBe(true);
    expect(result.current.message).toBe("Hello");
    act(() => jest.advanceTimersByTime(2200));
    expect(result.current.visible).toBe(false);
  });
});
