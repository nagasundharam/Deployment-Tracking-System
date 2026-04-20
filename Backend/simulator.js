const axios = require('axios');
const mongoose = require("mongoose");
const { Deployment } = require("./models/schema/deploymentSchema"); 
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

    console.log(`Starting simulation for Deployment: ${deploymentId}`);

    for (let i = 0; i < dep.stages.length; i++) {
      const stage = dep.stages[i];
      const delay = STAGE_DURATIONS_MS[stage.name] || 2000;

      // Mark stage as running
      await Deployment.findOneAndUpdate(
        { _id: deploymentId, "stages.name": stage.name },
        { $set: { "stages.$.status": "running", "stages.$.start_time": new Date() } }
      );

      await axios.post(`http://localhost:5000/api/logs`, {
        deployment_id: dep._id,
        logs_type: "build",
        message: `Starting ${stage.name}...`,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));

      // Mark stage as success
      await Deployment.findOneAndUpdate(
        { _id: deploymentId, "stages.name": stage.name },
        { $set: { "stages.$.status": "success", "stages.$.end_time": new Date() } }
      );

      await axios.post(`http://localhost:5000/api/logs`, {
        deployment_id: dep._id,
        logs_type: "build",
        message: `${stage.name} completed successfully.`,
      });
    }

    // Finalize deployment as success
    await Deployment.findByIdAndUpdate(deploymentId, { 
      status: "success", 
      end_time: new Date() 
    });

    await axios.post(`http://localhost:5000/api/logs`, {
      deployment_id: dep._id,
      logs_type: "deploy",
      message: `Pipeline Finished. Application is live.`,
    });
    
    console.log(`Simulation completed for Deployment: ${deploymentId}`);
  } catch (error) {
    console.error("❌ Simulation Error:", error.message);
  }
}

module.exports = { runPipelineForDeployment };