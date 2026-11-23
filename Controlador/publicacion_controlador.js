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
    const datos = req.body || {};
    const cantidad = Number(datos.cantidad);
    const id_punto = Number(datos.id_punto);

    if(!Number.isInteger(cantidad) || cantidad <= 0){
        return res.status(400).json({error: 'La cantidad debe ser un número mayor a 0'})
    }
    if(!Number.isInteger(id_punto) || id_punto <= 0){
        return res.status(400).json({error: 'Selecciona un punto de entrega'});
    }

    let id_medicamento = null;
    let medicamento = null;
    if (datos.id_medicamento !== undefined && datos.id_medicamento !== null && datos.id_medicamento !== '') {
        id_medicamento = Number(datos.id_medicamento);
        if(!Number.isInteger(id_medicamento) || id_medicamento <= 0){
            return res.status(400).json({error: 'El medicamento no es válido'});
        }
    } else {
        medicamento = {
            nombre_comercial: String(datos.nombre_comercial || '').trim(),
            nombre_generico: String(datos.nombre_generico || '').trim(),
            codigo_rs: String(datos.codigo_rs || '').trim(),
            lote: String(datos.lote || '').trim(),
            fecha_caducidad: String(datos.fecha_caducidad || '').trim(),
        };
        if (!medicamento.nombre_generico) return res.status(400).json({error: 'El nombre del medicamento es obligatorio'});
        if (!medicamento.lote) return res.status(400).json({error: 'El número de lote es obligatorio'});
        if (!medicamento.codigo_rs) return res.status(400).json({error: 'El registro sanitario (RS) es obligatorio'});
        if (!/^\d{4}-\d{2}-\d{2}$/.test(medicamento.fecha_caducidad)) {
            return res.status(400).json({error: 'La fecha de caducidad no es válida (AAAA-MM-DD)'});
        }
        const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
        if (medicamento.fecha_caducidad <= hoy) {
            return res.status(400).json({error: 'El medicamento debe caducar después de hoy'});
        }
    }

    try {
        const publicacion = await modeloPublicacion.crearPublicacion({id_usuario: req.sesion.id, id_medicamento, medicamento, id_punto, cantidad});
        res.status(201).json(publicacion);
    } catch (error) {
        if (error.code === '23503') {
            return res.status(400).json({error: 'El medicamento o el punto de entrega no existen'});
        }
        throw error;
    }
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