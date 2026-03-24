const { DeploymentLogs } = require("../schema/deploymentLogsSchema");

// GET: Fetch all logs for a specific deployment
exports.getLogsByDeployment = async (req, res) => {
  try {
    const logs = await DeploymentLogs.find({ deployment_id: req.params.id })
      .sort({ timestamp: 1 }); // Chronological order
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST: Create a new log entry (Used by Jenkins/Simulator)

exports.createLogEntry = async (req, res) => {
  try {
    const { deployment_id, message, logs_type } = req.body;
    
    const newLog = new DeploymentLogs({
      deployment_id,
      message,
      logs_type: logs_type || 'info',
      timestamp: new Date()
    });

    await newLog.save();
    res.status(201).json(newLog);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};