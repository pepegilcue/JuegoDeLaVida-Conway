/* ============================================================
   JUEGO DE LA VIDA - script.js

   ÍNDICE
   1. Datos (patrones y reglas)
   2. Elementos de la página
   3. Variables del juego
   4. Crear y ajustar la cuadrícula
   5. Lógica del juego (siguiente generación)
   6. Dibujar en el lienzo
   7. Estadísticas y gráfica
   8. Editar celdas (ratón, patrones, aleatorio, limpiar)
   9. Animación (iniciar y pausar)
   10. Panel de reglas y patrones
   11. Eventos (botones, teclado...)
   12. Arranque
   ============================================================ */


/* ============================================================
   1. DATOS
   ============================================================ */

// Patrones: la letra O es una célula viva y el punto es una muerta
const PATRONES = {
  'Planeador':   ['.O.', '..O', 'OOO'],
  'Nave ligera': ['.O..O', 'O....', 'O...O', 'OOOO.'],
  'Parpadeador': ['OOO'],
  'Sapo':        ['.OOO', 'OOO.'],
  'Baliza':      ['OO..', 'OO..', '..OO', '..OO'],
  'Púlsar': [
    '..OOO...OOO..',
    '.............',
    'O....O.O....O',
    'O....O.O....O',
    'O....O.O....O',
    '..OOO...OOO..',
    '.............',
    '..OOO...OOO..',
    'O....O.O....O',
    'O....O.O....O',
    'O....O.O....O',
    '.............',
    '..OOO...OOO..'
  ],
  'Pentominó R': ['.OO', 'OO.', '.O.'],
  'Bellota':     ['.O.....', '...O...', 'OO..OOO'],
  'Diehard':     ['......O.', 'OO......', '.O...OOO'],
  'Cañón de Gosper': [
    '........................O...........',
    '......................O.O...........',
    '............OO......OO............OO',
    '...........O...O....OO............OO',
    'OO........O.....O...OO..............',
    'OO........O...O.OO....O.O...........',
    '..........O.....O.......O...........',
    '...........O...O....................',
    '............OO......................'
  ]
};

// Reglas: [números de vecinos con los que NACE, números con los que SOBREVIVE]
const REGLAS = {
  'Conway clásico (B3/S23)':         [[3], [2, 3]],
  'HighLife (B36/S23)':              [[3, 6], [2, 3]],
  'Día y noche (B3678/S34678)':      [[3, 6, 7, 8], [3, 4, 6, 7, 8]],
  'Laberinto (B3/S12345)':           [[3], [1, 2, 3, 4, 5]],
  'Semillas (B2/S)':                 [[2], []],
  'Replicador (B1357/S1357)':        [[1, 3, 5, 7], [1, 3, 5, 7]],
  'Vida sin muerte (B3/S012345678)': [[3], [0, 1, 2, 3, 4, 5, 6, 7, 8]]
};


/* ============================================================
   2. ELEMENTOS DE LA PÁGINA
   Guardamos cada elemento del HTML en una variable
   ============================================================ */

// Lienzo principal
const lienzo = document.getElementById('lienzo');
const ctx = lienzo.getContext('2d');          // "pincel" para dibujar
const contenedor = document.getElementById('wrap');

// Gráfica de población
const grafica = document.getElementById('spark');
const ctxGrafica = grafica.getContext('2d');

// Textos de estadísticas
const textoGen = document.getElementById('sGen');
const textoPob = document.getElementById('sPob');
const textoDen = document.getElementById('sDen');
const textoPico = document.getElementById('sPico');
const textoEstado = document.getElementById('estado');

// Botones
const botonPlay = document.getElementById('bPlay');
const botonPaso = document.getElementById('bPaso');
const botonAzar = document.getElementById('bAzar');
const botonLimpiar = document.getElementById('bLimpiar');

