const socketIo = require('socket.io');
function initializeSocket(server) {
    const io = socketIo(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH']
        }
    });
    io.on('connection', (socket) => {
        console.log('A user connected');

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });

        // Handle other events as needed
    });

    return io;
}

module.exports = initializeSocket;
