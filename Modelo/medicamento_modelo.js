const { medicamentos } = require('../datos/memoria');

function listar() {
  return medicamentos;
}

module.exports = { listar };
