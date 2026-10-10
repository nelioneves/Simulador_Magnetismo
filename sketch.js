/*
 * ================================================================
 * LABORATÓRIO VIRTUAL — LEVITAÇÃO MAGNÉTICA
 * p5.js
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
let globalScalePxPerMeter = 4000; // Escala visual: 1 metro = 4000 pixels (1 cm = 40 px)

let springXLeft = 0;
let springXRight = 0;
let barLeft = 0;
let barRight = 0;

let rulerX = 0;
let rulerTop = 0;
let rulerBottom = 0;

let fieldCenterX = 0;
let fieldCenterY = 0;

let springDeformation = 0;

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

  if (challengeState === "success") {
    successAlpha = lerp(successAlpha, 255, 0.08);
  } else {
    successAlpha = lerp(successAlpha, 0, 0.10);
  }

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
  const mobile = width < 900;
  const controlSafeLeft = 40;

  // Largura disponível para o experimento
  const availableWidth = width - controlSafeLeft - 60;
  
  // Centraliza o aparato (molas e barra) no meio do canvas
  const apparatusWidth = Math.min(availableWidth * 0.55, 380);
  springXLeft = (width - apparatusWidth) / 2 - 30;
  springXRight = springXLeft + apparatusWidth;

  barLeft = springXLeft;
  barRight = springXRight;

  // Ajuste vertical: afasta a barra do teto para dar espaço às molas
  const topY = mobile ? 300 : 100;
  naturalY = topY + 110; // Posição de repouso confortável

  springDeformation = (massa * g) / (2 * k);

  // Escala visual: aumentada para tornar o movimento claro
  globalScalePxPerMeter = mobile ? 1500 : 4000;
  let mechanicalEqY = naturalY + springDeformation * globalScalePxPerMeter;

  if (barY === 0 || !Number.isFinite(barY)) {
    barY = mechanicalEqY;
  }

  const bottomLimit = mobile ? height - 120 : height - 180;
  
  // Garante que a barra não desça além do limite do circuito 2
  if (mechanicalEqY > bottomLimit) mechanicalEqY = bottomLimit;

  if (challengeState === "success") {
    targetY = naturalY;
  } else {
    targetY = mechanicalEqY;
  }

  // Régua na extrema direita, ajustada para não sobrepor o HUD
  rulerX = width - 90;
  rulerTop = naturalY - 20;
  rulerBottom = Math.min(bottomLimit + 40, height - 35);

  fieldCenterX = (springXLeft + springXRight) / 2;
  // O centro do campo é deslocado para baixo para que ele preencha a área da barra
  fieldCenterY = naturalY + Math.min(110, height * 0.13);
}

// ----------------------------------------------------------------
// MOTOR DE AMORTECIMENTO
// ----------------------------------------------------------------
function updateMotion() {
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
  fill(13, 71, 117);
  textSize(12);
  textStyle(BOLD);
  textAlign(LEFT, BASELINE);
  text("IFG — INSTITUTO FEDERAL DE GOIÁS", 18, 35);

  textSize(11);
  fill(70, 88, 103);
  text("Física III  •  Prof. Nélio Neves Lima", 18, 50);
  textStyle(NORMAL);
}

// ----------------------------------------------------------------
// CAMPO MAGNÉTICO — MATRIZ DE X (Ajustado: 1 linha a menos e mais baixo)
// ----------------------------------------------------------------
function drawMagneticField() {
  const mobile = width < 900;
  
  // Reduzimos em 1 o número de linhas para remover a fileira mais alta
  const cols = mobile ? 6 : 8;
  const rows = mobile ? 5 : 7; 
  
  const spacingX = mobile ? 25 : Math.min(30, width * 0.025);
  const spacingY = mobile ? 25 : 28;

  const totalW = (cols - 1) * spacingX;
  const totalH = (rows - 1) * spacingY;

  const startX = fieldCenterX - totalW / 2;
  // Descemos o ponto de partida de -60 para -40, afastando do circuito 1
  const startY = naturalY - 40; 

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
}

// ----------------------------------------------------------------
// CIRCUITO 1 — FIO SUSPENSO
// ----------------------------------------------------------------
function drawCircuitOne() {
  const mobile = width < 900;
  const y = mobile ? 345 : 80; // Movido mais para cima

  const circuitLeft = springXLeft;
  const circuitRight = springXRight;
  const batteryX = (circuitLeft + circuitRight) * 0.42;
  const meterX = (circuitLeft + circuitRight) * 0.68;

  stroke(55, 68, 78);
  strokeWeight(2);

  line(circuitLeft, y, batteryX - 10, y);
  line(batteryX + 10, y, meterX - 30, y);
  line(meterX + 30, y, circuitRight, y);

  strokeWeight(3);
  line(batteryX - 7, y - 12, batteryX - 7, y + 12);
  line(batteryX + 5, y - 7, batteryX + 5, y + 7);

  strokeWeight(2);
  fill(255);
  ellipse(meterX, y, 42, 42);
  noStroke();
  fill(45, 58, 67);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  text("A", meterX, y + 1);
  textStyle(NORMAL);

  drawArrow(circuitRight - 55, y, circuitRight - 85, y, "#1769aa");
  drawArrow(circuitLeft + 70, y, circuitLeft + 40, y, "#1769aa");

  noStroke();
  fill(74, 91, 104);
  textSize(10);
  textAlign(CENTER, CENTER);
  text("Circuito 1 — fio suspenso", (circuitLeft + circuitRight) / 2, y - 24);

  text("U", batteryX, y + 30);
  textAlign(LEFT, BASELINE);
}

// ----------------------------------------------------------------
// MOLAS + BARRA
// ----------------------------------------------------------------
function drawWireAndSprings() {
  const mobile = width < 900;
  const topY = mobile ? 300 : 100; // Deve ser o mesmo do recalculateGeometry

  stroke(55, 68, 78);
  strokeWeight(2);
  line(springXLeft, topY, springXLeft, topY + 20);
  line(springXRight, topY, springXRight, topY + 20);

  drawSpring(springXLeft, topY + 20, barY - 7);
  drawSpring(springXRight, topY + 20, barY - 7);

  stroke(44, 48, 53);
  strokeWeight(mobile ? 7 : 8);
  line(barLeft, barY, barRight, barY);

  stroke(116, 128, 138);
  strokeWeight(3);
  line(barLeft + 4, barY - 3, barRight - 4, barY - 3);

  drawArrow(
    barLeft + (barRight - barLeft) * 0.38,
    barY + 18,
    barLeft + (barRight - barLeft) * 0.62,
    barY + 18,
    "#1769aa"
  );

  // Texto "i" (corrente) e "barra condutora" acima da barra
  noStroke();
  fill(55, 68, 78);
  textSize(11);
  textAlign(CENTER, CENTER);
  text("i", (barLeft + barRight) / 2, barY + 32);
  textSize(10);
  fill(75, 91, 103);
  textAlign(CENTER, BOTTOM);
  text("barra condutora de cobre", (barLeft + barRight) / 2, barY - 20);

  // ---- Cota da mola (Δx) movida para a esquerda ----
  const deformationNow = challengeState === "success" ? 0 : springDeformation;
  const deformationCm = deformationNow * 100;
  
  const dimX = springXLeft - 25;
  const springTop = topY + 20;
  const springBottom = barY - 7;

  stroke(23, 105, 170, 190);
  strokeWeight(1.5);
  drawingContext.setLineDash([4, 4]);
  line(dimX, springTop, dimX, springBottom);
  drawingContext.setLineDash([]);
  line(dimX - 5, springTop, dimX + 5, springTop);
  line(dimX - 5, springBottom, dimX + 5, springBottom);

  noStroke();
  fill("#1769aa");
  textSize(10);
  textStyle(BOLD);
  textAlign(RIGHT, CENTER);
  text(`Δx = ${deformationCm.toFixed(2)} cm`, dimX - 8,
       (springTop + springBottom) / 2 - 7);
  textStyle(NORMAL);
  textSize(9);
  fill("#536979");
  text("cada mola", dimX - 8,
       (springTop + springBottom) / 2 + 8);

  // ---- Texto do deslocamento da barra (abaixo da barra) ----
  const displacementCm = Math.max(0, (barY - naturalY) / globalScalePxPerMeter * 100);

  fill("#18864b");
  textSize(10);
  textStyle(BOLD);
  textAlign(CENTER, TOP);
  text(`deslocamento: ${displacementCm.toFixed(2)} cm`, (barLeft + barRight) / 2, barY + 25);
  textStyle(NORMAL);
  textAlign(LEFT, BASELINE);
}

function drawSpring(x, y1, y2) {
  const length = Math.max(18, y2 - y1);
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
// RÉGUA COM INDICADOR VISUAL DE DESLOCAMENTO
// ----------------------------------------------------------------
function drawRuler() {
  stroke(75, 87, 98);
  strokeWeight(2);
  line(rulerX, rulerTop, rulerX, rulerBottom);

  // Usa a mesma escala da simulação para que o ponteiro bata com o movimento
  const rulerPxPerMeter = globalScalePxPerMeter;
  const maxCm = Math.floor(Math.max(10, (rulerBottom - naturalY) / rulerPxPerMeter * 100));

  // Desenha as marcações da régua
  for (let cm = 0; cm <= maxCm; cm += 1) {
    const y = naturalY + (cm / 100) * rulerPxPerMeter;
    if (y > rulerBottom) break;

    const major = cm % 5 === 0;
    const tick = major ? 14 : 6;
    stroke(75, 87, 98);
    strokeWeight(major ? 1.5 : 1);
    line(rulerX - tick, y, rulerX + tick, y);

    if (major) {
      noStroke();
      fill(76, 90, 101);
      textSize(9);
      textAlign(RIGHT, CENTER); // Alinhado à direita para não invadir o espaço
      text(`${(cm / 100).toFixed(2)} m`, rulerX - 18, y);
    }
  }

  // Linha de referência "0" (apenas a linha verde)
  stroke("#18864b");
  strokeWeight(2.5);
  line(rulerX - 20, naturalY, rulerX + 20, naturalY);

  // ---- Indicador visual de deslocamento (Cota) na régua ----
  const displacementPx = barY - naturalY;
  
  if (Math.abs(displacementPx) > 2) {
    stroke(23, 105, 170, 200);
    strokeWeight(1.5);
    drawingContext.setLineDash([4, 4]);
    // A cota fica à direita da régua
    line(rulerX + 40, naturalY, rulerX + 40, barY);
    drawingContext.setLineDash([]);
    
    // Setas da cota
    line(rulerX + 40, naturalY, rulerX + 35, naturalY + 8);
    line(rulerX + 40, naturalY, rulerX + 45, naturalY + 8);
    
    line(rulerX + 40, barY, rulerX + 35, barY - 8);
    line(rulerX + 40, barY, rulerX + 45, barY - 8);

    // Texto horizontal, mais fácil de ler
    noStroke();
    fill("#1769aa");
    textSize(10);
    textStyle(BOLD);
    textAlign(LEFT, CENTER);
    const displacementCm = (Math.abs(displacementPx) / rulerPxPerMeter * 100).toFixed(2);
    text(`Deslocamento: ${displacementCm} cm`, rulerX + 50, (naturalY + barY) / 2);
    textStyle(NORMAL);
  }
}

// ----------------------------------------------------------------
// CIRCUITO 2 — ELETROÍMÃ
// ----------------------------------------------------------------
function drawCircuitTwo() {
  const mobile = width < 900;
  
  // Posiciona o circuito na parte inferior esquerda, abaixo do aparato
  const x0 = 40; 
  const y0 = height - (mobile ? 110 : 120);
  const w = 260;
  const h = 45;

  // Fundo do circuito
  noStroke();
  fill(255, 255, 255, 200);
  rect(x0 - 15, y0 - 30, w + 30, h + 60, 8);
  stroke(200, 210, 220);
  strokeWeight(1);
  noFill();
  rect(x0 - 15, y0 - 30, w + 30, h + 60, 8);

  // Fios do circuito
  stroke(78, 91, 102);
  strokeWeight(2);
  noFill();

  // Loop principal
  line(x0, y0, x0 + 30, y0); // Fio esquerdo
  line(x0 + 70, y0, x0 + 110, y0); // Fio meio
  line(x0 + 160, y0, x0 + w, y0); // Fio direito
  line(x0, y0, x0, y0 + h); // Desce esquerda
  line(x0 + w, y0, x0 + w, y0 + h); // Desce direita
  line(x0, y0 + h, x0 + w, y0 + h); // Fio inferior

  // Bateria (símbolo)
  strokeWeight(3);
  line(x0 + 38, y0 - 10, x0 + 38, y0 + 10); // Placa longa (+)
  line(x0 + 46, y0 - 6, x0 + 46, y0 + 6); // Placa curta (-)

  // Amperímetro (círculo)
  fill(255);
  strokeWeight(2);
  ellipse(x0 + 70, y0, 32, 32);
  noStroke();
  fill(45, 58, 67);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(11);
  text("A", x0 + 70, y0 + 1);

  // Resistor Variável (símbolo)
  stroke(78, 91, 102);
  strokeWeight(2);
  rect(x0 + 110, y0 - 8, 30, 16); // Corpo do resistor
  line(x0 + 105, y0 + 12, x0 + 145, y0 - 12); // Seta do variável

  // Solenoide (Bobina)
  noStroke();
  fill(230, 240, 250);
  rect(x0 + 160, y0 - 12, 50, 24, 3); // Núcleo
  stroke(23, 105, 170); // Cor do fio da bobina
  strokeWeight(2);
  for (let i = 0; i < 6; i++) {
    let coilX = x0 + 160 + (i * 9);
    line(coilX, y0 - 14, coilX, y0 + 14);
  }
  
  // Linhas de campo saindo do solenoide em direção à barra
  stroke(23, 105, 170, 100);
  strokeWeight(1.5);
  drawingContext.setLineDash([5, 4]);
  line(x0 + w, y0 + 7, fieldCenterX + 25, fieldCenterY + 30);
  drawingContext.setLineDash([]);

  // Textos
  noStroke();
  fill(68, 83, 95);
  textSize(10);
  textStyle(BOLD);
  textAlign(LEFT, BASELINE);
  text("Circuito 2 — Eletroímã", x0, y0 - 20);
  textStyle(NORMAL);
  textSize(9);
  text("V", x0 + 38, y0 + 20);
  text("R", x0 + 120, y0 + 20);
  text("Bobina", x0 + 165, y0 + 20);
}

// ----------------------------------------------------------------
// HUD
// ----------------------------------------------------------------
function drawHUD() {
  const mobile = width < 900;
  const w = mobile ? Math.min(290, width - 30) : 260;
  const h = mobile ? 112 : 125;
  
  // Posiciona o HUD no canto superior direito do canvas
  const x = width - w - 20; 
  const y = 60;

  noStroke();
  fill(255, 255, 255, 242);
  rect(x, y, w, h, 10);
  stroke(211, 222, 230);
  strokeWeight(1);
  noFill();
  rect(x, y, w, h, 10);

  noStroke();
  fill("#0d4775");
  textSize(11);
  textStyle(BOLD);
  text("HUD — grandezas do modelo", x + 11, y + 19);
  textStyle(NORMAL);

  const P = massa * g;
  const Rideal = requiredResistance();
  const Bideal = Kb * (V / Rideal);
  const dx = ((challengeState === "success" ? 0 : springDeformation) * 100).toFixed(2);

  fill("#34495e");
  textSize(9);
  const lines = [
    `m = ${massa.toFixed(3)} kg`,
    `k = ${k.toFixed(1)} N/m`,
    `V = ${V.toFixed(2)} V`,
    `i_fio = ${i_fio.toFixed(2)} A`,
    `P = ${P.toFixed(3)} N`,
    `Δx_mola = ${dx} cm`,
    `B* = ${Bideal.toFixed(3)} T`
  ];

  for (let i = 0; i < lines.length; i++) {
    text(lines[i], x + 11, y + 36 + i * 12);
  }

  let stateText = "Aguardando R...";
  let stateColor = "#66788a";
  if (challengeState === "success") {
    stateText = "SUCESSO";
    stateColor = "#18864b";
  } else if (challengeState === "error") {
    stateText = "ERRO";
    stateColor = "#c62828";
  }
  fill(stateColor);
  textStyle(BOLD);
  textAlign(RIGHT, BASELINE);
  text(stateText, x + w - 11, y + 19);
  textAlign(LEFT, BASELINE);
  textStyle(NORMAL);
}

// ----------------------------------------------------------------
// MENSAGEM DE SUCESSO
// ----------------------------------------------------------------
function drawSuccessMessage() {
  const boxW = Math.min(390, width * 0.42);
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
  const visible = Math.sin(errorBlink) > 0;
  if (!visible) return;

  const boxW = Math.min(360, width * 0.40);
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
    return;
  }

  setChallengeError();

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
  k = random(45, 75);
  V = random(7, 12);
  i_fio = random(2.5, 4.5);
  k = Number(k.toFixed(1));
  V = Number(V.toFixed(2));
  i_fio = Number(i_fio.toFixed(2));
  barY = 0;
}

// ----------------------------------------------------------------
// RESISTÊNCIA IDEAL
// ----------------------------------------------------------------
function requiredResistance() {
  const P = massa * g;
  return (Kb * V * i_fio * L) / P;
}

// ----------------------------------------------------------------
// CAMPOS HIDDEN DO RELATÓRIO
// ----------------------------------------------------------------
function updateSimulatorHiddenFields(R = null, B = null, Fm = null, P = null, error = null) {
  const resistance = R !== null ? R : (parseFloat(resistanceInput?.value) || NaN);
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
  setHidden("sim-spring-deformation",
            ((challengeState === "success" ? 0 : springDeformation) * 100).toFixed(4));
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
    massValue.textContent = massa.toFixed(3).replace(".", ",") + " kg";
  }
}

function drawArrow(x1, y1, x2, y2, colorValue) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
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
  if (!Number.isFinite(barY)) {
    barY = naturalY;
  }
}
