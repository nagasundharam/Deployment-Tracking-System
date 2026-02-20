import React, { useState } from "react";
import "./DeploymentDetails.css";

const DeploymentDetails = () => {
  const [status, setStatus] = useState("PENDING_APPROVAL");

  const approveDeployment = () => {
    setStatus("IN_PROGRESS");
  };

  const rejectDeployment = () => {
    setStatus("FAILED");
  };
  // Simulated database

const pipelineDatabase = {
  "DEP-8842": [
    {
      id: 1,
      name: "Build & Containerize",
      status: "COMPLETED",
      completedAt: "14:45:22"
    },
    {
      id: 2,
      name: "Vulnerability Scan",
      status: "COMPLETED",
      completedAt: "14:47:10"
    },
    {
      id: 3,
      name: "Staging Deployment",
      status: "COMPLETED",
      completedAt: "14:52:03"
    },
    {
      id: 4,
      name: "Production Approval",
      status: "IN_PROGRESS",
      completedAt: null
    },
    {
      id: 5,
      name: "Production Rollout",
      status: "PENDING",
      completedAt: null
    }
  ]
};
const stages = pipelineDatabase["DEP-8842"];

const getStageClass = (status) => {
  switch (status) {
    case "COMPLETED":
      return "completed";
    case "FAILED":
      return "failed";
    case "IN_PROGRESS":
      return "in-progress";
    case "PENDING":
    default:
      return "pending";
  }
};




  return (
    <div className="details-container">
      {/* Header */}
      <div className="details-header">
        <div>
          <h2>Deployment #DEP-8842</h2>
          <span className={`status-badge ${status}`}>
            {status.replace("_", " ")}
          </span>
        </div>

        <div className="header-actions">
          <button className="btn-outline">History</button>
          <button className="btn-danger">Rollback</button>
        </div>
      </div>

      <div className="details-grid">
        {/* LEFT SIDE */}
        <div className="left-panel">
          {/* Service Card */}
          <div className="card">
            <h3>Alpha-Core-Service</h3>
            <p className="sub-text">
              Target Environment: <b>Production (us-east-1)</b>
            </p>

            <div className="meta-grid">
              <div>
                <label>Version</label>
                <span>v2.4.12-stable</span>
              </div>
              <div>
                <label>Commit Hash</label>
                <span>7f2a1b8</span>
              </div>
              <div>
                <label>Triggered By</label>
                <span>Sarah Miller</span>
              </div>
              <div>
                <label>Repository</label>
                <span>org/alpha-core</span>
              </div>
            </div>
          </div>

          {/* Approval Card */}
          {status === "PENDING_APPROVAL" && (
            <div className="card approval-card">
              <h3>Awaiting Manual Approval</h3>
              <p>
                This deployment requires verification from a DevOps Admin
                before routing traffic.
              </p>

              <div className="approval-actions">
                <button className="btn-outline" onClick={rejectDeployment}>
                  Reject
                </button>
                <button className="btn-primary" onClick={approveDeployment}>
                  Approve & Deploy
                </button>
              </div>
            </div>
          )}

          {/* Config Diff */}
          <div className="card dark-card">
            <h4>Configuration Diff</h4>
            <pre>
{`spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
  resources:
    limits:
      cpu: "500m"`}
            </pre>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="right-panel">
          {/* Timeline */}
                <div className="card">
        <h3>Deployment Pipeline</h3>

        <div className="pipeline-container">
            {stages.map((stage, index) => (
            <div key={stage.id} className="pipeline-stage">
                <div className={`stage-indicator ${getStageClass(stage.status)}`}>
                {stage.status === "COMPLETED" && "✔"}
                {stage.status === "FAILED" && "✖"}
                {stage.status === "IN_PROGRESS" && "⏳"}
                {stage.status === "PENDING" && ""}
                </div>

                <div className="stage-content">
                <div className="stage-title">{stage.name}</div>
                <div className="stage-meta">
                    {stage.status}
                    {stage.completedAt && ` • ${stage.completedAt}`}
                </div>
                </div>

                {/* Vertical connector line */}
                {index !== stages.length - 1 && <div className="stage-connector"></div>}
            </div>
            ))}
        </div>
        </div>



          {/* Cluster Health */}
          <div className="card">
            <h3>Current Cluster Health</h3>
            <div className="health-item">
              API Response Time <span>142ms</span>
              <div className="bar green"></div>
            </div>
            <div className="health-item">
              Memory Usage <span>68%</span>
              <div className="bar orange"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="bottom-stats">
        <div className="stat-card">
          <h4>Pending Approvals</h4>
          <p>3 Tasks</p>
        </div>

        <div className="stat-card">
          <h4>Pipeline Success Rate</h4>
          <p>94.2%</p>
        </div>

        <div className="stat-card">
          <h4>System Health</h4>
          <p className="optimal">Optimal</p>
        </div>
      </div>
    </div>
  );
};

export default DeploymentDetails;
