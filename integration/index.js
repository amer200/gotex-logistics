const express = require("express");
const router = express.Router();

const userRoutes = require("./routes/user");
const orderRoutes = require("./routes/order");

router.use("/user", userRoutes);
router.use("/order", orderRoutes);

module.exports = router;
