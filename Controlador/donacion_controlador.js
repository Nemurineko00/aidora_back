const donacionModelo = require('../Modelo/donacion_modelo');

function listarDonaciones(req, res) {
  res.json({ donaciones: donacionModelo.listar() });
}

function obtenerDonacion(req, res) {
  const donacion = donacionModelo.obtenerPorId(Number(req.params.id));
  if (!donacion) return res.status(404).json({ error: 'No encontramos esa donación' });
  res.json({ donacion });
}

module.exports = { listarDonaciones, obtenerDonacion };
