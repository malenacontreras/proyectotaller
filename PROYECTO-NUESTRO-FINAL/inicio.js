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
