<<<<<<< HEAD
import { useEffect, useState } from "react";
import "./Staff.css";
=======
import { useState } from "react";
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
import api from "../api/client";
import { errorMessage } from "../api/crm";
import { useAuth } from "../context/AuthContext";
import useRecords from "../hooks/useRecords";
import RequestState from "../components/RequestState";
<<<<<<< HEAD
import Pagination from "../components/Pagination";
import Notification from "../components/Notification";
import usePagination from "../hooks/usePagination";

const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  role: "presenter",
};
=======

const empty = { username: "", first_name: "", last_name: "", email: "", password: "", role: "assistant" };
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b

export default function Staff() {
  const { user } = useAuth();
  const records = useRecords("/auth/users/");
<<<<<<< HEAD
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [staffQuery, setStaffQuery] = useState("");

  const staffMembers = Array.isArray(records.data) ? records.data : [];
  const normalizedStaffQuery = staffQuery.trim().toLowerCase();

  const filteredStaff = staffMembers.filter((person) => {
    const fullName = `${person.first_name ?? ""} ${person.last_name ?? ""}`;
    const searchableText = `${fullName} ${person.email ?? ""}`.toLowerCase();
    return searchableText.includes(normalizedStaffQuery);
  });

  const pagination = usePagination(filteredStaff, staffQuery);

  async function perform(operation, success = "Staff account updated.") {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      await operation();
      await records.refresh();
      setMessage(success);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(event) {
    event.preventDefault();

    await perform(async () => {
      await api.post("/auth/users/", { ...form, email: form.email.trim().toLowerCase(), is_active: true });
      setForm(emptyForm);
      setShowCreateModal(false);
    }, "Staff account created.");
  }

  function closeCreateModal() {
    if (busy) return;

    setShowCreateModal(false);
    setForm(emptyForm);
    setError("");
  }

  useEffect(() => {
    if (!showCreateModal) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape" && !busy) closeCreateModal();
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showCreateModal, busy]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  if (!user?.can_manage) {
    return (
      <main className="staff-page">
        <section className="staff-access-denied">
          <span className="staff-access-denied__icon" aria-hidden="true">
            !
          </span>
          <div>
            <h1>Administrator access required</h1>
            <p>You don’t have permission to manage staff accounts.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="staff-page">
      <header className="staff-page__heading">
        <div>
          <p className="staff-page__eyebrow">ADMINISTRATION</p>
          <h1>Staff &amp; Roles</h1>
          <p className="staff-page__description">
            Create staff accounts, manage their roles, and control access.
          </p>
        </div>

        <div className="staff-page__actions">
          <button
            className="staff-primary-button staff-page__add-button"
            type="button"
            onClick={() => {
              setError("");
              setShowCreateModal(true);
            }}
          >
            <span aria-hidden="true">+</span>
            Add staff member
          </button>
        </div>
      </header>

      <RequestState
        loading={records.loading}
        error={records.error}
        onRetry={records.refresh}
      />

      {!showCreateModal && <Notification error={error} message={message} onDismiss={() => { setError(""); setMessage(""); }} />}

      {showCreateModal && (
        <div
          className="staff-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeCreateModal();
          }}
        >
          <section
            className="staff-card staff-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-create-title"
          >
            <div className="staff-card__heading staff-modal__heading">
              <div className="staff-card__heading-icon" aria-hidden="true">
                +
              </div>
              <div>
                <h2 id="staff-create-title">Create staff account</h2>
                <p>Add a staff member and set their initial role.</p>
              </div>
              <button
                className="staff-modal__close"
                type="button"
                aria-label="Close add staff dialog"
                disabled={busy}
                onClick={closeCreateModal}
              >
                ×
              </button>
            </div>

            <form className="staff-form" onSubmit={handleCreate}>
              <div className="staff-form__grid">
                <label>
                  Email address
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    required
                    value={form.email}
                    onChange={(event) =>
                      updateForm("email", event.target.value)
                    }
                  />
                </label>

                <label>
                  First name
                  <input
                    name="first_name"
                    type="text"
                    autoComplete="given-name"
                    value={form.first_name}
                    onChange={(event) =>
                      updateForm("first_name", event.target.value)
                    }
                  />
                </label>

                <label>
                  Last name
                  <input
                    name="last_name"
                    type="text"
                    autoComplete="family-name"
                    value={form.last_name}
                    onChange={(event) =>
                      updateForm("last_name", event.target.value)
                    }
                  />
                </label>

                <label>
                  Temporary password
                  <input
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={form.password}
                    onChange={(event) =>
                      updateForm("password", event.target.value)
                    }
                  />
                </label>

                <label>
                  Role
                  <select
                    name="role"
                    value={form.role}
                    onChange={(event) => updateForm("role", event.target.value)}
                  >
                    <option value="presenter">Presenter</option>
                    <option value="admin">Administrator</option>
                  </select>
                </label>
              </div>

              <Notification error={error} onDismiss={() => setError("")} />

              <div className="staff-form__footer">
                <p>Password requirements are enforced by the server.</p>
                <div className="staff-form__actions">
                  <button
                    className="staff-secondary-button"
                    type="button"
                    disabled={busy}
                    onClick={closeCreateModal}
                  >
                    Cancel
                  </button>
                  <button
                    className="staff-primary-button"
                    type="submit"
                    disabled={busy}
                  >
                    {busy ? "Saving…" : "Create staff account"}
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      )}

      <section
        className="staff-card staff-list-card"
        aria-labelledby="staff-list-title"
      >
        <div className="staff-card__heading staff-list-card__heading">
          <label className="staff-search">
            <span className="visually-hidden">
              Search staff by name or email
            </span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10.8" cy="10.8" r="6.8" />
              <path d="m16 16 4.5 4.5" />
            </svg>
            <input
              type="search"
              value={staffQuery}
              onChange={(event) => setStaffQuery(event.target.value)}
              placeholder="Search staff or email"
              aria-label="Search staff by name or email"
            />
          </label>
        </div>

        {filteredStaff.length > 0 ? (
          <div
            className="staff-table-wrap"
            role="region"
            aria-label="Staff accounts table"
            tabIndex={0}
          >
            <table className="staff-table">
              <thead>
                <tr>
                  <th scope="col">Staff member</th>
                  <th scope="col">Role</th>
                  <th scope="col">Account status</th>
                  <th scope="col">Access action</th>
                </tr>
              </thead>

              <tbody>
                {pagination.rows.map((person) => {
                  const name =
                    `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim() ||
                    person.email;
                  const isCurrentUser = person.id === user.id;

                  return (
                    <tr key={person.id}>
                      <td>
                        <span className="staff-table__name">{name}</span>
                        <span className="staff-table__email">
                          {person.email}
                        </span>
                      </td>

                      <td>
                        <select
                          className="staff-role-select"
                          aria-label={`Role for ${person.email}`}
                          value={person.role}
                          disabled={busy || isCurrentUser}
                          onChange={(event) => {
                            const role = event.target.value;
                            if (window.confirm(`Change ${person.email}’s role to ${role === "admin" ? "Administrator" : "Presenter"}? Their permissions will change immediately.`))
                              perform(() => api.patch(`/auth/users/${person.id}/`, { role }), "Staff role updated.");
                          }}
                        >
                          {person.role === "assistant" && (
                            <option value="assistant" disabled>
                              Assistant (existing account)
                            </option>
                          )}
                          <option value="presenter">Presenter</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </td>

                      <td>
                        <span
                          className={`staff-status ${
                            person.is_active
                              ? "staff-status--active"
                              : "staff-status--inactive"
                          }`}
                        >
                          {person.is_active
                            ? "Active"
                            : "Awaiting approval / inactive"}
                        </span>
                      </td>

                      <td>
                        <button
                          className={
                            person.is_active
                              ? "staff-action-button staff-action-button--deactivate"
                              : "staff-action-button staff-action-button--activate"
                          }
                          type="button"
                          disabled={busy || isCurrentUser}
                          onClick={() => {
                            if (window.confirm(`${person.is_active ? "Deactivate" : "Reactivate"} ${person.email}? ${person.is_active ? "Their access will stop. Class and note history will be kept." : "Their access will resume."}`))
                              perform(() => api.patch(`/auth/users/${person.id}/`, { is_active: !person.is_active }), person.is_active ? "Staff account deactivated. History retained." : "Staff account reactivated.");
                          }}
                        >
                          {person.is_active
                            ? "Deactivate"
                            : "Reactivate / approve"}
                        </button>

                        {!isCurrentUser && <button type="button" className="staff-action-button" disabled={busy || person.can_delete === false}
                          title={person.can_delete === false ? "Used accounts must be deactivated." : "Permanently delete an unused account"}
                          onClick={() => { if (window.confirm(`Permanently delete the unused account ${person.email}? This cannot be undone.`)) perform(() => api.delete(`/auth/users/${person.id}/`), "Unused staff account permanently deleted."); }}>
                          Delete permanently
                        </button>}
                        {isCurrentUser && (
                          <span className="staff-table__self-note">You</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          !records.loading && (
            <div className="staff-empty-state">
              <span className="staff-empty-state__icon" aria-hidden="true">
                ◌
              </span>
              <h3>
                {staffMembers.length > 0
                  ? "No matching staff accounts"
                  : "No staff accounts found"}
              </h3>
              <p>
                {staffMembers.length > 0
                  ? "Try another name or email."
                  : "Add a staff account to get started."}
              </p>
            </div>
          )
        )}
      <Pagination {...pagination} label="Staff table pages" disabled={busy} />
      </section>
    </main>
  );
=======
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
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
}
