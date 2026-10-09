import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
import AssessmentOutlined from "@mui/icons-material/AssessmentOutlined";
import ContactEmergencyOutlined from "@mui/icons-material/ContactEmergencyOutlined";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import MenuOutlined from "@mui/icons-material/MenuOutlined";
import ChevronLeftOutlined from "@mui/icons-material/ChevronLeftOutlined";
import ExpandMoreOutlined from "@mui/icons-material/ExpandMoreOutlined";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";
import PersonOutlineOutlined from "@mui/icons-material/PersonOutlineOutlined";
import MenuOpenOutlined from "@mui/icons-material/MenuOpenOutlined";
import AdminPanelSettingsOutlined from "@mui/icons-material/AdminPanelSettingsOutlined";

import "./Layout.css";

export const sidebarPages = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: DashboardOutlined,
    adminOnly: true,
  },
  {
    path: "/students",
    label: "Student Records",
    icon: SchoolOutlined,
    adminOnly: true,
  },
  {
    path: "/guardians",
    label: "Guardians",
    icon: FamilyRestroomOutlined,
    adminOnly: true,
  },
  {
    path: "/classes",
    label: "Classes",
    icon: ClassOutlined,
    presenterAllowed: true,
  },
  {
    path: "/attendance",
    label: "Attendance",
    icon: FactCheckOutlined,
    presenterAllowed: true,
  },
  {
    path: "/progress-notes",
    label: "Progress Notes",
    icon: DescriptionOutlined,
    presenterAllowed: true,
  },
  {
    path: "/registrations",
    label: "Registrations",
    icon: PersonAddOutlined,
    adminOnly: true,
  },
  {
    path: "/reports",
    label: "Reports",
    icon: AssessmentOutlined,
    adminOnly: true,
  },
  {
    path: "/staff",
    label: "Staff & Permissions",
    icon: AdminPanelSettingsOutlined,
    adminOnly: true,
  },
];

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

