import React, { useState } from "react";
import "./Users.css";
import CreateUserModal from "../components/CreateUserModal";

const initialUsers = [
  {
    id: 1,
    name: "Jordan Smith",
    email: "jordan.s@deployflow.com",
    role: "Admin",
    projects: ["Core-API", "Infra-v2"],
    active: true,
  },
];

const Users = () => {
  const [users, setUsers] = useState(initialUsers);
  const [showModal, setShowModal] = useState(false);

  const toggleStatus = (id) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id ? { ...user, active: !user.active } : user
      )
    );
  };

  const handleCreateUser = (newUser) => {
    setUsers((prev) => [...prev, newUser]);
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h2>Team Members</h2>
          <p>Manage system access, roles and project assignments.</p>
        </div>
        <button className="primary-btn" onClick={() => setShowModal(true)}>
          + Add User
        </button>
      </div>

      <div className="users-table">
        <div className="users-table__header">
          <span>Name</span>
          <span>Role</span>
          <span>Assigned Projects</span>
          <span>Status</span>
        </div>

        {users.map((user) => (
          <div key={user.id} className="users-table__row">
            <div>
              <strong>{user.name}</strong>
              <div className="user-email">{user.email}</div>
            </div>

            <span className={`role-badge role-badge--${user.role.toLowerCase()}`}>
              {user.role}
            </span>

            <div>
              {user.projects.map((proj, i) => (
                <span key={i} className="project-tag">
                  {proj}
                </span>
              ))}
            </div>

            <label className="switch">
              <input
                type="checkbox"
                checked={user.active}
                onChange={() => toggleStatus(user.id)}
              />
              <span className="slider"></span>
            </label>
          </div>
        ))}
      </div>

      <CreateUserModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreate={handleCreateUser}
      />
    </div>
  );
};

export default Users;