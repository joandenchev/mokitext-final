import http from 'http';
import express from "express";
import {Server as socketio} from 'socket.io';
import message from './utils/messages.js'
import {getCurrentUser, getRoomUsers, userJoin, userLeave} from "./utils/users.js";
import {GetAllMessagesFrom} from "./database.js";
//import { } from './utils/users.js'

const app = express();
const server = http.createServer(app);
const io = new socketio(server);

// Set static folder
app.use(express.static('public'));

const botName = 'MokiBot';

// Run when client connects
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome current user
    socket.emit('message', new message(botName, `Welcome to ${room}!`));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message', new message(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  // Listen for chatMessage
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit('message', new message(user.username, msg));
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        new message(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});

app.get('/check', authenticate, (req, res) => {
  res.sendStatus(200)
})

app.get('/chatflow', authenticate, async (req, res) => {
  try {
  res.json(await GetAllMessagesFrom(req.headers['X-Chat']))
  } catch (e) {
    res.sendStatus(500)
    console.log(e.message)
  }
})

app.post('/lookup', authenticate, (req, res) => {

})

const PORT = 3000;

async function authenticate(req, res, next) {
  const token = req.headers.authorization
  if (!token) return res.sendStatus(401)

  jwt.verify(token, process.env.ACCESS_TOKEN_KEY, undefined, (e, user) => {
    if (e) return res.sendStatus(403)
    console.log(user + ' authorized!')
    req.user = user
    next()
  })
}

server.listen(PORT, () => console.log(`Server ready on port ${PORT}`));
