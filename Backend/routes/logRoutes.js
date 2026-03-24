const express = require("express");
const router = express.Router();
const logsController = require("../controllers/logController.js");

// Fetch logs for the Details Page
router.get("/:id", logsController.getLogsByDeployment);

// Endpoint for Jenkins to push logs
router.post("/", logsController.createLogEntry);

module.exports = router;