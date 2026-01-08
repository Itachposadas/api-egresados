const express = require('express');
const router = express.Router();
const Egresado = require('../models/Egresado');

// GET todos los egresados
router.get('/', async (req, res) => {
  try {
    const egresados = await Egresado.find().sort({ fechaCreacion: -1 });
    res.json(egresados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET un egresado por ID
router.get('/:id', async (req, res) => {
  try {
    const egresado = await Egresado.findById(req.params.id);
    if (!egresado) {
      return res.status(404).json({ error: 'Egresado no encontrado' });
    }
    res.json(egresado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST crear nuevo egresado
router.post('/', async (req, res) => {
  try {
    const nuevoEgresado = new Egresado(req.body);
    await nuevoEgresado.save();
    res.status(201).json(nuevoEgresado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT actualizar egresado
router.put('/:id', async (req, res) => {
  try {
    const egresadoActualizado = await Egresado.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!egresadoActualizado) {
      return res.status(404).json({ error: 'Egresado no encontrado' });
    }
    res.json(egresadoActualizado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE eliminar egresado
router.delete('/:id', async (req, res) => {
  try {
    const egresadoEliminado = await Egresado.findByIdAndDelete(req.params.id);
    if (!egresadoEliminado) {
      return res.status(404).json({ error: 'Egresado no encontrado' });
    }
    res.json({ message: 'Egresado eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;