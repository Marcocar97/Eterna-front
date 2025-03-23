import { useEffect, useState } from "react";
import { obtenerTurnoActual, registrarPago, cerrarTurno } from "../apiClient";

const TurnoActual = () => {
  const [turno, setTurno] = useState(null);
  const [monto, setMonto] = useState("");
  const [metodo, setMetodo] = useState("efectivo");

  useEffect(() => {
    const fetchTurno = async () => {
      try {
        const res = await obtenerTurnoActual();
        setTurno(res.data);
      } catch (error) {
        console.error("Error obteniendo turno:", error);
      }
    };
    fetchTurno();
  }, []);

  const handlePago = async () => {
    try {
      await registrarPago(turno.id, metodo, parseFloat(monto));
      setMonto("");
    } catch (error) {
      console.error("Error registrando pago:", error);
    }
  };

  const handleCerrarTurno = async () => {
    try {
      await cerrarTurno(turno.id);
      setTurno(null);
    } catch (error) {
      console.error("Error cerrando turno:", error);
    }
  };

  return (
    <div>
      <h2>Turno Actual</h2>
      {turno ? (
        <>
          <p>Inicio: {new Date(turno.hora_inicio).toLocaleString()}</p>
          <input type="number" value={monto} onChange={e => setMonto(e.target.value)} placeholder="Monto" />
          <select value={metodo} onChange={e => setMetodo(e.target.value)}>
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
          </select>
          <button onClick={handlePago}>Registrar Pago</button>
          <button onClick={handleCerrarTurno}>Cerrar Turno</button>
        </>
      ) : (
        <p>No hay turno abierto</p>
      )}
    </div>
  );
};

export default TurnoActual;
