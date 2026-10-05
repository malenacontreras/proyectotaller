/** Datos generales del torneo que se está jugando. */
let datosTorneo = {};
/** Nombres de las rondas ya jugadas. */
let historialRondas = [];
/** Partidos reales jugados (ronda, ganador, perdedor y sets). */
let historialPartidos = [];
/** Temporizador activo del toast. */
let toastTimer = null;

/**
 * Escapa el texto escrito por el usuario antes de meterlo en un innerHTML.
 * @method esc
 * @param {string} texto - Texto a escapar
 * @return {string} Texto seguro
 */
const esc = (texto) => texto.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * Combina el buscador con los filtros de fecha, nivel y ubicación
 * para mostrar u ocultar cada tarjeta de torneo.
 * @method aplicarFiltros
 * @return {void}
 */
const aplicarFiltros = () => {
  const termino = document.getElementById('buscador').value.toLowerCase();
  const nivel = document.getElementById('filtro-nivel').value;
  const ubicacion = document.getElementById('filtro-ubicacion').value;
  const orden = document.getElementById('filtro-fecha').value;
  const grilla = document.getElementById('tournament-grid');
  const tarjetas = [...grilla.querySelectorAll('.tournament-card')];

  tarjetas.forEach((tarjeta) => {
    const d = tarjeta.dataset;
    const visible = d.title.toLowerCase().includes(termino)
      && (nivel === 'Nivel' || d.nivel === nivel || d.nivel === 'Todos los niveles')
      && (ubicacion === 'Ubicación' || d.ubicacion === ubicacion);
    tarjeta.classList.toggle('hidden', !visible);
  });

  if (orden === 'Más próximos') {
    tarjetas.sort((a, b) => a.dataset.orden - b.dataset.orden).forEach((t) => grilla.appendChild(t));
  }
};

/**
 * Abre el overlay con el detalle del torneo, usando los data- de la tarjeta.
 * @method mostrarDetalle
 * @param {HTMLElement} tarjeta - Tarjeta de torneo seleccionada
 * @return {void}
 */
const mostrarDetalle = (tarjeta) => {
  const { title, nivel, desc, fecha, ubicacion, jugadores } = tarjeta.dataset;
  const imagen = tarjeta.querySelector('img');
  const textos = { nombre: title, nivel, desc, fecha, ubicacion, jugadores };

  Object.entries(textos).forEach(([id, texto]) => {
    document.getElementById(`modal-${id}`).textContent = texto;
  });
  document.getElementById('modal-img').src = imagen.src;
  document.getElementById('modal-img').alt = imagen.alt;
  document.getElementById('overlay').classList.add('show');
};

/**
 * Cierra el overlay de detalle del torneo.
 * @method cerrarDetalle
 * @return {void}
 */
const cerrarDetalle = () => {
  document.getElementById('overlay').classList.remove('show');
};

/**
 * Marca el formato elegido y lo refleja en el resumen del formulario.
 * @method seleccionarFormato
 * @param {HTMLElement} opcion - Opción de formato clickeada
 * @return {void}
 */
const seleccionarFormato = (opcion) => {
  document.querySelectorAll('.choice').forEach((c) => c.classList.remove('selected'));
  opcion.classList.add('selected');
  document.getElementById('resumen-formato').textContent = opcion.textContent;
};

/**
 * Cuenta las duplas con nombre cargado (mínimo 4 para jugar) y calcula
 * los partidos de una eliminación directa: duplas - 1.
 * @method calcularPartidos
 * @return {void}
 */
const calcularPartidos = () => {
  const cantidad = [...document.querySelectorAll('#participantes input')].filter((i) => i.value.trim()).length;
  document.getElementById('resumen-participantes').textContent = `${cantidad} cargadas`;
  document.getElementById('resumen-partidos').textContent = `${Math.max(cantidad - 1, 0)} partidos`;
};

