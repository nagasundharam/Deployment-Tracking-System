import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Plus, Search } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { api } from "../services/api";
import "./Dashboard.css";

// Helper for Relative Time
function timeSince(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " mins ago";
  return Math.floor(seconds) + " seconds ago";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const role = (user?.role || "developer").toLowerCase();

  const [deployments, setDeployments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [depData, projData] = await Promise.all([
          api.get("/deployments"),
          api.get("/projects")
        ]);
        setDeployments(depData);
        setProjects(projData);
        setLoading(false);
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
        setLoading(false);
      }
    };
    fetchDashboardData();
    
    // Poll every 10 seconds for live updates
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Compute Metrics
  const metrics = useMemo(() => {
    let successCount = 0;
    let completedCount = 0;
    let recentFailuresCount = 0;
    let activeCount = 0;
    
    const now = new Date();
    
    deployments.forEach(d => {
      const status = (d.status || "").toLowerCase();
      // Completed calculation
      if (["success", "failure", "failed"].includes(status)) {
        completedCount++;
        if (status === "success") successCount++;
      }
      // Active calculation
      if (status === "running" || status === "pending") {
        activeCount++;
      }
      // Failures in 24h
      if (["failure", "failed"].includes(status)) {
        const depDate = new Date(d.createdAt);
        if ((now - depDate) <= 86400000) { // 24 hours in ms
          recentFailuresCount++;
        }
      }
    });

    const successRate = completedCount === 0 ? 0 : ((successCount / completedCount) * 100).toFixed(1);

    return {
      totalDeployments: deployments.length,
      totalProjects: projects.length,
      successRate,
      recentFailuresCount,
      activeCount
    };
  }, [deployments, projects]);

  // Compute Time-Series Chart Data (Last 7 Days)
  const activityData = useMemo(() => {
    const map = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      map[label] = { name: label, deployments: 0, failures: 0 };
    }
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    deployments.forEach(d => {
      const depDate = new Date(d.createdAt);
      depDate.setHours(0,0,0,0);
      const diffDays = Math.floor((today - depDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0 && diffDays <= 6) {
        const label = depDate.toLocaleDateString("en-US", { weekday: "short" });
        if (map[label]) {
           map[label].deployments += 1;
           if (["failed", "failure"].includes(d.status.toLowerCase())) {
             map[label].failures += 1;
           }
        }
      }
    });
    return Object.values(map);
  }, [deployments]);

  // Compute Distribution Chart Data
  const distributeData = useMemo(() => {
    let s = 0, f = 0, p = 0;
    deployments.forEach(d => {
      const stat = d.status.toLowerCase();
      if (stat === "success") s++;
      else if (stat === "failed" || stat === "failure") f++;
      else p++;
    });
    return [
      { name: "Success", value: s },
      { name: "Pending/Running", value: p },
      { name: "Failed", value: f },
    ];
  }, [deployments]);

  const PIE_COLORS = ["#10b981", "#3b82f6", "#ef4444"];

  const recentDeployments = useMemo(() => {
    return deployments
      .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);
  }, [deployments]);

  if (loading) {
     return <div className="loader-container"><h2>Loading Metrics...</h2></div>;
  }

  return (
    <div className="dashboard">
      {/* Top Bar */}
      <div className="topbar">
        <div className="search-wrapper">
          <span className="search-icon"><Search size={16} /></span>
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
            <p className="name">{user?.name || "Admin"}</p>
            <p className="role">{user?.role || "Administrator"}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header Section */}
        <div className="header-section">
          <div>
            <h1>Deployment Overview</h1>
            <p>Monitor system performance and deployment activity in real-time.</p>
          </div>
          {(role === "admin" || role === "devops") && (
            <button className="btn-primary" onClick={() => navigate("/deployments")}>
              <Plus size={18} style={{ marginRight: '4px' }} />
              Manage Deployments
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="stats">
          <StatCard title="Total Projects" value={metrics.totalProjects} />
          <StatCard title="Total Deployments" value={metrics.totalDeployments} />
          <StatCard title="Success Rate" value={`${metrics.successRate}%`} />
          <StatCard title="Failures (24h)" value={metrics.recentFailuresCount} danger={metrics.recentFailuresCount > 0} />
          <StatCard title="Active Pipelines" value={metrics.activeCount} info={metrics.activeCount > 0} />
        </div>

        {/* Charts */}
        <div className="charts">
          <div className="chart large premium-card">
            <h3 style={{marginBottom: '24px'}}>Deployment Activity (Last 7 Days)</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <AreaChart data={activityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDeployments" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorFailures" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{fill: '#94a3b8'}} />
                  <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', background: '#1e293b', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)'}}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Area type="monotone" dataKey="deployments" stroke="#4f46e5" fillOpacity={1} fill="url(#colorDeployments)" name="Deployments" />
                  <Area type="monotone" dataKey="failures" stroke="#ef4444" fillOpacity={1} fill="url(#colorFailures)" name="Failures" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="chart premium-card">
            <h3 style={{marginBottom: '24px'}}>Status Distribution</h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={distributeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {distributeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', background: '#1e293b', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)'}}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span style={{ color: '#cbd5e1' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card premium-card">
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <h3>Recent Deployments</h3>
            <button className="text-btn" onClick={() => navigate("/deployments")}>View All</button>
          </div>

          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Build ID</th>
                <th>Project / Env</th>
                <th>Commit Message</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentDeployments.length > 0 ? (
                 recentDeployments.map(dep => {
                   const statusName = dep.status?.toLowerCase() || 'pending';
                   const badgeClass = (statusName === 'failed' || statusName === 'failure' || statusName === 'rejected') ? 'error' : (statusName === 'success' || statusName === 'approved' ? 'success' : 'pending');
                   
                   return (
                   <tr key={dep._id}>
                     <td style={{fontFamily: 'monospace', fontWeight: 600, color: '#818cf8'}}>#{dep.pipeline_id || dep._id.slice(-6).toUpperCase()}</td>
                     <td>
                        <div style={{fontWeight: 600}}>{dep.project_id?.name || "Unknown Project"}</div>
                        <div style={{fontSize: '12px', color: '#94a3b8'}}>{dep.environment_id?.name || "Unknown Environment"}</div>
                     </td>
                     <td style={{maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                        {dep.commit_message || "Manual Trigger"}
                     </td>
                     <td>
                        <span className={`badge badge-${badgeClass}`} style={{textTransform: 'uppercase'}}>
                           {dep.status}
                        </span>
                        <div style={{fontSize: '11px', color: '#64748b', marginTop: '4px'}}>{timeSince(dep.createdAt)}</div>
                     </td>
                     <td>
                        <button className="btn-secondary" style={{padding: '6px 12px', fontSize: '13px'}} onClick={() => navigate(`/deployments/${dep._id}`)}>
                          View Details
                        </button>
                     </td>
                   </tr>
                 )})
              ) : (
                <tr>
                   <td colSpan="5" className="no-data" style={{textAlign: 'center', padding: '32px', color: '#64748b'}}>
                      No deployments found.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, danger, info }) {
  return (
    <div className={`stat-card premium-card ${danger ? "danger" : ""} ${info ? "info" : ""}`}>
      <p>{title}</p>
      <h2>{value}</h2>
      {danger && <div className="stat-glow red"></div>}
      {info && !danger && <div className="stat-glow blue"></div>}
    </div>
  );
}
