const pool = require('../bd');

const COLUMNAS_PUBLICAS = `ep.id_pub, ep.id_usuario, ep.fecha_creacion, ep.estado, dp.cantidad, m.id_medicamento, m.nombre_comercial, m.nombre_generico, m.codigo_rs, m.lote, m.fecha_caducidad, m.imagen_empaque, pe.id_punto, pe.nombre_punto, pe.direccion`;

async function listarPublicaciones() {
  const { rows } = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM encabezado_pub ep JOIN detalle_pub dp ON ep.id_pub = dp.id_pub JOIN medicamento m ON dp.id_medicamento = m.id_medicamento JOIN punto_entrega pe ON dp.id_punto = pe.id_punto ORDER BY ep.id_pub`);

  return rows;
}

async function listarPublicacionesPorId(id_pub) {
  const { rows } = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM encabezado_pub ep JOIN detalle_pub dp ON ep.id_pub = dp.id_pub JOIN medicamento m ON dp.id_medicamento = m.id_medicamento JOIN punto_entrega pe ON dp.id_punto = pe.id_punto WHERE ep.id_pub = $1`, [id_pub]);

  return rows[0];
}

async function listarPublicacionesDisponibles() {
  const { rows } = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM encabezado_pub ep JOIN detalle_pub dp ON ep.id_pub = dp.id_pub JOIN medicamento m ON dp.id_medicamento = m.id_medicamento JOIN punto_entrega pe ON dp.id_punto = pe.id_punto WHERE ep.estado = 'Disponible'`);

  return rows;
}

async function crearPublicacion({id_usuario, id_medicamento, id_punto, cantidad}) {
  const encabezado = await pool.query(`INSERT INTO encabezado_pub (id_usuario, estado) VALUES ($1, 'Disponible') RETURNING id_pub`, [id_usuario]);

  const id_pub = encabezado.rows[0].id_pub;

  await pool.query(`INSERT INTO detalle_pub (id_pub,id_medicamento, id_punto, cantidad) VALUES ($1, $2, $3, $4)`, [id_pub, id_medicamento, id_punto, cantidad]);

  return listarPublicacionesPorId(id_pub);
}

async function actualizarEstadoPublicacion(id_pub, estado) {
  const resultado = await pool.query(`UPDATE encabezado_pub SET estado = $1 WHERE id_pub = $2 RETURNING id_pub`, [estado, id_pub]);

  if(resultado.rowCount === 0) return undefined;

  return listarPublicacionesPorId(id_pub);
}

async function actualizarCantidaMedi(id_pub, cantidad) {
  const resultado = await pool.query(`UPDATE detalle_pub SET cantidad = $1 WHERE id_pub = $2 RETURNING id_pub`, [cantidad, id_pub]);

  if (resultado.rowCount === 0) return undefined;

  return listarPublicacionesPorId(id_pub);
}

async function cancelarPublicacion(id_pub) {
  const resultado = await pool.query(`UPDATE encabezado_pub SET estado = 'Cancelado' WHERE id_pub =$1 RETURNING id_pub`, [id_pub]);

  if(resultado.rowCount === 0) return undefined;

  return listarPublicacionesPorId(id_pub);
}

async function eliminarPublicacionPorId(id_pub){
  const publicacion = await listarPublicacionesPorId(id_pub);

  if (!publicacion) return undefined;

  // En una transacción: o se borra todo o no se borra nada
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    await cliente.query(`DELETE FROM detalle_pub WHERE id_pub = $1`, [id_pub]);
    await cliente.query(`DELETE FROM encabezado_pub WHERE id_pub = $1`, [id_pub]);
    await cliente.query('COMMIT');
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }

  return publicacion;
}

async function actualizarPunto(id_pub, id_punto) {
  
  const resultado = await pool.query(`UPDATE detalle_pub SET id_punto = $1 WHERE id_pub = $2 RETURNING id_pub`, [id_punto, id_pub]);

  if(resultado.rowCount === 0) return undefined;

  return listarPublicacionesPorId(id_pub);
}

module.exports = { listarPublicaciones, listarPublicacionesPorId, listarPublicacionesDisponibles, crearPublicacion, actualizarEstadoPublicacion, actualizarCantidaMedi, cancelarPublicacion, eliminarPublicacionPorId, actualizarPunto };