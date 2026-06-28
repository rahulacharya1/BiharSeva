import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, onClick, className, ...props }) => (
      <div onClick={onClick} className={className} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe("ConfirmDialog Component", () => {
  test("does not render when open is false", () => {
    const { container } = render(
      <ConfirmDialog open={false} onClose={() => {}} onConfirm={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("renders correct elements when open is true", () => {
    render(
      <ConfirmDialog
        open={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Custom Title"
        message="Custom Message text"
        confirmLabel="Custom Confirm"
      />
    );

    expect(screen.getByText("Custom Title")).toBeInTheDocument();
    expect(screen.getByText("Custom Message text")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Custom Confirm" })).toBeInTheDocument();
  });

  test("calls onClose when Cancel button is clicked", () => {
    const handleClose = vi.fn();
    render(<ConfirmDialog open={true} onClose={handleClose} onConfirm={() => {}} />);

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancelButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test("calls onConfirm when Confirm button is clicked", () => {
    const handleConfirm = vi.fn();
    render(<ConfirmDialog open={true} onClose={() => {}} onConfirm={handleConfirm} confirmLabel="Confirm" />);

    const confirmButton = screen.getByRole("button", { name: "Confirm" });
    fireEvent.click(confirmButton);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  test("displays loading state and disables actions", () => {
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        confirmLabel="Delete"
        loading={true}
      />
    );

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    const confirmButton = screen.getByRole("button", { name: /processing/i });

    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();

    // Clicking when loading/disabled should not fire callbacks
    fireEvent.click(cancelButton);
    fireEvent.click(confirmButton);

    expect(handleClose).not.toHaveBeenCalled();
    expect(handleConfirm).not.toHaveBeenCalled();
  });
});
