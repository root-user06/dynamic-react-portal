
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Set up CORS for both REST and Socket.io
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:8080',
  methods: ['GET', 'POST'],
  credentials: true
}));

// Set up Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:8080',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Serve static files for sound in development
if (process.env.NODE_ENV === 'development') {
  app.use('/sounds', express.static(path.join(__dirname, '../public/sounds')));
}

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // User joining with their ID
  socket.on('user:join', (userId) => {
    socket.join(userId);
    socket.userId = userId;
    console.log(`User ${userId} joined`);
  });
  
  // Call signaling
  socket.on('call:start', (data) => {
    console.log(`Call from ${data.callerId} to ${data.receiverId}`);
    socket.to(data.receiverId).emit('call:incoming', data);
  });
  
  socket.on('call:accept', (data) => {
    socket.to(data.callerId).emit('call:accepted', data);
  });
  
  socket.on('call:reject', (data) => {
    socket.to(data.callerId).emit('call:rejected', data);
  });
  
  socket.on('call:end', (data) => {
    if (data.receiverId) {
      socket.to(data.receiverId).emit('call:ended', data);
    }
    if (data.callerId && data.callerId !== socket.userId) {
      socket.to(data.callerId).emit('call:ended', data);
    }
  });
  
  // ICE candidates exchange
  socket.on('ice-candidate', (data) => {
    if (data.target) {
      socket.to(data.target).emit('ice-candidate', {
        candidate: data.candidate,
        from: socket.userId
      });
    }
  });
  
  // SDP exchange
  socket.on('sdp-offer', (data) => {
    if (data.target) {
      socket.to(data.target).emit('sdp-offer', {
        sdp: data.sdp,
        from: socket.userId
      });
    }
  });
  
  socket.on('sdp-answer', (data) => {
    if (data.target) {
      socket.to(data.target).emit('sdp-answer', {
        sdp: data.sdp,
        from: socket.userId
      });
    }
  });
  
  // Disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket.userId) {
      io.emit('user:offline', socket.userId);
    }
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
