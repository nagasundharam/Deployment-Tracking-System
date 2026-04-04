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
  
  const terminalEndRef = useRef(null);

  const formatDuration = (start, end) => {
    if (!start || !end) return "";
    const diff = Math.floor((new Date(end) - new Date(start)) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

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
        `${import.meta.env.VITE_API_URL}/deployments/${id}`,
        { headers }
      );
      const depData = await depRes.json();
      setDeployment(depData);

      // Fetch Logs
      const logRes = await fetch(
        `${import.meta.env.VITE_API_URL}/deployments/${id}/logs`,
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

        await fetch(`${import.meta.env.VITE_API_URL}/audit-logs`, {
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

  const canRollback =
    deployment &&
    deployment.status === "success";

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
          `${import.meta.env.VITE_API_URL}/deployments/${id}/status`,
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
        `${import.meta.env.VITE_API_URL}/deployments/${id}/redeploy`,
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
        const data = await res.json();
        alert("Redeploy initiated!");
        navigate(`/deployments/${data._id}`);
      }
    } catch (err) {
      console.error("Redeploy error", err);
    } finally {
      setActionLoading(false);
    }
  }, [canRedeploy, id, navigate]);

  const handleRollback = useCallback(async () => {
    if (!canRollback) return;
    const confirm = window.confirm("Are you sure you want to rollback to this version?");
    if (!confirm) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/deployments/${id}/rollback`,
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
        console.error("Rollback failed", msg);
        alert("Unable to rollback.");
      } else {
        const data = await res.json();
        alert("Rollback initiated! Redirecting to new deployment...");
        navigate(`/deployments/${data._id}`);
      }
    } catch (err) {
      console.error("Rollback error", err);
    } finally {
      setActionLoading(false);
    }
  }, [canRollback, id, navigate]);

  if (loading) return <div className="loader-container"><h2>Initializing Terminal...</h2></div>;
  if (!deployment) return <div className="error-container"><h2>Deployment Not Found</h2></div>;

  return (
    <div className="modern-details-container">
      {/* Clean Top Navbar */}
      <div className="modern-header">
        <div className="header-title">
          <button className="back-btn" onClick={() => window.history.back()}>←</button>
          <h1>Deployment #{deployment._id.slice(-6).toUpperCase()}</h1>
          <span className={`status-pill ${deployment.status}`}>
            {deployment.status === "pending" ? "Pending Approval" : deployment.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        <div className="header-actions">
          {canRedeploy && (
            <button className="btn-outline history-btn" disabled={actionLoading} onClick={handleRedeploy}>
              ↺ Redeploy
            </button>
          )}
          {canRollback && (
             <button className="btn-danger rollback-btn" disabled={actionLoading} onClick={handleRollback}>
               ↺ Rollback
             </button>
          )}
        </div>
      </div>

      <div className="modern-grid-wrapper">
        <div className="main-content-column">
          {/* Project Meta Card */}
          <div className="premium-card meta-hero-card">
            <div className="hero-header">
               <div className="project-title-group">
                  <div className="project-icon">📦</div>
                  <div>
                     <h2>{deployment.project_id?.name || "Unknown Project"}</h2>
                     <p className="env-subtitle">
                       Target Environment: <strong>{deployment.environment_id?.name || "Environment"}</strong> {deployment.environment_id?.region ? `(Region: ${deployment.environment_id?.region})` : ""}
                     </p>
                  </div>
               </div>
               <div className="triggered-at">
                  <span>TRIGGERED AT</span>
                  <p>{new Date(deployment.start_time || deployment.createdAt).toLocaleString()}</p>
               </div>
            </div>
            <div className="hero-grid">
               <div className="hero-stat">
                  <label>VERSION</label>
                  <div className="stat-val highlight-blue">● {deployment.version}</div>
               </div>
               <div className="hero-stat">
                  <label>COMMIT HASH</label>
                  <div className="stat-val commit-link-wrapper">
                     <span className="code-bracket">&lt;/&gt;</span> {deployment.commit_hash ? (
                        <a href={deployment.project_id?.repo_url ? `${deployment.project_id.repo_url.replace('.git', '')}/commit/${deployment.commit_hash}` : "#"} target="_blank" rel="noopener noreferrer" className="short-hash">
                          {deployment.commit_hash.slice(0, 7)}
                        </a>
                     ) : "N/A"}
                     <span className="copy-icon" onClick={() => navigator.clipboard.writeText(deployment.commit_hash)}>📋</span>
                  </div>
               </div>
               <div className="hero-stat">
                  <label>TRIGGERED BY</label>
                  <div className="stat-val author-flex">
                     <div className="author-avatar">{deployment.commit_author?.charAt(0).toUpperCase() || deployment.triggered_by?.username?.charAt(0).toUpperCase() || "S"}</div>
                     <span>{deployment.commit_author || deployment.triggered_by?.username || "System"}</span>
                  </div>
               </div>
               <div className="hero-stat">
                  <label>REPOSITORY</label>
                  <div className="stat-val repo-flex">
                    <span className="repo-icon">🐙</span>
                    <span className="repo-text">{deployment.project_id?.repo_url ? new URL(deployment.project_id.repo_url).pathname.slice(1).replace('.git','') : "org/repo"}</span>
                  </div>
               </div>
            </div>

            {/* Commit Message & Pusher Block */}
            {deployment.commit_message && (
               <div className="commit-message-block">
                 <span className="quote-icon">❝</span>
                 <div className="commit-text-content">
                    <p className="msg-text">{deployment.commit_message}</p>
                    <p className="pushed-by">Pushed by <strong>{deployment.commit_author || deployment.triggered_by?.username || "System"}</strong></p>
                 </div>
               </div>
            )}

            {/* Pending Approval Portal embedded here if pending */}
            {deployment.status === "pending" && (
              <div className="approval-portal">
                 <div className="portal-left">
                    <div className="portal-icon">🛡️</div>
                    <div className="portal-text">
                      <h3>Awaiting Manual Approval</h3>
                      <p>This deployment requires verification from a DevOps Admin before proceeding to production traffic routing.</p>
                    </div>
                 </div>
                 <div className="portal-actions">
                    {canReject && <button className="btn-text-danger" onClick={handleReject} disabled={actionLoading}>× Reject</button>}
                    {canApprove && <button className="btn-solid-primary" onClick={handleApprove} disabled={actionLoading}>✔ Approve & Deploy</button>}
                 </div>
              </div>
            )}
          </div>

          {/* Diff View / Config diff */}
          <div className="diff-card">
             <div className="diff-header">
               <span>CONFIGURATION DIFF</span>
               <div className="diff-stats">
                  <span className="diff-add">+12 lines</span>
                  <span className="diff-del">-4 lines</span>
               </div>
               <span className="diff-expand">⛶</span>
             </div>
             <div className="diff-content dark-terminal line-numbers">
                {deployment.config_diff ? (
                   <pre>{deployment.config_diff}</pre>
                ) : (
                   <pre>
{`24  spec:
25    replicas: 5
26    strategy:
27      type: RollingUpdate
28      rollingUpdate:
29        maxSurge: 25%
30  # old resource limits
31    resources:
32      limits:
33        cpu: "500m"`}
                   </pre>
                )}
             </div>
          </div>
          
          {/* Live Logs Component if running or if user wants to see history */}
          {(deployment.status === "running" || logs.length > 0) && (
            <div className="diff-card" style={{marginTop: '24px'}}>
               <div className="diff-header" style={{background: '#0f172a', borderBottom: '1px solid #1e293b'}}>
                 <span style={{color: '#94a3b8', fontSize: '11px', letterSpacing: '1px'}}>CONSOLE OUTPUT</span>
                 <span style={{color: '#64748b', fontSize: '11px'}}>{deployment.node_name || 'build-node'}</span>
               </div>
               <div className="diff-content dark-terminal fake-terminal">
                  <p className="line system">{`> [SYSTEM] Connection established to ${deployment.node_name || 'build-node-01'}`}</p>
                  {logs.map((log, index) => (
                    <p key={index} className={`line ${log.logs_type || "info"}`}>
                      {`> [${(log.logs_type || "info").toUpperCase()}] ${log.message}`}
                    </p>
                  ))}
                  {deployment.status === "running" && <p className="line cursor">_</p>}
                  <div ref={terminalEndRef} />
               </div>
            </div>
          )}

          {/* Global Dashboard Stats */}
          <div className="bottom-stats-row">
             <div className="bottom-stat premium-card">
                <div className="stat-header">
                  <div className="stat-title">Pending Approvals</div>
                  <span className="stat-icon amber">⏳</span>
                </div>
                <div className="stat-value">3 <span className="stat-sub">Tasks across 2 projects</span></div>
             </div>
             <div className="bottom-stat premium-card">
                <div className="stat-header">
                  <div className="stat-title">Pipeline Success Rate</div>
                  <span className="stat-icon green">✔</span>
                </div>
                <div className="stat-value">94.2% <span className="stat-sub green-text">↑ 1.2%</span></div>
             </div>
             <div className="bottom-stat premium-card">
                <div className="stat-header">
                  <div className="stat-title">System Health</div>
                  <span className="stat-icon blue">🛡️</span>
                </div>
                <div className="stat-value green-text">Optimal <span className="stat-sub string-color">All systems operational</span></div>
             </div>
          </div>

        </div>

        <div className="sidebar-column">
           {/* Vertical Timeline */}
           <div className="premium-card timeline-card">
              <h3>Deployment Timeline</h3>
              <div className="vertical-timeline">
                 {ensureStages.map((stage, idx) => (
                   <div key={idx} className={`v-stage-item ${stage.status}`}>
                      <div className="v-stage-icon">
                         {stage.status === 'success' && '✔'}
                         {stage.status === 'running' && '⏳'}
                         {stage.status === 'pending' && '○'}
                         {stage.status === 'failure' && '×'}
                      </div>
                      <div className="v-stage-content">
                         <h4>{stage.name}</h4>
                         <p className="stage-meta">
                            {stage.name.toLowerCase().includes('build') ? (
                               deployment.artifacts?.[0] ? `Artifact: ${deployment.artifacts[0].name}` : "Building assets..."
                            ) : stage.name.toLowerCase().includes('deploy') ? (
                               `Deploying to ${deployment.environment_id?.name || 'cluster'}`
                            ) : stage.name.toLowerCase().includes('scan') ? (
                               `Security and Vulnerability Scans`
                            ) : (
                               `Status: ${stage.status}`
                            )}
                         </p>
                         <span className="stage-time">
                            {stage.status === 'success' ? `COMPLETED ${stage.end_time ? '• ' + new Date(stage.end_time).toLocaleTimeString() : ''}` : ''}
                            {stage.start_time && stage.end_time ? ` (${formatDuration(stage.start_time, stage.end_time)})` : ''}
                            {stage.status === 'running' ? `IN PROGRESS` : ''}
                            {stage.status === 'pending' ? `PENDING` : ''}
                         </span>
                      </div>
                      {idx < ensureStages.length - 1 && <div className={`v-connector ${stage.status === 'success' ? 'filled' : ''}`} />}
                   </div>
                 ))}
              </div>
           </div>

           {/* Cluster Health Widget */}
           <div className="premium-card health-card">
              <h3 style={{textTransform: 'uppercase', fontSize: '11px', color: '#64748b', letterSpacing: '1px', marginBottom: '20px'}}>CURRENT CLUSTER HEALTH</h3>
              
              <div className="health-metric">
                <div className="health-metric-header">
                   <span style={{fontWeight: 600, fontSize: '13px', color: '#1e293b'}}>API Response Time</span>
                   <span className="val-green" style={{color: '#10b981', fontWeight: 'bold'}}>{deployment.cluster_metrics?.response_time || "142ms"}</span>
                </div>
                <div className="health-bar-container">
                   <div className="health-bar green" style={{width: '35%', background: '#10b981'}}></div>
                </div>
              </div>

              <div className="health-metric" style={{marginTop: '24px'}}>
                <div className="health-metric-header">
                   <span style={{fontWeight: 600, fontSize: '13px', color: '#1e293b'}}>Memory Usage</span>
                   <span className="val-orange" style={{color: '#f59e0b', fontWeight: 'bold'}}>{deployment.cluster_metrics?.memory || "68%"}</span>
                </div>
                <div className="health-bar-container">
                   <div className="health-bar orange" style={{width: '68%', background: '#f59e0b'}}></div>
                </div>
              </div>
           </div>
           
           {/* Public URL Action */}
           {deployment.public_url && (
              <div className="premium-card" style={{padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer', border: '1px solid #10b981', background: '#ecfdf5'}} onClick={() => window.open(deployment.public_url, '_blank')}>
                <h3 style={{fontSize: '13px', color: '#065f46'}}>Application Live</h3>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                   <span style={{fontFamily: 'monospace', color: '#047857', fontSize: '12px'}}>{deployment.public_url}</span>
                   <span style={{color: '#10b981'}}>↗</span>
                </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default DeploymentDetails;