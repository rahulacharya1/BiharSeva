import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import { PasswordInput } from "./PasswordInput";

describe("PasswordInput Component", () => {
  test("renders input of type password by default", () => {
    render(<PasswordInput value="" onChange={() => {}} placeholder="Enter password" />);
    const input = screen.getByPlaceholderText("Enter password");
    expect(input).toBeInTheDocument();
    expect(input.type).toBe("password");
  });

  test("toggles input visibility when eye button is clicked", () => {
    render(<PasswordInput value="" onChange={() => {}} placeholder="Enter password" />);
    const input = screen.getByPlaceholderText("Enter password");
    const button = screen.getByRole("button", { name: /show password/i });

    expect(input.type).toBe("password");
    expect(button).toBeInTheDocument();

    // Click to show password
    fireEvent.click(button);
    expect(input.type).toBe("text");
    expect(screen.getByRole("button", { name: /hide password/i })).toBeInTheDocument();

    // Click again to hide password
    fireEvent.click(screen.getByRole("button", { name: /hide password/i }));
    expect(input.type).toBe("password");
  });

  test("passes down html attributes correctly", () => {
    const handleChange = vi.fn();
    render(
      <PasswordInput
        value="secret"
        onChange={handleChange}
        placeholder="Password"
        name="test-password"
        id="test-id"
        required={true}
      />
    );

    const input = screen.getByPlaceholderText("Password");
    expect(input.value).toBe("secret");
    expect(input).toHaveAttribute("name", "test-password");
    expect(input).toHaveAttribute("id", "test-id");
    expect(input).toBeRequired();

    fireEvent.change(input, { target: { value: "new-secret" } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });
});
