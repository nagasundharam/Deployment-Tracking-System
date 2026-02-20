import { useState } from "react";
import { Bell, Plus } from "lucide-react";
import "./Projects.css";

export default function Projects() {
  const [projects, setProjects] = useState([
    {
      id: 1,
      name: "Alpha-Core-Service",
      tech: "Node.js • Microservice",
      repo: "github.com/org/alpha-core",
      createdBy: "Sarah Miller",
      date: "2023-10-12",
      status: "Production",
    },
    {
      id: 2,
      name: "Marketing-Frontend",
      tech: "Next.js • UI Kit",
      repo: "github.com/org/marketing-fe",
      createdBy: "John Doe",
      date: "2023-11-05",
      status: "UAT Failed",
    },
  ]);

  const [search, setSearch] = useState("");
  const [sortType, setSortType] = useState("date");
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    tech: "",
    repo: "",
    createdBy: "",
    status: "Production",
  });

  // 🔹 Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 🔹 Create Project
  const handleCreateProject = (e) => {
    e.preventDefault();

    const newProject = {
      id: Date.now(),
      ...formData,
      date: new Date().toISOString().split("T")[0],
    };

    setProjects((prev) => [newProject, ...prev]);

    setFormData({
      name: "",
      tech: "",
      repo: "",
      createdBy: "",
      status: "Production",
    });

    setShowModal(false);
  };

  // 🔹 Sorting
  const sortedProjects = [...projects].sort((a, b) => {
    if (sortType === "name") {
      return a.name.localeCompare(b.name);
    }
    if (sortType === "date") {
      return new Date(b.date) - new Date(a.date);
    }
    return 0;
  });

  // 🔹 Filtering
  const filteredProjects = sortedProjects.filter((project) =>
    project.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="projects-container">

      {/* Header */}
      <div className="projects-header">
        <h2>Projects</h2>

        <div className="header-actions">
         
          <button
            className="btn-primary"
            onClick={() => setShowModal(true)}
          >
            <Plus size={16} /> Create Project
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={sortType}
          onChange={(e) => setSortType(e.target.value)}
        >
          <option value="date">Sort by Date</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Repository</th>
              <th>Created By</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredProjects.map((project) => (
              <tr key={project.id}>
                <td>
                  <div className="project-info">
                    <div className="project-icon"></div>
                    <div>
                      <p className="project-name">{project.name}</p>
                      <span className="project-tech">
                        {project.tech}
                      </span>
                    </div>
                  </div>
                </td>
                <td>{project.repo}</td>
                <td>{project.createdBy}</td>
                <td>{project.date}</td>
                <td>
                  <span
                    className={`status ${
                      project.status === "Production"
                        ? "green"
                        : "red"
                    }`}
                  >
                    {project.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProjects.length === 0 && (
          <p className="no-data">No projects found.</p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Create New Project</h3>

            <form onSubmit={handleCreateProject}>
              <input
                type="text"
                name="name"
                placeholder="Project Name"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="tech"
                placeholder="Tech Stack"
                value={formData.tech}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="repo"
                placeholder="Repository URL"
                value={formData.repo}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="createdBy"
                placeholder="Created By"
                value={formData.createdBy}
                onChange={handleChange}
                required
              />

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Production">Production</option>
                <option value="UAT Failed">UAT Failed</option>
              </select>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
