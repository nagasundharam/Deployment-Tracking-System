
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user ||  !roles.includes(req.user.role)) {
            console.log(`403 Forbidden: User ${req.user?._id} with role ${req.user?.role} tried to access a route that requires ${roles}`);
            return res.status(403).json({ message: "Access denied: insufficient permissions" });
        }    
        
        next();                          
};
};
module.exports = { authorizeRoles };