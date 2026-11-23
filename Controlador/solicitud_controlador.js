const modeloSolicitud = require('../Modelo/solicitud_modelo');
const modeloPublicacion = require('../Modelo/publicacion_modelo');

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
        const publicacion = await modeloPublicacion.listarPublicacionesPorId(req.body.id_pub);

        if(!publicacion){
            return res.status(404).json({error : 'Publicacion no encontrada'});
        }

        if(publicacion.estado !== 'Disponible'){
            return res.status(400).json({error: 'La publicacion no esta disponible'});
        }

        if(publicacion.id_usuario === req.sesion.id){
            return res.status(400).json({error: 'No puedes solicitar tu propia publicacion'});
        }

        const existe = await modeloSolicitud.existeSolicitudActiva(req.sesion.id, req.body.id_pub);

        if(existe){
            return res.status(400).json({error: 'Ya tienes una solicitud activa para esta publicacion'});
        }

        const solicitud = await modeloSolicitud.crearSolicitud({id_usuario: req.sesion.id, id_pub: req.body.id_pub});

        res.status(201).json(solicitud);
    }catch (error){
        next(error);
    }
}

async function actualizarEstadoSolicitud(req, res, next) {
    try{
        const ESTADOS = ['Aceptada', 'Rechazada', 'Completada'];

        if (!ESTADOS.includes(req.body.estado)) return res.status(400).json({ error: 'Estado no válido' });

        const solicitud = await modeloSolicitud.listarSolicitudPorId(Number(req.params.id));

        if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

        const pub = await modeloPublicacion.listarPublicacionesPorId(solicitud.id_pub);

        if (pub.id_usuario !== req.sesion.id) return res.status(403).json({ error: 'Solo el donante puede cambiar esta solicitud' });
        const resultado = await modeloSolicitud.actualizarEstadoSolicitud(Number(req.params.id), req.body.estado);

        res.json(resultado);     
    }catch (error){
        next(error);
    }
}

async function eliminarSolicitud(req, res, next) {
    try{

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