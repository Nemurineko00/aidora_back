# Aidora · Backend

Backend de Aidora hecho con **Express**, con la estructura `Controlador/` y `Modelo/` de tu curso. Solo tiene lo que ya existía en tu proyecto original (los datos de ejemplo que estaban escritos en las pantallas): **sin base de datos, sin sesiones y sin nada extra**, para que tú lo sigas construyendo.

## Puesta en marcha

```bash
npm install
npm start                     # http://localhost:4000
```

`npm run dev` lo reinicia solo cuando cambias un archivo.

Dos variables opcionales (no hace falta archivo `.env`):

| Variable | Para qué | Por defecto |
|---|---|---|
| `PORT` | Puerto del servidor | `4000` |
| `FRONTEND_URL` | Dirección(es) del frontend autorizadas (CORS). Varias separadas por coma | `http://localhost:3000` |

## Estructura

```
aidora-backend/
├── server.js                    arranca Express, activa CORS y define las rutas
├── Controlador/                 recibe la petición y responde (HTTP)
│   ├── medicamento_controlador.js
│   ├── admin_controlador.js
│   └── donacion_controlador.js
├── Modelo/                      acceso a los datos (aquí irá tu SQL)
│   ├── medicamento_modelo.js
│   ├── usuario_modelo.js
│   ├── reporte_modelo.js
│   └── donacion_modelo.js
└── datos/memoria.js             los datos de tu proyecto original, en memoria
```

## Rutas

Son las funciones que ya tenías en tu proyecto original. Los datos en memoria se reinician al reiniciar el servidor.

| Ruta | Qué hace | Viene de tu pantalla |
|---|---|---|
| `GET /api/medicamentos` | Lista de medicamentos (`id`, `nombre`, `rs`) | `/home`, `/misDonaciones`, `/misPublicaciones` |
| `GET /api/admin/usuarios` | Usuarios con su número de reportes | `/admin` |
| `DELETE /api/admin/usuarios/:id` | Elimina un usuario (404 si no existe) | `/admin` (botón "Eliminar usuario") |
| `GET /api/admin/reportes` | Lista de reportes (`id`, `motivo`, `imagen`) | `/menuAdmin` |
| `GET /api/ong/donaciones` | Donaciones (`donante`, `receptor`, `fecha`, `hora`) | `/recepcionONG` |
| `GET /api/ong/donaciones/:id` | Una donación (404 si no existe) | `/recepcionONG/:id` |

Las respuestas llevan los datos dentro de una propiedad (`{ "medicamentos": [...] }`, `{ "usuarios": [...] }`, `{ "donacion": {...} }`...) y los errores son `{ "error": "mensaje" }`.

## Conexión con el frontend

El frontend (`aidora-frontend`) puede llamar a este servidor porque `server.js` activa CORS para `FRONTEND_URL`. Cuando publiques el front, agrega su dirección:

```bash
FRONTEND_URL=http://localhost:3000,https://tu-app.vercel.app npm start
```

Para que el front use estos datos, en `aidora-frontend/lib/servicios.js` cambia el cuerpo de la función. Ejemplo con los medicamentos (los demás siguen la misma idea):

```js
const API_URL = "http://localhost:4000"; // la dirección de este backend

async function pedir(ruta, metodo = "GET") {
  const respuesta = await fetch(API_URL + ruta, { method: metodo });
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) throw new Error(datos?.error || "Ocurrió un error inesperado");
  return datos;
}

export async function listarMedicamentosDisponibles() {
  const { medicamentos } = await pedir("/api/medicamentos");
  return medicamentos.map((m) => ({
    id: m.id,
    nombre: m.nombre,
    registroSanitario: m.rs,
    fechaCaducidad: "",               // aún no existe en el backend
    puntoEntrega: { id: 0, nombre: "" }, // aún no existe en el backend
    fotoUrl: null,
    solicitado: false,
  }));
}
```

| Función de `servicios.js` | Ruta de este backend |
|---|---|
| `listarMedicamentosDisponibles()` | `GET /api/medicamentos` |
| `listarUsuariosAdmin()` | `GET /api/admin/usuarios` |
| `eliminarUsuarioAdmin(id)` | `DELETE /api/admin/usuarios/:id` |
| `obtenerUsuarioAdmin(id)` (la parte de reportes) | `GET /api/admin/reportes` |
| `listarDonacionesOng()` | `GET /api/ong/donaciones` |
| `obtenerDonacionOng(id)` | `GET /api/ong/donaciones/:id` |

El front espera más datos de los que hoy tiene el backend (por ejemplo `registroSanitario`, `fechaCaducidad`, `puntoEntrega`, y las fechas de las donaciones como fecha real y no como `"DD/MM/AAAA"`). Mientras no existan, la función de `servicios.js` los rellena con valores vacíos; a medida que amplíes el backend, esos campos pasan directo.

## Lo que falta (es tuyo)

- La **base de datos**: reemplaza `datos/memoria.js` y el contenido de `Modelo/`.
- **Sesiones**, login y registro.
- El resto de funciones del front: publicar, solicitar, aceptar y rechazar medicamentos, ayudante, crear reportes y el estado de la ONG (entregado, recibido, terminar ciclo).

Para agregar una función: el acceso a los datos va en `Modelo/`, la respuesta HTTP en `Controlador/` y la ruta en `server.js`.
