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

function Sidebar() {
  return (
    <div className="sidebar">

      {/* Logo Section */}
      <div className="logo">
        <div className="logo-icon">🚀</div>
        <h2>DeployFlow</h2>
      </div>

      {/* Navigation */}
      <nav className="nav-links">
        <NavLink to="/" end>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="projects">
          <FolderKanban size={18} />
          <span>Projects</span>
        </NavLink>

        <NavLink to="deployments">
          <Rocket size={18} />
          <span>Deployments</span>
        </NavLink>

        <NavLink to="users">
          <Users size={18} />
          <span>Users</span>
        </NavLink>

        <NavLink to="environments">
          <Layers size={18} />
          <span>Environments</span>
        </NavLink>

        <NavLink to="audit-logs">
          <FileText size={18} />
          <span>Audit Logs</span>
        </NavLink>

        <NavLink to="settings">
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>
      </nav>

      {/* Plan Card */}
      <div className="plan-card">
        <p className="plan-label">CURRENT PLAN</p>
        <h3>Enterprise Tier</h3>

        <div className="progress-bar">
          <div className="progress-fill"></div>
        </div>

        <p className="nodes">750/1000 Managed Nodes</p>
      </div>

    </div>
  );
}

export default Sidebar;
