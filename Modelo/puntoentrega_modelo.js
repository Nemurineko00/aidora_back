const pool = require('../bd');

const COLUMNAS_PUBLICAS = 'id_punto, id_ong, nombre_punto, direccion, tipo, activo, fecha_entrega';

async function listarPuntoEntrega() {
    const { rows } = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM punto_entrega ORDER BY id_punto`);

    return rows;
}

async function listarPuntoEntregaPorId(id_punto) {
    const { rows } = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM punto_entrega WHERE id_punto = $1`, [id_punto]);

    return rows[0];
}

async function crearPuntoEntrega({id_ong, nombre_punto, direccion, tipo, fecha_entrega}) {
    
    const { rows } = await pool.query(`INSERT INTO punto_entrega (id_ong, nombre_punto, direccion, tipo, fecha_entrega) VALUES ($1, $2, $3, $4, $5) RETURNING ${COLUMNAS_PUBLICAS}`, [id_ong, nombre_punto, direccion, tipo, fecha_entrega]);

    return rows[0];
}

async function actualizarPuntoEntrega(id_punto, {nombre_punto, direccion, tipo, fecha_entrega}) {
    
    const cambios = Object.entries({nombre_punto, direccion, tipo, fecha_entrega}).filter(([_, valor]) => valor !== undefined);

    if(cambios.length === 0) return listarPuntoEntregaPorId(id_punto);

    const columnas = cambios.map(([columna], i) => `${columna} = $${i +1}`).join(', ');

    const resultado = await pool.query(`UPDATE punto_entrega SET ${columnas} WHERE id_punto = $${cambios.length + 1} RETURNING ${COLUMNAS_PUBLICAS}`, [...cambios.map(([_,valor]) => valor), id_punto]);

    if(resultado.rowCount === 0) return undefined;

    return resultado.rows[0];
}

async function desactivarPuntoEntregaPorId(id_punto) {
    const resultado = await pool.query(`UPDATE punto_entrega SET activo = false WHERE id_punto = $1 RETURNING ${COLUMNAS_PUBLICAS}`, [id_punto]);

    if(resultado.rowCount === 0) return undefined;

    return resultado.rows[0];
}

async function activarPuntoEntregaPorId(id_punto) {
    
    const resultado = await pool.query(`UPDATE punto_entrega SET activo = true WHERE id_punto = $1 RETURNING ${COLUMNAS_PUBLICAS}`, [id_punto]);

    if(resultado.rowCount === 0)return undefined;

    return resultado.rows[0];
}

async function eliminarPuntoEntregaPorId(id_punto) {
    const { rows } = await pool.query(`DELETE FROM punto_entrega WHERE id_punto = $1 RETURNING ${COLUMNAS_PUBLICAS}`, [id_punto]);

    return rows[0];
}

async function listarPuntoEntregaPorOng(id_ong) {
    const { rows } = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM punto_entrega WHERE id_ong = $1 ORDER BY nombre_punto`, [id_ong]);

    return rows;
}

module.exports = {listarPuntoEntrega, listarPuntoEntregaPorId, listarPuntoEntregaPorOng, crearPuntoEntrega, actualizarPuntoEntrega, activarPuntoEntregaPorId, desactivarPuntoEntregaPorId, eliminarPuntoEntregaPorId}