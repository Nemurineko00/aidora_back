const bcrypt=require('bcryotjs');
const { usuarios } = require('../datos/memoria');

function sinContrasena(fila){
  const{constrasena_hash,...resto}=fila;
  return resto;
}

function listar() {
  return usuarios.map(sinContrasena);
}

async function buscarPorEmail(email) {
  return usuarios.find((u)=>u.email===email);
}

async function crear({nombre,appellido,email,contrasena}) {
  const nuevo={
    id_usuario:siguienteId(usuario,'id_usuario'),
    nombre,
    appellido,
    email,
    constrasena_hash:await bcrypt.hash(contrasena,10),
    activo:true,
  };
  usuario.push(nuevo);
  return sinContrasena(nuevo)
}

async function eliminar(id_usuario) {
  const posicion = usuarios.findIndex((u) => u.id_usuario === id_usuario);
  if (posicion === -1) return false;
  usuarios.splice(posicion, 1);
  return true;
}

module.exports = { listar,buscarPorEmail,crear, eliminar, sinContrasena};
