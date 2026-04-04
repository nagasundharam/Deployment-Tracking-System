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

        // Create deployment record
        const newDeployment = new Deployment({
            project_id,
            environment_id,
            pipeline_id,
            version,
            branch,
            triggered_by,
            commit_message,
            commit_author,
            commit_author_email,
            commit_hash,
            public_url,
            node_name,
            artifacts,
            status: "running",
            start_time: new Date(),
            stages: [
                { name: "Checkout SCM", status: "pending" },
                { name: "Deploy with Docker Compose", status: "pending" },
                { name: "Verify Containers", status: "pending" }
            ]
        });

        await newDeployment.save();

        // Update Environment status
        await Environment.findByIdAndUpdate(environment_id, { 
            status: "Online", 
            last_deployment: newDeployment._id 
        });

        // Create Audit Log Entry for the commit/deployment
        try {
            const { createAuditEntry } = require("./auditLogController");
            // Use the first admin as a fallback if no specific user is linked
            const admin = await User.findOne({ role: "admin" });
            let projectName = project_id;
            try {
                const projectDoc = await Project.findById(project_id);
                if (projectDoc) projectName = projectDoc.name;
            } catch (err) {
                console.error("Could not find project name:", err);
            }
            const action = `Jenkins Deployment: ${commit_message || "New Build"} (Hash: ${commit_hash || "N/A"})`;
            const resource = `Project: ${projectName}`;
            await createAuditEntry(admin?._id, action, resource, "Jenkins-CI");
        } catch (auditError) {
            console.error("Audit Log Error:", auditError);
        }

        res.status(201).json({ message: "Deployment record created successfully", deployment: newDeployment });
    } catch (error) {
        console.error("Error handling Jenkins webhook:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }    
};
