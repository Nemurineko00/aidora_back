const modeloPublicacion = require('../Modelo/publicacion_modelo');
const modeloDonacion = require('../Modelo/donacion_modelo');
const { validar, limpiar } = require('./validaciones');
const { urlDeArchivo, borrarArchivo } = require('./archivos');

async function obtenerPublicaciones(req, res) {
    
    const publicaciones = await modeloPublicacion.listarPublicaciones();

    res.json(publicaciones);
}

async function obtenerPublicacionesDisponibles(req, res) {
    
    const publicaciones = await modeloPublicacion.listarPublicacionesDisponibles();

    res.json(publicaciones);
}

async function obtenerPublicacionesPorId(req, res) {
    if (idInvalido(req, res)) return;
    
    const publicacion = await modeloPublicacion.listarPublicacionesPorId(Number(req.params.id));

    if(!publicacion){
        return res.status(404).json({error: 'Publicacion no encontrada'});
    }

    res.json(publicacion);
}

function leerMedicamento(datos) {
    const error =
        validar.nombreMedicamento(datos.nombre_generico) ||
        (limpiar(datos.nombre_comercial) ? validar.nombreMedicamento(datos.nombre_comercial, 'El nombre comercial') : null) ||
        validar.lote(datos.lote) ||
        validar.registroSanitario(datos.codigo_rs) ||
        validar.fechaCaducidad(datos.fecha_caducidad);
    if (error) return { error };

    const nombre_generico = limpiar(datos.nombre_generico);
    return {
        medicamento: {
            nombre_generico,
            nombre_comercial: limpiar(datos.nombre_comercial) || nombre_generico,
            codigo_rs: limpiar(datos.codigo_rs).toUpperCase(),
            lote: limpiar(datos.lote).toUpperCase(),
            fecha_caducidad: limpiar(datos.fecha_caducidad),
        },
    };
}

function leerCantidadYPunto(datos) {
    const error = validar.cantidad(datos.cantidad) || (validar.id(datos.id_punto) ? 'Selecciona un punto de entrega' : null);
    if (error) return { error };
    return { cantidad: Number(datos.cantidad), id_punto: Number(datos.id_punto) };
}

function idInvalido(req, res) {
    if (validar.id(req.params.id)) {
        res.status(400).json({ error: 'La publicación no es válida' });
        return true;
    }
    return false;
}

async function crearPublicacion(req, res) {
    const datos = req.body || {};
    const basicos = leerCantidadYPunto(datos);
    if (basicos.error) return res.status(400).json({ error: basicos.error });
    const { cantidad, id_punto } = basicos;

    const leido = leerMedicamento(datos);
    if (leido.error) return res.status(400).json({ error: leido.error });
    const medicamento = { ...leido.medicamento, imagen_empaque: urlDeArchivo(req.file) };

    try {
        const publicacion = await modeloPublicacion.crearPublicacion({id_usuario: req.sesion.id, medicamento, id_punto, cantidad});
        res.status(201).json(publicacion);
    } catch (error) {
        if (error.code === '23503') {
            return res.status(400).json({error: 'El punto de entrega no existe'});
        }
        throw error;
    }
}

async function obtenerMisPublicaciones(req, res) {
    const [publicaciones, solicitudes] = await Promise.all([
        modeloPublicacion.listarPublicacionesDeUsuario(req.sesion.id),
        modeloDonacion.listarSolicitudesDePublicacionesDe(req.sesion.id),
    ]);
    res.json(publicaciones.map((p) => ({
        ...p,
        solicitudes: solicitudes.filter((s) => s.id_pub === p.id_pub),
    })));
}

async function obtenerDetallePublicacion(req, res) {
    const id_pub = Number(req.params.id);
    if (!Number.isInteger(id_pub) || id_pub <= 0) return res.status(400).json({ error: 'La publicación no es válida' });

    const publicacion = await modeloPublicacion.listarPublicacionesPorId(id_pub);
    if (!publicacion) return res.status(404).json({ error: 'Publicacion no encontrada' });

    const yo = req.sesion.id;
    const es_mia = publicacion.id_usuario === yo;

    let donacion = null;
    const id_solicitud = Number(req.query.solicitud);
    if (Number.isInteger(id_solicitud) && id_solicitud > 0) {
        const d = await modeloDonacion.obtenerDonacion(id_solicitud);
        if (d && d.id_pub === id_pub && (d.id_receptor === yo || d.id_donante === yo)) donacion = d;
    }
    if (!donacion && !es_mia) {
        donacion = (await modeloDonacion.ultimaSolicitudDeUsuario(yo, id_pub)) || null;
    }

    if (!es_mia && !donacion && publicacion.estado !== 'Disponible') {
        return res.status(404).json({ error: 'Publicacion no encontrada' });
    }

    res.json({ publicacion, es_mia, donacion: donacion ? { ...donacion, mi_rol: donacion.id_donante === yo ? 'DONANTE' : 'RECEPTOR' } : null });
}

