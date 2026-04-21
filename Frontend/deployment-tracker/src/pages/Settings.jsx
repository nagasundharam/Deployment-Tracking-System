import React, { useState, useEffect } from "react";
import "./Settings.css";
import { api } from "../services/api";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("projects");
  const [data, setData] = useState({
    projects: [],
    environments: [],
    deployments: [],
    users: [], // Added users
  });
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Parse user for ID and role
  const userJson = sessionStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;
  const userId = user?.id || user?._id;
  const isAdmin = user?.role === "admin";

  const fetchData = async () => {
    setLoading(true);
    try {
      // If admin, fetch ALL projects, otherwise fetch user's projects
      const projectEndpoint = isAdmin ? "/projects" : `/projects/user/${userId}`;
      
      const [projs, envs, deps, users] = await Promise.all([
        api.get(projectEndpoint),
        api.get("/environments"),
        api.get("/deployments"),
        isAdmin || role === "devops" ? api.get("/users/get") : Promise.resolve([]),
      ]);

      setData({
        projects: projs || [],
        environments: envs || [],
        deployments: deps || [],
        users: Array.isArray(users) ? users : (users?.users || []),
      });
    } catch (err) {
      console.error("Fetch Settings error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchData();
  }, [userId]);

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      await api.delete(`/${type === 'projects' ? 'projects' : type}/${id}`);
      fetchData();
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const type = activeTab;
    try {
      // Prepare data for update
      let payload = { ...editingItem };
      
      // Clean up for backend consistency if needed
      if (type === 'projects' && payload.members) {
        payload.members = payload.members.map(m => typeof m === 'object' ? m._id : m);
      }

      await api.put(`/${type}/${editingItem._id}`, payload);
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert("Update failed: " + err.message);
    }
  };

  const renderProjects = () => (
    <table className="settings-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Members</th>
          <th>Description</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.projects.map((p) => (
          <tr key={p._id}>
            <td>{p.name}</td>
            <td>
              <div className="member-count-badge">
                {p.members?.length || 0} Members
              </div>
            </td>
            <td>{p.description || "No description"}</td>
            <td className="actions">
              <button className="edit-btn" onClick={() => { 
                setEditingItem({
                  ...p,
                  members: p.members?.map(m => typeof m === 'object' ? m._id : m) || []
                }); 
                setShowModal(true); 
              }}>✏️</button>
              <button className="delete-btn" onClick={() => handleDelete("projects", p._id)}>🗑️</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderEnvironments = () => (
    <table className="settings-table">
      <thead>
        <tr>
          <th>Tier Name</th>
          <th>Linked Project</th>
          <th>Assigned User</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.environments.map((e) => (
          <tr key={e._id}>
            <td>{e.name?.toUpperCase()}</td>
            <td>{e.project_id?.name || "Independent"}</td>
            <td>
              {e.assigned_user ? (
                <span className="user-tag">{e.assigned_user.name}</span>
              ) : (
                <span className="unassigned">Unassigned</span>
              )}
            </td>
            <td className="actions">
              <button className="edit-btn" onClick={() => { 
                setEditingItem({
                  ...e,
                  project_id: e.project_id?._id || e.project_id,
                  assigned_user: e.assigned_user?._id || e.assigned_user
                }); 
                setShowModal(true); 
              }}>✏️</button>
              <button className="delete-btn" onClick={() => handleDelete("environments", e._id)}>🗑️</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderDeployments = () => (
    <table className="settings-table">
      <thead>
        <tr>
          <th>Version</th>
          <th>Project</th>
          <th>Env</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.deployments.map((d) => (
          <tr key={d._id}>
            <td>{d.version}</td>
            <td>{d.project_id?.name}</td>
            <td>{d.environment_id?.name}</td>
            <td>{d.status}</td>
            <td className="actions">
              <button className="edit-btn" onClick={() => { setEditingItem(d); setShowModal(true); }}>✏️</button>
              <button className="delete-btn" onClick={() => handleDelete("deployments", d._id)}>🗑️</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="settings-page">
      <header className="settings-header">
        <h2>Settings</h2>
        <p>Global management for your projects, environments, and deployment records.</p>
      </header>

      <nav className="settings-tabs">
        <button className={`tab-btn ${activeTab === "projects" ? "active" : ""}`} onClick={() => setActiveTab("projects")}>Projects</button>
        <button className={`tab-btn ${activeTab === "environments" ? "active" : ""}`} onClick={() => setActiveTab("environments")}>Environments</button>
        <button className={`tab-btn ${activeTab === "deployments" ? "active" : ""}`} onClick={() => setActiveTab("deployments")}>Deployments History</button>
      </nav>

      <div className="settings-section">
        {loading ? (
          <div className="settings-empty">Loading platform data...</div>
        ) : data[activeTab].length === 0 ? (
          <div className="settings-empty">No {activeTab} found in this category.</div>
        ) : (
          <>
            {activeTab === "projects" && renderProjects()}
            {activeTab === "environments" && renderEnvironments()}
            {activeTab === "deployments" && renderDeployments()}
          </>
        )}
      </div>

      {showModal && editingItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit {activeTab.slice(0, -1)}</h3>
            <form onSubmit={handleUpdate} className="modal-form-modern">
               {activeTab === "projects" && (
                 <div className="form-group-modern">
                   <label>Name</label>
                   <input value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} required />
                   
                   <label>Description</label>
                   <input value={editingItem.description} onChange={e => setEditingItem({...editingItem, description: e.target.value})} />

                   <div style={{display: 'flex', gap: '15px', marginTop: '10px'}}>
                     <div style={{flex: 1}}>
                       <label>Assigned Date</label>
                       <input 
                         type="date" 
                         value={editingItem.assigned_date ? new Date(editingItem.assigned_date).toISOString().split('T')[0] : ""} 
                         onChange={e => setEditingItem({...editingItem, assigned_date: e.target.value})}
                         disabled={!isAdmin} 
                       />
                     </div>
                     <div style={{flex: 1}}>
                       <label>Completion Deadline</label>
                       <input 
                         type="date" 
                         value={editingItem.completion_date ? new Date(editingItem.completion_date).toISOString().split('T')[0] : ""} 
                         onChange={e => setEditingItem({...editingItem, completion_date: e.target.value})} 
                         disabled={!isAdmin}
                       />
                     </div>
                   </div>

                   <label style={{marginTop: '15px', display: 'block'}}>Assign Members</label>
                   <div className="members-selection-grid">
                      {data.users.map(u => (
                        <label key={u._id} className={`member-checkbox-label ${editingItem.members?.includes(u._id) ? 'checked' : ''}`}>
                          <input 
                            type="checkbox" 
                            checked={editingItem.members?.includes(u._id)} 
                            onChange={() => {
                              const members = editingItem.members?.includes(u._id)
                                ? editingItem.members.filter(id => id !== u._id)
                                : [...(editingItem.members || []), u._id];
                              setEditingItem({...editingItem, members});
                            }}
                          />
                          <span>{u.name}</span>
                        </label>
                      ))}
                   </div>
                 </div>
               )}
               {activeTab === "environments" && (
                 <div className="form-group-modern">
                   <label>Tier Name</label>
                   <select value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})}>
                      <option value="development">Development</option>
                      <option value="testing">Testing</option>
                      <option value="production">Production</option>
                   </select>

                   <label>Linked Project</label>
                   <select value={editingItem.project_id} onChange={e => setEditingItem({...editingItem, project_id: e.target.value})}>
                      <option value="">Select Project</option>
                      {data.projects.map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                   </select>

                   <label>Assigned User</label>
                   <select value={editingItem.assigned_user || ""} onChange={e => setEditingItem({...editingItem, assigned_user: e.target.value})}>
                      <option value="">Unassigned</option>
                      {data.users.map(u => (
                        <option key={u._id} value={u._id}>{u.name}</option>
                      ))}
                   </select>
                 </div>
               )}
               {activeTab === "deployments" && (
                 <div className="form-group-modern">
                    <label>Version Tag</label>
                    <input value={editingItem.version} onChange={e => setEditingItem({...editingItem, version: e.target.value})} />
                    <label>Branch</label>
                    <input value={editingItem.branch} onChange={e => setEditingItem({...editingItem, branch: e.target.value})} />
                 </div>
               )}
               <div className="modal-footer-modern" style={{marginTop: '20px', display: 'flex', gap: '10px'}}>
                  <button type="button" className="btn-secondary-modern" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary-modern">Save Changes</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;