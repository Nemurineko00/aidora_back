const usuarioModelo = require('../Modelo/usuario_modelo');
const reporteModelo = require('../Modelo/reporte_modelo');
const publicacionModelo = require('../Modelo/publicacion_modelo');
const donacionModelo = require('../Modelo/donacion_modelo');

async function listarUsuarios(req, res) {
  res.json({ usuarios:await usuarioModelo.listarUsuario() });
}

async function eliminarUsuario(req, res) {
  const id_usuario = Number(req.params.id);
  if (!Number.isInteger(id_usuario)){
  return res.status(400).json({ error: 'El id del usuario no es válido' });
}
  const usuario = await usuarioModelo.desactivarUsuarioPorId(id_usuario);
  if (!usuario) return res.status(404).json({ error: 'No encontramos a ese usuario' });
  res.json({ desactivado: true });
}

async function listarReportes(req, res) {
  res.json({ reportes: await reporteModelo.listarReportes() });
}

async function revisarReporte(req, res) {
  const id_reporte = Number(req.params.id);
  if (!Number.isInteger(id_reporte)) {
    return res.status(400).json({ error: 'El id del reporte no es válido' });
  }

  const { estatus } = req.body || {};
  if (!['Confirmado', 'Rechazado'].includes(estatus)) {
    return res.status(400).json({ error: 'El estatus debe ser Confirmado o Rechazado' });
  }

  const existe = await reporteModelo.listarReportePorId(id_reporte);
  if (!existe) return res.status(404).json({ error: 'No encontramos ese reporte' });

  const reporte = await reporteModelo.actualizarEstatusReporte(id_reporte, { estatus, id_admin: req.sesion.id });
  if (!reporte) return res.status(409).json({ error: 'Este reporte ya fue revisado' });

  res.json({ reporte });
}

async function historialUsuario(req, res) {
  const id_usuario = Number(req.params.id);
  if (!Number.isInteger(id_usuario)) return res.status(400).json({ error: 'El id del usuario no es válido' });

  const usuario = await usuarioModelo.listarUsuarioPorId(id_usuario);
  if (!usuario) return res.status(404).json({ error: 'No encontramos a ese usuario' });

  const [publicaciones, solicitudes] = await Promise.all([
    publicacionModelo.listarPublicacionesDeUsuario(id_usuario),
    donacionModelo.listarSolicitudesHechasPor(id_usuario),
  ]);
  res.json({ usuario, publicaciones, solicitudes });
}

module.exports = { listarUsuarios, eliminarUsuario, listarReportes, revisarReporte, historialUsuario };
