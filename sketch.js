let y, vel;
let y0 = 150; 
let m, k, V, i_fio;
let L = 0.5; 
let g = 9.8; 
let Kb = 0.05; // Constante do eletroímã (T/A)

let estado = "neutro"; // neutro, sucesso, erro
let msgTimer = 0;

function setup() {
  createCanvas(700, 480);
  resetSystem(); // Gera os valores iniciais
}

function resetSystem() {
  m = random(0.05, 0.25);   // Massa do fio (kg)
  k = random(10, 30);       // Constante elástica
  V = random(10, 50);       // Tensão do eletroímã (Volts)
  i_fio = random(1, 5);     // Corrente no fio suspenso (A)
  
  y = y0;
  vel = 0;
  estado = "neutro";
  
  // Limpa o input do aluno
  let inputR = document.getElementById('input_R');
  if(inputR) inputR.value = '';
}

// Ativada pelo botão do HTML
function testarValores() {
  if (estado === "erro" || estado === "sucesso") return;
  
  let R = parseFloat(document.getElementById('input_R').value);
  if (isNaN(R) || R <= 0) {
    alert("Insira um valor válido de resistência maior que zero.");
    return;
  }

  // A validação do cálculo do aluno
  let i_bobina = V / R;          
  let B = Kb * i_bobina;         
  let Fm = B * i_fio * L;        
  let P = m * g;                 
  
  // Margem de tolerância de 3%
  let erroRelativo = abs(Fm - P) / P;
  
  if (erroRelativo <= 0.03) {
    estado = "sucesso";
  } else {
    estado = "erro";
    msgTimer = millis() + 3500; 
  }
}

function draw() {
  background(240);
  
  // NOVO MOTOR FÍSICO ESTÁVEL: Impede explosões numéricas e NaN
  if (estado === "neutro" || estado === "erro") {
    // Calcula o equilíbrio exato provocado apenas pelo Peso
    let y_eq = y0 + ((m * g) / (2 * k)) * 100;
    let dist = y_eq - y;
    vel += dist * 0.08; // Puxa para o equilíbrio
    vel *= 0.85;        // Amortecimento
    y += vel;
  } else if (estado === "sucesso") {
    // Anima o fio retornando perfeitamente para o zero
    let dist = y0 - y;
    vel += dist * 0.08;
    vel *= 0.85;
    y += vel;
  }

  // Painel de Dados
  fill(0);
  noStroke();
  textSize(15);
  textAlign(LEFT);
  text(`DADOS DO SISTEMA FÍSICO:`, 20, 30);
  text(`Massa do fio (m): ${m.toFixed(3)} kg`, 20, 50);
  text(`Comprimento (L): ${L.toFixed(1)} m`, 20, 70);
  text(`Gravidade (g): ${g.toFixed(1)} m/s²`, 20, 90);
  
  text(`DADOS ELÉTRICOS:`, 20, 130);
  text(`Corrente no fio (i_fio): ${i_fio.toFixed(2)} A`, 20, 150);
  text(`Tensão do eletroímã (V): ${V.toFixed(1)} V`, 20, 170);
  text(`Constante do ímã (Kb): ${Kb.toFixed(3)} T/A`, 20, 190);
  text(`Fórmula do campo: B = Kb * (V / R)`, 20, 210);

  // Cenário
  drawRuler();
  
  fill(100);
  noStroke(); // Evita herança de bordas indesejadas
  rect(300, 20, 300, 20); // Teto
  
  stroke(150);
  strokeWeight(3);
  drawSpring(350, 40, y);
  drawSpring(550, 40, y);
  
  stroke(184, 115, 51); 
  strokeWeight(8);
  line(330, y, 570, y); // Fio condutor
  
  // Feedback Dinâmico
  if (estado === "sucesso") {
    drawMagneticField(); 
    fill(0, 150, 0);
    noStroke();
    textSize(22);
    textAlign(CENTER);
    text("SUCESSO! O peso foi anulado.", 450, 430);
    textSize(14);
    text("Tire seu print agora.", 450, 455);
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

  // CORREÇÃO: Desliga a espessura do fio antes de escrever o texto da Deformação
  fill(0);
  noStroke(); 
  textSize(15);
  textAlign(LEFT);
  let deltaY = (y - y0) / 100;
  text(`Deformação (\u0394y): ${deltaY.toFixed(3)} m`, 400, 250);
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
  rect(620, 50, 40, 350);
  
  fill(0);
  noStroke();
  textSize(12);
  textAlign(RIGHT, CENTER);
  for(let p = 50; p <= 400; p += 25) {
    stroke(0);
    strokeWeight(1);
    line(620, p, 635, p);
    noStroke();
    if(p === y0) {
      fill(255, 0, 0);
      text("0", 610, p); 
      fill(0);
    } else {
      let mark = (p - y0) / 100;
      text(mark.toFixed(2), 610, p);
    }
  }
}

function drawMagneticField() {
  stroke(0, 0, 255, 120);
  strokeWeight(2);
  let cols = 6;
  let rows = 3;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      let px = 330 + c * 48;
      let py = 100 + r * 50;
      line(px - 6, py - 6, px + 6, py + 6);
      line(px + 6, py - 6, px - 6, py + 6);
    }
  }
}
