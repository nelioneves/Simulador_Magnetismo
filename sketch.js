let y, vel, acel;
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
  acel = 0;
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

  // 1. O aluno aplica R. O sistema calcula a física resultante:
  let i_bobina = V / R;          // Lei de Ohm no eletroímã
  let B = Kb * i_bobina;         // Campo magnético gerado
  let Fm = B * i_fio * L;        // Força magnética no fio
  let P = m * g;                 // Força Peso
  
  // 2. Verificação com margem de tolerância de 3%
  let erroRelativo = abs(Fm - P) / P;
  
  if (erroRelativo <= 0.03) {
    estado = "sucesso";
    y = y0; // Força perfeitamente para o zero visualmente
    vel = 0;
    acel = 0;
  } else {
    estado = "erro";
    msgTimer = millis() + 3500; // Tela de erro fica por 3.5 segundos
  }
}

function draw() {
  background(240);
  
  // HUD - Dados para o aluno calcular
  fill(0);
  noStroke();
  textSize(15);
  textAlign(LEFT);
  text(`DADOS DO SISTEMA FISÍCO:`, 20, 30);
  text(`Massa do fio (m): ${m.toFixed(3)} kg`, 20, 50);
  text(`Comprimento (L): ${L.toFixed(1)} m`, 20, 70);
  text(`Gravidade (g): ${g.toFixed(1)} m/s²`, 20, 90);
  
  text(`DADOS ELÉTRICOS:`, 20, 130);
  text(`Corrente no fio (i_fio): ${i_fio.toFixed(2)} A`, 20, 150);
  text(`Tensão do eletroímã (V): ${V.toFixed(1)} V`, 20, 170);
  text(`Constante do ímã (Kb): ${Kb.toFixed(3)} T/A`, 20, 190);
  text(`Fórmula do campo: B = Kb * (V / R)`, 20, 210);

  // Física de oscilação inicial (apenas quando neutro)
  if (estado === "neutro") {
    let P = m * g;
    let Fe = 2 * k * (y - y0); // Duas molas
    let forcaResultante = (P - Fe) * 10; 
    
    acel = forcaResultante / m;
    vel += acel * 0.05; 
    vel *= 0.92; 
    y += vel;
  }

  // Desenhos
  drawRuler();
  
  // Teto
  fill(100);
  rect(300, 20, 300, 20);
  
  // Molas
  stroke(150);
  strokeWeight(3);
  drawSpring(350, 40, y);
  drawSpring(550, 40, y);
  
  // Fio condutor
  stroke(184, 115, 51); 
  strokeWeight(8);
  line(330, y, 570, y);
  
  // Feedback Visual e de Estado
  if (estado === "sucesso") {
    drawMagneticField(); // Mostra o campo ligando
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
    
    if (millis() > msgTimer) {
      resetSystem();
    }
  }

  // Deformação da mola
  fill(0);
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
  textSize(12);
  textAlign(RIGHT, CENTER);
  for(let p = 50; p <= 400; p += 25) {
    line(620, p, 635, p);
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
      // Desenhando os X (Campo Entrando)
      line(px - 6, py - 6, px + 6, py + 6);
      line(px + 6, py - 6, px - 6, py + 6);
    }
  }
}