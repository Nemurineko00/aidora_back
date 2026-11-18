const { reportes } = require('../datos/memoria');

async function listar() {
  return reportes;
}

module.exports = { listar };
