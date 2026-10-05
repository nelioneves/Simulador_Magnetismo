/*
 * ================================================================
 * LABORATÓRIO VIRTUAL — LEVITAÇÃO MAGNÉTICA
 * p5.js
 * ================================================================
 *
 * MODELO DIDÁTICO
 *
 * Peso:
 *      P = m g
 *
 * Força magnética:
 *      Fm = B i_fio L
 *
 * Campo do eletroímã:
 *      B = Kb (V/R)
 *
 * Portanto, para Fm = P:
 *
 *      Kb (V/R) i_fio L = m g
 *
 *      R_ideal = Kb V i_fio L / (m g)
 *
 * O desafio aceita erro relativo <= 3%.
 *
 * IMPORTANTE:
 * A posição visual da barra não é obtida por um integrador
 * tradicional F = ma. Para evitar instabilidade numérica, usamos
 * uma posição de equilíbrio geométrica e uma interpolação suave:
 *
 *      y_eq = y0 + [(m g)/(2 k)] escala
 *
 * A barra é atraída suavemente para y_eq.
 *
 * Quando o aluno acerta R, a posição-alvo passa para y0,
 * representando a levitação.
 * ================================================================
 */

// ----------------------------------------------------------------
// VARIÁVEIS FÍSICAS GLOBAIS
// ----------------------------------------------------------------
let massa = 0.150;          // kg — controlada pelo slider
let k = 55.0;               // N/m — duas molas idênticas
let V = 9.0;                // V — tensão do eletroímã
let i_fio = 3.0;            // A — corrente no fio suspenso

const g = 9.81;             // m/s²
const L = 0.025;            // m — 2,5 cm
const Kb = 0.85;            // T/(V/R), constante didática

// ----------------------------------------------------------------
// VARIÁVEIS GRÁFICAS
// ----------------------------------------------------------------
let barY = 0;
let targetY = 0;
let naturalY = 0;

let springXLeft = 0;
let springXRight = 0;
let barLeft = 0;
let barRight = 0;

let rulerX = 0;
let rulerTop = 0;
let rulerBottom = 0;

let fieldCenterX = 0;
let fieldCenterY = 0;

let fieldOn = false;
let challengeState = "idle"; // idle | success | error
let errorBlink = 0;
let successAlpha = 0;

let resetTimer = null;
let lastFrameMillis = 0;

// ----------------------------------------------------------------
// DOM
// ----------------------------------------------------------------
let massSlider;
let massDisplay;
let massValue;
let resistanceInput;
let applyButton;

// ----------------------------------------------------------------
// SETUP
// ----------------------------------------------------------------
function setup() {
  const holder = document.getElementById("canvas-holder");

  const canvas = createCanvas(holder.clientWidth, holder.clientHeight);
  canvas.parent(holder);

  pixelDensity(Math.min(window.devicePixelRatio || 1, 2));

  massSlider = document.getElementById("mass-slider");
  massDisplay = document.getElementById("mass-display");
  massValue = document.getElementById("mass-value");
  resistanceInput = document.getElementById("resistance-input");
  applyButton = document.getElementById("apply-r");

  massSlider.addEventListener("input", () => {
    const value = clamp(parseFloat(massSlider.value), 0.050, 0.250);
    massa = value;
    massDisplay.value = value.toFixed(3);
    updateMassLabel();

    // A mudança de massa redefine o desafio atual.
    if (challengeState !== "idle") resetChallengeImmediately();
  });

  massDisplay.addEventListener("change", () => {
    const value = clamp(parseFloat(massDisplay.value) || 0.150, 0.050, 0.250);
    massa = value;
    massSlider.value = value.toFixed(3);
    massDisplay.value = value.toFixed(3);
    updateMassLabel();

    if (challengeState !== "idle") resetChallengeImmediately();
  });

  applyButton.addEventListener("click", applyResistance);

  recalculateGeometry();
  generatePhysicalParameters();
  updateMassLabel();
  updateSimulatorHiddenFields();

  lastFrameMillis = millis();
}

