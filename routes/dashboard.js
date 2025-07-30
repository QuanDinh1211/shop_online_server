const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

router.get("/", dashboardController.getDashboardData);
router.get("/today-stats", dashboardController.getTodayStats);

module.exports = router;
