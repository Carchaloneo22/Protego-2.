/* =======================================================
   PROTEGO · Lógica del cliente
   ======================================================= */
(() => {
  'use strict';

  // ----------------- Configuración -----------------
  const CONFIG = {
    // Cambia a false cuando conectes con el backend PHP/PostgreSQL real.
    useDemo: true,
    api: {
      matriz:    'api/matriz.php',
      cobertura: 'api/cobertura.php',
      cargos:    'api/cargos.php',
      evaluar:   'api/evaluacion.php',
      grid:      'api/matriz_grid.php',
    },
  };

  // ----------------- Datos de demo (replican la matriz original) ----
  const DEMO = {
    matriz: [
      { cargo_id:1, cargo:'Operario de Alturas',       area:'Producción',    riesgo_id:1, riesgo:'Caída de Alturas',       riesgo_categoria:'locativo',   probabilidad:'MUY ALTA', consecuencia:'MUY GRAVE', nivel:'I',   valoracion:4000, controlado:true,  clasificacion:'critico', epps_requeridos:['Arnés de seguridad','Casco de seguridad','Botas con puntera de acero','Línea de vida'] },
      { cargo_id:3, cargo:'Técnico Eléctrico',         area:'Mantenimiento', riesgo_id:11,riesgo:'Explosión / Incendio',   riesgo_categoria:'físico-químico', probabilidad:'MUY ALTA', consecuencia:'MUY GRAVE', nivel:'I', valoracion:3600, controlado:true,  clasificacion:'critico', epps_requeridos:['Guantes dieléctricos','Casco dieléctrico Clase E','Botas dieléctricas'] },
      { cargo_id:5, cargo:'Oficinista / Administrativo', area:'Administración', riesgo_id:12, riesgo:'Fatiga Visual',     riesgo_categoria:'ergonómico', probabilidad:'ALTA',     consecuencia:'LEVE',       nivel:'III', valoracion:90, controlado:false, clasificacion:'medio',   epps_requeridos:['Soporte lumbar','Silla ergonómica'] },
      { cargo_id:2, cargo:'Operario de Maquinaria',    area:'Producción',    riesgo_id:2, riesgo:'Ruido de Maquinaria',    riesgo_categoria:'físico',     probabilidad:'ALTA',     consecuencia:'MODERADA',   nivel:'II',  valoracion:450,  controlado:true,  clasificacion:'alto',    epps_requeridos:['Protector auditivo'] },
      { cargo_id:2, cargo:'Operario de Maquinaria',    area:'Producción',    riesgo_id:3, riesgo:'Atrapamiento',           riesgo_categoria:'mecánico',   probabilidad:'ALTA',     consecuencia:'MODERADA',   nivel:'II',  valoracion:360,  controlado:false, clasificacion:'alto',    epps_requeridos:['Guantes de seguridad','Gafas de seguridad'] },
      { cargo_id:6, cargo:'Operario General',          area:'Producción',    riesgo_id:7, riesgo:'Golpes por Objetos',     riesgo_categoria:'mecánico',   probabilidad:'ALTA',     consecuencia:'MODERADA',   nivel:'II',  valoracion:300,  controlado:true,  clasificacion:'alto',    epps_requeridos:['Casco de seguridad','Botas con puntera de acero'] },
      { cargo_id:3, cargo:'Técnico Eléctrico',         area:'Mantenimiento', riesgo_id:4, riesgo:'Contacto Eléctrico',     riesgo_categoria:'eléctrico',  probabilidad:'ALTA',     consecuencia:'GRAVE',      nivel:'I',   valoracion:600,  controlado:true,  clasificacion:'critico', epps_requeridos:['Guantes dieléctricos','Casco dieléctrico Clase E','Botas dieléctricas'] },
      { cargo_id:5, cargo:'Oficinista / Administrativo', area:'Administración', riesgo_id:6, riesgo:'Postura Prolongada', riesgo_categoria:'ergonómico', probabilidad:'MEDIA',    consecuencia:'LEVE',       nivel:'III', valoracion:60,   controlado:false, clasificacion:'medio',   epps_requeridos:['Soporte lumbar','Silla ergonómica'] },
      { cargo_id:7, cargo:'Operario de Exteriores',    area:'Logística',     riesgo_id:8, riesgo:'Calor Extremo',          riesgo_categoria:'físico',     probabilidad:'MEDIA',    consecuencia:'LEVE',       nivel:'III', valoracion:60,   controlado:true,  clasificacion:'medio',   epps_requeridos:['Ropa térmica / alta visibilidad'] },
      { cargo_id:8, cargo:'Operario con Partículas',   area:'Producción',    riesgo_id:10,riesgo:'Partículas en Ojos',     riesgo_categoria:'físico',     probabilidad:'MEDIA',    consecuencia:'LEVE',       nivel:'III', valoracion:80,   controlado:true,  clasificacion:'medio',   epps_requeridos:['Gafas de seguridad'] },
      { cargo_id:4, cargo:'Operario Expuesto a Polvo', area:'Producción',    riesgo_id:5, riesgo:'Inhalación de Polvo',    riesgo_categoria:'químico',    probabilidad:'MEDIA',    consecuencia:'GRAVE',      nivel:'II',  valoracion:180,  controlado:true,  clasificacion:'alto',    epps_requeridos:['Respirador N95'] },
      { cargo_id:7, cargo:'Operario de Exteriores',    area:'Logística',     riesgo_id:9, riesgo:'Picaduras / Mordeduras', riesgo_categoria:'biológico',  probabilidad:'BAJA',     consecuencia:'LEVE',       nivel:'IV',  valoracion:20,   controlado:false, clasificacion:'bajo',    epps_requeridos:['Ropa manga larga','Repelente de insectos'] },
    ],
    cobertura: {
      data: [
        { trabajador_id:1, documento:'CC-1001', trabajador:'Carlos Pérez Márquez',  cargo:'Operario de Alturas',       requeridos:4, asignados:4, porcentaje_cobertura:100, semaforo:'verde' },
        { trabajador_id:3, documento:'CC-1003', trabajador:'Andrés Torres Silva',   cargo:'Técnico Eléctrico',         requeridos:3, asignados:3, porcentaje_cobertura:100, semaforo:'verde' },
        { trabajador_id:5, documento:'CC-1005', trabajador:'Juan Castillo Ramírez', cargo:'Operario General',          requeridos:3, asignados:3, porcentaje_cobertura:100, semaforo:'verde' },
        { trabajador_id:2, documento:'CC-1002', trabajador:'Luisa Gómez Ruiz',      cargo:'Operario de Maquinaria',    requeridos:4, asignados:2, porcentaje_cobertura:50,  semaforo:'amarillo' },
        { trabajador_id:6, documento:'CC-1006', trabajador:'Paola Jiménez Arce',    cargo:'Operario de Exteriores',    requeridos:3, asignados:2, porcentaje_cobertura:67,  semaforo:'amarillo' },
        { trabajador_id:4, documento:'CC-1004', trabajador:'María Herrera Vanegas', cargo:'Oficinista / Administrativo', requeridos:2, asignados:0, porcentaje_cobertura:0,   semaforo:'rojo' },
      ],
      resumen: { verde:3, amarillo:2, rojo:1, promedio:70, total:6 },
    },
  };

  // ----- Clasificación de cada celda de la matriz NP × NC -----
  // Regla visual que reproduce la imagen del enunciado.
  const GRID_NIVEL = {
    'MUY ALTA|LEVE':     'II',
    'MUY ALTA|MODERADA': 'I',
    'MUY ALTA|GRAVE':    'I',
    'MUY ALTA|MUY GRAVE':'I',
    'ALTA|LEVE':         'III',
    'ALTA|MODERADA':     'II',
    'ALTA|GRAVE':        'I',
    'ALTA|MUY GRAVE':    'I',
    'MEDIA|LEVE':        'III',
    'MEDIA|MODERADA':    'II',
    'MEDIA|GRAVE':       'II',
    'MEDIA|MUY GRAVE':   'I',
    'BAJA|LEVE':         'IV',
    'BAJA|MODERADA':     'III',
    'BAJA|GRAVE':        'III',
    'BAJA|MUY GRAVE':    'II',
  };

  // ----------------- Estado de UI -----------------
  const state = {
    view: 'matriz',          // matriz | cobertura
    nivel: 'all',            // all | I | II | III | IV
    query: '',
    cargoId: '',
    semaforo: 'all',
    matriz: [],
    cobertura: [],
    coberturaResumen: null,
  };

  // ----------------- Helpers DOM -----------------
  const $  = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  const iconCheck = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  const iconX     = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

  const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g,
    c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // ----------------- Fetchers -----------------
  async function fetchJSON(url) {
    const r = await fetch(url, { headers: {'Accept':'application/json'} });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }

  async function loadMatriz() {
    if (CONFIG.useDemo) return { data: DEMO.matriz };
    const params = new URLSearchParams();
    if (state.nivel !== 'all') params.set('nivel', state.nivel);
    if (state.cargoId)         params.set('cargo_id', state.cargoId);
    if (state.query)           params.set('q', state.query);
    return fetchJSON(`${CONFIG.api.matriz}?${params}`);
  }

  async function loadCobertura() {
    if (CONFIG.useDemo) return DEMO.cobertura;
    const params = new URLSearchParams();
    if (state.cargoId)             params.set('cargo_id', state.cargoId);
    if (state.semaforo !== 'all')  params.set('semaforo', state.semaforo);
    return fetchJSON(`${CONFIG.api.cobertura}?${params}`);
  }

  async function toggleControlado(cargoId, riesgoId, controlado) {
    if (CONFIG.useDemo) {
      // En modo demo actualizamos en memoria
      const row = state.matriz.find(r => r.cargo_id === cargoId && r.riesgo_id === riesgoId);
      if (row) row.controlado = controlado;
      return { ok: true };
    }
    const r = await fetch(CONFIG.api.evaluar, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ cargo_id: cargoId, riesgo_id: riesgoId, controlado })
    });
    return r.json();
  }

  // ----------------- Render: KPIs -----------------
  function renderKPIs() {
    const rows = applyFilters(state.matriz);
    const counts = { critico:0, alto:0, medio:0, bajo:0, total: rows.length };
    for (const r of rows) counts[r.clasificacion]++;

    $('#kpi-critico').textContent = counts.critico;
    $('#kpi-alto').textContent    = counts.alto;
    $('#kpi-medio').textContent   = counts.medio;
    $('#kpi-bajo').textContent    = counts.bajo;
    $('#kpi-total').textContent   = counts.total;

    // Tab counts
    $('#tab-matriz .count').textContent    = state.matriz.length;
    if (state.cobertura.length) {
      $('#tab-cobertura .count').textContent = state.cobertura.length;
    }
  }

  // ----------------- Render: Matriz (tabla + cards) -----------------
  function applyFilters(rows) {
    const q = state.query.trim().toLowerCase();
    return rows.filter(r => {
      if (state.nivel !== 'all' && r.nivel !== state.nivel) return false;
      if (state.cargoId && String(r.cargo_id) !== String(state.cargoId)) return false;
      if (q && !(r.cargo.toLowerCase().includes(q) || r.riesgo.toLowerCase().includes(q))) return false;
      return true;
    });
  }

  function rowHTMLTable(r) {
    const eppsHTML = (r.epps_requeridos ?? []).map(e =>
      `<span class="epp-chip">${escapeHtml(e)}</span>`
    ).join('');
    const toggleClass = r.controlado ? 'toggle-check on' : 'toggle-check';
    return `
      <tr data-cargo="${r.cargo_id}" data-riesgo="${r.riesgo_id}">
        <td class="cell-cargo">
          <div class="cargo-name">${escapeHtml(r.cargo)}</div>
          <div class="cargo-area">${escapeHtml(r.area || '')}</div>
        </td>
        <td class="cell-riesgo">
          <div class="riesgo-name">${escapeHtml(r.riesgo)}</div>
          <div class="riesgo-cat">${escapeHtml(r.riesgo_categoria || '')}</div>
        </td>
        <td>
          <span class="nivel-tag nivel-${r.nivel}">
            ${r.nivel}
            <span class="valor">${r.valoracion}</span>
          </span>
        </td>
        <td>
          <div class="epp-list">${eppsHTML || '<span class="epp-chip">—</span>'}</div>
        </td>
        <td>
          <div class="${toggleClass}" role="switch" aria-checked="${r.controlado}"
               data-action="toggle-control">
            <span class="knob"></span>
          </div>
        </td>
        <td>
          <span class="cell-badge badge-${r.clasificacion}">
            ${nivelLabel(r.clasificacion)}
          </span>
        </td>
      </tr>
    `;
  }

  function rowHTMLCard(r) {
    const eppsHTML = (r.epps_requeridos ?? []).map(e =>
      `<span class="epp-chip">${escapeHtml(e)}</span>`
    ).join('');
    const toggleClass = r.controlado ? 'toggle-check on' : 'toggle-check';
    return `
      <article class="risk-card lvl-${r.nivel}" data-cargo="${r.cargo_id}" data-riesgo="${r.riesgo_id}">
        <header class="risk-card__head">
          <div>
            <div class="risk-card__title">${escapeHtml(r.riesgo)}</div>
            <div class="risk-card__cargo">${escapeHtml(r.cargo)}</div>
          </div>
          <span class="cell-badge badge-${r.clasificacion}">${nivelLabel(r.clasificacion)}</span>
        </header>
        <div class="risk-card__meta">
          <div>
            <span class="label">Nivel</span>
            <span class="value"><span class="nivel-tag nivel-${r.nivel}">${r.nivel}</span></span>
          </div>
          <div>
            <span class="label">Valoración</span>
            <span class="value">${r.valoracion}</span>
          </div>
        </div>
        <div class="risk-card__epps">
          <div class="label" style="font-family:var(--font-mono);font-size:9px;color:var(--ink-3);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">EPP Requeridos</div>
          <div class="epp-list">${eppsHTML || '<span class="epp-chip">—</span>'}</div>
        </div>
        <footer class="risk-card__footer">
          <span style="font-family:var(--font-mono);font-size:10px;color:var(--ink-2);text-transform:uppercase;letter-spacing:1px;">
            ${r.controlado ? 'Controlado' : 'Sin control'}
          </span>
          <div class="${toggleClass}" role="switch" aria-checked="${r.controlado}"
               data-action="toggle-control">
            <span class="knob"></span>
          </div>
        </footer>
      </article>
    `;
  }

  function nivelLabel(clasif) {
    return ({critico:'Crítico', alto:'Alto', medio:'Medio', bajo:'Bajo'})[clasif] ?? clasif;
  }

  function renderMatriz() {
    const rows = applyFilters(state.matriz);
    const tbody  = $('#matrix-tbody');
    const cards  = $('#matrix-cards');

    if (!rows.length) {
      const empty = `<div class="state">Sin resultados para los filtros actuales</div>`;
      tbody.innerHTML  = `<tr><td colspan="6" class="state">Sin resultados</td></tr>`;
      cards.innerHTML  = empty;
      return;
    }
    tbody.innerHTML = rows.map(rowHTMLTable).join('');
    cards.innerHTML = rows.map(rowHTMLCard).join('');
  }

  // ----------------- Render: Cobertura -----------------
  function coverageCardHTML(w) {
    return `
      <article class="coverage-card sem-${w.semaforo}">
        <header class="coverage-card__head">
          <div>
            <div class="coverage-card__name">${escapeHtml(w.trabajador)}</div>
            <div class="coverage-card__doc">${escapeHtml(w.documento)}</div>
            <div class="coverage-card__cargo">${escapeHtml(w.cargo)}</div>
          </div>
          <div class="sem-lights" aria-label="Semáforo ${w.semaforo}">
            <span class="light rojo"></span>
            <span class="light amarillo"></span>
            <span class="light verde"></span>
          </div>
        </header>
        <div class="coverage-card__pct">
          <span class="num">${w.porcentaje_cobertura}</span>
          <span class="sign">%</span>
        </div>
        <div class="coverage-card__ratio">
          ${w.asignados} / ${w.requeridos} EPP asignados
        </div>
        <div class="progress">
          <div class="progress__bar" style="width:${w.porcentaje_cobertura}%;"></div>
        </div>
      </article>
    `;
  }

  function renderCobertura() {
    let rows = state.cobertura;
    if (state.semaforo !== 'all') rows = rows.filter(r => r.semaforo === state.semaforo);
    if (state.cargoId)            rows = rows.filter(r => String(r.cargo_id ?? '') === String(state.cargoId) || r.cargo === lookupCargoNameById(state.cargoId));

    const grid = $('#coverage-grid');
    if (!rows.length) {
      grid.innerHTML = `<div class="state">Sin trabajadores para los filtros actuales</div>`;
      return;
    }
    grid.innerHTML = rows.map(coverageCardHTML).join('');

    // Resumen
    if (state.coberturaResumen) {
      $('#cov-verde').textContent    = state.coberturaResumen.verde;
      $('#cov-amarillo').textContent = state.coberturaResumen.amarillo;
      $('#cov-rojo').textContent     = state.coberturaResumen.rojo;
      $('#cov-promedio').textContent = state.coberturaResumen.promedio + '%';
    }
    $('#tab-cobertura .count').textContent = state.cobertura.length;
  }

  function lookupCargoNameById(id) {
    const row = state.matriz.find(r => String(r.cargo_id) === String(id));
    return row ? row.cargo : '';
  }

  // ----------------- Render: Matriz NP × NC -----------------
  function buildGridFromMatriz(rows) {
    // Agrupa los riesgos por celda (probabilidad × consecuencia)
    const buckets = {};
    for (const k of Object.keys(GRID_NIVEL)) {
      buckets[k] = { count: 0, items: [] };
    }
    for (const r of rows) {
      if (!r.probabilidad || !r.consecuencia) continue;
      const key = `${r.probabilidad}|${r.consecuencia}`;
      if (!buckets[key]) buckets[key] = { count: 0, items: [] };
      buckets[key].count++;
      buckets[key].items.push({ cargo: r.cargo, riesgo: r.riesgo, controlado: r.controlado });
    }
    return buckets;
  }

  function renderGrid() {
    const buckets = buildGridFromMatriz(state.matriz);
    let totalI = 0, totalII = 0, totalIII = 0, totalIV = 0;

    $$('.rm-cell').forEach(cell => {
      const key   = cell.dataset.cell;
      const nivel = GRID_NIVEL[key] || 'IV';
      const data  = buckets[key] || { count: 0, items: [] };

      // Clase de nivel + cantidad
      cell.classList.remove('lvl-I','lvl-II','lvl-III','lvl-IV');
      cell.classList.add('lvl-' + nivel);
      cell.dataset.count = String(data.count);

      // Acumulador para pestaña
      if (data.count) {
        if (nivel === 'I')   totalI   += data.count;
        if (nivel === 'II')  totalII  += data.count;
        if (nivel === 'III') totalIII += data.count;
        if (nivel === 'IV')  totalIV  += data.count;
      }

      // Contenido (contador + tooltip)
      let html = '';
      if (data.count > 0) {
        html += `<span class="rm-count" aria-label="${data.count} riesgos">${data.count}</span>`;
        const items = data.items.map(it =>
          `<li><span class="cargo">${escapeHtml(it.cargo)}</span>${escapeHtml(it.riesgo)}</li>`
        ).join('');
        html += `<div class="rm-tooltip" role="tooltip">
                   <b>${escapeHtml(key.replace('|',' × '))} · Nivel ${nivel}</b>
                   <ul>${items}</ul>
                 </div>`;
      }
      cell.innerHTML = html;
    });

    // Actualiza contador de la pestaña con el total de evaluaciones en la matriz
    $('#tab-grid .count').textContent = (totalI + totalII + totalIII + totalIV);
  }

  // ----------------- Select de cargos -----------------
  function populateCargoSelect() {
    const sel = $('#filter-cargo');
    const unique = new Map();
    for (const r of state.matriz) unique.set(r.cargo_id, r.cargo);
    sel.innerHTML = `<option value="">Todos los cargos</option>` +
      [...unique].map(([id, name]) => `<option value="${id}">${escapeHtml(name)}</option>`).join('');
  }

  // ----------------- Eventos -----------------
  function bindEvents() {
    // Tabs
    $$('.tab').forEach(t => t.addEventListener('click', () => {
      $$('.tab').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      state.view = t.dataset.view;
      $$('.view').forEach(v => v.classList.remove('active'));
      $(`#view-${state.view}`).classList.add('active');
    }));

    // Filtros de nivel
    $$('.filter-chip[data-nivel]').forEach(b => b.addEventListener('click', () => {
      $$('.filter-chip[data-nivel]').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      state.nivel = b.dataset.nivel;
      renderMatriz(); renderKPIs();
    }));

    // Filtros de semáforo
    $$('.filter-chip[data-sem]').forEach(b => b.addEventListener('click', () => {
      $$('.filter-chip[data-sem]').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      state.semaforo = b.dataset.sem;
      renderCobertura();
    }));

    // Select cargo
    $('#filter-cargo').addEventListener('change', (e) => {
      state.cargoId = e.target.value;
      renderMatriz(); renderCobertura(); renderKPIs();
    });

    // Búsqueda
    let debounce;
    $('#search-input').addEventListener('input', (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        state.query = e.target.value;
        renderMatriz(); renderKPIs();
      }, 150);
    });

    // Toggle control (delegación)
    document.addEventListener('click', async (e) => {
      const toggle = e.target.closest('[data-action="toggle-control"]');
      if (!toggle) return;
      const host   = toggle.closest('[data-cargo]');
      const cargo  = Number(host.dataset.cargo);
      const riesgo = Number(host.dataset.riesgo);
      const isOn   = toggle.classList.contains('on');
      toggle.classList.toggle('on', !isOn);
      toggle.setAttribute('aria-checked', String(!isOn));
      // Sincroniza todas las vistas del mismo par
      $$(`[data-cargo="${cargo}"][data-riesgo="${riesgo}"] [data-action="toggle-control"]`)
        .forEach(el => { el.classList.toggle('on', !isOn); el.setAttribute('aria-checked', String(!isOn)); });
      try {
        await toggleControlado(cargo, riesgo, !isOn);
        // También actualizamos el estado en memoria para sincronizar el grid
        const row = state.matriz.find(r => r.cargo_id === cargo && r.riesgo_id === riesgo);
        if (row) row.controlado = !isOn;
        renderGrid();
      } catch (err) {
        // revert
        toggle.classList.toggle('on', isOn);
        console.error('No se pudo actualizar:', err);
      }
    });
  }

  // ----------------- Inicialización -----------------
  async function init() {
    bindEvents();
    const statusEl = $('#status-mode');
    statusEl.textContent = CONFIG.useDemo ? 'Modo demo' : 'Conectado a PostgreSQL';

    try {
      const m = await loadMatriz();
      state.matriz = m.data || [];
      populateCargoSelect();
      renderMatriz();
      renderGrid();

      const c = await loadCobertura();
      state.cobertura        = c.data || [];
      state.coberturaResumen = c.resumen || null;
      renderCobertura();

      renderKPIs();
    } catch (err) {
      console.error(err);
      $('#matrix-tbody').innerHTML =
        `<tr><td colspan="6" class="state error">Error al cargar datos: ${escapeHtml(err.message)}</td></tr>`;
      $('#matrix-cards').innerHTML =
        `<div class="state error">Error al cargar datos: ${escapeHtml(err.message)}</div>`;
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
