/**
 * Combina el texto del buscador con los 3 filtros (fecha, nivel y
 * ubicación) para mostrar u ocultar cada tarjeta de torneo.
 * @method aplicarFiltros
 * @return {void}
 */
const aplicarFiltros = () => {
  const termino = document.getElementById("buscador").value.toLowerCase();
  const mes = document.getElementById("filtro-fecha").value;
  const nivel = document.getElementById("filtro-nivel").value;
  const ubicacion = document.getElementById("filtro-ubicacion").value;

  const grilla = document.getElementById("tournament-grid");
  const tarjetas = [...grilla.querySelectorAll(".tournament-card")];

  let cantidadVisibles = 0;

  tarjetas.forEach((tarjeta) => {
    const d = tarjeta.dataset;

    const coincideNombre = d.title.toLowerCase().includes(termino);

    const coincideMes = mes === "" || d.mes === mes;

    const coincideNivel =
      nivel === "Nivel" || d.nivel === nivel || d.nivel === "Todos los niveles";

    const coincideUbicacion =
      ubicacion === "Ubicación" || d.ubicacion === ubicacion;

    const visible =
      coincideNombre && coincideMes && coincideNivel && coincideUbicacion;

    tarjeta.classList.toggle("hidden", !visible);

    if (visible) {
      cantidadVisibles++;
    }
  });

  const mensaje = document.getElementById("sin-resultados");

  if (cantidadVisibles === 0) {
    mensaje.classList.remove("hidden");
  } else {
    mensaje.classList.add("hidden");
  }
};

const limpiarFiltros = () => {
  document.getElementById("buscador").value = "";

  document.getElementById("filtro-fecha").value = "";

  document.getElementById("filtro-nivel").selectedIndex = 0;

  document.getElementById("filtro-ubicacion").selectedIndex = 0;

  aplicarFiltros();
};

/**
 * Abre el overlay con el detalle del torneo, tomando los datos desde
 * los atributos data- de la tarjeta y la imagen que fue clickeada.
 * @method mostrarDetalle
 * @param {HTMLElement} tarjeta - Tarjeta de torneo seleccionada
 * @return {void}
 */
const mostrarDetalle = (tarjeta) => {
  const imagen = tarjeta.querySelector("img");

  document.getElementById("modal-nombre").textContent = tarjeta.dataset.title;
  document.getElementById("modal-nivel").textContent = tarjeta.dataset.nivel;
  document.getElementById("modal-desc").textContent = tarjeta.dataset.desc;
  document.getElementById("modal-fecha").textContent = tarjeta.dataset.fecha;
  document.getElementById("modal-ubicacion").textContent =
    tarjeta.dataset.ubicacion;
  document.getElementById("modal-jugadores").textContent =
    tarjeta.dataset.jugadores;
  document.getElementById("modal-img").src = imagen.src;
  document.getElementById("modal-img").alt = imagen.alt;

  document.getElementById("overlay").classList.add("show");
};

/**
 * Cierra el overlay de detalle del torneo.
 * @method cerrarDetalle
 * @return {void}
 */
const cerrarDetalle = () => {
  document.getElementById("overlay").classList.remove("show");
};

/**
 * Marca como seleccionado el formato de torneo elegido por el usuario
 * y refleja el cambio en el resumen del formulario.
 * @method seleccionarFormato
 * @param {HTMLElement} opcion - Opción de formato clickeada
 * @return {void}
 */
const seleccionarFormato = (opcion) => {
  document
    .querySelectorAll(".choice")
    .forEach((c) => c.classList.remove("selected"));
  opcion.classList.add("selected");
  document.getElementById("resumen-formato").textContent = opcion.textContent;
};

/**
 * Agrega un nuevo campo de participante al formulario de organización
 * y recalcula la cantidad de partidos necesarios.
 * @method agregarParticipante
 * @return {void}
 */
const agregarParticipante = () => {
  const contenedor = document.getElementById("participantes");
  const numero = contenedor.children.length + 1;

  const campo = document.createElement("div");
  campo.className = "field";
  campo.innerHTML = `
  <label for="participante-${numero}">Participante ${numero}</label>

  <div class="participante-input">
    <input
      id="participante-${numero}"
      name="participante-${numero}"
      placeholder="Nombre del equipo"
      maxlength="24"
      size="20"
    >

    <button
      type="button"
      class="btn-eliminar"
      onclick="eliminarParticipante(this)"
      aria-label="Eliminar participante"
    >
      ✕
    </button>
  </div>
`;
  contenedor.appendChild(campo);

  calcularPartidos();
};

