const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  resource: {
    type: String,
    required: true,
  },
  ip: {
    type: String,
    default: "Unknown",
  },
});

module.exports.AuditLog = mongoose.model("AuditLog", auditLogSchema);
