const { Project } = require("../schema/projectSchema");
const { User } = require("../schema/userSchema"); 

// 1. GET: Fetch projects where user is creator OR member
exports.getProjectByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const projects = await Project.find({
            $or: [{ members: userId }, { created_by: userId }]
        })
        .populate("members", "name email role") // Populates the user details for the popup
        .populate("created_by", "name email")
        .sort({ createdAt: -1 });

        res.status(200).json(projects);
    } catch (error) {
        console.error("Fetch Projects Error:", error);
        res.status(500).json({ message: "Failed to fetch projects" });
    }
};

// 2. POST: Create project
exports.createProject = async (req, res) => {
    try {
        const { name, description, members, repo_url, created_by } = req.body;

        if (!name || !created_by) {
            return res.status(400).json({ message: "Project name and creator are required" });
        }

        const newProject = await Project.create({
            name,
            description,
            members: Array.isArray(members) ? members : [],
            repo_url,
            created_by
        });

        // Populate members before sending back so frontend has names immediately
        const populatedProject = await Project.findById(newProject._id)
            .populate("members", "name email role");

        res.status(201).json({ 
            message: "Project created successfully", 
            project: populatedProject 
        });
    } catch (error) {
        console.error("Create Project Error:", error);
        res.status(500).json({ message: error.message || "Internal server error" });
    }
};

// 3. PUT: Update project details
exports.updateProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const updateData = req.body;

        const updatedProject = await Project.findByIdAndUpdate(
            projectId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).populate("members", "name email role");

        if (!updatedProject) {
            return res.status(404).json({ message: "Project not found" });
        }

        res.status(200).json({ 
            message: "Project updated successfully", 
            project: updatedProject 
        });
    } catch (error) {
        console.error("Update Project Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// 4. DELETE: Remove project
exports.deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await Project.findByIdAndDelete(projectId);

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        res.status(200).json({ message: "Project deleted successfully" });
    } catch (error) {
        console.error("Delete Project Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};