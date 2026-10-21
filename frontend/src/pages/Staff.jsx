import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./Staff.css";
import api from "../api/client";
import { errorMessage } from "../api/crm";
import { notify } from "../utils/notifications";
import { useAuth } from "../context/AuthContext";
import useRecords from "../hooks/useRecords";
import RequestState from "../components/RequestState";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
import ConfirmDialog from "../components/ConfirmDialog";

const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  role: "presenter",
};

export default function Staff() {
  const location = useLocation();
  const { user } = useAuth();
  const records = useRecords("/auth/users/");

  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [staffQuery, setStaffQuery] = useState("");
  const [pendingAction, setPendingAction] = useState(null);

  const globalSearch = location.state?.globalSearch;

  useEffect(() => {
    if (typeof globalSearch === "string" && globalSearch.trim()) {
      setStaffQuery(globalSearch);
    }
  }, [location.key, globalSearch]);

  const staffMembers = Array.isArray(records.data) ? records.data : [];
  const normalizedStaffQuery = staffQuery.trim().toLowerCase();

  const filteredStaff = staffMembers.filter((person) => {
    if (!normalizedStaffQuery) return true;

    const fullName =
      `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim();
    const role =
      person.role === "admin"
        ? "administrator admin"
        : String(person.role ?? "");

    const searchableText =
      `${fullName} ${person.email ?? ""} ${role}`.toLowerCase();

    const textMatches = searchableText.includes(normalizedStaffQuery);

    // Check status separately so "active" does not match "inactive".
    const statusMatches =
      (normalizedStaffQuery === "active" && Boolean(person.is_active)) ||
      (normalizedStaffQuery === "inactive" && !person.is_active) ||
      (["awaiting", "approval", "awaiting approval"].includes(
        normalizedStaffQuery,
      ) &&
        person.is_approved === false);

    return textMatches || statusMatches;
  });

  const pagination = usePagination(filteredStaff, staffQuery);

  async function perform(operation, successMessage = "Staff account updated.") {
    setBusy(true);

    try {
      await operation();
      await records.refresh();
      notify.success(successMessage);
      return true;
    } catch (requestError) {
      notify.error(errorMessage(requestError));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(event) {
    event.preventDefault();

    await perform(async () => {
      await api.post("/auth/users/", {
        ...form,
        email: form.email.trim().toLowerCase(),
        is_active: true,
      });

      setForm(emptyForm);
      setShowCreateModal(false);
    }, "Staff account created.");
  }

  function closeCreateModal() {
    if (busy) return;

    setShowCreateModal(false);
    setForm(emptyForm);
  }

  useEffect(() => {
    if (!showCreateModal) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape" && !busy) {
        setShowCreateModal(false);
        setForm(emptyForm);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showCreateModal, busy]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function getPersonName(person) {
    return (
      `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim() ||
      person.email ||
      "Unnamed account"
    );
  }

  function getPendingDialogDetails() {
    if (!pendingAction) {
      return {
        title: "",
        message: "",
        confirmLabel: "Confirm",
        variant: "danger",
      };
    }

    const { person } = pendingAction;
    const name = getPersonName(person);

    if (pendingAction.type === "role") {
      const roleName =
        pendingAction.role === "admin" ? "Administrator" : "Presenter";

      return {
        title: "Change staff role?",
        message: `${person.email || name}’s role will change to ${roleName}. Their permissions will change immediately.`,
        confirmLabel: "Change role",
        variant: "primary",
      };
    }

    if (pendingAction.type === "status") {
      if (pendingAction.isActive) {
        return {
          title: pendingAction.isAwaitingApproval
            ? "Approve and activate this account?"
            : "Activate this account?",
          message: pendingAction.isAwaitingApproval
            ? `${person.email || name} will be approved and able to sign in.`
            : `${person.email || name} will be able to sign in again.`,
          confirmLabel: pendingAction.isAwaitingApproval
            ? "Approve and activate"
            : "Activate account",
          variant: "primary",
        };
      }

      return {
        title: "Deactivate this account?",
        message: `${person.email || name} will no longer be able to sign in. Their class and note history will be kept.`,
        confirmLabel: "Deactivate account",
        variant: "danger",
      };
    }

    return {
      title: "Permanently delete this account?",
      message: `The unused account for ${person.email || name} will be permanently deleted. This action cannot be undone.`,
      confirmLabel: "Delete permanently",
      variant: "danger",
    };
  }

  async function confirmPendingAction() {
    if (!pendingAction) return;

    const action = pendingAction;
    const { person } = action;
    let operation;
    let successMessage;

    if (action.type === "role") {
      operation = () =>
        api.patch(`/auth/users/${person.id}/`, {
          role: action.role,
        });
      successMessage = "Staff role updated.";
    } else if (action.type === "status") {
      operation = () =>
        api.patch(`/auth/users/${person.id}/`, {
          is_active: action.isActive,
        });
      successMessage = action.isActive
        ? "Staff account activated."
        : "Staff account deactivated. History retained.";
    } else {
      operation = () => api.delete(`/auth/users/${person.id}/`);
      successMessage = "Unused staff account permanently deleted.";
    }

    const succeeded = await perform(operation, successMessage);

    if (succeeded) {
      setPendingAction(null);
    }
  }

  const dialogDetails = getPendingDialogDetails();

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
          <h1>Staff &amp; Roles</h1>
          <p className="staff-page__description">
            Create staff accounts, manage their roles, and control access.
          </p>
        </div>

        <div className="staff-page__actions">
          <button
            className="staff-primary-button staff-page__add-button"
            type="button"
            onClick={() => setShowCreateModal(true)}
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
              <div className="staff-modal__title">
                <p className="staff-modal__eyebrow">STAFF ACCOUNT</p>
                <h2 id="staff-create-title">Add staff member</h2>
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

              <div className="staff-form__footer">
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
              Search staff by name, email, role or status
            </span>

            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10.8" cy="10.8" r="6.8" />
              <path d="m16 16 4.5 4.5" />
            </svg>

            <input
              type="search"
              value={staffQuery}
              onChange={(event) => setStaffQuery(event.target.value)}
              placeholder="Search staff accounts"
              aria-label="Search staff by name, email, role or status"
            />
          </label>
        </div>

        {!records.error && filteredStaff.length > 0 && (
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
                  <th scope="col">Actions</th>
                </tr>
              </thead>

              <tbody>
                {pagination.rows.map((person) => {
                  const name = getPersonName(person);
                  const isCurrentUser = String(person.id) === String(user?.id);
                  const isActive = Boolean(person.is_active);
                  const isAwaitingApproval = person.is_approved === false;

                  const accountStatus = isActive
                    ? "Active"
                    : isAwaitingApproval
                      ? "Awaiting approval"
                      : "Inactive";

                  return (
                    <tr key={person.id}>
                      <td>
                        <span className="staff-table__name">{name}</span>
                        <span className="staff-table__email">
                          {person.email || "No email recorded"}
                        </span>
                      </td>

                      <td>
                        <select
                          className="staff-role-select"
                          aria-label={`Role for ${person.email || name}`}
                          value={person.role}
                          disabled={busy || isCurrentUser}
                          onChange={(event) => {
                            const role = event.target.value;

                            if (role !== person.role) {
                              setPendingAction({
                                type: "role",
                                person,
                                role,
                              });
                            }
                          }}
                        >
                          {person.role === "assistant" && (
                            <option value="assistant" disabled>
                              Assistant (legacy account)
                            </option>
                          )}
                          <option value="presenter">Presenter</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </td>

                      <td>
                        <span
                          className={`staff-status ${
                            isActive
                              ? "staff-status--active"
                              : "staff-status--inactive"
                          }`}
                        >
                          {accountStatus}
                        </span>
                      </td>

                      <td>
                        <div className="staff-table__actions">
                          {!isCurrentUser && (
                            <>
                              <button
                                className={
                                  isActive
                                    ? "staff-action-button staff-action-button--deactivate"
                                    : "staff-action-button staff-action-button--activate"
                                }
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  setPendingAction({
                                    type: "status",
                                    person,
                                    isActive: !isActive,
                                    isAwaitingApproval,
                                  })
                                }
                              >
                                {isActive
                                  ? "Deactivate"
                                  : isAwaitingApproval
                                    ? "Approve and activate"
                                    : "Activate"}
                              </button>

                              {person.can_delete === true && (
                                <button
                                  type="button"
                                  className="staff-action-button staff-action-button--delete"
                                  disabled={busy}
                                  aria-label={`Permanently delete unused account ${person.email}`}
                                  title="Permanently delete an unused account"
                                  onClick={() =>
                                    setPendingAction({
                                      type: "delete",
                                      person,
                                    })
                                  }
                                >
                                  Delete permanently
                                </button>
                              )}
                            </>
                          )}

                          {isCurrentUser && (
                            <span className="staff-table__self-note">You</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!records.loading && !records.error && filteredStaff.length === 0 && (
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
                ? "Try another name, email, role or status."
                : "Add a staff account to get started."}
            </p>
          </div>
        )}

        {!records.error && filteredStaff.length > 0 && (
          <Pagination
            {...pagination}
            label="Staff table pages"
            itemLabel="staff accounts"
            disabled={busy}
          />
        )}
      </section>

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={dialogDetails.title}
        message={dialogDetails.message}
        confirmLabel={dialogDetails.confirmLabel}
        variant={dialogDetails.variant}
        busy={busy}
        onCancel={() => {
          if (!busy) setPendingAction(null);
        }}
        onConfirm={confirmPendingAction}
      />
    </main>
  );
}
