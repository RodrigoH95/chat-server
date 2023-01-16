const utils = require('../utils/utils');
const Room = require("../utils/room").Room;

class RoomService {
  constructor() {
    this.rooms = [];
    this.counter = 1;
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
}

// let roomManager = new RoomService();
// console.log("Current users:", roomManager.getCurrentOccupation())
// let firstRoom = roomManager.createRoom();
// firstRoom.addPlayer(utils.generateID(), "Rodrigo");
// firstRoom.addPlayer(utils.generateID(), "Carlos");

// console.log("Current users:", roomManager.getCurrentOccupation())

// let secondRoom = roomManager.createRoom();
// secondRoom.addPlayer(utils.generateID(), "Pedro");
// console.log("Current users:", roomManager.getCurrentOccupation())
// secondRoom.addPlayer(utils.generateID(), "Francisco");


// firstRoom.playerList();
// secondRoom.playerList();

module.exports = { RoomService };