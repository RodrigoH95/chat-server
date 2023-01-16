const express = require('express');
require("dotenv").config();
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {cors: {origin: '*'}});
const RoomService = require("./services/room").RoomService;

const rooms = new RoomService(io);

io.on("connection", socket => {

  socket.on("new-user", () => {
    const usersAmount = io.sockets.sockets.size;
    while(rooms.getCapacity() < usersAmount) rooms.createRoom();
    rooms.updateRooms();
  })

  socket.on("send-message", (message) => {
    const room = socket.rooms.size < 2 ? socket.id : [...socket.rooms][1];
    return io.sockets.in(room).emit("receive-message", {id: socket.id, message});
  });

  socket.on("join-room", (id, playerName) => {
    rooms.changeRoom(socket, id, playerName);
  });

  socket.on("disconnect", (reason) => {
    console.log(`User ${socket.id} disconnected: ${reason}`);
    rooms.removePlayerByID(socket.id);
    rooms.cleanRooms(io.sockets.sockets.size);
  })
});

server.listen(process.env.PORT, () => {
  console.log("Server running on port " + process.env.PORT);
})