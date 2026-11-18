const usuarioModelo = require('../Modelo/usuario_modelo');
const reporteModelo = require('../Modelo/reporte_modelo');

async function listarUsuarios(req, res) {
  res.json({ usuarios:await usuarioModelo.listarUsuarios() });
}

async function eliminarUsuario(req, res) {
  const id_usuario = Number(req.params.id);
  if (!Number.isInteger(id_usuario)){
  return res.status(404).json({ error: 'El id del usuario no es válido' });
}
  const usuario = await usuarioModelo.desactivarUsuarioPorId(id_usuario);
  if (!usuario) return res.status(404).json({ error: 'No encontramos a ese usuario' });
  res.json({ desactivado: true });
}

async function listarReportes(req, res) {
  res.json({ reportes: reporteModelo.listar() });
}

module.exports = { listarUsuarios, eliminarUsuario, listarReportes };