// Controles del panel
const barraVelocidad = document.getElementById('velocidad');
const barraDensidad = document.getElementById('densidad');
const textoVelocidad = document.getElementById('vVel');
const textoDensidad = document.getElementById('vDen');
const selectTamano = document.getElementById('tamano');
const selectPreset = document.getElementById('preset');
const selectColor = document.getElementById('modoColor');
const checkEstela = document.getElementById('kRastro');
const checkRejilla = document.getElementById('kRejilla');
const checkBordes = document.getElementById('kEnvolver');

// Zonas donde se crean botones con JavaScript
const zonaChipsNace = document.getElementById('chipsB');
const zonaChipsSobrevive = document.getElementById('chipsS');
const zonaPatrones = document.getElementById('patrones');
const textoRegla = document.getElementById('descRegla');


/* ============================================================
   3. VARIABLES DEL JUEGO
   ============================================================ */

let tamanoCelda = 12;        // tamaño de cada celda en píxeles
let columnas = 0;            // número de columnas
let filas = 0;               // número de filas

let celdas = null;           // lista con 1 (viva) o 0 (muerta) por cada celda
let edades = null;           // cuántas generaciones lleva viva cada celda
let estelas = null;          // brillo de la estela de las celdas que acaban de morir

let generacion = 0;          // contador de generaciones
let picoPoblacion = 0;       // máximo de células vivas alcanzado
let historial = [];          // población de las últimas generaciones (para la gráfica)

let corriendo = false;       // true si la animación está en marcha
let temporizador = null;     // guarda el setInterval de la animación
let estable = false;         // true si la última generación no cambió nada

let patronActivo = null;     // nombre del patrón elegido (null = pincel libre)
let dibujando = false;       // true mientras mantienes pulsado el ratón
let valorPincel = 1;         // 1 = pintar celdas, 0 = borrarlas

// Reglas activas: nacen[3] = true significa "nace con 3 vecinos"
let nacen = [false, false, false, false, false, false, false, false, false];
let sobreviven = [false, false, false, false, false, false, false, false, false];


/* ============================================================
   4. CREAR Y AJUSTAR LA CUADRÍCULA
   ============================================================ */

// Crea una lista con "cantidad" elementos, todos con el mismo valor
function crearLista(cantidad, valorInicial) {
  const lista = [];
  for (let i = 0; i < cantidad; i++) {
    lista.push(valorInicial);
  }
  return lista;
}

// Calcula cuántas filas y columnas caben según el ancho de la pantalla
function ajustarCuadricula() {
  // Columnas: entre 20 y 160
  let nuevasColumnas = Math.floor(contenedor.clientWidth / tamanoCelda - 1);
  if (nuevasColumnas < 20) {
    nuevasColumnas = 20;
  }
  if (nuevasColumnas > 160) {
    nuevasColumnas = 160;
  }

  // Filas: un 60% de las columnas (mínimo 14)
  let nuevasFilas = Math.round(nuevasColumnas * 0.6);
  if (nuevasFilas < 14) {
    nuevasFilas = 14;
  }

  // Listas nuevas, todo vacío
  const total = nuevasColumnas * nuevasFilas;
  const nuevasCeldas = crearLista(total, 0);
  const nuevasEdades = crearLista(total, 0);
  const nuevasEstelas = crearLista(total, 0);

  // Si ya había algo dibujado, copiamos la parte que sigue cabiendo
  if (celdas !== null) {
    const maxFilas = Math.min(filas, nuevasFilas);
    const maxColumnas = Math.min(columnas, nuevasColumnas);
    for (let f = 0; f < maxFilas; f++) {
      for (let c = 0; c < maxColumnas; c++) {
        const posVieja = f * columnas + c;
        const posNueva = f * nuevasColumnas + c;
        nuevasCeldas[posNueva] = celdas[posVieja];
        nuevasEdades[posNueva] = edades[posVieja];
        nuevasEstelas[posNueva] = estelas[posVieja];
      }
    }
  }

  // Guardamos los nuevos valores
  columnas = nuevasColumnas;
  filas = nuevasFilas;
  celdas = nuevasCeldas;
  edades = nuevasEdades;
  estelas = nuevasEstelas;

  // Ajustamos el tamaño del lienzo y redibujamos
  lienzo.width = columnas * tamanoCelda;
  lienzo.height = filas * tamanoCelda;
  dibujar();
  actualizarEstadisticas();
}


