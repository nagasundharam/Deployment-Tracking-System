import { Bell, Plus } from "lucide-react";
import "./Dashboard.css";

export default function Dashboard() {
  return (
    <div className="dashboard">

      {/* Top Bar */}
      <div className="topbar">
  <div className="search-wrapper">
    <span className="search-icon">🔍</span>
    <input
      type="text"
      placeholder="Search projects, deployments, or users..."
      className="search"
    />
  </div>

  <div className="profile">
    <div className="notification">
      <Bell size={18} />
      <span className="dot"></span>
    </div>

    <div className="user-info">
      <p className="name">Alex Rivera</p>
      <p className="role">System Admin</p>
    </div>
  </div>
</div>


      {/* Main Content */}
      <div className="main-content">

        {/* Header Section */}
        <div className="header-section">
          <div>
            <h1>Deployment Overview</h1>
            <p>Monitor system performance and deployment activity.</p>
          </div>

          <button className="primary-btn">
            <Plus size={16} /> New Deployment
          </button>
        </div>

        {/* Stats */}
        <div className="stats">
          <StatCard title="Total Projects" value="42" />
          <StatCard title="Total Deployments" value="1,284" />
          <StatCard title="Success Rate" value="98.2%" />
          <StatCard title="Failures (24h)" value="12" danger />
          <StatCard title="Active Pipelines" value="8" />
        </div>

        {/* Charts */}
        <div className="charts">
          <div className="chart large">
            <h3>Deployment Activity</h3>
          </div>
          <div className="chart">
            <h3>Status Distribution</h3>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Failed Deployments</h3>
            <button className="text-btn">View All</button>
          </div>

          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Environment</th>
                <th>Version</th>
                <th>Failed At</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>Payment Gateway</td>
                <td><span className="badge">Staging</span></td>
                <td>v2.4.12-rc1</td>
                <td>2 mins ago</td>
                <td><button className="danger-btn">Troubleshoot</button></td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, danger }) {
  return (
    <div className={`stat-card ${danger ? "danger" : ""}`}>
      <p>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}
