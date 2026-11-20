const pool = require('../bd');

const COLUMNAS_PUBLICAS = `r.id_reporte, r.id_pub, r.id_usuario, r.id_admin, r.fecha_reporte, r.estatus, dr.id_detalle_rep, dr.motivo, dr.evidencia`;

async function listarReportes() {

  const { rows } = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM reporte r JOIN detalle_reporte dr ON r.id_reporte = dr.id_reporte ORDER BY id_reporte`);

  return rows;
}

async function listarReportePorId(id_reporte) {

  const { rows } = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM reporte r JOIN detalle_reporte dr ON r.id_reporte = dr.id_reporte WHERE id_reporte = $1`, [id_reporte]);

  return rows[0];
}

async function crearReporte({id_pub, id_usuario, motivo, evidencia}) {

  const reporte = await pool.query(`INSERT INTO reporte (id_pub, id_usuario) VALUES ($1,$2) RETURNING id_reporte`, [id_pub, id_usuario]);

  const id_reporte = reporte.rows[0].id_reporte;

  await pool.query(`INSERT INTO detalle_reporte ( id_reporte, motivo, evidencia) VALUES ($1, $2, $3)`, [id_reporte, motivo, evidencia]);

  return listarReportePorId(id_reporte);
}

async function actualizarEstatusReporte(id_reporte,{estatus,id_admin}) {

  const resultado = await pool.query(`UPDATE reporte SET estatus = $1, id_admin = $2 WHERE id_reporte = $3 RETURNING ${COLUMNAS_PUBLICAS}`, [estatus, id_admin, id_reporte]);

 if (resultado.rowCount === 0) return undefined;

 return resultado.rows[0];
}

async function actualizarDetalleReporte(id_reporte,{motivo, evidencia}) {
  const cambios = Object.entries({motivo, evidencia}).filter(([_, valor])=> valor !== undefined);

  if(cambios.length === 0) return listarReportePorId(id_reporte);
  const columnas = cambios.map(([columna], i) => `${columna} = $${i + 1}`).join(', ');
  const resultado = await pool.query(`UPDATE detalle_reporte SET ${columnas} WHERE id_reporte = $${cambios.length + 1}`, [...cambios.map(([_,valor]) => valor), id_reporte]);

  if(resultado.rowCount === 0) return undefined;

  return listarReportePorId(id_reporte);
}





module.exports = { listarReportes, listarReportePorId, crearReporte, actualizarEstatusReporte, actualizarDetalleReporte};
