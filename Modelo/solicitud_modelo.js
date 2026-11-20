const pool = require('../bd');

const COLUMNAS_PUBLICAS = 's.id_solicitud, s.id_usuario, s.id_pub, s.estado';

async function listarSolicitud() {
    const { rows } = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM solicitud s ORDER BY s.id_solicitud`);

    return rows;
}

async function listarSolicitudPorId(id_solicitud){
    const { rows } = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM solicitud s WHERE s.id_solicitud = $1`, [id_solicitud]);

    return rows[0];
}

async function crearSolicitud({id_usuario, id_pub}) {
    const { rows } = await pool.query(`INSERT INTO solicitud (id_usuario, id_pub) VALUES ($1, $2) RETURNING *`, [id_usuario, id_pub]);

    return rows[0];
}

async function actualizarEstadoSolicitud(id_solicitud, estado) {
    const resultado = await pool.query(`UPDATE solicitud SET estado = $1 WHERE id_solicitud = $2 RETURNING *`, [estado, id_solicitud]);

    if(resultado.rowCount === 0)return undefined;

    return resultado.rows[0];
}

async function asignarPuntoEntrega(id_solicitud, id_punto) {
    const { rows } = await pool.query(`INSERT INTO solicitud_punto (id_solicitud, id_punto) VALUES ($1, $2) RETURNING *`, [id_solicitud, id_punto]);

    return rows[0];
}

async function listarSolicitudConPuntoEntrega(id_solicitud) {
    const { rows } = await pool.query(`SELECT s.id_solicitud,s.id_usuario, s.id_pub, s.estado, sp.id_punto, pe.nombre_punto, pe.direccion FROM solicitud s LEFT JOIN solicitud_punto sp ON s.id_solicitud = sp.id_solicitud LEFT JOIN punto_entrega pe ON sp.id_punto = pe.id_punto WHERE s.id_solicitud = $1`, [id_solicitud]);

    return rows[0];
    
}

async function eliminarSolicitudPorId(id_solicitud) {
    const solicitud = await listarSolicitudPorId(id_solicitud);

    if(!solicitud) return undefined;

    await pool.query(`DELETE FROM solicitud_punto WHERE id_solicitud = $1`, [id_solicitud]);

    await pool.query(`DELETE FROM solicitud WHERE id_solicitud = $1`, [id_solicitud]);

    return solicitud;
}

module.exports = {listarSolicitud, listarSolicitudPorId, crearSolicitud, actualizarEstadoSolicitud, asignarPuntoEntrega, listarSolicitudConPuntoEntrega, eliminarSolicitudPorId}