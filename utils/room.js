const Player = require('./player').Player;
const GameLogic = require('../services/game/gameLogic').GameLogic;
const utils = require("./utils");

class Room {
  constructor(id, number, capacity = 2) {
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
  constructor(id, number, io) {
    super(id, number, 2);
    this.io = io;
    this.gameLogic = new GameLogic(this.io, this);
    this.hasGameStarted = false;
  }

  canStartMatch() {
    return this.isFull() && !this.hasGameStarted;
  }

  startMatch() {
    this.hasGameStarted = true;
  }

  endMatch() {
    console.log(`Partida finaliza en sala ${this.number} (${this.id})`);
    this.hasGameStarted = false;
    this.gameLogic = new GameLogic(this.io, this);
  }

  gameEndsByDisconnection() {
    console.log("Finalizando partida por desconexión...");
    this.endMatch();
    this.io.to(this.id).emit("jugador-desconectado");
  }

  addPlayerToGame(playerID) {
    const player = super.getPlayerByID(playerID);
    console.log("Agregando jugador a sala de juego", player.name, player.id);
    this.gameLogic.addPlayer(player);
  }

  getGameID() {
    return this.gameLogic.gameID;
  }
}

module.exports = { Room, GameRoom };