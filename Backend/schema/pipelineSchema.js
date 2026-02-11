const mongoose = require("mongoose");

const pipelineSchema = new mongoose.Schema({
    project_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true
    },
    tools : {
        type: String,
        enum: ['Jenkins', 'GitHub Actions', 'GitLab CI/CD', 'CircleCI', 'Travis CI'],
        required: true

    },
    webhook_secret : { type: String, required: true},
    created_at : { type: Date, default: Date.now}


},
{ timestamps: { createdAt: true, updatedAt: false } }
);

module.exports.Pipeline = mongoose.model("Pipeline", pipelineSchema);
