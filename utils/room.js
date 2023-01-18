const Player = require('./player').Player;

class Room {
  constructor(id, number, capacity = 2) {
    console.log(`Sala ${number} (${id}) creada.`);
    this.number = number;
    this.id = id;
    this.players = [];
    this.capacity = capacity;
  }

  addPlayer(id, name) {
    if(!this.isFull()) {
      const player = new Player(id, name);
      this.players.push(player);
      console.log(`${name} se une a ${this.id}`);
    } else {
      console.log(this.id, + " is full");
    }
  }

  removePlayer(id) {
    for(let player of this.players) {
      if(player.id === id) {
        return this.players.splice(this.players.indexOf(player), 1)[0];
      }
    }
  }

  playerList() {
    return this.players;
  }

  getCurrentOccupation() {
    return this.players.length;
  }

  getCapacity() {
    return this.capacity;
  }

  getPlayersData() {
    return this.playerList().map(player => ({id: player.id, name: player.name}));
  }

  getUsersWriting() {
    return this.playerList().filter(player => player.estaEscribiendo).map(player => ({id: player.id, name: player.name}));
  }

  getPlayerNames() {
    return this.playerList().map(player => player.name);
  }

  getPlayerByID(id) {
    return this.players.find(player => player.id === id) || null;
  }

  getID() {
    return this.id;
  }

  getNumber() {
    return this.number;
  }

  isFull() {
    return this.players.length === this.capacity;
  }
}

class GameRoom extends Room {
  constructor(id, number) {
    super(id, number, 2);
    this.gameService = null;
    this.hasGameStarted = false;
  }

  canStartMatch() {
    return this.isFull() && !this.hasGameStarted;
  }

  startMatch() {
    console.log("Match started in room", this.id);
    this.hasGameStarted = true;
  }

  endMatch() {
    console.log("Match ended in room", this.id);
    this.hasGameEnded = false;
  }
}

module.exports = { Room, GameRoom };