const eliminarParticipante = (boton) => {
  const participante = boton.closest(".field");
  participante.remove();

  calcularPartidos();
};

/**
 * Actualiza el nombre del torneo mostrado en el resumen a medida que
 * el usuario escribe en el campo correspondiente.
 * @method actualizarResumen
 * @param {Event} evento - Evento "input" del campo nombre del torneo
 * @return {void}
 */
const actualizarResumen = (evento) => {
  document.getElementById("resumen-nombre").textContent =
    evento.target.value || "Sin definir";
};

/**
 * Valida que el nombre del torneo tenga al menos 3 caracteres. Si el
 * usuario escribió algo demasiado corto, avisa con un alert
 * @method validarNombre
 * @param {HTMLInputElement} campo - Input del nombre del torneo
 * @return {void}
 */
const validarNombre = (campo) => {
  const valor = campo.value.trim();
  if (valor.length > 0 && valor.length < 3) {
    alert("El nombre del torneo debe tener al menos 3 caracteres.");
    campo.value = "";
    document.getElementById("resumen-nombre").textContent = "Sin definir";
  }
};

/**
 * Calcula la cantidad de partidos necesarios para llegar a un campeón
 * (participantes - 1) y actualiza el resumen del formulario.
 * @method calcularPartidos
 * @return {void}
 */
const calcularPartidos = () => {
  const cantidad = document.getElementById("participantes").children.length;
  document.getElementById("resumen-participantes").textContent =
    `${cantidad} cargados`;
  document.getElementById("resumen-partidos").textContent =
    `${Math.max(cantidad - 1, 0)} partidos`;
};

/**
 * Valida los participantes cargados, arma el fixture inicial mezclando
 * el orden al azar y muestra la primera fase de cruces del torneo.
 * @method crearTorneo
 * @param {Event} evento - Evento "submit" del formulario de organización
 * @return {void}
 */
const crearTorneo = (evento) => {
  evento.preventDefault();

  const inputs = document.querySelectorAll("#participantes input");
  let jugadores = [];
  inputs.forEach((input) => {
    if (input.value.trim() !== "") {
      jugadores.push(input.value.trim());
    }
  });

  if (jugadores.length < 2) {
    alert("Necesitás al menos 2 participantes para generar los cruces.");
    return;
  }

  jugadores = jugadores.sort(() => Math.random() - 0.5);
  historialRondas = [];
  historialPartidos = [];

  datosTorneo = {
    nombre: document.getElementById("nombre-torneo").value || "Sin nombre",
    horaInicio: new Date().toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    ubicacion:
      document.getElementById("ubicacion").value.trim() ||
      "A definir en el momento",
    formato: document.getElementById("resumen-formato").textContent,
    nivel: document.getElementById("nivel").value,
    totalParticipantes: jugadores.length,
    hojaDeRuta: calcularHojaDeRuta(jugadores.length),
  };

  document.getElementById("form-torneo").classList.add("hidden");

  const bracket = document.createElement("div");
  bracket.id = "bracket-view";
  bracket.className = "form-card";
  bracket.innerHTML = `
    <div class="eyebrow">Torneo en curso</div>
    <h2 class="bracket-title">${datosTorneo.nombre}</h2>
    <div class="ficha-torneo">
      <span>🕒 Arrancó a las ${datosTorneo.horaInicio}</span>
      <span>📍 ${datosTorneo.ubicacion}</span>
      <span>🎯 ${datosTorneo.formato}</span>
      <span>⭐ ${datosTorneo.nivel}</span>
    </div>
    <div id="fase-container"></div>
  `;
  document.querySelector(".page-shell").appendChild(bracket);

  mostrarFase(jugadores);
};

/** Datos generales del torneo que se está jugando (nombre, hora de inicio, formato, etc). */
let datosTorneo = {};

/** Nombres de ronda que ya se jugaron, para mostrar el progreso del torneo. */
let historialRondas = [];

/** Cada partido real jugado (ronda, ganador y perdedor), para armar el análisis final. */
let historialPartidos = [];

/**
 * Traduce la cantidad de jugadores que quedan en carrera al nombre
 * habitual de esa ronda.
 * @method nombreRonda
 * @param {number} cantidad - Jugadores que siguen en carrera
 * @return {string} Nombre de la ronda
 */
const nombreRonda = (cantidad) => {
  if (cantidad === 2) return "Final";
  if (cantidad === 4) return "Semifinal";
  if (cantidad === 8) return "Cuartos de final";
  if (cantidad === 16) return "Octavos de final";
  return `Fase de ${cantidad}`;
};

