const pool = require('../bd');

const COLUMNAS_PUBLICAS = `ep.id_pub, ep.id_usuario, ep.fecha_creacion, ep.estado, dp.cantidad, m.id_medicamento, m.nombre_comercial, m.nombre_generico`;

async function listarPublicaciones() {
  const { rows } = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM encabezado_pub ep JOIN detalle_pub dp ON ep.id_pub = dp.id_pub JOIN medicamento m ON dp.id_medicamento = m.id_medicamento ORDER BY ep.id_pub`);

  return rows;
}

async function listarPublicacionesPorId(id_pub) {
  const { rows } = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM encabezado_pub ep JOIN detalle_pub dp ON ep.id_pub = dp.id_pub JOIN medicamento m ON dp.id_medicamento = m.id_medicamento WHERE ep.id_pub = $1`, [id_pub]);

  return rows[0];
}


module.exports = { listar, obtenerPorId };