/* ============================================================
   5. LÓGICA DEL JUEGO
   ============================================================ */

// Cuenta cuántos vecinos vivos tiene la celda de la fila f y columna c
function contarVecinos(f, c, envolver) {
  let total = 0;

  // Recorremos las 8 celdas de alrededor
  for (let df = -1; df <= 1; df++) {
    for (let dc = -1; dc <= 1; dc++) {

      // La celda del centro es la propia celda: la saltamos
      if (df === 0 && dc === 0) {
        continue;
      }

      let filaVecina = f + df;
      let columnaVecina = c + dc;

      if (envolver) {
        // Los bordes dan la vuelta: salir por la derecha es entrar por la izquierda
        filaVecina = (filaVecina + filas) % filas;
        columnaVecina = (columnaVecina + columnas) % columnas;
      } else {
        // Sin vuelta: lo que queda fuera del tablero cuenta como muerto
        if (filaVecina < 0 || filaVecina >= filas || columnaVecina < 0 || columnaVecina >= columnas) {
          continue;
        }
      }

      total = total + celdas[filaVecina * columnas + columnaVecina];
    }
  }

  return total;
}

// Cuenta todas las células vivas del tablero
function contarVivas() {
  let total = 0;
  for (let i = 0; i < celdas.length; i++) {
    total = total + celdas[i];
  }
  return total;
}

// Calcula la siguiente generación aplicando las reglas
function siguienteGeneracion() {
  // Lista nueva para no cambiar la actual mientras la leemos
  const nuevas = crearLista(columnas * filas, 0);
  const envolver = checkBordes.checked;
  let hayCambios = false;

  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      const i = f * columnas + c;
      const vecinos = contarVecinos(f, c, envolver);

      // Aplicamos la regla
      if (celdas[i] === 1) {
        // Viva: sobrevive solo si su número de vecinos está en la regla
        if (sobreviven[vecinos]) {
          nuevas[i] = 1;
        }
      } else {
        // Muerta: nace solo si su número de vecinos está en la regla
        if (nacen[vecinos]) {
          nuevas[i] = 1;
        }
      }

      // ¿Ha cambiado algo respecto a antes?
      if (nuevas[i] !== celdas[i]) {
        hayCambios = true;
      }

      // Actualizamos la edad y la estela de la celda
      if (nuevas[i] === 1) {
        if (celdas[i] === 1) {
          edades[i] = edades[i] + 1;   // sigue viva: un año más
        } else {
          edades[i] = 1;               // acaba de nacer
        }
        estelas[i] = 255;
      } else {
        edades[i] = 0;
        estelas[i] = Math.max(0, estelas[i] - 30);   // la estela se va apagando
      }
    }
  }

  celdas = nuevas;
  generacion = generacion + 1;
  estable = !hayCambios;

  // Guardamos la población para la gráfica (máximo 150 datos)
  historial.push(contarVivas());
  if (historial.length > 150) {
    historial.shift();
  }

  dibujar();
  actualizarEstadisticas();
}


/* ============================================================
   6. DIBUJAR EN EL LIENZO
   ============================================================ */

