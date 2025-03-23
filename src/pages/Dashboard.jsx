import { useState, useEffect } from "react";
import { Container, Typography, Button, Box, List, ListItem, ListItemText, Divider, Paper, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow} from "@mui/material";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { format } from "date-fns";
import { obtenerCitas, actualizarCita, obtenerTurnoActual, cerrarTurno } from "../apiClient";
import Citas from "./Citas"; 
import { useNavigate } from "react-router-dom";
import esLocale from "@fullcalendar/core/locales/es";




const Dashboard = () => {
  const [citas, setCitas] = useState([]);
  const [citasDia, setCitasDia] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [turno, setTurno] = useState(null);
  const [cerrando, setCerrando] = useState(false);
  const usuarioId = localStorage.getItem("usuarioId");
  const [detalles, setDetalles] = useState({
    disparos_usados: "",
    potencia: "",
    tipo_laser: "",
    notas: "",
  });


  useEffect(() => {
    const fetchTurno = async () => {
      const usuarioId = localStorage.getItem("usuarioId");
  
      if (!usuarioId) {
        console.error("❌ Error: usuarioId no encontrado en localStorage.");
        return;
      }
  
      console.log(`📌 Buscando turno para UsuarioId: ${usuarioId}`);
  
      try {
        const turnoAbierto = await obtenerTurnoActual(); // 🔹 Obtenemos el turno directamente
        console.log("🔍 Turno recibido:", turnoAbierto);
  
        if (turnoAbierto && turnoAbierto.hora_fin === null) {
          console.log("✅ Turno asignado al estado:", turnoAbierto);
          setTurno(turnoAbierto); // ✅ Se actualiza correctamente
        } else {
          console.warn("⚠️ No hay turnos abiertos");
          setTurno(null);
        }
      } catch (error) {
        console.error("❌ Error obteniendo turno:", error);
        setTurno(null);
      } finally {
        setLoading(false);
      }
    };
  
    fetchTurno();
  }, []);  
  

  const navigate = useNavigate(); // 🔹 Inicializar navigate

const handleCerrarTurno = async () => {
  if (!turno) return;

  setCerrando(true);
  try {
    await cerrarTurno(turno.id);

    setTurno(null); // 🔹 Eliminar el turno actual
    localStorage.removeItem("turnoId"); // 🔹 Limpiar turno del localStorage
    localStorage.removeItem("token"); // 🔹 Eliminar el token de sesión

    navigate("/login"); // 🔹 Redirigir a la página de login
  } catch (error) {
    console.error("❌ Error cerrando turno:", error);
  } finally {
    setCerrando(false);
  }
};

  

  useEffect(() => {
    const fetchCitas = async () => {
      try {
        const res = await obtenerCitas();
        const citasOrdenadas = res.data
          .filter((cita) => cita.estado !== "realizada") // 🔹 Ocultar realizadas
          .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        setCitas(citasOrdenadas);
      } catch (error) {
        console.error("❌ Error cargando citas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCitas();
  }, []);

  const handleEstadoChange = async (id, nuevoEstado) => {
    try {
      await actualizarCita(id, { estado: nuevoEstado });

      setCitas((prevCitas) =>
        prevCitas
          .map((cita) =>
            cita.id === id ? { ...cita, estado: nuevoEstado } : cita
          )
          .filter((cita) => cita.estado !== "realizada")
      );
    } catch (error) {
      console.error("❌ Error actualizando estado de cita:", error);
    }
  };

  const handleMarcarRealizada = (cita) => {
    // 🔹 Incrementar automáticamente el número de sesión
    const nuevoNumSesion = (cita.num_sesion || 0) + 1;

    setCitaSeleccionada(cita);
    setDetalles({
      num_sesion: nuevoNumSesion, // ✅ Se incrementa automáticamente
      disparos_usados: cita.disparos_usados || "",
      potencia: cita.potencia || "",
      tipo_laser: cita.tipo_laser || "",
      notas: cita.notas || "",
    });
    setOpenDialog(true);
  };

  const handleGuardarDetalles = async () => {
    if (!citaSeleccionada) return;

    try {
      await actualizarCita(citaSeleccionada.id, {
        ...detalles,
        num_sesion: detalles.num_sesion, // ✅ Guardar el nuevo número de sesión
        estado: "realizada",
      });

      setCitas((prevCitas) => prevCitas.filter((cita) => cita.id !== citaSeleccionada.id));
      setSelectedDate(null);
      setOpenDialog(false);
    } catch (error) {
      console.error("❌ Error guardando detalles de cita:", error);
    }
  };

  const handleDateClick = (info) => {
    const fechaSeleccionada = info.dateStr;
    setSelectedDate(fechaSeleccionada);
    const citasDelDia = citas.filter(
      (cita) => format(new Date(cita.fecha), "yyyy-MM-dd") === fechaSeleccionada
    );
    setCitasDia(citasDelDia);
  };

  if (loading) return <Typography variant="h6">Cargando citas...</Typography>;

  
  return (
    <Container maxWidth="lg">


<Box display="grid" gridTemplateColumns="1.5fr 1fr" gap={3} mt={3}>



{/* 📌 Tercera columna: Calendario */}

<Paper sx={{
  padding: 2,
  minHeight: "80vh",
  maxWidth: "50vw",
  overflowX: "auto",
  "& .fc-toolbar-title": {
    fontSize: "1.4rem",
    whiteSpace: "nowrap"
  },
  "& .fc-button": {
    padding: "2px 6px",
    fontSize: "0.9rem"
  }
}}>


    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      locale={esLocale}
      dateClick={(info) => setFechaSeleccionada(new Date(info.dateStr))}
      events={citas.map((cita) => ({
        /* title: cita.Contrato?.Servicio?.nombre || "Sin servicio", */
        title: `${cita.Cliente?.nombre || "Cliente"} ${cita.Cliente?.apellidos || ""} - ${(
          cita.Cliente?.zonas_a_tratar?.find(z =>
            String(z.servicio).toLowerCase().trim() === String(cita.Contrato?.Servicio?.nombre).toLowerCase().trim()
          )?.zonas || []
        ).join(", ") || "Sin zonas"}`,
        
        start: new Date(cita.fecha), // Asegura que sea un objeto Date válido
        backgroundColor: cita.estado === "pendiente" ? "#FFA500" // Orange
          : cita.estado === "confirmada" ? "#4CAF50" // Verde
          : "#FF0000", // Rojo
        textColor: "#fff",
        borderRadius: "8px",
      }))}
      
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay",
      }}
      slotMinTime="08:00:00"
slotMaxTime="19:00:00"

      height="auto"
    />
  </Paper>

  {/* 📌 Segunda columna: Próximas Citas */}
<Paper sx={{ padding: 2, minHeight: "80vh", maxWidth: "50vw", overflowX: "auto" }}>

<Typography variant="h6" fontWeight="bold" mb={2}>📅 Próximas Citas</Typography>

{/* 🔹 Botones de navegación */}
<Box display="flex" justifyContent="center" alignItems="center" my={2}>
  <Button onClick={() => setFechaSeleccionada((prev) => new Date(prev.setDate(prev.getDate() - 1)))}>
    {"<"}
  </Button>
  <Typography variant="h6" mx={2}>
    {format(fechaSeleccionada, "dd/MM/yyyy")}
  </Typography>
  <Button onClick={() => setFechaSeleccionada((prev) => new Date(prev.setDate(prev.getDate() + 1)))}>
    {">"}
  </Button>
</Box>

{/* 🔹 Lista de próximas citas */}
<Box sx={{ maxHeight: 500, overflowY: "auto" }}>
  {citas
    .filter((cita) => format(new Date(cita.fecha), "yyyy-MM-dd") === format(fechaSeleccionada, "yyyy-MM-dd"))
    .map((cita) => {
      const zonasContrato = cita.Cliente?.zonas_a_tratar
      ?.filter(zonaObj => 
        String(zonaObj.servicio).toLowerCase().trim() === String(cita.Contrato?.Servicio?.nombre).toLowerCase().trim()
      )
      .flatMap(zonaObj => zonaObj.zonas) || []; // 🔹 flatMap evita anidar arrays vacíos
    


      return (
        <Paper key={cita.id} sx={{ mb: 3, p: 2, borderRadius: 3, boxShadow: 3, backgroundColor: "#fafafa" }}>
          <TableContainer>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5", width: "40%" }}>Cliente</TableCell>
                  <TableCell>{`${cita.Cliente?.nombre || "Desconocido"} ${cita.Cliente?.apellidos || ""}`.trim()}</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}>Técnico</TableCell>
                  <TableCell>{cita.Tecnico?.nombre || "No asignado"}</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}>Servicio</TableCell>
                  <TableCell>{cita.Contrato?.Servicio?.nombre || "No especificado"}</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}>Zonas</TableCell>
                  <TableCell>{zonasContrato.length > 0 ? zonasContrato.join(", ") : "No especificada"}</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}>Sesiones Restantes</TableCell>
                  <TableCell>{cita.Contrato?.numero_sesiones - (cita.Contrato?.sesiones_realizadas || 0) || "N/A"}</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}>Hora</TableCell>
                  <TableCell>{format(new Date(cita.fecha), "HH:mm")}</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}>Estado</TableCell>
                  <TableCell>
                    <strong style={{ 
                      color: cita.estado === "pendiente" ? "orange" : 
                             cita.estado === "confirmada" ? "green" : 
                             "red" 
                    }}>
                      {cita.estado}
                    </strong>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}>Acciones</TableCell>
                  <TableCell>
                    <Select
                      value={cita.estado}
                      onChange={(e) => handleEstadoChange(cita.id, e.target.value)}
                      sx={{ minWidth: 120, fontSize: "0.85rem", height: "32px" }}
                    >
                      <MenuItem value="pendiente">Pendiente</MenuItem>
                      <MenuItem value="confirmada">Confirmada</MenuItem>
                      <MenuItem value="cancelada">Cancelada</MenuItem>
                    </Select>
                    <Button 
                      variant="contained" 
                      color="success" 
                      onClick={() => handleMarcarRealizada(cita)}
                      sx={{ ml: 1, minWidth: "90px", height: "32px", fontSize: "0.85rem" }}
                    >
                      ✔
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      );
    })}
</Box>

</Paper>


  
</Box>




      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Completar Información de la Cita</DialogTitle>
        <DialogContent>
          <TextField
            label="Número de sesión"
            fullWidth
            value={detalles.num_sesion}
            disabled // 🔹 El número de sesión no se puede editar manualmente
            margin="dense"
          />
          <TextField
            label="Disparos usados"
            fullWidth
            value={detalles.disparos_usados}
            onChange={(e) => setDetalles({ ...detalles, disparos_usados: e.target.value })}
            margin="dense"
          />
          <TextField
            label="Potencia"
            fullWidth
            value={detalles.potencia}
            onChange={(e) => setDetalles({ ...detalles, potencia: e.target.value })}
            margin="dense"
          />
          <TextField
            label="Tipo de Láser"
            fullWidth
            value={detalles.tipo_laser}
            onChange={(e) => setDetalles({ ...detalles, tipo_laser: e.target.value })}
            margin="dense"
          />
          <TextField
            label="Notas"
            fullWidth
            multiline
            rows={3}
            value={detalles.notas}
            onChange={(e) => setDetalles({ ...detalles, notas: e.target.value })}
            margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleGuardarDetalles} variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard; 