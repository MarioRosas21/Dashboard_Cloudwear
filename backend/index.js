require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();

// Middleware para permitir CORS en todas las rutas
app.use(cors());

// Para interpretar JSON en requests
app.use(express.json());

// Crear servidor HTTP
const server = http.createServer(app);

// Inicializar Socket.IO con configuración CORS
const io = new Server(server, {
  cors: {
    origin: "*", // o puedes restringir a tu frontend ej: 'http://localhost:3000'
    methods: ["GET", "POST"],
  },
});

// Aquí puedes poner tu lógica de rutas y sockets


const mongoUri = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

function getDb() {
  const db = mongoose.connection.db;
  if (!db) throw new Error('Base de datos no disponible aún');
  return db;
}

// Si está en producción, servir React build
if (process.env.NODE_ENV === "production") {
  const buildPath = path.join(__dirname, "../build");
  app.use(express.static(buildPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
}

// Conexión a MongoDB y arranque del servidor
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("✅ MongoDB conectado");
  server.listen(PORT, () => {   // <-- Aquí
    console.log(`🚀 Backend corriendo en puerto ${PORT}`);
  });
})

// Nombre unificado de colección userstatus
const userStatusCollectionName = 'userstatuses'; // Ajusta aquí si es otro nombre

// Endpoint para traer todos los documentos de todas las colecciones registros_
app.get('/api/datos', async (req, res) => {
  try {
    const db = mongoose.connection.db;

    const collections = await db.listCollections().toArray();
    const registrosCollections = collections.filter(c => c.name.startsWith('registros_'));

    const usuarios = await db.collection('users').find({}).toArray();
    const userMap = usuarios.reduce((acc, user) => {
      acc[user._id.toString()] = user;
      return acc;
    }, {});

    const estados = await db.collection(userStatusCollectionName).find({}).toArray();
    const estadoMap = estados.reduce((acc, status) => {
      acc[status.authUserId] = status.activo;
      return acc;
    }, {});

    const datosAgrupados = {};

    for (const col of registrosCollections) {
      const registros = await db.collection(col.name).find({}).toArray();

      for (const registro of registros) {
        const userId = registro.userId?.toString();
        if (!userId || !userMap[userId]) continue;

        const fecha = registro.fecha;
        const datos = registro.datos || [];

        if (!datosAgrupados[userId]) {
          const user = userMap[userId];
          datosAgrupados[userId] = {
            userId,
            nombre: `${user.nombre} ${user.apellidoPaterno} ${user.apellidoMaterno}`,
            area: user.datosLaborales?.area || "",
            puesto: user.datosLaborales?.puesto || "",
            email: user.email,
            telefono: user.telefono,
            datos: {},
            ultimaUbicacion: null,
            activo: estadoMap[userId] ?? false
          };
        }

        if (!datosAgrupados[userId].datos[fecha]) {
          datosAgrupados[userId].datos[fecha] = [];
        }

        datosAgrupados[userId].datos[fecha].push(...datos);

        // Última ubicación
        const ultimos = datos.filter(d => d.latitud && d.longitud);
        if (ultimos.length > 0) {
          const ultima = ultimos[ultimos.length - 1];
          datosAgrupados[userId].ultimaUbicacion = {
            lat: ultima.latitud,
            lng: ultima.longitud
          };
        }
      }
    }

    const resultado = Object.values(datosAgrupados);
    res.json(resultado);

  } catch (err) {
    console.error("❌ Error al obtener datos detallados:", err);
    res.status(500).send('Error al obtener datos');
  }
});

