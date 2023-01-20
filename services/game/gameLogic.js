const CardService = require("./cards");
const utils = require("../../utils/utils");
const Calculadora = require('./calculator').CalculadoraDeResultados;

class GameLogic {
  constructor(io, room) {
    this.io = io;
    this.room = room;
    this.roomID = room.getID();
    this.gameID = null;
    this.players = [];
    this.cardsPerPlayer = 7;
    this.turn = true; // true para jugador 1, false para jugador 2
    this.cardManager = new CardService(this.io, this.players);
  }


  init() {
    this.gameID = utils.generateID(12);
    console.log(`Inicia nueva partida (${this.gameID})`);
    // Determinar quien es jugador 1 y 2
    this.players[Math.floor(Math.random() * this.players.length)].isPlayerOne = true;
    this.sendMatchData();
    this.iniciarPartida();
  }

  iniciarPartida() {
    this.players.forEach(player => player.cards = []);
    this.cardManager.generarMazo();
    this.repartirCartas();
  }

  addPlayer(player) {
    if(!this.players.find(p => p.id === player.id) && this.players.length < 2) {
      console.log("Se agrega jugador al juego");
      this.players.push(player);
      this.checkForGameStart();
    } else {
      console.log("No se pudo agregar al jugador");
      console.log(this.players);
    }
  }

  checkForGameStart() {
    if(this.players.length === 2) this.init();
  }

  repartirCartas() {
    console.log("Inicia reparto de cartas:");
    let cards = this.cardsPerPlayer * this.players.length;
    let receiver = this.players.findIndex(player => player.isPlayerOne);
    const interval = setInterval(() => {
      const drawnCard = this.cardManager.drawOneCard();
      this.agregarCartaAlJugador(receiver, drawnCard);
      const receptor = (cards % 2); // 0 para jugador 1, 1 para jugador 2
      this.sendCard(receptor, drawnCard);
      receiver = Number(!receiver);
      cards--;
      if(cards === 0) {
        clearInterval(interval);
        const firstCard = this.cardManager.drawOneCard();
        this.cardManager.discard(firstCard);
        console.log("Finaliza reparto");
        this.sendDiscard(firstCard);
        this.sendTurn();
      }
    }, 300);
  }

  drawOneCard() {
    const card = this.cardManager.drawOneCard();
    return card;
  }

  playerDiscard(isPlayerOne, carta, socket) {
    const player = this.players.find(player => player.isPlayerOne === isPlayerOne);
    if(player) {
      console.log("Carta a descartar", carta);
      this.cardManager.discard(carta);
      player.cards = player.cards.filter(card => JSON.stringify(card) !== JSON.stringify(carta));
      socket.broadcast.to(this.room.getID()).emit("descarte", carta);
    } else {
      console.log("gameLogic.js 76 - No se encontró jugador intentando descartar carta");
    }
  }

  playerEndsRound(isPlayerOne, card, socket) {
    const player = this.players.find(player => player.isPlayerOne === isPlayerOne);
    const opponent = this.players.find(player => player.isPlayerOne !== isPlayerOne);
    try {
      console.log(player.name, "corta");
      player.cards = player.cards.filter(c => JSON.stringify(c) !== JSON.stringify(card));
      this.calculateScores(player);
      this.calculateScores(opponent);
      console.log("Puntajes", this.players.map(player => player.score));
      this.roundEnd(card);
    } catch(err) {
      console.log("gameLogic.js playerEndsRound - Error finalizando ronda (no se encontró jugador");
    }
  }

  calculateScores(player) {
    player.score = Math.max(0, player.score + Calculadora.calcular(player.cards));
    
  }

  agregarCartaAlJugador(receiver, drawnCard) {
    // receiver debe ser el indice del jugador que recibe la carta
    const player = this.players[receiver];
    player.cards.push(drawnCard);
  }

  jugadorRecibeCarta(isPlayerOne, card) {
    const index = this.players.findIndex(player => player.isPlayerOne === isPlayerOne);
    const receiver = !isPlayerOne // 0 para jugador 1, 1 para jugador 2
    console.log("recibe jugador", receiver + 1)
    this.agregarCartaAlJugador(index, card);
    this.sendCard(receiver, card);
  }

  roundEnd(card) {
    const data = this.players.map(player => ({name: player.name, isPlayerOne: player.isPlayerOne, cards: player.cards, score: player.score }))
    this.io.to(this.roomID).emit("round-end", card, data);
    this.turn = !this.turn;
    setTimeout(() => {
      this.io.to(this.roomID).emit("round-start");
      this.iniciarPartida();
    }, 5000)
  }

  sendCard(receptor, card) {
    // receptor se basa en si el jugador es el jugador 1 o el 2
    this.io.to(this.roomID).emit("recibe-carta", { receptor, card });
    console.log("Jugador", Number(receptor) + 1, "recibe", card);
  }

  sendDiscard(card) {
    this.io.to(this.roomID).emit("descarte", card);
    console.log("gameLogic.js 98 - Se envia descarte", card);
  };

  newTurn() {
    console.log(this.players.map(player => [player.name, player.cards.length]))
    this.turn = !this.turn;
    this.sendTurn();
  }
  
  sendTurn() {
    this.io.to(this.roomID).emit("nuevo-turno", this.turn);
    console.log("Se envia turno", this.turn, "sala", this.roomID);
  }

  sendMatchData() {
    const data = {
      gameID: this.gameID,
      playersData: this.players.map(player => ({ id: player.id, name: player.name, isPlayerOne: player.isPlayerOne }))
    }
    console.log("gameLogic 118 - Se envia data de nueva partida", data);
    this.io.to(this.roomID).emit("nueva-partida", data);
    console.log("Nueva partida en sala ", this.room.getNumber(), data.playersData);
  }

  sendMatchDataToUser(userID) {
    const player = this.players.find(player => player.id === userID);
    const opponent = this.players.find(player => player.id !== userID);
    const data = {
      mazo: player.cards,
      mazoOponente: opponent.cards,
      descarte: this.cardManager.descarte,
      turno: this.turn,
    }
    console.log("Sending data to user", data);
    this.io.to(userID).emit("load-match", data);
  }
}

module.exports = { GameLogic };