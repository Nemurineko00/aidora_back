const { donaciones } = require('../datos/memoria');

function listar() {
  return donaciones;
}

function obtenerPorId(id) {
  return donaciones.find((d) => d.id === id);
}

module.exports = { listar, obtenerPorId };