// ----------------------------------------------------------------
// DRAW
// ----------------------------------------------------------------
function draw() {
  background(238, 243, 247);

  recalculateGeometry();
  updateMotion();
  drawScene();
  drawHUD();

  // Transição visual para o sucesso.
  if (challengeState === "success") {
    successAlpha = lerp(successAlpha, 255, 0.08);
  } else {
    successAlpha = lerp(successAlpha, 0, 0.10);
  }

  // Aviso vermelho piscante.
  if (challengeState === "error") {
    errorBlink += 0.13;
  } else {
    errorBlink = 0;
  }
}

// ----------------------------------------------------------------
// GEOMETRIA
// ----------------------------------------------------------------
function recalculateGeometry() {
  const top = 92;
  const bottom = height * 0.77;

  springXLeft = width * 0.28;
  springXRight = width * 0.69;

  barLeft = springXLeft;
  barRight = springXRight;

  naturalY = height * 0.43;

  // Escala visual: deslocamento mecânico moderado.
  // y_eq = y0 + ((m*g)/(2*k))*escala
  const scalePxPerMeter = min(2300, height * 3.0);

  const equilibriumDisplacement = (massa * g) / (2 * k);
  const mechanicalEqY =
    naturalY + equilibriumDisplacement * scalePxPerMeter;

  if (barY === 0 || !Number.isFinite(barY)) {
    barY = mechanicalEqY;
  }

  if (challengeState === "success") {
    targetY = naturalY;
  } else {
    targetY = min(mechanicalEqY, bottom - 28);
  }

  rulerX = width * 0.82;
  rulerTop = naturalY - 70;
  rulerBottom = min(bottom + 45, height - 35);

  fieldCenterX = width * 0.49;
  fieldCenterY = height * 0.47;
}

// ----------------------------------------------------------------
// MOTOR DE AMORTECIMENTO
// ----------------------------------------------------------------
function updateMotion() {
  // Interpolação estável — não usa integração explícita de F = ma.
  const alpha = challengeState === "success" ? 0.085 : 0.045;
  barY = lerp(barY, targetY, alpha);

  if (!Number.isFinite(barY)) {
    barY = naturalY;
  }
}

// ----------------------------------------------------------------
// CENA PRINCIPAL
// ----------------------------------------------------------------
function drawScene() {
  drawCeiling();
  drawMagneticField();
  drawCircuitOne();
  drawWireAndSprings();
  drawRuler();
  drawCircuitTwo();

  if (challengeState === "success") {
    drawSuccessMessage();
  }

  if (challengeState === "error") {
    drawErrorMessage();
  }
}

// ----------------------------------------------------------------
// TETO
// ----------------------------------------------------------------
function drawCeiling() {
  noStroke();
  fill(221, 228, 233);
  rect(0, 0, width, 52);

  stroke(184, 195, 203);
  strokeWeight(1);

  for (let x = 0; x < width; x += 18) {
    line(x, 52, x + 8, 60);
  }

  noStroke();
  fill(95, 110, 122);
  textSize(13);
  textStyle(BOLD);
  text("LABORATÓRIO VIRTUAL — LEVITAÇÃO MAGNÉTICA", 18, 76);
  textStyle(NORMAL);
}

// ----------------------------------------------------------------
// CAMPO MAGNÉTICO — MATRIZ DE X
// ----------------------------------------------------------------
function drawMagneticField() {
  const cols = 7;
  const rows = 5;
  const spacingX = min(36, width * 0.042);
  const spacingY = 31;

  const totalW = (cols - 1) * spacingX;
  const totalH = (rows - 1) * spacingY;

  const startX = fieldCenterX - totalW / 2;
  const startY = fieldCenterY - totalH / 2;

  // Rótulo
  noStroke();
  fill(80, 98, 112);
  textSize(11);
  textAlign(CENTER, CENTER);
  text("Campo magnético B — entrando no plano", fieldCenterX, startY - 30);

  const alpha = fieldOn ? 245 : 45;
  stroke(34, 101, 175, alpha);
  strokeWeight(fieldOn ? 2.4 : 1.5);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = startX + col * spacingX;
      const y = startY + row * spacingY;

      line(x - 5, y - 5, x + 5, y + 5);
      line(x - 5, y + 5, x + 5, y - 5);
    }
  }

  textAlign(LEFT, BASELINE);
}

