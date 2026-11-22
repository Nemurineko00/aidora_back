const modeloPublicacion = require('../modelo/publicacion');
const { actualizarPunto } = require('../Modelo/publicacion_modelo');

async function obtenerPublicaciones(req, res) {
    
    const publicaciones = await modeloPublicacion.listarPublicaciones();

    res.json(publicaciones);
}

async function obtenerPublicacionesDisponibles(req, res) {
    
    const publicaciones = await modeloPublicacion.obtenerPublicacionesDisponibles();

    res.json(publicaciones);
}

async function obtenerPublicacionesPorId(req, res) {
    
    const publicacion = await modeloPublicacion.obtenerPublicacionesPorId(Number(req.params.id));

    if(!publicacion){
        return res.status(404).json({mensaje : 'Publicacion no encontrada'});
    }

    res.json(publicacion);
}

async function crearPublicacion(req, res) {
    
    const publicacion = await modeloPublicacion.crearPublicacion({id_usuario: req.id_usuario.id_usuario, id_medicamento: req.body.id_medicamento, cantidad: req.body.cantidad});

    res.status(201).json(publicacion);
}

async function actualizarEstadoPublicacion(req, res) {
    
    const publicacion = await modeloPublicacion.actualizarEstadoPublicacion(Number(req.params.id), req.body.estado);

    if(!publicacion){
        return res.status(404).json({mensaje : 'Publicacion no encontrada'});
    }

    res.json(publicacion);
}

async function actualizarCantidaMedicamento(req, res) {
    
    const publicacion = await modeloPublicacion.actualizarCantidaMedi(Number(req.params.id), req.body.cantidad);

    if(!publicacion){
        return res.status(404).json({mensaje : 'Publicacion no encontrada'});
    }

    res.json(publicacion);
}

async function actualizarPunto(req, res) {
    
    const publicacion = await modeloPublicacion.actualizarPunto(Number(req.params.id), Number(req.params.id));

    if(!publicacion){
        return res.status(404).json({mensaje : 'Publicacion no encontrada'});
    }

    res.json(publicacion);
}

async function cancelarPublicacion(req, res) {
    
    const publicacion = await modeloPublicacion.cancelarPublicacion(Number(req.params.id));

    if(!publicacion){
        return res.status(404).json({mensaje : 'Publicacion no encontrada'});
    }

    res.json(publicacion);
}

async function eliminarPublicacion(req, res) {
    
    const publicacion = await modeloPublicacion.eliminarPublicacionPorId(Number(req.params.id));

    if(!publicacion){
        return res.status(404).json({mensaje : 'Publicacion no encontrada'});
    }

    res.json(publicacion);
}

module.exports = {obtenerPublicaciones, obtenerPublicacionesDisponibles, obtenerPublicacionesPorId, crearPublicacion, actualizarEstadoPublicacion, actualizarCantidaMedicamento, actualizarPunto,cancelarPublicacion, eliminarPublicacion};