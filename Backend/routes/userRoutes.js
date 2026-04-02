const express = require("express");
const router = express.Router();
const { 
    createUser, 
    getUsers, 
    getUserProfile, 
    updateUser, 
    deleteUser,
    blockUser,
    unblockUser
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// Now these will not be 'undefined'
// Only admins can create, get all, update, delete, block, unblock
router.post("/create", protect, authorizeRoles("admin"), createUser);
router.get("/get", protect, authorizeRoles("admin"), getUsers);
router.get("/profile", protect, getUserProfile); 
router.put("/update/:id", protect, authorizeRoles("admin"), updateUser);
router.delete("/delete/:id", protect, authorizeRoles("admin"), deleteUser);

// Block / Unblock User
router.patch("/:id/block", protect, authorizeRoles("admin"), blockUser);
router.patch("/:id/unblock", protect, authorizeRoles("admin"), unblockUser);

module.exports = router;