const jwt = require("jsonwebtoken");

 const protect =  (req,res,next) => {
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({ message: "Bearer token required" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }catch(error) {
        console.error("JWT Verification Error:", error.message);
        return res.status(401).json({ message: "Login Timeout Login again" });
    }
    }

    module.exports = { protect };