import { useEffect, useState } from "react";
import api from "../api/client";
import { errorMessage } from "../api/crm";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Profile.css";
import Notification from "../components/Notification";

function isAdministrator(user) {
  const role = String(user?.role ?? "")
    .trim()
    .toLowerCase();

  return Boolean(
    user?.can_manage ||
      user?.is_superuser ||
      ["admin", "administrator", "administration"].includes(role),
  );
}

export default function Profile() {
  const { user, updateProfile, clearSession } = useAuth();
  const navigate = useNavigate();
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const [profile, setProfile] = useState({
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    email: user?.email ?? "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    setProfile({
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? "",
      email: user?.email ?? "",
    });
  }, [user]);

  function handleProfileChange(event) {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
    setProfileMessage("");
  }

  function handlePasswordChange(event) {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
    setPasswordMessage("");
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setProfileSaving(true);
    setProfileMessage("");
    setProfileError(false);
    try {
      await updateProfile(profile);
      setProfileMessage("Your profile has been saved.");
    } catch (error) {
      setProfileError(true);
      setProfileMessage(errorMessage(error));
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError(false);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(true);
      setPasswordMessage("The new passwords do not match.");
      return;
    }
    setPasswordSaving(true);
    try {
      await api.post("/auth/change-password/", {
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
        new_password_confirm: passwordForm.confirmPassword,
      });
      clearSession();
      navigate("/login", {
        replace: true,
        state: { message: "Password changed. Sign in with your new password." },
      });
    } catch (error) {
      setPasswordError(true);
      setPasswordMessage(errorMessage(error));
    } finally {
      setPasswordSaving(false);
    }
  }

  const roleLabel = isAdministrator(user)
    ? "Administrator"
    : user?.role === "assistant"
      ? "Assistant"
      : "Presenter";

  return (
    <main className="profile-page">
      <header className="profile-page__heading">
        <div>
          <p className="profile-page__eyebrow">ACCOUNT SETTINGS</p>
          <h1>My profile</h1>
          <p>View and update your account details.</p>
        </div>
      </header>

      <section className="profile-card" aria-labelledby="profile-details-title">
        <div className="profile-card__heading">
          <div>
            <h2 id="profile-details-title">Personal details</h2>
            <p>Update your name and email. Your email is also your sign-in address.</p>
          </div>
        </div>

        <form className="profile-form" onSubmit={handleProfileSubmit}>
          <fieldset
            className="profile-fields"
            disabled={profileSaving || passwordSaving}
          >
            <div className="profile-form__row">
              <label>
                First name
                <input
                  type="text"
                  name="first_name"
                  autoComplete="given-name"
                  value={profile.first_name}
                  onChange={handleProfileChange}
                  required
                />
              </label>

              <label>
                Last name
                <input
                  type="text"
                  name="last_name"
                  autoComplete="family-name"
                  value={profile.last_name}
                  onChange={handleProfileChange}
                  required
                />
              </label>
            </div>

            <label>
              Email address
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={profile.email}
                onChange={handleProfileChange}
                required
              />
            </label>

            <label>
              Role
              <input type="text" value={roleLabel} disabled readOnly />
            </label>
          </fieldset>
          <Notification error={profileError ? profileMessage : ""} message={!profileError ? profileMessage : ""} onDismiss={() => setProfileMessage("")} />

          <div className="profile-form__actions">
            <button
              className="profile-primary-button"
              type="submit"
              disabled={profileSaving || passwordSaving}
            >
              {profileSaving ? "Saving…" : "Save profile"}
            </button>
          </div>
        </form>
      </section>

      <section className="profile-card" aria-labelledby="password-title">
        <div className="profile-card__heading">
          <div>
            <h2 id="password-title">Change password</h2>
            <p>Changing your password signs you out on all devices.</p>
          </div>
        </div>

        <form className="profile-form" onSubmit={handlePasswordSubmit}>
          <fieldset
            className="profile-fields"
            disabled={passwordSaving || profileSaving}
          >
            <label>
              Current password
              <input
                type="password"
                name="currentPassword"
                autoComplete="current-password"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </label>

            <div className="profile-form__row">
              <label>
                New password
                <input
                  type="password"
                  name="newPassword"
                  autoComplete="new-password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </label>

              <label>
                Confirm new password
                <input
                  type="password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </label>
            </div>
          </fieldset>
          <Notification error={passwordError ? passwordMessage : ""} message={!passwordError ? passwordMessage : ""} onDismiss={() => setPasswordMessage("")} />

          <div className="profile-form__actions">
            <button
              className="profile-primary-button"
              type="submit"
              disabled={passwordSaving || profileSaving}
            >
              {passwordSaving ? "Changing…" : "Change password"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
