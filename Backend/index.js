const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const { User } = require("./schema/userSchema");

const {protect} = require("./middleware/authMiddleware");

const authRoutes = require("./routes/authRoute");
const { authorizeRoles } = require("./middleware/roleMiddleware");

// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import connectDB from './config/db.js';
// import { User } from './schema/userSchema.js';
// import seed from './seed.js';
const app = express();



dotenv.config();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

app.use("/",protect,authorizeRoles("admin") ,(req,res) => {
    res.send("Protected Route Accessed");
});
connectDB();

// 




app.get('/', (req,res)=> {
    res.send("Welcome to Deployment Tracking System API");
})











app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
