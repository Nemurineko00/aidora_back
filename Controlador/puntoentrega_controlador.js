const puntoEntregaModelo = require('../Modelo/puntoentrega_modelo');

async function listarPuntosActivos(req, res) {
  res.json({ puntosEntrega: await puntoEntregaModelo.listarPuntoEntregaActivos() });
}

module.exports = { listarPuntosActivos };