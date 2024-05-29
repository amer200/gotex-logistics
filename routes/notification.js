const express = require("express");
const routes = express.Router();
const { deleteNotification, getAllNotifications } = require('../controllers/notifications')


routes.get('/:carrierId', getAllNotifications);
routes.delete('/:notificationId', deleteNotification);




module.exports = routes