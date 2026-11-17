const { medicamentos } = require('../datos/memoria');

async function listar() {
  return medicamentos;
}

module.exports = { listar };
