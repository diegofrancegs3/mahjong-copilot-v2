import React, { useState } from "react";
import { db, ref, update } from "../firebaseConfig";

export default function SorteggioVenti({
  datiPartita,
  currentPartitaId,
  mioNome,
}) {
  const [isRolling, setIsRolling] = useState(false);
  const [isDraw, setIsDraw] = useState(false);

  const lanci = datiPartita?.lanci_sorteggio || {};
  const inDisputa = datiPartita?.giocatori_in_disputa || [];
  const ventiAssegnati = datiPartita?.venti_assegnati || {};
  const giaLanciato = lanci[mioNome];

  const devoLanciare =
    inDisputa.length > 0 ? inDisputa.includes(mioNome) : true;
  const targetLanci = inDisputa.length > 0 ? inDisputa.length : 4;

  // MODIFICA: Ora controlla targetLanci invece del numero fisso 4
  const mostraForzaCalcolo =
    Object.keys(lanci).length === targetLanci &&
    Object.keys(ventiAssegnati).length === 0 &&
    !isDraw;

  const eseguiCalcoloVincitore = (lanciDaUsare) => {
    const punteggi = Object.values(lanciDaUsare);
    const maxPunti = Math.max(...punteggi);
    const vincitoriMax = Object.keys(lanciDaUsare).filter(
      (n) => lanciDaUsare[n] === maxPunti
    );

    if (vincitoriMax.length > 1) {
      setIsDraw(true);
      setTimeout(() => {
        update(ref(db, `partite/${currentPartitaId}`), {
          lanci_sorteggio: {},
          giocatori_in_disputa: vincitoriMax,
        });
        setIsDraw(false);
      }, 2500);
    } else {
      const ventiNomi = ["EST", "SUD", "OVEST", "NORD"];
      const sediaVincitore = parseInt(
        Object.keys(datiPartita.posti).find(
          (s) => datiPartita.posti[s] === vincitoriMax[0]
        )
      );

      const mappaVenti = {};
      const ordineTurni = [];

      for (let i = 0; i < 4; i++) {
        let sediaAttuale = ((sediaVincitore - 1 + i) % 4) + 1;
        const nomeGiocatore = datiPartita.posti[sediaAttuale];
        mappaVenti[nomeGiocatore] = ventiNomi[i];
        ordineTurni.push(nomeGiocatore);
      }

      update(ref(db, `partite/${currentPartitaId}`), {
        venti_assegnati: mappaVenti,
        turni: ordineTurni,
        giocatori_in_disputa: [],
        lanci_sorteggio: {},
      });
    }
  };

  const lanciaDadoSorteggio = () => {
    if (isRolling || giaLanciato || isDraw) return;
    setIsRolling(true);

    setTimeout(() => {
      const risultato = Math.floor(Math.random() * 6) + 1;

      update(ref(db, `partite/${currentPartitaId}/lanci_sorteggio`), {
        [mioNome]: risultato,
      }).then(() => {
        const lanciAggiornati = { ...lanci, [mioNome]: risultato };
        if (Object.keys(lanciAggiornati).length === targetLanci) {
          setTimeout(() => eseguiCalcoloVincitore(lanciAggiornati), 1500);
        }
      });
      setIsRolling(false);
    }, 1000);
  };

  const gestisciInizioPartita = () => {
    const nomiGiocatori = Object.values(datiPartita.posti);
    const punteggiIniziali = {};
    nomiGiocatori.forEach((nome) => {
      punteggiIniziali[nome] = 2000;
    });

    update(ref(db, `partite/${currentPartitaId}`), {
      stato: "gioco",
      punteggi_globali: punteggiIniziali,
      numero_mano: 1,
      fase_calcolo: null,
      lancio_iniziale: {
        fase: 1,
        lancio1: null,
        lancio2: null,
        ultimoDado: null,
      },
      vincitore_mahjong: null,
      punti_dichiarati: null,
      conferme_riepilogo: null,
    });
  };

  if (Object.keys(ventiAssegnati).length === 4 && datiPartita.turni) {
    return (
      <div
        style={{
          marginTop: "20px",
          background: "rgba(255,255,255,0.1)",
          padding: "20px",
          borderRadius: "15px",
          textAlign: "center",
          border: "1px solid #fbbf24",
        }}
      >
        <h3 style={{ color: "#fbbf24" }}>Sorteggio Completato!</h3>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          {datiPartita.turni.map((nome) => (
            <div
              key={nome}
              style={{
                background:
                  ventiAssegnati[nome] === "EST"
                    ? "#fbbf24"
                    : "rgba(255,255,255,0.1)",
                color: ventiAssegnati[nome] === "EST" ? "#064e3b" : "white",
                padding: "10px",
                borderRadius: "8px",
                minWidth: "80px",
              }}
            >
              <div style={{ fontSize: "0.7rem", fontWeight: "bold" }}>
                {ventiAssegnati[nome]}
              </div>
              <div style={{ fontSize: "0.9rem" }}>{nome}</div>
            </div>
          ))}
        </div>
        {ventiAssegnati[mioNome] === "EST" ? (
          <button
            onClick={gestisciInizioPartita}
            style={{
              padding: "12px 25px",
              backgroundColor: "#10b981",
              border: "none",
              borderRadius: "12px",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 4px 0 #059669",
            }}
          >
            INIZIA LA PARTITA (Sei Est)
          </button>
        ) : (
          <p style={{ fontStyle: "italic", opacity: 0.8 }}>
            Aspetta che{" "}
            {Object.keys(ventiAssegnati).find(
              (n) => ventiAssegnati[n] === "EST"
            )}{" "}
            (EST) inizi la partita...
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: "20px",
        background: "rgba(255,255,255,0.1)",
        padding: "20px",
        borderRadius: "15px",
        textAlign: "center",
      }}
    >
      <h3 style={{ color: "#fbbf24" }}>🎲 Sorteggio Vento</h3>

      {mostraForzaCalcolo ? (
        <div style={{ marginBottom: "20px" }}>
          <button
            onClick={() => eseguiCalcoloVincitore(lanci)}
            style={{
              padding: "10px 20px",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            🎲 Verifica punteggio dadi 🎲
          </button>
        </div>
      ) : (
        <p style={{ fontSize: "0.8rem", marginBottom: "15px", opacity: 0.8 }}>
          Chi lancia il numero più alto sarà EST
        </p>
      )}

      {isDraw ? (
        <p style={{ color: "#fbbf24", fontWeight: "bold" }}>
          PAREGGIO! Rilancio tra chi aveva pareggiato...
        </p>
      ) : (
        <>
          {devoLanciare ? (
            !giaLanciato ? (
              <button
                onClick={lanciaDadoSorteggio}
                disabled={isRolling}
                style={{
                  padding: "12px 25px",
                  backgroundColor: "#fbbf24",
                  color: "#064e3b",
                  border: "none",
                  borderRadius: "12px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  boxShadow: "0 4px 0 #b45309",
                }}
              >
                {isRolling ? "Lancio..." : "LANCIA IL DADO"}
              </button>
            ) : (
              <div style={{ fontSize: "1.2rem" }}>
                Hai tirato un{" "}
                <strong style={{ color: "#fbbf24" }}>{giaLanciato}</strong>. In
                attesa...
              </div>
            )
          ) : (
            <p style={{ fontStyle: "italic", opacity: 0.7 }}>
              Pareggio tra altri giocatori. Attendi lo spareggio...
            </p>
          )}
        </>
      )}

      {Object.keys(lanci).length > 0 && (
        <div
          style={{
            marginTop: "20px",
            display: "flex",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          {Object.entries(lanci).map(([nome, valore]) => (
            <div key={nome} style={{ fontSize: "0.8rem", opacity: 0.8 }}>
              {nome}: {valore}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
