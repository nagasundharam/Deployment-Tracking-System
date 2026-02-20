import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./Deployments.css";

const mockDeployments = [
  {
    id: "DEP-8842",
    version: "v2.4.12-stable",
    env: "PROD",
    status: "PENDING_APPROVAL",
    triggeredBy: "Sarah Miller",
    triggeredAt: "May 24, 2024 - 14:42",
    duration: "--",
  },
  {
    id: "DEP-8841",
    version: "v2.4.11-rc.2",
    env: "STAGING",
    status: "SUCCESS",
    triggeredBy: "John Doe",
    triggeredAt: "May 24, 2024 - 10:15",
    duration: "4m 12s",
  },
  {
    id: "DEP-8839",
    version: "v2.4.11-rc.1",
    env: "STAGING",
    status: "FAILED",
    triggeredBy: "Alex Rivera",
    triggeredAt: "May 23, 2024 - 18:20",
    duration: "2m 45s",
  },
  {
    id: "DEP-8835",
    version: "v2.4.10-stable",
    env: "DEV",
    status: "IN_PROGRESS",
    triggeredBy: "Marcus Kim",
    triggeredAt: "May 23, 2024 - 16:45",
    duration: "1m 10s",
  },
  {
    id: "DEP-8830",
    version: "v2.4.9-stable",
    env: "PROD",
    status: "SUCCESS",
    triggeredBy: "Sarah Miller",
    triggeredAt: "May 22, 2024 - 09:12",
    duration: "5m 38s",
  },
];


export default function Deployments() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [envFilter, setEnvFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;

  // Filtering Logic
  const filteredDeployments = useMemo(() => {
    return mockDeployments.filter((deployment) => {
      const matchesSearch =
        deployment.id.toLowerCase().includes(search.toLowerCase()) ||
        deployment.version.toLowerCase().includes(search.toLowerCase()) ||    deployment.triggeredBy.toLowerCase().includes(search.toLowerCase());

      const matchesEnv =
        envFilter === "ALL" || deployment.env === envFilter;

      const matchesStatus =
        statusFilter === "ALL" || deployment.status === statusFilter;

      return matchesSearch && matchesEnv && matchesStatus;
    });
  }, [search, envFilter, statusFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredDeployments.length / itemsPerPage);

  const paginatedData = filteredDeployments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="deployments-page">
      {/* Header */}
      <div className="deployments-header">
        <div>
          <h2>Alpha-Core-Service</h2>
          <p className="breadcrumb">Projects &gt; Alpha-Core-Service &gt; Deployments</p>
        </div>
        <button className="primary-btn">+ New Deployment</button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <p>Total Deployments</p>
          <h3>124</h3>
          <span className="sub-text">All-time</span>
        </div>
        <div className="stat-card">
          <p>Success Rate</p>
          <h3>94%</h3>
          <span className="positive">+0.8%</span>
        </div>
        <div className="stat-card">
          <p>Failed</p>
          <h3>3</h3>
          <span className="sub-text">Last 7 Days</span>
        </div>
        <div className="stat-card">
          <p>Pending Approval</p>
          <h3>2</h3>
          <span className="warning-text">Requires action</span>
        </div>
      </div>

      {/* Filters */}
      <div className="table-controls">
        <input
          type="text"
          placeholder="Search by ID, version or user..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        />

        <select
          value={envFilter}
          onChange={(e) => {
            setEnvFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="ALL">Environment: All</option>
          <option value="PROD">PROD</option>
          <option value="STAGING">STAGING</option>
          <option value="DEV">DEV</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="ALL">Status: All</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILED">FAILED</option>
          <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
        </select>
      </div>

      {/* Table */}
      <div className="deployments-table">
        <div className="table-header">
          <span>ID</span>
          <span>Version</span>
          <span>ENV</span>
          <span>Status</span>
          <span>Triggered By</span>
          <span>Triggered At</span>
          <span>Duration</span>
        </div>

        {paginatedData.map((deployment) => (
          <div key={deployment.id} className="table-row">
            <span
              className="deployment-link"
              onClick={() => navigate(`/deployments/${deployment.id}`)}
            >
              {deployment.id}
            </span>
            <span>{deployment.version}</span>
            <span>
              <span className={`env-badge ${deployment.env.toLowerCase()}`}>
                {deployment.env}
              </span>
            </span>
            <span>
              <span className={`status-badge ${deployment.status.toLowerCase()}`}>
                {deployment.status}
              </span>
            </span>
            <span>{deployment.triggeredBy}</span>
            <span>{deployment.triggeredAt}</span>
            <span>{deployment.duration}</span>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          Previous
        </button>

        <span>
          Page {currentPage} of {totalPages || 1}
        </span>

        <button
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