export default function Layout() {
  const { logout, user } = useAuth();
  const { pathname } = useLocation();

  const administrator = isAdministrator(user);
  const visiblePages = sidebarPages.filter(
    (page) => administrator || page.presenterAllowed,
  );

  const classesSectionActive =
    pathname === "/classes" || pathname.startsWith("/classes/");

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [classesExpanded, setClassesExpanded] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState(null);

  const profileOpen = Boolean(profileAnchor);

  const fullName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  const displayName = fullName || user?.username || "User";
  const roleLabel = administrator ? "Administrator" : "Presenter";

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
    timeZone: "Australia/Perth",
  }).format(new Date());

  function closeProfileMenu() {
    setProfileAnchor(null);
  }

  function closeMobileSidebar() {
    setMobileOpen(false);
  }

  async function handleLogout() {
    closeProfileMenu();
    closeMobileSidebar();
    await logout();
  }

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [mobileOpen]);

  return (
    <div
      className={[
        "crm-layout",
        collapsed ? "crm-layout--collapsed" : "",
        mobileOpen ? "crm-layout--mobile-open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <a className="crm-skip-link" href="#crm-content">
        Skip to content
      </a>

      {mobileOpen && (
        <button
          className="crm-sidebar-backdrop"
          type="button"
          aria-label="Close navigation menu"
          onClick={closeMobileSidebar}
        />
      )}

      <aside
        id="crm-sidebar"
        className={`crm-sidebar${mobileOpen ? " crm-sidebar--mobile-open" : ""}`}
        aria-label="Sidebar"
      >
        <div className="crm-brand">
          <div className="crm-brand-copy">
            <h2>ASP CRM</h2>
            <p>MU After School Program</p>
          </div>

          <button
            className="crm-sidebar-collapse"
            type="button"
            onClick={() => setCollapsed((current) => !current)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <MenuOpenOutlined aria-hidden="true" />{" "}
          </button>
        </div>

        <nav className="crm-nav" aria-label="Main navigation">
          {visiblePages.map(({ path, label, icon: Icon }) => {
            if (path === "/classes") {
              return (
                <div className="crm-nav-group" key={path}>
                  <div
                    className={`crm-nav-group__row${
                      classesSectionActive ? " crm-nav-group__row--active" : ""
                    }`}
                  >
                    <NavLink
                      to={path}
                      end
                      title={collapsed ? label : undefined}
                      className={({ isActive }) =>
                        `crm-nav-link${isActive ? " crm-nav-link-active" : ""}`
                      }
                      style={{ flex: 1, minWidth: 0 }}
                      onClick={closeMobileSidebar}
                    >
                      <Icon className="crm-menu-icon" aria-hidden="true" />
                      <span>{label}</span>
                    </NavLink>

                    {administrator && (
                      <button
                        className="crm-nav-group__toggle"
                        type="button"
                        aria-label={
                          classesExpanded
                            ? "Collapse Classes menu"
                            : "Expand Classes menu"
                        }
                        aria-expanded={classesExpanded}
                        title={
                          classesExpanded
                            ? "Collapse Classes menu"
                            : "Expand Classes menu"
                        }
                        onClick={() =>
                          setClassesExpanded((current) => !current)
                        }
                      >
                        <ExpandMoreOutlined
                          aria-hidden="true"
                          className={
                            classesExpanded
                              ? "crm-nav-group__chevron crm-nav-group__chevron--expanded"
                              : "crm-nav-group__chevron"
                          }
                        />
                      </button>
                    )}
                  </div>

                  {administrator && classesExpanded && (
                    <NavLink
                      to="/subjects"
                      title={collapsed ? "Manage subjects" : undefined}
                      className={({ isActive }) =>
                        `crm-nav-link crm-nav-sub-link${
                          isActive ? " crm-nav-link-active" : ""
                        }`
                      }
                      style={{
                        paddingLeft: collapsed ? undefined : "2.75rem",
                      }}
                      onClick={closeMobileSidebar}
                    >
                      <MenuBookOutlined
                        className="crm-menu-icon"
                        aria-hidden="true"
                      />
                      <span>Manage subjects</span>
                    </NavLink>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={path}
                to={path}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  `crm-nav-link${isActive ? " crm-nav-link-active" : ""}`
                }
                onClick={closeMobileSidebar}
              >
                <Icon className="crm-menu-icon" aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="crm-sidebar-footer">
          <NavLink
            to="/emergency-lookup"
            title={collapsed ? "Emergency Lookup" : undefined}
            className={({ isActive }) =>
              `crm-emergency-link${
                isActive ? " crm-emergency-link-active" : ""
              }`
            }
            onClick={closeMobileSidebar}
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
          <button
            className="crm-mobile-menu-button"
            type="button"
            aria-label={
              mobileOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-controls="crm-sidebar"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((current) => !current)}
          >
            {mobileOpen ? (
              <ChevronLeftOutlined aria-hidden="true" />
            ) : (
              <MenuOutlined aria-hidden="true" />
            )}
          </button>

          <div className="crm-header-heading">
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
                <Box className="crm-profile-details">
                  <div className="crm-profile-name">{displayName}</div>

                  {user?.email && (
                    <div className="crm-profile-email">{user.email}</div>
                  )}

                  <div className="crm-profile-role">{roleLabel}</div>
                </Box>

                <Divider />

                <MenuItem
                  component={NavLink}
                  to="/profile"
                  onClick={closeProfileMenu}
                  className="crm-profile-menu-item"
                >
                  <PersonOutlineOutlined fontSize="small" aria-hidden="true" />
                  My profile
                </MenuItem>

                <MenuItem onClick={handleLogout} className="crm-profile-logout">
                  <LogoutOutlined fontSize="small" aria-hidden="true" />
                  Logout
                </MenuItem>
              </Menu>
            </div>
          </div>
        </header>

        <main id="crm-content" className="crm-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
