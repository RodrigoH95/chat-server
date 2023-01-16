const Player = require('./player').Player;

class Room {
  constructor(id, capacity = 2) {
    console.log("Room", id, "created!");
    this.id = id;
    this.players = [];
    this.capacity = 2;
    this.gameService = null;
    this.hasGameStarted = false;
    this.isFull = false;
  }

  addPlayer(id, name) {
    const player = new Player(id, name);
    if(this.players.length < this.capacity) {
      this.players.push(player);
    } else {
      console.log("Room is full");
      this.isFull = true;
    }

   if(this.canStartMatch()) this.startMatch();
  }

  removePlayer(id) {
    this.players = this.players.filter(player => player.id !== id);
    if(this.players.length < this.capacity) this.isFull = false;
  }

  
  playerList() {
    console.log("Players from room:", this.id);
    console.log(this.players);
    return this.players;
  }

  canStartMatch() {
    return this.isFull && !this.hasGameStarted;
  }

  startMatch() {
    console.log("Match started in room", this.id);
    this.hasGameStarted = true;
  }

  endMatch() {
    console.log("Match ended in room", this.id);
    this.hasGameEnded = false;
  }

  getID() {
    return this.id;
  }
}

module.exports = { Room };