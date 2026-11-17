const { donaciones } = require('../datos/memoria');

async function listar() {
  return donaciones;
}

async function obtenerPorId(id) {
  return donaciones.find((d) => d.id === id);
}

module.exports = { listar, obtenerPorId };
