require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pool = require('./bd');

const medicamento = require('./Controlador/medicamento_controlador');
const admin = require('./Controlador/admin_controlador');
const donacion = require('./Controlador/donacion_controlador');
const usuario = require('./Controlador/usuario_controlador');
const sesion = require('./Controlador/sesion_controlador');
const puntoEntrega = require('./Controlador/puntoentrega_controlador');
const pool = require('./bd');
const reporte = require('./Controlador/reporte_controlador');


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

const subirFoto = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }).single('foto');

const soloUsuario = [verificarToken, soloRol('usuario')];
const soloAdmin = [verificarToken, soloRol('admin')];
const soloOng = [verificarToken, soloRol('ong')];

app.get('/', (req, res) => {
  res.json({ mensaje: 'Aidora (backend) funcionando correctamente' });
});
app.get('/api/salud', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ servidor: 'funcionando', bd: 'conectada' });
  } catch (error) {
    console.error('La base de datos no responde:', error.message);
    res.status(503).json({ servidor: 'funcionando', bd: 'sin conexión' });
  }
});


app.get('/api/medicamentos', medicamento.listarMedicamentos);
app.get('/api/puntos-entrega', puntoEntrega.listarPuntosActivos);

app.post('/api/usuarios/registro', usuario.registrar);
app.post('/api/usuarios/login', usuario.iniciarSesion);
app.get('/api/usuarios/perfil', soloUsuario, usuario.verPerfil);
app.post('/api/usuarios/logout', soloUsuario, usuario.cerrarSesion);

app.post('/api/solicitudes', soloUsuario, solicitud.crearSolicitud);
app.get('/api/solicitudes/mias', soloUsuario, solicitud.listarMisSolicitudes);
app.get('/api/solicitudes/recibidas', soloUsuario, solicitud.listarSolicitudesRecibidas);
app.patch('/api/solicitudes/:id/aceptar', soloUsuario, solicitud.aceptarSolicitud);
app.patch('/api/solicitudes/:id/rechazar', soloUsuario, solicitud.rechazarSolicitud);
app.patch('/api/solicitudes/:id/entregar', soloUsuario, solicitud.marcarEntregada);

app.post('/api/reportes', soloUsuario, subirFoto, reporte.crearReporte);

app.post('/api/admin/login', sesion.iniciarSesionAdmin);
app.get('/api/admin/usuarios',soloAdmin, admin.listarUsuarios);
app.delete('/api/admin/usuarios/:id',soloAdmin, admin.eliminarUsuario);
app.get('/api/admin/reportes',soloAdmin, admin.listarReportes);
app.patch('/api/admin/reportes/:id', soloAdmin, admin.revisarReporte)

app.post('/api/ong/login', sesion.iniciarSesionOng);
app.get('/api/ong/donaciones', soloOng,donacion.listarDonaciones);
app.get('/api/ong/donaciones/:id', soloOng,donacion.obtenerDonacion);

app.use((req, res) => {
  res.status(404).json({ error: `No existe la ruta ${req.method} ${req.originalUrl}` });
});

app.use((error, req, res, next) => {
  console.error(`Error en ${req.method} ${req.originalUrl}:`, error);
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
  }
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'La imagen no puede pesar más de 5 MB' });
  }
  res.status(500).json({ error: 'Ocurrió un error en el servidor, intenta más tarde' });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto: ${PORT}`);
});
