const pool = require('../bd');

function crearModeloToken(pool){

    async function revocar(jti, id_usuario, fecha_expiracion) {
        await pool.query('INSERT INTO token_revocado (jti, id_usuario, fecha_expiracion) VALUES ($1, $2, TO_TIMESTAMP($3)) ON CONFLICT (jti) DO NOTHING',[jti, id_usuario, fecha_expiracion]);
    }

    async function estaRevocado(jti) {
        const { rows } = await pool.query('SELECT 1 FROM token_revocado WHERE jti = $1',[String(jti || '')]);

        return rows.length > 0;
    }

    async function listar() {
        const { rows } = await pool.query('SELECT jti, id_usuario, fecha_expiracion, fecha_revocacion FROM token_revocado ORDER BY fecha_revocacion, jti');

        return rows;
    }

    async function limpiarExpirados() {

        const { rows } = await pool.query(`DELETE FROM token_revocado WHERE fecha_expiracion < NOW() RETURNING *`);

        return rows;
    }

    return { revocar, estaRevocado, listar, limpiarExpirados}
}

module.exports = {crearModeloToken}