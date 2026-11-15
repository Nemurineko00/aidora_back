const usuarioModelo = require('../Modelo/usuario_modelo');
const reporteModelo = require('../Modelo/reporte_modelo');

function listarUsuarios(req, res) {
  res.json({ usuarios: usuarioModelo.listar() });
}

function eliminarUsuario(req, res) {
  const eliminado = usuarioModelo.eliminar(Number(req.params.id));
  if (!eliminado) return res.status(404).json({ error: 'No encontramos a ese usuario' });
  res.json({ eliminado: true });
}

function listarReportes(req, res) {
  res.json({ reportes: reporteModelo.listar() });
}

module.exports = { listarUsuarios, eliminarUsuario, listarReportes };
