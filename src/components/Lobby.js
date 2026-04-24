import React from "react";
import { db, ref, push, set } from "../firebaseConfig";

export default function Lobby({
  mioNome,
  setMioNome,
  partite,
  setCurrentPartitaId,
  setView,
}) {
  const cambiaNome = () => {
    if (window.confirm("Vuoi cambiare il tuo nome utente?")) {
      setMioNome("");
      localStorage.removeItem("mj_nome");
    }
  };

  const creaTavolo = () => {
    const nomeStanza = prompt("Nome della stanza:");
    if (!nomeStanza) return;
    const nuovaPartitaRef = push(ref(db, "partite"));
    const id = nuovaPartitaRef.key;
    set(nuovaPartitaRef, {
      id,
      nome: nomeStanza,
      creatore: mioNome,
      stato: "attesa",
      posti: { 1: "", 2: "", 3: "", 4: "" },
      lanci_sorteggio: {},
      venti_assegnati: {},
      giocatori_in_disputa: [],
    }).then(() => {
      setCurrentPartitaId(id);
      setView("partita");
    });
  };

  const eliminaTavolo = (id) => {
    if (
      window.confirm(
        "Sei il creatore. Vuoi eliminare definitivamente questo tavolo?"
      )
    ) {
      set(ref(db, `partite/${id}`), null);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Grandi Possibilità</h1>

      <h3 style={{ fontWeight: "normal", opacity: 0.9, marginBottom: "30px" }}>
        Ciao,{" "}
        <span
          onClick={cambiaNome}
          style={{
            fontWeight: "bold",
            color: "#fbbf24",
            cursor: "pointer",
            textDecoration: "underline rgba(251, 191, 36, 0.3)",
          }}
          title="Clicca per cambiare nome"
        >
          {mioNome}
        </span>
      </h3>

      {/* Nascondi tasto creazione se si è osservatori */}
      {mioNome !== "Osservatore" && (
        <button
          onClick={creaTavolo}
          style={{
            padding: "15px 25px",
            backgroundColor: "#fbbf24",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          ➕ NUOVO TAVOLO
        </button>
      )}

      <div style={{ maxWidth: "600px", margin: "40px auto" }}>
        {Object.values(partite).map((p) => {
          const occupati = Object.values(p.posti || {}).filter(
            (n) => n !== ""
          ).length;
          const ioSonoSedutoQui = Object.values(p.posti || {}).includes(
            mioNome
          );
          const ioSonoCreatore = p.creatore === mioNome;

          // LOGICA SPECIALE OSSERVATORE
          const isOsservatore = mioNome === "Osservatore";
          const puoEntrare = occupati < 4 || ioSonoSedutoQui || isOsservatore;

          return (
            <div
              key={p.id}
              style={{
                background: "rgba(255,255,255,0.1)",
                padding: "15px 20px",
                borderRadius: "12px",
                marginBottom: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div style={{ textAlign: "left" }}>
                <div
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                    color: "#fbbf24",
                  }}
                >
                  {p.nome}
                </div>
                <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                  Creatore: {p.creatore} • {occupati}/4 Giocatori
                </div>
              </div>

              <div
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                {ioSonoCreatore && (
                  <button
                    onClick={() => eliminaTavolo(p.id)}
                    style={{
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px 12px",
                      cursor: "pointer",
                      fontSize: "1.2rem",
                    }}
                    title="Elimina Tavolo"
                  >
                    🗑️
                  </button>
                )}

                <button
                  onClick={() => {
                    if (puoEntrare) {
                      setCurrentPartitaId(p.id);
                      setView("partita");
                    }
                  }}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: puoEntrare
                      ? isOsservatore
                        ? "#3b82f6"
                        : "#059669"
                      : "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    cursor: puoEntrare ? "pointer" : "default",
                  }}
                >
                  {isOsservatore
                    ? "Guarda 👁️"
                    : occupati >= 4 && !ioSonoSedutoQui
                    ? "Pieno"
                    : "Entra"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
