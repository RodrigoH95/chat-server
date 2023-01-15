const express = require('express');
const app = express();
const server = require("http").createServer(app);
require("dotenv").config();
const io = require("socket.io")(server, {
  cors: {
    origin: '*'
  }
});

// https://mensajea.netlify.app

let salas = [];

io.on("connection", socket => {
  

  socket.on("new-user", data => {
    salas.push("sala:" + socket.id + ":" + data.name);
    io.emit("room-list", salas);
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

  socket.on("join-room", id => {
    changeRoom(socket, id);
  });

  socket.on("disconnect", () => {
    salas = salas.filter(sala => sala.split(":")[1] !== socket.id);
    io.emit("room-list", salas);
  })
});

function changeRoom(socket, roomId) {
  for (room of socket.rooms) {
    if(socket.id !== room) socket.leave(room);
  }
  socket.join(roomId);
  const clientName = salas.find(sala => sala.includes(socket.id)).split(":")[2];
  const hostName = salas.find(sala => sala.includes(roomId)).split(":")[2];
  io.to(roomId).emit("user-join-room", clientName, hostName);
}
server.listen(process.env.PORT, () => {
  console.log("Server running on port " + process.env.PORT);
})