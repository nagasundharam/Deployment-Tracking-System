import React, { useState, useEffect, useMemo } from "react";
import "./Users.css";
import CreateUserModal from "../components/CreateUserModal";
import { api } from "../services/api";

const PAGE_SIZE = 8;

const Users = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.get("/users/get");
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/users/delete/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleCreateOrUpdateUser = async (userPayload) => {
    try {
      const isEdit = !!editingUser;
      if (isEdit) {
        await api.put(`/users/update/${editingUser._id}`, userPayload);
      } else {
        await api.post("/users/create", userPayload);
      }
      await fetchUsers();
      setShowModal(false);
      setEditingUser(null);
    } catch (error) {
      console.error("Error saving user:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleBlockToggle = async (user) => {
    const action = user.isBlocked ? "unblock" : "block";
    try {
      const updated = await api.patch(`/users/${user._id}/${action}`);
      if (updated) {
        setUsers((prev) =>
          prev.map((u) => (u._id === user._id ? updated.user : u))
        );
      }
    } catch (error) {
      console.error(`Error trying to ${action} user:`, error);
    }
  };

  const filteredUsers = useMemo(() => {
    let list = [...users];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (u) =>
          u.name?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term)
      );
    }

    if (roleFilter !== "all") {
      list = list.filter((u) => u.role === roleFilter);
    }

    return list;
  }, [users, searchTerm, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString();
  };

  if (loading) return <div className="loader">Updating Team Records...</div>;

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h2>Team Directory</h2>
          <p>Manage access levels, status, and assignments for your team.</p>
        </div>
        <button
          className="primary-btn"
          onClick={() => {
            setEditingUser(null);
            setShowModal(true);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Invite Member
        </button>
      </div>

      <div className="users-toolbar">
        <div className="search-wrapper">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="filters-wrapper">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="developer">Developer</option>
            <option value="devops">DevOps Engineer</option>
          </select>
        </div>
      </div>

      <div className="users-table">
        <div className="users-table__header">
          <span>Avatar</span>
          <span>Name & Email</span>
          <span>Role</span>
          <span>Status</span>
          <span>Created</span>
          <span style={{ textAlign: "right", paddingRight: "8px" }}>Actions</span>
        </div>

        {paginatedUsers.length === 0 ? (
          <div className="no-data">No users found.</div>
        ) : (
          paginatedUsers.map((user) => {
            const initials = user.name
              ? user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
              : "U";

            const roleLabel =
              user.role === "admin"
                ? "Admin"
                : user.role === "devops"
                  ? "DevOps Engineer"
                  : "Developer";

            return (
              <div key={user._id} className="users-table__row">
                <div className="user-info">
                  <div className="avatar">{initials}</div>
                </div>
                <div className="user-identity">
                  <p className="user-name">{user.name}</p>
                  <p className="user-email">{user.email}</p>
                  {Array.isArray(user.projects) && user.projects.length > 0 && (
                    <div className="project-tags">
                      {user.projects.map((p, idx) => (
                        <span key={idx} className="project-tag">
                          {typeof p === "string" ? p : p.name || "Project"}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <span
                    className={`role-badge role-badge--${user.role?.toLowerCase()}`}
                  >
                    {roleLabel}
                  </span>
                </div>
                <div>
                  <span
                    className={`status-badge ${user.isBlocked ? "status-blocked" : "status-active"
                      }`}
                  >
                    {user.isBlocked ? "Blocked" : "Active"}
                  </span>
                </div>
                <div>{formatDate(user.createdAt)}</div>
                <div className="table-actions">
                  <button
                    className="action-btn"
                    title="Edit User"
                    onClick={() => {
                      setEditingUser(user);
                      setShowModal(true);
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    className="action-btn"
                    title={user.isBlocked ? "Unblock User" : "Block User"}
                    onClick={() => handleBlockToggle(user)}
                  >
                    {user.isBlocked ? "🚫" : "🛑"}
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDeleteUser(user._id)}
                    title="Delete User"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          Prev
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          Next
        </button>
      </div>

      <CreateUserModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingUser(null);
        }}
        onCreate={handleCreateOrUpdateUser}
        initialUser={editingUser}
      />
    </div>
  );
};

export default Users;