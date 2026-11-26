require('dotenv').config();
const express = require('express');
const cors = require('cors');

const publicacion = require('./Controlador/publicacion_controlador');
const solicitud = require('./Controlador/solicitud_controlador');
const pool = require('./bd');
const medicamento = require('./Controlador/medicamento_controlador');
const admin = require('./Controlador/admin_controlador');
const donacion = require('./Controlador/donacion_controlador');
const usuario = require('./Controlador/usuario_controlador');
const sesion = require('./Controlador/sesion_controlador');
const puntoEntrega = require('./Controlador/puntoentrega_controlador');

const reporte = require('./Controlador/reporte_controlador');

const { verificarToken, soloRol } = require('./Controlador/autenticacion_middleware');
const { CARPETA_SUBIDAS, RUTA_PUBLICA, subirFoto } = require('./Controlador/archivos');

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

const PATRON_VERCEL = /^https:\/\/aidora-fron(-[a-z0-9]+)*-nemuri-neko00\.vercel\.app$/;

app.use(cors({
  origin: (origen, callback) => {
    const permitido = !origen || FRONTEND_URL.includes(origen) || PATRON_VERCEL.test(origen);
    callback(null, permitido);
  },
}));
app.use(express.json({ limit: '20kb' }));

app.use(RUTA_PUBLICA, express.static(CARPETA_SUBIDAS, {
  maxAge: '7d',
  setHeaders: (res) => res.set('X-Content-Type-Options', 'nosniff'),
}));

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
    const interno = (error.errors && error.errors[0]) || error;
    console.error('La base de datos no responde:', error.code, interno.message);

    let hostConfigurado = 'DATABASE_URL no está definida o está vacía';
    if (process.env.DATABASE_URL) {
      try {
        hostConfigurado = new URL(process.env.DATABASE_URL).hostname;
      } catch {
        hostConfigurado = 'DATABASE_URL tiene un formato inválido';
      }
    }
    res.status(503).json({
      servidor: 'funcionando',
      bd: 'sin conexión',
      codigo: error.code,
      detalle: interno.message || error.message,
      intentoConectar: `${interno.address || ''}:${interno.port || ''}`,
      hostConfigurado,
    });
  }
});

app.get('/api/medicamentos', medicamento.listarMedicamentos);
app.get('/api/puntos-entrega', puntoEntrega.listarPuntosActivos);

app.post('/api/usuarios/registro', usuario.registrar);
app.post('/api/usuarios/login', usuario.iniciarSesion);
app.get('/api/usuarios/perfil', soloUsuario, usuario.verPerfil);
app.put('/api/usuarios/perfil', soloUsuario, usuario.editarPerfil);
app.post('/api/usuarios/logout', soloUsuario, usuario.cerrarSesion);
app.post('/api/sesion/logout', verificarToken, usuario.cerrarSesion);
app.get('/api/usuarios/ayudante', soloUsuario, usuario.verAyudante);
app.put('/api/usuarios/ayudante', soloUsuario, usuario.guardarAyudante);

app.get('/api/donaciones/mias', soloUsuario, donacion.listarMisDonaciones);

app.get('/api/solicitudes/mias', soloUsuario, solicitud.obtenerSolicitudPorUsuario);
app.get('/api/solicitudes/:id', soloUsuario, solicitud.obtenerSolicitudPorId);
app.get('/api/solicitudes/:id/completa', soloUsuario, solicitud.obtenerSolicitudCompleta);
app.post('/api/solicitudes', soloUsuario, solicitud.crearSolicitud);
app.patch('/api/solicitudes/:id/estado', soloUsuario, solicitud.actualizarEstadoSolicitud);
app.delete('/api/solicitudes/:id', soloUsuario, solicitud.eliminarSolicitud);

app.get('/api/publicaciones', soloUsuario, publicacion.obtenerPublicaciones);
app.get('/api/publicaciones/disponibles', soloUsuario, publicacion.obtenerPublicacionesDisponibles);
app.get('/api/publicaciones/mias', soloUsuario, publicacion.obtenerMisPublicaciones);
app.get('/api/publicaciones/:id/detalle', soloUsuario, publicacion.obtenerDetallePublicacion);
app.get('/api/publicaciones/:id', soloUsuario, publicacion.obtenerPublicacionesPorId);
app.post('/api/publicaciones', soloUsuario, subirFoto, publicacion.crearPublicacion);
app.put('/api/publicaciones/:id', soloUsuario, subirFoto, publicacion.actualizarPublicacion);
app.patch('/api/publicaciones/:id/estado', soloUsuario, publicacion.actualizarEstadoPublicacion);
app.patch('/api/publicaciones/:id/cantidad', soloUsuario, publicacion.actualizarCantidaMedicamento);
app.patch('/api/publicaciones/:id/punto', soloUsuario, publicacion.actualizarPunto);
app.patch('/api/publicaciones/:id/cancelar', soloUsuario, publicacion.cancelarPublicacion);
app.delete('/api/publicaciones/:id', soloUsuario, publicacion.eliminarPublicacion);

app.post('/api/reportes', soloUsuario, subirFoto, reporte.crearReporte);

app.post('/api/admin/login', sesion.iniciarSesionAdmin);
app.get('/api/admin/usuarios',soloAdmin, admin.listarUsuarios);
app.delete('/api/admin/usuarios/:id',soloAdmin, admin.eliminarUsuario);
app.get('/api/admin/usuarios/:id/historial', soloAdmin, admin.historialUsuario);
app.get('/api/admin/reportes',soloAdmin, admin.listarReportes);
app.patch('/api/admin/reportes/:id', soloAdmin, admin.revisarReporte);

app.post('/api/ong/login', sesion.iniciarSesionOng);
app.get('/api/ong/donaciones', soloOng,donacion.listarDonaciones);
app.get('/api/ong/donaciones/:id', soloOng,donacion.obtenerDonacion);
app.patch('/api/ong/donaciones/:id', soloOng, donacion.actualizarEntrega);
app.post('/api/ong/donaciones/:id/terminar', soloOng, donacion.terminarCiclo);

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
  if (error.code === 'TIPO_ARCHIVO_INVALIDO') {
    return res.status(400).json({ error: error.message });
  }
  if (error.name === 'MulterError') {
    return res.status(400).json({ error: 'Solo puedes subir una imagen en el campo "foto"' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Los datos enviados son demasiado grandes' });
  }
  const ERRORES_BD = {
    '23502': 'Falta un dato obligatorio',
    '23505': 'Ese registro ya existe',
    '23503': 'Uno de los datos hace referencia a algo que no existe',
    '23514': 'Uno de los datos no cumple las reglas permitidas',
    '22001': 'Uno de los textos es demasiado largo',
    '22003': 'Uno de los números está fuera de rango',
    '22007': 'Una de las fechas no es válida',
    '22008': 'Una de las fechas no es válida',
    '22P02': 'Uno de los datos no tiene el formato correcto',
  };
  if (ERRORES_BD[error.code]) {
    return res.status(400).json({ error: ERRORES_BD[error.code] });
  }
  res.status(500).json({ error: 'Ocurrió un error en el servidor, intenta más tarde' });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto: ${PORT}`);
});