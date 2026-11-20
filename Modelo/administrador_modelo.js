const pool = require('../bd');

const COLUMNAS_PUBLICAS =  'id_admin, nombre, email';

async function listarAdmin() {
    const { rows } = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM administrador ORDER BY id_admin`);

    return rows;
}

async function listarAdminId(id_admin) {
    const { rows } = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM administrador WHERE id_admin = $1`,[id_admin]);

    return rows[0];
}

async function crearAdmin(id_admin, nombre, email, contrasena) {
    const { rows } = await pool.query(`INSERT INTO administrador (id_admin, nombre, email, contrasena) VALUES ($1, $2, $3, $4) RETURNING ${COLUMNAS_PUBLICAS}`, [id_admin, nombre, email, contrasena]);

    return rows[0];
}

module.exports = {listarAdmin, listarAdminId, crearAdmin}