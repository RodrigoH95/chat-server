const io = require("socket.io")(3000, {
  cors: {
    origin: ['https://mensajea.netlify.app/']
  }
});

io.on("connection", socket => {
  console.log(socket.id);
  socket.on("send-message", (message) => socket.broadcast.emit("receive-message", message));
});
