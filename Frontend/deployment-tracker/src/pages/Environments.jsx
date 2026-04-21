import React, { useState, useEffect, useCallback } from "react";
import "./Environment.css";
import { api } from "../services/api";

const Environments = () => {
  // --- 1. DATA STATES (Initialized from LocalStorage for instant UI) ---
  const [environments, setEnvironments] = useState(() => {
    const saved = sessionStorage.getItem("cache_envs");
    return saved ? JSON.parse(saved) : [];
  });
  const [projects, setProjects] = useState(() => {
    const saved = sessionStorage.getItem("cache_projs");
    return saved ? JSON.parse(saved) : [];
  });

  const [loading, setLoading] = useState(environments.length === 0);
  const [showModal, setShowModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Parse user for RBAC
  const userJson = sessionStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;
  const role = (user?.role || "developer").toLowerCase();

  // --- 2. FORM STATE ---
  const [form, setForm] = useState({
    name: "development",
    project_id: "",
  });


  // --- 3. HIGH-SPEED FETCHING (Parallel + No-Crash Logic) ---
  const fetchInitialData = useCallback(async () => {
    const userId = user?._id || user?.id;
    if (!userId) return;

    try {
      setIsRefreshing(true);

      // If admin, fetch ALL projects, otherwise fetch user's projects
      const projectEndpoint = role === "admin" ? "/projects" : `/projects/user/${userId}`;

      // Fire both API calls at exactly the same time
      const [envData, projData] = await Promise.all([
        api.get("/environments"),
        api.get(projectEndpoint)
      ]);

      // Update states and Caches if data is valid
      if (Array.isArray(envData)) {
        console.log("Environments Synced:", envData);
        setEnvironments(envData);
        sessionStorage.setItem("cache_envs", JSON.stringify(envData));
      }
      if (Array.isArray(projData)) {
        console.log("Projects Synced:", projData);
        setProjects(projData);
        sessionStorage.setItem("cache_projs", JSON.stringify(projData));
      }

    } catch (err) {
      console.error("Infrastructure Sync Error:", err);
      // Optional: Handle unauthorized access explicitly
      if (err.message.includes("401")) {
         sessionStorage.removeItem("user");
         sessionStorage.removeItem("token");
         window.location.href = "/login";
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user?._id, user?.id]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // --- 4. CREATE LOGIC ---
  const handleCreateEnvironment = async (e) => {
    e.preventDefault();
    try {
      await api.post("/environments", form);
      fetchInitialData(); // Background refresh
      setShowModal(false);
      setForm({ name: "development", project_id: "" });
    } catch (err) {
      console.error("Creation error:", err);
      alert(err.message);
    }
  };

  // --- 5. UI RENDERING ---
  if (loading && environments.length === 0) {
    return (
      <div className="loader-full">
        <div className="spinner"></div>
        <p>Synchronizing Cloud Infrastructure...</p>
      </div>
    );
  }

  return (
    <div className="env-page">
      <header className="env-header">
        <div className="header-text">
          <h1>
            Cloud Environments
            {isRefreshing && <span className="sync-indicator">Refreshing...</span>}
          </h1>
          <p>Real-time health and status of your deployment clusters.</p>
        </div>
        {(role === "admin" || role === "devops") && (
          <button className="primary-btn" onClick={() => setShowModal(true)}>
            <span className="plus">+</span> New Environment
          </button>
        )}
      </header>

      <div className="env-grid">
        {environments.length > 0 ? (
          environments.map((env) => (
            <div key={env._id} className="env-card fade-in">
              <div className="card-top">
                <div className="project-info">
                  <span className="project-tag">
                    {env.project_id?.name || "Independent"}
                  </span>
                  <h3>{env.name?.toUpperCase()}</h3>
                </div>
                <div className="status-pill healthy">
                  <span className="dot"></span> Online
                </div>
              </div>

              <div className="card-body">
                <div className="stat-line">
                  <label>Current Version</label>
                  <span>{env.last_deployment?.version || "No build"}</span>
                </div>
                <div className="stat-line">
                  <label>Region</label>
                  <span>us-east-1</span>
                </div>
              </div>

              <div className="card-actions">
                <button className="text-btn">View logs</button>
                <button className="icon-btn">⚙</button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">No infrastructure found.</div>
        )}
      </div>

      {/* PROVISION MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Provision New Tier</h3>
              <p>Configure a dedicated deployment stage for your project.</p>
            </div>
            <form onSubmit={handleCreateEnvironment}>
              <div className="form-group">
                <label>Target Project</label>
                <select
                  value={form.project_id}
                  onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                  required
                >
                  <option value="">-- Select Project --</option>
                  {projects.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Environment Tier</label>
                <select
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                >
                  <option value="development">Development</option>
                  <option value="testing">Testing</option>
                  <option value="production">Production</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Initialize Tier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Environments;