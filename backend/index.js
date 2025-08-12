require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require("http");
const { Server } = require("socket.io");

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const mongoUri = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

function getDb() {
  const db = mongoose.connection.db;
  if (!db) throw new Error('Base de datos no disponible aún');
  return db;
}

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("✅ MongoDB conectado");
  server.listen(PORT, () => {
    console.log(`🚀 Backend corriendo en puerto ${PORT}`);
  });
})
.catch(err => {
  console.error("❌ Error conectando a MongoDB:", err);
});

// Endpoint /api/datos (agrupado y con estados)
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
    console.error("❌ Error al obtener datos:", err);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
});

// Endpoint /api/estadisticas
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

// Endpoint que trae todos los usuarios con su último estado y datos completos
app.get("/api/usuario-activo", async (req, res) => {
  try {
    const data = await fetchUsuariosConUltimoEstado();
    if (!data || data.length === 0) {
      return res.status(404).json({ mensaje: "No hay usuarios registrados" });
    }
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener usuarios con estado" });
  }
});

async function fetchUsuariosConUltimoEstado() {
  const db = getDb();

  // Obtener todos los usuarios
  const usuarios = await db.collection("users").find({}).toArray();
  if (!usuarios.length) return [];

  // Obtener último estado para cada usuario usando agregación
  const estadosUltimos = await db.collection("userstatuses").aggregate([
    { $sort: { fecha: -1 } },
    {
      $group: {
        _id: "$authUserId",
        ultimoEstado: { $first: "$activo" },
        fechaUltimoEstado: { $first: "$fecha" }
      }
    }
  ]).toArray();

  // Crear mapa userId -> estado
  const estadoMap = {};
  estadosUltimos.forEach(e => {
    estadoMap[e._id.toString()] = {
      activo: e.ultimoEstado,
      fecha: e.fechaUltimoEstado,
    };
  });

  // Obtener colecciones registros_
  const collections = await db.listCollections().toArray();
  const registrosCollections = collections.filter(c => c.name.startsWith("registros_"));

  const resultados = [];

  for (const user of usuarios) {
    const userIdStr = user._id.toString();

    // Obtener último estado o poner falso por defecto
    const estado = estadoMap[userIdStr] || { activo: false, fecha: null };

    // Obtener todos los datos para el usuario
    let todosDatos = [];
    for (const col of registrosCollections) {
      const docs = await db.collection(col.name).find({ userId: user._id }).toArray();
      for (const doc of docs) {
        if (doc.datos?.length) todosDatos = todosDatos.concat(doc.datos);
      }
    }

    // Ordenar todosDatos por timestamp
    todosDatos.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    // Eventos críticos
    const eventosCriticos = todosDatos.filter(d => d.frecuencia > 120 || d.frecuencia < 60);

    // Cálculo de alertas
    const alertas = {
      frecuenciaCardiaca: eventosCriticos.length > 0,
      movimientoBrusco: todosDatos.some(d => Math.abs(d.x) > 15 || Math.abs(d.y) > 15 || Math.abs(d.z) > 15),
      inactividadProlongada: false,
      bajaVariabilidadFC: false,
    };

    // Detectar inactividad prolongada
    const ms5min = 5 * 60 * 1000;
    function aceleracionDiferencia(d1, d2) {
      if (!d1 || !d2) return Infinity;
      return Math.abs(d1.x - d2.x) + Math.abs(d1.y - d2.y) + Math.abs(d1.z - d2.z);
    }
    outerLoop:
    for (let i = 0; i < todosDatos.length; i++) {
      for (let j = i + 1; j < todosDatos.length; j++) {
        if ((todosDatos[j].timestamp || 0) - (todosDatos[i].timestamp || 0) >= ms5min) {
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

    // Desviación estándar frecuencia cardíaca
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

    // Última ubicación (por defecto lat:0, lng:0)
    const ultimosConUbicacion = todosDatos.filter(d => d.latitud && d.longitud);
    let ultimaUbicacion = { lat: 0, lng: 0 };
    if (ultimosConUbicacion.length > 0) {
      const ultima = ultimosConUbicacion[ultimosConUbicacion.length - 1];
      ultimaUbicacion = { lat: ultima.latitud, lng: ultima.longitud };
    }

    resultados.push({
      registradoEnUserStatuses: true,
      activoAhora: estado.activo,
      fechaEstado: estado.fecha,
      usuario: {
        id: user._id,
        nombre: `${user.nombre ?? ""} ${user.apellidoPaterno ?? ""} ${user.apellidoMaterno ?? ""}`.trim(),
        edad: user.edad ?? null,
        sexo: user.sexo ?? null,
        email: user.email ?? null,
        telefono: user.telefono ?? null,
        datosLaborales: user.datosLaborales || {},
        datosMedicos: user.datosMedicos || {},
      },
      ultimoRegistro: { datos: todosDatos.length ? todosDatos : [] },
      eventosCriticos,
      alertas,
      ultimaUbicacion,
    });
  }

  return resultados;
}

// Sockets: emitir datos a clientes si hay cambio
let ultimaData = null;

async function checkForUpdates() {
  try {
    const data = await fetchUsuariosConUltimoEstado();
    const nuevoStr = JSON.stringify(data);
    const viejoStr = JSON.stringify(ultimaData);

    if (nuevoStr !== viejoStr) {
      ultimaData = data;
      io.emit("usuario-activo-update", data);
      console.log("🟢 Emitiendo actualización a clientes");
    }
  } catch (err) {
    console.error("Error en checkForUpdates:", err);
  }
}

io.on("connection", (socket) => {
  console.log("Cliente conectado", socket.id);
  if (ultimaData) socket.emit("usuario-activo-update", ultimaData);

  socket.on("disconnect", () => {
    console.log("Cliente desconectado", socket.id);
  });
});

setInterval(checkForUpdates, 3000);
