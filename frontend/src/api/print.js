import api from "./client";

export async function printClassList(id) {
  // Open during the click so browsers do not block the print window.
  const popup = window.open("", "_blank");
  if (!popup) throw new Error("Allow pop-ups to print this class list.");
  popup.opener = null;
  popup.document.body.textContent = "Loading class list…";
  try {
    const { data } = await api.get(`/sessions/${id}/class-list/`);
    const session = data.session;
    popup.document.title = `${session.course_name} class list`;
    popup.document.body.textContent = "";
    const style = popup.document.createElement("style");
    style.textContent =
      "body{font:14px Arial;color:#123;margin:28px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #aaa;padding:9px;text-align:left;vertical-align:top;white-space:pre-wrap}h1{font-size:24px}thead{display:table-header-group}tr{break-inside:avoid}";
    popup.document.head.append(style);
    const heading = popup.document.createElement("h1");
    heading.textContent = session.course_name;
    const meta = popup.document.createElement("p");
    meta.textContent = `${session.date}, ${session.start_time.slice(0, 5)}–${session.end_time.slice(0, 5)} · ${session.room} · ${session.presenter_name} · ${session.status}`;
    const table = popup.document.createElement("table");
    const head = table.createTHead().insertRow();
    data.columns.forEach((column) => {
      const cell = popup.document.createElement("th");
      cell.textContent = column.label;
      head.append(cell);
    });
    const body = table.createTBody();
    data.results.forEach((row) => {
      const tr = body.insertRow();
      data.columns.forEach((column) => {
        tr.insertCell().textContent = row[column.key] ?? "";
      });
    });
    popup.document.body.append(heading, meta, table);
    popup.focus();
    popup.print();
  } catch (error) {
    popup.close();
    throw error;
  }
}
