const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/db");


const { protect } = require("./middleware/authMiddleware");

const authRoutes = require("./routes/authRoute");
const { authorizeRoles } = require("./middleware/roleMiddleware");
const deploymentRoutes = require("./routes/deploymentsRoute");
const environmentRoutes = require("./routes/environmentRoutes");
const userRoute = require("./routes/userRoutes");

// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import connectDB from './config/db.js';
// import { User } from './schema/userSchema.js';
// import seed from './seed.js';
const app = express();
const projectRoute = require("./routes/projectsRoute");
const logsRoute = require("./routes/logRoutes");
const auditLogRoutes = require("./routes/auditLogRoutes");

dotenv.config();
app.use(helmet());
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

// app.use("/",)
app.use("/api/projects", projectRoute);
app.use("/api/auth", authRoutes);
app.use("/api/deployments", deploymentRoutes);
app.use("/api/users", userRoute);
app.use("/api/environments", environmentRoutes);
app.use("/api/audit-logs", auditLogRoutes);

// Logs Module
app.use("/api/logs", logsRoute);

const { handleJenkinsWebhook } = require("./controllers/jenkinsController");
app.post("/api/jenkins-webhook", handleJenkinsWebhook);

app.use("/", protect, authorizeRoles("admin"), (req, res) => {
    res.send("Protected Route Accessed");
});
app.use
connectDB();

// 




app.get('/', (req, res) => {
    res.send("Welcome to Deployment Tracking System API");
})











app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
