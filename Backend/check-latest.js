require('dotenv').config();
const mongoose = require('mongoose');
const { Deployment } = require('./models/schema/deploymentSchema');

async function checkLatestDeployment() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const dep = await Deployment.findOne().sort({ createdAt: -1 });
        if (!dep) {
            console.log("No deployments found.");
            return;
        }
        console.log(`Latest Deployment: ${dep._id}`);
        console.log(`Status: ${dep.status}`);
        console.log("Stages:");
        dep.stages.forEach(s => {
            console.log(`- ${s.name}: ${s.status} (Updated: ${s.updated_at || 'Never'})`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkLatestDeployment();
