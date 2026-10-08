import api from "./client";


export async function listAll(path, options = {}) {
  const results = [];
  let page = 1;
  while (true) {
    const response = await api.get(path, { ...options, params: { ...options.params, page, page_size: 500 } });
    if (Array.isArray(response.data)) return response.data;
    results.push(...response.data.results);
    if (!response.data.next) return results;
    page += 1;
  }
}

export function errorMessage(error) {
  const data = error.response?.data;
  if (!data) return "Unable to connect to the API. Check the backend and try again.";
  const messages = [];
  function collect(value, prefix = "") {
    if (typeof value === "string") messages.push(prefix + value);
    else if (Array.isArray(value)) value.forEach((item) => collect(item, prefix));
    else if (value && typeof value === "object") {
      Object.entries(value).forEach(([key, item]) => collect(item, key === "detail" ? prefix : `${prefix}${key}: `));
    }
  }
  collect(data);
  return messages.join(" ") || "The request could not be completed.";
}

export async function download(path, filename) {
  const response = await api.get(path, { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function studentRecord(row) {
  const primary = row.guardians.find((link) => link.is_primary_contact) || row.guardians[0];
  return { ...row, apiId: row.id, id: `ASP-${row.id}`, firstName: row.first_name, lastName: row.last_name,
    level: row.year_level, subject: row.subject, guardian: primary ? `${primary.guardian_details.first_name} ${primary.guardian_details.last_name}` : "Not linked",
    guardianId: row.guardians.find((link) => link.is_primary_contact)?.guardian || "", relationship: primary?.relationship || "Guardian",
    permissionToTravelAlone: row.permission_to_travel_alone ? "Yes" : "No", status: row.is_active ? "Active" : "Inactive" };
}

export function guardianRecord(row) {
  return { ...row, firstName: row.first_name, lastName: row.last_name,
    relationship: [...new Set(row.students.map((link) => link.relationship))].join(", "),
    studentNames: row.students.map((link) => link.name), studentIds: row.students.map((link) => link.student) };
}

export function sessionRecord(row) {
  return { ...row, courseId: row.course, course: row.course_name, presenterId: row.presenter,
    presenter: row.presenter_name, assistantId: row.assistant || "", assistant: row.assistant_name || "",
    startTime: row.start_time.slice(0, 5), endTime: row.end_time.slice(0, 5), studentIds: row.students };
}
