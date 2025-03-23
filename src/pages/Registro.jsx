import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { registrarUsuario } from "../apiClient";
import { Container, TextField, Button, Typography, CircularProgress, MenuItem, Select, InputLabel, FormControl } from "@mui/material";

const Registro = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const initialValues = {
    nombre: "",
    pin_seguridad: "",
    rol: "tecnico", // Valor por defecto
  };

  const validationSchema = Yup.object({
    nombre: Yup.string().required("El nombre es obligatorio"),
    pin_seguridad: Yup.string().min(4, "Mínimo 4 caracteres").required("El PIN es obligatorio"),
    rol: Yup.string().oneOf(["tecnico", "administrador"], "Rol inválido").required("El rol es obligatorio"),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    setLoading(true);
    try {
      await registrarUsuario(values);
      navigate("/login"); // Redirigir al login tras registro exitoso
    } catch (error) {
      console.error("Error al registrar usuario:", error);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>Registro</Typography>
      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
        {({ isSubmitting, values, handleChange }) => (
          <Form>
            <Field as={TextField} name="nombre" label="Nombre" fullWidth margin="normal" />
            <ErrorMessage name="nombre" component="div" style={{ color: "red" }} />

            <Field as={TextField} type="password" name="pin_seguridad" label="PIN" fullWidth margin="normal" />
            <ErrorMessage name="pin_seguridad" component="div" style={{ color: "red" }} />

            {/* Campo de selección del rol */}
            <FormControl fullWidth margin="normal">
              <InputLabel>Rol</InputLabel>
              <Field
                as={Select}
                name="rol"
                value={values.rol}
                onChange={handleChange}
              >
                <MenuItem value="tecnico">Técnico</MenuItem>
                <MenuItem value="administrador">Administrador</MenuItem>
              </Field>
            </FormControl>
            <ErrorMessage name="rol" component="div" style={{ color: "red" }} />

            <Button type="submit" variant="contained" color="primary" fullWidth disabled={isSubmitting || loading}>
              {loading ? <CircularProgress size={24} /> : "Registrarse"}
            </Button>
          </Form>
        )}
      </Formik>
    </Container>
  );
};

export default Registro;
