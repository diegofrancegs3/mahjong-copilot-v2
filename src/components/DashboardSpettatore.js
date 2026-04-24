import React, { useRef, useState, useEffect } from "react";
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

const DashboardSpettatore = ({ datiPartita }) => {
  const dashRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);

    window.addEventListener("resize", handleResize);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("fullscreenchange", handleFsChange);
    };
  }, []);

  if (!datiPartita) return <div style={loadingStyle}>Caricamento dati...</div>;

  const isMobile = windowSize.width < 900;
  const colWidth = isMobile
    ? Math.max(160, windowSize.width * 0.35)
    : Math.max(300, windowSize.width * 0.25);

  const nomiGiocatori = Array.isArray(datiPartita.posti)
    ? datiPartita.posti.filter((n) => n && typeof n === "string")
    : Object.values(datiPartita.posti || {}).filter((n) => n !== "");

  const storico = datiPartita.storico || [];
  const punteggiAttuali = datiPartita.punteggi_globali || {};
  const manoCorrente = datiPartita.numero_mano || 1;
  const venti = datiPartita.venti_assegnati || {};
  const vincitore_mahjong = datiPartita.vincitore_mahjong;
  const stecche = datiPartita.punti_dichiarati || {};
  const perdenti = nomiGiocatori.filter((n) => n !== vincitore_mahjong);

  const li = datiPartita.lancio_iniziale || {};
  const sommaPrimiDue = (li.lancio1 || 0) + (li.lancio2 || 0);

  // --- LOGICA MURO ALLINEATA A GIOCO.JS ---
  const getMuro = (n) => {
    if (n === 1 || n === 5) return "EST";
    if (n === 2 || n === 6) return "SUD";
    if (n === 3) return "OVEST";
    if (n === 4) return "NORD";
    return "";
  };

  // Identifica il vento del muro basato sull'ultimo dado
  const nomeMuroVento = li.ultimoDado ? getMuro(li.ultimoDado) : null;

  // Trova il giocatore che ha quel vento assegnato in questa mano
  const proprietarioMuro = nomeMuroVento
    ? Object.keys(venti).find((nome) => venti[nome] === nomeMuroVento)
    : null;

  const dadiDisplay = sommaPrimiDue > 0 ? sommaPrimiDue : "--";
  const muroDisplay = proprietarioMuro
    ? `${proprietarioMuro} (${nomeMuroVento})`
    : "--";

  const colori = ["#fbbf24", "#34d399", "#60a5fa", "#f87171"];

  const calcolaPagamento = (valoreBase, p1, p2) => {
    const v1 = (venti[p1] || "").toLowerCase();
    const v2 = (venti[p2] || "").toLowerCase();
    const coinvolgeEst = v1 === "est" || v2 === "est";
    let totale = valoreBase;
    if (coinvolgeEst) totale *= 2;
    const valoreAssoluto = Math.abs(totale);
    const ultimaCifra = valoreAssoluto % 10;
    const baseDecina = Math.floor(valoreAssoluto / 10) * 10;
    let arrotondato = valoreAssoluto;
    if (ultimaCifra === 2 || ultimaCifra === 4) arrotondato = baseDecina;
    else if (ultimaCifra === 6 || ultimaCifra === 8)
      arrotondato = baseDecina + 10;
    const limite = coinvolgeEst ? 400 : 200;
    return Math.min(arrotondato, limite);
  };

  const RenderPagamento = ({ chiPaga, quanto, chiRiceve }) => {
    if (quanto === 0)
      return <div style={{ textAlign: "center", opacity: 0.8 }}>Pareggio</div>;
    return (
      <div style={{ textAlign: "center", lineHeight: "1.1" }}>
        <span style={{ fontSize: "0.6rem", opacity: 0.8 }}>
          {chiPaga} paga{" "}
        </span>
        <strong
          style={{
            color: "#34d399",
            fontSize: isMobile ? "0.75rem" : "0.9rem",
          }}
        >
          {quanto}{" "}
        </strong>
        <span style={{ fontSize: "0.6rem", opacity: 0.8 }}>a {chiRiceve}</span>
      </div>
    );
  };

  const CellaGiocatore = ({ nome }) => (
    <div style={{ lineHeight: "1.1" }}>
      <span
        style={{
          fontWeight: "bold",
          fontSize: isMobile ? "0.65rem" : "0.8rem",
        }}
      >
        {nome}
      </span>{" "}
      <small style={{ opacity: 0.7, fontSize: "0.6rem" }}>
        ({venti[nome]})
      </small>
      <br />
      <small style={{ opacity: 0.5, fontSize: "0.6rem" }}>
        {stecche[nome] || 0} pt
      </small>
    </div>
  );

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      dashRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  return (
    <div
      ref={dashRef}
      style={{
        ...dashWrapper,
        height: "100vh",
        maxHeight: "100vh",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          ...headerDash,
          height: isMobile ? "40px" : "70px",
          padding: isMobile ? "0 15px" : "0 25px",
        }}
      >
        <div style={titleArea}>
          <span
            style={{
              ...liveBadge,
              padding: isMobile ? "2px 6px" : "4px 12px",
              fontSize: isMobile ? "0.5rem" : "0.75rem",
            }}
          >
            ● LIVE
          </span>
          <h1
            style={{ ...titleStyle, fontSize: isMobile ? "0.9rem" : "1.5rem" }}
          >
            {datiPartita.nome}
          </h1>
        </div>
        <div style={{ ...statsHeader, gap: isMobile ? "10px" : "25px" }}>
          <div style={statBox}>
            <span style={statLabel}>MANO</span>
            <span
              style={{ ...statValue, fontSize: isMobile ? "0.9rem" : "1.3rem" }}
            >
              {manoCorrente}
            </span>
          </div>
          <button
            onClick={toggleFullscreen}
            style={{
              ...btnFullscreen,
              padding: isMobile ? "4px 6px" : "8px 16px",
              fontSize: isMobile ? "0.8rem" : "1rem",
            }}
          >
            {isFullscreen ? "🔲" : "📺"}
          </button>
        </div>
      </div>

      <div
        style={{
          ...mainGrid,
          padding: isMobile ? "8px" : "20px",
          gap: isMobile ? "8px" : "20px",
        }}
      >
        <div
          style={{
            ...leftCol,
            width: colWidth,
            flex: `0 0 ${colWidth}px`,
            gap: isMobile ? "6px" : "12px",
          }}
        >
          <h2
            style={{
              ...sectionTitle,
              fontSize: isMobile ? "0.55rem" : "0.75rem",
            }}
          >
            CLASSIFICA
          </h2>
          <div style={{ ...scoreList, gap: isMobile ? "4px" : "8px" }}>
            {nomiGiocatori
              .sort(
                (a, b) => (punteggiAttuali[b] || 0) - (punteggiAttuali[a] || 0)
              )
              .map((nome, idx) => (
                <div
                  key={nome}
                  style={{
                    ...scoreCard,
                    padding: isMobile ? "6px 10px" : "10px 18px",
                    borderLeft: `${isMobile ? 3 : 5}px solid ${
                      colori[idx % 4]
                    }`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        ...playerLabel,
                        fontSize: isMobile ? "0.75rem" : "1rem",
                      }}
                    >
                      {nome}
                    </span>
                    <span
                      style={{
                        ...ventoLabel,
                        fontSize: isMobile ? "0.55rem" : "0.7rem",
                      }}
                    >
                      {venti[nome] || ""}
                    </span>
                  </div>
                  <span
                    style={{
                      ...scoreValue,
                      fontSize: isMobile ? "1rem" : "1.6rem",
                    }}
                  >
                    {punteggiAttuali[nome] ?? 0}
                  </span>
                </div>
              ))}
          </div>

          {datiPartita.fase_calcolo === "riepilogo" ? (
            <div
              style={{
                background: "rgba(0,0,0,0.3)",
                borderRadius: "12px",
                border: "1px solid #fbbf24",
                padding: isMobile ? "8px" : "12px",
                marginTop: "auto",
                overflowY: "auto",
              }}
            >
              <h3
                style={{
                  color: "#fbbf24",
                  marginBottom: "8px",
                  textAlign: "center",
                  fontSize: isMobile ? "0.6rem" : "0.8rem",
                  textTransform: "uppercase",
                }}
              >
                Riepilogo Pagamenti
              </h3>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  color: "white",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid #fbbf24",
                      opacity: 0.8,
                      fontSize: "0.6rem",
                    }}
                  >
                    <th style={{ textAlign: "left", paddingBottom: "4px" }}>
                      Da
                    </th>
                    <th style={{ textAlign: "left", paddingBottom: "4px" }}>
                      A
                    </th>
                    <th style={{ textAlign: "center", paddingBottom: "4px" }}>
                      Totale
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {perdenti.map((p) => {
                    const finale = calcolaPagamento(
                      stecche[vincitore_mahjong] || 0,
                      p,
                      vincitore_mahjong
                    );
                    return (
                      <tr
                        key={`v-${p}`}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.1)",
                          backgroundColor: "rgba(16, 185, 129, 0.05)",
                        }}
                      >
                        <td style={{ padding: "4px 0" }}>
                          <CellaGiocatore nome={p} />
                        </td>
                        <td style={{ padding: "4px 0" }}>
                          <CellaGiocatore nome={vincitore_mahjong} />
                        </td>
                        <td style={{ padding: "4px 0" }}>
                          <RenderPagamento
                            chiPaga={p}
                            quanto={finale}
                            chiRiceve={vincitore_mahjong}
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {perdenti.map((p1, i) =>
                    perdenti.slice(i + 1).map((p2) => {
                      const diff = (stecche[p1] || 0) - (stecche[p2] || 0);
                      const finale = calcolaPagamento(Math.abs(diff), p1, p2);
                      const chiPaga = diff > 0 ? p2 : p1;
                      const chiRiceve = diff > 0 ? p1 : p2;
                      return (
                        <tr
                          key={`${p1}-${p2}`}
                          style={{
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          <td style={{ padding: "4px 0" }}>
                            <CellaGiocatore nome={p1} />
                          </td>
                          <td style={{ padding: "4px 0" }}>
                            <CellaGiocatore nome={p2} />
                          </td>
                          <td style={{ padding: "4px 0" }}>
                            <RenderPagamento
                              chiPaga={chiPaga}
                              quanto={diff === 0 ? 0 : finale}
                              chiRiceve={chiRiceve}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              style={{
                ...diceBox,
                padding: isMobile ? "8px" : "15px",
                marginTop: "auto",
              }}
            >
              <div style={diceSubBox}>
                <span style={subLabelSmall}>DADI</span>
                <div
                  style={{
                    ...diceResult,
                    fontSize: isMobile ? "1.1rem" : "2.2rem",
                  }}
                >
                  🎲{dadiDisplay}
                </div>
              </div>
              <div style={diceSubBox}>
                <span style={subLabelSmall}>MURO DI</span>
                <div
                  style={{
                    ...muroResult,
                    fontSize: isMobile ? "0.7rem" : "1.1rem",
                    marginTop: isMobile ? "2px" : "5px",
                  }}
                >
                  {muroDisplay}
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            ...rightCol,
            flex: "1",
            padding: isMobile ? "10px" : "20px",
            minWidth: 0,
          }}
        >
          <h2
            style={{
              ...sectionTitle,
              fontSize: isMobile ? "0.55rem" : "0.75rem",
            }}
          >
            ANDAMENTO
          </h2>
          <div style={chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={storico}
                margin={{
                  right: isMobile ? 45 : 80,
                  left: 0,
                  top: 10,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="mano"
                  stroke="#94a3b8"
                  tick={{ fontSize: isMobile ? 9 : 12 }}
                  hide={isMobile && storico.length > 10}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: isMobile ? 9 : 12 }}
                  domain={["dataMin - 50", "dataMax + 50"]}
                  hide={isMobile}
                />
                {nomiGiocatori.map((nome, i) => (
                  <Line
                    key={nome}
                    name={nome}
                    type="monotone"
                    dataKey={nome}
                    stroke={colori[i % 4]}
                    strokeWidth={isMobile ? 2 : 4}
                    dot={!isMobile}
                    isAnimationActive={false}
                  >
                    <LabelList
                      content={(props) => {
                        const { x, y, index, stroke } = props;
                        if (index === storico.length - 1) {
                          return (
                            <text
                              x={x}
                              y={y}
                              dx={isMobile ? 6 : 15}
                              dy={5}
                              fill="#ffffff"
                              style={{
                                fontWeight: "bold",
                                fontSize: isMobile ? "9px" : "13px",
                                paintOrder: "stroke",
                                stroke: "#000000",
                                strokeWidth: "2.5px",
                              }}
                            >
                              {nome}
                            </text>
                          );
                        }
                        return null;
                      }}
                    />
                  </Line>
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const dashWrapper = {
  width: "100%",
  backgroundColor: "#022c22",
  color: "white",
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
};
const headerDash = {
  background: "rgba(0,0,0,0.3)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "1px solid rgba(251, 191, 36, 0.3)",
  flexShrink: 0,
};
const titleStyle = { margin: 0, fontWeight: "800" };
const liveBadge = {
  backgroundColor: "#ef4444",
  borderRadius: "50px",
  fontWeight: "bold",
  marginRight: "8px",
};
const titleArea = { display: "flex", alignItems: "center" };
const statsHeader = { display: "flex", alignItems: "center" };
const statBox = { textAlign: "right" };
const statLabel = { display: "block", fontSize: "0.55rem", opacity: 0.7 };
const statValue = { fontWeight: "bold" };
const btnFullscreen = {
  backgroundColor: "rgba(255,255,255,0.1)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.3)",
  borderRadius: "6px",
  cursor: "pointer",
};
const mainGrid = {
  display: "flex",
  flex: 1,
  overflow: "hidden",
  boxSizing: "border-box",
};
const leftCol = {
  display: "flex",
  flexDirection: "column",
  flexShrink: 0,
  height: "100%",
};
const rightCol = {
  background: "rgba(0,0,0,0.2)",
  borderRadius: "16px",
  display: "flex",
  flexDirection: "column",
  border: "1px solid rgba(255,255,255,0.05)",
  overflow: "hidden",
  height: "100%",
};
const sectionTitle = {
  color: "#fbbf24",
  textTransform: "uppercase",
  letterSpacing: "1.5px",
  margin: "0 0 4px 0",
};
const scoreList = { display: "flex", flexDirection: "column" };
const scoreCard = {
  background: "rgba(255,255,255,0.05)",
  borderRadius: "12px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};
const playerLabel = {
  fontWeight: "500",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
const ventoLabel = { color: "#fbbf24", opacity: 0.8 };
const scoreValue = { fontWeight: "bold", color: "#fbbf24" };
const diceBox = {
  background: "rgba(251, 191, 36, 0.1)",
  borderRadius: "12px",
  border: "1px solid rgba(251, 191, 36, 0.2)",
  display: "flex",
};
const diceSubBox = {
  flex: 1,
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};
const diceResult = { fontWeight: "bold", color: "#fbbf24" };
const muroResult = { fontWeight: "bold", color: "white" };
const subLabelSmall = {
  fontSize: "0.5rem",
  opacity: 0.6,
  textTransform: "uppercase",
};
const chartContainer = { flex: 1, width: "100%", minHeight: 0 };
const loadingStyle = {
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  color: "white",
  backgroundColor: "#022c22",
};

export default DashboardSpettatore;
