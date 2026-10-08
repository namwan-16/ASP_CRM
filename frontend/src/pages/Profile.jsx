import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Profile.css";

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
  const { user } = useAuth();

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

  function handleProfileSubmit(event) {
    event.preventDefault();
    setProfileMessage(
      "This form is a frontend preview. Profile changes are not saved yet.",
    );
  }

  function handlePasswordSubmit(event) {
    event.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage("The new passwords do not match.");
      return;
    }

    setPasswordMessage(
      "This form is a frontend preview. Your password has not been changed.",
    );
  }

  const roleLabel = isAdministrator(user) ? "Administrator" : "Presenter";

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
            <p>Update the name and email shown on your account.</p>
          </div>
        </div>

        <form className="profile-form" onSubmit={handleProfileSubmit}>
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

          {profileMessage && (
            <p className="profile-message" role="status">
              {profileMessage}
            </p>
          )}

          <div className="profile-form__actions">
            <button className="profile-primary-button" type="submit">
              Save profile
            </button>
          </div>
        </form>
      </section>

      <section className="profile-card" aria-labelledby="password-title">
        <div className="profile-card__heading">
          <div>
            <h2 id="password-title">Change password</h2>
            <p>Choose a new password for your account.</p>
          </div>
        </div>

        <form className="profile-form" onSubmit={handlePasswordSubmit}>
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

          {passwordMessage && (
            <p className="profile-message" role="status">
              {passwordMessage}
            </p>
          )}

          <div className="profile-form__actions">
            <button className="profile-primary-button" type="submit">
              Change password
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
