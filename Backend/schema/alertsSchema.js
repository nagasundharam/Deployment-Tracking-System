const mongoose = require("mongoose");

const alertsSchema = new mongoose.Schema({
    project_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true

    },
    type : { type: String,enum: ['build_failure','deployment_failure','test_failure'], required: true},
    channel : { type: String, enum: ['email','slack','sms']},
    status : { type: String, enum: ['send','failed'], default: 'failed'}
},

{ timestamps: { createdAt: true, updatedAt: false } });

module.exports.Alerts = mongoose.model("Alerts", alertsSchema); 