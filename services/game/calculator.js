class CalculadoraDeResultados {
  static comodines;
  static mazoFinal;
  static resumenParcial = "";
  static resumenFinal = "";

  static calcular(mazo) {
    let puntajeFinal = 150;
    console.log("Calculadora recibe mazo:")
    mazo.forEach(card => console.log(card, ","));
    for (let i = 0; i < 2; i++) {
      this.parejas = null;
      this.escaleras = null;
      this.resumen = "";
      this.mazoFinal = [...mazo];
      this.comodines = this.mazoFinal.filter(
        (carta) => carta.palo === "comodin"
      ).length;

      if (i) {
        this.calcularParejas();
        this.calcularEscaleras();
      } else {
        this.calcularEscaleras();
        this.calcularParejas();
      }
      for(let escalera in this.escaleras) {
        this.escaleras[escalera].forEach(e => {
          // Caso particular en el que haya 2 comodines y una sola escalera larga
          // Se analiza si la escalera se puede dividir en 2 mas pequeñas
          let str = e.join(", "); // Inicial
          if(e.indexOf("*") !== -1 && e.length >= 5 && this.comodines) {
            console.log("Probable division de escalera");
            if(this.puedeDividirse(e)) {
              this.comodines--;
              this.extraerCartaDelMazo("comodin", "");
              const divisiones = this.dividirEscalera(e); // Se agregan los comodines
              divisiones.forEach(d => d.push("*"));
              str = divisiones.join(" y ");
            } else {
              console.log("La escalera no se puede dividir");
            }
          }
          // En el caso que haya quedado un comodin sobrante y se pueda agregar a un juego existente
          else if (e.indexOf("*") === -1 && this.comodines) {
            e.push("*");
            this.comodines--;
            this.extraerCartaDelMazo("comodin", "");
            str = e.join(", ");
          }
          this.resumen += `\n- Escalera de ${str} de ${escalera}`;
        });      
      }
      this.parejas.forEach((valor) => {
        if(!valor.includes("*") && this.comodines) {
          valor += "*"
          this.comodines--;
          this.extraerCartaDelMazo("comodin", "");
        };
        this.resumen += `\n- Parejas de ${valor.includes("*") ? valor.slice(0, -1) + " con comodin" : valor}.`
        this.extraerCartaDelMazo("*", valor);
      });

      let puntaje = this.calcularPuntaje();

      // Para testear
      // console.log("------------------------------");
      // console.log("Mazo final", this.mazoFinal);
      // console.log("Parejas", this.parejas);
      // console.log("Escaleras", this.escaleras);
      // console.log("Resumen parcial", this.resumen);
      // console.log("Puntaje", i + 1, ":", puntaje);
      // console.log("------------------------------");

      if (puntaje < puntajeFinal) {
        puntajeFinal = puntaje;
        this.resumenFinal = this.resumen;
      }
    }

    puntajeFinal += 25 * this.comodines;
    if(puntajeFinal === 0) puntajeFinal = -10;
    if(this.resumenFinal === "") this.resumenFinal += `\n- No hizo ninguna combinación`;
    if(this.comodines) this.resumenFinal += `\n- ${this.comodines} comodin/es sin utilizar`;
    this.resumenFinal += `\n- Puntaje: ${puntajeFinal}`;
    console.log("Resumen:", this.resumenFinal);
    return puntajeFinal;
  }

  static puedeDividirse(escalera) {
    const minimaDivision = Math.min(...escalera.join("").split("*").map(str => str.length));
    return minimaDivision >= 2;
  }

  static dividirEscalera(escalera) {
    const division = escalera.join("").split('*');
    const arr1 = division[0].split("");
    const arr2 = division[1].split("");
    return [arr1, arr2];
  }

  static calcularPuntaje() {
    return this.mazoFinal
      .map(card => Number(card.valor))
      .reduce((acc, value) => acc + value, 0);
  }

  static contarValores(valores) {
    let obj = {};
    valores.forEach((valor) => {
      if (valor in obj) {
        obj[valor] += 1;
      } else {
        obj[valor] = 1;
      }
    });

    return obj;
  }

  static ordernarPorPalos(mazo, palos) {
    let obj = {};
    palos.forEach(
      (palo) =>
        (obj[palo] = mazo
          .filter((carta) => carta.palo === palo)
          .map((carta) => carta.valor)
          .sort((a, b) => a - b))
    );
    this.separarValores(obj);

    return obj;
  }

  static separarValores(obj) {
    for (let palo in obj) {
      let result = [];
      let arr = obj[palo];
      let currentValue = arr[0];
      let itemsAmount = 0;
      let index = 0;
      for (let i = 1; i < arr.length; i++) {
        itemsAmount++;
        if (currentValue - arr[i] < -2) {
          let corte = arr.slice(index, itemsAmount);
          index = i;
          result.push(corte);
        }
        currentValue = arr[i];
      }
      let corte = arr.slice(index, arr.length);
      result.push(corte);
      obj[palo] = result;
    }
  }

  static buscarParejas(obj) {
    let result = [];
    // Se ordenan las claves de mayor a menor para armar las parejas mas altas primero
    for (let valor of Object.keys(obj).reverse()) {
      if (obj[valor] == 2 && this.comodines) {
        result.push(valor + "*");
        this.comodines--;
      } else if (obj[valor] > 2) {
        result.push(valor);
      }
    }
    result.forEach(valor => this.extraerCartaDelMazo("*", valor));
    return result;
  }

  static buscarEscaleras(obj) {
    let result = {};
    obj = this.sortObject(obj); // Ordena el objeto colocando primero los palos que tengan la mayor suma de valores
    for (let palo in obj) {
      result[palo] = [];
      const arr = obj[palo].reverse(); // Primero intenta formar combinaciones con los valores mas altos
      for (let valores of arr) {
        if (valores.length <= 1) continue;
        else if (valores.length >= 2) {
          let comodinUtilizado = false;
          let currentValue = valores[0];
          let escalera = [currentValue];
          for (let i = 1; i < valores.length; i++) {
            if (currentValue - valores[i] == -2) {
              if (this.comodines && !comodinUtilizado) {
                this.comodines--;
                comodinUtilizado = true;
                const cartaComodin = "*"; // currentValue + 1 + "*" -> mas especifico
                escalera.push(cartaComodin);
                escalera.push(valores[i]);
              }
              else {
                escalera = [valores[i]];
              }
            } else if (currentValue - valores[i] == -1) {
              escalera.push(valores[i]);
            }

            currentValue = valores[i];
          }


          if (escalera.length == 2) {
            if (this.comodines && !comodinUtilizado) {
              escalera[escalera.length - 1] === 12 ? escalera.unshift('*') : escalera.push('*');
              comodinUtilizado = true;
              this.comodines--;
            } else escalera = null;
          }
          if (escalera && escalera.length > 2) {
            result[palo].push(escalera);
            escalera.forEach((valor) => {
              this.extraerCartaDelMazo(palo, valor);
            });
          }
        }
      }
    }
    return result;
  }

  static sortObject(obj) {
    const sortable = Object.fromEntries(
      Object
        .entries(obj)
        .sort(([,a], [,b]) => this.format(b) - this.format(a))
      )
    return sortable;
  }

  static format(arr) {
    // Concatena todos los arreglos en uno solo y luego suma sus valores
    return arr.flat().reduce((acc, val) => acc + val, 0);
  }

  static extraerCartaDelMazo(palo, valor) {
    if (typeof valor === "string") {
      if (valor === "*") {
        this.extraerCartaDelMazo("comodin", "");
      } else if (valor.includes("*")) {
        this.extraerCartaDelMazo("comodin", "*");
        valor = Number(valor.slice(0, -1)); // Remueve el '*' para dejar solo el numero;
      }
    }
    if (palo === "*") {
      this.mazoFinal = this.mazoFinal.filter(
        (card) => card.valor !== Number(valor)
      );
      return;
    } else {
      this.mazoFinal = this.mazoFinal.filter(
        (card) => JSON.stringify(card) != JSON.stringify({ valor, palo })
      );
    }
  }

  static calcularEscaleras() {
    const palos = new Set(
      this.mazoFinal
        .filter((carta) => carta.palo !== "comodin")
        .map((carta) => carta.palo)
    );
    const cartasOrdenadasPorPalo = this.ordernarPorPalos(this.mazoFinal, palos);
    const escalerasObtenidas = this.buscarEscaleras(cartasOrdenadasPorPalo, this.comodines);
    this.escaleras = this.limpiarEscaleras(escalerasObtenidas);
  }

  static limpiarEscaleras(escaleras) {
    return Object.fromEntries(
      Object.entries(escaleras).filter(([key, value]) => escaleras[key].length !== 0)
    );
  }

  static calcularParejas() {
    const valores = this.mazoFinal
      .filter((carta) => typeof carta.valor === "number")
      .map((carta) => carta.valor);
    const cantidades = this.contarValores(valores);
    this.parejas = this.buscarParejas(cantidades, this.comodines);
  }
}

// let mazo = [
//   { valor: 8, palo: 'basto' } ,
//   { valor: 9, palo: 'basto' } ,
//   { valor: '', palo: 'comodin' } ,
//   { valor: 2, palo: 'basto' } ,
//   { valor: 2, palo: 'copas' } ,
//   { valor: 2, palo: 'oro' } ,
//   { valor: 8, palo: 'oro' } ,
// ];

// CalculadoraDeResultados.calcular(mazo);

module.exports = { CalculadoraDeResultados };