async function actualizarPublicacion(req, res) {
    const id_pub = Number(req.params.id);
    if (!Number.isInteger(id_pub) || id_pub <= 0) return res.status(400).json({ error: 'La publicación no es válida' });

    const publicacion = await verificarPropietarioPublicacion(id_pub, req.sesion.id);
    if (publicacion == null) return res.status(404).json({ error: 'Publicacion no encontrada' });
    if (publicacion === false) return res.status(403).json({ error: 'Esta publicacion no es tuya' });
    if (publicacion.estado !== 'Disponible') {
        return res.status(400).json({ error: 'Solo puedes editar publicaciones que sigan disponibles' });
    }

    const datos = req.body || {};
    const basicos = leerCantidadYPunto(datos);
    if (basicos.error) return res.status(400).json({ error: basicos.error });
    const leido = leerMedicamento(datos);
    if (leido.error) return res.status(400).json({ error: leido.error });

    try {
        const imagen_empaque = urlDeArchivo(req.file);
        const resultado = await modeloPublicacion.actualizarPublicacionCompleta(id_pub, { medicamento: { ...leido.medicamento, imagen_empaque }, ...basicos });
        if (imagen_empaque && publicacion.imagen_empaque !== imagen_empaque) borrarArchivo(publicacion.imagen_empaque);
        res.json(resultado);
    } catch (error) {
        if (error.code === '23503') return res.status(400).json({ error: 'El punto de entrega no existe' });
        throw error;
    }
}

async function actualizarEstadoPublicacion(req, res) {
    if (idInvalido(req, res)) return;
    
    const publicacion = await verificarPropietarioPublicacion(Number(req.params.id), req.sesion.id);

    if(publicacion == null){
        return res.status(404).json({error: 'Publicacion no encontrada'});
    }

    if(publicacion === false){
        return res.status(403).json({error: 'Esta publicacion no es tuya'});
    }

    if (!['Disponible', 'Reservado', 'Entregado', 'Cancelado'].includes(req.body?.estado)) {
        return res.status(400).json({error: 'Estado no válido'});
    }

    const resultado = await modeloPublicacion.actualizarEstadoPublicacion(Number(req.params.id), req.body.estado);

    res.json(resultado);
}

async function actualizarCantidaMedicamento(req, res) {
    if (idInvalido(req, res)) return;
    const errorCantidad = validar.cantidad(req.body?.cantidad);
    if (errorCantidad) return res.status(400).json({ error: errorCantidad });
    const cantidad = Number(req.body.cantidad);

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
    if (idInvalido(req, res)) return;
    
    const publicacion = await verificarPropietarioPublicacion(Number(req.params.id), req.sesion.id);

    if(publicacion == null){
        return res.status(404).json({error: 'Publicacion no encontrada'});
    }

    if(publicacion === false){
        return res.status(403).json({error: 'Esta publicacion no es tuya'});
    }

    if (validar.id(req.body?.id_punto)) return res.status(400).json({ error: 'Selecciona un punto de entrega' });

    const resultado = await modeloPublicacion.actualizarPunto(Number(req.params.id), Number(req.body.id_punto))

    res.json(resultado);
}

async function cancelarPublicacion(req, res) {
    if (idInvalido(req, res)) return;
    
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
    if (idInvalido(req, res)) return;
    
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

module.exports = {obtenerMisPublicaciones, obtenerDetallePublicacion, actualizarPublicacion, obtenerPublicaciones, obtenerPublicacionesDisponibles, obtenerPublicacionesPorId, crearPublicacion, actualizarEstadoPublicacion, actualizarCantidaMedicamento, actualizarPunto,cancelarPublicacion, eliminarPublicacion, verificarPropietarioPublicacion};