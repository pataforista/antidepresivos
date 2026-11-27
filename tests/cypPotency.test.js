import { parsePotency } from "../src/core/cypPotency.js";

const D6 = { pattern: /CYP2D6/i };
const A2 = { pattern: /CYP1A2/i };
const C19 = { pattern: /CYP2C19/i };
const A4 = { pattern: /CYP3A4/i };
const C9 = { pattern: /CYP2C9(?!9)/i };

describe("parsePotency", () => {
  test("potencia antes de la enzima", () => {
    expect(parsePotency("Inhibidor potente CYP2D6", D6)).toBe("+++");
    expect(parsePotency("Inhibidor moderado CYP2D6", D6)).toBe("++");
  });

  test("dos enzimas con potencias distintas en la misma frase", () => {
    const s = "Inhibidor potente CYP1A2 y moderado CYP2C19";
    expect(parsePotency(s, A2)).toBe("+++");
    expect(parsePotency(s, C19)).toBe("++");
    expect(parsePotency(s, D6)).toBe("-");
  });

  test("formato 'CYP: inhibidor <potencia>'", () => {
    const s = "CYP2C19: inhibidor potente; CYP2D6: inhibidor; CYP1A2: inhibidor";
    expect(parsePotency(s, C19)).toBe("+++");
    expect(parsePotency(s, D6)).toBe("?");
    expect(parsePotency("CYP2D6: inhibidor débil", D6)).toBe("+");
  });

  test("sin potencia indicada no se presenta como débil", () => {
    expect(parsePotency("Inhibidor CYP2D6", D6)).toBe("?");
  });

  test("un inductor no cuenta como inhibición", () => {
    const s = "Cyp2C19 (Inhibidor); Cyp3A4 (Inductor débil)";
    expect(parsePotency(s, C19)).toBe("?");
    expect(parsePotency(s, A4)).toBe("-");
  });

  test("ser sustrato no es inhibir", () => {
    expect(parsePotency("Ninguna relevante (sustrato de CYP1A2)", A2)).toBe("-");
    expect(parsePotency("Ninguna reportada (sustrato de CYP3A4)", A4)).toBe("-");
  });

  test("CYP2C9 no coincide con CYP2C19", () => {
    expect(parsePotency("CYP2C19: inhibidor potente", C9)).toBe("-");
  });

  test("formatos en inglés", () => {
    expect(parsePotency("Strong CYP2D6; Moderate CYP3A4", D6)).toBe("+++");
    expect(parsePotency("Strong CYP2D6; Moderate CYP3A4", A4)).toBe("++");
    expect(parsePotency("Weak CYP2D6 inhibitor", D6)).toBe("+");
  });

  test("vacíos y negativos", () => {
    for (const s of ["", null, "No", "N/D", "Nula", "Mínima"]) expect(parsePotency(s, D6)).toBe("-");
  });
});
