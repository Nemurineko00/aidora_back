const pool = require('../bd');

function crearModeloToken(pool){

    async function revocar(jti, id_usuario, fecha_expiracion) {
        await pool.query('INSERT INTO token_revocado (jti, id_usuario, fecha_expiracion) VALUES (?,?, FROM_UNIXTIME(?))',[jti, id_usuario, fecha_expiracion]);
    }

    async function estaRevocado(jti) {
        const [ filas ] = await pool.query('SELECT 1 FROM token_revocado WHERE jti = ?',[String(jti || '')]);

        return filas.length > 0;
    }

    async function listar() {
        const [ filas ] = await pool.query('SELECT jti, id_usuario, fecha_expiracion, fecha_revocacion FROM token_revocado ORDER BY fecha_revocacion, jti');

        return filas;
    }

    return { revocar, estaRevocado, listar}
}

module.exports = {crearModeloToken}