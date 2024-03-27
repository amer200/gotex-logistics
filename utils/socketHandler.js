const socketIo = require('socket.io');
const Notifications = require('../models/notifications');

function initializeSocket(server) {
    const io = socketIo(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH']
        }
    });
    io.on('connection', (socket) => {
        let data = Notifications.find();
        // socket.emit('connected', data)
        socket.on('disconnect', () => {
            console.log('User disconnected');
        });

        // Handle other events as needed
    });

    return io;
}

module.exports = initializeSocket;
