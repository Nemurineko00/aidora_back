const modeloPublicacion = require('../Modelo/publicacion_modelo');
const modeloDonacion = require('../Modelo/donacion_modelo');

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

// Lee y valida los datos del medicamento que manda el formulario.
// Devuelve { medicamento } si todo está bien o { error } con el mensaje para el usuario.
function leerMedicamento(datos) {
    const medicamento = {
        nombre_comercial: String(datos.nombre_comercial || '').trim(),
        nombre_generico: String(datos.nombre_generico || '').trim(),
        codigo_rs: String(datos.codigo_rs || '').trim(),
        lote: String(datos.lote || '').trim(),
        fecha_caducidad: String(datos.fecha_caducidad || '').trim(),
    };
    if (!medicamento.nombre_generico) return { error: 'El nombre del medicamento es obligatorio' };
    if (!medicamento.lote) return { error: 'El número de lote es obligatorio' };
    if (!medicamento.codigo_rs) return { error: 'El registro sanitario (RS) es obligatorio' };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(medicamento.fecha_caducidad)) {
        return { error: 'La fecha de caducidad no es válida (AAAA-MM-DD)' };
    }
    const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
    if (medicamento.fecha_caducidad <= hoy) return { error: 'El medicamento debe caducar después de hoy' };
    return { medicamento };
}

function leerCantidadYPunto(datos) {
    const cantidad = Number(datos.cantidad);
    const id_punto = Number(datos.id_punto);
    if (!Number.isInteger(cantidad) || cantidad <= 0) return { error: 'La cantidad debe ser un número entero mayor a 0' };
    if (!Number.isInteger(id_punto) || id_punto <= 0) return { error: 'Selecciona un punto de entrega' };
    return { cantidad, id_punto };
}

async function crearPublicacion(req, res) {
    const datos = req.body || {};
    const basicos = leerCantidadYPunto(datos);
    if (basicos.error) return res.status(400).json({ error: basicos.error });
    const { cantidad, id_punto } = basicos;

    let id_medicamento = null;
    let medicamento = null;
    if (datos.id_medicamento !== undefined && datos.id_medicamento !== null && datos.id_medicamento !== '') {
        id_medicamento = Number(datos.id_medicamento);
        if(!Number.isInteger(id_medicamento) || id_medicamento <= 0){
            return res.status(400).json({error: 'El medicamento no es válido'});
        }
    } else {
        const leido = leerMedicamento(datos);
        if (leido.error) return res.status(400).json({ error: leido.error });
        medicamento = leido.medicamento;
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

// GET /api/publicaciones/mias: mis publicaciones, cada una con sus solicitudes
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

// GET /api/publicaciones/:id/detalle?solicitud=ID
// Devuelve la publicación, si es mía y la donación en la que participo (si hay una).
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

    // Si no es mía, no participo y ya no está disponible, no se puede ver
    if (!es_mia && !donacion && publicacion.estado !== 'Disponible') {
        return res.status(404).json({ error: 'Publicacion no encontrada' });
    }

    res.json({ publicacion, es_mia, donacion: donacion ? { ...donacion, mi_rol: donacion.id_donante === yo ? 'DONANTE' : 'RECEPTOR' } : null });
}

// PUT /api/publicaciones/:id: editar medicamento, punto y cantidad (solo si sigue Disponible)
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
        const resultado = await modeloPublicacion.actualizarPublicacionCompleta(id_pub, { medicamento: leido.medicamento, ...basicos });
        res.json(resultado);
    } catch (error) {
        if (error.code === '23503') return res.status(400).json({ error: 'El punto de entrega no existe' });
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

    if (!['Disponible', 'Reservado', 'Entregado', 'Cancelado'].includes(req.body?.estado)) {
        return res.status(400).json({error: 'Estado no válido'});
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

module.exports = {obtenerMisPublicaciones, obtenerDetallePublicacion, actualizarPublicacion, obtenerPublicaciones, obtenerPublicacionesDisponibles, obtenerPublicacionesPorId, crearPublicacion, actualizarEstadoPublicacion, actualizarCantidaMedicamento, actualizarPunto,cancelarPublicacion, eliminarPublicacion, verificarPropietarioPublicacion};