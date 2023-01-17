const express = require('express');
require("dotenv").config();
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {cors: {origin: '*'}});
const RoomService = require("./services/room").RoomService;
const MessageService = require("./services/message").MessageService;

const roomService = new RoomService(io);
const messageService = new MessageService(io);

io.on("connection", socket => {

  socket.on("new-user", () => {
    const usersAmount = io.sockets.sockets.size;
    while(roomService.getCapacity() < usersAmount) roomService.createRoom();
    roomService.updateRooms();
  })

  socket.on("send-message", (message) => {
    // message es un objeto con claves id, sender y message
    const room = socket.rooms.size < 2 ? socket.id : [...socket.rooms][1];
    return messageService.sendMessage(room, message);
  });

  socket.on("join-room", (roomID, playerName) => {
    roomService.changeRoom(socket, roomID, playerName);
  });

  socket.on("user-change-name", (currentRoom, userName) => {
    roomService.userNameChange(currentRoom, socket.id, userName);
  });

  socket.on("disconnecting", (reason) => {
    console.log(`User ${socket.id} disconnected: ${reason}`);
    roomService.leaveAllRooms(socket);
    roomService.removePlayerByID(socket.id);
    roomService.cleanRooms(io.sockets.sockets.size);
  })
});

server.listen(process.env.PORT, () => {
  console.log("Server running on port " + process.env.PORT);
})