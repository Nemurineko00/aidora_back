const pool = require('../bd');

function crearModeloToken(pool){

    // Columnas reales de la tabla: jti, id_cuenta, expira_en
    async function revocar(jti, id_cuenta, expira_en) {
        await pool.query('INSERT INTO token_revocado (jti, id_cuenta, expira_en) VALUES ($1, $2, TO_TIMESTAMP($3)) ON CONFLICT (jti) DO NOTHING',[jti, id_cuenta, expira_en]);
    }

    async function estaRevocado(jti) {
        const { rows } = await pool.query('SELECT 1 FROM token_revocado WHERE jti = $1',[String(jti || '')]);

        return rows.length > 0;
    }

    async function listar() {
        const { rows } = await pool.query('SELECT jti, id_cuenta, expira_en FROM token_revocado ORDER BY expira_en, jti');

        return rows;
    }

    async function limpiarExpirados() {

        const { rows } = await pool.query(`DELETE FROM token_revocado WHERE expira_en < NOW() RETURNING *`);

        return rows;
    }

    return { revocar, estaRevocado, listar, limpiarExpirados}
}

module.exports = {crearModeloToken}