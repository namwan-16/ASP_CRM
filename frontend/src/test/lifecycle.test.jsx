import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(),
  user: { id: 100, role: "admin", can_manage: true }, data: {} }));
vi.mock("../api/client", () => ({ default: { get: mocks.get, post: mocks.post, patch: mocks.patch, delete: mocks.delete } }));
vi.mock("../context/AuthContext", () => ({ useAuth: () => ({ user: mocks.user }) }));
import Students from "../pages/Students";
import Guardians from "../pages/Guardians";
import Subjects from "../pages/Subjects";
import Staff from "../pages/Staff";
import ProgressNotes from "../pages/ProgressNotes";
import Attendance from "../pages/Attendance";
import Reports from "../pages/Reports";
import Enrolments from "../components/Enrolments";

const student = (id) => ({ id, first_name: `Student${id}`, last_name: "Example", date_of_birth: "2013-01-15", school: "School",
  year_level: "Year 7", is_active: true, guardians: [], subject_id: 1, subject: "Biology", email: "", phone: "", can_delete: false });
const guardian = (id) => ({ id, first_name: `Guardian${id}`, last_name: "Example", phone: `040000000${id}`, email: "", can_delete: false,
  students: [{ id: id + 10, student: 1, name: "Student1 Example", relationship: "Mother", is_primary_contact: true, is_emergency_contact: true }] });
