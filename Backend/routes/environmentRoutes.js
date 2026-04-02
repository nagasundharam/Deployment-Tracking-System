const express = require("express");
const router = express.Router();
const { getEnvironments, createEnvironment } = require("../controllers/environmentController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// GET http://localhost:5000/api/environments
router.get("/", protect, getEnvironments);

// POST http://localhost:5000/api/environments
router.post("/", protect, authorizeRoles("admin", "devops"), createEnvironment);

const { updateEnvironment, deleteEnvironment } = require("../controllers/environmentController");

// PUT http://localhost:5000/api/environments/:id
router.put("/:id", protect, authorizeRoles("admin", "devops"), updateEnvironment);

// DELETE http://localhost:5000/api/environments/:id
router.delete("/:id", protect, authorizeRoles("admin", "devops"), deleteEnvironment);

module.exports = router;