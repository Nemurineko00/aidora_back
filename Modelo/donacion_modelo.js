const { donaciones } = require('../datos/memoria');

function listar() {
  return donaciones;
}

// Devuelve la donación o undefined si no existe
function obtenerPorId(id) {
  return donaciones.find((d) => d.id === id);
}

module.exports = { listar, obtenerPorId };
