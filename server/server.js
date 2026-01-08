const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/database');
const egresadosRoutes = require('./routes/egresados');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conectar a MongoDB
connectDB();

// IMPORTANTE: Servir archivos estáticos ANTES de las rutas
app.use(express.static(path.join(__dirname, '../public')));

// Rutas API
app.use('/api/egresados', egresadosRoutes);

// Ruta para SPA (Single Page Application)
// Esta ruta DEBE ir al final para capturar todas las rutas no definidas
// En tu server.js, modifica las rutas:

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

// Redireccionar /app a /dashboard
app.get('/app', (req, res) => {
    res.redirect('/dashboard');
});

const PORT = process.env.PORT || 10000; // Render usa puerto 10000
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});