const { Project } = require("../models/schema/projectSchema");
const { Deployment } = require("../models/schema/deploymentSchema");
const { Environment } = require("../models/schema/environmentSchema");
const { User } = require("../models/schema/userSchema");
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

// 1.5. GET: Fetch ALL projects (Admin only)
exports.getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find()
            .populate("members", "name email role")
            .populate("created_by", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json(projects);
    } catch (error) {
        console.error("Fetch All Projects Error:", error);
        res.status(500).json({ message: "Failed to fetch all projects" });
    }
};

// 2. POST: Create project
exports.createProject = async (req, res) => {
    try {
        const { name, description, members, repo_url, created_by, assigned_date, completion_date } = req.body;

        if (!name || !created_by) {
            return res.status(400).json({ message: "Project name and creator are required" });
        }

        const newProject = await Project.create({
            name,
            description,
            members: Array.isArray(members) ? members : [],
            repo_url,
            created_by,
            assigned_date: assigned_date || Date.now(),
            completion_date
        });

        // Log the creation
        await createAuditEntry(req.user?._id || req.user?.id, "Created Project", name, req.ip);

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

const { createAuditEntry } = require("./auditLogController");

// 3. PUT: Update project details
exports.updateProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const updateData = req.body;

        // Fetch old version for comparison
        const oldProject = await Project.findById(projectId);
        if (!oldProject) {
            return res.status(404).json({ message: "Project not found" });
        }

        // Permission check for sensitive fields: assigned_date and completion_date
        const isAdmin = req.user?.role === "admin";
        
        if (!isAdmin && (updateData.assigned_date || updateData.completion_date)) {
            // Logic for checking change...
            const isAssignedChanged = updateData.assigned_date && 
                new Date(updateData.assigned_date).getTime() !== new Date(oldProject.assigned_date).getTime();
            const isCompletionChanged = updateData.completion_date && 
                new Date(updateData.completion_date).getTime() !== new Date(oldProject.completion_date).getTime();

            if (isAssignedChanged || isCompletionChanged) {
                return res.status(403).json({ 
                    message: "Only administrators can update project assignment or completion dates." 
                });
            }
        }

        // --- STICKY RULES ---
        // 1. Assigned Date Restriction: Can't modify assigned date for the same user set
        if (updateData.assigned_date) {
            const isDateChanged = new Date(updateData.assigned_date).getTime() !== new Date(oldProject.assigned_date).getTime();
            if (isDateChanged) {
                // Check if members changed
                const oldMembers = (oldProject.members || []).map(m => m.toString()).sort().join(",");
                const newMembers = (updateData.members || oldProject.members || []).map(m => m.toString()).sort().join(",");
                
                if (oldMembers === newMembers) {
                    return res.status(400).json({ 
                        message: "Assigned date cannot be modified for the same user set. It can only be set when a new user is assigned." 
                    });
                }
            }
        }

        // 2. Completion Date Restriction: Can only be extended
        if (updateData.completion_date && oldProject.completion_date) {
            const oldDeadline = new Date(oldProject.completion_date).getTime();
            const newDeadline = new Date(updateData.completion_date).getTime();
            
            if (newDeadline < oldDeadline) {
                return res.status(400).json({ 
                    message: "Completion date can only be extended, not shortened." 
                });
            }
        }

        const updatedProject = await Project.findByIdAndUpdate(
            projectId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).populate("members", "name email role");

        // Identify changed fields for audit log
        let changes = [];
        if (oldProject.name !== updatedProject.name) changes.push(`Name: "${oldProject.name}" → "${updatedProject.name}"`);
        if (oldProject.repo_url !== updatedProject.repo_url) changes.push(`Repo: "${oldProject.repo_url}" → "${updatedProject.repo_url}"`);
        
        // Date changes
        if (updateData.assigned_date) {
            const oldDate = oldProject.assigned_date ? new Date(oldProject.assigned_date).toLocaleDateString() : "None";
            const newDate = new Date(updatedProject.assigned_date).toLocaleDateString();
            if (oldDate !== newDate) changes.push(`Assigned: ${oldDate} → ${newDate}`);
        }
        if (updateData.completion_date) {
            const oldDate = oldProject.completion_date ? new Date(oldProject.completion_date).toLocaleDateString() : "None";
            const newDate = new Date(updatedProject.completion_date).toLocaleDateString();
            if (oldDate !== newDate) changes.push(`Deadline: ${oldDate} → ${newDate}`);
        }
        
        const changeMsg = changes.length > 0 ? `Modified: ${changes.join(", ")}` : "Modified Project Details";

        // Log the detailed update
        await createAuditEntry(req.user?._id || req.user?.id, changeMsg, updatedProject.name, req.ip);

        res.status(200).json({ 
            message: "Project updated successfully", 
            project: updatedProject 
        });
    } catch (error) {
        console.error("Update Project Error:", error);
        res.status(500).json({ message: error.message || "Internal server error" });
    }
};

// 4. DELETE: Remove project
exports.deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Constraint check: Deployments
        const deploymentsExist = await Deployment.findOne({ project_id: projectId });
        if (deploymentsExist) {
            return res.status(400).json({ 
                message: "This project has active deployment records. Please delete all deployments for this project first." 
            });
        }

        // Constraint check: Environments
        const environmentsExist = await Environment.findOne({ project_id: projectId });
        if (environmentsExist) {
            return res.status(400).json({ 
                message: "This project has configured environments. Please delete all environments for this project first." 
            });
        }

        const project = await Project.findByIdAndDelete(projectId);

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        // Log the deletion
        await createAuditEntry(req.user?._id || req.user?.id, "Deleted Project", project.name, req.ip);

        res.status(200).json({ message: "Project deleted successfully" });
    } catch (error) {
        console.error("Delete Project Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};