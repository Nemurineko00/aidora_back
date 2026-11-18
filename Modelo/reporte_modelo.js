const pool = require('../bd');

const COLUMNAS_PUBLICAS = `id_reporte, id_pub, id_usuario, id_admin, fecha_reporte, estatus`;

async function listarReportes() {

  const { rows } = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM reporte ORDER BY id_reporte`);

  return rows;
}
async function listarReportePorId(id_reporte) {

  const { rows } = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM reporte WHERE id_reporte = $1`, [id_reporte]);

  return rows[0];
}

async function crearReporte({id_pub, id_usuario}) {

  const { rows } = await pool.query(`INSERT INTO reporte(id_pub, id_usuario) VALUES ($1,$2) RETURNING ${COLUMNAS_PUBLICAS}`, [id_pub, id_usuario]);

  return rows[0];
}

async function actualizarEstatusReporte(id_reporte,{estatus,id_admin}) {

  const resultado = await pool.query(`UPDATE reporte SET estatus = $1, id_admin = $2 WHERE id_reporte = $3 RETURNING ${COLUMNAS_PUBLICAS}`, [estatus, id_admin, id_reporte]);

 if (resultado.rowCount === 0) return undefined;

 return resultado.rows[0];
}


module.exports = { listarReportes, listarReportePorId, crearReporte, actualizarEstatusReporte};
