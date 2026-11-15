const { reportes } = require('../datos/memoria');

function listar() {
  return reportes;
}

module.exports = { listar };
