const express = require('express');
require("dotenv").config();
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {cors: {origin: '*'}});
const RoomService = require("./services/room").RoomService;

const rooms = new RoomService();

io.on("connection", socket => {
  

  socket.on("new-user", () => {
    const usersAmount = io.sockets.sockets.size;
    console.log(usersAmount, rooms.getCapacity());

    while(rooms.getCapacity() < usersAmount) {
      rooms.createRoom();
    }
    updateRooms(); 
    rooms.getRooms().forEach(room => console.log(room.getID(), room.playerList()));
  })

  socket.on("send-message", (message) => {
    let room = null;
    if(socket.rooms.size < 2) {
      room = socket.id;
    } else {
      room = [...socket.rooms][1];
    }
    return io.sockets.in(room).emit("receive-message", {id: socket.id, message});
  });

  socket.on("join-room", (id, roomName, playerName) => {
    changeRoom(socket, id, roomName, playerName);
  });

  socket.on("disconnect", (reason) => {
    console.log(`User ${socket.id} disconnected: ${reason}`);
    rooms.removePlayerByID(socket.id);
    cleanRooms();
    updateRooms();
  })
});

function cleanRooms() {
  const usersAmount = io.sockets.sockets.size;
  while(rooms.getCapacity() > usersAmount + 2) {
    const index = rooms.getRooms().findIndex(room => room.playerList().length === 0 && !room.hasGameStarted);
    rooms.removeRoom(index);
  }
}

function changeRoom(socket, roomId, roomName, playerName) {
  let room = rooms.find(roomId);
  if(room.isFull()) {
    socket.emit("room-full");
    return;
  }
  leaveAllRooms(socket);
  socket.join(roomId);
  room.addPlayer(socket.id, playerName);
  const usersInRoom = room.getPlayerNames();
  io.to(roomId).emit("user-join-room", socket.id, roomName, playerName);
  io.to(roomId).emit("room-users", usersInRoom);
}

function updateRooms() {
  const data = rooms.getRooms().map(room => ({id: room.id, number: room.number}));
  console.log(data);
  io.emit("room-list", data);
}

function leaveAllRooms(socket) {
  for (const room of socket.rooms) {
    if(socket.id !== room) {
      socket.leave(room);
      const r = rooms.find(room);
      r.removePlayer(socket.id);
      const usersInRoom = r.getPlayerNames();
      io.to(r.getID()).emit("room-users", usersInRoom);
    };
  }
}

server.listen(process.env.PORT, () => {
  console.log("Server running on port " + process.env.PORT);
})