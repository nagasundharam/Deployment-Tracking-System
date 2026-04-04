const { Deployment } = require("../models/schema/deploymentSchema");
const { Project } = require("../models/schema/projectSchema");
const { Environment } = require("../models/schema/environmentSchema");
const { User } = require("../models/schema/userSchema");
const { DeploymentLogs } = require("../models/schema/deploymentLogsSchema");
const { runPipelineForDeployment } = require("../simulator");
const { buildDeploymentReport, toCSV } = require("../utils/reportBuilder");
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");

// --- METADATA & HELPER HANDLERS ---

// Get projects and devops users for dropdowns
exports.getMetadata = async (req, res) => {
  try {
    const projects = await Project.find().select("name _id");
    const devops = await User.find({ role: "devops" }).select("name _id");
    res.json({ projects, devops });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get specific environments linked to a project
exports.getEnvironmentsByProject = async (req, res) => {
  try {
    const environments = await Environment.find({ project_id: req.params.projectId });
    res.json(environments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Dashboard Stats (Count by status)
exports.getDeploymentStats = async (req, res) => {
  try {
    const stats = await Deployment.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- CORE CRUD HANDLERS ---

exports.createDeployment = async (req, res) => {
  try {
    const { project_id, environment_id, version, branch, triggered_by, pipeline_id } = req.body;

    const defaultStages = [
      { name: "Source Code Analysis", status: "pending" },
      { name: "Container Build", status: "pending" },
      { name: "Security Scan", status: "pending" },
      { name: "Artifact Deployment", status: "pending" }
    ];

    const deployment = new Deployment({
      project_id,
      environment_id,
      pipeline_id: pipeline_id || new mongoose.Types.ObjectId(),
      version,
      branch,
      triggered_by: {
        source: triggered_by?.source || "manual",
        username: triggered_by?.username,
        user_id: req.user?._id || triggered_by?.user_id, // From protect middleware
      },
      status: "pending",
      stages: defaultStages,
    });

    const saved = await deployment.save();
    
    // Update Environment status
    await Environment.findByIdAndUpdate(environment_id, { 
        status: "pending", 
        last_deployment: saved._id 
    });

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getDeployments = async (req, res) => {
  try {
    const deployments = await Deployment.find()
      .populate("project_id", "name")
      .populate("environment_id", "name")
      .sort({ createdAt: -1 });
    res.json(deployments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDeploymentById = async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.id)
      .populate("project_id")
      .populate("environment_id")
      .populate("triggered_by.user_id", "name");
    if (!deployment) return res.status(404).json({ message: "Not found" });
    res.json(deployment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const { createAuditEntry } = require("./auditLogController");

exports.deleteDeployment = async (req, res) => {
  try {
    const deployment = await Deployment.findByIdAndDelete(req.params.id)
      .populate("project_id", "name")
      .populate("environment_id", "name");
    
    if (!deployment) return res.status(404).json({ message: "Not found" });

    // Log the deletion
    await createAuditEntry(req.user?._id || req.user?.id, "Deleted Deployment Record", `Version: ${deployment.version} (Project: ${deployment.project_id?.name})`, req.ip);

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateDeployment = async (req, res) => {
  try {
    const { version, branch, status } = req.body;

    // Fetch old version for comparison
    const oldDep = await Deployment.findById(req.params.id)
      .populate("project_id", "name");

    if (!oldDep) return res.status(404).json({ message: "Deployment not found" });

    const updated = await Deployment.findByIdAndUpdate(
      req.params.id,
      { version, branch, status, updatedAt: Date.now() },
      { new: true }
    ).populate("project_id", "name").populate("environment_id", "name");

    if (!updated) return res.status(404).json({ message: "Deployment not found" });

    // Identify changed fields
    let changes = [];
    if (oldDep.version !== updated.version) changes.push(`Version: "${oldDep.version}" → "${updated.version}"`);
    if (oldDep.branch !== updated.branch) changes.push(`Branch: "${oldDep.branch}" → "${updated.branch}"`);
    if (oldDep.status !== updated.status) changes.push(`Status: "${oldDep.status}" → "${updated.status}"`);

    const changeMsg = changes.length > 0 ? `Modified: ${changes.join(", ")}` : "Modified Deployment Record";

    // Log the detailed update
    await createAuditEntry(req.user?._id || req.user?.id, changeMsg, `Project: ${updated.project_id?.name} (V: ${updated.version})`, req.ip);

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// --- CI/CD PIPELINE CONTROL HANDLERS ---

// Update overall status (running, success, failure)
exports.updateDeploymentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = [
      "pending",
      "approved",
      "running",
      "success",
      "failure",
      "failed",
      "rejected",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid deployment status" });
    }

    // Prevent creators from approving their own deployments.
    if (status === "approved") {
      const requesterRole = req.user?.role;
      const requesterId = req.user?.id;

      if (!["admin", "devops"].includes(requesterRole)) {
        return res.status(403).json({
          message: "Only admin or devops users can approve deployments",
        });
      }

      const deployment = await Deployment.findById(req.params.id).select(
        "triggered_by.user_id"
      );

      if (!deployment) {
        return res.status(404).json({ message: "Deployment not found" });
      }

      const creatorId = deployment.triggered_by?.user_id?.toString();

      if (creatorId && creatorId === requesterId) {
        return res.status(403).json({
          message:
            "Creators cannot approve their own deployments. Another admin or devops engineer must approve.",
        });
      }
    }

    const updateData = { status };
    
    if (status === "running") updateData.start_time = new Date();
    if (status === "success" || status === "failure" || status === "failed") {
      updateData.end_time = new Date();
    }

    const updated = await Deployment.findByIdAndUpdate(req.params.id, updateData, { new: true });

    // When a deployment moves to running via manual trigger, invoke simulator
    if (status === "running") {
      runPipelineForDeployment(updated._id.toString());
    }

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update a specific stage inside the array (e.g., mark "Build" as success)
exports.updateStageStatus = async (req, res) => {
  try {
    const { stageName, status } = req.body;
    const updateData = { 
      "stages.$.status": status, 
      "stages.$.updated_at": new Date() 
    };

    if (status === "running") {
      updateData["stages.$.start_time"] = new Date();
    } else if (status === "success" || status === "failure" || status === "failed") {
      updateData["stages.$.end_time"] = new Date();
    }

    const updated = await Deployment.findOneAndUpdate(
      { _id: req.params.id, "stages.name": stageName },
      { $set: updateData },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Rollback: Creates a new deployment based on an old one
exports.rollbackDeployment = async (req, res) => {
  try {
    const original = await Deployment.findById(req.params.id).populate("project_id", "name");
    const rollback = new Deployment({
      ...original.toObject(),
      _id: new mongoose.Types.ObjectId(),
      version: `${original.version}-rollback`,
      status: "pending",
      stages: original.stages.map(s => ({ ...s, status: "pending" })),
      createdAt: new Date()
    });
    const saved = await rollback.save();

    // Log the rollback
    await createAuditEntry(req.user?._id || req.user?.id, "Rollback Initiated", `From: ${original.version} -> To: ${saved.version} (Project: ${original.project_id?.name})`, req.ip);

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Redeploy: Restarts the same version
exports.redeployDeployment = async (req, res) => {
  try {
    const original = await Deployment.findById(req.params.id).populate("project_id", "name");
    const redeploy = new Deployment({
      ...original.toObject(),
      _id: new mongoose.Types.ObjectId(),
      status: "pending",
      stages: original.stages.map(s => ({ ...s, status: "pending" })),
      createdAt: new Date()
    });
    const saved = await redeploy.save();

    // Log the redeploy
    await createAuditEntry(req.user?._id || req.user?.id, "Redeploy Initiated", `Version: ${original.version} (Project: ${original.project_id?.name})`, req.ip);

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// --- MONITORING HANDLERS ---

exports.getDeploymentLogs = async (req, res) => {
  try {
    const logs = await DeploymentLogs.find({ deployment_id: req.params.id }).sort({ timestamp: 1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- REPORTING ---

exports.exportDeploymentReport = async (req, res) => {
  try {
    const format = (req.query.format || "pdf").toLowerCase();
    const report = await buildDeploymentReport(req.params.id);

    if (format === "csv") {
      const csv = toCSV(report);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="deployment-${req.params.id}.csv"`
      );
      return res.send(csv);
    }

    // Generate a simple but valid PDF using pdfkit
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="deployment-${req.params.id}.pdf"`
    );

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    // Title
    doc.fontSize(18).text("Deployment Report", { align: "center" });
    doc.moveDown();

    // Basic deployment info
    doc.fontSize(12);
    doc.text(`Project: ${report.deploymentInfo.projectName || ""}`);
    doc.text(`Environment: ${report.deploymentInfo.environment || ""}`);
    doc.text(`Version: ${report.deploymentInfo.version || ""}`);
    doc.text(`Status: ${report.deploymentInfo.status || ""}`);
    doc.moveDown();

    // Pipeline execution section
    doc.fontSize(14).text("Pipeline Execution", { underline: true });
    doc.moveDown(0.5);
    report.pipelineExecution.forEach((s) => {
      doc
        .fontSize(12)
        .text(
          `• ${s.stage} - ${s.status}${s.startTime ? ` (${s.startTime})` : ""}`
        );
    });
    doc.moveDown();

    // Logs section
    if (report.logs && report.logs.length) {
      doc.fontSize(14).text("Logs", { underline: true });
      doc.moveDown(0.5);
      report.logs.forEach((line) => {
        doc.fontSize(10).text(line);
      });
    }

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};