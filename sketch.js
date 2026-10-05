let y, vel;
let y0 = 150; 
let m, k, V, i_fio;
let L = 0.5; 
let g = 9.8; 
let Kb = 0.05; 
let pixelPorMetro = 800; // Escala visual ampliada

let estado = "neutro"; 
let msgTimer = 0;

function setup() {
  createCanvas(750, 480);
  resetSystem(); 
}

function resetSystem() {
  m = random(0.05, 0.15); // Massa controlada
  k = random(2, 5);       // Molas mais suaves para maior descida
  V = random(10, 50);       
  i_fio = random(1, 5);     
  
  y = y0;
  vel = 0;
  estado = "neutro";
  
  let inputR = document.getElementById('input_R');
  if(inputR) inputR.value = '';
}

function testarValores() {
  if (estado === "erro" || estado === "sucesso") return;
  
  let R = parseFloat(document.getElementById('input_R').value);
  if (isNaN(R) || R <= 0) {
    alert("Insira um valor válido de resistência maior que zero.");
    return;
  }

  let i_bobina = V / R;          
  let B = Kb * i_bobina;         
  let Fm = B * i_fio * L;        
  let P = m * g;                 
  
  let erroRelativo = abs(Fm - P) / P;
  
  if (erroRelativo <= 0.03) {
    estado = "sucesso";
  } else {
    estado = "erro";
    msgTimer = millis() + 3500; 
  }
}

function draw() {
  background(245);
  
  // Física do sistema
  if (estado === "neutro" || estado === "erro") {
    let deltaY_metros = (m * g) / (2 * k);
    let y_eq = y0 + (deltaY_metros * pixelPorMetro);
    let dist = y_eq - y;
    vel += dist * 0.08; 
    vel *= 0.85;        
    y += vel;
  } else if (estado === "sucesso") {
    let dist = y0 - y;
    vel += dist * 0.08;
    vel *= 0.85;
    y += vel;
  }

  // Textos e Painéis de Dados
  fill(0);
  noStroke();
  textSize(14);
  textAlign(LEFT);
  text(`DADOS DO SISTEMA FÍSICO:`, 20, 30);
  text(`Massa do fio (m): ${m.toFixed(3)} kg`, 20, 50);
  text(`Comprimento (L): ${L.toFixed(1)} m`, 20, 70);
  text(`Gravidade (g): ${g.toFixed(1)} m/s²`, 20, 90);
  
  text(`DADOS ELÉTRICOS:`, 20, 130);
  text(`Corrente no fio (i_fio): ${i_fio.toFixed(2)} A`, 20, 150);
  text(`Tensão da fonte (V): ${V.toFixed(1)} V`, 20, 170);
  text(`Constante do ímã (Kb): ${Kb.toFixed(3)} T/A`, 20, 190);
  text(`Fórmula do campo: B = Kb * (V / R)`, 20, 210);

  // Desenho dos Elementos Visuais
  drawCircuit();
  drawElectromagnet();
  drawMagneticField(estado === "sucesso");
  drawRuler();
  
  // Estrutura mecânica suspensa
  fill(120);
  noStroke(); 
  rect(330, 20, 260, 20); // Teto
  
  stroke(150);
  strokeWeight(3);
  drawSpring(360, 40, y);
  drawSpring(560, 40, y);
  
  stroke(184, 115, 51); 
  strokeWeight(8);
  line(340, y, 580, y); // Fio condutor central
  
  // Leitura da Deformação (Garante texto preto e legível)
  fill(0);
  noStroke(); 
  textSize(15);
  textAlign(LEFT);
  let deltaY_real = (y - y0) / pixelPorMetro;
  text(`Deformação (\u0394y): ${deltaY_real.toFixed(3)} m`, 420, 310);

  // Feedback de Estado e Avisos
  if (estado === "sucesso") {
    fill(0, 150, 0);
    noStroke();
    textSize(22);
    textAlign(CENTER);
    text("SUCESSO! A Força Magnética igualou o Peso.", 450, 440);
  } 
  else if (estado === "erro") {
    fill(200, 0, 0);
    noStroke();
    textSize(22);
    textAlign(CENTER);
    text("ERRO! Força desequilibrada.", 450, 430);
    let tempoRestante = Math.ceil((msgTimer - millis()) / 1000);
    textSize(14);
    text(`Reiniciando sistema com novos valores em ${tempoRestante}...`, 450, 455);
    if (millis() > msgTimer) resetSystem();
  }
}

