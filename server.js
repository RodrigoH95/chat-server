const express = require('express');
require("dotenv").config();
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {cors: {origin: '*'}});
const RoomService = require("./services/room").RoomService;
const MessageService = require("./services/message").MessageService;

const roomService = new RoomService(io);
const messageService = new MessageService(io);

roomService.init();

io.on("connection", socket => {

  socket.on("new-user", () => {
    // const usersAmount = io.sockets.sockets.size;
    // while(roomService.getCapacity() < usersAmount) roomService.createRoom();
    roomService.updateRooms(socket.id);
  })

  socket.on("send-message", (message) => {
    // message es un objeto con claves id, sender y message
    // Ya no se usa el id del socket porque no hay salas personales
    // const room = socket.rooms.size < 2 ? socket.id : [...socket.rooms][1];
    const room = [...socket.rooms][1];
    return messageService.sendMessage(room, message);
  });

  socket.on("join-room", (roomName, playerName) => {
    roomService.changeRoom(socket, roomName, playerName);
  });

  socket.on("user-change-name", (currentRoom, userName) => {
    roomService.userNameChange(currentRoom, socket.id, userName);
  });

  socket.on("disconnecting", (reason) => {
    console.log(`User ${socket.id} disconnected: ${reason}`);
    roomService.leaveAllRooms(socket);
    roomService.removePlayerByID(socket.id);
    // roomService.cleanRooms(io.sockets.sockets.size); // Ya no es requerido porque el numero de salas es fijo
  })
});

server.listen(process.env.PORT, () => {
  console.log("Server running on port " + process.env.PORT);
})