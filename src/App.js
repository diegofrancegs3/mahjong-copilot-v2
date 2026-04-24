import React, { useState, useEffect } from "react";
import { db, ref, onValue, update } from "./firebaseConfig";
import { stileAnimazione } from "./styles";
import Lobby from "./components/Lobby";
import Tavolo from "./components/Tavolo";
import SorteggioVenti from "./components/SorteggioVenti";
import Gioco from "./components/Gioco";
import GraficoPartita from "./components/GraficoPartita";
import DashboardSpettatore from "./components/DashboardSpettatore"; // Import nuovo componente
import "./styles.css";

export default function App() {
  const [view, setView] = useState("lobby");
  const [partite, setPartite] = useState({});
  const [currentPartitaId, setCurrentPartitaId] = useState(null);
  const [datiPartita, setDatiPartita] = useState(null);
  const [mioNome, setMioNome] = useState(localStorage.getItem("mj_nome") || "");
  const [messaggioLobby, setMessaggioLobby] = useState("");
  const [mostraGrafico, setMostraGrafico] = useState(false);
  const [isSpettatore, setIsSpettatore] = useState(false); // Stato per modalità classifica

  useEffect(() => {
    onValue(ref(db, "partite"), (snapshot) => setPartite(snapshot.val() || {}));
  }, []);

  useEffect(() => {
    if (currentPartitaId) {
      const partitaRef = ref(db, `partite/${currentPartitaId}`);
      return onValue(partitaRef, (snapshot) => {
        const data = snapshot.val();
        if (!data && view !== "lobby") {
          setMessaggioLobby("Il tavolo è stato chiuso dal creatore.");
          setView("lobby");
          setCurrentPartitaId(null);
          setDatiPartita(null);
          setIsSpettatore(false);
          setTimeout(() => setMessaggioLobby(""), 5000);
        } else {
          setDatiPartita(data);
        }
      });
    }
  }, [currentPartitaId, view]);

  if (!mioNome && !isSpettatore)
    return (
      <div style={containerLogin}>
        <style>{stileAnimazione}</style>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const n = e.target.nome.value.trim();
            if (n.toLowerCase() === "classifica") {
              setIsSpettatore(true);
              setMioNome("Osservatore"); // Nome fittizio per superare il check
            } else {
              setMioNome(n);
              localStorage.setItem("mj_nome", n);
              setIsSpettatore(false);
            }
          }}
          style={cardLogin}
        >
          <h2>Circolo Grandi Possibilità</h2>
          <input
            name="nome"
            type="text"
            placeholder="Tuo Nome"
            required
            style={inputLogin}
          />
          <br />
          <button type="submit" style={btnEntra}>
            ENTRA
          </button>
        </form>
      </div>
    );

  return (
    <div style={mainContainer}>
      <style>{stileAnimazione}</style>

      {view === "lobby" && messaggioLobby && (
        <div style={alertBar}>{messaggioLobby}</div>
      )}

      {view === "lobby" ? (
        <Lobby
          mioNome={mioNome}
          setMioNome={setMioNome}
          partite={partite}
          setCurrentPartitaId={setCurrentPartitaId}
          setView={setView}
        />
      ) : (
        <div
          style={{ textAlign: "center", padding: "20px", position: "relative" }}
        >
          {/* TASTO ESCI IN LOBBY (Sinistra) */}
          <button
            onClick={() => {
              setView("lobby");
              setCurrentPartitaId(null);
              if (mioNome === "Osservatore") {
                setMioNome(""); // Reset se era lo spettatore
                setIsSpettatore(false);
              }
            }}
            style={btnEsciLobby}
          >
            ⬅ Esci {isSpettatore ? "e Cambia Login" : "in Lobby"}
          </button>

          {/* RENDERIZZAZIONE CONDIZIONALE: DASHBOARD O GIOCO STANDARD */}
          {isSpettatore ? (
            <div style={{ marginTop: "40px" }}>
              <DashboardSpettatore datiPartita={datiPartita} />
            </div>
          ) : (
            <>
              {/* TASTO ANDAMENTO PARTITA (Destra) - Solo per giocatori */}
              {datiPartita?.stato === "gioco" && (
                <button
                  onClick={() => setMostraGrafico(true)}
                  style={btnAndamentoGlobale}
                  disabled={!datiPartita.storico}
                >
                  📈 Andamento Partita
                </button>
              )}

              <h2 style={{ color: "#fbbf24", marginTop: "50px" }}>
                {datiPartita?.nome}
              </h2>

              <Tavolo
                datiPartita={datiPartita}
                currentPartitaId={currentPartitaId}
                mioNome={mioNome}
              />

              {datiPartita?.stato === "attesa" && (
                <div style={{ marginTop: "20px" }}>
                  <p style={{ opacity: 0.8, fontStyle: "italic" }}>
                    In attesa di 4 giocatori...
                  </p>
                  {Object.values(datiPartita.posti).filter((n) => n !== "")
                    .length === 4 &&
                    mioNome === datiPartita.creatore && (
                      <button
                        onClick={() =>
                          update(ref(db, `partite/${currentPartitaId}`), {
                            stato: "sorteggio",
                          })
                        }
                        style={btnConfermaPartecipanti}
                      >
                        🎲 CONFERMA PARTECIPANTI
                      </button>
                    )}
                </div>
              )}

              {datiPartita?.stato === "sorteggio" && (
                <SorteggioVenti
                  datiPartita={datiPartita}
                  currentPartitaId={currentPartitaId}
                  mioNome={mioNome}
                />
              )}

              {datiPartita?.stato === "gioco" && (
                <>
                  <Gioco
                    datiPartita={datiPartita}
                    currentPartitaId={currentPartitaId}
                    mioNome={mioNome}
                  />
                  {datiPartita.storico && (
                    <GraficoPartita
                      storico={datiPartita.storico}
                      isOpen={mostraGrafico}
                      onClose={() => setMostraGrafico(false)}
                    />
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// --- STILI (Invariati) ---
const mainContainer = {
  backgroundColor: "#064e3b",
  minHeight: "100vh",
  color: "white",
  fontFamily: "sans-serif",
};
const btnShared = {
  position: "fixed",
  top: "20px",
  zIndex: 1000,
  padding: "8px 16px",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontSize: "0.85rem",
  fontWeight: "bold",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  transition: "transform 0.1s",
};
const btnAndamentoGlobale = {
  ...btnShared,
  right: "20px",
  backgroundColor: "#3b82f6",
  boxShadow: "0 4px 0 #1d4ed8",
};
const btnEsciLobby = {
  ...btnShared,
  left: "20px",
  backgroundColor: "#4b5563",
  boxShadow: "0 4px 0 #1f2937",
};
const btnConfermaPartecipanti = {
  padding: "12px 25px",
  backgroundColor: "#f59e0b",
  border: "none",
  borderRadius: "10px",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  marginTop: "10px",
  boxShadow: "0 4px 0 #b45309",
};
const containerLogin = {
  backgroundColor: "#064e3b",
  minHeight: "100vh",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "sans-serif",
};
const cardLogin = {
  background: "rgba(255,255,255,0.1)",
  padding: "30px",
  borderRadius: "15px",
  textAlign: "center",
};
const inputLogin = {
  padding: "10px",
  borderRadius: "5px",
  marginBottom: "20px",
};
const btnEntra = {
  padding: "10px 20px",
  backgroundColor: "#fbbf24",
  border: "none",
  borderRadius: "5px",
  fontWeight: "bold",
};
const alertBar = {
  backgroundColor: "#ef4444",
  color: "white",
  padding: "12px",
  textAlign: "center",
  fontWeight: "bold",
  position: "fixed",
  top: 0,
  width: "100%",
  zIndex: 100,
};