const course = (id) => ({ id, name: `Subject${id}`, is_active: true, can_delete: true });
const staff = (id) => ({ id, email: `staff${id}@example.test`, first_name: `Staff${id}`, last_name: "Example", role: "presenter", is_active: true, can_delete: true });
const note = (id) => ({ id, student: 1, student_name: "Student1 Example", text: `Note${id}`, date: "2026-10-01", author: id === 1 ? 100 : 200, author_name: "Presenter", is_deleted: false });
function mount(component, entries = ["/"]) { return render(<MemoryRouter initialEntries={entries}>{component}</MemoryRouter>); }
beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(mocks.user, { id: 100, role: "admin", can_manage: true });
  mocks.data = { "/students/": [student(1), student(2)], "/guardians/": [guardian(1)],
    "/courses/": [{ ...course(1), name: "Biology" }, { ...course(2), name: "Music" }, { ...course(3), name: "Old Subject", is_active: false }],
    "/auth/users/": [staff(1)], "/sessions/": [], "/progress-notes/": [note(1), note(2)],
    "/registrations/": [{ id: 1, student: 1, student_name: "Student1 Example", course: 1, course_name: "Biology", is_active: false }] };
  mocks.get.mockImplementation(async (url) => {
    const base = url.split("?")[0];
    if (base in mocks.data) return { data: mocks.data[base] };
    throw new Error(`Unexpected URL ${url}`);
  });
  mocks.post.mockResolvedValue({ data: { saved: 2 } });
  mocks.patch.mockResolvedValue({ data: {} });
  mocks.delete.mockResolvedValue({});
  vi.spyOn(window, "confirm").mockReturnValue(true);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("Lifecycle controls and pagination", () => {
  it.each([
    ["students", Students, "/students/", student, "Student table pages", "Search students"],
    ["guardians", Guardians, "/guardians/", guardian, "Guardian table pages", "Search guardians"],
    ["subjects", Subjects, "/courses/", course, "Subject table pages", "Search subjects"],
    ["staff", Staff, "/auth/users/", staff, "Staff table pages", "Search staff by name or email"],
    ["notes", ProgressNotes, "/progress-notes/", note, "Progress note pages", "Search progress notes"],
  ])("shows five %s per page and resets after filtering", async (_, Component, endpoint, makeRow, pageLabel, searchLabel) => {
    mocks.data[endpoint] = Array.from({ length: 6 }, (_, i) => makeRow(i + 1));
    const user = userEvent.setup();
    mount(<Component />);
    const pager = await screen.findByRole("navigation", { name: pageLabel });
    await waitFor(() => expect(pager.textContent).toContain("Showing 1–5 of 6"));
    const table = screen.queryByRole("table");
    if (table) expect(within(table).getAllByRole("row")).toHaveLength(6);
    await user.click(within(pager).getByRole("button", { name: "Next" }));
    expect(pager.textContent).toContain("Showing 6–6 of 6");
    if (table) expect(within(table).getAllByRole("row")).toHaveLength(2);
    await user.type(screen.getByLabelText(searchLabel), "1");
    expect(pager.textContent).toContain("Page 1 of");
    expect(within(pager).getByRole("button", { name: "Previous" }).disabled).toBe(true);
  });

  it("renders guardian phone and links from the API, then preserves other links when editing", async () => {
    mocks.data["/guardians/"][0].students.push({ id: 12, student: 2, name: "Student2 Example", relationship: "Aunt", is_primary_contact: false, is_emergency_contact: true });
    const user = userEvent.setup();
    mount(<Guardians />);
    expect((await screen.findByRole("link", { name: "0400000001" })).getAttribute("href")).toBe("tel:0400000001");
    expect(screen.getByText(/Student1 Example \(Mother, emergency/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Edit Guardian1 Example" }));
    const dialog = screen.getByRole("dialog");
    const first = within(dialog).getByRole("checkbox", { name: "Student1 Example (ASP-1)" });
    expect(first.checked).toBe(true);
    expect(within(dialog).getByRole("checkbox", { name: "Student2 Example (ASP-2)" }).checked).toBe(true);
    await user.click(first);
    await user.clear(within(dialog).getByLabelText("Phone number"));
    await user.type(within(dialog).getByLabelText("Phone number"), "0400000009");
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(mocks.patch).toHaveBeenCalledWith("/guardians/1/", expect.objectContaining({ phone: "0400000009",
      links: [{ student: 2, relationship: "Aunt", is_primary_contact: false, is_emergency_contact: true }] })));
    await screen.findByText("Guardian details and student links updated.");
  });

  it("blocks linked guardian deletion and shows a confirmation for an unused guardian", async () => {
    const user = userEvent.setup();
    mount(<Guardians />);
    await user.click(await screen.findByRole("button", { name: "View Guardian1 Example" }));
    expect(screen.getByRole("button", { name: "Delete permanently" }).disabled).toBe(true);
    cleanup();
    mocks.data["/guardians/"] = [{ ...guardian(1), students: [], can_delete: true }];
    mount(<Guardians />);
    await user.click(await screen.findByRole("button", { name: "View Guardian1 Example" }));
    window.confirm.mockReturnValueOnce(false);
    await user.click(screen.getByRole("button", { name: "Delete permanently" }));
    expect(mocks.delete).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Delete permanently" }));
    await waitFor(() => expect(mocks.delete).toHaveBeenCalledWith("/guardians/1/"));
    await screen.findByText("Unused guardian permanently deleted.");
    await user.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(screen.queryByText("Unused guardian permanently deleted.")).toBeNull();
  });

  it("loads new student subject choices from the database and sends the subject ID", async () => {
    const user = userEvent.setup();
    mount(<Students />);
    await screen.findByText("Student1 Example");
    await user.click(screen.getByRole("button", { name: "Add student" }));
    const dialog = screen.getByRole("dialog");
    const select = within(dialog).getByLabelText("Subject");
    expect(within(select).getByRole("option", { name: "Music" })).toBeTruthy();
    expect(within(select).queryByRole("option", { name: "Old Subject" })).toBeNull();
    expect(within(select).queryByRole("option", { name: "Mathematics" })).toBeNull();
    fireEvent.change(dialog.querySelector('[name="firstName"]'), { target: { value: "New" } });
    fireEvent.change(dialog.querySelector('[name="lastName"]'), { target: { value: "Student" } });
    fireEvent.change(dialog.querySelector('[name="date_of_birth"]'), { target: { value: "2013-01-15" } });
    await user.selectOptions(select, "2");
    fireEvent.submit(dialog.querySelector("form"));
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith("/students/", expect.objectContaining({ subject_id: 2 })));
  });

  it("offers deactivation for a student with history and reactivation for an inactive student", async () => {
    const user = userEvent.setup();
    mount(<Students />);
    await user.click(await screen.findByRole("button", { name: "View Student1 Example" }));
    expect(screen.getByRole("button", { name: "Delete permanently" }).disabled).toBe(true);
    await user.click(screen.getByRole("button", { name: "Deactivate" }));
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith("/students/1/deactivate/"));
    cleanup();
    mocks.data["/students/"] = [{ ...student(1), is_active: false }];
    mount(<Students />);
    await user.selectOptions(screen.getByLabelText("Filter by student status"), "inactive");
    await user.click(await screen.findByRole("button", { name: "View Student1 Example" }));
    await user.click(screen.getByRole("button", { name: "Reactivate" }));
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith("/students/1/reactivate/"));
  });

  it("allows presenters to browse subjects without management controls", async () => {
    Object.assign(mocks.user, { role: "presenter", can_manage: false });
    mount(<Subjects />);
    await screen.findByText("Biology");
    for (const name of ["Add subject", "Edit", "Archive", "Reactivate", "Delete permanently"])
      expect(screen.queryByRole("button", { name })).toBeNull();
  });

  it("keeps attendance edits across pages and saves all edited rows", async () => {
    mocks.data["/sessions/"] = [{ id: 1, course_name: "Biology", date: "2026-10-01", start_time: "16:00:00", room: "One", status: "scheduled" }];
    const roster = Array.from({ length: 6 }, (_, i) => ({ id: i + 1, name: `Student${i + 1}`, status: "", notes: "", year_level: "Year 7" }));
    const baseGet = mocks.get.getMockImplementation();
    mocks.get.mockImplementation((url, options) => url === "/sessions/1/roster/" ? Promise.resolve({ data: { session: { status: "scheduled" }, students: roster } }) : baseGet(url, options));
    const user = userEvent.setup();
    mount(<Attendance />, ["/attendance?session=1"]);
    await user.selectOptions(await screen.findByLabelText("Attendance for Student1"), "present");
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.selectOptions(screen.getByLabelText("Attendance for Student6"), "late");
    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByLabelText("Attendance for Student1").value).toBe("present");
    await user.click(screen.getByRole("button", { name: "Save attendance" }));
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith("/sessions/1/attendance/", { records: [
      { student: 1, status: "present", notes: "" }, { student: 6, status: "late", notes: "" },
    ] }));
  });

  it("shows backend deletion errors for staff and allows dismissing them", async () => {
    mocks.delete.mockRejectedValue({ response: { data: { detail: "This account has class history. Deactivate it instead." } } });
    const user = userEvent.setup();
    mount(<Staff />);
    await user.click(await screen.findByRole("button", { name: "Delete permanently" }));
    expect((await screen.findByRole("alert")).textContent).toContain("class history");
    await user.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("permits presenter edits to visible notes and limits delete to own notes", async () => {
    Object.assign(mocks.user, { role: "presenter", can_manage: false });
    const user = userEvent.setup();
    mount(<ProgressNotes />);
    await screen.findByText("Note1");
    expect(screen.getAllByRole("button", { name: "Edit" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Delete", exact: true })).toHaveLength(1);
    mocks.data["/progress-notes/"] = [{ ...note(1), is_deleted: true }];
    await user.click(screen.getByRole("checkbox", { name: "Show recoverable deleted notes" }));
    await user.click(await screen.findByRole("button", { name: "Restore" }));
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith("/progress-notes/1/restore/"));
  });

  it("requests five report rows and resets the page when the report type changes", async () => {
    const baseGet = mocks.get.getMockImplementation();
    mocks.get.mockImplementation((url, options) => url.startsWith("/reports/summary/") ? Promise.resolve({ data: {
      count: 6, stats: [], columns: [{ key: "name", label: "Name" }], results: [{ name: "Result" }],
    } }) : baseGet(url, options));
    const user = userEvent.setup();
    mount(<Reports />);
    await user.click(await screen.findByRole("button", { name: "Next" }));
    await waitFor(() => expect(mocks.get).toHaveBeenCalledWith(expect.stringContaining("page=2&page_size=5"), expect.anything()));
    await user.click(screen.getByRole("tab", { name: "Late arrivals" }));
    await waitFor(() => expect(mocks.get).toHaveBeenCalledWith(expect.stringContaining("kind=late-arrivals&page=1&page_size=5"), expect.anything()));
  });

  it("resumes the existing paused course enrolment", async () => {
    const user = userEvent.setup();
    mount(<Enrolments />);
    await user.click(await screen.findByRole("button", { name: "Resume" }));
    await waitFor(() => expect(mocks.patch).toHaveBeenCalledWith("/registrations/1/", { is_active: true }));
    expect(mocks.post).not.toHaveBeenCalled();
    await screen.findByText("Course enrolment resumed. History retained.");
  });
});
