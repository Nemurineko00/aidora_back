const { usuarios } = require('../datos/memoria');

function sinContrasena(fila){
  const{constrasena_hash,...resto}=fila;
  return resto;
}

function listar() {
  return usuarios;
}

function eliminar(id_usuario) {
  const posicion = usuarios.findIndex((u) => u.id_usuario === id_usuario);
  if (posicion === -1) return false;
  usuarios.splice(posicion, 1);
  return true;
}

module.exports = { listar, eliminar, sinContrasena};
