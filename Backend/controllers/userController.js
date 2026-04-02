const { User } = require("../models/schema/userSchema");
const bcrypt = require("bcryptjs"); // npm install bcryptjs

// 1. Create User (Handles Hashing)
exports.createUser = async (req, res) => {
    try {
        const { name, email, password, role, projects } = req.body;

        if (!password) {
            return res.status(400).json({ message: "password is required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            password_hash: hashedPassword,
            role: role || 'developer',
            projects: projects || []
        });

        await newUser.save();

        const userResponse = newUser.toObject();
        delete userResponse.password_hash;

        res.status(201).json(userResponse);
    } catch (error) {
        console.error("Error in createUser:", error);
        res.status(400).json({ message: error.message });
    }
};

// 2. Get All Users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password_hash");
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// 3. Get User Profile (from token/authMiddleware)
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password_hash");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// 4. Update User
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, name, projects } = req.body;

        const user = await User.findByIdAndUpdate(
            id,
            { role, name, projects },
            { new: true, runValidators: true }
        ).select("-password_hash");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ message: "User updated successfully", user });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// 5. Delete User
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// 6. Block User
exports.blockUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndUpdate(
            id,
            { isBlocked: true },
            { new: true }
        ).select("-password_hash");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User blocked successfully", user });
    } catch (error) {
        console.error("Error blocking user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// 7. Unblock User
exports.unblockUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndUpdate(
            id,
            { isBlocked: false },
            { new: true }
        ).select("-password_hash");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User unblocked successfully", user });
    } catch (error) {
        console.error("Error unblocking user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};