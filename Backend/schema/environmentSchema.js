const  mongoose = require('mongoose');




const environmentSchema = new mongoose.Schema(
    {
        project_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },
        name : { type: String, enum: ['development','testing','production'],required: true},
        created_at : { type : Date, default: Date.now}



    }, { timestamps: true }
)
module.exports.Environment = mongoose.model("Environment",environmentSchema);

