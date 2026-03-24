const express = require("express");
const router = express.Router();
const deploymentController = require("../controllers/deploymentsController");
const { protect } = require("../middleware/authMiddleware");

// --- System Metadata ---
router.get("/metadata", deploymentController.getMetadata);
router.get("/stats", deploymentController.getDeploymentStats);
router.get("/environments/:projectId", deploymentController.getEnvironmentsByProject);

// --- Core CRUD ---
router.get("/", deploymentController.getDeployments);
router.post("/", protect, deploymentController.createDeployment);
router.get("/:id", deploymentController.getDeploymentById);
router.delete("/:id", protect, deploymentController.deleteDeployment);

// --- CI/CD Pipeline Control ---
// Overall status update
router.patch("/:id/status", protect, deploymentController.updateDeploymentStatus);
// Update a specific stage (e.g., Build stage finished)
router.patch("/:id/stage", protect, deploymentController.updateStageStatus);
// Trigger a rollback
router.post("/:id/rollback", protect, deploymentController.rollbackDeployment);

// --- Monitoring ---
router.get("/:id/logs", deploymentController.getDeploymentLogs);

// --- Reporting ---
router.get("/:id/report", protect, deploymentController.exportDeploymentReport);

module.exports = router;