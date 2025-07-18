const mongoose = require('mongoose');

const DatoSchema = new mongoose.Schema({
  userId: mongoose.Types.ObjectId,
  fecha: String,
  datos: [
    {
      timestamp: Number,
      frecuencia: Number,
      x: Number,
      y: Number,
      z: Number,
      latitud: Number,
      longitud: Number
    }
  ]
}, { collection: 'registros_687830d65ff96389db8ed8fe_20250716' }); // <- nombre exacto de tu colección

module.exports = mongoose.model("Dato", DatoSchema);
