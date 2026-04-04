const mongoose = require("mongoose");

const deploymentSchema = new mongoose.Schema({
    project_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true
    },
    environment_id : { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Environment",
        required: true


    },
    pipeline_id: { 
        type: String, 
        required: true 
    },
    version : { type: String, required: true},
    branch: String,

    triggered_by: {
  source: {
    type: String,
    enum: ['github', 'manual', 'system', 'jenkins'],
    required: true
  },
  username: {
    type: String // GitHub username or system name
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
},

    status: { 
      type: String, 
      enum : [
        'pending',
        'approved',
        'running',
        'success',
        'failure',
        'failed',
        'rejected',
        'cancelled'
      ], 
      default: 'pending'
    },
    start_time : { type: Date},
    end_time : { type: Date},
   
    commit_message: { type: String },
    commit_author: { type: String },
    commit_author_email: { type: String },
    commit_hash: { type: String },

stages: [{
  name: { type: String }, // e.g., "Build", "Unit Test", "SonarQube Scan"
  status: { 
    type: String, 
    enum: ['pending', 'running', 'success', 'failure'], 
    default: 'pending' 
  },
  updated_at: { type: Date, default: Date.now }
}],
},
 { timestamps: true }
);

module.exports.Deployment = mongoose.model("Deployment", deploymentSchema);