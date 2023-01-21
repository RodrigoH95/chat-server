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
    roomService.changeRoom(socket, roomName, playerName);
  });

  socket.on("user-change-name", (currentRoom, userName) => {
    roomService.userNameChange(currentRoom, socket.id, userName);
  });

  socket.on("player-ready", () => {
    console.log("Player ready");
    roomService.playerReady(socket.id);
  });

  socket.on("toma-carta", (isPlayerOne) => {
    const room = roomService.findRoomByPlayerID(socket.id);
    if(room) {
      const carta = room.gameLogic.drawOneCard();
      console.log("server.js 'toma-carta' - se enviará", carta, "a jugador");
      room.gameLogic.jugadorRecibeCarta(isPlayerOne, carta);
    } else {
      console.log(" server.js 'toma-carta' - No se encontró sala")
    }
    if (room.gameLogic.cardManager.getMazo().length === 0) {
      io.to(room.getID()).emit("no-cards");
      room.gameLogic.drawOneCard(); // si no hay cartas remezcla el descarte
    }
  });

  socket.on("descarta", (isPlayerOne, carta) => {
    const room = roomService.findRoomByPlayerID(socket.id);
    if(room) {
      room.gameLogic.playerDiscard(isPlayerOne, carta, socket);
    }
  });

  socket.on("usuario-corta", (isPlayerOne, carta) => {
    const room = roomService.findRoomByPlayerID(socket.id);
    try {
      room.gameLogic.playerEndsRound(isPlayerOne, carta);
    } catch (err) {
      console.log("usuario-corta falló");
    }
  })

  socket.on("toma-descarte", (isPlayerOne) => {
    const room = roomService.findRoomByPlayerID(socket.id);
    if(room) {
      const carta = room.gameLogic.cardManager.descarte.pop();
      io.to(room.getID()).emit("eliminar-descarte");
      room.gameLogic.jugadorRecibeCarta(isPlayerOne, carta);
    }
  });

  socket.on("finaliza-turno", () => {
    const room = roomService.findRoomByPlayerID(socket.id);
    if(room) {
      room.gameLogic.newTurn();
    }
  });

  // Necesita refactorizacion
  socket.on("finaliza-ronda", () => {
    console.log("Servidor comienza a calcular resultados");
    players.forEach(player => {
      console.log("Puntaje de", player.name, ":", Calculadora.calcular(player.cards));
    })
    const puntajes = [];
    players.forEach(player => {
      puntajes.push({
        id: player.id,
        puntaje: player.puntaje + Calculadora.calcular(player.cards),
      })
    })
    io.emit("finaliza-ronda", puntajes);
    setTimeout(() => {
      nuevaRonda();
    }, 1500);
  });

  socket.on("user-rearrange-deck", (gameID, isPlayerOne, deck) => {
    const room = roomService.findGameRoomByID(gameID);
    console.log("gameID is", gameID);
    console.log("isPlayerOne is", isPlayerOne, typeof isPlayerOne);
    try {
      const player = room.gameLogic.players.find(player => player.isPlayerOne === isPlayerOne);
      player.cards = deck;
    } catch (err) {
      console.log("No se pudo reordenar el mazo del jugador", err);
    }
  });

  socket.on("user-reconnect", (gameID, userID, isPlayerOne) => {
    const gameRoom = roomService.findGameRoomByID(gameID);
    const room = roomService.findRoomByPlayerID(userID);
    try {
      if(gameRoom.getGameID() !== room.getGameID()) return socket.emit("failed-load");
      const player = gameRoom.gameLogic.players.find(player => player.isPlayerOne === isPlayerOne);
      player.id = userID;
      gameRoom.gameLogic.sendMatchDataToUser(userID);
    } catch {
      socket.emit("failed-load");
    }
  })

  socket.on("disconnecting", (reason) => {
    console.log(`User ${socket.id} disconnected: ${reason}`);
    roomService.leaveAllRooms(socket);
  })
});

server.listen(process.env.PORT, () => {
  console.log("Server running on port " + process.env.PORT);
})