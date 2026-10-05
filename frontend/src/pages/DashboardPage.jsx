import React from "react";
import { Link } from "react-router-dom";
import "./Dashboard.css";

const dashboardActions = [
  {
    title: "Emergency lookup",
    description: "Find a student’s emergency guardian contact details.",
    to: "/emergency-lookup",
    tone: "urgent",
    icon: "search",
  },
  {
    title: "Students",
    description: "Find and view student records.",
    to: "/students",
    tone: "blue",
    icon: "student",
  },
  {
    title: "Record attendance",
    description: "Mark attendance for a class session.",
    to: "/attendance",
    tone: "green",
    icon: "attendance",
  },
  {
    title: "Progress notes",
    description: "Add or review a student interaction note.",
    to: "/progress-notes",
    tone: "purple",
    icon: "notes",
  },
  {
    title: "Registrations & CSV",
    description: "Manage registrations and upload incoming CSV files.",
    to: "/registrations",
    tone: "blue",
    icon: "registration",
  },
  {
    title: "Reports",
    description: "View attendance, late-arrival, enrolment and activity reports.",
    to: "/reports",
    tone: "green",
    icon: "reports",
  },
];

function ActionIcon({ name }) {
  const common = {
    width: 23,
    height: 23,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (name === "search") {
    return (
      <svg {...common}>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4.5 4.5" />
      </svg>
    );
  }

  if (name === "student") {
    return (
      <svg {...common}>
        <path d="m3 8 9-5 9 5-9 5-9-5Z" />
        <path d="M7 10.2v5.1c2.9 2.2 7.1 2.2 10 0v-5.1M21 8v6" />
      </svg>
    );
  }

  if (name === "attendance") {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="16" height="17" rx="2" />
        <path d="M8 2.8v3M16 2.8v3M8 11h8M8 15h3" />
        <path d="m14 15 1.5 1.5L19 13" />
      </svg>
    );
  }

  if (name === "registration") {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M3 20v-1.5A5.5 5.5 0 0 1 8.5 13h1" />
        <path d="M17 14v7M13.5 17.5h7" />
      </svg>
    );
  }

  if (name === "reports") {
    return (
      <svg {...common}>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 16v-4M12 16V8M16 16v-6" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M6 3.5h8l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5v5h4M8 12h8M8 16h8" />
    </svg>
  );
}

function getFirstName(user) {
  const value =
    user?.first_name ||
    user?.firstName ||
    user?.name ||
    user?.username ||
    "there";

  return String(value).trim().split(/\s+/)[0] || "there";
}

function getRoleLabel(user) {
  const role = String(user?.role || user?.user_type || "").toLowerCase();

  if (role.includes("admin")) return "Administrator";
  if (role.includes("present")) return "Presenter";

  return "ASP team member";
}

export default function Dashboard({ user }) {
  const roleLabel = getRoleLabel(user);

  return (
    <main className="dashboard-page">
      <div className="dashboard-page__heading">
        <div>
          <p className="dashboard-page__eyebrow">
            ASP CLASS PROCESS PIPELINE
          </p>
          <h1>Welcome back, {getFirstName(user)}</h1>
        </div>

        <span className="dashboard-page__role">{roleLabel}</span>
      </div>

      <section
        className="dashboard-welcome"
        aria-labelledby="dashboard-welcome-title"
      >
        <div className="dashboard-welcome__copy">
          <p className="dashboard-welcome__eyebrow">Your ASP workspace</p>
          <h2 id="dashboard-welcome-title">What would you like to do?</h2>
          <p>Choose a task to get started.</p>
        </div>

        <div className="dashboard-welcome__mark" aria-hidden="true">
          ASP
        </div>
      </section>

      <section
        className="dashboard-actions"
        aria-labelledby="dashboard-actions-title"
      >
        <div className="dashboard-actions__heading">
          <div>
            <h2 id="dashboard-actions-title">Quick actions</h2>
            <p>Common tasks and useful reports</p>
          </div>
        </div>

        <div className="dashboard-actions__grid">
          {dashboardActions.map((item) => (
            <Link
              className={`dashboard-action dashboard-action--${item.tone}`}
              to={item.to}
              key={item.title}
            >
              <span className="dashboard-action__icon">
                <ActionIcon name={item.icon} />
              </span>

              <span className="dashboard-action__content">
                <span className="dashboard-action__title">{item.title}</span>
                <span className="dashboard-action__description">
                  {item.description}
                </span>
              </span>

              <span className="dashboard-action__arrow" aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}