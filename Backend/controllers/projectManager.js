const Project = require("../models/Project");

exports.getProjectByUserId = async  (req, res) => {
    try {
        const userId = req.params.userId;       

        const projects = await Project.find({ members: userId });
        res.json(projects);
    } catch (error) {
        console.error("Error fetching projects for user:", error);
        res.status(500).json({ message: "Internal server error" });
    }   
};

exports.createProject = async (req, res) => {   
    try {
        const { name , description, members,repo_url } = req.body;
        if(!name || !description || !members || !Array.isArray(members)){
            return res.status(400).json({ message: "Missing required fields or members is not an array" });
        }   
        const newProject = await Project.create({
            name,
            description,

            members,
            repo_url
            
        });
        res.status(201).json({ message: "Project created successfully", project: newProject });
    } catch (error) {
        console.error("Error creating project:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.getProjectById = async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const project = await Project.findById(projectId).populate("members", "name email");
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }               
        res.json(project);
    } catch (error) {
        console.error("Error fetching project details:", error);
        res.status(500).json({ message: "Internal server error" });         
    }
};

exports.updateProject = async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const { name, description, members, repo_url } = req.body;
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }   
        project.name = name || project.name;
        project.description = description || project.description;
        project.members = members || project.members;       
        project.repo_url = repo_url || project.repo_url;
        await project.save();
        res.json({ message: "Project updated successfully", project });
    } catch (error) {           
        console.error("Error updating project:", error);
        res.status(500).json({ message: "Internal server error" });
    }   
};

exports.deleteProject = async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }               

        await project.remove();
        res.json({ message: "Project deleted successfully" });
    } catch (error) {
        console.error("Error deleting project:", error);
        res.status(500).json({ message: "Internal server error" });
    }       


};