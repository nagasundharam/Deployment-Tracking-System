
const mongoose = require("mongoose");
const projectSchema = new mongoose.Schema({
    name : { type: String, required: true},
    description: { type: String},
    repo_url : { type: String},
    members : [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    created_by : { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
},
 { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports.Project = mongoose.model("Project", projectSchema);
