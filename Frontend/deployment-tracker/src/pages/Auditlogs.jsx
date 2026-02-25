import React, { useState, useMemo, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./AuditLogs.css";

const mockData = [
  {
    id: 1,
    timestamp: "2023-11-12T14:22:31",
    user: "Sarah Miller",
    action: "Deleted Project",
    resource: "Alpha-Legacy-Service",
    ip: "192.168.1.104",
  },
  {
    id: 2,
    timestamp: "2023-11-12T13:05:12",
    user: "John Doe",
    action: "Updated API Key",
    resource: "Staging-Secret-01",
    ip: "204.22.1.88",
  },
  {
    id: 3,
    timestamp: "2023-11-11T22:45:00",
    user: "System Process",
    action: "Auto-Deployment",
    resource: "Marketing-Frontend",
    ip: "internal-vpc-02",
  },
  {
    id: 4,
    timestamp: "2023-11-11T09:12:44",
    user: "David Chen",
    action: "User Login",
    resource: "Session-3921",
    ip: "45.122.90.12",
  },
  {
    id: 5,
    timestamp: "2023-11-11T08:00:21",
    user: "Emily Watson",
    action: "Modified Permissions",
    resource: "RBAC Group: Developers",
    ip: "82.33.151.4",
  },
];

export default function AuditLogs() {
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [userFilter, setUserFilter] = useState("All Users");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;

  const uniqueUsers = ["All Users", ...new Set(mockData.map((d) => d.user))];

  const filteredData = useMemo(() => {
    return mockData.filter((item) => {
      const matchSearch =
        item.user.toLowerCase().includes(search.toLowerCase()) ||
        item.action.toLowerCase().includes(search.toLowerCase()) ||
        item.resource.toLowerCase().includes(search.toLowerCase());

      const matchUser =
        userFilter === "All Users" || item.user === userFilter;

      const itemDate = new Date(item.timestamp);
      const matchStart = startDate ? itemDate >= new Date(startDate) : true;
      const matchEnd = endDate
        ? itemDate <= new Date(endDate + "T23:59:59")
        : true;

      return matchSearch && matchUser && matchStart && matchEnd;
    });
  }, [search, startDate, endDate, userFilter]);

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
        item.user,
        item.action,
        item.resource,
        item.ip,
      ]),
    });

    doc.save("audit-logs.pdf");
  };

  const getBadgeClass = (action) => {
    if (action.includes("Delete")) return "badge badge-delete";
    if (action.includes("Update")) return "badge badge-update";
    if (action.includes("Login")) return "badge badge-login";
    if (action.includes("Deployment")) return "badge badge-deploy";
    if (action.includes("Modified")) return "badge badge-modify";
    return "badge";
  };

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
              <tr key={item.id}>
                <td>{new Date(item.timestamp).toLocaleString()}</td>
                <td>{item.user}</td>
                <td>
                  <span className={getBadgeClass(item.action)}>
                    {item.action}
                  </span>
                </td>
                <td>{item.resource}</td>
                <td>{item.ip}</td>
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
              className={`page-btn ${
                currentPage === index + 1 ? "active" : ""
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