import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // 🔹 URL desde .env
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔹 Interceptor para incluir automáticamente el token en todas las peticiones
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Obtener el token desde localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Agrega el token al header
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔹 **Usuarios**
export const registrarUsuario = async (userData) => {
  return await apiClient.post("/usuarios/register", userData);
};

export const loginUsuario = async (userData) => {
  return await apiClient.post("/usuarios/login", userData);
};

// 🔹 **Iniciar turno correctamente pasando usuarioId**
export const iniciarTurno = async (usuarioId) => {
  console.log("🔹 Verificando si hay un turno abierto para usuarioId:", usuarioId);

  if (!usuarioId) {
    throw new Error("❌ Error: usuarioId es requerido para iniciar el turno.");
  }

  try {
    // 🔹 Primero obtenemos el turno actual del usuario
    const turnoActual = await obtenerTurnoActual();

    if (turnoActual) {
      console.log("✅ Ya hay un turno abierto, no se creará uno nuevo.");
      return turnoActual;
    }

    // 🔹 Si no hay turno abierto, creamos uno nuevo
    const response = await apiClient.post("/turnos/iniciar", {
      usuarioId,
      total_efectivo: 0,
      total_tarjeta: 0
    });

    console.log("✅ Nuevo turno iniciado con éxito:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ No se pudo iniciar el turno:", error.response?.data || error);
    throw error;
  }
};


// 🔹 **Obtener turno actual corrigiendo la respuesta**
export const obtenerTurnoActual = async () => {
  const usuarioId = localStorage.getItem("usuarioId");

  if (!usuarioId) {
    console.error("❌ Error: usuarioId no encontrado en localStorage.");
    return null;
  }

  try {
    const response = await apiClient.get(`/turnos`, { params: { usuarioId } });

    if (!response.data || response.data.length === 0) {
      console.warn("⚠️ No hay turnos activos para este usuario.");
      return null;
    }

    // 🔹 Filtrar solo turnos abiertos (hora_fin === null)
    const turnoAbierto = response.data.find(turno => turno.hora_fin === null);

    if (!turnoAbierto) {
      console.warn("⚠️ No hay turnos abiertos, se puede crear uno nuevo.");
      return null;  // Permite que `iniciarTurno()` cree un nuevo turno
    }

    console.log("✅ Turno activo encontrado:", turnoAbierto);
    return turnoAbierto;
  } catch (error) {
    console.error("❌ Error obteniendo turno actual:", error.response?.data || error);
    return null;
  }
};




// PAGOS 

export const registrarPago = async (pagoData) => {
  const token = localStorage.getItem("token");
  return await apiClient.post("/pagos", pagoData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const obtenerPagos = async (turnoId) => {
  const token = localStorage.getItem("token");
  return await apiClient.get(`/pagos?turnoId=${turnoId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};


// 🔹 **Obtener solo los técnicos**
export const obtenerTecnicos = async () => {
  return await apiClient.get("/usuarios?rol=tecnico");
};

// 🔹 **Clientes**
export const agregarCliente = async (clienteData) => {
  return await apiClient.post("/clientes", clienteData);
};

export const obtenerClientes = async () => {
  return await apiClient.get("/clientes");
};

export const obtenerClientePorId = async (id) => {
  return await apiClient.get(`/clientes/${id}`);
};

export const actualizarCliente = async (clienteId, clienteData) => {
  try {
    const response = await apiClient.put(`/clientes/${clienteId}`, clienteData); // ✅ Usa apiClient directamente
    return response.data;
  } catch (error) {
    console.error("❌ Error actualizando cliente:", error);
    throw error;
  }
};


// 🔹 **Citas**
export const crearCita = async (citaData) => {
  return await apiClient.post("/citas", citaData);
};

export const obtenerCitas = async () => {
  try {
    const response = await apiClient.get("/citas");
    return response;
  } catch (error) {
    console.error("❌ Error obteniendo citas en el frontend:", error.response?.data || error);
    throw error;
  }
};

export const actualizarCita = async (id, citaData) => {
  return await apiClient.put(`/citas/${id}`, citaData);
};

// ✅ **Corregido: Actualizar estado de cita**
export const actualizarEstadoCita = async (id, estado) => {
  return await apiClient.patch(`/citas/${id}/estado`, { estado });
};

// ✅ **Corregido: Completar cita con más detalles**
export const completarCita = async (id, datos) => {
  return await apiClient.patch(`/citas/${id}/completar`, datos);
};

// 🔹 **Servicios**
export const obtenerServicios = async () => {
  return await apiClient.get("/servicios");
};

export const crearServicio = async (servicioData) => {
  return await apiClient.post("/servicios", servicioData);
};

export const editarServicio = async (id, servicioData) => {
  return await apiClient.put(`/servicios/${id}`, servicioData);
};

export const eliminarServicio = async (id) => {
  return await apiClient.delete(`/servicios/${id}`);
};

// 🔹 **Contratos**
export const obtenerContratosCliente = async (clienteId) => {
  return await apiClient.get(`/contratos?clienteId=${clienteId}`);
};

// ✅ **Corregido: Subir contrato firmado**
export const subirContratoFirmado = async (file, contratoId) => {
  try {
    const formData = new FormData();
    formData.append("contrato_firmado", file);

    const response = await apiClient.post(`/contratos/${contratoId}/subir`, formData, {
      headers: {
        "Content-Type": "multipart/form-data", // Necesario para subir archivos
      },
    });

    return response.data;
  } catch (error) {
    console.error("❌ Error al subir contrato firmado:", error.response?.data || error);
    throw error;
  }
};

// 🔹 **Historial de Citas**
export const obtenerHistorialCitas = async (clienteId) => {
  return await apiClient.get(`/citas?clienteId=${clienteId}`);
};


// 🔹 **Turnos**
export const obtenerTurnos = async (fecha = "") => {
  return await apiClient.get("/turnos", { params: { fecha } });
};

export const marcarTurnoRevisado = async (turnoId, estado) => {
  return await apiClient.patch("/turnos/revisar", { turnoId, estado });
};




export const cerrarTurno = async (turnoId) => {
  return await apiClient.post("/turnos/cerrar", { turnoId });
};


// 🔹 Actualizar método de pago
export const actualizarPago = async (pagoId, metodo_pago) => {
  return await apiClient.patch(`/pagos/${pagoId}`, { metodo_pago });
};


export const obtenerPagosFiltrados = async (fechaInicio, fechaFin, usuarioId) => {
  return await apiClient.get("/pagos", { params: { fechaInicio, fechaFin, usuarioId } });
};

export const agregarGasto = async (gastoData) => {
  return await apiClient.post("/gastos", gastoData);
};



export default apiClient;
