class CalculadoraDeResultados {
  static comodines;
  static mazoFinal;
  static resumenParcial = "";
  static resumenFinal = "";

  static calcular(mazo) {
    let comodinesFinal = 0;
    let puntajeFinal = 150;
    console.log("Calculadora recibe mazo:")
    mazo.forEach(card => console.log(card, ","));
    let cartasRestantes = [];
    let juegos = {
      parejas: null,
      escaleras: null,
    }
    for (let i = 0; i < 2; i++) {
      this.parejas = null;
      this.escaleras = null;
      this.resumen = "";
      this.mazoFinal = [...mazo];
      this.comodines = this.mazoFinal.filter((carta) => carta.palo === "comodin").length;

      if (i) {
        this.calcularParejas();
        this.calcularEscaleras();
      } else {
        this.calcularEscaleras();
        this.calcularParejas();
      }

      this.puntaje = this.calcularPuntaje(this.mazoFinal);

      this.resumirEscaleras();
      this.resumirParejas();

      // Para testear
      // console.log("------------------------------");
      // console.log("Mazo final", this.mazoFinal);
      // console.log("Parejas", this.parejas);
      // console.log("Escaleras", this.escaleras);
      // console.log("Resumen parcial", this.resumen);
      // console.log("Puntaje", i + 1, ":", puntaje);
      // console.log("------------------------------");

      if (this.puntaje < puntajeFinal) {
        comodinesFinal = this.comodines;
        puntajeFinal = this.puntaje;
        this.resumenFinal = this.resumen;
        cartasRestantes = this.mazoFinal;
        juegos.parejas = this.parejas;
        juegos.escaleras = this.escaleras;
      }
    }

    puntajeFinal += 25 * comodinesFinal;
    if(puntajeFinal === 0) puntajeFinal = -10;
    if(this.resumenFinal === "") this.resumenFinal += `\n- No hizo ninguna combinación`;
    if(comodinesFinal) this.resumenFinal += `\n- ${comodinesFinal} comodin/es sin utilizar`;
    // this.resumenFinal += `\n- Puntaje: ${puntajeFinal}`;

    const cartasUtilizadas = () => {
      console.log("Cartas restantes:", cartasRestantes);
      return mazo.filter(card => JSON.stringify(cartasRestantes).indexOf(JSON.stringify(card)) === - 1);
    }

    const resultado = {
      puntaje: puntajeFinal,
      resumen: this.resumenFinal,
      cartasUtilizadas: cartasUtilizadas(),
      mazoFinal: cartasRestantes,
      juegos: juegos,
    }
    return resultado;
  }

  static calcularMazoCombinado(mazoJugador, cartasUtilizadasOponente, juegos) {
    // Oponente es el jugador que cortó, jugador es quien intenta sumar sus cartas en el juego del oponente
    const escaleras = {...juegos.escaleras};
    const parejas = [...juegos.parejas];
    let puntajeFinal = 150;
    let mazoFinal = [];
    let cedidasFinal = [];
    let comodinesFinal = 0;
    let resumenFinal = null;
    for(let i = 0; i < 1; i++) {
      const cartasCedidas = [];
      const resumen = [];
      // Se suman comodines del jugador y del oponente. Si luego de los calculos sobran comodines es porque los del jugador no se pudieron ceder
      // Probablemente esto de problemas si el comodin estaba en una pareja y ahora se agrega a una escalera o viceversa
      this.comodines = mazoJugador.filter(carta => carta.valor === "").length + cartasUtilizadasOponente.filter(carta => carta.valor === "").length;
      let mazo = [...mazoJugador];
      if(i) {
        if(parejas) this.cederParejas(parejas, mazo, cartasCedidas, this.comodines, resumen);
        if(escaleras) this.cederEscaleras(escaleras, mazo, cartasCedidas, this.comodines, resumen);
      } else {
        if(escaleras) this.cederEscaleras(escaleras, mazo, cartasCedidas, this.comodines, resumen);
        if(parejas) this.cederParejas(parejas, mazo, cartasCedidas, this.comodines, resumen);
      }

      mazo = mazo.filter(carta => JSON.stringify(cartasCedidas).indexOf(JSON.stringify(carta)) === - 1);

      let puntaje = this.calcularPuntaje(mazo);
      if(puntaje < puntajeFinal) {
        puntajeFinal = puntaje;
        mazoFinal = mazo;
        cedidasFinal = cartasCedidas;
        comodinesFinal = this.comodines;
        resumenFinal = resumen;
      }
    }

    // Comprobación de comodines cedidos
    console.log("Comodines al final:", comodinesFinal);
    const comodinesCedidos = Math.max(0, mazoJugador.filter(carta => carta.valor === "").length - comodinesFinal);
    if(comodinesCedidos) {
      resumenFinal.push(`- ${comodinesCedidos} comodin/es`);
      for(let i = 0; i < comodinesCedidos; i++) {
        const carta = mazoFinal.splice(mazoFinal.findIndex(carta => carta.valor === ""), 1);
        cedidasFinal.push(carta);
      }
    } else {
      console.log("No se han cedido comodines");
    }

    const result = {
      puntaje: puntajeFinal,
      cartasCedidas: cedidasFinal,
      resumen: resumenFinal.join("\n"),
    }
    
    return result;
  }

