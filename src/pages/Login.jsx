import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
  Grid,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Paper,
  InputAdornment,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LockIcon from "@mui/icons-material/Lock";
import { loginUsuario, iniciarTurno } from "../apiClient";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const initialValues = {
    nombre: "",
    pin_seguridad: "",
  };

  const validationSchema = Yup.object({
    nombre: Yup.string().required("El nombre es obligatorio"),
    pin_seguridad: Yup.string()
      .min(4, "Mínimo 4 caracteres")
      .required("El PIN es obligatorio"),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    setLoading(true);
    try {
      const response = await loginUsuario(values);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("rol", response.data.rol);
      localStorage.setItem("usuarioId", response.data.usuario.id);

      try {
        await iniciarTurno(response.data.usuario.id);
      } catch (error) {
        console.error("❌ No se pudo iniciar el turno:", error);
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("❌ Error en login:", error);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <Grid
      container
      sx={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        display: "flex",
      }}
    >
      {/* 📌 Fondo (2/3 de la pantalla) */}
      <Grid
        item
        xs={8}
        sx={{
          background: "linear-gradient(to right, #4B0082, #4169E1)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          flexDirection: "column",
          textAlign: "center",
        }}
      >
        <Typography variant="h3" fontWeight="bold">
          ETERNA LASER
        </Typography>
        <Typography variant="h5" sx={{ opacity: 0.8 }}>
          Centro Especializado
        </Typography>
      </Grid>

      {/* 📌 Formulario Login (1/3 de la pantalla) */}
      <Grid
        item
        xs={4}
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f8f8f8",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 5,
            borderRadius: 3,
            height:"85%",
            width: "90%",
            maxWidth: "400px",
          }}
        >
          <br/>
          <br/>
          <br/>
          <Typography variant="h5" fontWeight="bold" align="center" mb={2}>
            Inicio de sesion
          </Typography>
          <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
            {({ isSubmitting }) => (
              <Form>
                <Field
                  as={TextField}
                  name="nombre"
                  label="Usuario"
                  fullWidth
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccountCircleIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <ErrorMessage name="nombre" component="div" style={{ color: "red", fontSize: "14px" }} />

                <Field
                  as={TextField}
                  type="password"
                  name="pin_seguridad"
                  label="Pin de seguridad"
                  fullWidth
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <ErrorMessage name="pin_seguridad" component="div" style={{ color: "red", fontSize: "14px" }} />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{
                    mt: 3,
                    py: 1.5,
                    fontSize: "16px",
                    fontWeight: "bold",
                    background: "linear-gradient(to right, #4B0082, #4169E1)",
                    "&:hover": { background: "linear-gradient(to right, #3A0070, #3056B3)" },
                  }}
                  disabled={isSubmitting || loading}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : "ACCEDER"}
                </Button>
              </Form>
            )}
          </Formik>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Login;