/**
 * Agrega un campo de dupla al formulario.
 * @method agregarParticipante
 * @return {void}
 */
const agregarParticipante = () => {
  const contenedor = document.getElementById('participantes');
  const numero = contenedor.children.length + 1;
  const campo = document.createElement('div');
  campo.className = 'field';
  campo.innerHTML = `<label for="participante-${numero}">Dupla ${numero}</label>
    <input id="participante-${numero}" placeholder="Nombre de la dupla" maxlength="24">`;
  contenedor.appendChild(campo);
  calcularPartidos();
};

/**
 * Actualiza el nombre del torneo en el resumen mientras el usuario escribe.
 * @method actualizarResumen
 * @param {Event} evento - Evento "input" del campo nombre
 * @return {void}
 */
const actualizarResumen = (evento) => {
  document.getElementById('resumen-nombre').textContent = evento.target.value || 'Sin definir';
};

/**
 * Valida que el nombre del torneo tenga al menos 3 caracteres.
 * @method validarNombre
 * @param {HTMLInputElement} campo - Input del nombre del torneo
 * @return {void}
 */
const validarNombre = (campo) => {
  const largo = campo.value.trim().length;
  if (largo > 0 && largo < 3) {
    alert('El nombre del torneo debe tener al menos 3 caracteres.');
    campo.value = '';
    document.getElementById('resumen-nombre').textContent = 'Sin definir';
  }
};

/**
 * Traduce la cantidad de duplas en carrera al nombre de la ronda.
 * @method nombreRonda
 * @param {number} cantidad - Duplas en carrera (potencia de 2)
 * @return {string} Nombre de la ronda
 */
const nombreRonda = (cantidad) => (
  { 2: 'Final', 4: 'Semifinal', 8: 'Cuartos de final', 16: 'Octavos de final' }[cantidad] || `Fase de ${cantidad}`
);

/**
 * Valida las duplas, las mezcla, arma los cruces de la primera ronda
 * (repartiendo los pases libres) y muestra la primera fase.
 * @method crearTorneo
 * @param {Event} evento - Evento "submit" del formulario
 * @return {void}
 */
const crearTorneo = (evento) => {
  evento.preventDefault();

  const duplas = [...document.querySelectorAll('#participantes input')].map((i) => i.value.trim()).filter(Boolean);

  if (duplas.length < 4) {
    alert('Necesitás al menos 4 duplas para generar los cruces.');
    return;
  }
  if (new Set(duplas.map((d) => d.toLowerCase())).size < duplas.length) {
    alert('Hay duplas con el mismo nombre. Cada dupla necesita un nombre distinto.');
    return;
  }

  // Mezcla al azar (Fisher-Yates)
  for (let i = duplas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [duplas[i], duplas[j]] = [duplas[j], duplas[i]];
  }

  // Cruces: se completa hasta la próxima potencia de 2 con pases libres.
  // Cada dupla con pase libre se empareja con "null" (sin rival), así nunca
  // se enfrentan dos vacíos y la cantidad de partidos por ronda es siempre correcta.
  const potencia = 2 ** Math.ceil(Math.log2(duplas.length));
  const pasesLibres = potencia - duplas.length;
  const cruces = duplas.flatMap((dupla, i) => (i < pasesLibres ? [dupla, null] : [dupla]));

  const hojaDeRuta = [];
  for (let n = potencia; n > 1; n /= 2) hojaDeRuta.push(nombreRonda(n));

  historialRondas = [];
  historialPartidos = [];
  datosTorneo = {
    nombre: document.getElementById('nombre-torneo').value.trim() || 'Sin nombre',
    horaInicio: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    ubicacion: document.getElementById('ubicacion').value.trim() || 'A definir en el momento',
    formato: document.getElementById('resumen-formato').textContent,
    nivel: document.getElementById('nivel').value,
    totalParticipantes: duplas.length,
    hojaDeRuta,
  };

  document.getElementById('form-torneo').classList.add('hidden');

  const bracket = document.createElement('div');
  bracket.id = 'bracket-view';
  bracket.className = 'form-card';
  bracket.innerHTML = `
    <div class="eyebrow">Torneo en curso</div>
    <h2 class="bracket-title">${esc(datosTorneo.nombre)}</h2>
    <div class="ficha-torneo">
      <span>🕒 Arrancó a las ${datosTorneo.horaInicio}</span>
      <span>📍 ${esc(datosTorneo.ubicacion)}</span>
      <span>🎯 ${datosTorneo.formato}</span>
      <span>⭐ ${datosTorneo.nivel}</span>
    </div>
    <div id="fase-container"></div>
  `;
  document.querySelector('.page-shell').appendChild(bracket);

  mostrarFase(cruces);
};

