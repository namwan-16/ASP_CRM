import { useState } from "react";
import api from "../api/client";
import { errorMessage } from "../api/crm";
import { useAuth } from "../context/AuthContext";
import useRecords from "../hooks/useRecords";
import RequestState from "../components/RequestState";

const empty = { username: "", first_name: "", last_name: "", email: "", password: "", role: "assistant" };

export default function Staff() {
  const { user } = useAuth();
  const records = useRecords("/auth/users/");
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function perform(operation) {
    setBusy(true); setError("");
    try { await operation(); records.refresh(); }
    catch (requestError) { setError(errorMessage(requestError)); }
    finally { setBusy(false); }
  }

  if (!user?.can_manage) return <main className="crm-page"><h1>Staff</h1><p>Administrator access required.</p></main>;
  return <main className="crm-page">
    <h1>Staff &amp; Roles</h1>
    <RequestState loading={records.loading} error={records.error} onRetry={records.refresh} />
    {error && <p className="crm-message crm-message--error" role="alert">{error}</p>}
    <form className="crm-form" onSubmit={(event) => { event.preventDefault(); perform(async () => { await api.post("/auth/users/", { ...form, is_active: true }); setForm(empty); }); }}>
      {["username", "first_name", "last_name", "email", "password"].map((field) => <label key={field}>{field.replaceAll("_", " ")}<input type={field === "password" ? "password" : field === "email" ? "email" : "text"} autoComplete={field === "password" ? "new-password" : "off"} required={field === "username" || field === "password"} value={form[field]} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} /></label>)}
      <label>Role<select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}><option value="assistant">Assistant</option><option value="presenter">Presenter</option><option value="admin">Admin</option></select></label>
      <button type="submit" disabled={busy}>Create staff account</button>
    </form>
    <div className="crm-table-wrap"><table className="crm-table"><thead><tr><th>Staff</th><th>Role</th><th>Access</th><th>Action</th></tr></thead><tbody>
      {records.data.map((person) => <tr key={person.id}><td>{`${person.first_name} ${person.last_name}`.trim() || person.username}<br /><small>{person.username}</small></td><td>
        <select aria-label={`Role for ${person.username}`} value={person.role} disabled={busy || person.id === user.id} onChange={(event) => perform(() => api.patch(`/auth/users/${person.id}/`, { role: event.target.value }))}><option value="assistant">Assistant</option><option value="presenter">Presenter</option><option value="admin">Admin</option></select>
      </td><td>{person.is_active ? "Active" : "Awaiting approval / inactive"}</td><td><button type="button" disabled={busy || person.id === user.id} onClick={() => perform(() => api.patch(`/auth/users/${person.id}/`, { is_active: !person.is_active }))}>{person.is_active ? "Deactivate" : "Approve / activate"}</button></td></tr>)}
    </tbody></table></div>
  </main>;
}
