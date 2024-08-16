const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
dotenv.config({ path: "production.env" });
const { dbConnection } = require("./db/mongoose");
const initializeSocket = require("./utils/socketHandler");
const app = express();

const globalErrorHandling = require("./middlewares/globalErrorHandling");
const { uploadCarrierData, uploadOrderData } = require("./utils/fileUpload");

const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/user");
const carrierRoutes = require("./routes/carrier");
const orderRoutes = require("./routes/order");
const storeKeeperRoutes = require("./routes/storekeeper");
const trackerRoutes = require("./routes/tracker");
const notificationRoutes = require("./routes/notification");
const citiesRoute = require("./routes/cities");
const districtsRoute = require("./routes/district");
const paymentRoute = require("./routes/payment");

const integrateRoutes = require("./integration");

dbConnection();

/** File Upload */
app.post(
  "/carrier/register",
  uploadCarrierData.fields([
    { name: "photo", maxCount: 1 },
    { name: "papers", maxCount: 3 }, // Allow up to 3 papers
  ])
);

// edit
app.put(
  "/carrier/:id",
  uploadCarrierData.fields([
    { name: "photo", maxCount: 1 },
    { name: "papers", maxCount: 3 }, // Allow up to 3 papers
  ])
);

app.put(
  "/order/change-status-to-pending",
  uploadOrderData.array("images.pending")
);
app.put(
  "/order/picked-to-store",
  uploadOrderData.array("images.pickedToStore")
);
app.put(
  "/order/in-store-request",
  uploadOrderData.array("images.inStoreRequest")
);
app.put(
  "/order/in-store-request-status",
  uploadOrderData.array("images.inStoreRequestStatus")
);
app.patch(
  "/store-keeper/add-order-store/:ordernumber",
  uploadOrderData.array("images.inStore")
);
app.put(
  "/order/picked-to-client",
  uploadOrderData.array("images.pickedToClient")
);
app.put("/order/order-received", uploadOrderData.array("images.received"));
app.put("/order/cancel-order", uploadOrderData.array("images.canceled"));
app.put(
  "/order/cancel-order-by-collector",
  uploadOrderData.array("images.canceled")
);
app.put("/order/return-order/:id", uploadOrderData.array("images.return"));
app.put("/order/problem-request", uploadOrderData.array("problem.images"));

app.put(
  "/integrate/order/cancel-order",
  uploadOrderData.array("images.canceled")
);

// Middlewares
app.use(express.static("public"));
app.use(express.static("upload"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.set("view engine", "ejs");
app.use(morgan("combined"));

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
  })
);

const server = http.createServer(app);
const io = initializeSocket(server);
app.use((req, res, next) => {
  req.io = io;
  next();
});

/** Routes */
app.use("/admin", adminRoutes);
app.use("/user", userRoutes);
app.use("/carrier", carrierRoutes);
app.use("/order", orderRoutes);
app.use("/store-keeper", storeKeeperRoutes);
app.use("/tracker", trackerRoutes);
app.use("/notifications", notificationRoutes);
app.use("/cities", citiesRoute);
app.use("/districts", districtsRoute);
app.use("/payment", paymentRoute);

app.use("/integrate", integrateRoutes);

app.use(globalErrorHandling);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
