const express = require("express");
const router = express.Router();
const customersController = require("../controllers/customersController");

router.get("/", customersController.getAllCustomers);
router.get("/:id", customersController.getCustomerById);
router.get("/export", customersController.exportCustomersToExcel);

module.exports = router;
