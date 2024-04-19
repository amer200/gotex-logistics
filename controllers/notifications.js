
const Notifications = require('../models/notifications');
const asyncHandler = require('express-async-handler')

exports.getAllNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notifications.find({ carrier: req.params.id })

    res.status(200).json({
        result: notifications.length,
        results: notifications
    })
})
exports.deleteNotification = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const notifications = await Notifications.findByIdAndDelete(id);



    res.status(200).json({ msg: 'ok', data: notifications })
})