/**
 * Muestra un mensaje breve en la esquina y lo oculta solo.
 * @method mostrarToast
 * @param {string} mensaje - Texto a mostrar
 * @return {void}
 */
const mostrarToast = (mensaje) => {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = mensaje;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
};

/**
 * Valida y confirma el marcador de un partido. En pádel se juega al mejor
 * de 3 sets: el ganador suma 2 y el perdedor 0 o 1 (solo 2-0 o 2-1).
 * Cualquier otro marcador (3-2, 2-2, 1-1...) se rechaza.
 * @method confirmarResultado
 * @param {HTMLElement} boton - Botón "Confirmar resultado" de la fila
 * @return {void}
 */
const confirmarResultado = (boton) => {
  const fila = boton.closest('.match-row');
  const inputs = fila.querySelectorAll('.set-score');
  const [sets1, sets2] = [...inputs].map((i) => Number(i.value));
  const [setsGanador, setsPerdedor] = [Math.max(sets1, sets2), Math.min(sets1, sets2)];

  if (setsGanador !== 2 || ![0, 1].includes(setsPerdedor)) {
    alert('Cargá un marcador válido. En pádel se juega al mejor de 3 sets (solo 2-0 o 2-1).');
    inputs.forEach((input) => { input.value = 0; });
    return;
  }

  const ganador = sets1 > sets2 ? fila.dataset.j1 : fila.dataset.j2;
  Object.assign(fila.dataset, { ganador, setsGanador, setsPerdedor });
  fila.classList.add('confirmed');
  inputs.forEach((input) => { input.disabled = true; });
  boton.disabled = true;
  boton.textContent = `✔ Ganó ${ganador}`;

  mostrarToast(`🎾 ${ganador} se queda con el partido`);
};

/**
 * Arma la hoja de ruta: rondas jugadas, ronda actual y rondas pendientes.
 * @method renderizarHojaDeRuta
 * @return {string} HTML de la hoja de ruta
 */
const renderizarHojaDeRuta = () => {
  const pasos = datosTorneo.hojaDeRuta.map((ronda, i) => {
    const estado = i < historialRondas.length ? 'done' : i === historialRondas.length ? 'current' : 'upcoming';
    return `<span class="step ${estado}">${ronda}</span>`;
  });
  return `<div class="rounds-trail">${pasos.join('<span class="step-arrow">→</span>')}</div>`;
};

/**
 * Devuelve el partido más contundente (mayor diferencia de sets) o el
 * más parejo (menor diferencia).
 * @method calcularPartidoDestacado
 * @param {Object[]} partidos - Partidos jugados
 * @param {string} tipo - "contundente" o "parejo"
 * @return {Object} Partido destacado
 */
const calcularPartidoDestacado = (partidos, tipo) => {
  const diferencia = (p) => p.setsGanador - p.setsPerdedor;
  return partidos.reduce((mejor, p) => (
    (tipo === 'contundente' ? diferencia(p) > diferencia(mejor) : diferencia(p) < diferencia(mejor)) ? p : mejor
  ));
};

