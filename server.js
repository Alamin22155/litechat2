const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static(path.join(__dirname, 'public')));

const messages = [];

io.on('connection', (socket) => {
  socket.emit('chat history', messages);

  socket.on('chat message', (data) => {
    const msg = {
      user: data.user,
      text: data.text,
      time: new Date().toLocaleTimeString('bn-BD')
    };
    messages.push(msg);
    if (messages.length > 100) messages.shift();
    io.emit('chat message', msg);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('সার্ভার চালু: পোর্ট ' + PORT);
});
