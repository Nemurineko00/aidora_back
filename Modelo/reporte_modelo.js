const pool = require('../bd');

const CONSULTA_REPORTES = `SELECT r.id_reporte, r.id_pub, r.id_usuario, r.id_admin, r.fecha_reporte, r.estatus,
        ep.id_usuario AS id_reportado, u.email AS email_reportante,
        COALESCE(json_agg(json_build_object('id_detalle_rep', dr.id_detalle_rep, 'motivo', dr.motivo, 'evidencia', dr.evidencia)
        ORDER BY dr.id_detalle_rep) FILTER (WHERE dr.id_detalle_rep IS NOT NULL), '[]') AS motivos
        FROM reporte r
        LEFT JOIN encabezado_pub ep ON r.id_pub = ep.id_pub
        LEFT JOIN usuario u ON r.id_usuario = u.id_usuario
        LEFT JOIN detalle_reporte dr ON r.id_reporte = dr.id_reporte`;

async function listarReportes() {
  const { rows } = await pool.query(`${CONSULTA_REPORTES} GROUP BY r.id_reporte, ep.id_usuario, u.email`);


  return rows;
}

async function listarReportePorId(id_reporte) {

  const { rows } = await pool.query(`${CONSULTA_REPORTES} WHERE r.id_reporte = $1 GROUP BY r.id_reporte, ep.id_usuario, u.email`, [id_reporte]);
  return rows[0];
}

async function buscarReportePendiente(id_usuario, id_pub) {

  const { rows } = await pool.query(`SELECT id_reporte FROM reporte WHERE id_usuario = $1 AND id_pub = $2 AND estatus = 'Pendiente'`, [id_usuario, id_pub]);

  return rows[0];
}

async function crearReporte({id_pub, id_usuario, motivos, evidencia=null}) {

  const cliente = await pool.connect();
  let id_reporte;

  try {
    await cliente.query('BEGIN');

    const reporte = await cliente.query(`INSERT INTO reporte (id_pub, id_usuario, fecha_reporte, estatus) VALUES ($1, $2, CURRENT_DATE, 'Pendiente') RETURNING id_reporte`, [id_pub, id_usuario]);
    id_reporte = reporte.rows[0].id_reporte;

    for (const motivo of motivos) {
      await cliente.query(`INSERT INTO detalle_reporte (id_reporte, motivo, evidencia) VALUES ($1, $2, $3)`, [id_reporte, motivo, evidencia]);
    }

    await cliente.query('COMMIT');
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }

  return listarReportePorId(id_reporte);
}

async function actualizarEstatusReporte(id_reporte,{estatus,id_admin}) {

  const resultado = await pool.query(`UPDATE reporte SET estatus = $1, id_admin = $2 WHERE id_reporte = $3 AND estatus = 'Pendiente' RETURNING id_reporte`, [estatus, id_admin, id_reporte]);

  if (resultado.rowCount === 0) return undefined;

 return listarReportePorId(id_reporte);
}

async function actualizarDetalleReporte(id_reporte,{motivo, evidencia}) {
  const cambios = Object.entries({motivo, evidencia}).filter(([_, valor])=> valor !== undefined);

  if(cambios.length === 0) return listarReportePorId(id_reporte);
  const columnas = cambios.map(([columna], i) => `${columna} = $${i + 1}`).join(', ');
  const resultado = await pool.query(`UPDATE detalle_reporte SET ${columnas} WHERE id_reporte = $${cambios.length + 1}`, [...cambios.map(([_,valor]) => valor), id_reporte]);

  if(resultado.rowCount === 0) return undefined;

  return listarReportePorId(id_reporte);
}


module.exports = { listarReportes, listarReportePorId, buscarReportePendiente, crearReporte, actualizarEstatusReporte, actualizarDetalleReporte};