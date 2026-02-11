import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
const app = express();

dotenv.config();

app.use(cors());
app.use(express.json());

app.get('/', (req,res)=> {
    res.send("Welcome to Deployment Tracking System API");
})



//Role Based Access Control Middleware

connectDB();

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
