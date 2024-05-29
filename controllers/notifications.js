
const Notifications = require('../models/notifications');
const asyncHandler = require('express-async-handler')

exports.getAllNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notifications.find({ carrier: req.params.carrierId })

    res.status(200).json({
        result: notifications.length,
        results: notifications
    })
})
exports.deleteNotification = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const notification = await Notifications.findByIdAndDelete(notificationId);



    res.status(200).json({ msg: 'ok', data: notification })
})




