import { useState, useEffect } from "react";
import { Drawer, List, ListItem, ListItemText, Divider, Box, Typography, Button, IconButton } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PeopleIcon from "@mui/icons-material/People";
import ReceiptIcon from "@mui/icons-material/Receipt";
import MiscellaneousServicesIcon from "@mui/icons-material/MiscellaneousServices";
import ReportIcon from "@mui/icons-material/Assessment";
import { obtenerTurnoActual, cerrarTurno } from "../apiClient";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; 
import dayjs from "dayjs";
import { obtenerPagosFiltrados } from "../apiClient"; 

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [turno, setTurno] = useState(null);
  const [loading, setLoading] = useState(true);

  const generarReportePDF = async (turno) => {
    if (!turno) return;
  
    try {
      const fechaInicio = dayjs(turno.hora_inicio).format("YYYY-MM-DD HH:mm:ss");
      const fechaFin = dayjs().format("YYYY-MM-DD HH:mm:ss");
      const response = await obtenerPagosFiltrados(fechaInicio, fechaFin);
      const pagos = response.data || [];
  
      // 🔹 Filtrar correctamente ingresos y gastos
      const ingresos = pagos.filter(p => p.tipo_movimiento?.trim().toLowerCase() === "ingreso");
      const gastos = pagos.filter(p => p.tipo_movimiento?.trim().toLowerCase() === "gasto");
  
      const totalIngresos = ingresos.reduce((acc, p) => acc + (parseFloat(p.monto_pagado) || 0), 0);
      const totalEfectivo = ingresos.filter(p => p.metodo_pago === "efectivo").reduce((acc, p) => acc + (parseFloat(p.monto_pagado) || 0), 0);
      const totalTarjeta = ingresos.filter(p => p.metodo_pago === "tarjeta").reduce((acc, p) => acc + (parseFloat(p.monto_pagado) || 0), 0);
      const totalGastos = gastos.reduce((acc, p) => acc + (parseFloat(p.monto_pagado) || 0), 0);
  
      const doc = new jsPDF();
      
      // ✅ Solución: Se usa una fuente estándar
      doc.setFont("times", "normal"); 
      doc.setFontSize(18);
      doc.text("Reporte de Ventas del Turno", 14, 20);
  
      doc.setFontSize(12);
      doc.text(`Técnico: ${turno.Usuario?.nombre || "Desconocido"}`, 14, 38);
      doc.text(`Inicio: ${dayjs(turno.hora_inicio).format("DD/MM/YYYY HH:mm:ss")}`, 14, 46);
      doc.text(`Fin: ${dayjs().format("DD/MM/YYYY HH:mm:ss")}`, 14, 54);
  
      // 🔹 Sección de resumen financiero
      doc.setFont("times", "bold");
      doc.text("Resumen de Ingresos", 14, 70);
      doc.setFont("times", "normal");
      doc.text(`Total Ingresos: $${totalIngresos.toFixed(2)}`, 14, 78);
      doc.text(`Efectivo: $${totalEfectivo.toFixed(2)}`, 14, 86);
      doc.text(`Tarjeta: $${totalTarjeta.toFixed(2)}`, 14, 94);
      doc.text(`Total Gastos: -$${totalGastos.toFixed(2)}`, 14, 102);
  
      let y = 118; // Posición inicial de las tablas
  
      // 🔹 Tabla de ingresos
      if (ingresos.length > 0) {
        doc.setFont("times", "bold");
        doc.text("Ingresos", 14, y);
        y += 8;
  
        const ingresosTabla = ingresos.map((p, index) => [
          index + 1,
          dayjs(p.createdAt).format("DD/MM/YYYY HH:mm:ss"),
          p.Contrato?.Cliente?.nombre || "Sin Cliente",
          `$${parseFloat(p.monto_pagado).toFixed(2)}`,
          p.metodo_pago || "N/A"
        ]);
  
        doc.autoTable({
          startY: y,
          head: [["#", "Fecha", "Cliente", "Monto", "Método"]],
          body: ingresosTabla,
          theme: "striped",
          headStyles: { fillColor: [0, 102, 204] },
          styles: { fontSize: 10 }
        });
  
        y = doc.lastAutoTable.finalY + 10;
      }
  
      // 🔹 Tabla de gastos
      if (gastos.length > 0) {
        doc.setFont("times", "bold");
        doc.text("Gastos", 14, y);
        y += 8;
  
        const gastosTabla = gastos.map((p, index) => [
          index + 1,
          dayjs(p.createdAt).format("DD/MM/YYYY HH:mm:ss"),
          p.descripcion_movimiento || "Sin descripción",
          `-$${parseFloat(p.monto_pagado).toFixed(2)}`,
          p.metodo_pago || "N/A"
        ]);
  
        doc.autoTable({
          startY: y,
          head: [["#", "Fecha", "Descripción", "Monto", "Método"]],
          body: gastosTabla,
          theme: "striped",
          headStyles: { fillColor: [153, 0, 0] },
          styles: { fontSize: 10 }
        });
      }
  
      // Guardar el PDF con un nombre dinámico
      const nombreArchivo = `Reporte_Turno_${dayjs().format("YYYY-MM-DD_HH-mm")}.pdf`;
      doc.save(nombreArchivo);
  
    } catch (error) {
      console.error("❌ Error generando el reporte:", error);
    }
  };



  // Cargar turno activo
  useEffect(() => {
    const fetchTurno = async () => {
      try {
        const turnoAbierto = await obtenerTurnoActual();
        if (turnoAbierto && turnoAbierto.hora_fin === null) {
          setTurno(turnoAbierto);
        } else {
          setTurno(null);
        }
      } catch (error) {
        console.error("❌ Error obteniendo turno:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTurno();
  }, []);

  // Cerrar turno y sesión
  const handleCerrarTurno = async () => {
    if (!turno) return;

    try {
        await generarReportePDF(turno);
      await cerrarTurno(turno.id);
      setTurno(null);
      localStorage.removeItem("turnoId");
      localStorage.removeItem("token");
      navigate("/login");
    } catch (error) {
      console.error("❌ Error cerrando turno:", error);
    }
  };

  // Ocultar Sidebar en Login y Registro
  if (location.pathname === "/login" || location.pathname === "/registro") {
    return null;
  }

  return (
    <Drawer variant="permanent" sx={{ width: 250, flexShrink: 0, "& .MuiDrawer-paper": { width: 250, boxSizing: "border-box", backgroundColor: "#1976D2", color: "#fff" } }}>
      <Box sx={{ textAlign: "center", my: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          ETERNA LASER
        </Typography>
      </Box>
      <Divider sx={{ bgcolor: "#ffffff55" }} />
      <List>
        <ListItem button onClick={() => navigate("/dashboard")}>
          <DashboardIcon sx={{ mr: 2 }} />
          <ListItemText primary="Inicio" />
        </ListItem>
        <ListItem button onClick={() => navigate("/citas")}>
          <CalendarTodayIcon sx={{ mr: 2 }} />
          <ListItemText primary="Citas" />
        </ListItem>
        <ListItem button onClick={() => navigate("/cliente")}>
          <PeopleIcon sx={{ mr: 2 }} />
          <ListItemText primary="Clientes" />
        </ListItem>
        <ListItem button onClick={() => navigate("/servicios")}>
          <MiscellaneousServicesIcon sx={{ mr: 2 }} />
          <ListItemText primary="Servicios" />
        </ListItem>
        <ListItem button onClick={() => navigate("/reporte")}>
          <ReportIcon sx={{ mr: 2 }} />
          <ListItemText primary="Reportes" />
        </ListItem>
      </List>
      <Divider sx={{ bgcolor: "#ffffff55" }} />

      {/* Información del turno */}
      <Box sx={{ p: 2, textAlign: "center" }}>
        {loading ? (
          <Typography variant="body2">Cargando turno...</Typography>
        ) : turno ? (
          <>
            <Typography variant="body2">
              Turno Abierto: <strong>{turno.Usuario?.nombre}</strong>
            </Typography>
            <Typography variant="body2">
              Inicio: {new Date(turno.hora_inicio).toLocaleString()}
            </Typography>
            <Button variant="contained" color="error" fullWidth sx={{ mt: 2 }} onClick={handleCerrarTurno}>
              <LogoutIcon sx={{ mr: 1 }} /> Cerrar Turno
            </Button>
          </>
        ) : (
          <Typography variant="body2" color="error">No hay turno abierto</Typography>
        )}
      </Box>
    </Drawer>
  );
};

export default Sidebar;
