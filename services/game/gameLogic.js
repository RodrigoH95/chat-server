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
    this.cardManager = new CardService();
    this.pointsToLose = 100;
    this.gameEnd = false;
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
    this.players.forEach(player => {
      player.cards = [];
      player.score = 0;
    });
    this.cardManager.generarMazo();
    this.repartirCartas();
  }

  newRound() {
    this.players.forEach(player => {
      player.cards = [];
    });
    this.io.to(this.roomID).emit("round-start");
    this.cardManager.generarMazo();
    this.repartirCartas();
  }

  addPlayer(player) {
    if(!this.players.find(p => p.id === player.id) && this.players.length < 2) {
      console.log("Se agrega", player.name, "al juego");
      this.players.push(player);
      this.checkForGameStart();
    } else {
      console.log("No se pudo agregar al jugador");
    }
  }

  checkForGameStart() {
    if(this.players.length === 2) this.init();
  }

  repartirCartas() {
    console.log("Inicia reparto de cartas");
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
      this.cardManager.discard(carta);
      player.cards = player.cards.filter(card => JSON.stringify(card) !== JSON.stringify(carta));
      this.io.to(this.room.getID()).emit("descarte", carta, isPlayerOne);
    } else {
      console.log("gameLogic.js 76 - No se encontr?? jugador intentando descartar carta");
    }
  }

  playerEndsRound(isPlayerOne, card) {
    const player = this.players.find(player => player.isPlayerOne === isPlayerOne);
    const opponent = this.players.find(player => player.isPlayerOne !== isPlayerOne);
    try {
      console.log(`${player.name} corta con ${card.valor} de ${card.palo}`);
      player.cards = player.cards.filter(c => JSON.stringify(c) !== JSON.stringify(card));
      const calculo = this.calculateScores(player, opponent);
      const resumen = calculo.resumenFinal
      const cartasCedidas = {
        isPlayerOne: opponent.isPlayerOne,
        cartas: calculo.cartasCedidas,
      };
      const scores = this.players.map(player => player.score);
      if(Math.max(...scores) >= this.pointsToLose) this.gameEnd = true;
      this.roundEnd(card, resumen, cartasCedidas);
    } catch(err) {
      console.log("gameLogic.js playerEndsRound - Error finalizando ronda", err);
    }
  }

  calculateScores(player, opponent) {
    let resumenFinal = "";
    const playerResult = Calculadora.calcular(player.cards);
    if(playerResult.puntaje === -100) {
      // hacer 100 el puntaje del oponente
      opponent.score = 100;
      return resumenFinal += `${player.name} gana por chinch??n!}`;
    }
    resumenFinal += `${player.name}:` + playerResult.resumen;
    const opponentResult = Calculadora.calcular(opponent.cards);
    // Jugador no hizo -10 -> Se permite al oponente jugar sus cartas con las de jugador
    if(playerResult.mazoFinal.length > 0) {
      console.log(opponent.name, "intenta agregar cartas al juego de", player.name);
      // oponente puede agregar sus cartas al juego del jugador
      const result = Calculadora.calcularMazoCombinado(opponentResult.mazoFinal, playerResult.cartasUtilizadas, playerResult.juegos);
      opponentResult.puntaje = result.puntaje;
      opponentResult.resumen += ('\nCartas cedidas:\n' + result.resumen);
      opponentResult.cartasCedidas = result.cartasCedidas;
    } else {
      resumenFinal += `\n${player.name} combin?? todas sus cartas por lo que ${opponent.name} no puede descontar puntos!`;
    }
    resumenFinal += `\n${opponent.name}:` + opponentResult.resumen;
    resumenFinal += `\nPuntajes de la ronda: \n${player.name}: ${playerResult.puntaje}\n${opponent.name}: ${opponentResult.puntaje}`;
    player.score = Math.max(0, player.score + playerResult.puntaje);
    opponent.score = Math.max(0, opponent.score + opponentResult.puntaje);
    console.log(resumenFinal);
    return { resumenFinal, cartasCedidas: opponentResult.cartasCedidas};
  }

  agregarCartaAlJugador(receiver, drawnCard) {
    // receiver debe ser el indice del jugador que recibe la carta
    const player = this.players[receiver];
    player.cards.push(drawnCard);
  }

  jugadorRecibeCarta(isPlayerOne, card) {
    const index = this.players.findIndex(player => player.isPlayerOne === isPlayerOne);
    const receiver = !isPlayerOne // 0 para jugador 1, 1 para jugador 2
    if(this.players[index].cards.length < 8) {
      this.agregarCartaAlJugador(index, card);
      this.sendCard(receiver, card);
    }
  }

  roundEnd(card, resumen, cartasCedidas) {
    console.log("Cartas cedidas:", cartasCedidas);
    const data = this.players.map(player => ({ name: player.name, isPlayerOne: player.isPlayerOne, cards: player.cards, score: player.score }))
    if(this.gameEnd) {
      const winner = this.players.find(player => player.score === Math.min(...this.players.map(player => player.score)));
      const winnerIsPlayerOne = winner.isPlayerOne;
      this.io.to(this.roomID).emit("game-end", card, data, winnerIsPlayerOne);
      return setTimeout(() => {
        this.room.endMatch();
        console.log(this.gameID, " - Sala de juego reiniciada...");
      }, 5000);
    }

    this.io.to(this.roomID).emit("round-end", card, data, resumen);
    if(cartasCedidas.cartas && cartasCedidas.cartas.length > 0) {
      setTimeout(() => {
        this.io.to(this.roomID).emit("jugador-cede-cartas", cartasCedidas, this.players.map(player => ({isPlayerOne: player.isPlayerOne, cartas: player.cards})));
      }, 2500);
    }
    this.turn = !this.turn;
    setTimeout(() => this.newRound(), 9000);
  }

  sendCard(receptor, card) {
    // receptor se basa en si el jugador es el jugador 1 o el 2
    this.io.to(this.roomID).emit("recibe-carta", { receptor, card });
  }

  sendDiscard(card) {
    this.io.to(this.roomID).emit("descarte", card);
  };

  newTurn() {
    this.turn = !this.turn;
    this.sendTurn();
  }
  
  sendTurn() {
    this.io.to(this.roomID).emit("nuevo-turno", this.turn);
  }

  sendMatchData() {
    const data = {
      gameID: this.gameID,
      playersData: this.players.map(player => ({ id: player.id, name: player.name, isPlayerOne: player.isPlayerOne }))
    }
    this.io.to(this.roomID).emit("nueva-partida", data);
  }

  sendMatchDataToUser(userID) {
    const player = this.players.find(player => player.id === userID);
    const opponent = this.players.find(player => player.id !== userID);
    const data = {
      mazo: player.cards,
      mazoOponente: opponent.cards,
      descarte: this.cardManager.descarte,
      turno: this.turn,
      playerScore: player.score,
      opponentScore: opponent.score,
    }
    this.io.to(userID).emit("load-match", data);
  }
}
module.exports = { GameLogic };