const axios = require('axios');
const mongoose = require("mongoose");
const { Deployment } = require("./schema/deploymentSchema"); 
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB for Simulation"))
  .catch(err => console.error("MongoDB Connection Error:", err));

/**
 * This simulator is now triggered per-deployment from the API
 * instead of looping forever looking for any running deployment.
 */
const STAGE_DURATIONS_MS = {
  "Build": 2000,
  "Unit Tests": 2000,
  "Security Scan": 2000,
  "Docker Build": 3000,
  "Deploy": 3000,
  "Health Check": 2000,
};

async function runPipelineForDeployment(deploymentId) {
  try {
    const dep = await Deployment.findById(deploymentId);
    if (!dep) {
      console.error("Deployment not found for simulation:", deploymentId);
      return;
    }

    for (let i = 0; i < dep.stages.length; i++) {
      const stage = dep.stages[i];
      const delay = STAGE_DURATIONS_MS[stage.name] || 2000;

      await axios.post(`http://localhost:5000/api/logs`, {
        deployment_id: dep._id,
        logs_type: "build",
        message: `Starting ${stage.name}...`,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));

      await axios.post(`http://localhost:5000/api/logs`, {
        deployment_id: dep._id,
        logs_type: "build",
        message: `${stage.name} completed successfully.`,
      });
    }

    await axios.post(`http://localhost:5000/api/logs`, {
      deployment_id: dep._id,
      logs_type: "deploy",
      message: `Pipeline Finished. Application is live.`,
    });
  } catch (error) {
    console.error("❌ Simulation Error:", error.message);
  }
}

module.exports = { runPipelineForDeployment };