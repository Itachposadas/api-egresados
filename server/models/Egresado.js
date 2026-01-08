const mongoose = require('mongoose');

const egresadoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  apellido: {
    type: String,
    required: true,
    trim: true
  },
  cedula: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  carrera: {
    type: String,
    required: true
  },
  anoGraduacion: {
    type: Number,
    required: true
  },
  correo: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  telefono: {
    type: String,
    trim: true
  },
  empresaActual: {
    type: String
  },
  puesto: {
    type: String
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Egresado', egresadoSchema);