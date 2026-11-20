const pool = require('../bd');

const COLUMNAS_PUBLICAS = 'id_medicamento, nombre_generico, codigo_rs, lote, fecha_caducidad, imagen_empaque';

async function listarMedicamentos(){
  const {rows} = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM medicamento ORDER BY id_medicamento`);
  return rows;
}

async function listarMedicamentosPorId(id_medicamento) {
  const {rows} = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM medicamento WHERE id_medicamento = $1`, [id_medicamento]);
  return rows[0];
}

async function listarMedicamentoPorNombre(nombre_generico) {
  const { rows } = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM medicamento WHERE nombre_generico = $1`, [nombre_generico]);
  return rows[0]; 
}

async function crearMedicamento({ nombre_generico, codigo_rs, lote}) {
  const { rows } = await pool.query(`INSERT INTO medicamento (nombre_generico, codigo_rs, lote, fecha_caducidad) VALUES ($1, $2, $3, $4) RETURNING ${COLUMNAS_PUBLICAS}`, [nombre_generico, codigo_rs, lote]);

  return rows[0];
}

async function actualizarMedicamento(id_medicamento,{nombre_generico, codigo_rs, lote, fecha_caducidad}) {
  const cambios = Object.entries({nombre_generico, codigo_rs, lote, fecha_caducidad}).filter(([_, valor]) => valor !== undefined);

  if (cambios.length === 0) return listarMedicamentosPorId(id_medicamento);

    const columnas = cambios.map(([columna], i) => `${columna} = $${i + 1}`).join(', ');

    const resultado = await poool.query(`UPDATE medicamento SET ${columnas} WHERE id_medicamento = $${cambios.length + 1} RETURNING ${COLUMNAS_PUBLICAS}`,[...cambios.map(([_, valor]) => valor),id_medicamento]);

    if (resultado.rowCount === 0) return undefined;
    return resultado.rows[0];
}

async function eliminarMedicamentoPorId(id_medicamento) {
  const {rows} = await poool.query(`DELETE FROM medicamento WHERE id_medicamento = $1 RETURNING *`, [id_medicamento]);
  return rows[0];
}

module.exports = { listarMedicamentos, listarMedicamentosPorId, listarMedicamentoPorNombre, crearMedicamento, actualizarMedicamento, eliminarMedicamentoPorId};
