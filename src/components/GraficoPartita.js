import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";

const GraficoPartita = ({ storico, isOpen, onClose }) => {
  if (!isOpen) return null;

  const nomiGiocatori = Object.keys(storico[0]).filter((k) => k !== "mano");
  const colori = ["#fbbf24", "#34d399", "#60a5fa", "#f87171"];

  // Funzione per ordinare i dati nel Tooltip dal più grande al più piccolo
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const sortedPayload = [...payload].sort((a, b) => b.value - a.value);
      return (
        <div style={tooltipContainer}>
          <p
            style={{
              margin: "0 0 5px",
              fontWeight: "bold",
              borderBottom: "1px solid #fbbf24",
            }}
          >
            Mano {label}
          </p>
          {sortedPayload.map((entry, index) => (
            <div
              key={index}
              style={{
                color: entry.color,
                fontSize: "0.85rem",
                padding: "2px 0",
              }}
            >
              {entry.name}: <strong>{entry.value} pt</strong>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Funzione per rendere il nome del giocatore a fine linea
  const renderCustomLabel = (props) => {
    const { x, y, value, index, data } = props;
    // Mostriamo il nome solo sull'ultimo punto del grafico
    if (index === storico.length - 1) {
      return (
        <text
          x={x}
          y={y}
          dx={10}
          dy={4}
          fill={props.stroke}
          style={{
            fontSize: "12px",
            fontWeight: "bold",
            paintOrder: "stroke",
            stroke: "#064e3b",
            strokeWidth: "2px",
          }}
        >
          {props.name}
        </text>
      );
    }
    return null;
  };

  return (
    <div style={modalOverlay}>
      <div style={modalContent}>
        <div style={headerStyle}>
          <h3 style={{ color: "#fbbf24", margin: 0 }}>📊 Andamento Partita</h3>
          <button onClick={onClose} style={closeBtn}>
            ✕
          </button>
        </div>

        <div style={{ width: "100%", height: 350, marginTop: "20px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={storico}
              margin={{ right: 60, left: -20, top: 10, bottom: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="mano"
                stroke="#fbbf24"
                tick={{ fill: "#fbbf24", fontSize: 12 }}
                label={{
                  value: "Mani",
                  position: "insideBottomRight",
                  offset: -5,
                  fill: "#fbbf24",
                  fontSize: 10,
                }}
              />
              <YAxis
                stroke="#fbbf24"
                tick={{ fill: "#fbbf24", fontSize: 12 }}
                domain={["dataMin - 100", "dataMax + 100"]}
              />
              <Tooltip content={<CustomTooltip />} />

              {nomiGiocatori.map((nome, index) => (
                <Line
                  key={nome}
                  name={nome}
                  type="monotone"
                  dataKey={nome}
                  stroke={colori[index]}
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: colori[index],
                    strokeWidth: 2,
                    stroke: "#064e3b",
                  }}
                  activeDot={{ r: 7 }}
                >
                  <LabelList
                    content={(props) =>
                      renderCustomLabel({
                        ...props,
                        name: nome,
                        stroke: colori[index],
                      })
                    }
                  />
                </Line>
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// STILI AGGIORNATI
const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0,0,0,0.85)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 10000,
};

const modalContent = {
  width: "95%",
  maxWidth: "650px",
  background: "#064e3b", // Il verde della tua App
  padding: "20px",
  borderRadius: "20px",
  border: "2px solid #fbbf24",
  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
};

const tooltipContainer = {
  backgroundColor: "rgba(6, 78, 59, 0.95)", // Verde scuro trasparente
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #fbbf24",
  color: "white",
  boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "10px",
  paddingBottom: "10px",
  borderBottom: "1px solid rgba(251, 191, 36, 0.2)",
};

const closeBtn = {
  background: "#fbbf24",
  border: "none",
  color: "#064e3b",
  width: "30px",
  height: "30px",
  borderRadius: "50%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "1rem",
  fontWeight: "bold",
  cursor: "pointer",
};

export default GraficoPartita;
