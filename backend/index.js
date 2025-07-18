require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const Dato = require('./models/Dato');

const app = express();
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB conectado"))
  .catch(err => console.error(err));

app.get('/api/datos', async (req, res) => {
  try {
    const datos = await Dato.find();
    res.json(datos);
  } catch (err) {
    res.status(500).send('Error al obtener datos');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend corriendo en puerto ${PORT}`));
