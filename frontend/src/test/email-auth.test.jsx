import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "../context/AuthContext";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import Staff from "../pages/Staff";

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), user: {}, staff: [] }));
vi.mock("../api/client", () => ({ default: { get: mocks.get, post: mocks.post, patch: mocks.patch } }));

function DashboardProbe() {
  const { user, updateProfile } = useAuth();
  return <>
    <p role="status">Signed in as {user?.email}</p>
    <button onClick={() => updateProfile({ email: "changed@example.com" })}>Change profile email</button>
  </>;
}

function mount(path = "/login") {
  return render(<MemoryRouter initialEntries={[path]}><AuthProvider><Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/dashboard" element={<DashboardProbe />} />
    <Route path="/staff" element={<Staff />} />
  </Routes></AuthProvider></MemoryRouter>);
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mocks.user = { id: 1, email: "admin@example.com", first_name: "Test", last_name: "Admin", role: "admin", can_manage: true };
  mocks.staff = [];
  mocks.get.mockImplementation(async (url) => {
    if (url === "/auth/me/") return { data: mocks.user };
    if (url === "/auth/users/") return { data: mocks.staff };
    throw new Error(`Unexpected request ${url}`);
  });
  mocks.post.mockResolvedValue({ data: { access: "access-token", refresh: "refresh-token" } });
  mocks.patch.mockResolvedValue({ data: { ...mocks.user, email: "changed@example.com" } });
  vi.spyOn(window, "alert").mockImplementation(() => {});
  vi.spyOn(window, "confirm").mockReturnValue(true);
});
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });

describe("Integrated email account flows", () => {
  it("signs in through the real AuthProvider using email and the exact password", async () => {
    const user = userEvent.setup();
    mount();
    const email = screen.getByLabelText("Email address");
    expect(email.type).toBe("email");
    expect(screen.queryByLabelText("Username")).toBeNull();
    await user.type(email, "ADMIN@EXAMPLE.COM");
    await user.type(screen.getByLabelText("Password", { exact: true }), "  SafePassword748!  ");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect((await screen.findByRole("status")).textContent).toContain("admin@example.com");
    expect(mocks.post).toHaveBeenCalledWith("/auth/login/", { email: "admin@example.com", password: "  SafePassword748!  " });
    expect(localStorage.getItem("accessToken")).toBe("access-token");
    expect(localStorage.getItem("refreshToken")).toBe("refresh-token");
  });

  it("shows login failure without storing tokens", async () => {
    mocks.post.mockRejectedValueOnce({ response: { status: 401 } });
    const user = userEvent.setup();
    mount();
    await user.type(screen.getByLabelText("Email address"), "missing@example.com");
    await user.type(screen.getByLabelText("Password", { exact: true }), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect((await screen.findByRole("alert")).textContent).toContain("email and password");
    expect(localStorage.getItem("accessToken")).toBeNull();
  });

  it("registers without a username and returns to sign in for approval", async () => {
    const user = userEvent.setup();
    mount("/register");
    expect(screen.queryByLabelText("Username")).toBeNull();
    await user.type(screen.getByLabelText("First name"), "New");
    await user.type(screen.getByLabelText("Last name"), "Account");
    await user.type(screen.getByLabelText("Email address"), "NEW@EXAMPLE.COM");
    await user.type(screen.getByLabelText("Password", { exact: true }), "  RegisterSafe748!  ");
    await user.type(screen.getByLabelText("Confirm password"), "  RegisterSafe748!  ");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    await screen.findByRole("button", { name: "Sign in" });
    expect(mocks.post).toHaveBeenCalledWith("/auth/register/", { email: "new@example.com", first_name: "New", last_name: "Account",
      password: "  RegisterSafe748!  ", password_confirm: "  RegisterSafe748!  " });
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("approve"));
  });

  it("shows email validation errors from registration", async () => {
    mocks.post.mockRejectedValueOnce({ response: { data: { email: ["This email is already used by another account."] } } });
    const user = userEvent.setup();
    mount("/register");
    await user.type(screen.getByLabelText("First name"), "New");
    await user.type(screen.getByLabelText("Last name"), "Account");
    await user.type(screen.getByLabelText("Email address"), "taken@example.com");
    await user.type(screen.getByLabelText("Password", { exact: true }), "RegisterSafe748!");
    await user.type(screen.getByLabelText("Confirm password"), "RegisterSafe748!");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect((await screen.findByRole("alert")).textContent).toContain("already used");
  });

  it("creates staff with email and password and no generated username", async () => {
    localStorage.setItem("accessToken", "existing-token");
    const user = userEvent.setup();
    mount("/staff");
    await user.click(await screen.findByRole("button", { name: "Add staff member" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).queryByLabelText("Username")).toBeNull();
    const email = within(dialog).getByLabelText("Email address");
    expect(email.required).toBe(true);
    await user.type(email, "STAFF@EXAMPLE.COM");
    await user.type(within(dialog).getByLabelText("First name"), "Staff");
    await user.type(within(dialog).getByLabelText("Last name"), "Member");
    await user.type(within(dialog).getByLabelText("Temporary password"), "  StaffSafe748!  ");
    await user.click(within(dialog).getByRole("button", { name: "Create staff account" }));
    await screen.findByText("Staff account created.");
    expect(mocks.post).toHaveBeenCalledWith("/auth/users/", { email: "staff@example.com", first_name: "Staff", last_name: "Member",
      password: "  StaffSafe748!  ", role: "presenter", is_active: true });
  });

  it("displays and searches email when a staff member has no name", async () => {
    localStorage.setItem("accessToken", "existing-token");
    mocks.staff = [{ id: 2, email: "unnamed@example.com", first_name: "", last_name: "", role: "presenter", is_active: true, can_delete: true },
      { id: 3, email: "other@example.com", first_name: "Other", last_name: "Person", role: "presenter", is_active: true, can_delete: true }];
    const user = userEvent.setup();
    mount("/staff");
    await screen.findByRole("combobox", { name: "Role for unnamed@example.com" });
    await user.type(screen.getByLabelText("Search staff by name or email"), "UNNAMED@EXAMPLE");
    expect(screen.queryByText("Other Person")).toBeNull();
    expect(screen.getByRole("combobox", { name: "Role for unnamed@example.com" })).toBeTruthy();
  });

  it("updates the current account in AuthProvider when the login email changes", async () => {
    localStorage.setItem("accessToken", "existing-token");
    const user = userEvent.setup();
    mount("/dashboard");
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("admin@example.com"));
    await user.click(screen.getByRole("button", { name: "Change profile email" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("changed@example.com"));
    expect(mocks.patch).toHaveBeenCalledWith("/auth/me/", { email: "changed@example.com" });
  });
});
