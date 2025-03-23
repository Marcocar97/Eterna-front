import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Box,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Autocomplete,
  MenuItem,
  Grid,
} from "@mui/material";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import {
  obtenerCitas,
  crearCita,
  obtenerClientes,
  obtenerContratosCliente, // ✅ Importamos esta función para obtener los contratos activos
  obtenerTecnicos,
  actualizarEstadoCita,
  completarCita,
} from "../apiClient";

const Citas = () => {
  const [citas, setCitas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [contratos, setContratos] = useState([]); // ✅ Estado para contratos
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [contratoSeleccionado, setContratoSeleccionado] = useState(null);
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  // 🔹 Generar opciones de horas (08:00 a 19:00)
const horasDisponibles = Array.from({ length: 12 }, (_, i) => 8 + i);
const minutosDisponibles = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];


useEffect(() => {
    const fetchData = async () => {
      try {
        const [citasData, clientesData, tecnicosData] = await Promise.all([
          obtenerCitas(),
          obtenerClientes(),
          obtenerTecnicos(),
        ]);

        console.log("🔍 Datos de clientes obtenidos:", clientesData.data);

        setCitas(citasData.data || []);
        setClientes(clientesData.data || []);
        setTecnicos(tecnicosData.data || []);
      } catch (error) {
        console.error("❌ Error cargando datos en el frontend:", error.response?.data || error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
}, []);

  
  

  // 🔹 Cargar contratos cuando se seleccione un cliente
  const handleSeleccionarCliente = async (cliente) => {
    setClienteSeleccionado(cliente);
    setContratoSeleccionado(null); // Resetear contrato seleccionado al cambiar de cliente

    if (cliente) {
      try {
        const contratosRes = await obtenerContratosCliente(cliente.id);
        setContratos(contratosRes.data || []);
      } catch (error) {
        console.error("❌ Error obteniendo contratos:", error);
        setContratos([]);
      }
    }
  };

  const validationSchema = Yup.object({
    clienteId: Yup.string().required("Selecciona un cliente"),
    tecnicoId: Yup.string().required("Selecciona un técnico"),
    contratoId: Yup.string().required("Selecciona un contrato válido"),
    fecha: Yup.date().required("Selecciona una fecha y hora"),
    estado: Yup.string().required("Selecciona el estado"),
  });


  const [duracionSeleccionada, setDuracionSeleccionada] = useState(30); // ⏳ Valor por defecto 30 min

  const handleSeleccionarContrato = (contrato, setFieldValue) => {
    if (!contrato || !contrato.Servicio) {
      console.error("❌ Error: El contrato seleccionado no tiene un servicio asociado.");
      return;
    }

    console.log("📌 Contrato seleccionado:", contrato);
    console.log("📌 Servicio dentro del contrato:", contrato.Servicio);

    const duracion = contrato.Servicio?.duracion ? parseInt(contrato.Servicio.duracion, 10) : 20;
    setContratoSeleccionado(contrato);
    setFieldValue("contratoId", contrato.id);
    setDuracionSeleccionada(duracion); // 🔹 Guardamos la duración correctamente

    console.log(`⏳ Duración almacenada: ${duracion} minutos`);
};


const handleCrearCita = async (values, { resetForm }) => {
    if (!values.contratoId) {
      alert("Selecciona un contrato válido para agendar la cita.");
      return;
    }

    if (!duracionSeleccionada) {
      alert("Error: La duración de la cita no está definida.");
      return;
    }

    const nuevaFechaInicio = new Date(values.fecha);
    const finNuevaCita = new Date(nuevaFechaInicio.getTime() + duracionSeleccionada * 60000);

    console.log("📌 Nueva cita:", nuevaFechaInicio, "→ Fin:", finNuevaCita);
    console.log("🔍 Duración usada en handleCrearCita:", duracionSeleccionada);

    // 🔍 Verificar si hay conflictos con otras citas
    const conflicto = citas.some((cita) => {
      const inicioCitaExistente = new Date(cita.fecha);
      const duracionExistente = cita.Contrato?.Servicio?.duracion
    ? parseInt(cita.Contrato.Servicio.duracion, 10) * 60000
    : duracionSeleccionada * 60000;  // ✅ Usa la duración seleccionada en lugar de 30 min por defecto

      const finCitaExistente = new Date(inicioCitaExistente.getTime() + duracionExistente);

      console.log("🔍 Comparando con cita existente:", inicioCitaExistente, "→", finCitaExistente);

      return (
        (nuevaFechaInicio >= inicioCitaExistente && nuevaFechaInicio < finCitaExistente) ||
        (finNuevaCita > inicioCitaExistente && finNuevaCita <= finCitaExistente) ||
        (nuevaFechaInicio <= inicioCitaExistente && finNuevaCita >= finCitaExistente)
      );
    });

    if (conflicto) {
      alert("❌ Hay un conflicto con otra cita en ese horario.");
      return;
    }

    try {
      const res = await crearCita({
        clienteId: values.clienteId,
        tecnicoId: values.tecnicoId,
        contratoId: values.contratoId,
        fecha: values.fecha,
        estado: values.estado,
      });

      setCitas([...citas, res.data]);
      resetForm();
      setContratoSeleccionado(null);
      setDuracionSeleccionada(null); // 🔹 Reset duración después de agendar
      alert("✅ Cita creada correctamente.");
    } catch (error) {
      console.error("❌ Error creando cita:", error);
    }
};


  

  const handleActualizarEstado = async (id, nuevoEstado) => {
    try {
      await actualizarEstadoCita(id, nuevoEstado);
      setCitas((prevCitas) =>
        prevCitas.map((cita) =>
          cita.id === id ? { ...cita, estado: nuevoEstado } : cita
        )
      );
    } catch (error) {
      console.error("❌ Error actualizando estado de cita:", error);
    }
  };

  if (loading) {
    return <Typography variant="h6">Cargando datos...</Typography>;
  }

  return (
    <Container maxWidth="xl">
      <Paper sx={{ padding: 4, marginTop: 2, boxShadow: 3, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" mb={3} textAlign="center">
          Agendar Nueva Cita
        </Typography>
  
        <Formik
          initialValues={{
            clienteId: "",
            tecnicoId: "",
            contratoId: "",
            fecha: "",
            estado: "pendiente",
          }}
          validationSchema={validationSchema}
          onSubmit={handleCrearCita}
        >
          {({ handleChange, setFieldValue, values }) => (
            <Form>
              <Grid container spacing={3}>
                {/* Selección de Cliente */}
                <Grid item xs={12} md={4}>
                  <Autocomplete
                    options={clientes}
                    getOptionLabel={(option) => `${option.nombre} ${option.apellidos || ""}`}
                    value={clienteSeleccionado}
                    onChange={(event, newValue) => {
                      handleSeleccionarCliente(newValue);
                      setFieldValue("clienteId", newValue ? newValue.id : "");
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Buscar Cliente" fullWidth variant="outlined" />
                    )}
                  />
                </Grid>
  
                {/* Selección de Técnico */}
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    label="Técnico"
                    name="tecnicoId"
                    value={values.tecnicoId}
                    onChange={handleChange}
                    fullWidth
                  >
                    {tecnicos.map((tecnico) => (
                      <MenuItem key={tecnico.id} value={tecnico.id}>
                        {tecnico.nombre}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
  
                {/* Selección de Contrato */}
                <Grid item xs={12} md={4}>
                  <Autocomplete
                    options={contratos}
                    getOptionLabel={(option) =>
                      `Servicio: ${option.Servicio?.nombre} | Sesiones restantes: ${
                        option.numero_sesiones - option.sesiones_realizadas
                      }`
                    }
                    value={contratoSeleccionado}
                    onChange={(event, newValue) => handleSeleccionarContrato(newValue, setFieldValue)}
                    renderInput={(params) => (
                      <TextField {...params} label="Seleccionar Contrato Activo" fullWidth />
                    )}
                  />
                </Grid>
  
                {/* Selección de Fecha */}
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Fecha"
                    type="date"
                    name="fecha"
                    value={values.fecha.split("T")[0] || ""}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
  
                {/* Selección de Hora */}
                <Grid item xs={6} md={2}>
                  <TextField
                    select
                    label="Hora"
                    name="hora"
                    value={values.fecha.split("T")[1]?.slice(0, 2) || ""}
                    onChange={(e) => {
                      const nuevaHora = e.target.value;
                      const fechaBase = values.fecha.split("T")[0] || new Date().toISOString().split("T")[0];
                      setFieldValue("fecha", `${fechaBase}T${nuevaHora}:${values.fecha.split(":")[1] || "00"}`);
                    }}
                    fullWidth
                  >
                    {Array.from({ length: 12 }, (_, i) => 8 + i).map((h) => (
                      <MenuItem key={h} value={String(h).padStart(2, "0")}>
                        {String(h).padStart(2, "0")}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
  
                {/* Selección de Minutos */}
                <Grid item xs={6} md={2}>
                  <TextField
                    select
                    label="Minutos"
                    name="minutos"
                    value={values.fecha.split(":")[1] || ""}
                    onChange={(e) => {
                      const nuevosMinutos = e.target.value;
                      const fechaBase = values.fecha.split("T")[0] || new Date().toISOString().split("T")[0];
                      const horaActual = values.fecha.split("T")[1]?.slice(0, 2) || "08";
                      setFieldValue("fecha", `${fechaBase}T${horaActual}:${nuevosMinutos}`);
                    }}
                    fullWidth
                  >
                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                      <MenuItem key={m} value={String(m).padStart(2, "0")}>
                        {String(m).padStart(2, "0")}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
  
                {/* Botón Agregar Cita */}
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="center" mt={3}>
                    <Button type="submit" variant="contained" color="primary" size="large">
                      Agregar Cita
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Form>
          )}
        </Formik>
      </Paper>
    </Container>
  );  
};

export default Citas;
