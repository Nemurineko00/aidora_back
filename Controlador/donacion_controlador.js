const publicacionModelo = require('../Modelo/publicacion_modelo');

async function listarDonaciones(req, res) {
  res.json({ donaciones: await publicacionModelo.listarPublicaciones() });
}

async function obtenerDonacion(req, res) {
  const id_pub=Number(req.params.id);
  if(!Number.isInteger(id_pub)){
    return res.status(400).json({error:'El id de la donación no es válido'});
  }


  const donacion =await publicacionModelo.listarPublicacionesPorId(id_pub);
  if(!donacion)return res.status(404).json({error:'No encontramos esa donación'}); 
  res.json({donacion});
}

module.exports = { listarDonaciones, obtenerDonacion };