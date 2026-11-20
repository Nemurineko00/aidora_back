require('dotenv').config();
const express = require('express');
const cors = require('cors');

const medicamento = require('./Controlador/medicamento_controlador');
const admin = require('./Controlador/admin_controlador');
const donacion = require('./Controlador/donacion_controlador');
const usuario = require('./Controlador/usuario_controlador');
const sesion = require('./Controlador/sesion_controlador');
const { verificarToken, soloRol } = require('./Controlador/autenticacion_middleware');

if (!process.env.JWT_SECRET) {
  console.error('Falta la variable JWT_SECRET en el archivo .env');
  process.exit(1);
}

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

app.get('/api/medicamentos', medicamento.listarMedicamentos);

const soloUsuario = [verificarToken, soloRol('usuario')];
app.post('/api/usuarios/registro', usuario.registrar);
app.post('/api/usuarios/login', usuario.iniciarSesion);
app.get('/api/usuarios/perfil', soloUsuario, usuario.verPerfil);
app.post('/api/usuarios/logout', soloUsuario, usuario.cerrarSesion);

const soloAdmin = [verificarToken, soloRol('admin')];
app.post('/api/admin/login', sesion.iniciarSesionAdmin);
app.get('/api/admin/usuarios',soloAdmin, admin.listarUsuarios);
app.delete('/api/admin/usuarios/:id',soloAdmin, admin.eliminarUsuario);
app.get('/api/admin/reportes',soloAdmin, admin.listarReportes);

const soloOng = [verificarToken, soloRol('ong')];
app.post('/api/ong/login', sesion.iniciarSesionOng);
app.get('/api/ong/donaciones', soloOng,donacion.listarDonaciones);
app.get('/api/ong/donaciones/:id', soloOng,donacion.obtenerDonacion);

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto: ${PORT}`);
});
