const utils = require('../utils/utils');
const Room = require("../utils/room").Room;

class RoomService {
  constructor(io) {
    this.rooms = [];
    this.counter = 1;
    this.io = io;
    this.lobby = [];
  }

  createRoom() {
    const roomID = utils.generateID();
    const room = new Room(roomID, this.counter++);
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
  
  getPlayerListByRoomName(roomName) {
    if(roomName === "lobby") return this.lobby;
    const room = this.rooms.find(room => room.getNumber() === Number(roomName));
    return room.playerList();
  }

  removePlayerByID(playerID) {
    let room = this.rooms.find(room => room.playerList().find(player => player.id === playerID));
    if(room) room.removePlayer(playerID);
  }

  getCapacity() {
    return this.rooms.map(room => room.capacity).reduce((total, capacity) => total + capacity, 0);
  }

  getCurrentOccupation() {
    return this.rooms.map(room => room.players.length).reduce((total, user) => total + user, 0);
  }

  updateRooms() {
    const data = this.getRooms().map(room => ({id: room.getID(), number: room.getNumber()}));
    this.io.emit("room-list", data);
  }

  cleanRooms(usersAmount) {
    while(this.getCapacity() > usersAmount + 2) {
      const index = this.getRooms().findIndex(room => room.playerList().length === 0 && !room.hasGameStarted);
      this.removeRoom(index);
    }
    this.updateRooms();
  }

  changeRoom(socket, roomID, playerName) {
    if(roomID === "lobby") return this.joinLobby(socket, playerName);
    let room = this.find(roomID);
    if(room === null) return socket.emit("room-not-found");
    if(room.isFull()) return socket.emit("room-full")
    this.leaveAllRooms(socket, playerName);
    socket.join(roomID);
    room.addPlayer(socket.id, playerName);
    let roomName = room.getNumber();
    this.io.to(roomID).emit("user-join-room", socket.id, roomName, playerName);
    this.sendUsersConnected(roomID);
  }

  joinLobby(socket, userName) {
    console.log(userName, "is joining Lobby");
    this.lobby.push({id: socket.id, name: userName});
    this.leaveAllRooms(socket, userName);
    socket.join("lobby");
    this.io.to("lobby").emit("user-join-room", socket.id, "lobby", userName);
    this.sendUsersInLobby();
  }

  leaveAllRooms(socket) {
    for (const roomID of socket.rooms) {
      let user;
      if(socket.id !== roomID) {
        socket.leave(roomID);
        const room = this.find(roomID);
        if(room) {
          user = room.removePlayer(socket.id);
          this.sendUsersConnected(room.getID());
        }
        if(roomID === "lobby") {
          user = this.removeUserFromLobby(socket.id);
          this.sendUsersInLobby();
        }
        console.log(user.name, "abandona", roomID);
        this.io.to(roomID).emit("user-leaves-room", user.name);
      };
    }
  }

  userNameChange(roomName, userID, newName) {
    let previousName = "";
    let isLobby = roomName === "lobby";
    let user = this.getPlayerListByRoomName(roomName).find(user => user.id === userID);
    previousName = user.name;
    user.name = newName;
    console.log(`Usuario ${previousName} (${userID}) cambia su nombre a ${newName} (Sala: ${roomName})`)
    return isLobby ? this.sendUsersInLobby() : this.sendUsersConnected(this.rooms.find(room => room.getNumber() === Number(roomName)).getID());
  }

  getUsersInLobby() {
    return this.lobby;
  }

  sendUsersInLobby() {
    this.io.to("lobby").emit("room-users", this.getUsersInLobby());
  }

  removeUserFromLobby(userID) {
    return this.lobby.splice(this.lobby.findIndex(user => user.id === userID), 1)[0];
  }

  sendUsersConnected(id) {
    const room = this.find(id);
    const data = room.getPlayersData();
    this.io.to(id).emit("room-users", data);
  }
}

module.exports = { RoomService };