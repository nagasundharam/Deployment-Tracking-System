import React, { useState } from "react";
import "./Users.css";

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

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Developer",
    projects: "",
  });

  const toggleStatus = (id) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id ? { ...user, active: !user.active } : user
      )
    );
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddUser = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      alert("Name and Email are required");
      return;
    }

    const newUser = {
      id: Date.now(),
      name: formData.name,
      email: formData.email,
      role: formData.role,
      projects: formData.projects
        ? formData.projects.split(",").map((p) => p.trim())
        : [],
      active: true,
    };

    setUsers([...users, newUser]);

    setFormData({
      name: "",
      email: "",
      role: "Developer",
      projects: "",
    });

    setShowModal(false);
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
      

    </div>
  );
};

export default Users;