function dibujar() {
  // Leemos los colores definidos en el CSS
  const estilos = getComputedStyle(document.documentElement);
  const colorFondo = estilos.getPropertyValue('--lienzo').trim();
  const colorRejilla = estilos.getPropertyValue('--rejilla').trim();
  const colorViva = estilos.getPropertyValue('--viva').trim();

  const modo = selectColor.value;
  const mostrarRejilla = checkRejilla.checked;
  const mostrarEstela = checkEstela.checked;

  // 1) Pintamos el fondo
  ctx.fillStyle = colorFondo;
  ctx.fillRect(0, 0, lienzo.width, lienzo.height);

  // 2) Pintamos las líneas de la rejilla (todas de una vez)
  if (mostrarRejilla) {
    ctx.strokeStyle = colorRejilla;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = 0; c <= columnas; c++) {
      ctx.moveTo(c * tamanoCelda + 0.5, 0);
      ctx.lineTo(c * tamanoCelda + 0.5, filas * tamanoCelda);
    }
    for (let f = 0; f <= filas; f++) {
      ctx.moveTo(0, f * tamanoCelda + 0.5);
      ctx.lineTo(columnas * tamanoCelda, f * tamanoCelda + 0.5);
    }
    ctx.stroke();
  }

  // Si hay rejilla, dejamos 1 píxel de margen para que se vea
  let margen = 0;
  if (mostrarRejilla) {
    margen = 1;
  }

  // 3) Pintamos las celdas
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      const i = f * columnas + c;
      const x = c * tamanoCelda + margen;
      const y = f * tamanoCelda + margen;
      const lado = tamanoCelda - margen;

      if (celdas[i] === 1) {
        // Celda viva: elegimos el color según el modo
        if (modo === 'edad') {
          // Cuanto más vieja, más cambia el tono (de turquesa a rosa)
          const tono = 170 + Math.min(edades[i], 50) * 3.2;
          ctx.fillStyle = 'hsl(' + tono + ', 90%, 58%)';
        } else if (modo === 'arcoiris') {
          // El tono depende de la posición en el tablero
          const tono = (c / columnas) * 300 + (f / filas) * 60;
          ctx.fillStyle = 'hsl(' + tono + ', 85%, 58%)';
        } else {
          ctx.fillStyle = colorViva;
        }
        ctx.globalAlpha = 1;
        ctx.fillRect(x, y, lado, lado);

      } else if (mostrarEstela && estelas[i] > 0) {
        // Celda recién muerta: la dibujamos más transparente
        ctx.fillStyle = colorViva;
        ctx.globalAlpha = (estelas[i] / 255) * 0.3;
        ctx.fillRect(x, y, lado, lado);
      }
    }
  }

  ctx.globalAlpha = 1;   // dejamos la transparencia normal
}


/* ============================================================
   7. ESTADÍSTICAS Y GRÁFICA
   ============================================================ */

function actualizarEstadisticas() {
  const vivas = contarVivas();

  // Guardamos el máximo de población
  if (vivas > picoPoblacion) {
    picoPoblacion = vivas;
  }

  // Escribimos los números en pantalla
  textoGen.textContent = generacion;
  textoPob.textContent = vivas;
  textoPico.textContent = picoPoblacion;

  // Densidad = porcentaje de celdas vivas
  const densidadReal = (vivas / (columnas * filas)) * 100;
  textoDen.textContent = densidadReal.toFixed(1) + '%';

  // Estado del juego
  if (vivas === 0) {
    textoEstado.textContent = 'Extinta';
  } else if (estable && generacion > 0) {
    textoEstado.textContent = 'Estable';
  } else if (corriendo) {
    textoEstado.textContent = 'En marcha';
  } else {
    textoEstado.textContent = 'Pausa';
  }

  dibujarGrafica();
}

// Dibuja la línea de la evolución de la población
function dibujarGrafica() {
  ctxGrafica.clearRect(0, 0, grafica.width, grafica.height);

  // Hacen falta al menos 2 datos para dibujar una línea
  if (historial.length < 2) {
    return;
  }

  // Buscamos el valor más alto para ajustar la escala
  let maximo = 1;
  for (let i = 0; i < historial.length; i++) {
    if (historial[i] > maximo) {
      maximo = historial[i];
    }
  }

  // Línea con degradado de un color de acento al otro
  const estilos = getComputedStyle(document.documentElement);
  const degradado = ctxGrafica.createLinearGradient(0, 0, grafica.width, 0);
  degradado.addColorStop(0, estilos.getPropertyValue('--a1').trim());
  degradado.addColorStop(1, estilos.getPropertyValue('--a2').trim());
  ctxGrafica.strokeStyle = degradado;
  ctxGrafica.lineWidth = 2;

  // Unimos todos los puntos
  ctxGrafica.beginPath();
  for (let i = 0; i < historial.length; i++) {
    const x = (i / (historial.length - 1)) * grafica.width;
    const y = grafica.height - 4 - (historial[i] / maximo) * (grafica.height - 8);
    if (i === 0) {
      ctxGrafica.moveTo(x, y);
    } else {
      ctxGrafica.lineTo(x, y);
    }
  }
  ctxGrafica.stroke();
}


