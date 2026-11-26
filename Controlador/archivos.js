const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const CARPETA_SUBIDAS = path.join(__dirname, '..', 'uploads');
const RUTA_PUBLICA = '/uploads';
const EXTENSIONES = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' };

fs.mkdirSync(CARPETA_SUBIDAS, { recursive: true });

const almacenamiento = multer.diskStorage({
  destination: CARPETA_SUBIDAS,
  filename: (req, archivo, cb) => cb(null, `${crypto.randomUUID()}${EXTENSIONES[archivo.mimetype]}`),
});

const multerFoto = multer({
  storage: almacenamiento,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, archivo, cb) => {
    if (EXTENSIONES[archivo.mimetype]) return cb(null, true);
    const error = new Error('La imagen debe ser PNG, JPG o WEBP');
    error.code = 'TIPO_ARCHIVO_INVALIDO';
    cb(error);
  },
}).single('foto');

function urlDeArchivo(archivo) {
  return archivo ? `${RUTA_PUBLICA}/${archivo.filename}` : null;
}

function borrarArchivo(url) {
  if (typeof url !== 'string' || !url.startsWith(`${RUTA_PUBLICA}/`)) return;
  const nombre = path.basename(url);
  fs.promises.unlink(path.join(CARPETA_SUBIDAS, nombre)).catch((error) => {
    if (error.code !== 'ENOENT') console.error('No se pudo borrar el archivo', nombre, error.message);
  });
}

function borrarFotoSiFalla(req, res, next) {
  if (req.file) {
    res.on('finish', () => {
      if (res.statusCode >= 400) borrarArchivo(urlDeArchivo(req.file));
    });
  }
  next();
}

const subirFoto = [multerFoto, borrarFotoSiFalla];

module.exports = { CARPETA_SUBIDAS, RUTA_PUBLICA, subirFoto, urlDeArchivo, borrarArchivo };
