const Player = require('./player').Player;

class Room {
  constructor(id, number, capacity = 2) {
    console.log(`Sala ${number} (${id}) creada.`);
    this.number = number;
    this.id = "sala_" + id;
    this.players = [];
    this.capacity = capacity;
    this.gameService = null;
    this.hasGameStarted = false;
  }

  addPlayer(id, name) {
    if(!this.isFull()) {
      const player = new Player(id, name);
      this.players.push(player);
      console.log(`${name} se une a ${this.id}`);
    } else {
      console.log(this.id, + " is full");
    }
   
   if(this.canStartMatch()) this.startMatch();
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

  getPlayersData() {
    return this.playerList().map(player => ({id: player.id, name: player.name}));
  }

  getPlayerNames() {
    return this.playerList().map(player => player.name);
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

module.exports = { Room };