/* ============================================================
   8. EDITAR CELDAS
   ============================================================ */

// Pone una celda viva (1) o muerta (0)
function ponerCelda(f, c, valor) {
  const i = f * columnas + c;
  celdas[i] = valor;
  if (valor === 1) {
    edades[i] = 1;
    estelas[i] = 255;
  } else {
    edades[i] = 0;
  }
}

// Coloca el patrón activo con su centro en la celda (f0, c0)
function colocarPatron(f0, c0) {
  const forma = PATRONES[patronActivo];
  const alto = forma.length;
  const ancho = forma[0].length;
  const envolver = checkBordes.checked;

  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      // Solo las letras O son células vivas
      if (forma[y].charAt(x) !== 'O') {
        continue;
      }

      let f = f0 + y - Math.floor(alto / 2);
      let c = c0 + x - Math.floor(ancho / 2);

      if (envolver) {
        f = (f + filas) % filas;
        c = (c + columnas) % columnas;
      }

      // Solo pintamos si la celda está dentro del tablero
      if (f >= 0 && f < filas && c >= 0 && c < columnas) {
        ponerCelda(f, c, 1);
      }
    }
  }
}

// Reinicia contadores y redibuja
function reiniciarContadores() {
  generacion = 0;
  picoPoblacion = 0;
  estable = false;
  historial = [contarVivas()];
  dibujar();
  actualizarEstadisticas();
}

// Rellena el tablero al azar según el slider de densidad
function aleatorio() {
  const densidad = Number(barraDensidad.value);
  for (let i = 0; i < celdas.length; i++) {
    // Número al azar entre 0 y 100: si es menor que la densidad, la celda vive
    if (Math.random() * 100 < densidad) {
      celdas[i] = 1;
      edades[i] = 1;
      estelas[i] = 255;
    } else {
      celdas[i] = 0;
      edades[i] = 0;
      estelas[i] = 0;
    }
  }
  reiniciarContadores();
}

// Deja todo el tablero vacío
function limpiar() {
  for (let i = 0; i < celdas.length; i++) {
    celdas[i] = 0;
    edades[i] = 0;
    estelas[i] = 0;
  }
  reiniciarContadores();
}

// Convierte la posición del ratón en fila y columna del tablero
function obtenerCelda(evento) {
  const caja = lienzo.getBoundingClientRect();
  const escalaX = lienzo.width / caja.width;
  const escalaY = lienzo.height / caja.height;
  const x = (evento.clientX - caja.left) * escalaX;
  const y = (evento.clientY - caja.top) * escalaY;
  return {
    fila: Math.floor(y / tamanoCelda),
    columna: Math.floor(x / tamanoCelda)
  };
}

// Comprueba que la celda esté dentro del tablero
function estaDentro(fila, columna) {
  return fila >= 0 && fila < filas && columna >= 0 && columna < columnas;
}

// Pinta o borra la celda bajo el ratón
function pintar(evento) {
  const celda = obtenerCelda(evento);
  if (estaDentro(celda.fila, celda.columna)) {
    ponerCelda(celda.fila, celda.columna, valorPincel);
    dibujar();
    actualizarEstadisticas();
  }
}

