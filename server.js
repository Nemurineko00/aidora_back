const express = require('express');
const cors = require('cors');

const medicamento = require('./Controlador/medicamento_controlador');
const admin = require('./Controlador/admin_controlador');
const donacion = require('./Controlador/donacion_controlador');

const app = express();
const PORT = process.env.PORT || 4000;

// ---- Conexión con el frontend (CORS)
// Direcciones del frontend que pueden llamar a este servidor. Varias separadas por coma.
// Cuando publiques el front, agrega su dirección:  FRONTEND_URL=http://localhost:3000,https://tu-app.vercel.app
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((direccion) => direccion.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ mensaje: 'Aidora (backend) funcionando correctamente' });
});

// ---- Medicamentos
app.get('/api/medicamentos', medicamento.listarMedicamentos);

// ---- Administración
app.get('/api/admin/usuarios', admin.listarUsuarios);
app.delete('/api/admin/usuarios/:id', admin.eliminarUsuario);
app.get('/api/admin/reportes', admin.listarReportes);

// ---- ONG / hospital
app.get('/api/ong/donaciones', donacion.listarDonaciones);
app.get('/api/ong/donaciones/:id', donacion.obtenerDonacion);

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto: ${PORT}`);
});
