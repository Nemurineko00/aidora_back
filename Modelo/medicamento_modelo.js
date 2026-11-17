const pool = require('../bd');

const COLUMNAS_PUBLICAS = 'id_medicamento, nombre, descripcion, fecha_caducidad, cantidad';

function listar() {
  return medicamentos;
}

module.exports = { listar };
