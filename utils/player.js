class Player {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.cards = [];
    this.isPlayerOne = false;
    this.estaEscribiendo = false;
  }
}

module.exports = { Player };