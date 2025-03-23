import React from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Container,
} from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";

const homepage = () => {
  return (
    <Box sx={{ fontFamily: "sans-serif", overflowX: "hidden" }}>
      {/* HERO */}
      
      <Box
  sx={{
    width: "100vw", // 💥 elimina margen blanco lateral
    background: "linear-gradient(to right, #7b1fa2, #00bcd4)",
    color: "#fff",
    py: { xs: 6, md: 8 }, // menos padding vertical
    px: 2,
    textAlign: "center",
  }}
>
  <Typography variant="h3" fontWeight="bold">
    ETERNA LÁSER
  </Typography>
  <Typography variant="h6" mt={2}>
    Centro Avanzado de Depilación Láser en Ocotal, Nueva Segovia
  </Typography>
  <Box mt={4} display="flex" justifyContent="center" gap={2} flexWrap="wrap">
    <Button
      variant="contained"
      sx={{ backgroundColor: "#9c27b0" }}
      startIcon={<PhoneIcon />}
      href="tel:+50588888888"
    >
      Llamar
    </Button>
    <Button
      variant="contained"
      sx={{ backgroundColor: "#25D366" }}
      startIcon={<WhatsAppIcon />}
      href="https://wa.me/50588888888"
      target="_blank"
    >
      WhatsApp
    </Button>
  </Box>
</Box>


      {/* SOBRE NOSOTROS */}
      <Container sx={{ py: 8 }}>
        <Typography variant="h4" fontWeight="bold" textAlign="center" mb={3}>
          ¿Quiénes somos?
        </Typography>
        <Typography textAlign="center" maxWidth="md" mx="auto">
          En Eterna Láser, nos dedicamos a brindarte la mejor experiencia en depilación láser definitiva. 
          Contamos con equipos de última generación y profesionales certificados que garantizan seguridad, 
          eficacia y resultados visibles desde las primeras sesiones.
        </Typography>
      </Container>

      {/* BENEFICIOS */}
      <Box sx={{ backgroundColor: "#f0f8ff", py: 8 }}>
        <Container>
          <Typography variant="h4" fontWeight="bold" textAlign="center" mb={4}>
            Beneficios de la Depilación Láser
          </Typography>
          <Grid container spacing={4}>
            {[
              "Elimina el vello de forma definitiva.",
              "Tratamientos rápidos y sin dolor.",
              "Resultados visibles desde la primera sesión.",
              "Apto para todo tipo de piel.",
              "Ahorro a largo plazo (adiós al rasurado).",
              "Sin irritaciones ni foliculitis.",
            ].map((beneficio, i) => (
              <Grid item xs={12} md={6} key={i}>
                <Card elevation={2}>
                  <CardContent>
                    <Typography variant="body1">✅ {beneficio}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ZONAS TRATABLES */}
      <Container sx={{ py: 8 }}>
        <Typography variant="h4" fontWeight="bold" textAlign="center" mb={4}>
          Zonas que tratamos
        </Typography>
        <Grid container spacing={2} justifyContent="center">
          {[
            "Rostro completo",
            "Axilas",
            "Brazos y antebrazos",
            "Pecho y abdomen",
            "Espalda",
            "Zona íntima",
            "Piernas completas",
            "Glúteos",
          ].map((zona, i) => (
            <Grid item xs={6} sm={4} md={3} key={i}>
              <Card sx={{ textAlign: "center", py: 2 }}>
                <Typography>{zona}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* TESTIMONIOS */}
      <Box sx={{ backgroundColor: "#e6f7ff", py: 8 }}>
        <Container>
          <Typography variant="h4" fontWeight="bold" textAlign="center" mb={4}>
            Lo que dicen nuestros clientes
          </Typography>
          <Grid container spacing={4}>
            {[
              {
                nombre: "María G.",
                texto:
                  "¡Estoy encantada con los resultados! Mi piel está suave y ya no necesito depilarme constantemente.",
              },
              {
                nombre: "Karla M.",
                texto:
                  "El trato fue excelente y el lugar súper limpio. Muy profesionales en todo momento.",
              },
              {
                nombre: "Ana S.",
                texto:
                  "Desde la segunda sesión noté cambios. ¡Gracias Eterna Láser!",
              },
            ].map((testimonio, i) => (
              <Grid item xs={12} md={4} key={i}>
                <Card>
                  <CardContent>
                    <Typography variant="body1" fontStyle="italic">
                      “{testimonio.texto}”
                    </Typography>
                    <Typography mt={2} fontWeight="bold">
                      - {testimonio.nombre}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

     {/* UBICACIÓN */}
<Box sx={{ py: 8, background: "linear-gradient(to right, #00bcd4, #2196f3)", color: "#fff" }}>
  <Container maxWidth="md">
    <Typography variant="h4" fontWeight="bold" textAlign="center" mb={4}>
      ¿Dónde estamos?
    </Typography>

    <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
      <LocationOnIcon sx={{ fontSize: 50, mb: 1 }} />
      <Typography fontSize="1.2rem" mb={2}>
        Ocotal, Nueva Segovia, Nicaragua
      </Typography>

      <Box
        sx={{
          width: "100%",
          height: "300px",
          borderRadius: 2,
          overflow: "hidden",
          mb: 4,
          boxShadow: 3,
        }}
      >
        <iframe
          title="Ubicación Eterna Láser"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3871.6572312289164!2d-86.4682582858898!3d13.634052502309448!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8f74f9cb6a4dc061%3A0x7c69d2b72c8b4e55!2sOcotal%2C%20Nueva%20Segovia%2C%20Nicaragua!5e0!3m2!1ses-419!2suk!4v1711212121212"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
        ></iframe>
      </Box>

      <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center">
        <Button
          variant="contained"
          sx={{
            backgroundColor: "#fff",
            color: "#2196f3",
            fontWeight: "bold",
            px: 3,
            py: 1.2,
            '&:hover': {
              backgroundColor: "#e3f2fd",
            },
          }}
          href="tel:+50588888888"
          startIcon={<PhoneIcon />}
        >
          Llamar
        </Button>

        <Button
          variant="contained"
          sx={{
            backgroundColor: "#fff",
            color: "#25D366",
            fontWeight: "bold",
            px: 3,
            py: 1.2,
            '&:hover': {
              backgroundColor: "#e8f5e9",
            },
          }}
          href="https://wa.me/50588888888"
          target="_blank"
          startIcon={<WhatsAppIcon />}
        >
          WhatsApp
        </Button>
      </Box>
    </Box>
  </Container>
</Box>


      {/* FOOTER */}
      <Box sx={{ py: 3, backgroundColor: "#111", color: "#aaa", textAlign: "center" }}>
        <Typography variant="body2">
          © {new Date().getFullYear()} Eterna Láser - Ocotal, Nueva Segovia. Todos los derechos reservados.
        </Typography>
      </Box>
    </Box>
  );
};

export default homepage;
