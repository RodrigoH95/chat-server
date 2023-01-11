const express = require('express');
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: 'https://mensajea.netlify.app'
  }
});

io.on("connection", socket => {
  console.log(socket.id);
  socket.on("send-message", (message) => socket.broadcast.emit("receive-message", message));
});

server.listen(process.env.PORT, () => {
  console.log("Server running on port" + process.env.PORT);
})