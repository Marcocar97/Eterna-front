import { useState, useEffect } from "react";
import { Container, Typography, Button, Box, TextField, Paper, List, ListItem, ListItemText, Divider, Autocomplete, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, FormControlLabel, Checkbox } from "@mui/material";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { obtenerClientes, agregarCliente, obtenerServicios } from "../apiClient";
import { obtenerHistorialCitas, obtenerContratosCliente, actualizarCliente } from "../apiClient";
import Contratos from "./Contratos";




const zonasDisponibles = {
  pequeña: ["Cara", "Axilas", "Manos", "Pies", "Interglúteo", "Cuello"],
  mediana: ["Brazos", "Hombros", "Glúteos", "Ingles", "Abdomen", "Pecho", "Medias piernas"],
  grande: ["Piernas completas", "Espalda"],
};

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zonasSeleccionadas, setZonasSeleccionadas] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [historialCitas, setHistorialCitas] = useState({ realizadas: [], agendadas: [] });
const [contratos, setContratos] = useState([]);
const [searchTerm, setSearchTerm] = useState("");
const [formikKey, setFormikKey] = useState(0);


const fetchClientes = async () => {
  setLoading(true);
  try {
    const response = await obtenerClientes();
    setClientes(response.data || []);
  } catch (error) {
    console.error("❌ Error al obtener clientes:", error);
  } finally {
    setLoading(false);
  }
};



  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientesData, serviciosData] = await Promise.all([
          obtenerClientes(),
          obtenerServicios(),
        ]);

        setClientes(clientesData.data || []);
        setServicios(serviciosData.data || []);
      } catch (error) {
        console.error("❌ Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 📌 Expresión regular para validar la cédula
const cedulaRegex = /^\d{3}-\d{8}-\d{4}[A-Z]$/;
const formatCedula = (value) => {
  // Elimina todo lo que no sea números o letras al final
  let cleaned = value.replace(/[^0-9A-Z]/gi, "").toUpperCase();
  
  // Asegurar que solo los primeros 13 caracteres sean números
  let numbersOnly = cleaned.replace(/[^0-9]/g, "").slice(0, 13);
  
  // Extraer la letra si existe (posición 14)
  let lastChar = cleaned.length > 13 ? cleaned[13].replace(/[^A-Z]/g, "") : "";

  // Formatear los números con guiones
  let formatted = numbersOnly
    .replace(/^(\d{3})(\d{0,6})/, "$1-$2") // Primer guion
    .replace(/^(\d{3}-\d{6})(\d{0,4})/, "$1-$2"); // Segundo guion

  return formatted + lastChar;
};



  const validationSchema = Yup.object().shape({
    nombre: Yup.string().required("El nombre es obligatorio"),
    apellidos: Yup.string().required("Los apellidos son obligatorios"),
    cedula: Yup.string()
    .matches(/^\d{3}-\d{6}-\d{4}[A-Z]$/, "Formato inválido (Ej: 123-456789-0000X)")
    .required("La cédula es obligatoria"),
    telefono: Yup.string()
      .matches(/^\d{8}$/, "El teléfono debe tener exactamente 8 dígitos")
      .required("El teléfono es obligatorio"),
    confirmarTelefono: Yup.string()
      .oneOf([Yup.ref("telefono"), null], "Los teléfonos no coinciden")
      .required("Debe confirmar el teléfono"),
    direccion: Yup.string().required("La dirección es obligatoria"),
    fecha_nacimiento: Yup.date().required("La fecha de nacimiento es obligatoria"),
  });
  
 const handleServicioChange = (event, newValues, setFieldValue) => {
    setFieldValue("servicios", newValues.map((s) => ({
      id: s.id,
      nombre: s.nombre,
      zonas: [],
      numero_sesiones: 1, // Por defecto una sesión
    })));
  
    // 🔹 Inicializa las zonas correctamente según el tipo de servicio
    const nuevasZonas = {};
    newValues.forEach((servicio) => {
      const nombreServicio = servicio.nombre.toLowerCase();
      let zonas = [];
      if (nombreServicio.includes("pequeña")) zonas.push(...zonasDisponibles.pequeña);
      if (nombreServicio.includes("mediana")) zonas.push(...zonasDisponibles.mediana);
      if (nombreServicio.includes("grande")) zonas.push(...zonasDisponibles.grande);
      
      nuevasZonas[servicio.id] = zonas.map((zona) => ({ nombre: zona, seleccionado: false }));
    });
  
    setZonasSeleccionadas(nuevasZonas);
  }; 
  

   const toggleZona = (servicioId, zonaIndex) => {
    setZonasSeleccionadas((prev) => {
      const nuevasZonas = [...prev[servicioId]];
      nuevasZonas[zonaIndex].seleccionado = !nuevasZonas[zonaIndex].seleccionado;
      
      return {
        ...prev,
        [servicioId]: nuevasZonas
      };
    });
  }; 

  
  

  const handleSeleccionarCliente = async (cliente) => {
    setClienteSeleccionado(cliente);
    setOpenDialog(true);
  
    try {
      const [citasRes, contratosRes, serviciosRes] = await Promise.all([
        obtenerHistorialCitas(cliente.id),
        obtenerContratosCliente(cliente.id),
        obtenerServicios(), // 🔹 Ahora obtenemos los servicios directamente del backend
      ]);
  
      // 🔹 Filtrar citas solo del cliente seleccionado
      const citasCliente = Array.isArray(citasRes.data)
        ? citasRes.data.filter((c) => c.ClienteId === cliente.id)
        : [];
  
      setHistorialCitas({
        realizadas: citasCliente.filter((c) => c.estado === "realizada"),
        agendadas: citasCliente.filter((c) => c.estado !== "realizada"),
      });
  
      setContratos(Array.isArray(contratosRes.data) ? contratosRes.data : []);
  
      // ✅ Adaptar la estructura de `zonas_a_tratar`
      let zonas = Array.isArray(cliente.zonas_a_tratar) ? cliente.zonas_a_tratar : [];
  
      // 🔹 Asegurar que cada servicio tenga su nombre correcto
      const serviciosCliente = [];

zonas.forEach((item) => {
  // Evitar agregar duplicados
  const yaExiste = serviciosCliente.find(
    (s) =>
      s.servicio === item.servicio || s.nombre === item.nombre
  );

  if (!yaExiste) {
    const servicioEncontrado = servicios.find(
      (s) => s.id === item.servicio || s.nombre === item.servicio || s.nombre === item.nombre
    );

    serviciosCliente.push({
      servicio: servicioEncontrado?.id || item.servicio,
      nombre: servicioEncontrado?.nombre || item.nombre || "Servicio No Especificado",
      zonas: item.zonas || [],
      numero_sesiones: item.numero_sesiones || 1,
    });
  }
});

      
  
      // 🔹 Guardar los datos corregidos
      setClienteSeleccionado({
        ...cliente,
        zonas_a_tratar: serviciosCliente, // ✅ Ahora sí aparecerán los nombres correctamente en la UI
      });
  
    } catch (error) {
      console.error("❌ Error obteniendo historial del cliente:", error);
      setHistorialCitas({ realizadas: [], agendadas: [] });
      setContratos([]);
    }
  };

 
  
  

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Gestión de Clientes
      </Typography>

      <Box display="flex" gap={3} mt={3}>
        

        {/* 📌 Formulario de Agregar Cliente */}
        <Paper sx={{ flex: 1, padding: 3 }}>
  <Typography variant="h6">Agregar Cliente</Typography>
  <Formik
  key={formikKey}
    initialValues={{
      nombre: "",
      apellidos: "",
      cedula: "",
      telefono: "",
      confirmarTelefono: "", 
      direccion: "",
      fecha_nacimiento: "",
      historial_medico: "",
      notas_internas: "",
      vip: false,
      servicios: [],
    }}
    validationSchema={validationSchema}
    validateOnBlur={true}  // ✅ Activa validación al salir del campo
    validateOnChange={true} 
    onSubmit={async (values, { resetForm }) => {
      try {
        // ✅ Preparar los datos del cliente
        const clienteData = {
          ...values,
          zonas_a_tratar: values.servicios.map((servicio) => ({
            servicio: servicio.nombre, 
            zonas: (zonasSeleccionadas[servicio.id] || [])
              .filter(zona => zona.seleccionado)
              .map(zona => zona.nombre), 
            numero_sesiones: servicio.numero_sesiones || 1,
          })),
        };
    
        console.log("📤 Enviando cliente al backend:", JSON.stringify(clienteData, null, 2));
    
        // ✅ Agregar el cliente al backend
        const resCliente = await agregarCliente(clienteData);
    
        console.log("✅ Cliente agregado:", resCliente.data);
    
        if (!resCliente.data || !resCliente.data.cliente?.id) {
          throw new Error("El backend no devolvió un ID de cliente.");
        }
        
        const clienteId = resCliente.data.cliente.id;
        
    
        // ✅ Recargar clientes y resetear formulario
        await fetchClientes();
        setZonasSeleccionadas({});
        setClienteSeleccionado(null);
        resetForm();
        setFormikKey(prevKey => prevKey + 1);
        
      } catch (error) {
        console.error("❌ Error en el proceso:", error);
      }
    }}
    
    
     
  >
    {({ handleChange, handleBlur, setFieldValue, values, errors, touched }) => (
      <Form>
        <TextField name="nombre" label="Nombre" fullWidth margin="normal" onChange={handleChange} />
        <TextField name="apellidos" label="Apellidos" fullWidth margin="normal" onChange={handleChange} />
        <TextField
  name="cedula"
  label="Cédula"
  fullWidth
  margin="normal"
  value={values.cedula}
  onChange={(e) => {
    const formatted = formatCedula(e.target.value);
    setFieldValue("cedula", formatted);
  }}
  onBlur={handleBlur}
  error={touched.cedula && Boolean(errors.cedula)}
  helperText={touched.cedula && errors.cedula}
/>


<TextField
  name="telefono"
  label="Teléfono"
  fullWidth
  margin="normal"
  onChange={handleChange}
  onBlur={handleBlur} // ✅ Asegura que valide al salir del campo
  error={touched.telefono && Boolean(errors.telefono)}
  helperText={touched.telefono && errors.telefono}
/>

<TextField
  name="confirmarTelefono"
  label="Confirmar Teléfono"
  fullWidth
  margin="normal"
  onChange={handleChange}
  onBlur={handleBlur} // ✅ Asegura que valide al salir del campo
  error={touched.confirmarTelefono && Boolean(errors.confirmarTelefono)}
  helperText={touched.confirmarTelefono && errors.confirmarTelefono}
/>

        <TextField name="direccion" label="Dirección" fullWidth margin="normal" onChange={handleChange} />
        <TextField type="date" name="fecha_nacimiento" label="Fecha de Nacimiento" fullWidth margin="normal" onChange={handleChange} InputLabelProps={{ shrink: true }} />

        {/* Selección de Servicios */}
        <Autocomplete
          multiple
          options={servicios}
          getOptionLabel={(option) => option.nombre}
          onChange={(event, newValue) => handleServicioChange(event, newValue, setFieldValue)}
          renderInput={(params) => <TextField {...params} label="Seleccionar Servicios" />}
        />

        {/* Selección de Zonas y Número de Sesiones */}
        {Object.entries(zonasSeleccionadas).map(([servicio, zonas]) => (
          <Box key={servicio} mt={2}>
            <Typography variant="subtitle1">{servicio} - Zonas:</Typography>
            {zonas.map((zona, index) => (
              <FormControlLabel
                key={index}
                control={<Checkbox checked={zona.seleccionado} onChange={() => toggleZona(servicio, index)} />}
                label={zona.nombre}
              />
            ))}

            {/* Seleccionar número de sesiones */}
            {values.servicios.map((servicio, index) => (
  <Box key={index} mt={2} p={2} border={1} borderRadius={2}>
    <Typography variant="subtitle1">{servicio.nombre} - Selecciona número de sesiones:</Typography>

    {/* ✅ Selección de Número de Sesiones */}
    <TextField
  select
  label="Número de Sesiones"
  value={values.servicios[index]?.numero_sesiones || ""}
  onChange={(e) => {
    const newServicios = [...values.servicios];
    newServicios[index] = {
      ...newServicios[index],
      numero_sesiones: parseInt(e.target.value, 10),
    };
    setFieldValue("servicios", newServicios);
  }}
  fullWidth
  margin="normal"
>
  {[1, 3, 6].map((num) => (
    <MenuItem key={num} value={num}>
      {num} Sesiones
    </MenuItem>
  ))}
</TextField>

  </Box>
))}


          </Box>
        ))}

        <Button type="submit" variant="contained" color="primary" fullWidth>
          Agregar Cliente
        </Button>
      </Form>
    )}
  </Formik>
</Paper>

{/* 📌 Lista de Clientes */}
<Paper sx={{ flex: 1, padding: 2 }}>
          <Typography variant="h6">Lista de Clientes</Typography>
          <TextField
  fullWidth
  label="Buscar cliente"
  variant="outlined"
  margin="normal"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>

          {loading ? (
            <CircularProgress />
          ) : (
            <Box sx={{ maxHeight: 600, overflowY: "auto" }}>
            <List>
              {clientes
                .filter(cliente =>
                  `${cliente.nombre} ${cliente.apellidos} ${cliente.cedula} ${cliente.telefono}`
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
                )
                .map((cliente, index) => (
                  <div key={cliente.id}>
                    <ListItem button onClick={() => handleSeleccionarCliente(cliente)}>
                      <ListItemText
                        primary={`${cliente.nombre} ${cliente.apellidos}`}
                        secondary={`Tel: ${cliente.telefono} | Cédula: ${cliente.cedula}`}
                      />
                    </ListItem>
                    {index !== clientes.length - 1 && <Divider />}
                  </div>
                ))}
            </List>
          </Box>
          
          )}
        </Paper>

      </Box>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
  <DialogTitle>Perfil de {clienteSeleccionado?.nombre} {clienteSeleccionado?.apellidos}</DialogTitle>
  <DialogContent dividers>
    <Typography variant="h6">📋 Información General</Typography>
    <Typography><strong>Teléfono:</strong> {clienteSeleccionado?.telefono}</Typography>
    <Typography><strong>Cédula:</strong> {clienteSeleccionado?.cedula}</Typography>
    <Typography><strong>Dirección:</strong> {clienteSeleccionado?.direccion}</Typography>
    <Typography><strong>Historial Médico:</strong> {clienteSeleccionado?.historial_medico || "Sin información"}</Typography>
    <Typography><strong>Notas Internas:</strong> {clienteSeleccionado?.notas_internas || "No hay notas"}</Typography>

    <Divider sx={{ my: 2 }} />
   
    <Typography variant="h6">🛠 Servicios Contratados</Typography>
{clienteSeleccionado?.zonas_a_tratar?.length > 0 ? (
  clienteSeleccionado.zonas_a_tratar.map((item, index) => (
    <Paper key={index} sx={{ padding: 2, my: 1 }}>
      <Typography><strong>Servicio:</strong> {item.nombre || "No especificado"}</Typography>
      <Typography><strong>Zonas Seleccionadas:</strong> {item.zonas?.join(", ") || "No especificado"}</Typography>
      <Typography><strong>Número de Sesiones:</strong> {item.numero_sesiones || "No especificado"}</Typography>
      
    </Paper>
  ))
) : (
  <Typography>El cliente no tiene servicios contratados.</Typography>
)}


    <Divider sx={{ my: 2 }} />

    <Typography variant="h6">📆 Citas Agendadas</Typography>
{historialCitas?.agendadas?.length > 0 ? (
  historialCitas.agendadas.map((cita, index) => (
    <Paper key={index} sx={{ padding: 2, my: 1 }}>
      <Typography><strong>Fecha:</strong> {new Date(cita.fecha).toLocaleString()}</Typography>
      <Typography><strong>Servicio:</strong> 
        {cita.Contrato?.Servicio?.nombre || "Sin servicio"}
      </Typography>
      <Typography><strong>Técnico:</strong> {cita.Tecnico?.nombre || "No asignado"}</Typography>
      <Typography><strong>Estado:</strong> {cita.estado}</Typography>
      <Typography><strong>Notas del Técnico:</strong> {cita.notas || "No hay notas"}</Typography>
    </Paper>
  ))
) : (
  <Typography>No hay citas agendadas.</Typography>
)}

<Divider sx={{ my: 2 }} />

<Typography variant="h6">📆 Citas Realizadas</Typography>
{historialCitas?.realizadas?.length > 0 ? (
  historialCitas.realizadas.map((cita, index) => (
    <Paper key={index} sx={{ padding: 2, my: 1, bgcolor: "#f0f0f0" }}>
      <Typography><strong>Fecha:</strong> {new Date(cita.fecha).toLocaleString()}</Typography>
      <Typography><strong>Servicio:</strong> 
        {cita.Contrato?.Servicio?.nombre || "Sin servicio"}
      </Typography>
      <Typography><strong>Técnico:</strong> {cita.Tecnico?.nombre || "No asignado"}</Typography>
      <Typography><strong>Disparos Usados:</strong> {cita.disparos_usados || "No registrado"}</Typography>
      <Typography><strong>Potencia:</strong> {cita.potencia || "No registrada"}</Typography>
      <Typography><strong>Tipo de Láser:</strong> {cita.tipo_laser || "No especificado"}</Typography>
      <Typography><strong>Notas:</strong> {cita.notas || "Sin notas"}</Typography>
    </Paper>
  ))
) : (
  <Typography>No hay citas realizadas.</Typography>
)}


    <Divider sx={{ my: 2 }} />

    <Contratos clienteId={clienteSeleccionado?.id} />



<Divider sx={{ my: 2 }} />

<Typography variant="h6">✏️ Editar Información</Typography>

<Formik
  enableReinitialize
  initialValues={{
    nombre: clienteSeleccionado?.nombre || "",
    apellidos: clienteSeleccionado?.apellidos || "",
    telefono: clienteSeleccionado?.telefono || "",
    direccion: clienteSeleccionado?.direccion || "",
    historial_medico: clienteSeleccionado?.historial_medico || "",
    notas_internas: clienteSeleccionado?.notas_internas || "",
    servicios: clienteSeleccionado?.zonas_a_tratar
      ? clienteSeleccionado.zonas_a_tratar.map((s) => ({
          servicio: s.servicio,
          nombre: servicios.find((serv) => serv.id === s.servicio)?.nombre || "Servicio Desconocido",
          zonas: s.zonas || [],
          numero_sesiones: s.numero_sesiones || 1, // ✅ Se muestra el número de sesiones guardado
        }))
      : [],
  }}
  onSubmit={async (values) => {
    try {
      const datosActualizados = {
        ...values,
        zonas_a_tratar: values.servicios.map((s) => ({
          servicio: s.servicio,
          zonas: s.zonas || [],
          numero_sesiones: s.numero_sesiones,
        })),
      };
  
      // 🔄 Enviar cambios al backend
      await actualizarCliente(clienteSeleccionado.id, datosActualizados);
  
      // 🔄 Volver a obtener clientes y refrescar datos del cliente editado
      await fetchClientes(); // actualiza el listado general
      const clienteActualizado = clientes.find((c) => c.id === clienteSeleccionado.id);
      if (clienteActualizado) {
        await handleSeleccionarCliente(clienteActualizado); // refresca el modal
      }
  
      alert("Cliente actualizado correctamente");
    } catch (error) {
      console.error("❌ Error actualizando cliente:", error);
    }
  }}
  
  
>
  {({ handleChange, handleSubmit, values, setFieldValue }) => {
    const handleAgregarServicio = (event, newValue) => {
      if (newValue) {
        const nombreServicio = newValue.nombre.toLowerCase();
        let zonas = [];
        if (nombreServicio.includes("pequeña")) zonas.push(...zonasDisponibles.pequeña);
        if (nombreServicio.includes("mediana")) zonas.push(...zonasDisponibles.mediana);
        if (nombreServicio.includes("grande")) zonas.push(...zonasDisponibles.grande);

        setFieldValue("servicios", [
          ...values.servicios,
          {
            servicio: newValue.id,
            nombre: newValue.nombre,
            zonas: zonas,
            numero_sesiones: 1, // ✅ Se solicita el número de sesiones al agregar un servicio
          },
        ]);
      }
    };

    return (
      <Form onSubmit={handleSubmit}>
        <TextField label="Nombre" name="nombre" fullWidth margin="normal" value={values.nombre} onChange={handleChange} />
        <TextField label="Apellidos" name="apellidos" fullWidth margin="normal" value={values.apellidos} onChange={handleChange} />
        <TextField label="Teléfono" name="telefono" fullWidth margin="normal" value={values.telefono} onChange={handleChange} />
        <TextField label="Dirección" name="direccion" fullWidth margin="normal" value={values.direccion} onChange={handleChange} />
        <TextField label="Historial Médico" name="historial_medico" fullWidth margin="normal" multiline rows={3} value={values.historial_medico} onChange={handleChange} />
        <TextField label="Notas Internas" name="notas_internas" fullWidth margin="normal" multiline rows={3} value={values.notas_internas} onChange={handleChange} />

        {/* 🔹 Agregar nuevo servicio */}
        <Autocomplete
          options={servicios}
          getOptionLabel={(option) => option?.nombre || "Servicio sin nombre"}
          onChange={handleAgregarServicio}
          renderInput={(params) => <TextField {...params} label="Agregar Servicio" fullWidth />}
        />

        {/* 🔹 Mostrar servicios seleccionados */}
        {values.servicios.map((servicio, index) => (
          <Box key={index} mt={2} p={2} border={1} borderRadius={2}>
            <Typography variant="subtitle1">{servicio.nombre} - Zonas:</Typography>

            {servicio.zonas.length > 0 ? (
              servicio.zonas.map((zona, zIndex) => (
                <FormControlLabel
                  key={zIndex}
                  control={
                    <Checkbox
                      checked={values.servicios[index].zonas.includes(zona)}
                      onChange={(e) => {
                        let newZonas = [...values.servicios[index].zonas];
                        if (e.target.checked) {
                          newZonas.push(zona);
                        } else {
                          newZonas = newZonas.filter((z) => z !== zona);
                        }
                        setFieldValue(`servicios[${index}].zonas`, newZonas);
                      }}
                    />
                  }
                  label={zona}
                />
              ))
            ) : (
              <Typography variant="body2" color="textSecondary">No hay zonas disponibles.</Typography>
            )}

            {/* 🔹 Selección de número de sesiones */}
            <TextField
              select
              label="Número de Sesiones"
              value={values.servicios[index].numero_sesiones}
              onChange={(e) => {
                const newServicios = [...values.servicios];
                newServicios[index].numero_sesiones = parseInt(e.target.value, 10);
                setFieldValue("servicios", newServicios);
              }}
              fullWidth
              margin="normal"
            >
              {[1, 3, 6].map((num) => (
                <MenuItem key={num} value={num}>
                  {num} Sesiones
                </MenuItem>
              ))}
            </TextField>

            {/* ❌ Botón para eliminar un servicio */}
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => {
                setFieldValue(
                  "servicios",
                  values.servicios.filter((_, i) => i !== index)
                );
              }}
              sx={{ mt: 1 }}
            >
              Eliminar Servicio
            </Button>
          </Box>
        ))}

        <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
          Guardar Cambios
        </Button>
      </Form>
    );
  }}
</Formik>




  </DialogContent>

  <DialogActions>
    <Button variant="contained" color="secondary" onClick={() => setOpenDialog(false)}>Cerrar</Button>
  </DialogActions>
</Dialog>

    </Container>
    
  );
};

export default Clientes;