/**
 * Genera un título honorífico para el campeón según cómo le fue.
 * @method generarApodo
 * @param {Object[]} partidos - Partidos ganados por el campeón
 * @return {string} Apodo del campeón
 */
const generarApodo = (partidos) => {
  if (partidos.every((p) => p.setsPerdedor === 0)) return 'Invicto absoluto';
  const ultimo = partidos[partidos.length - 1];
  if (ultimo.setsGanador - ultimo.setsPerdedor === 1) return 'Ganó en el límite';
  return ['🏆 Campeón indiscutido', 'La gran figura del torneo', 'El más regular'][partidos.length % 3];
};

/**
 * Renderiza los cruces de la fase actual junto con la hoja de ruta. Si
 * queda una sola dupla, muestra el resumen final con el campeón.
 * @method mostrarFase
 * @param {(string|null)[]} jugadores - Duplas en carrera (null = sin rival)
 * @return {void}
 */
const mostrarFase = (jugadores) => {
  const container = document.getElementById('fase-container');
  container.innerHTML = renderizarHojaDeRuta();

  if (jugadores.length === 1) {
    const campeon = jugadores[0];
    const { perdedor: subcampeon } = historialPartidos.find((p) => p.ronda === 'Final');
    const terceros = historialPartidos.filter((p) => p.ronda === 'Semifinal').map((p) => esc(p.perdedor));
    const partidosCampeon = historialPartidos.filter((p) => p.ganador === campeon);
    const camino = partidosCampeon
      .map((p) => `<li><strong>${p.ronda}:</strong> le ganó a ${esc(p.perdedor)} (${p.setsGanador}-${p.setsPerdedor})</li>`)
      .join('');
    const totalSets = historialPartidos.reduce((total, p) => total + p.setsGanador + p.setsPerdedor, 0);
    const destacado = (emoji, titulo, p) =>
      `<p>${emoji} <strong>${titulo}:</strong> ${esc(p.ganador)} ${p.setsGanador}-${p.setsPerdedor} a ${esc(p.perdedor)}</p>`;

    container.insertAdjacentHTML('beforeend', `
      <div class="champion-box">
        <div class="confetti" aria-hidden="true">🎉 🎾 🏆 🎾 🎉 🎾 🏆 🎉</div>
        <div class="champion-icon">🏆</div>
        <div class="eyebrow">${generarApodo(partidosCampeon)}</div>
        <h2 class="champion-name">${esc(campeon)}</h2>
        <p class="champion-vs">Venció a <strong>${esc(subcampeon)}</strong> en la final</p>

        <div class="podio">
          <div class="podio-step podio-2"><span class="podio-medal">🥈</span><span>${esc(subcampeon)}</span></div>
          <div class="podio-step podio-1"><span class="podio-medal">🥇</span><span>${esc(campeon)}</span></div>
          ${terceros.length ? `<div class="podio-step podio-3"><span class="podio-medal">🥉</span><span>${terceros.join(' y ')}</span></div>` : ''}
        </div>

        <div class="champion-stats">
          <div><strong>${datosTorneo.totalParticipantes}</strong><span>Duplas</span></div>
          <div><strong>${historialPartidos.length}</strong><span>Partidos jugados</span></div>
          <div><strong>${totalSets}</strong><span>Sets disputados</span></div>
          <div><strong>${historialRondas.length}</strong><span>Rondas</span></div>
        </div>

        <div class="champion-highlights">
          ${destacado('💥', 'El más contundente', calcularPartidoDestacado(historialPartidos, 'contundente'))}
          ${destacado('😰', 'El más parejo', calcularPartidoDestacado(historialPartidos, 'parejo'))}
        </div>

        <div class="champion-path">
          <h3>Camino a la copa</h3>
          <ul>${camino}</ul>
        </div>

        <div class="champion-actions">
          <button class="button" type="button" onclick="compartirResultado()">Copiar resultado</button>
          <button class="button primary" type="button" onclick="location.reload()">Organizar nuevo torneo</button>
        </div>
      </div>
    `);
    return;
  }

  container.dataset.cantidad = jugadores.length;
  container.insertAdjacentHTML('beforeend', `<h3 class="phase-title">${nombreRonda(jugadores.length)}</h3>`);

  const lista = document.createElement('div');
  lista.className = 'matches-list';
  const avatar = (nombre) => `<span class="avatar">${esc(nombre.charAt(0).toUpperCase())}</span>`;

  for (let i = 0; i < jugadores.length; i += 2) {
    const [j1, j2] = [jugadores[i], jugadores[i + 1]];
    const fila = document.createElement('div');
    fila.className = 'match-row';
    fila.dataset.j1 = j1;
    fila.dataset.j2 = j2 || '';

    if (j2) {
      fila.innerHTML = `
        <div class="match-players">
          <div class="match-side">
            ${avatar(j1)}
            <span class="player-name">${esc(j1)}</span>
          </div>
          <div class="score-box">
            <label class="visually-hidden" for="set-${i}-a">Sets ganados por ${esc(j1)}</label>
            <input type="number" id="set-${i}-a" class="set-score" min="0" max="2" value="0">
            <span class="score-sep">–</span>
            <label class="visually-hidden" for="set-${i}-b">Sets ganados por ${esc(j2)}</label>
            <input type="number" id="set-${i}-b" class="set-score" min="0" max="2" value="0">
          </div>
          <div class="match-side match-side-right">
            <span class="player-name">${esc(j2)}</span>
            ${avatar(j2)}
          </div>
        </div>
        <button class="button btn-confirm" type="button" onclick="confirmarResultado(this)">Confirmar resultado</button>
      `;
    } else {
      fila.dataset.ganador = j1;
      fila.innerHTML = `
        <div class="match-players">${avatar(j1)}${esc(j1)}</div>
        <span class="bye-tag">Pasa directo (sin rival)</span>
      `;
    }
    lista.appendChild(fila);
  }

  container.appendChild(lista);
  container.insertAdjacentHTML(
    'beforeend',
    '<button class="button primary btn-advance" type="button" onclick="procesarResultados()">Confirmar resultados y avanzar de fase</button>'
  );
};

