const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static(path.join(__dirname, 'public')));

const messages = [];
const onlineUsers = new Map();

const AVATAR_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#06b6d4'
];

function getColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

io.on('connection', (socket) => {
  socket.emit('chat history', messages);

  socket.on('user join', (name) => {
    const color = getColor(name);
    onlineUsers.set(socket.id, { name, color });
    io.emit('online users', Array.from(onlineUsers.values()));
    io.emit('system message', name + ' যুক্ত হয়েছেন');
  });

  socket.on('chat message', (data) => {
    const msg = {
      id: Date.now() + Math.random(),
      user: data.user,
      text: data.text,
      color: getColor(data.user),
      time: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    };
    messages.push(msg);
    if (messages.length > 200) messages.shift();
    io.emit('chat message', msg);
  });

  socket.on('typing', (name) => {
    socket.broadcast.emit('user typing', name);
  });

  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing');
  });

  socket.on('disconnect', () => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      onlineUsers.delete(socket.id);
      io.emit('online users', Array.from(onlineUsers.values()));
      io.emit('system message', user.name + ' চলে গেছেন');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('সার্ভার চালু: পোর্ট ' + PORT);
});