// ----------------------------------------------------------------
// CIRCUITO 1 — FIO SUSPENSO
// ----------------------------------------------------------------
function drawCircuitOne() {
  const y = 118;
  const batteryX = width * 0.47;
  const meterX = width * 0.61;

  stroke(55, 68, 78);
  strokeWeight(2);

  // Fios superiores
  line(90, y, batteryX - 10, y);
  line(batteryX + 10, y, meterX - 30, y);
  line(meterX + 30, y, width - 55, y);

  // Bateria
  strokeWeight(3);
  line(batteryX - 7, y - 12, batteryX - 7, y + 12);
  line(batteryX + 5, y - 7, batteryX + 5, y + 7);

  // Amperímetro
  strokeWeight(2);
  fill(255);
  ellipse(meterX, y, 42, 42);
  noStroke();
  fill(45, 58, 67);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  text("A", meterX, y + 1);
  textStyle(NORMAL);

  // Setas de corrente no circuito superior
  drawArrow(170, y, 200, y, "#1769aa");
  drawArrow(width - 125, y, width - 95, y, "#1769aa");

  noStroke();
  fill(74, 91, 104);
  textSize(11);
  textAlign(LEFT, CENTER);
  text("Circuito 1 — fio suspenso", 90, y - 19);

  // U próximo à bateria
  text("U", batteryX - 1, y + 31);

  textAlign(LEFT, BASELINE);
}

// ----------------------------------------------------------------
// MOLAS + BARRA
// ----------------------------------------------------------------
function drawWireAndSprings() {
  const topY = 138;

  // Linhas verticais de ligação
  stroke(55, 68, 78);
  strokeWeight(2);
  line(springXLeft, topY, springXLeft, topY + 20);
  line(springXRight, topY, springXRight, topY + 20);

  drawSpring(springXLeft, topY + 20, barY - 7);
  drawSpring(springXRight, topY + 20, barY - 7);

  // Barra condutora horizontal
  stroke(44, 48, 53);
  strokeWeight(8);
  line(barLeft, barY, barRight, barY);

  // Núcleo metálico
  stroke(116, 128, 138);
  strokeWeight(4);
  line(barLeft + 4, barY - 3, barRight - 4, barY - 3);

  // Corrente no fio
  drawArrow(
    barLeft + (barRight - barLeft) * 0.38,
    barY + 20,
    barLeft + (barRight - barLeft) * 0.62,
    barY + 20,
    "#1769aa"
  );

  noStroke();
  fill(55, 68, 78);
  textSize(12);
  textAlign(CENTER, CENTER);
  text("i", fieldCenterX, barY + 34);

  // Carga
  textSize(11);
  fill(75, 91, 103);
  text("barra condutora de cobre", fieldCenterX, barY - 17);

  textAlign(LEFT, BASELINE);
}

function drawSpring(x, y1, y2) {
  const length = max(18, y2 - y1);
  const turns = 7;
  const step = length / turns;

  stroke(75, 87, 98);
  strokeWeight(2);
  noFill();

  beginShape();
  vertex(x, y1);

  for (let i = 0; i < turns; i++) {
    const yA = y1 + i * step + step * 0.2;
    const yB = y1 + i * step + step * 0.8;
    const direction = (i % 2 === 0) ? 1 : -1;

    vertex(x + direction * 8, yA);
    vertex(x - direction * 8, yB);
  }

  vertex(x, y2);
  endShape();
}

