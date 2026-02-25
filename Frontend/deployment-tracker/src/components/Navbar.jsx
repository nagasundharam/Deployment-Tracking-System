import { NavLink } from "react-router-dom";
import "./Navbar.css";
import {
  LayoutDashboard,
  FolderKanban,
  Rocket,
  Users,
  Layers,
  FileText,
  Settings
} from "lucide-react";

/*
  Role Definitions:
  - admin: Full system access
  - devops: Infra + deployments + environments
  - developer: Projects + deployments (limited)
*/

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
    roles: ["admin", "developer"]
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

function Navbar({ role = "admin" }) {
  const filteredNav = navConfig.filter(item =>
    item.roles.includes(role)
  );

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

      {/* Plan Card (Always stays bottom naturally now) */}
      <div className="plan-card">
        <p className="plan-label">CURRENT PLAN</p>
        <h3>Enterprise Tier</h3>

        <div className="progress-bar">
          <div className="progress-fill"></div>
        </div>

        <p className="nodes">750 / 1000 Managed Nodes</p>
      </div>
    </aside>
  );
}
export default Navbar;