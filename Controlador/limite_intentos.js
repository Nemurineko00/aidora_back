const { rateLimit } = require('express-rate-limit');

const VENTANA_MS = 15 * 60 * 1000;
const MENSAJE = { error: 'Demasiados intentos fallidos. Espera 15 minutos e intenta de nuevo.' };

const porIp = rateLimit({
  windowMs: VENTANA_MS,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: MENSAJE,
});

const porCuenta = rateLimit({
  windowMs: VENTANA_MS,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: MENSAJE,
  keyGenerator: (req) => cuentaDe(req),
});

function cuentaDe(req) {
  return String(req.body?.correo ?? req.body?.clave ?? '').trim().toLowerCase();
}

function reiniciarAlEntrar(req, res, next) {
  res.on('finish', () => {
    if (res.statusCode < 400) porCuenta.resetKey(cuentaDe(req));
  });
  next();
}

const limitarLogin = [porIp, porCuenta, reiniciarAlEntrar];

module.exports = { limitarLogin };
