import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import "./Deployments.css";

export default function Deployments() {
  const navigate = useNavigate();

  // Data States
  const [deployments, setDeployments] = useState([]);
  const [metadata, setMetadata] = useState({ projects: [], devops: [] });
  const [projectEnvironments, setProjectEnvironments] = useState([]);

  // UI States
  const [search, setSearch] = useState("");
  const [envFilter, setEnvFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [newDeployment, setNewDeployment] = useState({
    project_id: "",
    environment_id: "",
    devops_id: "",
    version: "",
    branch: "main",
  });

  const itemsPerPage = 8;
  const user = JSON.parse(localStorage.getItem("user"));
  const role = (user?.role || "developer").toLowerCase(); // fallback safety
  // const role = "admin"; // Testing

  useEffect(() => {
    fetchInitialData();
  }, []);



  const formatDeployments = (data) => {
    // If data is null or not an array, return empty array
    if (!Array.isArray(data)) return [];

    return data.map((d) => {
      const start = d.start_time ? new Date(d.start_time) : null;
      const end = d.end_time ? new Date(d.end_time) : null;
      const durationSeconds =
        start && end ? Math.max(0, Math.round((end - start) / 1000)) : null;

      const statusRaw = d.status || "pending";

      return {
        id: d._id,
        version: d.version || "N/A",
        project: d.project_id?.name || "N/A",
        env: d.environment_id?.name || "DEV",
        status: statusRaw.toUpperCase(),
        rawStatus: statusRaw,
        triggeredBy: d.triggered_by?.username || "System",
        triggeredAt: d.createdAt
          ? new Date(d.createdAt).toLocaleString("en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
          })
          : "N/A",
        durationLabel:
          durationSeconds !== null ? `${durationSeconds}s` : "--",
        durationSeconds,
        isIssue:
          statusRaw.toLowerCase() === "failed" ||
          statusRaw.toLowerCase() === "cancelled",
      };
    });
  };
  // fetch environments when project changes in the create form
  useEffect(() => {
    if (newDeployment.project_id) {
      api.get(`/deployments/environments/${newDeployment.project_id}`)
        .then((data) => setProjectEnvironments(Array.isArray(data) ? data : []))
        .catch((err) => console.error("Env Fetch Error:", err));
    }
  }, [newDeployment.project_id]);

  // 1. Optimized Parallel Fetching
  const fetchInitialData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      if (!token) return;

      // Start both requests at once to save time
      const [depData, metaData] = await Promise.all([
        api.get("/deployments"),
        api.get("/deployments/metadata"),
      ]);

      if (depData) {
        const rawList = Array.isArray(depData)
          ? depData
          : depData.deployments || [];
        setDeployments(formatDeployments(rawList));
      }

      if (metaData) {
        setMetadata({
          projects: metaData.projects || [],
          devops: metaData.devops || [],
        });
      }

    } catch (err) {
      console.error("Infrastructure Sync Error:", err);
    }
  }, []);

  const sendAuditEvent = useCallback(
    async (action, resource) => {
      try {
        const username = user?.username || user?.name || "unknown";
        await api.post("/audit-logs", {
            action,
            resource,
            user: username,
        });
      } catch (err) {
        console.error("Audit Log Error:", err);
      }
    },
    [user]
  );

  const isEnvAllowedForRole = useCallback(
    (envNameRaw) => {
      const envName = (envNameRaw || "").toLowerCase();
      if (role === "admin" || role === "devops") return true;
      if (role === "developer") return envName === "development";
      if (role === "qa") return envName === "testing";
      return false;
    },
    [role]
  );

  // 2. FIXED handleCreateDeployment (Added Token + RBAC + Audit)
  const handleCreateDeployment = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        const token = localStorage.getItem("token"); // GET TOKEN
        if (!token) {
          alert("You are not authenticated.");
          return;
        }

        const selectedEnv = projectEnvironments.find(
          (env) => env._id === newDeployment.environment_id
        );

        if (!selectedEnv) {
          alert("Please select a valid environment.");
          return;
        }

        if (!isEnvAllowedForRole(selectedEnv.name)) {
          alert(
            `You are not allowed to deploy to the ${selectedEnv.name} environment with role ${role}.`
          );
          return;
        }

        const created = await api.post("/deployments", {
          ...newDeployment,
          triggered_by: {
            source: "manual",
            username: user?.username || user?.name,
            user_id: user?.id || user?._id,
          },
        });

        if (created) {
          const projectName =
            created?.project_id?.name ||
            selectedEnv?.project_id?.name ||
            "Unknown Project";

          await sendAuditEvent("Deployment Created", projectName);

          setShowCreateModal(false);
          setNewDeployment({
            project_id: "",
            environment_id: "",
            devops_id: "",
            version: "",
            branch: "main",
          });
          fetchInitialData(); // Refresh list
        }
      } catch (err) {
        console.error("Deployment Error:", err);
      }
    },
    [
      fetchInitialData,
      isEnvAllowedForRole,
      newDeployment,
      projectEnvironments,
      role,
      sendAuditEvent,
      user,
    ]
  );


  const filteredDeployments = useMemo(() => {
    return deployments.filter((d) => {
      const matchesSearch = d.version.toLowerCase().includes(search.toLowerCase()) || d.project.toLowerCase().includes(search.toLowerCase());
      const matchesEnv = envFilter === "ALL" || d.env === envFilter;
      const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
      return matchesSearch && matchesEnv && matchesStatus;
    });
  }, [deployments, search, envFilter, statusFilter]);

  const paginatedData = filteredDeployments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredDeployments.length / itemsPerPage);

  const metrics = useMemo(() => {
    if (!deployments.length) {
      return {
        total: 0,
        successRate: "0%",
        avgDuration: "--",
        activeIssues: 0,
      };
    }

    const total = deployments.length;
    const successCount = deployments.filter(
      (d) => (d.rawStatus || "").toLowerCase() === "success"
    ).length;
    const issueCount = deployments.filter((d) => d.isIssue).length;

    const successRate =
      total === 0 ? 0 : Math.round((successCount / total) * 100);

    const durations = deployments
      .map((d) => d.durationSeconds)
      .filter((v) => typeof v === "number" && !Number.isNaN(v));
    const avgSeconds =
      durations.length > 0
        ? Math.round(
          durations.reduce((sum, v) => sum + v, 0) / durations.length
        )
        : null;

    return {
      total,
      successRate: `${successRate}%`,
      avgDuration: avgSeconds !== null ? `${avgSeconds}s` : "--",
      activeIssues: issueCount,
    };
  }, [deployments]);

  return (
    <div className="deployments-page">
      {/* Header Section */}
      <header className="deployments-header">
        <div>
          <h2>Deployments</h2>
          <p className="breadcrumb">Platform / Operations / Deployment History</p>
        </div>
        {(role === "admin" ||
          role === "devops" ||
          role === "developer" ||
          role === "qa") && (
            <button
              className="primary-btn"
              onClick={() => setShowCreateModal(true)}
            >
              <span className="plus-icon">+</span> New Deployment
            </button>
          )}
      </header>

      {/* Quick Stats Section */}
      <section className="stats-grid">
        <div className="stat-card">
          <p>Total Deployments</p>
          <h3>{metrics.total}</h3>
          <span className="sub-text">Last 30 days</span>
        </div>
        <div className="stat-card">
          <p>Success Rate</p>
          <h3 className="positive">{metrics.successRate}</h3>
          <span className="positive">Live success ratio</span>
        </div>
        <div className="stat-card">
          <p>Avg. Duration</p>
          <h3>{metrics.avgDuration}</h3>
          <span className="sub-text">Across all envs</span>
        </div>
        <div className="stat-card">
          <p>Active Issues</p>
          <h3 className="warning-text">{metrics.activeIssues}</h3>
          <span className="sub-text">
            {metrics.activeIssues > 0
              ? "Attention required"
              : "Current status: Healthy"}
          </span>
        </div>
      </section>

      {/* Filter Controls */}
      <div className="table-controls">
        <div className="search-wrapper">
          <input type="text" placeholder="Search versions or projects..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select
          value={envFilter}
          onChange={(e) => setEnvFilter(e.target.value)}
        >
          <option value="ALL">All Environments</option>
          <option value="production">Production</option>
          <option value="testing">Testing</option>
          <option value="development">Development</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">All Statuses</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILED">Failed</option>
          <option value="RUNNING">Running</option>
        </select>
      </div>

      {/* Data Table */}
      <div className="deployments-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Deployment Name</th>
              <th>Environment</th>
              <th>Status</th>
              <th>Triggered By</th>
              <th>Time</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((d) => (
              <tr key={d.id} onClick={() => navigate(`/deployments/${d.id}`)}>
                <td className="project-cell">{d.project}</td>
                <td className="version-cell" style={{fontFamily: 'monospace', fontWeight: 600}}>
                   {d.version}
                </td>
                <td><span className={`env-badge ${d.env.toLowerCase()}`}>{d.env}</span></td>
                <td>
                  <span
                    className={`status-badge ${d.status.toLowerCase()}`}
                  >
                    {d.status}
                  </span>
                </td>
                <td>{d.triggeredBy}</td>
                <td>{d.triggeredAt}</td>
                <td>{d.durationLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Prev</button>
        <span>Page {currentPage} of {totalPages || 1}</span>
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>Next</button>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content-modern">
            <div className="modal-header-modern">
              <div className="header-title-area">
                <div className="header-icon-hex">🚀</div>
                <div>
                  <h3>Initialize Pipeline</h3>
                  <p>Configure deployment artifact and target environment</p>
                </div>
              </div>
              <button className="close-x-btn" onClick={() => setShowCreateModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleCreateDeployment} className="modal-form-modern">
              <div className="form-section">
                <label className="section-label">Target Configuration</label>
                <div className="form-group-modern">
                  <label>Project</label>
                  <select required onChange={(e) => setNewDeployment({ ...newDeployment, project_id: e.target.value })}>
                    <option value="">Select Project to deploy...</option>
                    {metadata.projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>

                <div className="form-row-modern">
                  <div className="form-group-modern">
                    <label>Environment</label>
                    <select required disabled={!newDeployment.project_id} onChange={(e) => setNewDeployment({ ...newDeployment, environment_id: e.target.value })}>
                      <option value="">Select Target</option>
                      {projectEnvironments.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group-modern">
                    <label>Operator</label>
                    <select required onChange={(e) => setNewDeployment({ ...newDeployment, devops_id: e.target.value })}>
                      <option value="">Assign Engineer</option>
                      {metadata.devops.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <label className="section-label">Artifact Details</label>
                <div className="form-row-modern">
                  <div className="form-group-modern">
                    <label>Version Tag</label>
                    <input type="text" placeholder="e.g. v1.0.4-stable" required onChange={(e) => setNewDeployment({ ...newDeployment, version: e.target.value })} />
                  </div>
                  <div className="form-group-modern">
                    <label>Git Branch</label>
                    <input type="text" value={newDeployment.branch} onChange={(e) => setNewDeployment({ ...newDeployment, branch: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="modal-footer-modern">
                <button type="button" className="btn-secondary-modern" onClick={() => setShowCreateModal(false)}>Discard</button>
                <button type="submit" className="btn-primary-modern">Deploy to Cloud</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}