  static cederParejas(parejas, mazoJugador, cartasCedidas, comodines, resumen) {
    console.log("Intentando agregar parejas");
      parejas.forEach(valor =>  {
        if(valor.includes("*")) {
          valor = valor.substring(0, valor.length - 1);
        }
        console.log("Se buscan en el mazo del jugador cartas de valor", valor);
        // Se quitan cartas del mismo valor del mazo
        mazoJugador.filter(carta => carta.valor === Number(valor)).forEach(carta => {
          if(JSON.stringify(cartasCedidas).indexOf(JSON.stringify(carta)) === -1) {
            resumen.push(`- ${carta.valor} de ${carta.palo}`);
            cartasCedidas.push(carta);
          }
        });
      });
  }

  static cederEscaleras(escaleras, mazoJugador, cartasCedidas, comodines, resumen) {
    for(const palo in escaleras) {
      const valores = mazoJugador.filter(carta => carta.palo === palo).map(carta => carta.valor);
      if(valores.length === 0) continue;
      console.log("Intentando sumar cartas a las escaleras del oponente");
      let newEscalera = [...valores];
      this.comodines = comodines;
      for(const escalera of escaleras[palo]) newEscalera = newEscalera.concat(escalera);
      // newEscalera.forEach(valor => {if(valor === "*") this.comodines++}); //Ya se suman comodines al comienzo
      newEscalera = newEscalera.filter(valor => valor !== "*").sort((a, b) => a - b);
      escaleras[palo] = this.separarValoresPorPalo(newEscalera);
      let escalerasObtenidas = {[palo]: []};
      this.calcularEscalerasPorPalo(palo, escaleras[palo], escalerasObtenidas);
      escalerasObtenidas[palo].forEach(escalera => {
        escalera.forEach(valor => {
          if(mazoJugador.findIndex(carta => JSON.stringify(carta) === JSON.stringify({valor, palo})) !== -1) {
          resumen.push(`- ${valor} de ${palo}`);
          cartasCedidas.push({valor, palo});
        }
        });
      });
    }
  }

  static dividirEscalera(escalera) {
    let arr1 = [];
    let arr2 = [];
    const index = escalera.indexOf("*");
    const half = escalera.length / 2;
    let newIndex = Math.ceil(half);
    if(index < half) {
      arr1 = escalera.slice(0, newIndex);
      arr2 = escalera.slice(newIndex);
    } else {
      arr1 = escalera.slice(newIndex);
      arr2 = escalera.slice(0, newIndex);
    }

    return [arr1, arr2];
  }

  static calcularPuntaje(mazo) {
    return mazo
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
    // Divide los valores del mismo palo en grupos de posibles escaleras
    for (let palo in obj) {
      let arr = obj[palo];
      const result = this.separarValoresPorPalo(arr);
      obj[palo] = result;
    }
  }

