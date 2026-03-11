/**
 * RevisionAR · db.js  (versión global, sin ES modules)
 * Incluir con <script src="js/db.js"> ANTES del script principal.
 * Expone window.RevDB con todos los métodos.
 */
(function () {
  const DB_NAME    = 'revisionAR';
  const DB_VERSION = 2;

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('articulos')) {
          const st = db.createObjectStore('articulos', { keyPath: 'codigo' });
          st.createIndex('by_estado',      'estado');
          st.createIndex('by_autor_email', 'autorEmail');
        }
        if (!db.objectStoreNames.contains('revisiones')) {
          const st = db.createObjectStore('revisiones', { keyPath: 'id', autoIncrement: true });
          st.createIndex('by_articulo', 'codigoArticulo');
          st.createIndex('by_revisor',  'revisorEmail');
        }
        if (!db.objectStoreNames.contains('comentarios')) {
          const st = db.createObjectStore('comentarios', { keyPath: 'id', autoIncrement: true });
          st.createIndex('by_articulo', 'codigoArticulo');
        }
        if (!db.objectStoreNames.contains('sync_queue')) {
          const st = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
          st.createIndex('by_tipo', 'tipo');
        }
        if (!db.objectStoreNames.contains('revisores')) {
          db.createObjectStore('revisores', { keyPath: 'email' });
        }
      };
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror   = (e) => reject(e.target.error);
    });
  }

  async function getAll(store, index, query) {
    const db  = await openDB();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(store, 'readonly');
      const st  = tx.objectStore(store);
      const src = index ? st.index(index) : st;
      const req = query !== undefined ? src.getAll(query) : src.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
  }

  async function getOne(store, key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction(store, 'readonly').objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
  }

  async function putOne(store, data) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction(store, 'readwrite').objectStore(store).put(data);
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
  }

  async function removeOne(store, key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction(store, 'readwrite').objectStore(store).delete(key);
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  }

  const articulos = {
    async guardar(a) {
      a.updatedAt = new Date().toISOString();
      if (!a.createdAt) a.createdAt = a.updatedAt;
      return putOne('articulos', a);
    },
    async obtener(codigo)   { return getOne('articulos', codigo); },
    async listar()          { return getAll('articulos'); },
    async porEstado(estado) { return getAll('articulos', 'by_estado', estado); },
    async porAutor(email)   { return getAll('articulos', 'by_autor_email', email); },
  };

  const revisiones = {
    async guardar(r) {
      r.updatedAt = new Date().toISOString();
      return putOne('revisiones', r);
    },
    async porArticulo(codigo) { return getAll('revisiones', 'by_articulo', codigo); },
    async porRevisor(email)   { return getAll('revisiones', 'by_revisor', email); },
    async listar()            { return getAll('revisiones'); },
  };

  const revisores = {
    async guardar(r)     { return putOne('revisores', r); },
    async listar()       { return getAll('revisores'); },
    async obtener(email) { return getOne('revisores', email); },
  };

  const syncQueue = {
    async encolar(tipo, payload) {
      return putOne('sync_queue', { tipo, payload, timestamp: new Date().toISOString(), intentos: 0 });
    },
    async obtenerPendientes() { return getAll('sync_queue'); },
    async eliminar(id)        { return removeOne('sync_queue', id); },
  };

  async function seedDemoData() {
    const existente = await articulos.listar();
    if (existente.length > 0) return;

    const artDemo = [
      {
        codigo: 'ART-2026-001',
        titulo: 'Impacto del aprendizaje automático en diagnóstico médico temprano',
        autorNombre: 'Mtra. Andrea López', autorEmail: 'andrea@universidad.edu',
        institucion: 'UNAM · Facultad de Medicina', area: 'Inteligencia Artificial',
        resumen: 'Este trabajo analiza el rendimiento de modelos de deep learning aplicados al diagnóstico temprano de enfermedades crónicas, comparando precisión contra métodos convencionales en una muestra de 2,400 pacientes.',
        estado: 'revision', fechaEnvio: '2026-01-15', fechaLimite: '2026-03-20',
        archivo: 'manuscrito-lopez-2026.pdf', revisiones: 2, revisionesCompletas: 1,
        claveAcceso: 'autor123', sincronizado: true,
      },
      {
        codigo: 'ART-2026-002',
        titulo: 'Modelos predictivos de deserción escolar en educación superior',
        autorNombre: 'Dr. Roberto Salinas', autorEmail: 'roberto@tec.mx',
        institucion: 'Tec de Monterrey', area: 'Educación y Tecnología',
        resumen: 'Propuesta de un modelo de machine learning para identificar factores de riesgo de deserción en estudiantes de primer año.',
        estado: 'pendiente', fechaEnvio: '2026-02-03', fechaLimite: '2026-04-03',
        archivo: 'salinas-desercion-2026.pdf', revisiones: 2, revisionesCompletas: 0,
        claveAcceso: 'rob456', sincronizado: true,
      },
      {
        codigo: 'ART-2026-003',
        titulo: 'Análisis de redes neuronales para predicción climática regional',
        autorNombre: 'Dra. Carmen Ruiz', autorEmail: 'carmen@ciencias.unam.mx',
        institucion: 'UNAM · Ciencias Atmosféricas', area: 'Ciencias Ambientales',
        resumen: 'Comparación de arquitecturas LSTM y Transformer para la predicción de precipitaciones en la cuenca del Valle de México.',
        estado: 'aceptado', fechaEnvio: '2025-11-20', fechaLimite: '2026-01-20',
        archivo: 'ruiz-clima-2025.pdf', revisiones: 2, revisionesCompletas: 2,
        claveAcceso: 'carm789', sincronizado: true,
      },
      {
        codigo: 'ART-2026-004',
        titulo: 'Eficacia de metodologías activas en aulas de ingeniería',
        autorNombre: 'Dr. Luis Mendoza', autorEmail: 'luis@uam.mx',
        institucion: 'UAM · División de Ciencias Básicas', area: 'Educación y Tecnología',
        resumen: 'Estudio comparativo del rendimiento académico con ABP, gamificación y clase magistral en tres generaciones de estudiantes.',
        estado: 'rechazado', fechaEnvio: '2025-10-05', fechaLimite: '2025-12-05',
        archivo: 'mendoza-metodologias-2025.pdf', revisiones: 2, revisionesCompletas: 2,
        claveAcceso: 'luis000', sincronizado: true,
      },
    ];

    const revisoresDemo = [
      { email: 'sofia@ingenieria.unam.mx', nombre: 'Ing. Sofía Mendoza',  especialidad: 'Inteligencia Artificial',   carga: 2, disponible: true },
      { email: 'jose@ciencias.ipn.mx',    nombre: 'Dr. José Hernández',   especialidad: 'Estadística Computacional', carga: 1, disponible: true },
      { email: 'lucia@tec.mx',            nombre: 'Dra. Lucía Gómez',     especialidad: 'Educación y Tecnología',    carga: 2, disponible: true },
      { email: 'pedro@uam.mx',            nombre: 'Dr. Pedro Vásquez',    especialidad: 'Ciencias Ambientales',      carga: 0, disponible: true },
    ];

    for (const a of artDemo)       await articulos.guardar(a);
    for (const r of revisoresDemo) await revisores.guardar(r);

    await revisiones.guardar({
      codigoArticulo: 'ART-2026-001', revisorEmail: 'sofia@ingenieria.unam.mx',
      revisorNombre: 'Ing. Sofía Mendoza', estado: 'completada',
      fechaAsignacion: '2026-01-18', fechaLimite: '2026-03-20',
      recomendacion: 'aceptar-cambios',
      puntajes: { originalidad: 4, metodologia: 5, claridad: 4, relevancia: 5 },
      comentariosGeneral: 'Trabajo sólido con metodología bien fundamentada. Sugiero justificar el tamaño de la muestra y añadir tabla comparativa.',
    });
    await revisiones.guardar({
      codigoArticulo: 'ART-2026-001', revisorEmail: 'jose@ciencias.ipn.mx',
      revisorNombre: 'Dr. José Hernández', estado: 'en_progreso',
      fechaAsignacion: '2026-01-18', fechaLimite: '2026-03-20',
      recomendacion: null, puntajes: {}, comentariosGeneral: '',
    });
    // Revisión asignada a Sofía para que pueda ver el formulario
    await revisiones.guardar({
      codigoArticulo: 'ART-2026-002', revisorEmail: 'sofia@ingenieria.unam.mx',
      revisorNombre: 'Ing. Sofía Mendoza', estado: 'pendiente',
      fechaAsignacion: '2026-02-05', fechaLimite: '2026-04-03',
      recomendacion: null, puntajes: {}, comentariosGeneral: '',
    });

    console.log('✅ Datos demo cargados en IndexedDB');
  }

  window.RevDB = { openDB, articulos, revisiones, revisores, syncQueue, seedDemoData };
})();
