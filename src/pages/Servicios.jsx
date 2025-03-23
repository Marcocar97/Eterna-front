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
  IconButton,
  Divider
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import {
  obtenerServicios,
  crearServicio,
  editarServicio,
  eliminarServicio
} from "../apiClient";

const Servicios = ({ rolPermitido = "tecnico" }) => {
  const [servicios, setServicios] = useState([]);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio_1_sesion, setPrecio1] = useState("");
const [precio_3_sesiones, setPrecio3] = useState("");
const [precio_6_sesiones, setPrecio6] = useState("");
  const [imagen, setImagen] = useState("");
  const [duracion, setDuracion] = useState(30); // Duración en minutos (valor por defecto)
  const [editando, setEditando] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const usuarioRol = localStorage.getItem("rol"); // Guarda el rol en el login

    if (!token) {
      navigate("/login");
      return;
    }

    // 🔹 Proteger la página según el rol permitido
    if (usuarioRol !== rolPermitido) {
      navigate("/dashboard");
      return;
    }

    obtenerServicios()
      .then((res) => setServicios(res.data))
      .catch((error) => console.error("❌ Error obteniendo servicios:", error));
  }, [navigate, rolPermitido]);

  const handleAgregarServicio = async () => {
    if (!nombre || !precio_1_sesion || !precio_3_sesiones || !precio_6_sesiones || !duracion) {
      alert("Nombre, precios y duración son obligatorios.");
      return;
    }
  
    const nuevoServicio = {
        nombre,
        descripcion,
        precio_1_sesion: precio_1_sesion, // ✅ Corregido
        precio_3_sesiones: precio_3_sesiones, // ✅ Corregido
        precio_6_sesiones: precio_6_sesiones, // ✅ Corregido
        imagen,
        duracion
      };
      
  
    try {
      if (editando) {
        const res = await editarServicio(editando, nuevoServicio);
        setServicios(servicios.map((s) => (s.id === editando ? res.data.servicio : s)));
        setEditando(null);
      } else {
        const res = await crearServicio(nuevoServicio);
        setServicios([...servicios, res.data]);
      }
      setNombre("");
      setDescripcion("");
      setPrecio1("");
      setPrecio3("");
      setPrecio6("");
      setImagen("");
      setDuracion(30);
    } catch (error) {
      console.error("❌ Error al guardar servicio:", error);
    }
  };
  

  const handleEliminarServicio = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este servicio?")) return;

    try {
      await eliminarServicio(id);
      setServicios(servicios.filter((s) => s.id !== id));
    } catch (error) {
      console.error("❌ Error eliminando servicio:", error);
    }
  };

  const handleEditarServicio = (servicio) => {
    setEditando(servicio.id);
    setNombre(servicio.nombre);
    setDescripcion(servicio.descripcion);
    setPrecio1(servicio.precio_1_sesion);  // ✅ Corregido
    setPrecio3(servicio.precio_3_sesiones); // ✅ Corregido
    setPrecio6(servicio.precio_6_sesiones); // ✅ Corregido
    setImagen(servicio.imagen);
    setDuracion(servicio.duracion);
  };
  
  

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Gestión de Servicios
      </Typography>

      <Box display="flex" gap={3}>
        {/* 📌 Lista de Servicios */}
        <Paper sx={{ width: "50%", padding: 3 }}>
          <Typography variant="h6">Lista de Servicios</Typography>
          <List>
            {servicios.map((servicio) => (
              <div key={servicio.id}>
                <ListItem
                  secondaryAction={
                    <>
                      <IconButton onClick={() => handleEditarServicio(servicio)}>
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleEliminarServicio(servicio.id)} color="error">
                        <Delete />
                      </IconButton>
                    </>
                  }
                >
                <ListItemText
  primary={servicio.nombre}
  secondary={
    <>
      <Typography>Precio (1 sesión): ${servicio.precio_1_sesion}</Typography>
      <Typography>Precio (3 sesiones): ${servicio.precio_3_sesiones}</Typography>
      <Typography>Precio (6 sesiones): ${servicio.precio_6_sesiones}</Typography>
      <Typography>Duración: {servicio.duracion} min</Typography>
    </>
  }
/>



                </ListItem>
                <Divider />
              </div>
            ))}
          </List>
        </Paper>

        {/* 📌 Formulario de Servicio */}
        <Paper sx={{ width: "50%", padding: 3 }}>
          <Typography variant="h6">
            {editando ? "Editar Servicio" : "Agregar Nuevo Servicio"}
          </Typography>
          <TextField
            label="Nombre"
            fullWidth
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            margin="normal"
          />
          <TextField
            label="Descripción"
            fullWidth
            multiline
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            margin="normal"
          />
          <TextField
  label="Precio (1 sesión)"
  fullWidth
  type="number"
  value={precio_1_sesion}
  onChange={(e) => setPrecio1(e.target.value)}
  margin="normal"
/>
<TextField
  label="Precio (3 sesiones)"
  fullWidth
  type="number"
  value={precio_3_sesiones}
  onChange={(e) => setPrecio3(e.target.value)}
  margin="normal"
/>
<TextField
  label="Precio (6 sesiones)"
  fullWidth
  type="number"
  value={precio_6_sesiones}
  onChange={(e) => setPrecio6(e.target.value)}
  margin="normal"
/>

          <TextField
            label="Duración (minutos)"
            fullWidth
            type="number"
            value={duracion}
            onChange={(e) => setDuracion(e.target.value)}
            margin="normal"
          />
          <TextField
            label="Imagen (URL)"
            fullWidth
            value={imagen}
            onChange={(e) => setImagen(e.target.value)}
            margin="normal"
          />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleAgregarServicio}
          >
            {editando ? "Actualizar Servicio" : "Agregar Servicio"}
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default Servicios;
