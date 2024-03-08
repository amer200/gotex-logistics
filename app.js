const express = require('express');
const http = require('http');
const cors = require('cors');
const { dbConnection } = require('./db/mongoose');
const initializeSocket = require('./utils/socketHandler');
const app = express();
dbConnection();
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
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
