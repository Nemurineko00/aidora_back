const { json } = require('express');
const modeloSolicitud = require('../modelo/solicitud');

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
            return res.status(404).jso({mensaje: 'Solicitud no encontrada'});
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

            return res.status(404).json({ mensaje : 'Solicitud no encontrada'});
        }

        res.json(solicitud);
    }catch(error){
        next(error);
    }
}

async function obtenerSolicitudPorUsuario(req, res, next) {
    try{
        const solicitud = await modeloSolicitud.listarSolicitudesPorUsuario(Number(req.params.id));

        if(!solicitud){
            return res.status(404).json({mensaje: 'Solicitud no encontrada'})
        }

        res.json(solicitud);
    }catch(error){
        next(error);
    }
}

async function crearSolicitud(req, res, next) {
    try{
        const solicitud = await modeloSolicitud.crearSolicitud({id_solicitud: req.usuario.id_usuario, id_pub: req.body.id_pub});

        res.status(201).json(solicitud);
    }catch (error){
        next(error);
    }
}

async function actualizarEstadoSolicitud(req, res, next) {
    try{
         const solicitud = await modeloSolicitud.actualizarEstadoSolicitud(Number(req.params.id), req.body.estado);

         if(!solicitud){
            return res.status(404).json({mensaje : 'Solicitud no encontrada'});
         }

         res.json(solicitud);
    }catch (error){
        next(error);
    }
}

async function eliminarSolicitud(req, res, next) {
    try{

        const solicitud = await modeloSolicitud.eliminarSolicitudPorId(Number(req.params.id));

        if(!solicitud){

            return res.status(404),json({ mensaje : 'Solicitud no enocntrada'});
        }

        res.json(solicitud);
    }catch (error){
        next(error);
    }
}

module.exports = { obtenerSolicitudes, obtenerSolicitudPorId, obtenerSolicitudCompleta, obtenerSolicitudPorUsuario, crearSolicitud, actualizarEstadoSolicitud, eliminarSolicitud}