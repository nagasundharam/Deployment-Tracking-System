const { AuditLog } = require("../models/schema/auditLogSchema");

// Fetch all audit logs
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate("user", "name email role")
      .sort({ timestamp: -1 });
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ message: "Error fetching audit logs", error: err.message });
  }
};

// Internal helper to create an audit entry
exports.createAuditEntry = async (userId, action, resource, ip = "Internal") => {
  try {
    const newEntry = new AuditLog({
      user: userId,
      action,
      resource,
      ip,
    });
    await newEntry.save();
  } catch (err) {
    console.error("Failed to create audit log entry:", err);
  }
};
