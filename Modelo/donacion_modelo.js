const pool = require('../bd');

const SELECT_DONACION = `
  SELECT s.id_solicitud, s.id_pub, s.estado, s.entregado, s.recibido,
         s.fecha_solicitud, s.fecha_aceptada, s.fecha_completada,
         ep.estado AS estado_pub, ep.fecha_creacion,
         ep.id_usuario AS id_donante, s.id_usuario AS id_receptor,
         d.nombre AS donante_nombre, d.apellido AS donante_apellido, d.email AS donante_email,
         r.nombre AS receptor_nombre, r.apellido AS receptor_apellido, r.email AS receptor_email,
         dp.cantidad,
         m.id_medicamento, m.nombre_comercial, m.nombre_generico, m.codigo_rs, m.lote, m.fecha_caducidad, m.imagen_empaque,
         pe.id_punto, pe.id_ong, pe.nombre_punto, pe.direccion
  FROM solicitud s
  JOIN encabezado_pub ep ON ep.id_pub = s.id_pub
  JOIN detalle_pub dp ON dp.id_pub = ep.id_pub
  JOIN medicamento m ON m.id_medicamento = dp.id_medicamento
  JOIN punto_entrega pe ON pe.id_punto = dp.id_punto
  JOIN usuario d ON d.id_usuario = ep.id_usuario
  JOIN usuario r ON r.id_usuario = s.id_usuario`;

const ORDEN_RECIENTES = `ORDER BY COALESCE(s.fecha_completada, s.fecha_aceptada, s.fecha_solicitud) DESC, s.id_solicitud DESC`;

async function obtenerDonacion(id_solicitud) {
  const { rows } = await pool.query(`${SELECT_DONACION} WHERE s.id_solicitud = $1`, [id_solicitud]);
  return rows[0];
}

async function listarDonacionesDeUsuario(id_usuario) {
  const { rows } = await pool.query(
    `${SELECT_DONACION}
     WHERE s.id_usuario = $1 OR (ep.id_usuario = $1 AND s.estado IN ('Aceptada', 'Completada'))
     ${ORDEN_RECIENTES}`,
    [id_usuario]
  );
  return rows;
}

async function ultimaSolicitudDeUsuario(id_usuario, id_pub) {
  const { rows } = await pool.query(
    `${SELECT_DONACION}
     WHERE s.id_usuario = $1 AND s.id_pub = $2 AND s.estado IN ('Pendiente', 'Aceptada', 'Completada')
     ${ORDEN_RECIENTES} LIMIT 1`,
    [id_usuario, id_pub]
  );
  return rows[0];
}

async function listarSolicitudesDePublicacionesDe(id_usuario) {
  const { rows } = await pool.query(
    `${SELECT_DONACION}
     WHERE ep.id_usuario = $1 AND s.estado IN ('Pendiente', 'Aceptada', 'Completada')
     ORDER BY s.fecha_solicitud, s.id_solicitud`,
    [id_usuario]
  );
  return rows;
}

async function listarSolicitudesHechasPor(id_usuario) {
  const { rows } = await pool.query(`${SELECT_DONACION} WHERE s.id_usuario = $1 ${ORDEN_RECIENTES}`, [id_usuario]);
  return rows;
}

async function listarDonacionesDeOng(id_ong) {
  const { rows } = await pool.query(
    `${SELECT_DONACION}
     WHERE pe.id_ong = $1 AND s.estado IN ('Aceptada', 'Completada')
     ORDER BY s.fecha_aceptada DESC NULLS LAST, s.id_solicitud DESC`,
    [id_ong]
  );
  return rows;
}

async function enTransaccion(fn) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const resultado = await fn(cliente);
    await cliente.query('COMMIT');
    return resultado;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

async function aceptarSolicitud(id_solicitud, fecha_entrega) {
  const ok = await enTransaccion(async (cliente) => {
    const sol = await cliente.query(`SELECT id_pub FROM solicitud WHERE id_solicitud = $1 AND estado = 'Pendiente' FOR UPDATE`, [id_solicitud]);
    if (sol.rowCount === 0) return false;
    const id_pub = sol.rows[0].id_pub;

    const pub = await cliente.query(`SELECT estado FROM encabezado_pub WHERE id_pub = $1 FOR UPDATE`, [id_pub]);
    if (pub.rows[0]?.estado !== 'Disponible') return false;

    await cliente.query(`UPDATE solicitud SET estado = 'Aceptada', fecha_aceptada = now(), fecha_entrega = $1 WHERE id_solicitud = $2`, [fecha_entrega, id_solicitud]);
    await cliente.query(`UPDATE encabezado_pub SET estado = 'Reservado' WHERE id_pub = $1`, [id_pub]);
    await cliente.query(`UPDATE solicitud SET estado = 'Rechazada' WHERE id_pub = $1 AND estado = 'Pendiente' AND id_solicitud <> $2`, [id_pub, id_solicitud]);
    return true;
  });
  return ok ? obtenerDonacion(id_solicitud) : null;
}

async function rechazarSolicitud(id_solicitud) {
  const resultado = await pool.query(`UPDATE solicitud SET estado = 'Rechazada' WHERE id_solicitud = $1 AND estado = 'Pendiente' RETURNING id_solicitud`, [id_solicitud]);
  return resultado.rowCount === 0 ? null : obtenerDonacion(id_solicitud);
}

async function marcarEntrega(id_solicitud, { entregado, recibido }) {
  const resultado = await pool.query(
    `UPDATE solicitud SET entregado = COALESCE($2, entregado), recibido = COALESCE($3, recibido)
     WHERE id_solicitud = $1 AND estado = 'Aceptada' RETURNING id_solicitud`,
    [id_solicitud, entregado ?? null, recibido ?? null]
  );
  return resultado.rowCount === 0 ? null : obtenerDonacion(id_solicitud);
}

async function terminarCiclo(id_solicitud) {
  const ok = await enTransaccion(async (cliente) => {
    const sol = await cliente.query(
      `UPDATE solicitud SET estado = 'Completada', fecha_completada = now()
       WHERE id_solicitud = $1 AND estado = 'Aceptada' AND entregado AND recibido RETURNING id_pub`,
      [id_solicitud]
    );
    if (sol.rowCount === 0) return false;
    await cliente.query(`UPDATE encabezado_pub SET estado = 'Entregado' WHERE id_pub = $1`, [sol.rows[0].id_pub]);
    return true;
  });
  return ok ? obtenerDonacion(id_solicitud) : null;
}

module.exports = {
  obtenerDonacion,
  listarDonacionesDeUsuario,
  ultimaSolicitudDeUsuario,
  listarSolicitudesDePublicacionesDe,
  listarSolicitudesHechasPor,
  listarDonacionesDeOng,
  aceptarSolicitud,
  rechazarSolicitud,
  marcarEntrega,
  terminarCiclo,
};
