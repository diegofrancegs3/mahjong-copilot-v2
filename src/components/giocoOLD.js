import React, { useState, useEffect } from "react";
import { db, ref, update } from "../firebaseConfig";
import RiepilogoMano from "./RiepilogoMano";
// Importiamo il nuovo componente (assicurati di creare il file CalcolatoreStecca.js)
import CalcolatoreStecca from "./CalcolatoreStecca";

export default function Gioco({ datiPartita, currentPartitaId, mioNome }) {
  const [valoreInserito, setValoreInserito] = useState("");
  const [errore, setErrore] = useState("");

  // --- STATO PER SELETTORE VISIVO ---
  const [mostraSelettore, setMostraSelettore] = useState(false);

  // Reset dei campi quando si entra in fase inserimento
  useEffect(() => {
    if (datiPartita.fase_calcolo === "inserimento") {
      setValoreInserito("");
      setErrore("");
      setMostraSelettore(false);
    }
  }, [datiPartita.fase_calcolo]);

  // --- LOGICA IDENTIFICAZIONE EST ---
  const est = datiPartita.turni
    ? datiPartita.turni[0]
    : datiPartita.posti
    ? Object.values(datiPartita.posti)[0]
    : "Sconosciuto";
  const isEst = mioNome === est;

  // --- LOGICA LANCIO DADI ---
  const dadi = datiPartita.lancio_iniziale || {
    fase: 1,
    lancio1: null,
    lancio2: null,
    ultimoDado: null,
  };

  const tiraDadiIniziali = () => {
    const l1 =
      Math.floor(Math.random() * 6) + 1 + (Math.floor(Math.random() * 6) + 1);
    const l2 =
      Math.floor(Math.random() * 6) + 1 + (Math.floor(Math.random() * 6) + 1);
    update(ref(db, `partite/${currentPartitaId}/lancio_iniziale`), {
      lancio1: l1,
      lancio2: l2,
      fase: 2,
    });
  };

  const tiraUltimoDado = () => {
    const ultimo = Math.floor(Math.random() * 6) + 1;
    update(ref(db, `partite/${currentPartitaId}/lancio_iniziale`), {
      ultimoDado: ultimo,
      fase: 3,
    });
  };

  const confermaInizioGioco = () => {
    const nomiGiocatori = Object.values(datiPartita.posti);
    const updates = {};

    // 1. Cambiamo la fase in ogni caso
    updates[`partite/${currentPartitaId}/fase_calcolo`] = "gioco_attivo";

    // 2. INIZIALIZZAZIONE STORICO (Solo se non esiste già!)
    // Se lo storico esiste già, non dobbiamo toccarlo, altrimenti sovrascriviamo tutto.
    if (!datiPartita.storico) {
      const manoZero = { mano: 0 };
      nomiGiocatori.forEach((nome) => {
        manoZero[nome] = datiPartita.punteggi_globali?.[nome] || 2000;
      });
      updates[`partite/${currentPartitaId}/storico`] = [manoZero];
    }

    // 3. Inizializzazione punteggi globali (solo se non esistono)
    if (!datiPartita.punteggi_globali) {
      const punteggiIniziali = {};
      nomiGiocatori.forEach((nome) => (punteggiIniziali[nome] = 2000));
      updates[`partite/${currentPartitaId}/punteggi_globali`] =
        punteggiIniziali;
    }

    update(ref(db), updates);
  };

  const getMuro = (n) => {
    if (n === 1 || n === 5) return "EST";
    if (n === 2 || n === 6) return "SUD";
    if (n === 3) return "OVEST";
    if (n === 4) return "NORD";
    return "";
  };

  const mappaVenti = datiPartita?.venti_assegnati || {};
  const mioVento = mappaVenti[mioNome] || "Sconosciuto"; // Recupero il vento del giocatore attuale
  const nomeMuro = dadi.ultimoDado ? getMuro(dadi.ultimoDado) : null;

  const proprietarioMuro = nomeMuro
    ? Object.keys(mappaVenti).find((nome) => mappaVenti[nome] === nomeMuro)
    : null;

  // --- LOGICA GESTIONE PARTITA ---
  const dichiaraMahjong = () => {
    update(ref(db, `partite/${currentPartitaId}`), {
      fase_calcolo: "inserimento",
      vincitore_mahjong: mioNome,
      punti_dichiarati: {},
    });
  };

  const gestisciCambioPunti = (val) => {
    if (val === "" || /^\d+$/.test(val)) {
      setValoreInserito(val);
      if (errore) setErrore("");
    }
  };

  const dichiaraManoAMonte = () => {
    if (!window.confirm("Dichiari che la mano è finita a monte?")) return;
    const updates = {};
    updates[`partite/${currentPartitaId}/fase_calcolo`] = null;
    updates[`partite/${currentPartitaId}/vincitore_mahjong`] = null;
    updates[`partite/${currentPartitaId}/punti_dichiarati`] = null;
    updates[`partite/${currentPartitaId}/conferme_riepilogo`] = null;

    updates[`partite/${currentPartitaId}/lancio_iniziale`] = {
      fase: 1,
      lancio1: null,
      lancio2: null,
      ultimoDado: null,
    };
    const manoAttuale = datiPartita.numero_mano || 1;
    updates[`partite/${currentPartitaId}/numero_mano`] = manoAttuale + 1;
    update(ref(db), updates);
  };

  const inviaPunti = () => {
    const punti = parseInt(valoreInserito);
    if (isNaN(punti) || punti < 0)
      return setErrore("Inserisci un numero valido");
    if (punti % 2 !== 0) return setErrore("Il punteggio deve essere PARI");

    const limite = isEst ? 400 : 200;
    if (punti > limite) return setErrore(`Il limite per te è ${limite}`);

    update(ref(db, `partite/${currentPartitaId}/punti_dichiarati`), {
      [mioNome]: punti,
    });
  };

  const puntiDichiarati = datiPartita.punti_dichiarati || {};
  const tuttiHannoInserito = Object.keys(puntiDichiarati).length === 4;

  if (tuttiHannoInserito && datiPartita.fase_calcolo === "inserimento") {
    update(ref(db, `partite/${currentPartitaId}`), {
      fase_calcolo: "riepilogo",
    });
  }

  // --- RENDERING FASI ---

  if (datiPartita.fase_calcolo === "riepilogo") {
    return (
      <RiepilogoMano
        datiPartita={datiPartita}
        currentPartitaId={currentPartitaId}
        mioNome={mioNome}
      />
    );
  }

  if (!datiPartita.fase_calcolo) {
    return (
      <div style={cardStile}>
        <h2 style={{ color: "#fbbf24" }}>🎲 Apertura Muro 🎲</h2>
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            margin: "25px 0",
          }}
        >
          <div>
            <p style={{ fontSize: "0.75rem", opacity: 0.8 }}>SOMMA 4 DADI</p>
            <div style={{ fontSize: "2rem", fontWeight: "bold" }}>
              {dadi.lancio1 ? dadi.lancio1 + dadi.lancio2 : "--"}
            </div>
          </div>
          <div>
            <p style={{ fontSize: "0.75rem", opacity: 0.8 }}>MURO DI</p>
            <div
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#fbbf24" }}
            >
              {proprietarioMuro ? `${nomeMuro} (${proprietarioMuro})` : "--"}
            </div>
          </div>
        </div>
        {isEst ? (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {dadi.fase === 1 && (
              <button onClick={tiraDadiIniziali} style={btnGold}>
                TIRA 4 DADI
              </button>
            )}
            {dadi.fase === 2 && (
              <button onClick={tiraUltimoDado} style={btnGold}>
                TIRA DADO MURO
              </button>
            )}
            {dadi.fase === 3 && (
              <button onClick={confermaInizioGioco} style={btnGreen}>
                INIZIA PARTITA
              </button>
            )}
          </div>
        ) : (
          <p style={{ fontStyle: "italic", opacity: 0.8 }}>
            {dadi.fase === 3
              ? `Lancio completato. ${est} sta avviando...`
              : `In attesa di Est (${est})...`}
          </p>
        )}
      </div>
    );
  }

  if (datiPartita.fase_calcolo === "gioco_attivo") {
    return (
      <div
        style={{
          marginTop: "80px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "15px",
        }}
      >
        <div
          style={{ marginBottom: "10px", color: "#fbbf24", fontWeight: "bold" }}
        >
          MANO {datiPartita.numero_mano} - EST: {est}
        </div>
        <button onClick={dichiaraMahjong} style={btnGoldLarge}>
          🀄 DICHIARA MAHJONG
        </button>
        <button onClick={dichiaraManoAMonte} style={btnRed}>
          ✖ MANO A MONTE
        </button>
      </div>
    );
  }

  if (datiPartita.fase_calcolo === "inserimento") {
    const haGiaInviato = datiPartita.punti_dichiarati?.[mioNome] !== undefined;
    const chiHaChiuso = datiPartita.vincitore_mahjong;

    return (
      <div style={cardStile}>
        {/* MODAL POPUP PER CALCOLATORE STECCA */}
        {mostraSelettore && (
          <div style={modalOverlay}>
            <div style={modalContent}>
              <CalcolatoreStecca
                isEst={isEst}
                mioVento={mioVento}
                chiHaChiuso={chiHaChiuso === mioNome}
                onAnnulla={() => setMostraSelettore(false)}
                onConferma={(puntiCalcolati) => {
                  setValoreInserito(puntiCalcolati.toString());
                  setMostraSelettore(false);
                }}
              />
            </div>
          </div>
        )}

        <h3 style={{ color: "#fbbf24", marginBottom: "20px" }}>
          {chiHaChiuso === mioNome
            ? "HAI FATTO MAHJONG!"
            : `${chiHaChiuso} ha fatto Mahjong!`}
        </h3>

        {!haGiaInviato ? (
          <div
            style={{ maxWidth: "280px", margin: "0 auto", textAlign: "center" }}
          >
            <p
              style={{
                fontSize: "0.9rem",
                opacity: 0.8,
                marginBottom: "10px",
              }}
            >
              Inserisci i punti:
            </p>
            <input
              type="text"
              inputMode="numeric"
              value={valoreInserito}
              onChange={(e) => gestisciCambioPunti(e.target.value)}
              style={inputStyle(errore)}
            />
            <button
              onClick={() => setMostraSelettore(true)}
              style={{
                ...btnGold,
                width: "100%",
                marginBottom: "15px",
                fontSize: "0.8rem",
              }}
            >
              🀄 CALCOLA CON PEDINE
            </button>

            {errore && <p style={errorText}>⚠️ {errore}</p>}

            <button onClick={inviaPunti} style={btnGreen}>
              CONFERMA PUNTI
            </button>
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                color: "#fbbf24",
                fontWeight: "bold",
                fontSize: "1.2rem",
              }}
            >
              Registrati: {valoreInserito || "0"}
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "8px",
                marginTop: "15px",
              }}
            >
              {Object.values(datiPartita.posti).map((nome) => (
                <div
                  key={nome}
                  style={badgeStyle(
                    datiPartita.punti_dichiarati?.[nome] !== undefined
                  )}
                >
                  {nome}{" "}
                  {datiPartita.punti_dichiarati?.[nome] !== undefined
                    ? "✓"
                    : "..."}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
}

// STILI
const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0,0,0,0.85)",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  paddingTop: "20px",
  zIndex: 9999,
  overflowY: "auto",
};

