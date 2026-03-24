import React, { useEffect, useState } from "react";
import "./CreateUserModal.css";

const CreateUserModal = ({ isOpen, onClose, onCreate, initialUser }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "developer",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const title = initialUser ? "Edit Team Member" : "Create New User";

  useEffect(() => {
    if (initialUser && isOpen) {
      setFormData({
        name: initialUser.name || "",
        email: initialUser.email || "",
        password: "",
        confirmPassword: "",
        role: initialUser.role || "developer",
      });
    } else if (isOpen && !initialUser) {
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "developer",
      });
    }
    if (isOpen) {
      setError("");
      setIsSubmitting(false);
      setShowPassword(false);
    }
  }, [initialUser, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    if (error) setError("");
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validate = () => {
    const name = formData.name.trim();
    const email = formData.email.trim();

    if (!name) return "Full name is required.";
    if (!email) return "Email address is required.";

    if (!initialUser) {
      if (!formData.password) return "Initial password is required.";
      if (formData.password.length < 8)
        return "Password must be at least 8 characters.";
      if (formData.password !== formData.confirmPassword)
        return "Passwords do not match.";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role,
    };

    if (!initialUser) {
      payload.password = formData.password;
    }

    try {
      setIsSubmitting(true);
      await onCreate({
        ...payload,
        projects: [],
      });
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3>{title}</h3>
            <p className="modal-subtitle">
              {initialUser
                ? "Update access details and role for this teammate."
                : "Add a new collaborator and assign the right role."}
            </p>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            type="button"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Full Name</label>
            <div className="input-wrapper">
              <span className="input-icon">👤</span>
              <input
                type="text"
                name="name"
                placeholder="e.g. Michael Chen"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon">✉️</span>
              <input
                type="email"
                name="email"
                placeholder="name@company.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={!!initialUser}
              />
            </div>
          </div>

          {!initialUser && (
            <div className="form-group">
              <label>Initial Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔑</span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  className="toggle-visibility"
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          )}

          {!initialUser && (
            <div className="form-group">
              <label>Confirm Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔁</span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              <small className="form-hint">Minimum 8 characters.</small>
            </div>
          )}

          <div className="form-group">
            <label>User Role</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="admin">Admin</option>
                <option value="devops">DevOps</option>
                <option value="developer">Developer</option>
              </select>
            </div>
            <small className="form-hint">
              Assign permissions based on their departmental function.
            </small>
          </div>

          {error && <div className="form-error">{error}</div>}

          {/* Actions */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting
                ? initialUser
                  ? "Saving..."
                  : "Creating..."
                : initialUser
                ? "Save Changes"
                : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;