/**
 * Calcula, antes de jugar ni un partido, el nombre de todas las rondas
 * que va a tener el torneo.
 * @method calcularHojaDeRuta
 * @param {number} cantidadInicial - Participantes con los que arranca el torneo
 * @return {string[]} Nombres de ronda en el orden en que se van a jugar
 */
const calcularHojaDeRuta = (cantidadInicial) => {
  const rondas = [];
  let restantes = cantidadInicial;
  while (restantes > 1) {
    rondas.push(nombreRonda(restantes));
    restantes = Math.ceil(restantes / 2);
  }
  return rondas;
};

/** Identificador del temporizador activo del toast, para poder reiniciarlo. */
let toastTimer = null;

/**
 * Muestra un mensaje breve flotando en la esquina de la pantalla para
 * dar feedback inmediato de una acción (partido confirmado, resultado
 * copiado, etc), y lo oculta solo después de unos segundos.
 * @method mostrarToast
 * @param {string} mensaje - Texto a mostrar en el toast
 * @return {void}
 */
const mostrarToast = (mensaje) => {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = mensaje;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
};

/**
 * Valida y confirma el marcador de un partido: compara los sets
 * ganados por cada lado, define al ganador y bloquea la fila para que
 * no se pueda modificar el resultado por error. Si el marcador no es
 * válido (empate o fuera de 0 a 3 sets), avisa con un alert y
 * reinicia los inputs a 0.
 * @method confirmarResultado
 * @param {HTMLElement} boton - Botón "Confirmar resultado" de la fila
 * @return {void}
 */
const confirmarResultado = (boton) => {
  const fila = boton.closest(".match-row");
  const inputs = fila.querySelectorAll(".set-score");
  const sets1 = Number(inputs[0].value);
  const sets2 = Number(inputs[1].value);
  const marcadorValido =
    Number.isInteger(sets1) &&
    Number.isInteger(sets2) &&
    sets1 >= 0 &&
    sets1 <= 3 &&
    sets2 >= 0 &&
    sets2 <= 3 &&
    sets1 !== sets2;

  if (!marcadorValido) {
    alert(
      "Cargá un marcador válido (de 0 a 3 sets, sin empates) para definir un ganador.",
    );
    inputs[0].value = 0;
    inputs[1].value = 0;
    return;
  }

  const ganador = sets1 > sets2 ? fila.dataset.j1 : fila.dataset.j2;
  fila.dataset.sets1 = Math.max(sets1, sets2);
  fila.dataset.sets2 = Math.min(sets1, sets2);
  fila.querySelector(".ganador-select").value = ganador;
  fila.classList.add("confirmed");
  inputs.forEach((input) => {
    input.disabled = true;
  });
  boton.disabled = true;
  boton.textContent = `✔ Ganó ${ganador}`;

  mostrarToast(`🎾 ${ganador} se queda con el partido`);
};

/**
 * Arma la hoja de ruta del torneo como una fila de pasos: las rondas ya
 * jugadas en verde, la ronda actual resaltada y las que faltan en gris.
 * @method renderizarHojaDeRuta
 * @return {string} HTML de la hoja de ruta lista para insertar
 */
const renderizarHojaDeRuta = () => {
  const pasos = datosTorneo.hojaDeRuta.map((ronda, i) => {
    let estado = "upcoming";
    if (i < historialRondas.length) estado = "done";
    else if (i === historialRondas.length) estado = "current";
    return `<span class="step ${estado}">${ronda}</span>`;
  });
  return `<div class="rounds-trail">${pasos.join('<span class="step-arrow">→</span>')}</div>`;
};

/**
 * Renderiza los cruces de la fase actual del torneo junto con la hoja
 * de ruta del torneo. Si sólo queda un jugador en carrera, muestra el
 * resumen final con el análisis del campeón.
 * @method mostrarFase
 * @param {string[]} jugadores - Jugadores o equipos que siguen en carrera
 * @return {void}
 */
