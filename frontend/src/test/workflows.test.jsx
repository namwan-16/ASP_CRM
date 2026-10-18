import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  updateProfile: vi.fn(),
  clearSession: vi.fn(),
  download: vi.fn(),
  user: {
    id: 1,
    first_name: "QA",
    last_name: "Admin",
    email: "admin@example.test",
    role: "admin",
    can_manage: true,
  },
}));
vi.mock("../api/client", () => ({
  default: { get: mocks.get, post: mocks.post, patch: mocks.patch },
}));
vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: mocks.user,
    updateProfile: mocks.updateProfile,
    clearSession: mocks.clearSession,
  }),
}));
vi.mock("../api/crm", async (importOriginal) => ({
  ...(await importOriginal()),
  download: mocks.download,
}));
import Profile from "../pages/Profile";
import Classes from "../pages/Classes";
import Attendance from "../pages/Attendance";
import EmergencyLookup from "../pages/EmergencyLookup";
import Reports from "../pages/Reports";

const students = [
  {
    id: 1,
    first_name: "Ava",
    last_name: "Example",
    year_level: "Year 7",
    is_active: true,
  },
  {
    id: 2,
    first_name: "Noah",
    last_name: "Example",
    year_level: "Year 8",
    is_active: true,
  },
];
const staff = [
  {
    id: 11,
    first_name: "Test",
    last_name: "Presenter",
    role: "presenter",
    is_active: true,
  },
  {
    id: 12,
    first_name: "Test",
    last_name: "Assistant",
    role: "assistant",
    is_active: true,
  },
];
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const date = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
const session = {
  id: 21,
  course: 1,
  course_name: "Mathematics",
  date,
  start_time: "16:00:00",
  end_time: "17:00:00",
  room: "One",
  capacity: 20,
  presenter: 11,
  presenter_name: "Test Presenter",
  assistant: 12,
  assistant_name: "Test Assistant",
  students: [2],
  status: "scheduled",
  has_history: true,
};
function mount(element, entries = ["/"]) {
  return render(
    <MemoryRouter initialEntries={entries}>{element}</MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.post.mockResolvedValue({ data: { saved: 1 } });
  mocks.updateProfile.mockResolvedValue({});
  mocks.download.mockResolvedValue();
  mocks.get.mockImplementation(async (url) => {
    if (url === "/courses/")
      return { data: [{ id: 1, name: "Mathematics", is_active: true }] };
    if (url === "/auth/users/") return { data: staff };
    if (url === "/students/") return { data: students };
    if (url === "/sessions/") return { data: [session] };
    if (url.endsWith("/status-history/")) return { data: [] };
    throw new Error(`Unexpected test request ${url}`);
  });
});
afterEach(cleanup);

