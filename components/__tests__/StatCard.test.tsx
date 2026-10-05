import { render, screen, fireEvent } from "@testing-library/react";
import { StatCard } from "../StatCard";

describe("StatCard", () => {
  it("renders the label and value", () => {
    render(<StatCard label="ทั้งหมด" value={12} />);
    expect(screen.getByText("ทั้งหมด")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("renders an action link and fires onAction when clicked", () => {
    const onAction = jest.fn();
    render(
      <StatCard label="รออนุมัติ" value={2} actionLabel="ดูรายละเอียด" onAction={onAction} />
    );
    fireEvent.click(screen.getByText("ดูรายละเอียด"));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("renders no action link when actionLabel is omitted", () => {
    render(<StatCard label="ทั้งหมด" value={12} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