// ----------------------------------------------------------------
// RÉGUA — ZERO NA POSIÇÃO NATURAL
// ----------------------------------------------------------------
function drawRuler() {
  stroke(75, 87, 98);
  strokeWeight(2);
  line(rulerX, rulerTop, rulerX, rulerBottom);

  const pxPerMeter = 330;
  const maxMeters = max(0.12, (rulerBottom - naturalY) / pxPerMeter);

  for (let i = 0; i <= 6; i++) {
    const y = naturalY + i * (rulerBottom - naturalY) / 6;
    const tick = (i % 2 === 0) ? 14 : 9;

    line(rulerX - tick, y, rulerX + tick, y);

    noStroke();
    fill(76, 90, 101);
    textSize(10);

    const meters = (y - naturalY) / pxPerMeter;
    text((meters).toFixed(2) + " m", rulerX + 18, y + 3);
  }

  stroke("#18864b");
  strokeWeight(2);
  line(rulerX - 18, naturalY, rulerX + 18, naturalY);

  noStroke();
  fill("#18864b");
  textSize(11);
  textStyle(BOLD);
  text("0 — posição natural", rulerX - 95, naturalY - 10);
  textStyle(NORMAL);
}

// ----------------------------------------------------------------
// CIRCUITO 2 — ELETROÍMÃ
// ----------------------------------------------------------------
function drawCircuitTwo() {
  const x0 = 34;
  const y0 = height - 120;
  const w = 190;

  stroke(78, 91, 102);
  strokeWeight(2);
  noFill();

  // Retângulo esquemático
  line(x0, y0, x0 + 28, y0);
  line(x0 + 75, y0, x0 + 115, y0);
  line(x0 + 157, y0, x0 + w, y0);
  line(x0, y0, x0, y0 + 58);
  line(x0 + w, y0, x0 + w, y0 + 58);
  line(x0, y0 + 58, x0 + w, y0 + 58);

  // Bateria
  strokeWeight(3);
  line(x0 + 42, y0 - 9, x0 + 42, y0 + 9);
  line(x0 + 54, y0 - 6, x0 + 54, y0 + 6);

  // Resistor variável
  strokeWeight(2);
  rect(x0 + 115, y0 - 10, 42, 20);
  line(x0 + 105, y0 + 14, x0 + 166, y0 - 16);

  // Seta de corrente
  drawArrow(x0 + 72, y0, x0 + 103, y0, "#1769aa");

  noStroke();
  fill(68, 83, 95);
  textSize(11);
  textStyle(BOLD);
  text("Circuito 2 — eletroímã", x0, y0 - 28);
  textStyle(NORMAL);

  textSize(10);
  text("V", x0 + 47, y0 + 28);
  text("R variável", x0 + 112, y0 + 31);

  // Linha tracejada até a região magnética
  stroke(23, 105, 170, 150);
  strokeWeight(1.5);
  drawingContext.setLineDash([6, 5]);
  line(x0 + w, y0 + 10, fieldCenterX - 65, fieldCenterY + 40);
  drawingContext.setLineDash([]);

  noStroke();
  fill(70, 90, 105);
  textSize(10);
  text("acoplamento ao campo", x0 + 80, y0 + 52);
}

// ----------------------------------------------------------------
// HUD
// ----------------------------------------------------------------
function drawHUD() {
  const x = 18;
  const y = height - 172;
  const w = min(310, width * 0.29);
  const h = 145;

  noStroke();
  fill(255, 255, 255, 238);
  rect(x, y, w, h, 10);

  stroke(211, 222, 230);
  strokeWeight(1);
  noFill();
  rect(x, y, w, h, 10);

  noStroke();
  fill("#0d4775");
  textSize(13);
  textStyle(BOLD);
  text("HUD — grandezas do modelo", x + 12, y + 20);
  textStyle(NORMAL);

  const P = massa * g;
  const Rideal = requiredResistance();
  const Bideal = Kb * (V / Rideal);

  fill("#34495e");
  textSize(11);

  const lines = [
    `m = ${massa.toFixed(3)} kg`,
    `k = ${k.toFixed(1)} N/m`,
    `V = ${V.toFixed(2)} V`,
    `i_fio = ${i_fio.toFixed(2)} A`,
    `L = ${L.toFixed(3)} m`,
    `P = ${P.toFixed(3)} N`,
    `B* = ${Bideal.toFixed(3)} T`
  ];

  for (let i = 0; i < lines.length; i++) {
    text(lines[i], x + 12, y + 40 + i * 14);
  }

  // Estado
  let stateText = "Aguardando R...";
  let stateColor = "#66788a";

  if (challengeState === "success") {
    stateText = "SUCESSO — levitação!";
    stateColor = "#18864b";
  } else if (challengeState === "error") {
    stateText = "ERRO — tente novamente";
    stateColor = "#c62828";
  }

  fill(stateColor);
  textStyle(BOLD);
  text(stateText, x + 155, y + 40);
  textStyle(NORMAL);
}

