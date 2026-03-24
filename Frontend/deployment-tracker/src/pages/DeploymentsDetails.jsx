import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import "./DeploymentDetails.css";

const DeploymentDetails = () => {
  const { id } = useParams();
  const [deployment, setDeployment] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role || "developer";
  const currentUserId = user?.id || user?._id;
  
  // Ref to automatically scroll the terminal to the bottom
  const terminalEndRef = useRef(null);

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Fetch Deployment & Logs from Backend
  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch Deployment Status
      const depRes = await fetch(
        `http://localhost:5000/api/deployments/${id}`,
        { headers }
      );
      const depData = await depRes.json();
      setDeployment(depData);

      // Fetch Logs
      const logRes = await fetch(
        `http://localhost:5000/api/deployments/${id}/logs`,
        { headers }
      );
      const logData = await logRes.json();
      setLogs(logData);

      setLoading(false);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  }, [id]);

  // 2. Polling Logic: Updates every 3 seconds only if active
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (deployment?.status === "running" || deployment?.status === "pending") {
      const interval = setInterval(() => {
        fetchData();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [deployment?.status, fetchData]);

  // 3. Auto-scroll terminal when new logs arrive
  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const sendAuditEvent = useCallback(
    async (action) => {
      try {
        const token = localStorage.getItem("token");
        const username = user?.username || user?.name || "unknown";
        const projectName = deployment?.project_id?.name || "Unknown Project";

        await fetch("http://localhost:5000/api/audit-logs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action,
            resource: projectName,
            user: username,
          }),
        });
      } catch (err) {
        console.error("Audit error", err);
      }
    },
    [deployment?.project_id?.name, user]
  );

  const isCreator = useMemo(() => {
    if (!deployment || !currentUserId) return false;
    const rawUserId = deployment.triggered_by?.user_id;
    const creatorId =
      typeof rawUserId === "string" ? rawUserId : rawUserId?._id;
    return !!creatorId && creatorId === currentUserId;
  }, [deployment, currentUserId]);

  const canApprove =
    (role === "admin" || role === "devops") &&
    deployment?.status === "pending" &&
    !isCreator &&
    (deployment?.environment_id?.name || "")
      .toLowerCase()
      .includes("production");

  const canCancel =
    (role === "admin" || role === "devops") &&
    deployment?.status === "running";

  const canRedeploy =
    deployment &&
    (deployment.status === "success" || deployment.status === "failed");

  const canReject =
    (role === "admin" || role === "devops") &&
    deployment?.status === "pending";

  const ensureStages = useMemo(() => {
    if (!deployment) return [];
    const defaultStages = [
      "Build",
      "Test",
      "Security Scan",
      "Deploy",
      "Verify",
    ];

    if (Array.isArray(deployment.stages) && deployment.stages.length) {
      // Ensure every known stage has a status; fallback to pending
      return defaultStages.map((name, idx) => {
        const existing =
          deployment.stages.find(
            (s) => s.name?.toLowerCase() === name.toLowerCase()
          ) || deployment.stages[idx];
        return {
          name,
          status: existing?.status || "pending",
        };
      });
    }

    // Derive simple stage progression from overall status
    const overall = (deployment.status || "pending").toLowerCase();
    const order = ["pending", "approved", "running", "success", "failed"];
    const idx = order.indexOf(overall);

    return defaultStages.map((name, index) => {
      if (overall === "failed") {
        if (index < 3) return { name, status: "success" };
        if (index === 3) return { name, status: "failed" };
        return { name, status: "pending" };
      }
      if (overall === "success") {
        return { name, status: "success" };
      }
      if (overall === "running") {
        if (index === 0) return { name, status: "running" };
        return { name, status: "pending" };
      }
      return { name, status: "pending" };
    });
  }, [deployment]);

  const updateStatus = useCallback(
    async (nextStatus, auditLabel) => {
      try {
        setActionLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch(
          `http://localhost:5000/api/deployments/${id}/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              status: nextStatus,
            }),
          }
        );

        if (!res.ok) {
          const msg = await res.text();
          console.error("Status update failed", msg);
          alert("Unable to update deployment status.");
        } else if (auditLabel) {
          await sendAuditEvent(auditLabel);
        }
        await fetchData();
      } catch (err) {
        console.error("Update status error", err);
      } finally {
        setActionLoading(false);
      }
    },
    [fetchData, id, sendAuditEvent]
  );

  const handleApprove = useCallback(async () => {
    if (!canApprove) return;
    await updateStatus("approved", "Deployment Approved");
  }, [canApprove, updateStatus]);

  const handleReject = useCallback(async () => {
    if (!canReject) return;
    await updateStatus("rejected", "Deployment Rejected");
  }, [canReject, updateStatus]);

  const handleCancel = useCallback(async () => {
    if (!canCancel) return;
    await updateStatus("cancelled", "Deployment Cancelled");
  }, [canCancel, updateStatus]);

  const handleRedeploy = useCallback(async () => {
    if (!canRedeploy) return;
    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/deployments/${id}/redeploy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        const msg = await res.text();
        console.error("Redeploy failed", msg);
        alert("Unable to redeploy.");
      } else {
        await sendAuditEvent("Deployment Redeployed");
        alert("Redeploy started with a new deployment instance.");
      }
    } catch (err) {
      console.error("Redeploy error", err);
    } finally {
      setActionLoading(false);
    }
  }, [canRedeploy, id, sendAuditEvent]);

  if (loading) return <div className="loader-container"><h2>Initializing Terminal...</h2></div>;
  if (!deployment) return <div className="error-container"><h2>Deployment Not Found</h2></div>;

  return (
    <div className="details-container">
      {/* Header Section */}
      <div className="details-header">
        <div>
          <h1>Deployment #{deployment._id.slice(-6).toUpperCase()}</h1>
          <div className="status-group">
            <span className={`status-badge ${deployment.status}`}>
              {deployment.status.toUpperCase()}
            </span>
            <span className="env-label">{deployment.environment_id?.name}</span>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={async () => {
              const token = localStorage.getItem("token");
              const res = await fetch(
                `http://localhost:5000/api/deployments/${id}/report?format=pdf`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              const blob = await res.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `deployment-${deployment._id}.pdf`;
              a.click();
              window.URL.revokeObjectURL(url);
            }}
          >
            Export Report
          </button>
          <button
            className="btn-secondary"
            onClick={async () => {
              const token = localStorage.getItem("token");
              const res = await fetch(
                `http://localhost:5000/api/deployments/${id}/report?format=csv`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              const blob = await res.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `deployment-${deployment._id}.csv`;
              a.click();
              window.URL.revokeObjectURL(url);
            }}
          >
            Export CSV
          </button>
          {canRedeploy && (
            <button
              className="btn-primary"
              disabled={actionLoading}
              onClick={handleRedeploy}
            >
              Redeploy
            </button>
          )}
        </div>
      </div>

      <div className="details-grid">
        {/* Left Column: Info & Logs */}
        <div className="left-panel">
          <div className="card info-card">
            <h3>Project: {deployment.project_id?.name}</h3>
            <div className="meta-info">
              <p><strong>Version:</strong> {deployment.version}</p>
              <p><strong>Branch:</strong> {deployment.branch}</p>
              <p><strong>Triggered By:</strong> {deployment.triggered_by?.username || "System"}</p>
            </div>
          </div>

          {deployment.status === "pending" && (
            <div className="card approval-card animate-pulse">
              <h3>Awaiting Manual Gate</h3>
              <p>Please review configurations before proceeding to production rollout.</p>
              <div className="approval-actions">
                {canApprove && (
                  <button
                    className="btn-primary"
                    disabled={actionLoading}
                    onClick={handleApprove}
                  >
                    Approve Deployment
                  </button>
                )}
                {canReject && (
                  <button
                    className="btn-secondary danger"
                    disabled={actionLoading}
                    onClick={handleReject}
                  >
                    Reject Deployment
                  </button>
                )}
              </div>
            </div>
          )}

          {deployment.status === "running" && (
            <div className="card approval-card running-banner">
              <h3>Deployment In Progress</h3>
              <p>Live logs are streaming from the pipeline.</p>
              {canCancel && (
                <button
                  className="btn-secondary danger"
                  disabled={actionLoading}
                  onClick={handleCancel}
                >
                  Cancel Deployment
                </button>
              )}
            </div>
          )}

          <div className="card terminal-card">
            <div className="terminal-header">
              <span>console_output.log</span>
              <div className="terminal-dots"><span></span><span></span><span></span></div>
            </div>
            <div className="fake-terminal">
              <p className="line system">{`> [SYSTEM] Connection established to build-node-01`}</p>
              {logs.map((log, index) => (
                <p
                  key={index}
                  className={`line ${log.logs_type || "info"}`}
                >
                  {`> [${(log.logs_type || "info").toUpperCase()}] ${
                    log.message
                  }`}
                </p>
              ))}
              {deployment.status === "running" && <p className="line cursor">_</p>}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>

        {/* Right Column: Pipeline Viz */}
        <div className="right-panel">
          <div className="card pipeline-card">
            <h3>Deployment Pipeline</h3>
            <div className="pipeline-container">
              {deployment.stages.map((stage, index) => (
                <div key={index} className={`pipeline-stage ${stage.status}`}>
                  <div className="stage-icon">
                    {stage.status === "success" ? "✔" : stage.status === "running" ? "⏳" : "○"}
                  </div>
                  <div className="stage-info">
                    <span className="stage-name">{stage.name}</span>
                    <span className="stage-status">{stage.status}</span>
                  </div>
                  {index !== deployment.stages.length - 1 && (
                    <div className={`connector ${stage.status === 'success' ? 'filled' : ''}`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentDetails;