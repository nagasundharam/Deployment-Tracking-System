const mongoose = require("mongoose");

const deploymentSchema = new mongoose.Schema({
    project_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true
    },
    environment_id : { 
        type: mongoose.Schema.Types.ObjectId,
        ref: " Environment",
        required: true


    },
    pipeline_id : { 
        type : mongoose.Schema.Types.ObjectId,
        ref : "Pipeline",
        required: true
    },
    version : { type: String, required: true},
    branch: String,
    triggered_by : String,
    status: { type: String, enum : ['pending', 'running', 'success', 'failure'], default: 'pending'},
    start_time : { type: Date},
    end_time : { type: Date}
},
{ timestamps: { createdAt: true, updatedAt: false } }
);

module.exports.Deployment = mongoose.model("Deployment", deploymentSchema);