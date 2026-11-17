const poool = require('../bd');

const COLUMNAS_PUBLICAS = 'id_ong, nombre, tipo, rfc_clave, clave_admin, verifica_entrega ';

async function listar(){
  const {rows} = await poool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM ong_hospital ORDER BY id_ong`);
  return rows;
}

async function listarOngPorId(id_ong) {
  const {rows}= await poool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM ong_hospital WHERE id_ong = $1`, [id_ong]);
  return rows[0];
}

async function crear({nombre, tipo, rfc_clave, clave_admin, contrasena}) {
    const { rows } = await poool.query(`INSERT INTO ong_hospital (nombre, tipo, rfc_clave, clave_admin, contrasena) VALUES ($1, $2, $3, $4, $5) RETURNING ${COLUMNAS_PUBLICAS}`,[nombre, tipo, rfc_clave, clave_admin, contrasena]);

    return rows[0];
}

async function actualizar( id_ong, { nombre, tipo, rfc_clave, clave_admin }) {
  const cambios = Object.entries({nombre, tipo, rfc_clave, clave_admin}).filter(([_, valor]) => valor !== undefined);

    if (cambios.length === 0) return listarOngPorId(id_ong);

    const columnas = cambios.map(([columna], i) => `${columna} = $${i + 1}`).join(', ');

    const resultado = await poool.query(`UPDATE ong_hospital SET ${columnas} WHERE id_ong = $${cambios.length + 1} RETURNING ${COLUMNAS_PUBLICAS}`,[...cambios.map(([_, valor]) => valor),id_ong]);

    if (resultado.rowCount === 0) return undefined;
    return resultado.rows[0];
}

async function verificarEntrega(id_ong) {
  const resultado = await poool.query(`UPDATE ong_hospital SET verifica_entrega = true WHERE id_ong = $1 RETURNING *`, [id_ong]);
  return resultado.rows[0];
}

async function eliminarPorId(id_ong) {
  const {rows} = await poool.query(`DELETE FROM ong_hospital WHERE id_ong = $1 RETURNING *`, [id_ong]);
  return rows[0];
}

module.exports = { listarOngPorId, eliminarPorId, listar, verificarEntrega, crear, actualizar };