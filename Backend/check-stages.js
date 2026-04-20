require('dotenv').config();
const mongoose = require('mongoose');
const { Deployment } = require('./models/schema/deploymentSchema');

async function checkDeploymentStages(id) {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const dep = await Deployment.findById(id);
        if (!dep) {
            console.log("Deployment not found");
            return;
        }
        console.log(`Deployment: ${dep._id}`);
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

// Get ID from command line or use a hardcoded example
const id = process.argv[2] || "69d099c1860c3a42c3d8de6b"; // Fallback to an ID if needed
checkDeploymentStages(id);
