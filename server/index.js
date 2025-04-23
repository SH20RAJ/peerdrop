const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const cors = require('cors');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Enable CORS
app.use(cors());

// Serve static files from the 'src' directory
app.use(express.static(path.join(__dirname, '../src')));

// Serve socket.io client
app.get('/socket.io/socket.io.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../node_modules/socket.io/client-dist/socket.io.js'));
});

// Serve the main HTML file for all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../src/index.html'));
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    // Create a new room
    socket.on('create', () => {
        const roomId = generateRoomId();
        socket.join(roomId);
        console.log(`Room created: ${roomId}`);
        socket.emit('created', roomId);
    });
    
    // Join an existing room
    socket.on('join', (roomId) => {
        const room = io.sockets.adapter.rooms.get(roomId);
        
        if (room && room.size === 1) {
            // Room exists and has one client
            socket.join(roomId);
            console.log(`User joined room: ${roomId}`);
            socket.emit('joined', roomId);
            socket.to(roomId).emit('ready');
        } else if (room && room.size > 1) {
            // Room is full (already has two clients)
            socket.emit('full', roomId);
        } else {
            // Room doesn't exist
            socket.emit('error', { message: 'Room does not exist' });
        }
    });
    
    // WebRTC signaling: offer
    socket.on('offer', (description, roomId) => {
        console.log(`Received offer from ${socket.id} in room ${roomId}`);
        socket.to(roomId).emit('offer', description);
    });
    
    // WebRTC signaling: answer
    socket.on('answer', (description, roomId) => {
        console.log(`Received answer from ${socket.id} in room ${roomId}`);
        socket.to(roomId).emit('answer', description);
    });
    
    // WebRTC signaling: ICE candidate
    socket.on('candidate', (candidate, roomId) => {
        console.log(`Received ICE candidate from ${socket.id} in room ${roomId}`);
        socket.to(roomId).emit('candidate', candidate);
    });
    
    // Disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Generate a random room ID
function generateRoomId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});
