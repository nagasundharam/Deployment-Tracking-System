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

// Now these will not be 'undefined'
router.post("/create", createUser);
router.get("/get", getUsers);
router.get("/profile", getUserProfile); 
router.put("/update/:id", updateUser);
router.delete("/delete/:id", deleteUser);

// Block / Unblock User
router.patch("/:id/block", blockUser);
router.patch("/:id/unblock", unblockUser);

module.exports = router;