describe("Connected CRM workflows", () => {
  it("saves profile details and reports server errors", async () => {
    const user = userEvent.setup();
    mount(<Profile />);
    await user.clear(screen.getByLabelText("First name"));
    await user.type(screen.getByLabelText("First name"), "Nam");
    await user.click(screen.getByRole("button", { name: "Save profile" }));
    await screen.findByText("Your profile has been saved.");
    expect(mocks.updateProfile).toHaveBeenCalledWith({
      first_name: "Nam",
      last_name: "Admin",
      email: "admin@example.test",
    });
    mocks.updateProfile.mockRejectedValueOnce({
      response: { data: { email: ["Email already used."] } },
    });
    await user.click(screen.getByRole("button", { name: "Save profile" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Email already used",
    );
  });

  it("submits password changes and clears the local session", async () => {
    const user = userEvent.setup();
    mount(<Profile />);
    await user.type(
      screen.getByLabelText("Current password"),
      "OriginalSafePass784!",
    );
    await user.type(
      screen.getByLabelText("New password", { exact: true }),
      "NewSafePass542!",
    );
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "NewSafePass542!",
    );
    await user.click(screen.getByRole("button", { name: "Change password" }));
    await waitFor(() => expect(mocks.clearSession).toHaveBeenCalled());
    expect(mocks.post).toHaveBeenCalledWith("/auth/change-password/", {
      current_password: "OriginalSafePass784!",
      new_password: "NewSafePass542!",
      new_password_confirm: "NewSafePass542!",
    });
  });

  it("checks conflicts before creating and assigns presenter/assistant/roster", async () => {
    const user = userEvent.setup();
    mount(<Classes />);
    await screen.findByRole("button", { name: "View", exact: true });
    await user.click(screen.getByRole("button", { name: "Create class" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(dialog.querySelector('select[name="course"]'), {
      target: { value: "1" },
    });
    await user.type(
      within(dialog).getByLabelText("Room", { exact: true }),
      "Two",
    );
    await user.selectOptions(
      within(dialog).getByLabelText("Presenter", { exact: true }),
      "11",
    );
    await user.selectOptions(
      within(dialog).getByLabelText("Assistant (optional)"),
      "12",
    );
    await user.click(screen.getByRole("checkbox", { name: /Ava Example/ }));
    fireEvent.submit(dialog.querySelector("form"));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "overlaps",
    );
    expect(mocks.post).not.toHaveBeenCalled();
    fireEvent.change(within(dialog).getByLabelText("Start time"), {
      target: { value: "17:00" },
    });
    fireEvent.change(within(dialog).getByLabelText("End time"), {
      target: { value: "18:00" },
    });
    fireEvent.submit(dialog.querySelector("form"));
    await waitFor(() =>
      expect(mocks.post).toHaveBeenCalledWith(
        "/sessions/",
        expect.objectContaining({
          presenter: 11,
          assistant: 12,
          students: [1],
          start_time: "17:00",
        }),
      ),
    );
  });

  it("offers cancellation/archive instead of a delete button", async () => {
    const user = userEvent.setup();
    mount(<Classes />);
    await user.click(
      await screen.findByRole("button", { name: "View", exact: true }),
    );
    expect(screen.queryByRole("button", { name: "Delete class" })).toBeNull();
    await user.type(
      screen.getByLabelText("Reason (optional)"),
      "Presenter away",
    );
    await user.click(screen.getByRole("button", { name: "Cancel session" }));
    await waitFor(() =>
      expect(mocks.post).toHaveBeenCalledWith("/sessions/21/cancel/", {
        reason: "Presenter away",
      }),
    );
  });

  it("shows archived attendance as read-only", async () => {
    mocks.get.mockImplementation(async (url) => {
      if (url === "/sessions/")
        return { data: [{ ...session, status: "archived" }] };
      if (url === "/sessions/21/roster/")
        return {
          data: {
            session: { ...session, status: "archived" },
            students: [
              {
                id: 1,
                name: "Ava Example",
                year_level: "Year 7",
                status: "present",
                notes: "",
                attendance_id: 1,
              },
            ],
          },
        };
      throw new Error(url);
    });
    mount(<Attendance />, ["/attendance?session=21"]);
    await screen.findByText(/Attendance history is read-only/);
    expect(screen.getByLabelText("Attendance for Ava Example").disabled).toBe(
      true,
    );
    expect(
      screen.getByRole("button", { name: "Save attendance" }).disabled,
    ).toBe(true);
  });

  it("searches the emergency API and loads only the chosen student's contacts", async () => {
    mocks.get.mockImplementation(async (url) => {
      if (url === "/emergency-lookup/")
        return { data: { results: [students[0]], count: 1 } };
      if (url === "/students/1/emergency-contacts/")
        return {
          data: {
            student: students[0],
            contacts: [
              {
                id: 1,
                relationship: "Mother",
                is_primary_contact: true,
                guardian_details: {
                  first_name: "Test",
                  last_name: "Guardian",
                  phone: "0400000001",
                },
              },
            ],
          },
        };
      throw new Error(url);
    });
    const user = userEvent.setup();
    mount(<EmergencyLookup />);
    expect(mocks.get).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText("Student name or ID"), "Ava");
    await user.click(
      await screen.findByRole("button", { name: /Ava Example/ }),
    );
    const call = await screen.findByRole("link", { name: "Call guardian" });
    expect(call.getAttribute("href")).toBe("tel:0400000001");
    expect(mocks.get).toHaveBeenCalledWith(
      "/students/1/emergency-contacts/",
      expect.anything(),
    );
  });

  it("requests server-generated reports and exports using the current filters", async () => {
    mocks.get.mockImplementation(async (url) => {
      if (url === "/courses/")
        return { data: [{ id: 1, name: "Mathematics" }] };
      if (url.startsWith("/reports/summary/"))
        return {
          data: {
            count: 1,
            columns: [{ key: "course", label: "Class" }],
            results: [{ course: "Mathematics" }],
            stats: [{ label: "Unmarked roster places", value: 2 }],
          },
        };
      throw new Error(url);
    });
    const user = userEvent.setup();
    mount(<Reports />);
    await screen.findByText("Unmarked roster places");
    await user.click(screen.getByRole("tab", { name: "Late arrivals" }));
    await waitFor(() =>
      expect(mocks.get).toHaveBeenCalledWith(
        expect.stringContaining("kind=late-arrivals"),
        expect.anything(),
      ),
    );
    await user.click(screen.getByRole("button", { name: "Export CSV" }));
    await waitFor(() =>
      expect(mocks.download).toHaveBeenCalledWith(
        "/reports/summary/?kind=late-arrivals&export=csv",
        "late-arrivals-report.csv",
      ),
    );
  });
});
