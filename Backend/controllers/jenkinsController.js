const { Deployment } = require("../schema/deploymentSchema");

exports.handleJenkinsWebhook = async (req, res) => {
    try {
        const { project_id, environment_id, pipeline_id, version, branch, triggered_by } = req.body;   
        
        if(project_id && environment_id && pipeline_id && version && branch && triggered_by){

        const newDeployment = await Deployment.create({
            project_id,
            environment_id,
            pipeline_id,
            version,
            branch,
            triggered_by: {
                source: 'github',
                username: triggered_by.username,
                user_id: triggered_by.user_id
            }
        })
        res.status(201).json({ message: "Deployment record created successfully", deployment: newDeployment });
    } else {
        res.status(400).json({ message: "Missing required fields" });
    }
} catch (error) {
        console.error("Error handling Jenkins webhook:", error);
        res.status(500).json({ message: "Internal server error" });
    }    

};

