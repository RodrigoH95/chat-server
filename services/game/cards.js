class CardService {
  constructor() {
    this.palos = ["copas", "oro", "espadas", "basto"];
    this.mazo = [];
    this.descarte = [];
  }

  generarMazo() {
    this.descarte = [];
    this.mazo = [];
    this.mazo.push({ valor: "", palo: "comodin" });
    this.mazo.push({ valor: "", palo: "comodin" });
    for (let i = 0; i < this.palos.length; i++) {
      let palo = this.palos[i];
      for (let j = 0; j < 12; j++) {
        this.mazo.push({ valor: j + 1, palo });
      }
    }
    return this.mazo;
  }

  getMazo() {
    return this.mazo;
  }

  getCarta() {
    return carta;
  }

  discard(card) {
    this.descarte.push(card);
  }

  drawOneCard() {
    const carta = Math.floor(Math.random() * this.mazo.length);
    // Chequear si no quedan cartas desde el servidor
    if(this.mazo.length === 0) {
      console.log("Mazo se queda sin cartas");
      this.mazo = this.descarte;
      this.descarte = [];
      return;
    }
    const valor = this.mazo[carta].valor;
    const palo = this.mazo[carta].palo;
    this.mazo.splice(carta, 1);

    return {valor, palo};
  }
}

module.exports = CardService;
