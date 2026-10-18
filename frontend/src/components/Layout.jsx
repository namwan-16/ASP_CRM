import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";

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

function getList(response) {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function includesSearch(value, query) {
  return String(value ?? "")
    .toLowerCase()
    .includes(query);
}

export default function Layout() {
  const { logout, user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchError, setSearchError] = useState("");
  const searchContainerRef = useRef(null);

  const profileOpen = Boolean(profileAnchor);

  const fullName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  const displayName = fullName || user?.email || "User";
  const roleLabel = administrator ? "Administrator" : "Presenter";
  const headerAccountLabel = roleLabel;

  const initials = fullName
    ? [user?.first_name, user?.last_name]
        .filter(Boolean)
        .map((name) => name.trim().charAt(0))
        .join("")
        .toUpperCase()
    : displayName.slice(0, 2).toUpperCase();

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
    const query = searchQuery.trim().toLowerCase();
    if (query.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError("");
      return undefined;
    }

    setSearchResults([]);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      setSearchError("");

      const endpoints = [
        { type: "Student", url: "/students/?page=1&page_size=500" },
        { type: "Class session", url: "/sessions/?page=1&page_size=500" },
      ];
      if (administrator) {
        endpoints.push(
          { type: "Guardian", url: "/guardians/?page=1&page_size=500" },
          { type: "Staff", url: "/auth/users/?page=1&page_size=500" },
        );
      }

      const responses = await Promise.allSettled(
        endpoints.map(({ url }) => api.get(url, { signal: controller.signal })),
      );
      if (controller.signal.aborted) return;

      const fulfilled = responses.filter(
        (response) => response.status === "fulfilled",
      );
      if (!fulfilled.length) {
        setSearchResults([]);
        setSearchError("Search is temporarily unavailable. Please try again.");
        setSearchLoading(false);
        return;
      }

      const results = [];
      responses.forEach((response, index) => {
        if (response.status !== "fulfilled") return;
        const { type } = endpoints[index];
        const rows = getList(response.value);

        if (type === "Student") {
          rows.forEach((student) => {
            const name =
              `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim();
            const detail = [student.year_level, `ASP-${student.id}`]
              .filter(Boolean)
              .join(" · ");
            const searchable = [
              name,
              detail,
              student.email,
              student.phone,
              student.mobile_phone,
            ].join(" ");
            if (includesSearch(searchable, query)) {
              results.push({
                type,
                title: name || `Student ASP-${student.id}`,
                detail,
                path: administrator ? "/students" : "/emergency-lookup",
              });
            }
          });
        } else if (type === "Guardian") {
          rows.forEach((guardian) => {
            const name =
              `${guardian.first_name ?? ""} ${guardian.last_name ?? ""}`.trim();
            const phone =
              guardian.mobile_phone ||
              guardian.home_phone ||
              guardian.business_phone ||
              guardian.phone ||
              "";
            const detail = guardian.email || phone || "Guardian record";
            if (
              includesSearch(
                `${name} ${guardian.company ?? ""} ${guardian.email ?? ""} ${phone}`,
                query,
              )
            ) {
              results.push({
                type,
                title: name || "Guardian",
                detail,
                path: "/guardians",
              });
            }
          });
        } else if (type === "Staff") {
          rows.forEach((person) => {
            const name =
              `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim();
            const username = person.username ?? "";
            const email = person.email ?? "";
            const detail = [person.role, email || username]
              .filter(Boolean)
              .join(" · ");
            if (
              includesSearch(
                `${name} ${username} ${email} ${person.role ?? ""}`,
                query,
              )
            ) {
              results.push({
                type,
                title: name || email || username || "Staff account",
                detail: detail || "Staff account",
                path: "/staff",
              });
            }
          });
        } else {
          rows.forEach((session) => {
            const title =
              session.course_name ||
              session.course_details?.name ||
              session.course ||
              "Class session";
            const presenter =
              session.presenter_name || session.presenter_details?.name || "";
            const detail = [
              session.date,
              session.start_time,
              session.room,
              presenter,
            ]
              .filter(Boolean)
              .join(" · ");
            if (
              includesSearch(`${title} ${detail} ${session.id ?? ""}`, query)
            ) {
              results.push({
                type,
                title,
                detail: detail || "Class session",
                path: "/classes",
              });
            }
          });
        }
      });

      setSearchResults(results.slice(0, 8));
      setSearchLoading(false);
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, administrator]);

  useEffect(() => {
    function closeSearchOnOutsideClick(event) {
      if (!searchContainerRef.current?.contains(event.target)) {
        setSearchOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeSearchOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeSearchOnOutsideClick);
  }, []);

  function openSearchResult(result) {
    navigate(result.path, {
      state: {
        globalSearch:
          result.type === "Student" ? result.title : searchQuery.trim(),
        result,
      },
    });
    setSearchOpen(false);
  }

  function handleSearchKeyDown(event) {
    if (event.key === "Escape") setSearchOpen(false);
    if (event.key === "Enter" && searchResults.length) {
      event.preventDefault();
      openSearchResult(searchResults[0]);
    }
  }

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

                    {(administrator || user?.role === "presenter") && (
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
                          sx={{ fontSize: 17 }}
                          className={
                            classesExpanded
                              ? "crm-nav-group__chevron crm-nav-group__chevron--expanded"
                              : "crm-nav-group__chevron"
                          }
                        />
                      </button>
                    )}
                  </div>

                  {(administrator || user?.role === "presenter") &&
                    classesExpanded && (
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
                        <span>
                          {administrator ? "Manage subjects" : "Class subjects"}
                        </span>
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

          <div className="crm-header-search-container" ref={searchContainerRef}>
            <div className="crm-header-search">
              <SearchOutlined aria-hidden="true" />
              <input
                type="search"
                placeholder="Search records..."
                aria-label="Search students, guardians, classes, and staff"
                autoComplete="off"
                aria-autocomplete="list"
                value={searchQuery}
                aria-expanded={searchOpen && searchQuery.trim().length >= 2}
                aria-controls="crm-global-search-results"
                onFocus={() => setSearchOpen(true)}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setSearchOpen(true);
                }}
                onKeyDown={handleSearchKeyDown}
              />
            </div>

            {searchOpen && searchQuery.trim().length >= 2 && (
              <div
                className="crm-global-search-results"
                id="crm-global-search-results"
                role="listbox"
                aria-label="Search results"
              >
                {searchLoading ? (
                  <p className="crm-global-search-message">
                    Searching records…
                  </p>
                ) : searchError ? (
                  <p
                    className="crm-global-search-message crm-global-search-message--error"
                    role="alert"
                  >
                    {searchError}
                  </p>
                ) : searchResults.length ? (
                  searchResults.map((result, index) => (
                    <button
                      className="crm-global-search-result"
                      type="button"
                      role="option"
                      aria-selected="false"
                      key={`${result.type}-${result.title}-${index}`}
                      onClick={() => openSearchResult(result)}
                    >
                      <span className="crm-global-search-result__type">
                        {result.type}
                      </span>
                      <strong>{result.title}</strong>
                      <small>{result.detail}</small>
                    </button>
                  ))
                ) : (
                  <p className="crm-global-search-message">
                    No matching records found.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="crm-header-actions">
            <div className="crm-header-user">
              <button
                type="button"
                id="profile-menu-button"
                className="crm-header-avatar"
                aria-label={`Open account menu for ${headerAccountLabel}`}
                aria-controls={profileOpen ? "profile-menu" : undefined}
                aria-haspopup="menu"
                aria-expanded={profileOpen ? "true" : undefined}
                onClick={(event) =>
                  setProfileAnchor(profileOpen ? null : event.currentTarget)
                }
              >
                <span
                  className="crm-header-avatar__initials"
                  aria-hidden="true"
                >
                  {initials}
                </span>
                <span className="crm-header-avatar__name">
                  {headerAccountLabel}
                </span>
                <ExpandMoreOutlined
                  sx={{ fontSize: 16 }}
                  className={`crm-header-avatar__chevron${profileOpen ? " is-open" : ""}`}
                  aria-hidden="true"
                />
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
                </Box>

                <Divider />

                <MenuItem
                  component={NavLink}
                  to="/profile"
                  onClick={closeProfileMenu}
                  className="crm-profile-menu-item"
                >
                  <PersonOutlineOutlined
                    fontSize="13px solid"
                    aria-hidden="true"
                  />
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