/**
 * Junta los ganadores de la fase actual, registra los partidos reales
 * y avanza a la siguiente ronda.
 * @method procesarResultados
 * @return {void}
 */
const procesarResultados = () => {
  const filas = [...document.querySelectorAll('.match-row')];

  if (filas.some((fila) => !fila.dataset.ganador)) {
    alert('Confirmá el resultado de todos los partidos antes de avanzar de fase.');
    return;
  }

  const ronda = nombreRonda(Number(document.getElementById('fase-container').dataset.cantidad));

  filas.forEach(({ dataset: d }) => {
    if (d.j2) {
      historialPartidos.push({
        ronda,
        ganador: d.ganador,
        perdedor: d.ganador === d.j1 ? d.j2 : d.j1,
        setsGanador: Number(d.setsGanador),
        setsPerdedor: Number(d.setsPerdedor),
      });
    }
  });

  historialRondas.push(ronda);
  mostrarFase(filas.map((fila) => fila.dataset.ganador));
};

/**
 * Copia un resumen del torneo al portapapeles (o lo muestra en un alert
 * si el navegador no permite copiar).
 * @method compartirResultado
 * @return {void}
 */
const compartirResultado = () => {
  const final = historialPartidos.find((p) => p.ronda === 'Final');
  const resumen = `🏆 ${datosTorneo.nombre}\nCampeón: ${final.ganador}\nSubcampeón: ${final.perdedor}\nPartidos jugados: ${historialPartidos.length}`;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(resumen)
      .then(() => mostrarToast('📋 Resultado copiado al portapapeles'))
      .catch(() => alert(resumen));
  } else {
    alert(resumen);
  }
};