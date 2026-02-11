const mongoose = require("mongoose");

const deploymentLogsSchema = new mongoose.Schema( {
    deployment_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Deployment",
        required: true
    },
    logs_type : { type: String, enum : ['build','deploy','test'], required: true},
    message: { type: String, required: true},
    timestamp : { type: Date, default: Date.now}


});

module.exports.DeploymentLogs = mongoose.model("DeploymentLogs", deploymentLogsSchema);