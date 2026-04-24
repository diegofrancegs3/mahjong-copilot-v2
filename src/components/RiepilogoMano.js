import React from "react";
import { db, ref, update } from "../firebaseConfig";
import { eseguiChiusuraMano } from "./LogicaFineMano";

export default function RiepilogoMano({
  datiPartita,
  currentPartitaId,
  mioNome,
}) {
  const {
    punti_dichiarati,
    vincitore_mahjong,
    posti,
    venti_assegnati,
    conferme_riepilogo = {},
    turni = [],
    numero_mano = 1,
  } = datiPartita;

  const stecche = punti_dichiarati || {};
  const nomiGiocatori = Object.values(posti);
  const perdenti = nomiGiocatori.filter((n) => n !== vincitore_mahjong);

  // --- IDENTIFICAZIONE EST PER IL TASTO DI PROCEDURA ---
  const estAttuale = turni[0];
  const isEst = mioNome === estAttuale;
  const numeroConferme = Object.keys(conferme_riepilogo).length;

  // --- LOGICA DI CHIUSURA DEFINITIVA ---
  const procediAllaNuovaMano = async () => {
    if (numeroConferme < 4) return;

    // 1. Logica Rotazione Venti
    let nuoviTurni = [...turni];
    if (vincitore_mahjong !== turni[0]) {
      const exEst = nuoviTurni.shift();
      nuoviTurni.push(exEst);
    }

    const ventiNomi = ["EST", "SUD", "OVEST", "NORD"];
    const nuoviVentiAssegnati = {};
    nuoviTurni.forEach((nome, i) => {
      nuoviVentiAssegnati[nome] = ventiNomi[i];
    });

    // 2. Eseguiamo il calcolo dei saldi storici
    await eseguiChiusuraMano(currentPartitaId, datiPartita);

    // 3. Reset del database per la nuova mano
    const updates = {};
    updates[`partite/${currentPartitaId}/fase_calcolo`] = null;
    updates[`partite/${currentPartitaId}/vincitore_mahjong`] = null;
    updates[`partite/${currentPartitaId}/punti_dichiarati`] = null;
    updates[`partite/${currentPartitaId}/conferme_riepilogo`] = null;
    updates[`partite/${currentPartitaId}/numero_mano`] = numero_mano + 1;
    updates[`partite/${currentPartitaId}/turni`] = nuoviTurni;
    updates[`partite/${currentPartitaId}/venti_assegnati`] =
      nuoviVentiAssegnati;
    updates[`partite/${currentPartitaId}/lancio_iniziale`] = {
      fase: 1,
      lancio1: null,
      lancio2: null,
      ultimoDado: null,
    };

    update(ref(db), updates);
  };

  const calcolaPagamento = (valoreBase, p1, p2) => {
    const v1 = (venti_assegnati[p1] || "").toLowerCase();
    const v2 = (venti_assegnati[p2] || "").toLowerCase();
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

  const gestisciConferma = (azione) => {
    if (azione === "annulla") {
      update(ref(db, `partite/${currentPartitaId}`), {
        fase_calcolo: "inserimento",
        conferme_riepilogo: null,
        punti_dichiarati: null,
      });
    } else {
      update(ref(db, `partite/${currentPartitaId}/conferme_riepilogo`), {
        [mioNome]: true,
      });
    }
  };

  const RenderPagamento = ({ chiPaga, quanto, chiRiceve }) => {
    if (quanto === 0)
      return <div style={{ textAlign: "center", opacity: 0.8 }}>Pareggio</div>;
    return (
      <div style={{ textAlign: "center", lineHeight: "1.1" }}>
        <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>
          {chiPaga} paga{" "}
        </span>
        <strong style={{ color: "#34d399", fontSize: "1rem" }}>
          {quanto}{" "}
        </strong>
        <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>a {chiRiceve}</span>
      </div>
    );
  };

  const CellaGiocatore = ({ nome }) => (
    <div style={{ lineHeight: "1.2" }}>
      <span style={{ fontWeight: "bold" }}>{nome}</span>{" "}
      <small style={{ opacity: 0.7 }}>({venti_assegnati[nome]})</small>
      <br />
      <small style={{ opacity: 0.5 }}>{stecche[nome]} pt</small>
    </div>
  );

  return (
    <div
      style={{
        marginTop: "15px",
        padding: "12px",
        background: "rgba(0,0,0,0.5)",
        borderRadius: "12px",
        border: "1px solid #fbbf24",
      }}
    >
      <h3
        style={{
          color: "#fbbf24",
          marginBottom: "12px",
          textAlign: "center",
          fontSize: "1.1rem",
        }}
      >
        Riepilogo Pagamenti
      </h3>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.8rem",
          color: "white",
        }}
      >
        <thead>
          <tr style={{ borderBottom: "2px solid #fbbf24", opacity: 0.8 }}>
            <th style={{ textAlign: "center", padding: "4px 8px" }}>Da</th>
            <th style={{ textAlign: "center", padding: "4px 8px" }}>A</th>
            <th style={{ textAlign: "center", padding: "4px 8px" }}>Totale</th>
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
                  backgroundColor: "rgba(16, 185, 129, 0.1)",
                }}
              >
                <td style={{ padding: "8px" }}>
                  <CellaGiocatore nome={p} />
                </td>
                <td style={{ padding: "8px" }}>
                  <CellaGiocatore nome={vincitore_mahjong} />
                </td>
                <td style={{ padding: "8px" }}>
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
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <td style={{ padding: "8px" }}>
                    <CellaGiocatore nome={p1} />
                  </td>
                  <td style={{ padding: "8px" }}>
                    <CellaGiocatore nome={p2} />
                  </td>
                  <td style={{ padding: "8px" }}>
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

      {/* TASTI AZIONE */}
      <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
        <button
          onClick={() => gestisciConferma("conferma")}
          disabled={conferme_riepilogo[mioNome]}
          style={{
            flex: 1,
            padding: "12px",
            backgroundColor: conferme_riepilogo[mioNome]
              ? "#059669"
              : "#10b981",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            boxShadow: "0 4px 0 #065f46",
          }}
        >
          {conferme_riepilogo[mioNome] ? "CONFERMATO ✓" : "CONFERMA"}
        </button>

        <button
          onClick={() => gestisciConferma("annulla")}
          style={{
            flex: 1,
            padding: "12px",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            boxShadow: "0 4px 0 #991b1b",
          }}
        >
          ANNULLA
        </button>
      </div>

      {/* TASTO FORZATO PER EST (Attivo solo con 4 conferme) */}
      {isEst && (
        <button
          onClick={procediAllaNuovaMano}
          disabled={numeroConferme < 4}
          style={{
            width: "100%",
            marginTop: "15px",
            padding: "15px",
            backgroundColor: numeroConferme < 4 ? "#374151" : "#fbbf24",
            color: numeroConferme < 4 ? "#9ca3af" : "#064e3b",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            boxShadow: numeroConferme < 4 ? "none" : "0 4px 0 #b45309",
            cursor: numeroConferme < 4 ? "not-allowed" : "pointer",
          }}
        >
          {numeroConferme < 4
            ? `IN ATTESA DI CONFERME (${numeroConferme}/4)`
            : "VAI ALLA PROSSIMA MANO ➔"}
        </button>
      )}

      {/* LISTA BADGE CONFERME */}
      <div
        style={{
          marginTop: "20px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        {nomiGiocatori.map((nome) => (
          <div
            key={nome}
            style={{
              fontSize: "0.7rem",
              padding: "6px 12px",
              borderRadius: "20px",
              color: "white",
              background: conferme_riepilogo[nome] ? "#059669" : "#374151",
              border:
                nome === vincitore_mahjong
                  ? "1px solid #fbbf24"
                  : "1px solid transparent",
              opacity: conferme_riepilogo[nome] ? 1 : 0.6,
            }}
          >
            {nome} {conferme_riepilogo[nome] ? "✓" : "..."}
          </div>
        ))}
      </div>
    </div>
  );
}
