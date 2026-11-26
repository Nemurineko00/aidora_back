const pool = require('../bd');

const COLUMNAS_PUBLICAS = 's.id_solicitud, s.id_usuario, s.id_pub, s.estado, s.fecha_entrega';

async function listarSolicitud() {
    const { rows } = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM solicitud s ORDER BY s.id_solicitud`);

    return rows;
}

async function listarSolicitudPorId(id_solicitud){
    const { rows } = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM solicitud s WHERE s.id_solicitud = $1`, [id_solicitud]);

    return rows[0];
}

async function listarSolicitudesPorUsuario(id_usuario) {
    const { rows } = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM solicitud s WHERE s.id_usuario = $1`, [id_usuario]);

    return rows;
}

async function crearSolicitud({id_usuario, id_pub}) {
    const { rows } = await pool.query(`INSERT INTO solicitud (id_usuario, id_pub,estado) VALUES ($1, $2, 'Pendiente') RETURNING *`, [id_usuario, id_pub]);

    return rows[0];
}

async function actualizarEstadoSolicitud(id_solicitud, estado, fecha_entrega = null) {
    const resultado = await pool.query(`UPDATE solicitud SET estado = $1, fecha_entrega = $2 WHERE id_solicitud = $3 RETURNING *`, [estado, id_solicitud, fecha_entrega]);

    if(resultado.rowCount === 0)return undefined;

    return resultado.rows[0];
}


async function listarSolicitudConPuntoEntrega(id_solicitud) {
    const { rows } = await pool.query(`SELECT s.id_solicitud, s.id_usuario, s.id_pub, s.estado, pe.id_punto, pe.nombre_punto, pe.direccion, m.id_medicamento, m.nombre_generico, dp.cantidad FROM solicitud s JOIN encabezado_pub ep ON s.id_pub = ep.id_pub JOIN detalle_pub dp ON ep.id_pub = dp.id_pub JOIN medicamento m ON dp.id_medicamento = m.id_medicamento JOIN punto_entrega pe ON dp.id_punto = pe.id_punto WHERE s.id_solicitud = $1`, [id_solicitud]);

    return rows[0];
    
}

async function eliminarSolicitudPorId(id_solicitud) {
    const solicitud = await listarSolicitudPorId(id_solicitud);

    if(!solicitud) return undefined;

    await pool.query(`DELETE FROM solicitud WHERE id_solicitud = $1`, [id_solicitud]);

    return solicitud;
}

async function existeSolicitudActiva(id_usuario, id_pub) {
    const { rows } = await pool.query(`SELECT 1 FROM solicitud WHERE id_usuario = $1 AND id_pub = $2 AND estado IN ('Pendiente', 'Aceptada')`,[id_usuario, id_pub]);
    
    return rows.length > 0;
}


module.exports = {listarSolicitud, listarSolicitudPorId, listarSolicitudesPorUsuario,crearSolicitud, actualizarEstadoSolicitud, listarSolicitudConPuntoEntrega, eliminarSolicitudPorId, existeSolicitudActiva}