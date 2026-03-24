const { Environment } = require("../schema/environmentSchema");
const { Project } = require("../schema/projectSchema"); // Assuming you have a Project model

// 1. Get all environments with Project details
exports.getEnvironments = async (req, res) => {
  try {
    const environments = await Environment.find()
      .populate("project_id", "name") // Join with Project collection to get the name
      .sort({ createdAt: -1 });
    res.status(200).json(environments);
  } catch (err) {
    res.status(500).json({ message: "Error fetching environments", error: err.message });
  }
};

// 2. Create a new environment
exports.createEnvironment = async (req, res) => {
  try {
    const { project_id, name } = req.body;

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
      name // matches enum: ['development', 'testing', 'production']
    });

    const savedEnv = await newEnv.save();
    res.status(201).json(savedEnv);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};