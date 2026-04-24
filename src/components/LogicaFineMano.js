import { db, ref, update } from "../firebaseConfig";

export const eseguiChiusuraMano = async (currentPartitaId, datiPartita) => {
  const {
    punti_dichiarati = {},
    vincitore_mahjong,
    venti_assegnati = {},
    punteggi_globali = {},
    posti,
    storico = [],
  } = datiPartita;

  const nomiGiocatori = Object.values(posti);
  const nuoviSaldiMano = {};

  nomiGiocatori.forEach((nome) => {
    nuoviSaldiMano[nome] = 0;
  });

  // --- 1. LOGICA DI CALCOLO PAGAMENTI ---
  const calcolaPagamentoLocale = (valoreBase, p1, p2) => {
    const v1 = (venti_assegnati[p1] || "").toUpperCase();
    const v2 = (venti_assegnati[p2] || "").toUpperCase();
    const coinvolgeEst = v1 === "EST" || v2 === "EST";

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

  const perdenti = nomiGiocatori.filter((n) => n !== vincitore_mahjong);

  perdenti.forEach((p) => {
    const quanto = calcolaPagamentoLocale(
      punti_dichiarati[vincitore_mahjong] || 0,
      p,
      vincitore_mahjong
    );
    nuoviSaldiMano[p] -= quanto;
    nuoviSaldiMano[vincitore_mahjong] += quanto;
  });

  for (let i = 0; i < perdenti.length; i++) {
    for (let j = i + 1; j < perdenti.length; j++) {
      const p1 = perdenti[i];
      const p2 = perdenti[j];
      const diff = (punti_dichiarati[p1] || 0) - (punti_dichiarati[p2] || 0);

      if (diff !== 0) {
        const quanto = calcolaPagamentoLocale(Math.abs(diff), p1, p2);
        if (diff > 0) {
          nuoviSaldiMano[p2] -= quanto;
          nuoviSaldiMano[p1] += quanto;
        } else {
          nuoviSaldiMano[p1] -= quanto;
          nuoviSaldiMano[p2] += quanto;
        }
      }
    }
  }

  // --- 2. AGGIORNAMENTO PUNTEGGI GLOBALI ---
  const nuoviPunteggiGlobali = { ...punteggi_globali };
  nomiGiocatori.forEach((nome) => {
    nuoviPunteggiGlobali[nome] =
      (nuoviPunteggiGlobali[nome] || 0) + nuoviSaldiMano[nome];
  });

  // --- 3. AGGIORNAMENTO STORICO ---
  // IMPORTANTE: Creiamo il nuovo punto usando la lunghezza attuale dello storico
  const nuovaManoStorico = {
    mano: storico.length,
    ...nuoviPunteggiGlobali,
  };

  // Creiamo il nuovo array mantenendo TUTTI gli elementi precedenti
  const nuovoStorico = [...storico, nuovaManoStorico];

  // --- 4. SALVATAGGIO ---
  const updates = {};
  updates[`partite/${currentPartitaId}/punteggi_globali`] =
    nuoviPunteggiGlobali;
  updates[`partite/${currentPartitaId}/storico`] = nuovoStorico;

  // Usiamo await per assicurarci che l'operazione termini prima di procedere in RiepilogoMano
  return await update(ref(db), updates);
};
