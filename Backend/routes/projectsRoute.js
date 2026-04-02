const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { 
    createProject, 
    getProjectByUserId, 
    getAllProjects,
    updateProject, 
    deleteProject 
} = require("../controllers/projectManager");

// 1. POST: Create a project
router.post("/", protect, authorizeRoles("admin", "devops"), createProject);

// 1.5. GET: Fetch ALL projects (Admin only)
router.get("/", protect, authorizeRoles("admin"), getAllProjects);

// 2. GET: Fetch projects for a specific user (This is what your frontend calls)
router.get("/user/:userId", protect, getProjectByUserId);

// 3. PUT & DELETE: Modify specific projects
router.put("/:projectId", protect, authorizeRoles("admin", "devops"), updateProject);
router.delete("/:projectId", protect, authorizeRoles("admin", "devops"), deleteProject);

module.exports = router;