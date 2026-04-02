import React, { useState, useMemo, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./AuditLogs.css";
import { api } from "../services/api";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [userFilter, setUserFilter] = useState("All Users");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await api.get("/audit-logs");
        setLogs(data);
      } catch (err) {
        console.error("Failed to fetch audit logs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const uniqueUsers = useMemo(() => {
    const users = logs.map((d) => d.user?.name || "System");
    return ["All Users", ...new Set(users)];
  }, [logs]);

  const filteredData = useMemo(() => {
    return logs.filter((item) => {
      const userName = item.user?.name || "System";
      const matchSearch =
        userName.toLowerCase().includes(search.toLowerCase()) ||
        item.action.toLowerCase().includes(search.toLowerCase()) ||
        item.resource.toLowerCase().includes(search.toLowerCase());

      const matchUser =
        userFilter === "All Users" || userName === userFilter;

      const itemDate = new Date(item.timestamp);
      const matchStart = startDate ? itemDate >= new Date(startDate) : true;
      const matchEnd = endDate
        ? itemDate <= new Date(endDate + "T23:59:59")
        : true;

      return matchSearch && matchUser && matchStart && matchEnd;
    });
  }, [logs, search, startDate, endDate, userFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, startDate, endDate, userFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Audit Logs Report", 14, 15);

    autoTable(doc, {
      startY: 22,
      head: [["Timestamp", "User", "Action", "Resource", "IP Address"]],
      body: filteredData.map((item) => [
        new Date(item.timestamp).toLocaleString(),
        item.user?.name || "System",
        item.action,
        item.resource,
        item.ip,
      ]),
    });

    doc.save("audit-logs.pdf");
  };

  const getBadgeClass = (action) => {
    if (action.includes("Delete")) return "badge badge-delete";
    if (action.includes("Update") || action.includes("Modified")) return "badge badge-update";
    if (action.includes("Login")) return "badge badge-login";
    if (action.includes("Deployment")) return "badge badge-deploy";
    if (action.includes("Modified")) return "badge badge-modify";
    return "badge";
  };

  if (loading) {
    return <div className="loader-full"><div className="spinner"></div><p>Retrieving Compliance Logs...</p></div>;
  }

  return (
    <div className="audit-container">
      {/* Header */}
      <div className="audit-header">
        <h2 className="audit-title">System Audit & Compliance Logs</h2>
        <button className="export-btn" onClick={exportPDF}>
          Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="audit-filters">
        <input
          type="text"
          placeholder="Search action, resource..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />

        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
        >
          {uniqueUsers.map((user, index) => (
            <option key={index} value={user}>
              {user}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <table className="audit-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>User</th>
            <th>Action</th>
            <th>Resource</th>
            <th>IP Address</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.length > 0 ? (
            paginatedData.map((item) => (
              <tr key={item._id}>
                <td>{new Date(item.timestamp).toLocaleString()}</td>
                <td>
                  <div className="user-info-cell">
                    <strong>{item.user?.name || "System"}</strong>
                    <span className="user-email-sub">{item.user?.email || ""}</span>
                  </div>
                </td>
                <td>
                  <span className={getBadgeClass(item.action)}>
                    {item.action}
                  </span>
                </td>
                <td>{item.resource}</td>
                <td><code>{item.ip}</code></td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="no-data">
                No records found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              className={`page-btn ${currentPage === index + 1 ? "active" : ""
                }`}
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}