import React from "react";
import { db, ref, update } from "../firebaseConfig";

export default function Tavolo({
  datiPartita,
  currentPartitaId,
  mioNome,
  isRolling,
  isDraw,
  lanciaDadoSorteggio,
}) {
  const venti = datiPartita?.venti_assegnati || {};
  const lanci = datiPartita?.lanci_sorteggio || {};
  const posti = datiPartita?.posti || {};
  const punteggio = datiPartita?.punteggi_globali || {};
  const manoCorrente = datiPartita?.numero_mano || 1;

  const statoPartita = datiPartita?.stato || "attesa";

  const ioSonoSeduto = Object.values(posti).includes(mioNome);
  const mostraTastoAbbandona = ioSonoSeduto && statoPartita === "attesa";

  const prendiSedia = (id) => {
    if (ioSonoSeduto) return;
    if (posti[id]) return;
    update(ref(db, `partite/${currentPartitaId}/posti`), { [id]: mioNome });
  };

  const abbandonaPosto = () => {
    if (!window.confirm("Vuoi abbandonare il tavolo?")) return;
    const sediaId = Object.keys(posti).find((key) => posti[key] === mioNome);
    if (sediaId) {
      const updates = {};
      updates[`partite/${currentPartitaId}/posti/${sediaId}`] = "";
      if (lanci[mioNome]) {
        updates[`partite/${currentPartitaId}/lanci_sorteggio/${mioNome}`] =
          null;
      }
      update(ref(db), updates);
    }
  };

  return (
    <>
      {mostraTastoAbbandona && (
        <button
          onClick={abbandonaPosto}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            backgroundColor: "#b91c1c",
            color: "white",
            border: "1px solid white",
            padding: "5px 15px",
            borderRadius: "5px",
            fontSize: "0.9rem",
            fontWeight: "bold",
            cursor: "pointer",
            zIndex: 100,
          }}
        >
          🏃 ABBANDONA TAVOLO
        </button>
      )}

      {/* STRUTTURA DEL TAVOLO */}
      <div
        style={{
          border: "4px solid #059669",
          margin: "40px auto 60px auto", // Via di mezzo impostata a 40px
          width: "200px",
          height: "200px",
          position: "relative",
          borderRadius: "20px",
          backgroundColor: "#065f46",
          boxShadow: "inset 0 0 20px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Label Informativa Centrale - Pulita */}
        {statoPartita === "gioco" && (
          <div style={{ textAlign: "center", zIndex: 5 }}>
            <div
              style={{ color: "white", fontSize: "1.2rem", fontWeight: "900" }}
            >
              Mano <br /> {manoCorrente}
            </div>
          </div>
        )}

        {[1, 2, 3, 4].map((id) => {
          const sediaConfig = [
            { t: "-25px", l: "50%", x: "-50%" },
            { t: "80px", l: "215px", x: "-50%" },
            { t: "185px", l: "50%", x: "-50%" },
            { t: "80px", l: "-15px", x: "-50%" },
          ][id - 1];
          const occupante = posti[id];

          return (
            <div
              key={id}
              style={{
                position: "absolute",
                top: sediaConfig.t,
                left: sediaConfig.l,
                transform: `translateX(${sediaConfig.x})`,
                width: "130px",
                zIndex: 10,
              }}
            >
              <div
                style={{
                  padding: "8px",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  fontSize: "0.85rem",
                  backgroundColor: occupante
                    ? occupante === mioNome
                      ? "#10b981"
                      : "#3b82f6"
                    : "#ecfdf5",
                  color: occupante ? "white" : "#064e3b",
                  border: "2px solid rgba(0,0,0,0.1)",
                  cursor: occupante ? "default" : "pointer",
                  textAlign: "center",
                }}
                onClick={() => prendiSedia(id)}
              >
                {occupante || `Sedia ${id}`}

                {venti[occupante] && (
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "#fbbf24",
                      marginTop: "3px",
                      borderTop: "1px solid rgba(255,255,255,0.2)",
                    }}
                  >
                    {venti[occupante]}
                  </div>
                )}

                {(statoPartita === "attesa" || statoPartita === "sorteggio") &&
                  lanci[occupante] && (
                    <div style={{ fontSize: "1.1rem", marginTop: "2px" }}>
                      🎲 {lanci[occupante]}
                    </div>
                  )}

                {statoPartita === "gioco" &&
                  punteggio[occupante] !== undefined && (
                    <div style={{ fontSize: "1.1rem", marginTop: "2px" }}>
                      {punteggio[occupante]} pt
                    </div>
                  )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
