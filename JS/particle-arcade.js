const canvas = document.getElementById("particle-canvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const COLOR_POOL = [
  "#00fff9",
  "#ff00de",
  "#fff100",
  "#00ff88",
  "#ff6b00"
];

const COLOR_PALETTE = {
  default: COLOR_POOL,
  correct: ["#00ff88"], // verde
  wrong: ["#ff4444"],   // vermelho
  bonus: ["#00eaff"]
};

let currentPalette = COLOR_PALETTE.default;
let isGlobalFlash = false;

const particles = [];
const PARTICLE_COUNT = 500;

class Particle {
  constructor() { this.reset(); }
  reset(x = Math.random() * canvas.width, y = Math.random() * canvas.height) {
    this.x = x; this.y = y;
    this.size = Math.random() * 3 + 1;
    this.speedX = (Math.random() - 0.5) * 2;
    this.speedY = (Math.random() - 0.5) * 2;
    this.alpha = Math.random() * 0.8 + 0.2;
    this.life = Math.random() * 150 + 100;
    this.color = currentPalette[Math.floor(Math.random() * currentPalette.length)];
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life--;
    this.speedX += (Math.random() - 0.5) * 0.05;
    this.speedY += (Math.random() - 0.5) * 0.05;
    if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
    if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
    if (this.life <= 0) this.reset();
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size * 1.8, this.size * 1.8);
    ctx.restore();
  }
}

for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

function animateParticles() {
  // deixa a trilha suave por cima do fundo (ajuste conforme seu design)
  ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const p of particles) {
    p.update();
    // Se estiver em flash global, força a cor principal para todas as partículas
    if (isGlobalFlash) {
      p.color = currentPalette[0];
    } else if (Math.random() < 0.01) {
      p.color = currentPalette[Math.floor(Math.random() * currentPalette.length)];
    }
    p.draw();
  }
  requestAnimationFrame(animateParticles);
}
animateParticles();

function flashAllParticles(palette, duration = 1000) {
  isGlobalFlash = true;
  currentPalette = palette;
  // força a cor principal em todas as partículas imediatamente
  for (const p of particles) p.color = palette[0];
  setTimeout(() => {
    isGlobalFlash = false;
    currentPalette = COLOR_PALETTE.default;
  }, duration);
}

function spawnBurst(palette) {
  for (let i = 0; i < 40; i++) {
    const p = new Particle();
    p.x = canvas.width / 2 + (Math.random() - 0.5) * 200;
    p.y = canvas.height / 2 + (Math.random() - 0.5) * 200;
    p.size = Math.random() * 4 + 2;
    p.color = palette[Math.floor(Math.random() * palette.length)];
    p.speedX = (Math.random() - 0.5) * 5;
    p.speedY = (Math.random() - 0.5) * 5;
    particles.push(p);
  }
}

function triggerParticleEffect(type) {
  switch (type) {
    case "correct":
      flashAllParticles(COLOR_PALETTE.correct, 900);
      spawnBurst(COLOR_PALETTE.correct);
      break;
    case "wrong":
      flashAllParticles(COLOR_PALETTE.wrong, 900);
      spawnBurst(COLOR_PALETTE.wrong);
      break;
    case "bonus":
      flashAllParticles(COLOR_PALETTE.bonus, 1200);
      spawnBurst(COLOR_PALETTE.bonus);
      break;
    default:
      flashAllParticles(COLOR_PALETTE.default, 600);
      spawnBurst(COLOR_PALETTE.default);
  }
}
