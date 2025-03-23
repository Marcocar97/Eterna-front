import { useState, useEffect } from "react";
import { Container, Typography, Button, Box, Paper, List, ListItem, ListItemText, Divider, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from "@mui/material";
import { obtenerContratosCliente, subirContratoFirmado } from "../apiClient";
import { useParams } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";

const Contratos = ({ clienteId }) => {
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState(null);
  const [archivo, setArchivo] = useState(null);

  useEffect(() => {
    console.log(`🔍 Verificando clienteId: ${clienteId}`);
    
  
    if (!clienteId) {
      console.error("❌ No se ha recibido clienteId");
      return;
    }
  
    const fetchContratos = async () => {
      try {
        console.log(`📡 Enviando solicitud para obtener contratos de ClienteId: ${clienteId}`);
        const response = await obtenerContratosCliente(clienteId);
  
        console.log("📜 Respuesta de la API (contratos):", response.data);
  
        if (!response.data || !Array.isArray(response.data)) {
          console.error("❌ La API no devolvió un array válido:", response.data);
          setContratos([]);
        } else {
          setContratos(response.data);
        }
      } catch (error) {
        console.error("❌ Error obteniendo contratos en el frontend:", error);
        setContratos([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchContratos();
  }, [clienteId]);
  
  
  // 📌 Función para generar PDF del contrato con diseño profesional
  const handleGenerarPDF = (contrato) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let cursorY = 20; // Controla la posición vertical del contenido
  
    // 📌 Agregar el logo (ajusta la ruta si es necesario)
    const logoPath = "public/eterna.png";
    doc.addImage(logoPath, "PNG", 20, cursorY, 40, 20);
  
    // 📌 Nombre de la empresa y fecha alineada a la derecha
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("DEPILACION LASER", 70, cursorY + 10);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha: ${new Date(contrato.createdAt).toLocaleDateString()}`, pageWidth - 60, cursorY + 17);
  
    cursorY += 30; // Espacio después del encabezado
    doc.line(20, cursorY, pageWidth - 20, cursorY); // Línea divisoria
  
    // 📌 Datos del Cliente
    cursorY += 10;
    doc.setFont("helvetica", "bold");
    doc.text("DATOS DEL CLIENTE", 20, cursorY);
    doc.setFont("helvetica", "normal");
    cursorY += 8;
    doc.text(`Nombre: ${contrato.Cliente.nombre} ${contrato.Cliente.apellidos}`, 20, cursorY);
    cursorY += 7;
    doc.text(`Cédula: ${contrato.Cliente.cedula}`, 20, cursorY);
  
    cursorY += 15;
    doc.line(20, cursorY, pageWidth - 20, cursorY); // Línea divisoria
  
    // 📌 Detalles del Servicio
    cursorY += 10;
    doc.setFont("helvetica", "bold");
    doc.text("DETALLES DEL SERVICIO", 20, cursorY);
    
    const zonasTratadas = contrato.zonas?.join(", ") || "No especificado";
    const tableColumn = ["Servicio", "Zonas a Tratar", "N° de Sesiones", "Precio Total"];
    const tableRows = [[
      contrato.servicio_nombre || "No especificado",
      zonasTratadas,
      contrato.numero_sesiones || "No especificado",
      contrato.precio_total ? `$${contrato.precio_total}` : "No especificado",
    ]];
  
    doc.autoTable({
      startY: cursorY + 5,
      head: [tableColumn],
      body: tableRows,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 122, 204], textColor: [255, 255, 255] },
    });
  
    cursorY = doc.lastAutoTable.finalY + 15;
  
    // 📌 Condiciones del Servicio
    if (cursorY + 40 > pageHeight - 40) {
      doc.addPage(); // Agregar una nueva página si no hay espacio
      cursorY = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.text("CONDICIONES DEL SERVICIO", 20, cursorY);
    doc.setFont("helvetica", "normal");
  
    const condicionesTexto = `El cliente reconoce que ha sido informado/a sobre el funcionamiento de la depilación láser, sus beneficios, cuidados pre y post tratamiento, así como las posibles reacciones secundarias. Se compromete a seguir las recomendaciones del personal especializado para maximizar la efectividad del tratamiento. No se garantizan resultados exactos, ya que estos pueden variar según el tipo de piel, vello y respuesta individual al tratamiento. El cliente certifica que no tiene contraindicaciones médicas que impidan la realización del tratamiento. En caso de cancelación de una sesión, el cliente debe avisar con al menos 24 horas de antelación; de lo contrario, la sesión podrá considerarse como realizada. Las sesiones deben completarse dentro de un período máximo de 12 meses desde la fecha de contratación. El cliente acepta que no se realizarán devoluciones una vez iniciado el tratamiento.`;
  
    // 📌 Manejar salto de página si no hay suficiente espacio
    const splitCondiciones = doc.splitTextToSize(condicionesTexto, pageWidth - 40);
    if (cursorY + splitCondiciones.length * 6 > pageHeight - 40) {
      doc.addPage();
      cursorY = 20;
    }
    doc.text(splitCondiciones, 20, cursorY + 10);
  
    cursorY += splitCondiciones.length * 6 + 20;
  
    // 📌 Declaración del Cliente
    if (cursorY + 30 > pageHeight - 40) {
      doc.addPage(); // Agregar nueva página si es necesario
      cursorY = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.text("DECLARACIÓN DEL CLIENTE", 20, cursorY);
    doc.setFont("helvetica", "normal");
  
    const declaracionTexto = `Declaro haber leído y comprendido las condiciones del tratamiento de depilación láser. Acepto recibir este servicio bajo las indicaciones proporcionadas por el equipo de ETERNA LÁSER y asumo la responsabilidad de cumplir con las recomendaciones establecidas.`;
  
    const splitDeclaracion = doc.splitTextToSize(declaracionTexto, pageWidth - 40);
    if (cursorY + splitDeclaracion.length * 6 > pageHeight - 40) {
      doc.addPage();
      cursorY = 20;
    }
    doc.text(splitDeclaracion, 20, cursorY + 10);
  
    cursorY += splitDeclaracion.length * 4 + 20;
  
    doc.text("Firma del Cliente: ___________________", 20, cursorY + 20);
    doc.text("Firma del Representante de ETERNA LÁSER: ___________________", 20, cursorY + 30);
    
  
    // 📌 Guardar el PDF con el nombre del cliente
    doc.save(`Contrato_${contrato.Cliente.nombre}.pdf`);
  };
  

  

  // 📌 Función para subir contrato escaneado
  const handleSubirContrato = async () => {
    if (!archivo || !selectedContrato) return;
    try {
      const formData = new FormData();
      formData.append("contrato_firmado", archivo);
      await subirContratoFirmado(selectedContrato.id, formData);
      alert("Contrato firmado subido con éxito");
      setOpenDialog(false);
    } catch (error) {
      console.error("❌ Error al subir contrato:", error);
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom>
        Contratos del Cliente
      </Typography>

      {loading ? (
  <CircularProgress />
) : contratos.length === 0 ? (
  <Typography>No hay contratos registrados para este cliente.</Typography>
) : (
        <>
          <Typography variant="h6">📜 Contratos Activos</Typography>
          <List>
            {contratos.filter(c => c.estado === "activo").map((contrato) => (
              <Paper key={contrato.id} sx={{ padding: 2, my: 1 }}>
                <ListItem>
                <ListItemText
  primary={
    <Typography variant="subtitle1">
      <strong>Servicio:</strong> {contrato.servicio_nombre || "No especificado"}
    </Typography>
  }
  secondary={
    <>
      <Typography>
  <strong>Zonas:</strong> {contrato.zonas && contrato.zonas.length > 0
    ? contrato.zonas.join(", ")
    : "No especificado"}
</Typography>
      <Typography><strong>Sesiones Contratadas:</strong> {contrato.numero_sesiones || "N/A"}</Typography>
      <Typography><strong>Sesiones Pendientes:</strong> {contrato.numero_sesiones ? contrato.numero_sesiones - (contrato.sesiones_realizadas || 0) : "N/A"}</Typography>
      <Typography color="primary" fontWeight="bold">
        <strong>Precio Total:</strong> {contrato.precio_total ? `$${contrato.precio_total}` : "No disponible"}
      </Typography>
    </>
  }
/>


                  <Button onClick={() => handleGenerarPDF(contrato)} variant="contained" sx={{ ml: 2 }}>
                    Generar PDF
                  </Button>
                </ListItem>
              </Paper>
            ))}
          </List>

          <Typography variant="h6" sx={{ mt: 3 }}>📜 Contratos Finalizados</Typography>
          <List>
            {contratos.filter(c => c.estado === "finalizado").map((contrato) => (
              <Paper key={contrato.id} sx={{ padding: 2, my: 1, bgcolor: "#f0f0f0" }}>
                <ListItem>
                <ListItemText
  primary="Contrato de Servicio"
  secondary={
    <Typography component="span" variant="body2" color="textSecondary">
  <strong>Zonas:</strong> {Array.isArray(contrato.Cliente?.zonas_a_tratar) && contrato.Cliente.zonas_a_tratar.length > 0
    ? contrato.Cliente.zonas_a_tratar.flatMap(z => z.zonas).join(", ")
    : "No especificado"}
  <br />
      <strong>Sesiones Contratadas:</strong> {contrato.numero_sesiones || "N/A"}<br />
      <strong>Sesiones Pendientes:</strong> {contrato.numero_sesiones ? contrato.numero_sesiones - (contrato.sesiones_realizadas || 0) : "N/A"}
    </Typography>
  }
/>


                </ListItem>
              </Paper>
            ))}
          </List>
        </>
      )}

      {/* 📌 Modal para subir contrato firmado */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Subir Contrato Firmado</DialogTitle>
        <DialogContent>
          <input type="file" onChange={(e) => setArchivo(e.target.files[0])} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSubirContrato} variant="contained" color="primary">
            Subir Contrato
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Contratos;
