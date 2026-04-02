const express = require("express");
const router = express.Router();
const { getAuditLogs } = require("../controllers/auditLogController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// GET /api/audit-logs
router.get("/", protect, authorizeRoles("admin"), getAuditLogs);

module.exports = router;
