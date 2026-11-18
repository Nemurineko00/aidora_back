const express = require('express');
const cors = require('cors');

const medicamento = require('./Controlador/medicamento_controlador');
const admin = require('./Controlador/admin_controlador');
const donacion = require('./Controlador/donacion_controlador');
const usuario = require('./Controlador/usuario_controlador');

const app = express();
const PORT = process.env.PORT || 4000;

const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((direccion) => direccion.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ mensaje: 'Aidora (backend) funcionando correctamente' });
});
app.post('/api/usuarios/registro', usuario.registrar);
app.post('/api/usuarios/login', usuario.iniciarSesion);
app.get('/api/medicamentos', medicamento.listarMedicamentos);

app.get('/api/admin/usuarios', admin.listarUsuarios);
app.delete('/api/admin/usuarios/:id', admin.eliminarUsuario);
app.get('/api/admin/reportes', admin.listarReportes);

app.get('/api/ong/donaciones', donacion.listarDonaciones);
app.get('/api/ong/donaciones/:id', donacion.obtenerDonacion);

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto: ${PORT}`);
});