const mostrarFase = (jugadores) => {
  const container = document.getElementById("fase-container");
  container.innerHTML = renderizarHojaDeRuta();

  if (jugadores.length === 1) {
    const campeon = jugadores[0];
    const final = historialPartidos.find((p) => p.ronda === "Final");
    const subcampeon = final ? final.perdedor : "—";
    const terceros = historialPartidos
      .filter((p) => p.ronda === "Semifinal")
      .map((p) => p.perdedor);
    const partidosCampeon = historialPartidos.filter(
      (p) => p.ganador === campeon,
    );
    const camino = partidosCampeon
      .map(
        (p) =>
          `<li><strong>${p.ronda}:</strong> le ganó a ${p.perdedor} (${p.setsGanador}-${p.setsPerdedor})</li>`,
      )
      .join("");
    const totalSets = historialPartidos.reduce(
      (total, p) => total + p.setsGanador + p.setsPerdedor,
      0,
    );
    const contundente = calcularPartidoDestacado(
      historialPartidos,
      "contundente",
    );
    const masParejo = calcularPartidoDestacado(historialPartidos, "parejo");
    const podioTerceros = terceros.length
      ? `<div class="podio-step podio-3"><span class="podio-medal">🥉</span><span>${terceros.join(" y ")}</span></div>`
      : "";

    container.insertAdjacentHTML(
      "beforeend",
      `
      <div class="champion-box">
        <div class="confetti" aria-hidden="true">🎉 🎾 🏆 🎾 🎉 🎾 🏆 🎉</div>
        <div class="champion-icon">🏆</div>
        <div class="eyebrow">${generarApodo(partidosCampeon)}</div>
        <h2 class="champion-name">${campeon}</h2>
        <p class="champion-vs">Venció a <strong>${subcampeon}</strong> en la final</p>

        <div class="podio">
          <div class="podio-step podio-2"><span class="podio-medal">🥈</span><span>${subcampeon}</span></div>
          <div class="podio-step podio-1"><span class="podio-medal">🥇</span><span>${campeon}</span></div>
          ${podioTerceros}
        </div>

        <div class="champion-stats">
          <div><strong>${datosTorneo.totalParticipantes}</strong><span>Participantes</span></div>
          <div><strong>${historialPartidos.length}</strong><span>Partidos jugados</span></div>
          <div><strong>${totalSets}</strong><span>Sets disputados</span></div>
          <div><strong>${historialRondas.length}</strong><span>Rondas</span></div>
        </div>

        <div class="champion-highlights">
          ${contundente ? `<p>💥 <strong>El más contundente:</strong> ${contundente.ganador} ${contundente.setsGanador}-${contundente.setsPerdedor} a ${contundente.perdedor}</p>` : ""}
          ${masParejo ? `<p>😰 <strong>El más parejo:</strong> ${masParejo.ganador} ${masParejo.setsGanador}-${masParejo.setsPerdedor} a ${masParejo.perdedor}</p>` : ""}
        </div>

        <div class="champion-path">
          <h3>Camino a la copa</h3>
          <ul>${camino}</ul>
        </div>

        <div class="champion-actions">
          <button class="button" type="button" onclick="compartirResultado('${campeon}', '${subcampeon}')">Copiar resultado</button>
          <button class="button primary" type="button" onclick="location.reload()">Organizar nuevo torneo</button>
        </div>
      </div>
    `,
    );
    return;
  }

  container.dataset.cantidad = jugadores.length;

  const titulo = document.createElement("h3");
  titulo.className = "phase-title";
  titulo.textContent = nombreRonda(jugadores.length);
  container.appendChild(titulo);

  const lista = document.createElement("div");
  lista.className = "matches-list";

  for (let i = 0; i < jugadores.length; i += 2) {
    const j1 = jugadores[i];
    const j2 = jugadores[i + 1];
    const fila = document.createElement("div");
    fila.className = "match-row";
    fila.dataset.j1 = j1;
    fila.dataset.j2 = j2 || "";

    if (j2) {
      fila.innerHTML = `
        <div class="match-players">
          <div class="match-side">
            <span class="avatar">${j1.charAt(0).toUpperCase()}</span>
            <span class="player-name">${j1}</span>
          </div>
          <div class="score-box">
            <label class="visually-hidden" for="set-${i}-a">Sets ganados por ${j1}</label>
            <input type="number" id="set-${i}-a" class="set-score" min="0" max="3" value="0">
            <span class="score-sep">–</span>
            <label class="visually-hidden" for="set-${i}-b">Sets ganados por ${j2}</label>
            <input type="number" id="set-${i}-b" class="set-score" min="0" max="3" value="0">
          </div>
          <div class="match-side match-side-right">
            <span class="player-name">${j2}</span>
            <span class="avatar">${j2.charAt(0).toUpperCase()}</span>
          </div>
        </div>
        <button class="button btn-confirm" type="button" onclick="confirmarResultado(this)">Confirmar resultado</button>
        <input type="hidden" class="ganador-select" value="">
      `;
    } else {
      fila.innerHTML = `
        <div class="match-players"><span class="avatar">${j1.charAt(0).toUpperCase()}</span>${j1}</div>
        <span class="bye-tag">Pasa directo (sin rival)</span>
        <input type="hidden" class="ganador-select" value="${j1}">
      `;
    }

    lista.appendChild(fila);
  }

  container.appendChild(lista);
  container.insertAdjacentHTML(
    "beforeend",
    '<button class="button primary btn-advance" type="button" onclick="procesarResultados()">Confirmar resultados y avanzar de fase</button>',
  );
};

