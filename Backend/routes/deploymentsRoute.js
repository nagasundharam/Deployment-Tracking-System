const express = require("express");
const { handleJenkinsWebhook } = require("../controllers/jenkinsController");
const { getDeploymentDetails } = require("../controllers/deploymentsController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const router = express.Router();



router.post("/jenkins-webhook",handleJenkinsWebhook);

router.get("/deployment-details",protect,authorizeRoles("admin","devops") ,getDeploymentDetails);

// router.get("/all-deployment-details",protect,authorizeRoles("admin") ,getAllDeploymentDetails);



module.exports = router;