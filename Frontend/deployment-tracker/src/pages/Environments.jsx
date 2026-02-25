import React, { useState } from "react";
import "./Environment.css";

const initialData = [
  {
    id: 1,
    name: "Development",
    region: "us-east-1 (N. Virginia)",
    health: 99.9,
    issue: "",
    nodes: 5,
    activeNodes: 5,
    version: "v2.5.0-dev.12",
  },
  {
    id: 2,
    name: "Staging",
    region: "eu-central-1 (Frankfurt)",
    health: 84.2,
    issue: "Memory Pressure",
    nodes: 3,
    activeNodes: 2,
    version: "v2.4.8-rc.2",
  },
  {
    id: 3,
    name: "Production",
    region: "Global (Edge Clusters)",
    health: 99.99,
    issue: "",
    nodes: 12,
    activeNodes: 12,
    version: "v2.4.7-stable",
  },
  {
    id: 4,
    name: "QA / Legacy",
    region: "internal-dc-01",
    health: 40,
    issue: "Database Connection Failure",
    nodes: 2,
    activeNodes: 1,
    version: "v2.3.15",
  },
];

const Environments = () => {
  const [environments, setEnvironments] = useState(initialData);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    region: "",
    nodes: 3,
  });

  const getStatus = (env) => {
    if (env.issue && env.health < 60) return "Critical";
    if (env.health < 90) return "Warning";
    return "Healthy";
  };

  const refreshStatuses = () => {
    setEnvironments((prev) =>
      prev.map((env) => {
        const randomHealth = +(Math.random() * 30 + 70).toFixed(2);
        return {
          ...env,
          health: randomHealth,
          issue:
            randomHealth < 60
              ? "Database Connection Failure"
              : randomHealth < 85
              ? "Memory Pressure"
              : "",
        };
      })
    );
  };

  const handleCreateEnvironment = (e) => {
    e.preventDefault();

    const newEnv = {
      id: Date.now(),
      name: form.name,
      region: form.region,
      health: 100,
      issue: "",
      nodes: Number(form.nodes),
      activeNodes: Number(form.nodes),
      version: "v1.0.0",
    };

    setEnvironments((prev) => [...prev, newEnv]);
    setShowModal(false);
    setForm({ name: "", region: "", nodes: 3 });
  };

  return (
    <div className="env-page">
      <div className="env-header">
        <div>
          <h2>Infrastructure Environments Overview</h2>
          <p>
            Manage and monitor cluster health across all deployment environments.
          </p>
        </div>

        <div className="header-actions">
          <button className="refresh-btn" onClick={refreshStatuses}>
            ↻ Refresh Status
          </button>
          <button
            className="primary-btn"
            onClick={() => setShowModal(true)}
          >
            + Add Environment
          </button>
        </div>
      </div>

      <div className="env-grid">
        {environments.map((env) => {
          const status = getStatus(env);

          return (
            <div key={env.id} className="env-card">
              <div className="env-card-header">
                <div>
                  <h3>{env.name}</h3>
                  <span className="region">{env.region}</span>
                </div>
                <span className={`status ${status.toLowerCase()}`}>
                  ● {status}
                </span>
              </div>

              <div className="env-body">
                <div className="env-row">
                  <span>Cluster Health</span>
                  <strong>
                    {env.issue
                      ? `${env.health}% (${env.issue})`
                      : `${env.health}% Uptime`}
                  </strong>
                </div>

                <div className="env-row">
                  <span>Node Availability</span>
                  <strong>
                    {env.activeNodes}/{env.nodes} Active
                  </strong>

                  <div className="node-bars">
                    {Array.from({ length: env.nodes }).map((_, i) => (
                      <span
                        key={i}
                        className={
                          i < env.activeNodes
                            ? "bar active"
                            : "bar inactive"
                        }
                      ></span>
                    ))}
                  </div>
                </div>

                <div className="env-row">
                  <span>Deployed Version</span>
                  <code>{env.version}</code>
                </div>
              </div>

              <div className="env-actions">
                <button className="outline-btn">⚙ Edit Config</button>
                <button className="outline-btn">📊 View Metrics</button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Create Environment</h3>
            <form onSubmit={handleCreateEnvironment}>
              <input
                placeholder="Environment Name"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                required
              />
              <input
                placeholder="Region"
                value={form.region}
                onChange={(e) =>
                  setForm({ ...form, region: e.target.value })
                }
                required
              />
              <input
                type="number"
                placeholder="Nodes"
                value={form.nodes}
                onChange={(e) =>
                  setForm({ ...form, nodes: e.target.value })
                }
                required
              />

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Environments;