import { useState, useEffect } from "react";
import { Container, Typography, TextField, Button, Paper, List, ListItem, ListItemText, Divider, CircularProgress, MenuItem, Select } from "@mui/material";
import { Grid } from "@mui/material"
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { obtenerPagosFiltrados, agregarGasto } from "../apiClient";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import dayjs from "dayjs"; 

const Reportes = () => {
  const [pagos, setPagos] = useState([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [loading, setLoading] = useState(true);
  const [gasto, setGasto] = useState({ nombre: "", descripcion: "", monto: "" });


  const [filtroFecha, setFiltroFecha] = useState("hoy");

  const calcularFechas = (filtro) => {
    const hoy = dayjs();
    let inicio, fin;
  
    switch (filtro) {
      case "hoy":
        inicio = hoy.startOf("day").format("YYYY-MM-DD HH:mm:ss");
        fin = hoy.endOf("day").format("YYYY-MM-DD HH:mm:ss");
        break;
      case "ayer":
        inicio = hoy.subtract(1, "day").startOf("day").format("YYYY-MM-DD HH:mm:ss");
        fin = hoy.subtract(1, "day").endOf("day").format("YYYY-MM-DD HH:mm:ss");
        break;
      case "semana":
        inicio = hoy.startOf("week").format("YYYY-MM-DD HH:mm:ss");
        fin = hoy.endOf("week").format("YYYY-MM-DD HH:mm:ss");
        break;
      case "mes":
        inicio = hoy.startOf("month").format("YYYY-MM-DD HH:mm:ss");
        fin = hoy.endOf("month").format("YYYY-MM-DD HH:mm:ss");
        break;
      case "ultimos30":
        inicio = hoy.subtract(30, "day").startOf("day").format("YYYY-MM-DD HH:mm:ss");
        fin = hoy.endOf("day").format("YYYY-MM-DD HH:mm:ss");
        break;
      case "todo":
        inicio = "1900-01-01 00:00:00"; // Asegurar que incluya todos los datos
        fin = hoy.endOf("day").format("YYYY-MM-DD HH:mm:ss");
        break;
      default:
        inicio = hoy.startOf("day").format("YYYY-MM-DD HH:mm:ss");
        fin = hoy.endOf("day").format("YYYY-MM-DD HH:mm:ss");
    }
  
    console.log(`📅 Filtro aplicado: ${filtro} | Inicio: ${inicio} | Fin: ${fin}`);
    
    setFechaInicio(inicio);
    setFechaFin(fin);
  };
  
  

  // Totales
  const [totalIngresos, setTotalIngresos] = useState(0);
  const [totalGastos, setTotalGastos] = useState(0);
  const [totalEfectivo, setTotalEfectivo] = useState(0);
  const [totalTarjeta, setTotalTarjeta] = useState(0);

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      fetchPagos();
    }
  }, [fechaInicio, fechaFin]);
  

  const fetchPagos = async () => {
    setLoading(true);
    try {
      const response = await obtenerPagosFiltrados(fechaInicio, fechaFin);
      console.log("📊 Pagos recibidos en el frontend:", response.data); // 🔍 Verifica qué datos llegan
  
      // 🔍 Verifica si el campo tipo_movimiento está bien definido
      response.data.forEach(p => console.log(`ID: ${p.id}, Tipo: ${p.tipo_movimiento}, Monto: ${p.monto_pagado}`));
  
      setPagos(response.data);

       // Convertir fechas al formato correcto
   // Comparar directamente con el formato correcto sin UTC
   const pagosFiltrados = response.data.filter(pago => {
    const fechaPago = dayjs(pago.createdAt).format("YYYY-MM-DD HH:mm:ss");
    return fechaPago >= fechaInicio && fechaPago <= fechaFin;
  });

  console.log("✅ Pagos filtrados:", pagosFiltrados);
  
  setPagos(pagosFiltrados);
  
      // ✅ Filtrar ingresos y gastos correctamente
      const ingresos = response.data.filter(p => p.tipo_movimiento?.trim().toLowerCase() === "ingreso");
      const gastos = response.data.filter(p => p.tipo_movimiento?.trim().toLowerCase() === "gasto");
  
      console.log("✅ Ingresos:", ingresos);
      console.log("✅ Gastos:", gastos);
  
      const parseMonto = (monto) => parseFloat(monto) || 0;

      setTotalIngresos(ingresos.reduce((acc, p) => acc + parseMonto(p.monto_pagado), 0));
      setTotalGastos(gastos.reduce((acc, p) => acc + parseMonto(p.monto_pagado), 0));
      setTotalEfectivo(ingresos.filter(p => p.metodo_pago === "efectivo").reduce((acc, p) => acc + parseMonto(p.monto_pagado), 0));
      setTotalTarjeta(ingresos.filter(p => p.metodo_pago === "tarjeta").reduce((acc, p) => acc + parseMonto(p.monto_pagado), 0));
  
    } catch (error) {
      console.error("❌ Error obteniendo pagos:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const formatCurrency = (amount) => `$${parseFloat(amount).toFixed(2)}`;
  

  const handleAgregarGasto = async () => {
    try {
      await agregarGasto(gasto);
      alert("✅ Gasto agregado correctamente");
      setGasto({ nombre: "", descripcion: "", monto: "" });
      fetchPagos();
    } catch (error) {
      console.error("❌ Error al agregar gasto:", error);
    }
  };


  const exportarExcel = () => {
    const fechaReporte = dayjs().format("YYYY-MM-DD HH:mm:ss");
  
    // Separar ingresos y gastos
    const ingresos = pagos.filter(p => p.tipo_movimiento?.trim().toLowerCase() === "ingreso");
    const gastos = pagos.filter(p => p.tipo_movimiento?.trim().toLowerCase() === "gasto");
  
    // Convertir datos en formato adecuado para Excel
    const datosIngresos = ingresos.map(p => ({
      Fecha: dayjs(p.createdAt).format("DD/MM/YYYY HH:mm:ss"),
      Cliente: p.Contrato?.Cliente?.nombre || "Sin Cliente",
      Servicio: p.Contrato?.Servicio?.nombre || p.nombre || "Sin Servicio",
      "Método de Pago": p.metodo_pago || "N/A",
      "Monto Pagado": `$${p.monto_pagado || 0}`,
    }));
  
    const datosGastos = gastos.map(p => ({
      Fecha: dayjs(p.createdAt).format("DD/MM/YYYY HH:mm:ss"),
      Descripción: p.descripcion_movimiento || "Sin descripción",
      "Método de Pago": p.metodo_pago || "N/A",
      "Monto Pagado": `-$${p.monto_pagado || 0}`,
    }));
  
    // Crear hoja de Excel
    const libro = XLSX.utils.book_new();
    
    if (datosIngresos.length > 0) {
      const hojaIngresos = XLSX.utils.json_to_sheet(datosIngresos);
      XLSX.utils.book_append_sheet(libro, hojaIngresos, "Ingresos");
    }
  
    if (datosGastos.length > 0) {
      const hojaGastos = XLSX.utils.json_to_sheet(datosGastos);
      XLSX.utils.book_append_sheet(libro, hojaGastos, "Gastos");
    }
  
    // Guardar archivo
    XLSX.writeFile(libro, `Reporte_Pagos_${fechaReporte}.xlsx`);
  };
  
  const exportarPDF = (usuario) => {
    const doc = new jsPDF();
    
    // Configurar el estilo del reporte
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Reporte de Pagos", 14, 20);
  
    // Agregar información del usuario y fecha
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const fechaGeneracion = new Date().toLocaleString();
    
    doc.text(`Fecha y Hora: ${fechaGeneracion}`, 14, 38);
  
    // Espaciado antes de las tablas
    let y = 50;
  
    // Tabla de ingresos
    if (pagos.some(p => p.tipo_movimiento?.trim().toLowerCase() === "ingreso")) {
      doc.setFont("helvetica", "bold");
      doc.text("Ingresos", 14, y);
      y += 8;
  
      const ingresos = pagos
        .filter(p => p.tipo_movimiento?.trim().toLowerCase() === "ingreso")
        .map((p, index) => [
          index + 1,
          new Date(p.createdAt).toLocaleString(),
          p.Contrato?.Cliente?.nombre || "Sin Cliente",
          `$${parseFloat(p.monto_pagado).toFixed(2)}`,  // ✅ Conversión a número
          p.metodo_pago || "N/A"
        ]);
  
      doc.autoTable({
        startY: y,
        head: [["#", "Fecha y Hora", "Cliente", "Monto", "Método"]],
        body: ingresos,
        theme: "striped",
        headStyles: { fillColor: [0, 51, 102] },
        styles: { fontSize: 10 }
      });
  
      y = doc.lastAutoTable.finalY + 10;
    }
  
    // Tabla de gastos
    if (pagos.some(p => p.tipo_movimiento?.trim().toLowerCase() === "gasto")) {
      doc.setFont("helvetica", "bold");
      doc.text("Gastos", 14, y);
      y += 8;
  
      const gastos = pagos
        .filter(p => p.tipo_movimiento?.trim().toLowerCase() === "gasto")
        .map((p, index) => [
          index + 1,
          new Date(p.createdAt).toLocaleString(),
          p.descripcion_movimiento || "Sin descripción",
          `-$${parseFloat(p.monto_pagado).toFixed(2)}`,  // ✅ Conversión a número
          p.metodo_pago || "N/A"
        ]);
  
      doc.autoTable({
        startY: y,
        head: [["#", "Fecha y Hora", "Descripción", "Monto", "Método"]],
        body: gastos,
        theme: "striped",
        headStyles: { fillColor: [153, 0, 0] },
        styles: { fontSize: 10 }
      });
    }
  
    // Guardar el PDF con un nombre dinámico
    doc.save(`Reporte_Pagos_${new Date().toISOString().slice(0, 10)}.pdf`);
  };
  
  

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom>Reportes</Typography>

      {/* Filtros */}

<Paper sx={{ padding: 2, marginBottom: 2, borderRadius: 2, boxShadow: 3 }}>
  <Grid container spacing={2} alignItems="center">
    {/* Título */}
    <Grid item xs={3}>
      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
        Filtro de Fechas
      </Typography>
    </Grid>

    {/* Select para filtrar */}
    <Grid item xs={9}>
      <Select
        value={filtroFecha}
        onChange={(e) => {
          setFiltroFecha(e.target.value);
          calcularFechas(e.target.value);
        }}
        fullWidth
        variant="outlined"
        size="small"
      >
        <MenuItem value="hoy">Hoy</MenuItem>
        <MenuItem value="ayer">Ayer</MenuItem>
        <MenuItem value="semana">Esta Semana</MenuItem>
        <MenuItem value="mes">Este Mes</MenuItem>
        <MenuItem value="ultimos30">Últimos 30 Días</MenuItem>
        <MenuItem value="todo">Todo</MenuItem>
      </Select>
    </Grid>
  </Grid>
</Paper>


      {loading ? <CircularProgress /> : (
        <>
          {/* Ingresos */}
          <Paper sx={{ padding: 3, marginTop: 3, borderRadius: 2, boxShadow: 3 }}>
  <Typography variant="h5" sx={{ fontWeight: "bold", marginBottom: 2 }}>
    Ingresos
  </Typography>

  {pagos.filter(p => p.tipo_movimiento?.trim().toLowerCase() === "ingreso").length === 0 ? (
    <Typography variant="body1" color="textSecondary">
      No hay ingresos registrados.
    </Typography>
  ) : (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#1976d2" }}>
            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Fecha</TableCell>
            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Cliente</TableCell>
            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Servicio</TableCell>
            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Método de Pago</TableCell>
            <TableCell sx={{ color: "white", fontWeight: "bold", textAlign: "right" }}>Monto</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pagos
            .filter(p => p.tipo_movimiento?.trim().toLowerCase() === "ingreso")
            .map((pago) => (
              <TableRow key={pago.id}>
                <TableCell>{dayjs(pago.createdAt).format("DD/MM/YYYY HH:mm")}</TableCell>
                <TableCell>{pago.Contrato?.Cliente?.nombre || "Sin Cliente"}</TableCell>
                <TableCell>{pago.Contrato?.Servicio?.nombre || "Sin Servicio"}</TableCell>
                <TableCell>{pago.metodo_pago || "N/A"}</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "green", textAlign: "right" }}>
                  {formatCurrency(pago.monto_pagado || 0)}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  )}
</Paper>


          <Divider sx={{ my: 2 }} />

         {/* Gastos */}
         <Paper sx={{ padding: 3, marginTop: 3, borderRadius: 2, boxShadow: 3 }}>
  <Typography variant="h5" sx={{ fontWeight: "bold", marginBottom: 2 }}>
    Gastos
  </Typography>

  {pagos.filter(p => p.tipo_movimiento?.trim().toLowerCase() === "gasto").length === 0 ? (
    <Typography variant="body1" color="textSecondary">
      No hay gastos registrados.
    </Typography>
  ) : (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#d32f2f" }}> {/* Rojo oscuro para diferenciar de ingresos */}
            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Fecha</TableCell>
            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Descripción</TableCell>
            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Método de Pago</TableCell>
            <TableCell sx={{ color: "white", fontWeight: "bold", textAlign: "right" }}>Monto</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pagos
            .filter(p => p.tipo_movimiento?.trim().toLowerCase() === "gasto")
            .map((pago) => (
              <TableRow key={pago.id}>
                <TableCell>{dayjs(pago.createdAt).format("DD/MM/YYYY HH:mm")}</TableCell>
                <TableCell>{pago.descripcion_movimiento || "Sin descripción"}</TableCell>
                <TableCell>{pago.metodo_pago || "N/A"}</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "red", textAlign: "right" }}>
                  {formatCurrency(pago.monto_pagado || 0)}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  )}
</Paper>

<Paper sx={{ padding: 2, marginTop: 2, borderRadius: 2, boxShadow: 3 }}>
  <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
    Agregar Gasto
  </Typography>

  <Grid container spacing={2} alignItems="center">
    {/* Nombre del gasto */}
    <Grid item xs={3}>
      <TextField
        label="Nombre"
        value={gasto.nombre}
        onChange={(e) => setGasto({ ...gasto, nombre: e.target.value })}
        fullWidth
        variant="outlined"
        size="small"
      />
    </Grid>

    {/* Descripción */}
    <Grid item xs={4}>
      <TextField
        label="Descripción"
        value={gasto.descripcion}
        onChange={(e) => setGasto({ ...gasto, descripcion: e.target.value })}
        fullWidth
        variant="outlined"
        size="small"
      />
    </Grid>

    {/* Monto */}
    <Grid item xs={2}>
      <TextField
        label="Monto ($)"
        type="number"
        value={gasto.monto}
        onChange={(e) => setGasto({ ...gasto, monto: parseFloat(e.target.value) || 0 })}
        fullWidth
        variant="outlined"
        size="small"
      />
    </Grid>

    {/* Botón para guardar */}
    <Grid item xs={3} sx={{ display: "flex", justifyContent: "center" }}>
      <Button
        variant="contained"
        color="error"
        onClick={handleAgregarGasto}
        sx={{
          padding: 1,
          fontSize: 14,
          fontWeight: "bold",
          width: "100%",
          maxWidth: "180px",
        }}
      >
        Guardar Gasto
      </Button>
    </Grid>
  </Grid>
</Paper>




        </>
      )}

      {/* Botones de exportación */}
      <Paper sx={{ padding: 3, marginTop: 3, display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>


  <Button variant="contained" color="error" sx={{ flex: 1, padding: 3, fontSize: 24, fontWeight: "bold", minWidth: "200px", display: "flex", flexDirection: "column", alignItems: "center" }}>
    {formatCurrency(totalGastos)}
    <Typography variant="body2" sx={{ fontSize: 16, marginTop: 1 }}>Gastos</Typography>
  </Button>

  <Button variant="contained" color="primary" sx={{ flex: 1, padding: 3, fontSize: 24, fontWeight: "bold", minWidth: "200px", display: "flex", flexDirection: "column", alignItems: "center" }}>
    {formatCurrency(totalEfectivo)}
    <Typography variant="body2" sx={{ fontSize: 16, marginTop: 1 }}>Efectivo</Typography>
  </Button>

  <Button variant="contained" color="primary" sx={{ flex: 1, padding: 3, fontSize: 24, fontWeight: "bold", minWidth: "200px", display: "flex", flexDirection: "column", alignItems: "center" }}>
    {formatCurrency(totalTarjeta)}
    <Typography variant="body2" sx={{ fontSize: 16, marginTop: 1 }}>Tarjeta</Typography>
  </Button>

  <Button variant="contained" color="success" sx={{ flex: 1, padding: 3, fontSize: 24, fontWeight: "bold", minWidth: "200px", display: "flex", flexDirection: "column", alignItems: "center" }}>
    {formatCurrency(totalIngresos)}
    <Typography variant="body2" sx={{ fontSize: 16, marginTop: 1 }}>Ingresos</Typography>
  </Button>
</Paper>


<br/>
      <Button variant="contained" onClick={exportarExcel}>Exportar Excel</Button> <Button variant="contained" onClick={exportarPDF}>Exportar PDF</Button>
      <br/>
      <br/>
    </Container>
  );
};

export default Reportes;
