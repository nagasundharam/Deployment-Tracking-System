const express = require("express");
const router = express.Router();
const deploymentController = require("../controllers/deploymentsController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// --- System Metadata ---
router.get("/metadata", protect, deploymentController.getMetadata);
router.get("/stats", protect, deploymentController.getDeploymentStats);
router.get("/environments/:projectId", protect, deploymentController.getEnvironmentsByProject);

// --- Core CRUD ---
router.get("/", protect, deploymentController.getDeployments);
router.post("/", protect, deploymentController.createDeployment);
router.get("/:id", protect, deploymentController.getDeploymentById);
router.put("/:id", protect, authorizeRoles("admin", "devops"), deploymentController.updateDeployment);
router.delete("/:id", protect, authorizeRoles("admin", "devops"), deploymentController.deleteDeployment);

// --- CI/CD Pipeline Control ---
// Overall status update
router.patch("/:id/status", protect, authorizeRoles("admin", "devops"), deploymentController.updateDeploymentStatus);
// Update a specific stage (e.g., Build stage finished)
router.patch("/:id/stage", protect, authorizeRoles("admin", "devops"), deploymentController.updateStageStatus);
// Trigger a rollback
router.post("/:id/rollback", protect, authorizeRoles("admin", "devops"), deploymentController.rollbackDeployment);

// --- Monitoring ---
router.get("/:id/logs", protect, deploymentController.getDeploymentLogs);

// --- Reporting ---
router.get("/:id/report", protect, deploymentController.exportDeploymentReport);

module.exports = router;