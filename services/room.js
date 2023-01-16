const utils = require('../utils/utils');
const Room = require("../utils/room").Room;

class RoomService {
  constructor(io) {
    this.rooms = [];
    this.counter = 1;
    this.io = io;
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

  changeRoom(socket, roomId, playerName) {
    let room = this.find(roomId);
    if(room.isFull()) return socket.emit("room-full")
    this.leaveAllRooms(socket);
    socket.join(roomId);
    room.addPlayer(socket.id, playerName);
    let roomName = room.getNumber();
    this.io.to(roomId).emit("user-join-room", socket.id, roomName, playerName);
    this.sendUsersConnected(roomId);
  }

  leaveAllRooms(socket) {
    for (const room of socket.rooms) {
      if(socket.id !== room) {
        socket.leave(room);
        const r = this.find(room);
        r.removePlayer(socket.id);
        const usersInRoom = r.getPlayerNames();
        this.sendUsersConnected(r.getID());
      };
    }
  }

  sendUsersConnected(id) {
    const room = this.find(id);
    const usersInRoom = room.getPlayerNames();
    this.io.to(id).emit("room-users", usersInRoom);
  }
}

module.exports = { RoomService };