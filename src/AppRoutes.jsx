import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Registro from "./pages/Registro";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Citas from "./pages/Citas";
import Servicios from "./pages/Servicios";
import Clientes from "./pages/Clientes";
import Reportes from "./pages/Reportes";
import AppLayout from "./pages/AppLayout";
import Homepage from "./homepage";


const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/registro" element={<Registro />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Homepage />} />

        <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/cliente" element={<Clientes />} />
        <Route path="/citas" element={<Citas />} />
        <Route path="/servicios" element={<Servicios />} />
         <Route path="/reporte" element={<Reportes />} />
         </Route>
      </Routes>
    </Router>
  );
};

export default AppRoutes;
