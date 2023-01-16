class Player {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.cards = [];
    this.greeting();
  }

  greeting() {
    console.log(this.name, "says hi!");
  }
}

module.exports = { Player };