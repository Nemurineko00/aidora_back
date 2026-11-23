const modeloPublicacion = require('../Modelo/publicacion_modelo');

async function obtenerPublicaciones(req, res) {
    
    const publicaciones = await modeloPublicacion.listarPublicaciones();

    res.json(publicaciones);
}

async function obtenerPublicacionesDisponibles(req, res) {
    
    const publicaciones = await modeloPublicacion.listarPublicacionesDisponibles();

    res.json(publicaciones);
}

async function obtenerPublicacionesPorId(req, res) {
    
    const publicacion = await modeloPublicacion.listarPublicacionesPorId(Number(req.params.id));

    if(!publicacion){
        return res.status(404).json({error: 'Publicacion no encontrada'});
    }

    res.json(publicacion);
}

async function crearPublicacion(req, res) {
    const cantidad = Number(req.body.cantidad);

    if(!Number.isInteger(cantidad) || cantidad <= 0){
        return res.status(400).json({error: 'La cantidad debe ser un número mayor a 0'})
    }
    const publicacion = await modeloPublicacion.crearPublicacion({id_usuario: req.sesion.id, id_medicamento: Number(req.body.id_medicamento), id_punto: Number(req.body.id_punto), cantidad});

    res.status(201).json(publicacion);
}

async function actualizarEstadoPublicacion(req, res) {
    
    const publicacion = await verificarPropietarioPublicacion(Number(req.params.id), req.sesion.id);

    if(publicacion == null){
        return res.status(404).json({error: 'Publicacion no encontrada'});
    }

    if(publicacion === false){
        return res.status(403).json({error: 'Esta publicacion no es tuya'});
    }

    const resultado = await modeloPublicacion.actualizarEstadoPublicacion(Number(req.params.id), req.body.estado);

    res.json(resultado);
}

async function actualizarCantidaMedicamento(req, res) {
    const cantidad = Number(req.body.cantidad);

    if(!Number.isInteger(cantidad) || cantidad <= 0){
        return res.status(400).json({error: 'La cantidad debe ser un número entero mayor a 0'});
    }

    const dueno = await verificarPropietarioPublicacion(Number(req.params.id), req.sesion.id);

    if(dueno == null){
        return res.status(404).json({error: 'Publicacion no encontrada'});
    }

    if(dueno === false){
        return res.status(403).json({error: 'Esta publicacion no es tuya'});
    }

    const publicacion = await modeloPublicacion.actualizarCantidaMedi(Number(req.params.id), cantidad);

    res.json(publicacion);
}

async function actualizarPunto(req, res) {
    
    const publicacion = await verificarPropietarioPublicacion(Number(req.params.id), req.sesion.id);

    if(publicacion == null){
        return res.status(404).json({error: 'Publicacion no encontrada'});
    }

    if(publicacion === false){
        return res.status(403).json({error: 'Esta publicacion no es tuya'});
    }

    const resultado = await modeloPublicacion.actualizarPunto(Number(req.params.id), Number(req.body.id_punto))

    res.json(resultado);
}

async function cancelarPublicacion(req, res) {
    
    const publicacion = await verificarPropietarioPublicacion(Number(req.params.id), req.sesion.id);

    if(publicacion == null){
        return res.status(404).json({error: 'Publicacion no encontrada'});
    }

    if(publicacion === false){
        return res.status(403).json({error: 'Esta publicacion no es tuya'});
    }
    const resultado = await modeloPublicacion.cancelarPublicacion(Number(req.params.id));

    res.json(resultado);
}

async function eliminarPublicacion(req, res) {
    
    const publicacion = await verificarPropietarioPublicacion(Number(req.params.id), req.sesion.id);

    if(publicacion == null){
        return res.status(404).json({error: 'Publicacion no encontrada'});
    }

    if(publicacion === false){
        return res.status(403).json({error: 'Esta publicacion no es tuya'});
    }

    try {
        const resultado = await modeloPublicacion.eliminarPublicacionPorId(Number(req.params.id));

        res.json(resultado);
    } catch (error) {
        if (error.code === '23503') {
            return res.status(409).json({error: 'No se puede eliminar: la publicacion ya tiene solicitudes o reportes. Cancelala en su lugar.'});
        }
        throw error;
    }
}

async function verificarPropietarioPublicacion(id_pub,id_usuario) {
    const publicacion = await modeloPublicacion.listarPublicacionesPorId(id_pub);
    if (!publicacion) return null;

    if (publicacion.id_usuario !== id_usuario) return false;
    return publicacion;
}

module.exports = {obtenerPublicaciones, obtenerPublicacionesDisponibles, obtenerPublicacionesPorId, crearPublicacion, actualizarEstadoPublicacion, actualizarCantidaMedicamento, actualizarPunto,cancelarPublicacion, eliminarPublicacion, verificarPropietarioPublicacion};