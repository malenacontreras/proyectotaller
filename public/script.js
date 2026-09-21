document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Buscador de torneos (Página: torneos.html)
  const searchInput = document.querySelector('#search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      document.querySelectorAll('.tournament-card').forEach(card => {
        const name = card.dataset.name || '';
        card.style.display = name.includes(term) ? 'block' : 'none';
      });
    });
  }

  // 2. Selección de formato (Página: organizar.html)
  const choices = document.querySelectorAll('.choice');
  choices.forEach(choice => {
    choice.addEventListener('click', () => {
      choices.forEach(x => x.classList.remove('selected'));
      choice.classList.add('selected');
    });
  });

  // 3. Agregar participantes (Página: organizar.html)
  const btnAddParticipant = document.querySelector('#add-participant');
  if (btnAddParticipant) {
    btnAddParticipant.addEventListener('click', () => {
      const box = document.querySelector('#participants');
      const n = box.children.length + 1;
      
      const newField = document.createElement('div');
      newField.className = 'field';
      newField.innerHTML = `
        <label>Participante ${n}</label>
        <input placeholder="Nombre o equipo">
      `;
      
      box.appendChild(newField);
      document.querySelector('#summary-count').textContent = `${n} cargados`;
    });
  }

  // 4. Actualizar resumen con el nombre del torneo (Página: organizar.html)
  const nameInput = document.querySelector('#name');
  if (nameInput) {
    nameInput.addEventListener('input', (e) => {
      document.querySelector('#summary-name').textContent = e.target.value || 'Sin definir';
    });
  }

// 5. Generar torneo y cruces (Página: organizar.html)
  const form = document.querySelector('#tournament-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Recopilar todos los participantes que no estén en blanco
      const inputs = document.querySelectorAll('#participants input');
      let jugadores = [];
      inputs.forEach(input => {
        if(input.value.trim() !== '') {
          jugadores.push(input.value.trim());
        }
      });

      if (jugadores.length < 2) {
        alert('Necesitás al menos 2 participantes para generar los cruces.');
        return;
      }

      // Mezclar los jugadores al azar para el fixture
      jugadores = jugadores.sort(() => Math.random() - 0.5);

      // Ocultar el formulario
      form.style.display = 'none';
      
      // Crear contenedor principal de la vista del torneo
      const pageShell = document.querySelector('.page-shell');
      const bracketDiv = document.createElement('div');
      bracketDiv.id = 'bracket-view';
      bracketDiv.className = 'form-card'; 
      
      const nombreTorneo = document.querySelector('#name').value || 'Sin Nombre';
      
      bracketDiv.innerHTML = `
        <div class="eyebrow">Torneo en curso</div>
        <h2 style="font-size: 32px; margin-bottom: 8px;">${nombreTorneo}</h2>
        <p class="page-subtitle" style="margin-bottom: 30px;">Acá tenés los cruces de esta fase. Jugá los partidos y cuando terminen, registrá los ganadores para avanzar.</p>
        <div id="fase-container"></div>
      `;
      
      pageShell.appendChild(bracketDiv);

      // Iniciar la primera ronda
      mostrarFase(jugadores);
    });
  }

  // Función para renderizar la lista de partidos de la fase actual
  window.mostrarFase = function(jugadores) {
    const container = document.getElementById('fase-container');
    container.innerHTML = '';
    
    // Si solo queda un jugador, es el campeón
    if (jugadores.length === 1) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; background: var(--mist); border-radius: 16px;">
          <div style="font-size: 48px; margin-bottom: 16px;">🏆</div>
          <h2 style="color: #4e6b15; font-size: 32px; margin: 0 0 10px;">¡Campeón!</h2>
          <h3 style="font-size: 28px; margin: 0 0 30px;">${jugadores[0]}</h3>
          <button class="button primary" onclick="location.reload()">Organizar nuevo torneo</button>
        </div>`;
      return;
    }

    // Título de la ronda
    const tituloFase = document.createElement('h3');
    tituloFase.textContent = jugadores.length === 2 ? 'Gran Final' : `Fase de ${jugadores.length}`;
    tituloFase.style.fontSize = '20px';
    tituloFase.style.marginBottom = '20px';
    tituloFase.style.borderBottom = '1px solid var(--line)';
    tituloFase.style.paddingBottom = '15px';
    container.appendChild(tituloFase);

    // Contenedor de la lista de partidos
    const listaPartidos = document.createElement('div');
    listaPartidos.style.display = 'flex';
    listaPartidos.style.flexDirection = 'column';
    listaPartidos.style.gap = '16px';

    // Armar parejas
    for (let i = 0; i < jugadores.length; i += 2) {
      const j1 = jugadores[i];
      const j2 = jugadores[i+1];
      
      const matchRow = document.createElement('div');
      matchRow.style.display = 'flex';
      matchRow.style.justifyContent = 'space-between';
      matchRow.style.alignItems = 'center';
      matchRow.style.flexWrap = 'wrap';
      matchRow.style.gap = '15px';
      matchRow.style.padding = '18px 24px';
      matchRow.style.border = '1px solid var(--line)';
      matchRow.style.borderRadius = '12px';

      if (j2) {
        matchRow.innerHTML = `
          <div style="display:flex; align-items:center; gap: 15px; font-weight: 600; font-size: 16px;">
            <span>${j1}</span>
            <span style="color:var(--muted); font-size:12px; font-weight:bold;">VS</span>
            <span>${j2}</span>
          </div>
          <div>
            <select class="ganador-select" style="padding: 10px 14px; border-radius: 8px; border: 1px solid var(--line); font-weight:500; cursor:pointer;">
              <option value="">Registrar ganador...</option>
              <option value="${j1}">${j1}</option>
              <option value="${j2}">${j2}</option>
            </select>
          </div>
        `;
      } else {
        // Si hay cantidad impar de jugadores, el último pasa directo
        matchRow.innerHTML = `
          <div style="font-weight: 600; font-size: 16px;">${j1}</div>
          <div style="color: var(--muted); font-size:14px; background: var(--mist); padding: 6px 12px; border-radius: 6px;">Pasa directo (Sin rival)</div>
          <input type="hidden" class="ganador-select" value="${j1}">
        `;
      }
      
      listaPartidos.appendChild(matchRow);
    }
    
    container.appendChild(listaPartidos);

    // Botón para procesar toda la ronda junta
    const btnAvanzar = document.createElement('button');
    btnAvanzar.className = 'button primary';
    btnAvanzar.style.width = '100%';
    btnAvanzar.style.marginTop = '30px';
    btnAvanzar.textContent = 'Guardar resultados y avanzar a la siguiente fase';
    btnAvanzar.onclick = procesarResultados;
    
    container.appendChild(btnAvanzar);
  };

  // Función para validar que se hayan cargado los resultados y pasar de ronda
  window.procesarResultados = function() {
    const selects = document.querySelectorAll('.ganador-select');
    let ganadores = [];
    let faltanResultados = false;

    selects.forEach(select => {
      if (!select.value) {
        faltanResultados = true;
      } else {
        ganadores.push(select.value);
      }
    });

    if (faltanResultados) {
      alert('Por favor, seleccioná al ganador de todos los partidos antes de avanzar.');
      return;
    }

    // Limpiar pantalla y mostrar la siguiente fase con los ganadores
    mostrarFase(ganadores);
  };
});