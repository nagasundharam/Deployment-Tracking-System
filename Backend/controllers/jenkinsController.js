const { User } = require("../models/schema/userSchema");
const { Deployment } = require("../models/schema/deploymentSchema");
const { Project } = require("../models/schema/projectSchema");
const { Environment } = require("../models/schema/environmentSchema");

exports.handleJenkinsWebhook = async (req, res) => {
    try {
        const { 
            project_id, 
            environment_id, 
            pipeline_id, 
            version, 
            branch, 
            triggered_by,
            commit_message,
            commit_author,
            commit_author_email,
            commit_hash
        } = req.body;   
        
        if (!project_id || !environment_id) {
            return res.status(400).json({ message: "Missing project_id or environment_id" });
        }

        // Handle triggered_by.user_id if it's "system" or empty
        let userId = null;
        if (triggered_by?.user_id && triggered_by.user_id !== "system") {
            userId = triggered_by.user_id;
        }

        const newDeployment = await Deployment.create({
            project_id,
            environment_id,
            pipeline_id: pipeline_id || "jenkins-" + Date.now(),
            version,
            branch,
            triggered_by: {
                source: 'jenkins',
                username: triggered_by?.username || "Jenkins",
                user_id: userId
            },
            status: 'success',
            start_time: new Date(),
            end_time: new Date(),
            commit_message,
            commit_author,
            commit_author_email,
            commit_hash,
            stages: [
                { name: "Checkout & Metadata", status: "success" },
                { name: "Install & Build", status: "success" },
                { name: "Deploy Frontend", status: "success" },
                { name: "Update Tracker API", status: "success" }
            ]
        });

        // Update Environment status
        await Environment.findByIdAndUpdate(environment_id, { 
            status: "Online", 
            last_deployment: newDeployment._id 
        });

        res.status(201).json({ message: "Deployment record created successfully", deployment: newDeployment });
    } catch (error) {
        console.error("Error handling Jenkins webhook:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }    
};
