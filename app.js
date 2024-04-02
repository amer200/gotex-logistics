const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv')
dotenv.config({ path: '.env' })
const { dbConnection } = require('./db/mongoose');
const initializeSocket = require('./utils/socketHandler');
const app = express();

const { uploadCarrierData } = require('./utils/fileUpload')

const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/user");
const carrierRoutes = require("./routes/carrier");
const orderRoutes = require("./routes/order");
const storeKeeperRoutes = require("./routes/storekeeper");
const notificationRoutes = require("./routes/notification");
const citiesRoute = require('./routes/cities')


dbConnection();

/** File Upload */
app.post('/carrier/register', uploadCarrierData.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'papers', maxCount: 3 }  // Allow up to 3 papers
]));

// Middlewares
app.use(express.static('public'));
app.use(express.static('upload'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json())
app.set("view engine", "ejs");

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH']
}));

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
app.use("/notifications", storeKeeperRoutes);
app.use('/cities', citiesRoute);



const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
