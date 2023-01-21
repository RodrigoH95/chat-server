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
    roomService.updateRooms(socket.id);
  });

  socket.on("user-is-writing", (isUserTyping) => {
    roomService.userIsTyping(socket.id, isUserTyping);
  });

  socket.on("send-message", (message) => {
    // message es un objeto con claves id, sender y message
    const room = [...socket.rooms][1];
    return messageService.sendMessage(room, message);
  });

  socket.on("join-room", (roomName, playerName) => {
    console.log("Usuario se une a sala", roomName);
    roomService.changeRoom(socket, roomName, playerName);
  });

  socket.on("user-change-name", (currentRoom, userName) => {
    roomService.userNameChange(currentRoom, socket.id, userName);
  });

  socket.on("player-ready", () => {
    console.log("Player ready");
    try {
      roomService.playerReady(socket.id);
    } catch (err) {
      // socket.emit("error-starting-game");
      console.log("error 'player-ready");
    }
  });

  socket.on("toma-carta", (isPlayerOne) => {
    const room = roomService.findRoomByPlayerID(socket.id);
    try {
      if(room) {
        const carta = room.gameLogic.drawOneCard();
        room.gameLogic.jugadorRecibeCarta(isPlayerOne, carta);
      }
      if (room.gameLogic.cardManager.getMazo().length === 0) {
        io.to(room.getID()).emit("no-cards");
        room.gameLogic.drawOneCard(); // si no hay cartas remezcla el descarte
      }
    } catch (err) {
      console.log("error 'toma-descarte'");
      socket.emit("toma-carta-fail");
    }
  });

  socket.on("descarta", (isPlayerOne, carta) => {
    const room = roomService.findRoomByPlayerID(socket.id);
    try {
      room.gameLogic.playerDiscard(isPlayerOne, carta, socket);
    } catch (err) {
      console.log("error 'descarta'");
      socket.emit("descarta-fail");
    }
  });

  socket.on("usuario-corta", (isPlayerOne, carta) => {
    const room = roomService.findRoomByPlayerID(socket.id);
    try {
      room.gameLogic.playerEndsRound(isPlayerOne, carta);
    } catch (err) {
      console.log("usuario-corta falló");
      socket.emit("usuario-corta-fail");
    }
  })

  socket.on("toma-descarte", (isPlayerOne) => {
    const room = roomService.findRoomByPlayerID(socket.id);
    try {
      const carta = room.gameLogic.cardManager.descarte.pop();
      io.to(room.getID()).emit("eliminar-descarte");
      room.gameLogic.jugadorRecibeCarta(isPlayerOne, carta);
    } catch {
      console.log("Error 'toma-descarte'")
      socket.emit("toma-descarte-fail");
    }
  });

  socket.on("finaliza-turno", () => {
    const room = roomService.findRoomByPlayerID(socket.id);
    if(room) {
      room.gameLogic.newTurn();
    } else {
      console.log("Error ending turn");
      socket.emit("finaliza-turno-fail");
    }
  });

  socket.on("user-rearrange-deck", (gameID, isPlayerOne, deck) => {
    const room = roomService.findGameRoomByID(gameID);
    try {
      const player = room.gameLogic.players.find(player => player.isPlayerOne === isPlayerOne);
      player.cards = deck;
    } catch (err) {
      console.log("No se pudo reordenar el mazo del jugador", err);
    }
  });

  socket.on("user-reconnect", (gameID, userID, isPlayerOne) => {
    console.log(gameID, userID, isPlayerOne);
    console.log(userID, "reconnecting...");
    const gameRoom = roomService.findGameRoomByID(gameID);
    const room = roomService.findRoomByPlayerID(userID);
    try {
      if(gameRoom.getGameID() !== room.getGameID()) return socket.emit("failed-load");
      const player = gameRoom.gameLogic.players.find(player => player.isPlayerOne === isPlayerOne);
      player.id = userID;
      gameRoom.gameLogic.sendMatchDataToUser(userID);
    } catch (err){
      console.log("Error reconnecting...");
      socket.emit("failed-load");
    }
  })

  socket.on("disconnecting", (reason) => {
    console.log(`User ${socket.id} disconnecting: ${reason}`);
    roomService.leaveAllRooms(socket);
  });
});

server.listen(process.env.PORT, () => {
  console.log("Server running on port " + process.env.PORT);
})