// Endpoint para estadísticas por usuario
app.get('/api/estadisticas', async (req, res) => {
  try {
    const db = mongoose.connection.db;

    const usuarios = await db.collection('users').find({}).toArray();
    console.log(`👥 Usuarios encontrados para estadísticas: ${usuarios.length}`);

    const collections = await db.listCollections().toArray();
    const registrosCollections = collections.filter(c => c.name.startsWith('registros_'));
    console.log(`📁 Colecciones registros encontradas para estadísticas: ${registrosCollections.length}`);

    const userStatsMap = {};

    for (const col of registrosCollections) {
      console.log(`📂 Leyendo colección para estadísticas: ${col.name}`);
      const docs = await db.collection(col.name).find().toArray();
      console.log(`📝 Documentos en ${col.name}: ${docs.length}`);

      docs.forEach(doc => {
        const userId = doc.userId?.toString?.();
        const datos = doc.datos || [];

        if (!userId) return;

        if (!userStatsMap[userId]) {
          userStatsMap[userId] = {
            total: 0,
            count: 0,
            max: 0,
            min: Infinity,
            alertasAltas: 0,
            alertasBajas: 0
          };
        }

        datos.forEach(dato => {
          const frecuencia = dato.frecuencia || 0;

          userStatsMap[userId].total += frecuencia;
          userStatsMap[userId].count++;
          if (frecuencia > userStatsMap[userId].max) userStatsMap[userId].max = frecuencia;
          if (frecuencia < userStatsMap[userId].min) userStatsMap[userId].min = frecuencia;

          if (frecuencia > 120) userStatsMap[userId].alertasAltas++;
          if (frecuencia < 60) userStatsMap[userId].alertasBajas++;
        });
      });
    }

    const resultado = usuarios.map(u => {
      const id = u._id.toString();
      const stats = userStatsMap[id] || {
        total: 0,
        count: 0,
        max: 0,
        min: 0,
        alertasAltas: 0,
        alertasBajas: 0
      };

      return {
        userId: id,
        nombre: `${u.nombre} ${u.apellidoPaterno}`,
        frecuenciaPromedio: stats.count ? (stats.total / stats.count).toFixed(2) : 0,
        frecuenciaMaxima: stats.max,
        frecuenciaMinima: stats.min === Infinity ? 0 : stats.min,
        alertasAltas: stats.alertasAltas,
        alertasBajas: stats.alertasBajas
      };
    });

    console.log(`📊 Estadísticas calculadas para ${resultado.length} usuarios`);
    res.json(resultado);

  } catch (err) {
    console.error("❌ Error en /api/estadisticas:", err);
    res.status(500).send('Error al calcular estadísticas');
  }
});

