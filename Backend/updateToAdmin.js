const mongoose = require("mongoose");
const { User } = require("./schema/userSchema");
require("dotenv").config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/Deployment-Tracker");
        console.log("Connected to MongoDB.");
        
        const users = await User.find({});
        console.log("Current Users in DB:");
        users.forEach(u => console.log(`- ${u.email}: ${u.role}`));

        // Make the first user an admin by default so they can access the panel
        if (users.length > 0) {
            const firstUser = users[0];
            firstUser.role = "admin";
            await firstUser.save();
            console.log(`\n✅ Elevated ${firstUser.email} to 'admin' role!`);
            console.log("Please re-login with this email to get admin access.");
        } else {
            console.log("No users found in the database. Please register an account first.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
}

run();