const modalContent = {
  width: "90%",
  maxWidth: "400px",
  marginBottom: "40px",
};

const cardStile = {
  marginTop: "30px",
  padding: "20px",
  background: "rgba(0,0,0,0.3)",
  borderRadius: "15px",
  border: "2px solid #fbbf24",
  color: "white",
  textAlign: "center",
};
const btnGold = {
  padding: "12px",
  backgroundColor: "#fbbf24",
  color: "#064e3b",
  border: "none",
  borderRadius: "12px",
  fontWeight: "800",
  cursor: "pointer",
  boxShadow: "0 4px 0 #b45309",
};
const btnGoldLarge = { ...btnGold, padding: "15px 30px", fontSize: "1rem" };
const btnGreen = {
  padding: "14px",
  backgroundColor: "#10b981",
  color: "white",
  border: "none",
  borderRadius: "10px",
  fontWeight: "bold",
  cursor: "pointer",
  boxShadow: "0 4px 0 #059669",
  width: "100%",
};
const btnRed = {
  padding: "10px 20px",
  backgroundColor: "#ef4444",
  color: "white",
  border: "none",
  borderRadius: "12px",
  fontWeight: "800",
  cursor: "pointer",
  boxShadow: "0 4px 0 #7f1d1d",
};
const inputStyle = (err) => ({
  width: "100%",
  boxSizing: "border-box",
  padding: "15px",
  borderRadius: "10px",
  border: err ? "2px solid #ef4444" : "2px solid rgba(255,255,255,0.2)",
  backgroundColor: "white",
  color: "#1f2937",
  marginBottom: "15px",
  fontSize: "1.8rem",
  textAlign: "center",
  fontWeight: "bold",
});
const badgeStyle = (done) => ({
  fontSize: "0.7rem",
  padding: "6px 12px",
  borderRadius: "20px",
  background: done ? "#059669" : "#374151",
  color: "white",
  opacity: done ? 1 : 0.6,
});
const errorText = {
  color: "#fca5a5",
  fontSize: "0.8rem",
  fontWeight: "bold",
  marginBottom: "15px",
};