// Al pulsar sobre el lienzo
function alPulsar(evento) {
  const celda = obtenerCelda(evento);
  if (!estaDentro(celda.fila, celda.columna)) {
    return;
  }

  // Con un patrón elegido: un clic lo coloca
  if (patronActivo !== null) {
    colocarPatron(celda.fila, celda.columna);
    dibujar();
    actualizarEstadisticas();
    return;
  }

  // Pincel libre: si pulsas una celda viva, vas a borrar; si está muerta, vas a pintar
  dibujando = true;
  if (celdas[celda.fila * columnas + celda.columna] === 1) {
    valorPincel = 0;
  } else {
    valorPincel = 1;
  }
  pintar(evento);
}

// Al mover el ratón con el botón pulsado
function alMover(evento) {
  if (dibujando) {
    pintar(evento);
  }
}

// Al soltar el ratón
function alSoltar() {
  dibujando = false;
}


/* ============================================================
   9. ANIMACIÓN
   ============================================================ */

// Arranca el temporizador: cada cierto tiempo calcula una generación
function arrancarTemporizador() {
  const milisegundos = 1000 / Number(barraVelocidad.value);
  temporizador = setInterval(siguienteGeneracion, milisegundos);
}

function pararTemporizador() {
  clearInterval(temporizador);
  temporizador = null;
}

// Botón Iniciar / Pausar
function alternarJuego() {
  if (corriendo) {
    corriendo = false;
    pararTemporizador();
    botonPlay.textContent = '▶ Iniciar';
  } else {
    corriendo = true;
    arrancarTemporizador();
    botonPlay.textContent = '⏸ Pausar';
  }
  actualizarEstadisticas();
}

// Si el juego está en marcha, lo pausa
function pausar() {
  if (corriendo) {
    alternarJuego();
  }
}

// Avanza una sola generación
function darUnPaso() {
  pausar();
  siguienteGeneracion();
}


/* ============================================================
   10. PANEL DE REGLAS Y PATRONES
   ============================================================ */

// Devuelve los números marcados separados por comas: "2, 3" (o "ninguno")
function numerosConComas(lista) {
  let texto = '';
  for (let n = 0; n <= 8; n++) {
    if (lista[n]) {
      if (texto !== '') {
        texto = texto + ', ';
      }
      texto = texto + n;
    }
  }
  if (texto === '') {
    texto = 'ninguno';
  }
  return texto;
}

// Devuelve los números marcados pegados: "23" (o vacío)
function numerosJuntos(lista) {
  let texto = '';
  for (let n = 0; n <= 8; n++) {
    if (lista[n]) {
      texto = texto + n;
    }
  }
  return texto;
}

// Escribe la explicación de la regla activa
function actualizarTextoRegla() {
  textoRegla.textContent =
    'Regla B' + numerosJuntos(nacen) + '/S' + numerosJuntos(sobreviven) + '. ' +
    'Una célula muerta nace si tiene ' + numerosConComas(nacen) + ' vecinos vivos. ' +
    'Una viva sobrevive con ' + numerosConComas(sobreviven) + '; en otro caso muere.';
}

// Crea un botón con un número (0 al 8) para una de las dos listas de reglas
function crearBotonNumero(zona, lista, numero) {
  const boton = document.createElement('button');
  boton.className = 'chip num';
  if (lista[numero]) {
    boton.className = 'chip num on';
  }
  boton.textContent = numero;

  // Al pulsarlo se activa o desactiva ese número
  boton.onclick = function () {
    lista[numero] = !lista[numero];
    selectPreset.value = 'custom';   // ya no es una regla predefinida
    construirBotonesRegla();
  };

  zona.appendChild(boton);
}

// Crea los 9 botones de "Nace" y los 9 de "Sobrevive"
function construirBotonesRegla() {
  zonaChipsNace.innerHTML = '';
  zonaChipsSobrevive.innerHTML = '';
  for (let n = 0; n <= 8; n++) {
    crearBotonNumero(zonaChipsNace, nacen, n);
    crearBotonNumero(zonaChipsSobrevive, sobreviven, n);
  }
  actualizarTextoRegla();
}

