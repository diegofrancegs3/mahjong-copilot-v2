import React, { useState, useEffect } from "react";

export default function CalcolatoreStecca({
  onConferma,
  onAnnulla,
  isEst,
  mioVento,
  chiHaChiuso,
}) {
  const [stecca, setStecca] = useState([]);
  const [azioneSelezionata, setAzioneSelezionata] = useState("Tris");
  const [isMahjong, setIsMahjong] = useState(chiHaChiuso || false);

  useEffect(() => {
    setIsMahjong(chiHaChiuso);
  }, [chiHaChiuso]);

  const tiles = {
    Venti: ["\u{1F000}", "\u{1F001}", "\u{1F002}", "\u{1F003}"],
    Draghi: ["\u{1F004}", "\u{1F005}", "\u{1F006}"],
    Caratteri: [
      "\u{1F007}",
      "\u{1F008}",
      "\u{1F009}",
      "\u{1F00A}",
      "\u{1F00B}",
      "\u{1F00C}",
      "\u{1F00D}",
      "\u{1F00E}",
      "\u{1F00F}",
    ],
    Canne: [
      "\u{1F010}",
      "\u{1F011}",
      "\u{1F012}",
      "\u{1F013}",
      "\u{1F014}",
      "\u{1F015}",
      "\u{1F016}",
      "\u{1F017}",
      "\u{1F018}",
    ],
    Palle: [
      "\u{1F019}",
      "\u{1F01A}",
      "\u{1F01B}",
      "\u{1F01C}",
      "\u{1F01D}",
      "\u{1F01E}",
      "\u{1F01F}",
      "\u{1F020}",
      "\u{1F021}",
    ],
    Fiori: ["\u{1F022}", "\u{1F023}", "\u{1F024}", "\u{1F025}"],
    Stagioni: ["\u{1F026}", "\u{1F027}", "\u{1F028}", "\u{1F029}"],
  };

  const mappaVentiIndice = { EST: 0, SUD: 1, OVEST: 2, NORD: 3 };
  const tileVentoMio = tiles.Venti[mappaVentiIndice[mioVento]];

  const conteggioTessere = {};
  let tessereTotaliStandard = 0;
  let numeroPoker = 0;

  stecca.forEach((el) => {
    el.simboli.forEach((s) => {
      conteggioTessere[s] = (conteggioTessere[s] || 0) + 1;
    });
    if (![...tiles.Fiori, ...tiles.Stagioni].includes(el.simboli[0])) {
      tessereTotaliStandard += el.simboli.length;
      if (el.tipo === "Poker") numeroPoker++;
    }
  });

  const limiteCorrente = 14 + numeroPoker;
  const isFioreOStagione = (tile) =>
    [...tiles.Fiori, ...tiles.Stagioni].includes(tile);

  const canAddMore = (tile, tipo) => {
    const isSpecial = isFioreOStagione(tile);
    if (isSpecial) return (conteggioTessere[tile] || 0) < 1;
    let tessereDaAggiungere = 0;
    if (tipo === "Coppia") tessereDaAggiungere = 2;
    else if (tipo === "Tris") tessereDaAggiungere = 3;
    else if (tipo === "Poker") tessereDaAggiungere = 4;
    else if (tipo === "Scala") tessereDaAggiungere = 3;
    if (tipo === "Scala") {
      const code = tile.codePointAt(0);
      const s1 = tile,
        s2 = String.fromCodePoint(code + 1),
        s3 = String.fromCodePoint(code + 2);
      if (
        (conteggioTessere[s1] || 0) + 1 > 4 ||
        (conteggioTessere[s2] || 0) + 1 > 4 ||
        (conteggioTessere[s3] || 0) + 1 > 4
      )
        return false;
    } else {
      if ((conteggioTessere[tile] || 0) + tessereDaAggiungere > 4) return false;
    }
    const limiteEspanso =
      tipo === "Poker" ? limiteCorrente + 1 : limiteCorrente;
    if (tessereTotaliStandard + tessereDaAggiungere > limiteEspanso)
      return false;
    return true;
  };

  const canStartScala = (tile) => {
    const isSemeValido = [
      ...tiles.Caratteri,
      ...tiles.Canne,
      ...tiles.Palle,
    ].includes(tile);
    if (!isSemeValido) return false;
    let indexInSeme = -1;
    if (tiles.Caratteri.includes(tile))
      indexInSeme = tiles.Caratteri.indexOf(tile);
    else if (tiles.Canne.includes(tile))
      indexInSeme = tiles.Canne.indexOf(tile);
    else if (tiles.Palle.includes(tile))
      indexInSeme = tiles.Palle.indexOf(tile);
    return indexInSeme >= 0 && indexInSeme <= 6;
  };

  const calcolaPuntiBaseElemento = (tile, tipo) => {
    const isTesta = [
      "\u{1F000}",
      "\u{1F001}",
      "\u{1F002}",
      "\u{1F003}",
      "\u{1F004}",
      "\u{1F005}",
      "\u{1F006}",
      "\u{1F007}",
      "\u{1F00F}",
      "\u{1F010}",
      "\u{1F018}",
      "\u{1F019}",
      "\u{1F021}",
    ].includes(tile);
    if (tipo === "Singolo" || tipo === "Onore") return 4;
    if (tipo === "Coppia")
      return tiles.Draghi.includes(tile) || tile === tileVentoMio ? 2 : 0;
    if (tipo === "Tris") return isTesta ? 4 : 2;
    if (tipo === "Poker") return isTesta ? 16 : 8;
    return 0;
  };

  const aggiungiAllaStecca = (tile) => {
    const isSpecial = isFioreOStagione(tile);
    if (isSpecial) {
      if (!canAddMore(tile, "Onore")) return;
      setStecca([
        ...stecca,
        {
          simboli: [tile],
          tipo: "Onore",
          punti: 4,
          raddoppia: false,
          fattoInCasa: false,
        },
      ]);
      return;
    }
    if (!canAddMore(tile, azioneSelezionata)) return;
    if (azioneSelezionata === "Scala" && !canStartScala(tile)) return;
    let nuovo = {
      simboli: [],
      tipo: azioneSelezionata,
      punti: 0,
      raddoppia: false,
      fattoInCasa: false,
    };
    if (azioneSelezionata === "Coppia") {
      nuovo.simboli = [tile, tile];
      nuovo.punti = calcolaPuntiBaseElemento(tile, "Coppia");
    } else if (azioneSelezionata === "Tris") {
      nuovo.simboli = [tile, tile, tile];
      nuovo.punti = calcolaPuntiBaseElemento(tile, "Tris");
      if (tiles.Draghi.includes(tile) || tile === tileVentoMio)
        nuovo.raddoppia = true;
    } else if (azioneSelezionata === "Poker") {
      nuovo.simboli = [tile, tile, tile, tile];
      nuovo.punti = calcolaPuntiBaseElemento(tile, "Poker");
      if (tiles.Draghi.includes(tile) || tile === tileVentoMio)
        nuovo.raddoppia = true;
    } else if (azioneSelezionata === "Scala") {
      const code = tile.codePointAt(0);
      nuovo.simboli = [
        tile,
        String.fromCodePoint(code + 1),
        String.fromCodePoint(code + 2),
      ];
      nuovo.punti = 0;
    }
    setStecca([...stecca, nuovo]);
  };

  const rimuoviElemento = (index) => {
    const nuovaStecca = [...stecca];
    nuovaStecca.splice(index, 1);
    setStecca(nuovaStecca);
  };

  const toggleCasa = (index) => {
    const nuovaStecca = [...stecca];
    const el = nuovaStecca[index];
    if (el.tipo === "Tris" || el.tipo === "Poker") {
      el.fattoInCasa = !el.fattoInCasa;
      el.punti = el.fattoInCasa ? el.punti * 2 : el.punti / 2;
      setStecca(nuovaStecca);
    }
  };

  const numCoppie = stecca.filter((el) => el.tipo === "Coppia").length;
  const numCombos = stecca.filter((el) =>
    ["Tris", "Poker", "Scala"].includes(el.tipo)
  ).length;
  const isChiusuraValida =
    (numCoppie === 1 && numCombos === 4) || numCoppie === 7;

  const elencoRaddoppiDesc = [];
  let raddoppiTotali = 0;

  stecca.forEach((el) => {
    if (el.raddoppia) {
      elencoRaddoppiDesc.push(
        tiles.Draghi.includes(el.simboli[0])
          ? "x2 Tris/Poker di Draghi"
          : "x2 Tris/Poker proprio Vento"
      );
      raddoppiTotali++;
    }
    if (el.tipo === "Onore") {
      const isFiore = tiles.Fiori.includes(el.simboli[0]);
      const idx = isFiore
        ? tiles.Fiori.indexOf(el.simboli[0])
        : tiles.Stagioni.indexOf(el.simboli[0]);
      if (mappaVentiIndice[mioVento] === idx) {
        elencoRaddoppiDesc.push(
          isFiore ? "x2 proprio Fiore" : "x2 propria Stagione"
        );
        raddoppiTotali++;
      }
    }
  });

  const fioriPosseduti = stecca.filter(
    (el) => el.tipo === "Onore" && tiles.Fiori.includes(el.simboli[0])
  ).length;
  const stagioniPossedute = stecca.filter(
    (el) => el.tipo === "Onore" && tiles.Stagioni.includes(el.simboli[0])
  ).length;
  if (fioriPosseduti === 4) {
    elencoRaddoppiDesc.push("x2 Rosa dei Fiori");
    raddoppiTotali++;
  }
  if (stagioniPossedute === 4) {
    elencoRaddoppiDesc.push("x2 Rosa delle Stagioni");
    raddoppiTotali++;
  }

  const semiPresenti = new Set();
  let haSoloOnoriValidi = true;
  let haAlmenoUnOnore = false;

  stecca
    .filter((el) => el.tipo !== "Onore")
    .forEach((el) => {
      const t = el.simboli[0];
      if (tiles.Caratteri.includes(t)) semiPresenti.add("Car");
      else if (tiles.Canne.includes(t)) semiPresenti.add("Can");
      else if (tiles.Palle.includes(t)) semiPresenti.add("Pal");
      else if (tiles.Venti.includes(t) || tiles.Draghi.includes(t)) {
        haAlmenoUnOnore = true;
        const isValido = tiles.Draghi.includes(t) || t === tileVentoMio;
        if (!isValido) haSoloOnoriValidi = false;
      }
    });

  if (isMahjong && isChiusuraValida) {
    if (!stecca.some((el) => el.tipo === "Scala")) {
      elencoRaddoppiDesc.push("x2 MahJong con tutti tris/poker");
      raddoppiTotali++;
    }
    if (semiPresenti.size === 1 && haAlmenoUnOnore && haSoloOnoriValidi) {
      elencoRaddoppiDesc.push(
        "x2 MahJong con un solo seme e draghi o proprio vento"
      );
      raddoppiTotali++;
    }
  }

  // --- LOGICA PUNTI D'UFFICIO (STECCA A ZERO) ---
  const puntiElementi = stecca.reduce((acc, curr) => acc + curr.punti, 0);
  let bonusUfficio = 0;
  if (isMahjong && isChiusuraValida && puntiElementi === 0) {
    bonusUfficio = 10;
  }

  const puntiBase = puntiElementi + (isMahjong ? 20 : 0) + bonusUfficio;
  let totaleFinale = puntiBase * Math.pow(2, raddoppiTotali);
  const limiteMassimo = 200;

  if (isMahjong && isChiusuraValida) {
    const colorePuro = semiPresenti.size === 1 && !haAlmenoUnOnore;
    if (colorePuro || numCoppie === 7) {
      totaleFinale = limiteMassimo;
      elencoRaddoppiDesc.push("!!! MASSIMO RAGGIUNTO !!!");
    }
  }
  if (totaleFinale > limiteMassimo) totaleFinale = limiteMassimo;

  return (
    <div style={containerStyle}>
      <div style={headerInfo}>
        <div style={playerInfo}>
          <span style={badgeVento}>
            {mioVento} {tileVentoMio}
          </span>
        </div>
        <div style={displayTotale}>
          {totaleFinale} <span style={{ fontSize: "1rem" }}>PT</span>
        </div>
      </div>
      <div style={scrollArea}>
        <div style={areaStecca}>
          {isMahjong && (
            <div style={gruppoCompostoMJ}>
              <div style={tileRow}>🀄</div>
              <div style={puntiBadge}>
                MAHJONG
                <br />
                20 PUNTI
              </div>
            </div>
          )}
          {bonusUfficio > 0 && (
            <div style={gruppoCompostoMJ}>
              <div style={tileRow}>⭐</div>
              <div style={puntiBadge}>
                STECCA A ZERO
                <br />
                10 PUNTI
              </div>
            </div>
          )}
          {stecca.map((el, i) => (
            <div key={i} style={gruppoComposto}>
              <button onClick={() => rimuoviElemento(i)} style={btnDeleteSmall}>
                ×
              </button>
              {(el.tipo === "Tris" || el.tipo === "Poker") && (
                <button
                  onClick={() => toggleCasa(i)}
                  style={{
                    ...btnCasa,
                    backgroundColor: el.fattoInCasa ? "#10b981" : "#9ca3af",
                  }}
                >
                  🏠
                </button>
              )}
              <div style={tileRow}>{el.simboli.join("")}</div>
              <div style={puntiBadge}>{el.punti} pt</div>
            </div>
          ))}
        </div>
        <div style={infoPuntiBase}>
          PUNTI IN STECCA: <strong>{puntiBase}</strong> | TESSERE:{" "}
          {tessereTotaliStandard}/{limiteCorrente}
        </div>
        {elencoRaddoppiDesc.length > 0 && (
          <div style={areaRaddoppi}>
            {elencoRaddoppiDesc.map((desc, idx) => (
              <div
                key={idx}
                style={{
                  ...itemRaddoppio,
                  color: desc.includes("!!!") ? "#f87171" : "#fbbf24",
                }}
              >
                {desc}
              </div>
            ))}
          </div>
        )}
        <div style={toolbarAzioni}>
          {["Coppia", "Tris", "Poker", "Scala"].map((a) => (
            <button
              key={a}
              onClick={() => setAzioneSelezionata(a)}
              style={azioneSelezionata === a ? btnAzioneActive : btnAzione}
            >
              {a}
            </button>
          ))}
        </div>
        <div style={tastieraContainer}>
          {Object.entries(tiles).map(([cat, elenco]) => (
            <div key={cat} style={{ width: "100%", marginBottom: "12px" }}>
              <div style={catLabel}>{cat}</div>
              <div style={grigliaTastieraCentrata}>
                {elenco.map((t) => {
                  const isDisabled =
                    !canAddMore(t, azioneSelezionata) ||
                    (azioneSelezionata === "Scala" && !canStartScala(t));
                  return (
                    <button
                      key={t}
                      onClick={() => aggiungiAllaStecca(t)}
                      disabled={isDisabled}
                      style={{
                        ...tileKey,
                        opacity: isDisabled ? 0.2 : 1,
                        border: isFioreOStagione(t)
                          ? "2px solid #fbbf24"
                          : "none",
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={footerCalcolo}>
        <div style={toggleContainer} onClick={() => setIsMahjong(!isMahjong)}>
          <span style={{ fontSize: "0.8rem", fontWeight: "bold" }}>
            CHIUSURA MAHJONG?
          </span>
          <div
            style={{
              ...switchStyle,
              backgroundColor: isMahjong ? "#10b981" : "#4b5563",
            }}
          >
            <div
              style={{
                ...circleStyle,
                transform: isMahjong ? "translateX(20px)" : "translateX(0)",
              }}
            />
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: "10px",
            width: "100%",
            marginTop: "10px",
          }}
        >
          <button onClick={() => onConferma(totaleFinale)} style={btnApplica}>
            CONFERMA PUNTI
          </button>
          <button onClick={onAnnulla} style={btnAnnullaStyle}>
            ANNULLA
          </button>
        </div>
      </div>
    </div>
  );
}

const containerStyle = {
  background: "#064e3b",
  padding: "10px",
  borderRadius: "15px",
  color: "white",
  display: "flex",
  flexDirection: "column",
  maxHeight: "90vh",
  width: "95vw",
  maxWidth: "500px",
  boxSizing: "border-box",
};
const scrollArea = {
  flex: 1,
  overflowY: "auto",
  padding: "5px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  width: "100%",
};
const areaStecca = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  background: "rgba(0,0,0,0.4)",
  padding: "15px",
  borderRadius: "12px",
  marginBottom: "15px",
  justifyContent: "center",
  alignItems: "flex-start",
  alignContent: "flex-start",
  boxSizing: "border-box",
  width: "100%",
  minHeight: "80px",
  height: "auto",
  flexShrink: 0,
};
const grigliaTastieraCentrata = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  justifyContent: "center",
  width: "100%",
  maxWidth: "280px",
  margin: "0 auto",
};
const headerInfo = {
  display: "flex",
  width: "100%",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "10px",
};
const playerInfo = { fontSize: "0.9rem", fontWeight: "bold" };
const badgeVento = {
  background: "#fbbf24",
  color: "#064e3b",
  padding: "4px 10px",
  borderRadius: "8px",
  fontSize: "1.1rem",
};
const displayTotale = { fontSize: "2rem", fontWeight: "900", color: "#fbbf24" };
const infoPuntiBase = {
  fontSize: "0.7rem",
  color: "rgba(255,255,255,0.7)",
  marginBottom: "10px",
  fontWeight: "bold",
};
const areaRaddoppi = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  marginBottom: "15px",
};
const itemRaddoppio = {
  fontSize: "0.75rem",
  fontStyle: "italic",
  fontWeight: "bold",
};
const gruppoComposto = {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  background: "#fefefe",
  color: "#1f2937",
  padding: "8px 4px",
  borderRadius: "8px",
  minWidth: "50px",
  height: "fit-content",
};
const gruppoCompostoMJ = {
  ...gruppoComposto,
  background: "#fbbf24",
  color: "#064e3b",
};
const btnDeleteSmall = {
  position: "absolute",
  top: "-6px",
  right: "-6px",
  background: "#ef4444",
  color: "white",
  border: "2px solid #064e3b",
  borderRadius: "50%",
  width: "22px",
  height: "22px",
  fontSize: "12px",
  cursor: "pointer",
  zIndex: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const btnCasa = {
  position: "absolute",
  top: "-6px",
  left: "-6px",
  border: "2px solid #064e3b",
  borderRadius: "50%",
  width: "22px",
  height: "22px",
  fontSize: "12px",
  cursor: "pointer",
  zIndex: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const tileRow = {
  fontFamily: "MahjongFont",
  fontSize: "2.8rem",
  lineHeight: 1,
};
const puntiBadge = { fontSize: "0.6rem", fontWeight: "900", marginTop: "4px" };
const toolbarAzioni = {
  display: "flex",
  gap: "6px",
  width: "100%",
  marginBottom: "15px",
};
const btnAzione = {
  flex: 1,
  padding: "10px 0",
  borderRadius: "10px",
  border: "1.5px solid #fbbf24",
  background: "transparent",
  color: "#fbbf24",
  fontWeight: "bold",
  fontSize: "0.8rem",
};
const btnAzioneActive = {
  ...btnAzione,
  background: "#fbbf24",
  color: "#064e3b",
};
const tastieraContainer = { width: "100%" };
const tileKey = {
  fontFamily: "MahjongFont",
  fontSize: "3.4rem",
  width: "45px",
  height: "55px",
  borderRadius: "8px",
  background: "#f3f4f6",
  color: "black",
  border: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  paddingTop: "18px",
  boxSizing: "border-box",
};
const catLabel = {
  fontSize: "0.7rem",
  fontWeight: "bold",
  color: "#fbbf24",
  marginBottom: "6px",
  textAlign: "center",
  textTransform: "uppercase",
  letterSpacing: "1px",
};
const footerCalcolo = {
  borderTop: "1px solid rgba(255,255,255,0.2)",
  paddingTop: "12px",
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  background: "#064e3b",
  marginTop: "auto",
};
const toggleContainer = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  cursor: "pointer",
  background: "rgba(255,255,255,0.1)",
  padding: "8px 18px",
  borderRadius: "25px",
};
const switchStyle = {
  width: "44px",
  height: "22px",
  borderRadius: "11px",
  padding: "2px",
};
const circleStyle = {
  width: "18px",
  height: "18px",
  background: "white",
  borderRadius: "50%",
  transition: "0.2s",
};
const btnApplica = {
  flex: 2,
  padding: "14px",
  background: "#10b981",
  color: "white",
  border: "none",
  borderRadius: "12px",
  fontWeight: "900",
  fontSize: "1rem",
};
const btnAnnullaStyle = {
  flex: 1,
  padding: "14px",
  background: "#ef4444",
  color: "white",
  border: "none",
  borderRadius: "12px",
  fontWeight: "bold",
  fontSize: "0.85rem",
};
