const utils = require('../utils/utils');
const Room = require("../utils/room").Room;
const GameRoom = require("../utils/room").GameRoom;

class RoomService {
  constructor(io) {
    this.rooms = [];
    this.counter = 1;
    this.io = io;
  }

  init() {
    this.rooms = [];
    this.rooms.push(new Room("lobby", "Lobby", 20));
    for(let i = 0; i < 10; i++) this.createRoom();
  }

  createRoom() {
    const roomID = utils.generateID();
    const room = new GameRoom(roomID, this.counter++, this.io);
    this.rooms.push(room);
    return room;
  }

  getRooms() {
    return this.rooms;
  }

  removeRoom(index) {
    this.rooms.splice(index, 1);
  }

  getRoomsIDs() {
    return this.rooms.map(room => room.id);
  }

  find(roomID) {
    return this.rooms.find(room => room.id === roomID) || null;
  }

  findRoomByName(roomName) {
    return this.rooms.find(room => room.getNumber() == roomName) || null;
  }

  findRoomByPlayerID(playerID) {
    return this.rooms.find(room => room.playerList().find(player => player.id === playerID));
  }

  findGameRoomByID(gameID) {
    const gameRooms = this.rooms.filter(room => room instanceof GameRoom);
    return gameRooms.find(room => room.getGameID() === gameID);
  }
  
  getPlayerListByRoomName(roomName) {
    const room = this.rooms.find(room => String(room.getNumber()) === roomName);
    if(room) return room.playerList();
  }

  removePlayerByID(playerID) {
    console.log("Removiendo al jugador", playerID);
    const room = this.findRoomByPlayerID(playerID);
    if(room) room.removePlayer(playerID);
  }

  getCapacity() {
    return this.rooms.map(room => room.capacity).reduce((total, capacity) => total + capacity, 0);
  }

  getCurrentOccupation() {
    return this.rooms.map(room => room.players.length).reduce((total, user) => total + user, 0);
  }

  updateRooms(socketID = null) {
    const data = this.getRooms().map(room => ({
      id: room.getID(),
      number: room.getNumber(),
      currentUsers: room.getCurrentOccupation(),
      capacity: room.getCapacity()
    }));
    socketID ? this.io.to(socketID).emit("room-list", data) : this.io.emit("room-list", data);
  }

  cleanRooms(usersAmount) {
    while(this.getCapacity() > usersAmount + 2) {
      const index = this.getRooms().findIndex(room => room.playerList().length === 0 && !room.hasGameStarted);
      this.removeRoom(index);
    }
    this.updateRooms();
  }

  changeRoom(socket, roomName, playerName) {
    let room = this.findRoomByName(roomName);
    if(room === null) return socket.emit("room-not-found");
    if(room === this.findRoomByPlayerID(socket.id)) return socket.emit("user-already-in-room");
    if(room.isFull()) return socket.emit("room-full")
    let roomID = room.getID();
    this.leaveAllRooms(socket, playerName);
    socket.join(roomID);
    room.addPlayer(socket.id, playerName);
    this.io.to(roomID).emit("user-join-room", socket.id, roomName, playerName);
    this.sendUsersInfo(roomID);
    if(room instanceof GameRoom && room.canStartMatch()) {
      console.log("Se puede iniciar partida...");
      this.io.to(roomID).emit("inicia-partida");
      room.startMatch();
    };
  }


  leaveAllRooms(socket) {
    for (const roomID of socket.rooms) {
      let user;
      if(socket.id !== roomID) {
        socket.leave(roomID);
        const room = this.find(roomID);
        if(room) {
          user = room.removePlayer(socket.id);
          this.sendUsersInfo(roomID);
        }
        console.log(user.name, "abandona", roomID);
        this.io.to(roomID).emit("user-leaves-room", user.name);
      };
    }
  }

  playerReady(playerID) {
    const room = this.findRoomByPlayerID(playerID);
    room.addPlayerToGame(playerID);
  }

  userNameChange(roomName, userID, newName) {
    let previousName = "";
    const room = this.getPlayerListByRoomName(roomName);
    let user = room.find(user => user.id === userID);
    if(user) {
      previousName = user.name;
      user.name = newName;
      console.log(`Usuario ${previousName} (${userID}) cambia su nombre a ${newName} (Sala: ${roomName})`);
    }
    return this.sendUsersConnected(this.rooms.find(room => String(room.getNumber()) === roomName).getID());
  }

  userIsTyping(userID, isTyping) {
    const room = this.findRoomByPlayerID(userID);
    if(room) {
      const user = room.getPlayerByID(userID);
      if(user) user.estaEscribiendo = isTyping;
      this.sendUsersTyping(room.getID());
    }
  }

  sendUsersTyping(roomID) {
    const room = this.find(roomID);
    if(room) {
      const usersWriting = room.getUsersWriting();
      this.io.to(room.getID()).emit("user-writing", usersWriting);
    }
  }

  sendUsersConnected(roomID) {
    const room = this.find(roomID);
    const data = room.getPlayersData();
    this.io.to(roomID).emit("room-users", data);
  }

  sendRoomInfo(roomID) {
    const room = this.find(roomID);
    if(room) {
      const data = {
        id: room.getID(),
        currentUsers: room.getCurrentOccupation(),
        capacity: room.getCapacity()
      }
      this.io.emit("room-updated", roomID, data);
    }
  }

  sendUsersInfo(roomID) {
    this.sendRoomInfo(roomID);
    this.sendUsersConnected(roomID);
    this.sendUsersTyping(roomID);
  }
}

module.exports = { RoomService };