const { Deployment } = require("../schema/deploymentSchema");
const { Environment } = require("../schema/environmentSchema");
const { Project } = require("../schema/projectSchema");
const { DeploymentLogs } = require("../schema/deploymentLogsSchema");

async function buildDeploymentReport(deploymentId) {
  const deployment = await Deployment.findById(deploymentId)
    .populate("project_id")
    .populate("environment_id")
    .populate("triggered_by.user_id", "name email");

  if (!deployment) {
    throw new Error("Deployment not found");
  }

  const logs = await DeploymentLogs.find({ deployment_id: deploymentId }).sort({
    timestamp: 1,
  });

  const stagesTable = deployment.stages.map((s) => ({
    stage: s.name,
    status: s.status,
    startTime: s.updated_at,
    endTime: s.updated_at,
  }));

  const env = deployment.environment_id;

  return {
    deploymentInfo: {
      projectName: deployment.project_id?.name,
      environment: env?.name,
      version: deployment.version,
      status: deployment.status,
      triggeredBy: deployment.triggered_by?.username,
      deploymentId: deployment._id.toString(),
      deploymentDate: deployment.createdAt,
      deploymentDuration: deployment.end_time && deployment.start_time
        ? (deployment.end_time - deployment.start_time) / 1000
        : null,
    },
    pipelineExecution: stagesTable,
    logs: logs.map((l) => `[${l.timestamp.toISOString()}] ${l.message}`),
    environmentInfo: {
      environmentName: env?.name,
      clusterRegion: "N/A",
      totalNodes: "N/A",
      activeNodes: "N/A",
      healthStatus: deployment.status === "success" ? "Healthy" : "Degraded",
    },
    summary: {
      deploymentResult: deployment.status,
      pipelineDuration:
        deployment.end_time && deployment.start_time
          ? (deployment.end_time - deployment.start_time) / 1000
          : null,
      errors: logs
        .filter((l) => l.logs_type === "error")
        .map((l) => l.message),
    },
  };
}

function toCSV(report) {
  const lines = [];
  lines.push("Deployment Report");
  lines.push("");
  lines.push("SECTION 1: Deployment Information");
  const info = report.deploymentInfo;
  lines.push(`Project Name,${info.projectName || ""}`);
  lines.push(`Environment,${info.environment || ""}`);
  lines.push(`Version,${info.version || ""}`);
  lines.push(`Status,${info.status || ""}`);
  lines.push(`Triggered By,${info.triggeredBy || ""}`);
  lines.push(`Deployment ID,${info.deploymentId || ""}`);
  lines.push(`Deployment Date,${info.deploymentDate || ""}`);
  lines.push(`Deployment Duration (s),${info.deploymentDuration || ""}`);
  lines.push("");
  lines.push("SECTION 2: Pipeline Execution");
  lines.push("Stage,Status,Start Time,End Time");
  report.pipelineExecution.forEach((s) => {
    lines.push(
      `${s.stage},${s.status},${s.startTime || ""},${s.endTime || ""}`
    );
  });
  lines.push("");
  lines.push("SECTION 3: Deployment Logs");
  report.logs.forEach((l) => lines.push(l));
  lines.push("");
  lines.push("SECTION 4: Environment Information");
  const env = report.environmentInfo;
  lines.push(`Environment Name,${env.environmentName || ""}`);
  lines.push(`Cluster/Region,${env.clusterRegion || ""}`);
  lines.push(`Total Nodes,${env.totalNodes || ""}`);
  lines.push(`Active Nodes,${env.activeNodes || ""}`);
  lines.push(`Health Status,${env.healthStatus || ""}`);
  lines.push("");
  lines.push("SECTION 5: Summary");
  const s = report.summary;
  lines.push(`Deployment Result,${s.deploymentResult || ""}`);
  lines.push(`Pipeline Duration (s),${s.pipelineDuration || ""}`);
  lines.push(`Errors,${s.errors.join(" | ")}`);
  return lines.join("\n");
}

module.exports = { buildDeploymentReport, toCSV };