// Activa una de las reglas predefinidas
function aplicarRegla(nombre) {
  const regla = REGLAS[nombre];
  const listaNace = regla[0];
  const listaSobrevive = regla[1];

  for (let n = 0; n <= 8; n++) {
    nacen[n] = listaNace.indexOf(n) !== -1;            // ¿el número está en la lista?
    sobreviven[n] = listaSobrevive.indexOf(n) !== -1;
  }
  construirBotonesRegla();
}

// Rellena el desplegable de reglas
function cargarOpcionesPreset() {
  for (const nombre in REGLAS) {
    const opcion = document.createElement('option');
    opcion.textContent = nombre;
    selectPreset.appendChild(opcion);
  }
  const personalizada = document.createElement('option');
  personalizada.value = 'custom';
  personalizada.textContent = 'Personalizada';
  selectPreset.appendChild(personalizada);
}

// Crea un botón de patrón (o el de pincel libre)
function crearBotonPatron(nombre, patronDelBoton) {
  const boton = document.createElement('button');
  boton.className = 'chip';
  if (patronActivo === patronDelBoton) {
    boton.className = 'chip on';
  }
  boton.textContent = nombre;

  boton.onclick = function () {
    patronActivo = patronDelBoton;
    construirPatrones();
  };

  zonaPatrones.appendChild(boton);
}

// Crea todos los botones de patrones
function construirPatrones() {
  zonaPatrones.innerHTML = '';
  crearBotonPatron('Pincel libre', null);
  for (const nombre in PATRONES) {
    crearBotonPatron(nombre, nombre);
  }
}


/* ============================================================
   11. EVENTOS
   ============================================================ */

// Botones principales
botonPlay.onclick = alternarJuego;
botonPaso.onclick = darUnPaso;
botonAzar.onclick = aleatorio;
botonLimpiar.onclick = limpiar;

// Slider de velocidad
barraVelocidad.oninput = function () {
  textoVelocidad.textContent = barraVelocidad.value + ' gen/s';
  // Si está en marcha, reiniciamos el temporizador con la nueva velocidad
  if (corriendo) {
    pararTemporizador();
    arrancarTemporizador();
  }
};

// Slider de densidad
barraDensidad.oninput = function () {
  textoDensidad.textContent = barraDensidad.value + '%';
};

// Tamaño de celda
selectTamano.onchange = function () {
  tamanoCelda = Number(selectTamano.value);
  ajustarCuadricula();
};

// Regla predefinida
selectPreset.onchange = function () {
  if (selectPreset.value !== 'custom') {
    aplicarRegla(selectPreset.value);
  }
};

// Opciones de visualización: solo hay que redibujar
selectColor.onchange = dibujar;
checkEstela.onchange = dibujar;
checkRejilla.onchange = dibujar;

// Ratón o dedo sobre el lienzo
lienzo.addEventListener('pointerdown', alPulsar);
lienzo.addEventListener('pointermove', alMover);
window.addEventListener('pointerup', alSoltar);

// Si cambia el tamaño de la ventana, reajustamos la cuadrícula (con una pequeña espera)
let temporizadorResize = null;
window.addEventListener('resize', function () {
  clearTimeout(temporizadorResize);
  temporizadorResize = setTimeout(ajustarCuadricula, 150);
});

// Atajos de teclado
window.addEventListener('keydown', function (evento) {
  // Si estás escribiendo o usando un desplegable, no hacemos nada
  const etiqueta = evento.target.tagName;
  if (etiqueta === 'INPUT' || etiqueta === 'SELECT') {
    return;
  }

  const tecla = evento.key.toLowerCase();
  if (tecla === ' ') {
    evento.preventDefault();   // evita que la página baje con la barra espaciadora
    alternarJuego();
  } else if (tecla === 'n') {
    darUnPaso();
  } else if (tecla === 'r') {
    aleatorio();
  } else if (tecla === 'c') {
    limpiar();
  }
});


/* ============================================================
   12. ARRANQUE
   Todo lo que se ejecuta al abrir la página
   ============================================================ */

cargarOpcionesPreset();
aplicarRegla('Conway clásico (B3/S23)');
construirPatrones();
ajustarCuadricula();
aleatorio();