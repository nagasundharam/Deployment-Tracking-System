exports.getDeploymentDetails = async (req, res) => {
    try {
        const { project_id, environment_id } = req.query;  
        if(project_id && environment_id){
        const deployments = await Deployment.find({ project_id, environment_id }).sort({ createdAt: -1 });
        res.json(deployments);
    } else {
        res.status(400).json({ message: "Missing required query parameters" });
    }
    } catch (error) {
        console.error("Error fetching deployment details:", error);
        res.status(500).json({ message: "Internal server error" });
    }           
}; 
exports.getAllDeploymentDetails = async (req, res) => {
    try {
        const deployments = await Deployment.find().sort({ createdAt: -1 });   
        
        res.json(deployments);
    } catch (error) {   
        console.error("Error fetching deployment details:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
// exports.getDeploymentDetailsById = async (req, res) => {
//     try {
//         const { id } = req.params;  
//         const deployment = await Deployment.findById(id);
//         if (deployment) {
//             res.json(deployment);   
//         } else {    
//             res.status(404).json({ message: "Deployment not found" });
//         }
//     } catch (error) {
//         console.error("Error fetching deployment details:", error);
//         res.status(500).json({ message: "Internal server error" });
//     }       
// };


 