// ----------------------------------------------------------------
// MENSAGEM DE SUCESSO
// ----------------------------------------------------------------
function drawSuccessMessage() {
  const boxW = min(390, width * 0.42);
  const boxH = 72;
  const x = fieldCenterX - boxW / 2;
  const y = height * 0.22;

  noStroke();
  fill(234, 248, 240, successAlpha);
  rect(x, y, boxW, boxH, 10);

  stroke(24, 134, 75, successAlpha);
  strokeWeight(2);
  noFill();
  rect(x, y, boxW, boxH, 10);

  noStroke();
  fill(24, 134, 75, successAlpha);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(22);
  text("SUCESSO", fieldCenterX, y + 26);
  textStyle(NORMAL);
  textSize(12);
  text("Fm ≈ P  •  campo magnético ativado", fieldCenterX, y + 51);
  textAlign(LEFT, BASELINE);
}

// ----------------------------------------------------------------
// MENSAGEM DE ERRO
// ----------------------------------------------------------------
function drawErrorMessage() {
  const visible = sin(errorBlink) > 0;

  if (!visible) return;

  const boxW = min(360, width * 0.40);
  const boxH = 64;
  const x = fieldCenterX - boxW / 2;
  const y = height * 0.22;

  noStroke();
  fill(255, 240, 240, 245);
  rect(x, y, boxW, boxH, 10);

  stroke(198, 40, 40);
  strokeWeight(2);
  noFill();
  rect(x, y, boxW, boxH, 10);

  noStroke();
  fill(198, 40, 40);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(19);
  text("ERRO", fieldCenterX, y + 24);
  textStyle(NORMAL);
  textSize(11);
  text("A força magnética não compensou o peso.", fieldCenterX, y + 45);
  textAlign(LEFT, BASELINE);
}

// ----------------------------------------------------------------
// DESAFIO
// ----------------------------------------------------------------
function applyResistance() {
  const R = parseFloat(resistanceInput.value);

  if (!Number.isFinite(R) || R <= 0) {
    setChallengeError("Digite uma resistência positiva.");
    return;
  }

  const P = massa * g;
  const B = Kb * (V / R);
  const Fm = B * i_fio * L;
  const relativeError = Math.abs(Fm - P) / P;

  updateSimulatorHiddenFields(R, B, Fm, P, relativeError);

  if (relativeError <= 0.03) {
    challengeState = "success";
    fieldOn = true;
    successAlpha = 0;
    targetY = naturalY;

    resistanceInput.style.borderColor = "#18864b";

    // A força aplicada é registrada no HUD/relatório.
    return;
  }

  setChallengeError();

  // O aluno terá 3,5 s para observar o erro.
  if (resetTimer) clearTimeout(resetTimer);

  resetTimer = setTimeout(() => {
    resetChallengeAfterError();
  }, 3500);
}

function setChallengeError() {
  challengeState = "error";
  fieldOn = false;
  resistanceInput.style.borderColor = "#c62828";
}

