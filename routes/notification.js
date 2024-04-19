const express = require("express");
const routes = express.Router();
const { deleteNotification, getAllNotifications } = require('../controllers/notifications')


routes.get('/:id', getAllNotifications);
routes.delete('/:id', deleteNotification);




module.exports = routes