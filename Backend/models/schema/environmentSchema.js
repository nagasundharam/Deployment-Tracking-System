const  mongoose = require('mongoose');




const environmentSchema = new mongoose.Schema(
    {
        project_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },
        name : { type: String, enum: ['development','testing','production'],required: true},
        assigned_user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        status: { type: String, default: "Offline" },
        last_deployment: { type: mongoose.Schema.Types.ObjectId, ref: "Deployment" },
        created_at : { type : Date, default: Date.now}



    }, { timestamps: true }
)
module.exports.Environment = mongoose.model("Environment",environmentSchema);