/**
 * Junta los ganadores de la fase actual, registra cada partido real
 * jugado y avanza a la siguiente ronda. Si
 * falta cargar algún resultado, avisa al usuario con un alert.
 * @method procesarResultados
 * @return {void}
 */
const procesarResultados = () => {
  const filas = document.querySelectorAll(".match-row");
  const faltanResultados = Array.from(filas).some(
    (fila) => !fila.querySelector(".ganador-select").value,
  );

  if (faltanResultados) {
    alert(
      "Confirmá el resultado de todos los partidos antes de avanzar de fase.",
    );
    return;
  }

  const ronda = nombreRonda(
    Number(document.getElementById("fase-container").dataset.cantidad),
  );
  const ganadores = [];

  filas.forEach((fila) => {
    const ganador = fila.querySelector(".ganador-select").value;
    ganadores.push(ganador);
    if (fila.dataset.j2) {
      const perdedor =
        ganador === fila.dataset.j1 ? fila.dataset.j2 : fila.dataset.j1;
      historialPartidos.push({
        ronda,
        ganador,
        perdedor,
        setsGanador: Number(fila.dataset.sets1),
        setsPerdedor: Number(fila.dataset.sets2),
      });
    }
  });

  historialRondas.push(ronda);
  mostrarFase(ganadores);
};

/**
 * Recorre los partidos jugados y devuelve el más contundente (mayor
 * diferencia de sets) o el más parejo (menor diferencia)
 * @method calcularPartidoDestacado
 * @param {Object[]} partidos - Todos los partidos jugados en el torneo
 * @param {string} tipo - "contundente" para el de mayor diferencia, cualquier otro valor para el más parejo
 * @return {Object|null} Partido destacado según el tipo pedido, o null si no hubo partidos
 */
const calcularPartidoDestacado = (partidos, tipo) => {
  if (partidos.length === 0) return null;
  return partidos.reduce((destacado, actual) => {
    const diffActual = actual.setsGanador - actual.setsPerdedor;
    const diffDestacado = destacado.setsGanador - destacado.setsPerdedor;
    return tipo === "contundente"
      ? diffActual > diffDestacado
        ? actual
        : destacado
      : diffActual < diffDestacado
        ? actual
        : destacado;
  });
};

/**
 * Genera un título honorífico para el campeón según cómo le fue en el
 * torneo
 * @method generarApodo
 * @param {Object[]} partidosCampeon - Partidos ganados por el campeón
 * @return {string} Apodo para mostrar junto al nombre del campeón
 */
const generarApodo = (partidosCampeon) => {
  const setsPerdidos = partidosCampeon.reduce(
    (total, p) => total + p.setsPerdedor,
    0,
  );
  if (setsPerdidos === 0) return "Invicto absoluto";

  const ultimoPartido = partidosCampeon[partidosCampeon.length - 1];
  if (
    ultimoPartido &&
    ultimoPartido.setsGanador - ultimoPartido.setsPerdedor === 1
  )
    return " Ganó en el límite";

  const apodos = [
    "🏆 Campeón indiscutido",
    "La gran figura del torneo",
    "El más regular",
  ];
  return apodos[partidosCampeon.length % apodos.length];
};

/**
 * Arma un resumen del torneo
 * y lo copia al portapapeles para que el usuario lo pueda compartir.
 * Si el navegador no permite copiar, muestra el resumen en un alert.
 * @method compartirResultado
 * @param {string} campeon - Nombre del campeón del torneo
 * @param {string} subcampeon - Nombre del subcampeón del torneo
 * @return {void}
 */
const compartirResultado = (campeon, subcampeon) => {
  const resumen = `🏆 ${datosTorneo.nombre}\nCampeón: ${campeon}\nSubcampeón: ${subcampeon}\nPartidos jugados: ${historialPartidos.length}`;

  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(resumen)
      .then(() => mostrarToast("📋 Resultado copiado al portapapeles"))
      .catch(() => alert(resumen));
  } else {
    alert(resumen);
  }
};