function resetChallengeAfterError() {
  resistanceInput.value = "";
  resistanceInput.style.borderColor = "";

  generatePhysicalParameters();

  challengeState = "idle";
  fieldOn = false;
  successAlpha = 0;

  recalculateGeometry();
  updateSimulatorHiddenFields();
}

function resetChallengeImmediately() {
  if (resetTimer) clearTimeout(resetTimer);

  resistanceInput.value = "";
  resistanceInput.style.borderColor = "";

  generatePhysicalParameters();

  challengeState = "idle";
  fieldOn = false;
  successAlpha = 0;

  recalculateGeometry();
  updateSimulatorHiddenFields();
}

// ----------------------------------------------------------------
// GERA NOVOS PARÂMETROS
// ----------------------------------------------------------------
function generatePhysicalParameters() {
  // Valores mantidos em faixas didáticas.
  k = random(45, 75);
  V = random(7, 12);
  i_fio = random(2.5, 4.5);

  // Arredondamento para facilitar a leitura no HUD.
  k = Number(k.toFixed(1));
  V = Number(V.toFixed(2));
  i_fio = Number(i_fio.toFixed(2));

  // Força a posição a ser recalculada no próximo frame.
  barY = 0;
}

// ----------------------------------------------------------------
// RESISTÊNCIA IDEAL
// ----------------------------------------------------------------
function requiredResistance() {
  const P = massa * g;

  // Fm = Kb(V/R)iL = P
  // R = Kb V i L / P
  return (Kb * V * i_fio * L) / P;
}

// ----------------------------------------------------------------
// CAMPOS HIDDEN DO RELATÓRIO
// ----------------------------------------------------------------
function updateSimulatorHiddenFields(R = null, B = null, Fm = null, P = null, error = null) {
  const resistance =
    R !== null
      ? R
      : (parseFloat(resistanceInput?.value) || NaN);

  const weight = P !== null ? P : massa * g;

  let fieldB = B;
  let magneticForce = Fm;
  let relativeError = error;

  if (Number.isFinite(resistance) && resistance > 0) {
    fieldB = Kb * (V / resistance);
    magneticForce = fieldB * i_fio * L;
    relativeError = Math.abs(magneticForce - weight) / weight;
  }

  setHidden("sim-mass", massa.toFixed(3));
  setHidden("sim-k", k.toFixed(2));
  setHidden("sim-v", V.toFixed(2));
  setHidden("sim-i", i_fio.toFixed(2));
  setHidden("sim-b", Number.isFinite(fieldB) ? fieldB.toFixed(5) : "");
  setHidden("sim-fm", Number.isFinite(magneticForce) ? magneticForce.toFixed(5) : "");
  setHidden("sim-p", weight.toFixed(5));
  setHidden("sim-error", Number.isFinite(relativeError) ? relativeError.toFixed(6) : "");
  setHidden("sim-state", challengeState);
}

function setHidden(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

// ----------------------------------------------------------------
// UI AUXILIAR
// ----------------------------------------------------------------
function updateMassLabel() {
  if (massValue) {
    massValue.textContent =
      massa.toFixed(3).replace(".", ",") + " kg";
  }
}

function drawArrow(x1, y1, x2, y2, colorValue) {
  const angle = atan2(y2 - y1, x2 - x1);
  const size = 7;

  stroke(colorValue);
  strokeWeight(2);
  line(x1, y1, x2, y2);

  push();
  translate(x2, y2);
  rotate(angle);
  line(0, 0, -size, -size / 2);
  line(0, 0, -size, size / 2);
  pop();
}

function clamp(value, minValue, maxValue) {
  return Math.max(minValue, Math.min(maxValue, value));
}

// ----------------------------------------------------------------
// RESPONSIVIDADE
// ----------------------------------------------------------------
function windowResized() {
  const holder = document.getElementById("canvas-holder");

  if (!holder) return;

  resizeCanvas(holder.clientWidth, holder.clientHeight);

  recalculateGeometry();

  // Reposiciona a barra de forma estável após redimensionamento.
  if (!Number.isFinite(barY)) {
    barY = naturalY;
  }
}
