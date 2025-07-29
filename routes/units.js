const express = require("express");
const router = express.Router();
const {
  createUnit,
  getAllUnits,
  getUnitById,
  updateUnit,
  deleteUnit,
  errorHandler,
} = require("../controllers/unitController");

router.post("/", createUnit);
router.get("/", getAllUnits);
router.get("/:id", getUnitById);
router.put("/:id", updateUnit);
router.delete("/:id", deleteUnit);
router.use(errorHandler);

module.exports = router;
