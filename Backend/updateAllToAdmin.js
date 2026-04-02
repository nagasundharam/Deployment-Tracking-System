const mongoose = require("mongoose");
const { User } = require("./schema/userSchema");
require("dotenv").config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/Deployment-Tracker");
        console.log("Connected to MongoDB.");
        
        const result = await User.updateMany({}, { $set: { role: "admin" } });
        console.log(`Updated ${result.modifiedCount} users to 'admin'. All users are now admins.`);

        const users = await User.find({}, "email role");
        console.log("Current Users in DB:");
        console.table(users.map(u => ({ email: u.email, role: u.role })));

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
}

run();