  static separarValoresPorPalo(arr) {
    let result = [];
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
      return result;
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
      const arr = obj[palo]; // Primero intenta formar combinaciones con los valores mas altos
      this.calcularEscalerasPorPalo(palo, arr, result);
    }
    return result;
  }

  static calcularEscalerasPorPalo(palo, arr, result) {
    for (let valores of arr.reverse()) {
      if (valores.length <= 1) continue;
      else if (valores.length >= 2) {
        valores.reverse(); // Ordena los valores de mayor a menor
        let comodinUtilizado = false;
        let currentValue = valores[0];
        let escalera = [currentValue];
        for (let i = 1; i < valores.length; i++) {
          // Si hay 2 de diferencia, los valores necesitan un comodin entre medio
          if (currentValue - valores[i] == 2) {
            if (this.comodines) {
              if(!comodinUtilizado) {
                this.comodines--;
                comodinUtilizado = true;
                const cartaComodin = "*"; // currentValue + 1 + "*" -> mas especifico
                escalera.push(cartaComodin);
                escalera.push(valores[i]);
              } else {
                if(this.chequearEscaleraValida(escalera.slice(0, -1), result, palo, true)) {
                  // Si ingresa acá, se agregó la escalera sin el ultimo valor
                  this.comodines--;
                  const lastValue = escalera.pop();
                  escalera = [lastValue, '*', valores[i]];
                }
              }
            }
            else {
             // En este punto puede haber una escalera válida del mismo palo que ya utilizó un comodin
             // Se debe verificar que la escalera es válida y guardarla antes de seguir con los siguientes valores
              this.chequearEscaleraValida(escalera, result, palo, comodinUtilizado);
              escalera = [valores[i]];
              comodinUtilizado = !comodinUtilizado;
            }
          } else if (currentValue - valores[i] == 1) {
            // Si la diferencia es 1 estan en secuencia y se agrega a la escalera
            escalera.push(valores[i]);
          }

          currentValue = valores[i];
        }


        this.chequearEscaleraValida(escalera, result, palo, comodinUtilizado);
      }
    }
  }

  static resumirEscaleras() {
    for(let escalera in this.escaleras) {
      this.escaleras[escalera].forEach(e => {
        // Caso particular en el que haya 2 comodines y una sola escalera larga
        // Se analiza si la escalera se puede dividir en 2 mas pequeñas
        let str = e.join(", "); // Inicial
        if(e.length === 7) {
          if(e.indexOf('*') === -1) {
            console.log("CHINCHON");
            this.puntaje = -100;
          } else {
            console.log("CHINCHON con comodin");
            this.puntaje = -25;
          }
        }
        if((e.indexOf('*') === - 1) && this.comodines) {
          if(e.length >= 5) {
            this.comodines--;
            this.extraerCartaDelMazo("comodin", "");
            const divisiones = this.dividirEscalera(e); // Se agregan los comodines
            const division2 = divisiones[1];
            division2[division2.length - 1] === 12 ? division2.unshift("*") : division2.push("*");
            str = `${divisiones[0].join(", ")} y ${divisiones[1].join(", ")}`;
          } else {
            // En el caso que haya quedado un comodin sobrante y se pueda agregar a un juego existente
            e[e.length -1] === 12 ? e.unshift("*") : e.push("*");
            this.comodines--;
            this.extraerCartaDelMazo("comodin", "");
            str = e.join(", ");
          }
        }
        this.resumen += `\n- Escalera de ${str} de ${escalera}`;
      });      
    }
  }

  static resumirParejas() {
    this.parejas.forEach((valor) => {
      if(!valor.includes("*") && this.comodines) {
        valor += "*"
        this.comodines--;
        this.extraerCartaDelMazo("comodin", "");
      };
      this.resumen += `\n- Parejas de ${valor.includes("*") ? valor.slice(0, -1) + " con comodin" : valor}.`
      this.extraerCartaDelMazo("*", valor);
    });
  }

  static chequearEscaleraValida(escalera, result, palo, comodinUtilizado) {
    if (escalera.length == 2) {
      if (this.comodines && !comodinUtilizado) {
        escalera[escalera.length - 1] === 12 ? escalera.unshift('*') : escalera.push('*');
        comodinUtilizado = true;
        this.comodines--;
      } else return false;
    }
    if (escalera && escalera.length > 2) {
      result[palo].push(escalera.reverse()); // Reverse reordena la escalera
      escalera.forEach((valor) => {
        this.extraerCartaDelMazo(palo, valor);
      });
      return true;
    } else return false;
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
    const palos = this.obtenerPalos(this.mazoFinal);
    const cartasOrdenadasPorPalo = this.ordernarPorPalos(this.mazoFinal, palos);
    const escalerasObtenidas = this.buscarEscaleras(cartasOrdenadasPorPalo, this.comodines);
    this.escaleras = this.limpiarEscaleras(escalerasObtenidas);
  }

  static obtenerPalos(mazo) {
    return new Set(
      mazo
        .filter((carta) => carta.palo !== "comodin")
        .map((carta) => carta.palo)
    );
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

module.exports = { CalculadoraDeResultados };