// Endpoint para usuario activo con alertas robustas
app.get('/api/datos', async (req, res) => {
  try {
    const db = getDb();

    const collections = await db.listCollections().toArray();
    const registrosCollections = collections.filter(c => c.name.startsWith('registros_'));

    const usuarios = await db.collection('users').find({}).toArray();
    const userMap = usuarios.reduce((acc, user) => {
      acc[user._id.toString()] = user;
      return acc;
    }, {});

    const estados = await db.collection('userstatuses').find({}).toArray();
    const estadoMap = estados.reduce((acc, status) => {
      acc[status.authUserId] = status.activo;
      return acc;
    }, {});

    const datosAgrupados = {};

    for (const col of registrosCollections) {
      const registros = await db.collection(col.name).find({}).toArray();

      for (const registro of registros) {
        const userId = registro.userId?.toString();
        if (!userId || !userMap[userId]) continue;

        const fecha = registro.fecha;
        const datos = registro.datos || [];

        if (!datosAgrupados[userId]) {
          const user = userMap[userId];
          datosAgrupados[userId] = {
            userId,
            nombre: `${user.nombre} ${user.apellidoPaterno} ${user.apellidoMaterno}`,
            area: user.datosLaborales?.area || "",
            puesto: user.datosLaborales?.puesto || "",
            email: user.email,
            telefono: user.telefono,
            datos: {},
            ultimaUbicacion: null,
            activo: estadoMap[userId] ?? false
          };
        }

        if (!datosAgrupados[userId].datos[fecha]) {
          datosAgrupados[userId].datos[fecha] = [];
        }

        datosAgrupados[userId].datos[fecha].push(...datos);

        // Última ubicación
        const ultimos = datos.filter(d => d.latitud && d.longitud);
        if (ultimos.length > 0) {
          const ultima = ultimos[ultimos.length - 1];
          datosAgrupados[userId].ultimaUbicacion = {
            lat: ultima.latitud,
            lng: ultima.longitud
          };
        }
      }
    }

    res.json(Object.values(datosAgrupados));
  } catch (err) {
    console.error("❌ Error al obtener datos detallados:", err);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
});

// Estadísticas por usuario
app.get('/api/estadisticas', async (req, res) => {
  try {
    const db = getDb();

    const usuarios = await db.collection('users').find({}).toArray();
    const collections = await db.listCollections().toArray();
    const registrosCollections = collections.filter(c => c.name.startsWith('registros_'));

    const userStatsMap = {};

    for (const col of registrosCollections) {
      const docs = await db.collection(col.name).find().toArray();

      docs.forEach(doc => {
        const userId = doc.userId?.toString();
        const datos = doc.datos || [];
        if (!userId) return;

        if (!userStatsMap[userId]) {
          userStatsMap[userId] = {
            total: 0,
            count: 0,
            max: 0,
            min: Infinity,
            alertasAltas: 0,
            alertasBajas: 0
          };
        }

        datos.forEach(dato => {
          const frecuencia = dato.frecuencia || 0;

          userStatsMap[userId].total += frecuencia;
          userStatsMap[userId].count++;
          if (frecuencia > userStatsMap[userId].max) userStatsMap[userId].max = frecuencia;
          if (frecuencia < userStatsMap[userId].min) userStatsMap[userId].min = frecuencia;

          if (frecuencia > 120) userStatsMap[userId].alertasAltas++;
          if (frecuencia < 60) userStatsMap[userId].alertasBajas++;
        });
      });
    }

    const resultado = usuarios.map(u => {
      const id = u._id.toString();
      const stats = userStatsMap[id] || {
        total: 0,
        count: 0,
        max: 0,
        min: 0,
        alertasAltas: 0,
        alertasBajas: 0
      };

      return {
        userId: id,
        nombre: `${u.nombre} ${u.apellidoPaterno}`,
        frecuenciaPromedio: stats.count ? (stats.total / stats.count).toFixed(2) : 0,
        frecuenciaMaxima: stats.max,
        frecuenciaMinima: stats.min === Infinity ? 0 : stats.min,
        alertasAltas: stats.alertasAltas,
        alertasBajas: stats.alertasBajas
      };
    });

    res.json(resultado);
  } catch (err) {
    console.error("❌ Error en /api/estadisticas:", err);
    res.status(500).json({ error: 'Error al calcular estadísticas' });
  }
});

// Tu endpoint actual (puedes dejarlo para pruebas o fallback)
app.get("/api/usuario-activo", async (req, res) => {
  try {
    const data = await fetchUsuarioActivo();
    if (!data) return res.status(404).json({ activo: false, mensaje: "No hay usuarios activos" });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener usuario activo" });
  }
});

// Función que contiene tu lógica para obtener los datos
async function fetchUsuarioActivo() {
  const db = getDb();

  // Cambiado para traer el último usuario sin importar el estado activo
  const ultimoStatus = await db.collection("userstatuses")
    .find({})                  // Sin filtro en activo
    .sort({ fecha: -1 })
    .limit(1)
    .toArray();

  if (!ultimoStatus.length) return null;

  const statusDoc = ultimoStatus[0];
  const authUserId = statusDoc.authUserId;
  const activo = statusDoc.activo;  // guardamos el estado activo

  const usuario = await db.collection("users").findOne({ authUserId });
  if (!usuario) return null;

  const collections = await db.listCollections().toArray();
  const registrosCollections = collections.filter(c => c.name.startsWith("registros_"));

  let todosDatos = [];
  for (const col of registrosCollections) {
    const docs = await db.collection(col.name).find({ userId: authUserId }).toArray();
    for (const doc of docs) {
      if (doc.datos?.length) todosDatos = todosDatos.concat(doc.datos);
    }
  }
  todosDatos.sort((a, b) => a.timestamp - b.timestamp);

  let eventosCriticos = todosDatos.filter(d => d.frecuencia > 120 || d.frecuencia < 60);

  const alertas = {
    frecuenciaCardiaca: eventosCriticos.length > 0,
    movimientoBrusco: todosDatos.some(d => Math.abs(d.x) > 15 || Math.abs(d.y) > 15 || Math.abs(d.z) > 15),
    inactividadProlongada: false,
    bajaVariabilidadFC: false,
  };

  const ms5min = 5 * 60 * 1000;
  function aceleracionDiferencia(d1, d2) {
    if (!d1 || !d2) return Infinity;
    return Math.abs(d1.x - d2.x) + Math.abs(d1.y - d2.y) + Math.abs(d1.z - d2.z);
  }
  outerLoop:
  for (let i = 0; i < todosDatos.length; i++) {
    for (let j = i + 1; j < todosDatos.length; j++) {
      if (todosDatos[j].timestamp - todosDatos[i].timestamp >= ms5min) {
        let inactivo = true;
        for (let k = i; k < j; k++) {
          if (aceleracionDiferencia(todosDatos[k], todosDatos[k + 1]) > 1) {
            inactivo = false;
            break;
          }
        }
        if (inactivo) {
          alertas.inactividadProlongada = true;
          break outerLoop;
        }
      }
    }
  }

  function calcularDesviacionEstandar(arr) {
    const n = arr.length;
    if (n === 0) return 0;
    const media = arr.reduce((a, b) => a + b, 0) / n;
    const varianza = arr.reduce((a, b) => a + (b - media) ** 2, 0) / n;
    return Math.sqrt(varianza);
  }
  const frecuencias = todosDatos.map(d => d.frecuencia).filter(f => typeof f === "number");
  const desvEstFC = calcularDesviacionEstandar(frecuencias);
  alertas.bajaVariabilidadFC = desvEstFC < 5;

  const ultimosConUbicacion = todosDatos.filter(d => d.latitud && d.longitud);
  let ultimaUbicacion = null;
  if (ultimosConUbicacion.length > 0) {
    const ultima = ultimosConUbicacion[ultimosConUbicacion.length - 1];
    ultimaUbicacion = { lat: ultima.latitud, lng: ultima.longitud };
  }

  return {
    registradoEnUserStatuses: true,
    activoAhora: activo,   // <-- devolvemos el estado activo aquí
    usuario: {
      id: usuario._id,
      nombre: `${usuario.nombre} ${usuario.apellidoPaterno} ${usuario.apellidoMaterno}`,
      edad: usuario.edad,
      sexo: usuario.sexo,
      email: usuario.email,
      telefono: usuario.telefono,
      datosLaborales: usuario.datosLaborales,
      datosMedicos: usuario.datosMedicos,
    },
    ultimoRegistro: todosDatos.length ? { datos: todosDatos } : {},
    eventosCriticos,
    alertas,
    ultimaUbicacion,
  };
}

// Aquí guardamos la última info emitida para comparar
let ultimaData = null;

async function checkForUpdates() {
  try {
    const data = await fetchUsuarioActivo();
    // Comparamos stringify para simplicidad, puede optimizarse con comparación profunda
    if (JSON.stringify(data) !== JSON.stringify(ultimaData)) {
      ultimaData = data;
      io.emit("usuario-activo-update", data);
      console.log("🚨 Emitido evento usuario-activo-update");
    }
  } catch (err) {
    console.error("❌ Error en checkForUpdates:", err);
  }
}

// Chequeamos cada 10 segundos
setInterval(checkForUpdates, 10000);

io.on("connection", (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);

  if (ultimaData) {
    socket.emit("usuario-activo-update", ultimaData);
  }

  socket.on("disconnect", () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`);
  });
});


// Revisamos cambios cada 3 segundos (ajustable)
setInterval(checkForUpdates, 3000);