const modeloSolicitud = require('../Modelo/solicitud_modelo');
const modeloPublicacion = require('../Modelo/publicacion_modelo');
const modeloDonacion = require('../Modelo/donacion_modelo');
const { validar, limpiar } = require('./validaciones');

function idInvalido(req, res) {
    if (validar.id(req.params.id)) {
        res.status(400).json({ error: 'La solicitud no es válida' });
        return true;
    }
    return false;
}

async function puedeVerSolicitud(solicitud, id_usuario) {
    if (solicitud.id_usuario === id_usuario) return true;
    const pub = await modeloPublicacion.listarPublicacionesPorId(solicitud.id_pub);
    return Boolean(pub) && pub.id_usuario === id_usuario;
}

async function obtenerSolicitudes(req, res, next) {
    try{
        const solicitudes = await modeloSolicitud.listarSolicitud();

        res.json(solicitudes)
    } catch(error){
        next(error);
    }
}

async function obtenerSolicitudPorId(req, res, next) {
    try{
        if (idInvalido(req, res)) return;
        const solicitud = await modeloSolicitud.listarSolicitudPorId(Number(req.params.id));

        if(!solicitud){
            return res.status(404).json({error: 'Solicitud no encontrada'});
        }

        if(!(await puedeVerSolicitud(solicitud, req.sesion.id))){
            return res.status(403).json({error: 'No tienes permiso para ver esta solicitud'});
        }

        res.json(solicitud);
    } catch (error){
        next(error);
    }
}

async function obtenerSolicitudCompleta(req, res, next) {
    try{
        if (idInvalido(req, res)) return;
        const solicitud = await modeloSolicitud.listarSolicitudConPuntoEntrega(Number(req.params.id));

        if(!solicitud){
            return res.status(404).json({error: 'Solicitud no encontrada'});
        }

        if(!(await puedeVerSolicitud(solicitud, req.sesion.id))){
            return res.status(403).json({error: 'No tienes permiso para ver esta solicitud'});
        }

        res.json(solicitud);
    }catch(error){
        next(error);
    }
}

async function obtenerSolicitudPorUsuario(req, res, next) {
    try{
        const solicitudes = await modeloSolicitud.listarSolicitudesPorUsuario(Number(req.sesion.id));

        res.json(solicitudes);
    }catch(error){
        next(error);
    }
}

async function crearSolicitud(req, res, next) {
    try{
        const id_pub = Number(req.body?.id_pub);
        if (validar.id(id_pub)) {
            return res.status(400).json({error: 'Indica la publicación que quieres solicitar'});
        }
        const publicacion = await modeloPublicacion.listarPublicacionesPorId(id_pub);

        if(!publicacion){
            return res.status(404).json({error : 'Publicacion no encontrada'});
        }

        if(publicacion.estado !== 'Disponible'){
            return res.status(400).json({error: 'La publicacion no esta disponible'});
        }

        if(publicacion.id_usuario === req.sesion.id){
            return res.status(400).json({error: 'No puedes solicitar tu propia publicacion'});
        }

        const existe = await modeloSolicitud.existeSolicitudActiva(req.sesion.id, id_pub);

        if(existe){
            return res.status(400).json({error: 'Ya tienes una solicitud activa para esta publicacion'});
        }

        const solicitud = await modeloSolicitud.crearSolicitud({id_usuario: req.sesion.id, id_pub});

        res.status(201).json(solicitud);
    }catch (error){
        next(error);
    }
}

async function actualizarEstadoSolicitud(req, res, next) {
    try{
        if (idInvalido(req, res)) return;
        const estado = req.body?.estado;
        const fecha_entrega = req.body?.fecha_entrega ?? null;

        if (!['Aceptada', 'Rechazada'].includes(estado)) {
            return res.status(400).json({ error: 'Solo puedes aceptar o rechazar la solicitud' });
        }

        const solicitud = await modeloSolicitud.listarSolicitudPorId(Number(req.params.id));
        if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

        const pub = await modeloPublicacion.listarPublicacionesPorId(solicitud.id_pub);
        if (!pub || pub.id_usuario !== req.sesion.id) return res.status(403).json({ error: 'Solo el donante puede cambiar esta solicitud' });

        if (estado === 'Aceptada') {
            const errorFecha = validar.fechaEntrega(fecha_entrega, pub.fecha_caducidad);
            if (errorFecha) return res.status(400).json({ error: errorFecha });
        }

        const resultado = estado === 'Aceptada'
            ? await modeloDonacion.aceptarSolicitud(solicitud.id_solicitud, limpiar(fecha_entrega))
            : await modeloDonacion.rechazarSolicitud(solicitud.id_solicitud);

        if (!resultado) return res.status(409).json({ error: 'Esta solicitud ya fue atendida o la publicación ya no está disponible' });

        res.json(resultado);
    }catch (error){
        next(error);
    }
}

async function eliminarSolicitud(req, res, next) {
    try{
        if (idInvalido(req, res)) return;

        const solicitud = await modeloSolicitud.listarSolicitudPorId(Number(req.params.id));

        if(!solicitud){

            return res.status(404).json({error: 'Solicitud no enocntrada'});
        }

        if(solicitud.id_usuario !== req.sesion.id){
            return res.status(403).json({error: 'Esta solicitud no es tuya'});
        }

        if(solicitud.estado === 'Aceptada' || solicitud.estado === 'Completada'){
            return res.status(400).json({error: 'No se puede eliminar una solicitud aceptada o completada'});
        }

        const eliminada = await modeloSolicitud.eliminarSolicitudPorId(Number(req.params.id));

        res.json(eliminada);
    }catch (error){
        next(error);
    }
}

module.exports = { obtenerSolicitudes, obtenerSolicitudPorId, obtenerSolicitudCompleta, obtenerSolicitudPorUsuario, crearSolicitud, actualizarEstadoSolicitud, eliminarSolicitud}