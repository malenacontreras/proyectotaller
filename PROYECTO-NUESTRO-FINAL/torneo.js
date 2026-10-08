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
