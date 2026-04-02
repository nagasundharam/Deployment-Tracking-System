import { NavLink, useNavigate } from "react-router-dom";
import {
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  FolderKanban,
  Rocket,
  Users,
  Layers,
  FileText,
  Settings
} from "lucide-react";
import "./Navbar.css";

// 1. Move navConfig back into the file so it's defined
const navConfig = [
  {
    name: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
    roles: ["admin", "devops", "developer"]
  },
  {
    name: "Projects",
    path: "/projects",
    icon: FolderKanban,
    roles: ["admin", "devops", "developer"]
  },
  {
    name: "Deployments",
    path: "/deployments",
    icon: Rocket,
    roles: ["admin", "devops", "developer"]
  },
  {
    name: "Users",
    path: "/users",
    icon: Users,
    roles: ["admin"]
  },
  {
    name: "Environments",
    path: "/environments",
    icon: Layers,
    roles: ["admin", "devops"]
  },
  {
    name: "Audit Logs",
    path: "/audit-logs",
    icon: FileText,
    roles: ["admin"]
  },
  {
    name: "Settings",
    path: "/settings",
    icon: Settings,
    roles: ["admin"]
  }
];

function Navbar() {
  const navigate = useNavigate();

  // Safely parse user from localStorage
  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;
  const role = (user?.role || "developer").toLowerCase();
  console.log(role);

  const handleLogout = () => {
    // Clear session data
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    // Force refresh to login to clear all React states
    window.location.href = "/login";
  };

  // 2. This now has access to the navConfig defined above
  const filteredNav = navConfig.filter(item =>
    item.roles.includes(role)
  );
  console.log(filteredNav);
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="logo">
        <div className="logo-icon">🚀</div>
        <div>
          <h2>DeployFlow</h2>
          <span className="role-badge">
            {role.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="nav-links">
        {filteredNav.map((item, index) => {
          const Icon = item.icon;
          return (
            <NavLink key={index} to={item.path} end>
              <Icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Profile & Logout Section */}
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            <UserIcon size={20} color="#6b7280" />
          </div>
          <div className="user-info">
            <p className="user-name">{user?.name || "Guest User"}</p>
            <p className="user-email">{user?.email || "Not logged in"}</p>
          </div>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>

    </aside>
  );
}

export default Navbar;