import { render, screen, fireEvent } from "@testing-library/react";
import { Modal } from "../Modal";

describe("Modal", () => {
  it("renders nothing visible when open is false", () => {
    render(
      <Modal open={false} onClose={jest.fn()}>
        <p>content</p>
      </Modal>
    );
    expect(screen.getByTestId("modal-backdrop")).toHaveClass("hidden");
  });

  it("renders children when open is true", () => {
    render(
      <Modal open={true} onClose={jest.fn()}>
        <p>content</p>
      </Modal>
    );
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("calls onClose when the backdrop itself is clicked", () => {
    const onClose = jest.fn();
    render(
      <Modal open={true} onClose={onClose}>
        <p>content</p>
      </Modal>
    );
    fireEvent.click(screen.getByTestId("modal-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when the content panel is clicked", () => {
    const onClose = jest.fn();
    render(
      <Modal open={true} onClose={onClose}>
        <p>content</p>
      </Modal>
    );
    fireEvent.click(screen.getByText("content"));
    expect(onClose).not.toHaveBeenCalled();
  });
});
