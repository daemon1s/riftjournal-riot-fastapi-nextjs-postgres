import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import LoginModal from "./LoginModal";

vi.mock("../services/api", () => ({
  login: vi.fn(),
}));

describe("LoginModal", () => {
  it("renders when isOpen is true", () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();
    render(<LoginModal isOpen={true} onClose={handleClose} onSuccess={handleSuccess} />);
    expect(screen.getByPlaceholderText("••••••••••••")).toBeDefined();
  });

  it("does not render when isOpen is false", () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();
    const { container } = render(<LoginModal isOpen={false} onClose={handleClose} onSuccess={handleSuccess} />);
    expect(container.firstChild).toBeNull();
  });
});
