const { Environment } = require("../models/schema/environmentSchema");
const { Project } = require("../models/schema/projectSchema"); // Assuming you have a Project model

// 1. Get all environments with Project details
exports.getEnvironments = async (req, res) => {
  try {
    const environments = await Environment.find()
      .populate("project_id", "name")
      .populate("assigned_user", "name email role")
      .sort({ createdAt: -1 });
    res.status(200).json(environments);
  } catch (err) {
    res.status(500).json({ message: "Error fetching environments", error: err.message });
  }
};

// 2. Create a new environment
exports.createEnvironment = async (req, res) => {
  try {
    const { project_id, name, assigned_user } = req.body;
 
    // Validation: Ensure project exists
    const projectExists = await Project.findById(project_id);
    if (!projectExists) {
      return res.status(404).json({ message: "Linked project not found" });
    }
 
    // Check if this project already has this environment type
    const existingEnv = await Environment.findOne({ project_id, name });
    if (existingEnv) {
      return res.status(400).json({ message: `Project already has a ${name} environment` });
    }
 
    const newEnv = new Environment({
      project_id,
      name, // matches enum: ['development', 'testing', 'production']
      assigned_user
    });

    const savedEnv = await newEnv.save();
    res.status(201).json(savedEnv);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const { createAuditEntry } = require("./auditLogController");

// 3. Update environment
exports.updateEnvironment = async (req, res) => {
  try {
    const { name, project_id, assigned_user } = req.body;

    // Fetch old version for comparison
    const oldEnv = await Environment.findById(req.params.id)
      .populate("project_id", "name")
      .populate("assigned_user", "name");

    if (!oldEnv) {
      return res.status(404).json({ message: "Environment not found" });
    }

    const updatedEnv = await Environment.findByIdAndUpdate(
      req.params.id,
      { name, project_id, assigned_user, updatedAt: Date.now() },
      { new: true }
    ).populate("project_id", "name").populate("assigned_user", "name email role");

    // Identify changed fields
    let changes = [];
    if (oldEnv.name !== updatedEnv.name) changes.push(`Tier: "${oldEnv.name.toUpperCase()}" → "${updatedEnv.name.toUpperCase()}"`);
    if (oldEnv.project_id?._id?.toString() !== updatedEnv.project_id?._id?.toString()) {
        changes.push(`Project: "${oldEnv.project_id?.name || 'None'}" → "${updatedEnv.project_id?.name || 'None'}"`);
    }
    if (oldEnv.assigned_user?._id?.toString() !== updatedEnv.assigned_user?._id?.toString()) {
        changes.push(`Assigned User: "${oldEnv.assigned_user?.name || 'None'}" → "${updatedEnv.assigned_user?.name || 'None'}"`);
    }

    const changeMsg = changes.length > 0 ? `Modified: ${changes.join(", ")}` : "Modified Environment Settings";

    // Log the detailed update
    await createAuditEntry(req.user?._id || req.user?.id, changeMsg, `Environment: ${updatedEnv.name.toUpperCase()}`, req.ip);

    res.json(updatedEnv);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// 4. Delete environment
exports.deleteEnvironment = async (req, res) => {
  try {
    const deletedEnv = await Environment.findByIdAndDelete(req.params.id);
    if (!deletedEnv) {
      return res.status(404).json({ message: "Environment not found" });
    }

    // Log the deletion
    await createAuditEntry(req.user?._id || req.user?.id, "Deleted Environment", `Tier: ${deletedEnv.name.toUpperCase()}`, req.ip);

    res.json({ message: "Environment deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};