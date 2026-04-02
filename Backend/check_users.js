const mongoose = require('mongoose');
const { User } = require('./models/schema/userSchema');
require('dotenv').config();

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/deployment-tracker');
        const users = await User.find({}, 'name email role');
        console.log('Users in Database:');
        console.log(JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
