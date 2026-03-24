const express = require("express");
const router = express.Router();
const { getEnvironments, createEnvironment } = require("../controllers/environmentController");

// GET http://localhost:5000/api/environments
router.get("/", getEnvironments);

// POST http://localhost:5000/api/environments
router.post("/", createEnvironment);

module.exports = router;