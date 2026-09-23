import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";

import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import SchoolOutlined from "@mui/icons-material/SchoolOutlined";
import FamilyRestroomOutlined from "@mui/icons-material/FamilyRestroomOutlined";
import ClassOutlined from "@mui/icons-material/ClassOutlined";
import FactCheckOutlined from "@mui/icons-material/FactCheckOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import PersonAddOutlined from "@mui/icons-material/PersonAddOutlined";
import PaymentsOutlined from "@mui/icons-material/PaymentsOutlined";
import CurrencyExchangeOutlined from "@mui/icons-material/CurrencyExchangeOutlined";
import AssessmentOutlined from "@mui/icons-material/AssessmentOutlined";
import ContactEmergencyOutlined from "@mui/icons-material/ContactEmergencyOutlined";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import SearchOutlined from "@mui/icons-material/SearchOutlined";

import "./Layout.css";

export const sidebarPages = [
  { path: "/dashboard", label: "Dashboard", icon: DashboardOutlined },
  { path: "/students", label: "Students", icon: SchoolOutlined },
  { path: "/guardians", label: "Guardians", icon: FamilyRestroomOutlined },
  { path: "/classes", label: "Classes", icon: ClassOutlined },
  { path: "/attendance", label: "Attendance", icon: FactCheckOutlined },
  {
    path: "/progress-notes",
    label: "Progress Notes",
    icon: DescriptionOutlined,
  },
  {
    path: "/registrations",
    label: "Registrations",
    icon: PersonAddOutlined,
  },
  { path: "/payments", label: "Payments", icon: PaymentsOutlined },
  { path: "/refunds", label: "Refunds", icon: CurrencyExchangeOutlined },
  { path: "/reports", label: "Reports", icon: AssessmentOutlined },
];

export default function Layout() {
const { logout, user } = useAuth();
const { pathname } = useLocation();

const currentPage = sidebarPages.find(
  (page) =>
    pathname === page.path ||
    pathname.startsWith(`${page.path}/`)
);

const pageTitle =
  currentPage?.label ||
  (pathname === "/emergency-lookup" ? "Emergency Lookup" : "ASP CRM");

const fullName = [user?.first_name, user?.last_name]
  .filter(Boolean)
  .join(" ")
  .trim();

const displayName = fullName || user?.username || "User";

const initials = fullName
  ? [user?.first_name, user?.last_name]
      .filter(Boolean)
      .map((name) => name.trim().charAt(0))
      .join("")
      .toUpperCase()
  : displayName.slice(0, 2).toUpperCase();

const today = new Intl.DateTimeFormat("en-AU", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(new Date());

const [profileAnchor, setProfileAnchor] = useState(null);
const profileOpen = Boolean(profileAnchor);

const closeProfileMenu = () => {
  setProfileAnchor(null);
};

const handleLogout = async () => {
  closeProfileMenu();
  await logout();
};


  return (
    <div className="crm-layout">
      <a className="crm-skip-link" href="#crm-content">
        Skip to content
      </a>

      <aside className="crm-sidebar">
        <div className="crm-brand">
          <h2>ASP CRM</h2>
          <p>MU After School Program</p>
        </div>

        <nav className="crm-nav" aria-label="Main navigation">
          {sidebarPages.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `crm-nav-link${isActive ? " crm-nav-link-active" : ""}`
              }
            >
              <Icon className="crm-menu-icon" aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="crm-sidebar-footer">
          <NavLink
            to="/emergency-lookup"
            className="crm-emergency-link"
          >
            <ContactEmergencyOutlined
              className="crm-menu-icon"
              aria-hidden="true"
            />
            <span>Emergency Lookup</span>
          </NavLink>

        </div>
      </aside>

      <div className="crm-workspace">
  <header className="crm-header">
    <div className="crm-header-heading">
      <h1>{pageTitle}</h1>
      <p>{today}</p>
    </div>

    <div className="crm-header-actions">
      <div className="crm-header-search">
        <SearchOutlined aria-hidden="true" />

        <input
          type="search"
          placeholder="Search coming soon"
          aria-label="Search — coming soon"
          disabled
        />
      </div>

      <div className="crm-header-user">
  <button
    type="button"
    id="profile-menu-button"
    className="crm-header-avatar"
    aria-label="Open account menu"
    aria-controls={profileOpen ? "profile-menu" : undefined}
    aria-haspopup="menu"
    aria-expanded={profileOpen ? "true" : undefined}
    onClick={(event) => setProfileAnchor(event.currentTarget)}
  >
    {initials}
  </button>

  <Menu
    id="profile-menu"
    anchorEl={profileAnchor}
    open={profileOpen}
    onClose={closeProfileMenu}
    anchorOrigin={{
      vertical: "bottom",
      horizontal: "right",
    }}
    transformOrigin={{
      vertical: "top",
      horizontal: "right",
    }}
  >
    <Box
  sx={{
    px: 2,
    py: 1.5,
    maxWidth: 280,
    overflowWrap: "anywhere",
    fontFamily: '"Inter", sans-serif',
  }}
>
  <div
    style={{
      fontSize: 15,
      fontWeight: 600,
      color: "#161e2e",
    }}
  >
    {displayName}
  </div>

  {user?.email && (
    <div
      style={{
        marginTop: 4,
        fontSize: 13,
        color: "#667085",
      }}
    >
      {user.email}
    </div>
  )}

  {user?.role && (
    <div
      style={{
        marginTop: 6,
        fontSize: 12,
        color: "#667085",
        textTransform: "capitalize",
      }}
    >
      Role: {user.role}
    </div>
  )}
</Box>

<Divider />
    <MenuItem
      onClick={handleLogout}
      sx={{
        gap: 1.5,
        minWidth: 160,
        fontFamily: '"Inter", sans-serif',
        fontSize: 14,
      }}
    >
      <LogoutOutlined fontSize="small" aria-hidden="true" />
      Logout
    </MenuItem>
  </Menu>
</div>
    </div>
  </header>

  <div id="crm-content" className="crm-content" tabIndex={-1}>
    <Outlet />
  </div>
</div>
    </div>
  );
}