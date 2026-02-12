exports. getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password_hash"); 
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    }       catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }           

    exports.getAllUsers = async (req, res) => {
        try {
            const users = await User.find().select("-password_hash");                   
            res.json(users);
        } catch (error) {
            console.error("Error fetching users:", error);
            res.status(500).json({ message: "Internal server error" });
        }       
    };  

     exports.updateUserRole = async (req, res) => {
        try {
            const { userId } = req.params;
            const { role } = req.body;          
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }    
            user.role = role;
            await user.save();
            res.json({ message: "User role updated successfully" });
        } catch (error) {
            console.error("Error updating user role:", error);
            res.status(500).json({ message: "Internal server error" });
        }   
    };

    exports.deleteUser = async (req, res) => {
        try {
            const { userId } = req.params;                  

            const user = await User.findById(userId);       
            if (!user) {
                return res.status(404).json({ message: "User not found" });         

            }       

            await user.remove();    


            res.json({ message: "User deleted successfully" });

        } catch (error) {
            console.error("Error deleting user:", error);
            res.status(500).json({ message: "Internal server error" });
        }           

        }
    };
    exports.getProjectByRole = async (req, res) => {
        try {
            const userId = req.user.id;
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            const projects = await Project.find({ members: userId }).populate("members", "name email");
            res.json(projects);
        } catch (error) {
            console.error("Error fetching projects for user:", error);
            res.status(500).json({ message: "Internal server error" });
        }       
    };

        
