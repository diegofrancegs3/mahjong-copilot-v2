export const stileAnimazione = `
  @keyframes rotateDice {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .dice-rolling { animation: rotateDice 0.4s linear infinite; }
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.4; }
    100% { opacity: 1; }
  }
  .pulse-text { animation: pulse 1s infinite; color: #f87171; font-weight: bold; }
`;
