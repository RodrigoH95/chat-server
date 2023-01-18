class Player {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.cards = [];
    this.estaEscribiendo = false;
  }
}

module.exports = { Player };