function drawSpring(x, startY, endY) {
  let segments = 10;
  let segmentHeight = (endY - startY) / segments;
  noFill();
  beginShape();
  vertex(x, startY);
  for (let j = 1; j < segments; j++) {
    let offsetX = (j % 2 == 0) ? -15 : 15;
    vertex(x + offsetX, startY + j * segmentHeight);
  }
  vertex(x, endY);
  endShape();
}

function drawRuler() {
  stroke(0);
  strokeWeight(1);
  fill(255);
  rect(640, 50, 40, 350);
  
  fill(0);
  noStroke();
  textSize(12);
  textAlign(RIGHT, CENTER);
  for(let p = 50; p <= 400; p += 25) {
    stroke(0);
    strokeWeight(1);
    line(640, p, 655, p);
    noStroke();
    if(p === y0) {
      fill(255, 0, 0);
      text("0", 630, p); 
      fill(0);
    } else {
      let mark = (p - y0) / pixelPorMetro;
      text(mark.toFixed(3), 630, p);
    }
  }
}

function drawCircuit() {
  push();
  stroke(0);
  strokeWeight(2);
  noFill();

  rect(30, 270, 150, 100); 

  // Bateria (Fonte de Tensão)
  fill(245);
  noStroke();
  rect(15, 300, 30, 40); 
  stroke(0);
  strokeWeight(2);
  line(20, 310, 40, 310); // Negativo
  strokeWeight(4);
  line(10, 330, 50, 330); // Positivo
  noStroke();
  fill(0);
  textSize(14);
  textAlign(CENTER);
  text("V", 30, 290);

  // Resistor Variável
  fill(245);
  noStroke();
  rect(80, 260, 50, 20); 
  stroke(0);
  strokeWeight(2);
  beginShape();
  vertex(80, 270);
  vertex(90, 260); vertex(100, 280);
  vertex(110, 260); vertex(120, 280);
  vertex(130, 270);
  endShape();
  drawArrow(100, 290, 115, 250);
  noStroke();
  fill(0);
  text("R", 108, 240);

  // Ligações externas
  stroke(0);
  strokeWeight(2);
  line(180, 320, 230, 320); 
  line(230, 320, 230, 150); 
  line(230, 150, 320, 150); 
  pop();
}

function drawArrow(x1, y1, x2, y2) {
  push();
  stroke(0);
  strokeWeight(1.5);
  line(x1, y1, x2, y2);
  let angle = atan2(y2 - y1, x2 - x1);
  translate(x2, y2);
  rotate(angle);
  fill(0);
  triangle(0, 0, -6, 3, -6, -3);
  pop();
}

function drawElectromagnet() {
  push();
  fill(200);
  stroke(100);
  strokeWeight(2);
  rect(320, 70, 280, 200, 8); 
  fill(160);
  rect(320, 70, 40, 200, 8); 
  
  stroke(184, 115, 51); 
  strokeWeight(3);
  for(let i=80; i<260; i+=12) {
    line(315, i, 365, i+6);
  }
  pop();
}

function drawMagneticField(ativo) {
  push();
  let cor = ativo ? color(0, 0, 255, 220) : color(0, 0, 255, 30);
  stroke(cor);
  strokeWeight(2);
  let cols = 5;
  let rows = 3;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      let px = 390 + c * 45;
      let py = 110 + r * 50;
      line(px - 5, py - 5, px + 5, py + 5);
      line(px + 5, py - 5, px - 5, py + 5);
    }
  }
  
  fill(cor);
  noStroke();
  textSize(14);
  textAlign(LEFT);
  text("B (Entrando)", 460, 90);
  pop();
}
