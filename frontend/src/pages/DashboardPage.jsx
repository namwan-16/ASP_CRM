import { Link } from "react-router-dom";
import "./Dashboard.css";
import { useAuth } from "../context/AuthContext";

const adminActions = [
  {
    title: "Students",
    description: "Find and manage student records.",
    to: "/students",
    icon: "student",
  },
  {
    title: "Guardians",
    description: "Manage guardian details and student links.",
    to: "/guardians",
    icon: "guardians",
  },
  {
    title: "Classes",
    description: "Schedule classes and manage enrolments.",
    to: "/classes",
    icon: "classes",
  },
  {
    title: "Registrations",
    description: "Upload and review registration files.",
    to: "/registrations",
    icon: "registration",
  },
  {
    title: "Reports",
    description: "View attendance and class activity reports.",
    to: "/reports",
    icon: "reports",
  },
  {
    title: "Emergency lookup",
    description: "Find a student's emergency contact details.",
    to: "/emergency-lookup",
    icon: "emergency",
  },
];

const presenterActions = [
  {
    title: "Classes",
    description: "View your assigned classes and student lists.",
    to: "/classes",
    icon: "classes",
  },
  {
    title: "Record attendance",
    description: "Mark attendance for an assigned class.",
    to: "/attendance",
    icon: "attendance",
  },
  {
    title: "Progress notes",
    description: "View or write notes for your students.",
    to: "/progress-notes",
    icon: "notes",
  },
  {
    title: "Emergency lookup",
    description: "Find a student's emergency contact details.",
    to: "/emergency-lookup",
    icon: "emergency",
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

  if (name === "student") {
    return (
      <svg {...common}>
        <path d="m3 8 9-5 9 5-9 5-9-5Z" />
        <path d="M7 10.2v5.1c2.9 2.2 7.1 2.2 10 0v-5.1M21 8v6" />
      </svg>
    );
  }

  if (name === "guardians") {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20v-1.5A5.5 5.5 0 0 1 8 13h2" />
        <path d="M16 14v6M13 17h6" />
      </svg>
    );
  }

  if (name === "classes") {
    return (
      <svg {...common}>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
        <path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h8M8 11h6" />
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

  if (name === "emergency") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 8c.5 4 4 7.5 8 8l1.5-2-3-2-1.5 1c-1.2-.6-2.2-1.6-2.8-2.8l1-1.5-2-3L8 8Z" />
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

export default function Dashboard() {
  const { user } = useAuth();
  const isAdministrator = Boolean(user?.can_manage);
  const actions = isAdministrator ? adminActions : presenterActions;
  const roleLabel = isAdministrator ? "Administrator" : "Presenter";

  return (
    <main className="dashboard-page">
      <header className="dashboard-page__heading">
        <div>
          <h1>Welcome back, {getFirstName(user)}</h1>
          <p className="dashboard-page__intro">
            Your workspace for today’s after-school program tasks.
          </p>
        </div>

      </header>

      <section
        className="dashboard-welcome"
        aria-labelledby="dashboard-welcome-title"
      >
        <div className="dashboard-welcome__copy">
          <p className="dashboard-welcome__eyebrow">Your ASP workspace</p>
          <h2 id="dashboard-welcome-title">
            {isAdministrator
              ? "Keep the program running smoothly."
              : "Get ready for your classes."}
          </h2>
          <p>
            {isAdministrator
              ? "Choose a task below to manage students, classes and program records."
              : "Open a class, record attendance or add a progress note."}
          </p>
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
            <p>Shortcuts for your most common tasks</p>
          </div>
        </div>

        <div className="dashboard-actions__grid">
          {actions.map((item) => (
            <Link className="dashboard-action" to={item.to} key={item.title}>
              <span
                className={`dashboard-action__icon dashboard-action__icon--${item.icon}`}
              >
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
