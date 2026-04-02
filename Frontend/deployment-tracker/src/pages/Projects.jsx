import { useState, useEffect } from "react";
import { Plus, Search, Filter, Globe, Users as UsersIcon, Calendar, X, Trash2, Edit } from "lucide-react";
import "./Projects.css";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [sortType, setSortType] = useState("date");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);

  // Retrieve auth data from localStorage
  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;
  const token = localStorage.getItem("token"); 
  const role = (user?.role || "developer").toLowerCase();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    repo_url: "",
    members: [],
    assigned_date: "",
    completion_date: ""
  });

// 1. Fetch Projects and Users on Mount
  useEffect(() => {
    const fetchData = async () => {
      // DEBUG: See exactly what is in storage
      const rawUser = localStorage.getItem("user");
      const savedToken = localStorage.getItem("token");
      
      console.log("Storage Check - User:", rawUser);
      console.log("Storage Check - Token:", savedToken);

      if (!rawUser || !savedToken) {
        console.error("Fetch aborted: No user or token found in LocalStorage.");
        return;
      }

      const parsedUser = JSON.parse(rawUser);
      const userId = parsedUser._id || parsedUser.id; // Support both _id and id

      const headers = { 
        "Authorization": `Bearer ${savedToken}`,
        "Content-Type": "application/json"
      };

      try {
        // Fetch Users
        const userRes = await fetch(`${import.meta.env.VITE_API_URL}/users/get`, { headers });
        const userData = await userRes.json();
        setAvailableUsers(Array.isArray(userData) ? userData : userData.users || []);

        // Fetch Projects
        const projRes = await fetch(`${import.meta.env.VITE_API_URL}/projects/user/${userId}`, { headers });
        const projData = await projRes.json();
        setProjects(Array.isArray(projData) ? projData : projData.projects || []);

      } catch (err) {
        console.error("Network error:", err);
      }
    };

    fetchData();
  }, []); // Removing dependencies here can sometimes help with initial load
 const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Safety check: ensure we have the creator ID
    const creatorId = user?.id || JSON.parse(localStorage.getItem("user"))?.id;
    console.log(creatorId);
    
    if (!creatorId) {
      alert("User session expired. Please log in again.");
      return;
    }

    const url = editId 
      ? `${import.meta.env.VITE_API_URL}/projects/${editId}` 
      : `${import.meta.env.VITE_API_URL}/projects`;
    
    const method = editId ? "PUT" : "POST";

    // Construct the payload to match your backend's expected variables
    const projectPayload = {
      name: formData.name,
      description: formData.description,
      repo_url: formData.repo_url,
      members: formData.members,
      created_by: creatorId,
      assigned_date: formData.assigned_date,
      completion_date: formData.completion_date
    };

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(projectPayload)
      });
      
      const data = await res.json();

      if (res.ok) {
        if (editId) {
          setProjects(prev => prev.map(p => p._id === editId ? data.project : p));
        } else {
          // data.project is returned from your backend after being populated
          setProjects(prev => [data.project, ...prev]);
        }
        closeModal();
      } else {
        alert(data.message || "Something went wrong");
      }
    } catch (err) {
      console.error("Submission Error:", err);
    }
  };
  // 3. Delete Project
  const handleDelete = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        setProjects(prev => prev.filter(p => p._id !== projectId));
      } else {
        const data = await res.json();
        alert(data.message);
      }
    } catch (err) {
      console.error("Delete Error:", err);
    }
  };

  // 4. Modal Management
  const openEditModal = (project) => {
    setEditId(project._id);
    setFormData({
      name: project.name,
      description: project.description,
      repo_url: project.repo_url || "",
      // Map members to IDs to match checkbox logic
      members: project.members.map(m => (typeof m === 'object' ? m._id : m)),
      assigned_date: project.assigned_date ? new Date(project.assigned_date).toISOString().split('T')[0] : "",
      completion_date: project.completion_date ? new Date(project.completion_date).toISOString().split('T')[0] : ""
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setFormData({ name: "", description: "", repo_url: "", members: [], assigned_date: "", completion_date: "" });
  };

  // 5. Filter and Sort Logic
  const filteredAndSorted = projects
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortType === "name") return a.name.localeCompare(b.name);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  return (
    <div className="projects-page">
      <header className="page-header">
        <div className="header-left">
          <h1>Projects</h1>
          <p>Manage and monitor your active workspace projects.</p>
        </div>
        {(role === "admin" || role === "devops") && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> New Project
          </button>
        )}
      </header>

      <div className="action-bar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            placeholder="Search by name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Filter size={18} />
          <select value={sortType} onChange={(e) => setSortType(e.target.value)}>
            <option value="date">Most Recent</option>
            <option value="name">A - Z</option>
          </select>
        </div>
      </div>

      <div className="projects-grid">
        {filteredAndSorted.length > 0 ? (
          filteredAndSorted.map((project) => (
            <div key={project._id} className="project-card">
              <div className="card-header">
                <h3>{project.name}</h3>
                <div className="card-actions">
                  {(role === "admin" || role === "devops") && (
                    <>
                      <button className="icon-btn" onClick={() => openEditModal(project)}>
                        <Edit size={16}/>
                      </button>
                      <button className="icon-btn delete" onClick={() => handleDelete(project._id)}>
                        <Trash2 size={16}/>
                      </button>
                    </>
                  )}
                </div>
              </div>
              <p className="card-desc">{project.description}</p>
              
              <div className="card-meta-main">
                <div className="members-stack">
                  {project.members?.slice(0, 3).map((m, i) => (
                    <div key={m._id || i} className="member-avatar-small" title={m.name}>
                      {m.name?.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {project.members?.length > 3 && (
                    <div className="member-avatar-more">+{project.members.length - 3}</div>
                  )}
                  <span className="members-label">{project.members?.length || 0} Assigned</span>
                </div>
              </div>

              <div className="card-meta">
                <div className="meta-item">
                  <Globe size={14} />
                  {project.repo_url ? (
                    <a href={project.repo_url} target="_blank" rel="noopener noreferrer" className="repo-link">View Repo</a>
                  ) : (
                    <span>No Repo</span>
                  )}
                </div>
                <div className="meta-item">
                  <Calendar size={14} />
                  <span>
                    {project.assigned_date ? new Date(project.assigned_date).toLocaleDateString() : "TBD"} 
                    {" → "} 
                    {project.completion_date ? new Date(project.completion_date).toLocaleDateString() : "Ongoing"}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">No projects available.</div>
        )}
      </div>

      {showModal && (
        <div className="glass-modal-overlay">
          <div className="modern-modal">
            <div className="modal-top">
              <h3>{editId ? "Edit Project Details" : "Create New Project"}</h3>
              <button className="close-btn" onClick={closeModal}><X size={20}/></button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label>Project Name</label>
                <input 
                  required 
                  value={formData.name}
                  placeholder="e.g. Finance Dashboard" 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  rows="3" 
                  value={formData.description}
                  placeholder="What is this project about?" 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Repository URL</label>
                <input 
                  value={formData.repo_url}
                  type="url"
                  placeholder="https://github.com/user/repo" 
                  onChange={e => setFormData({...formData, repo_url: e.target.value})} 
                />
              </div>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Assigned Date</label>
                  <input 
                    type="date"
                    value={formData.assigned_date}
                    onChange={e => setFormData({...formData, assigned_date: e.target.value})} 
                    disabled={role !== "admin"}
                  />
                </div>
                <div className="form-group flex-1">
                  <label>Completion Deadline</label>
                  <input 
                    type="date"
                    value={formData.completion_date}
                    onChange={e => setFormData({...formData, completion_date: e.target.value})} 
                    disabled={role !== "admin"}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Assign Team Members</label>
                <div className="members-select-box">
                  {availableUsers.length > 0 ? (
                    availableUsers.map(u => (
                      <label key={u._id} className={`member-chip ${formData.members.includes(u._id) ? "selected" : ""}`}>
                        <input 
                          type="checkbox" 
                          hidden
                          checked={formData.members.includes(u._id)}
                          onChange={() => {
                            const members = formData.members.includes(u._id)
                              ? formData.members.filter(id => id !== u._id)
                              : [...formData.members, u._id];
                            setFormData({...formData, members});
                          }}
                        />
                        <span>{u.name}</span>
                      </label>
                    ))
                  ) : (
                    <p className="no-users-text">No users found to assign.</p>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {editId ? "Update Project" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}