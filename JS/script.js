/* =======================================================
   IA vs HUMANO - ARCADE (script.js atualizado)
   Base: seu código. Correções:
   - combo fix: posicionado sobre a imagem (absolute)
   - partículas ficam todas verdes/vermelhas em acertos/erros
   - "Jogar Novamente" reinicia direto da rodada 1 no modo atual
   ======================================================= */

const images = [];
let mode = "classic",
    score = 0,
    round = 0,
    correctAnswers = 0;
let comboCount = 0,
    failCombo = 0;
let timerInterval = null,
    roundTimeout = null;
const DELAY_NEXT_ROUND = 4000;

const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const endScreen = document.getElementById("end-screen");
const gameImage = document.getElementById("game-image");
const feedback = document.getElementById("feedback");
const roundText = document.getElementById("round");
const scoreText = document.getElementById("score");
const timerText = document.getElementById("timer");
const popups = document.getElementById("popups");
const highscoreText = document.getElementById("highscore");
const finalHighscoreText = document.getElementById("final-highscore");
const themeButton = document.getElementById("toggle-theme");

/* ---------------- COMBO TEXT: anexado ao container da imagem ----------------
   Antes estava position: fixed; agora é absolute dentro do elemento .image-card
   Isso evita deslocamento na rolagem e problemas de z-index. */
let comboText = document.createElement("div");
comboText.id = "combo";
comboText.style.position = "absolute";
comboText.style.top = "8%"; // ajustável
comboText.style.left = "50%";
comboText.style.transform = "translateX(-50%)";
comboText.style.zIndex = "999";
comboText.style.textAlign = "center";
comboText.style.fontFamily = `"Press Start 2P", cursive`;
comboText.style.fontSize = "0.9rem";
comboText.style.pointerEvents = "none";
comboText.style.transition = "opacity 0.5s ease";
comboText.style.opacity = "0";

// garante que o parent (image-card) seja relativo e anexa o combo lá
const imageCard = document.querySelector(".image-card") || gameImage.parentElement;
if (imageCard) {
    const prevPos = getComputedStyle(imageCard).position;
    if (prevPos === "static") imageCard.style.position = "relative";
    imageCard.appendChild(comboText);
} else {
    // fallback: anexa ao game container se não encontrar
    const gameContainer = document.querySelector(".game-container") || document.body;
    if (getComputedStyle(gameContainer).position === "static") gameContainer.style.position = "relative";
    gameContainer.appendChild(comboText);
}

let activePopups = [];
let prevCombo = 0, prevFailCombo = 0;

function readHighScore() {
    const s = localStorage.getItem("ivsh_highscore");
    return s ? parseInt(s, 10) : 0;
}
function writeHighScore(val) {
    localStorage.setItem("ivsh_highscore", String(val));
}
let highscore = readHighScore();
highscoreText.textContent = highscore;
finalHighscoreText.textContent = highscore;

const CLASSIC_IMAGES = [];
function loadClassicImages() {
    const files = [
        "humano1.jpg","humano2.jpg","humano3.jpg","humano4.jpg","humano5.jpg",
        "humano6.jpg","humano7.jpg","humano8.jpg","humano9.jpg","humano10.jpg",
        "ai1.png","ai2.png","ai3.png","ai4.png","ai5.png",
        "ai6.png","ai7.jpg","ai8.jpg","ai9.jpg","ai10.jpg"
    ];
    CLASSIC_IMAGES.length = 0;
    files.forEach(f => {
        const type = f.toLowerCase().includes("ai") ? "ai" : "human";
        const url = `./Imagens/classico/${f}`;
        CLASSIC_IMAGES.push({url, type});
        const img = new Image();
        img.src = url;
        img.onerror = () => console.warn(`⚠️ Imagem não encontrada: ${url}`);
    });
}
function shuffleImages(list) {
    const arr = list.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
let classicPool = [];
function initClassicPool() {
    loadClassicImages();
    classicPool = shuffleImages([...CLASSIC_IMAGES]);
}
function getNextClassicImage() {
    if (classicPool.length === 0) initClassicPool();
    return classicPool.pop();
}

function startGame(selectedMode) {
    mode = selectedMode;
    score = 0; round = 0; comboCount = 0; failCombo = 0; correctAnswers = 0;
    startScreen.classList.remove("active");
    endScreen.classList.remove("active");
    gameScreen.classList.add("active");
    updateScoreDisplay();
    updateComboDisplay();
    if (mode === "classic") initClassicPool();
    nextRound();
}
let canAnswer = false;

function nextRound() {
    clearInterval(timerInterval);
    clearTimeout(roundTimeout);

    const maxRounds = (mode === "classic") ? 10 : 15; // ← aqui
    if (round >= maxRounds) return endGame();

    round++;
    roundText.textContent = `${round}/${maxRounds}`; // ← aqui atualiza o contador corretamente
    feedback.textContent = "";
    timerText.textContent = "";
    canAnswer = true;

    if (mode === "classic") {
        const img = getNextClassicImage();
        gameImage.src = img.url;
        gameImage.dataset.type = img.type;
    } else {
        gameImage.src = "https://via.placeholder.com/700x400?text=Modo+Desafio+Em+Breve";
        gameImage.dataset.type = Math.random() > 0.5 ? "human" : "ai";
    }
}


function showPointPopup(text, bg = "#00ff88") {
    const popup = document.createElement("div");
    popup.className = "point-popup";
    popup.textContent = text;

    if (bg === "#ff4444") popup.classList.add("negative");
    else if (bg === "#ffdb4d") popup.classList.add("highlight");
    else popup.classList.add("positive");

    const rect = gameImage.getBoundingClientRect();
    const containerRect = gameImage.parentElement.getBoundingClientRect();

    let left, top;
    let tries = 0;
    const minDistX = 70;
    const minDistY = 40;

    do {
        left = (rect.left - containerRect.left) + rect.width / 2 + (Math.random() - 0.5) * 120;
        top = (rect.top - containerRect.top) + rect.height / 2 + (Math.random() - 0.5) * 60;
        tries++;
    } while(activePopups.some(p => Math.abs(p.x - left) < minDistX && Math.abs(p.y - top) < minDistY) && tries < 20);

    activePopups.push({x: left, y: top});
    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;

    popups.appendChild(popup);

    setTimeout(() => popup.classList.add("visible"), 10);
    setTimeout(() => popup.classList.remove("visible"), 1200);
    setTimeout(() => {
        popup.remove();
        activePopups = activePopups.filter(p => p.x !== left || p.y !== top);
    }, 1800);
}

function updateComboDisplay() {
    if (!comboText) return;

    clearTimeout(comboText._hideTimeout);

    let msg = "";
    let color = "";
    let anim = "";

    if (comboCount > 1) {
        switch(comboCount) {
            case 2: msg = "Dupla perfeita!"; break;
            case 3: msg = "Trinca lendária!"; break;
            case 4: msg = "Sequência incrível!"; break;
            case 5: msg = "Mega combo!"; break;
            case 6: msg = "Super combo!"; break;
            case 7: msg = "Continue assim"; break;
            case 8: msg = "Impressionante"; break;
            case 9: msg = "PARABENS"; break;
            case 10: msg = "CRAQUE"; break;
            case 11: msg = "LENDA"; break;
            case 12: msg = "Sabe muito"; break;
            case 13: msg = "AURA + EGO"; break;
            case 14: msg = "Adivinhador nato"; break;
            case 15: msg = "MESTRE"; break;
            default: msg = `Super craque! x${comboCount}`; break;
        }
        color = "#00ff88";
        anim = "neonPulse 1s infinite alternate";

        if (prevCombo !== comboCount) {
            const arcadeMsgs = ["EXTRA!", "COOL!", "NICE!", "AWESOME!", "PERFECT!"];
            showPointPopup(arcadeMsgs[Math.floor(Math.random()*arcadeMsgs.length)], "#00ff88");
            // aciona partículas verdes
            if (typeof triggerParticleEffect === "function") triggerParticleEffect("correct");
            prevCombo = comboCount;
            prevFailCombo = 0;
        }
    }

    else if (failCombo > 1) {
        switch(failCombo) {
            case 2: msg = "Quase!"; break;
            case 3: msg = "Trinca perdida!"; break;
            case 4: msg = "Sequência de erros!"; break;
            case 5: msg = "Cuidado!"; break;
            case 6: msg = "Atenção!"; break;
            case 7: msg = "Está indo para um caminho perigoso!"; break;
            case 8: msg = "Pare de errar!"; break;
            case 9: msg = "Acerte uma por favor!"; break;
            case 10: msg = "-1000 DE AURA"; break;
            case 11: msg = "LOSER"; break;
            case 12: msg = "Seus prêmios estão sumindo"; break;
            case 13: msg = "Faça alguns pontos"; break;
            case 14: msg = "Está indo para o GAME OVER"; break;
            case 15: msg = "GAME OVER"; break;
            default: msg = `Cuidado! -${failCombo * 150}`; break;
        }
        color = "#ff4444";
        anim = "neonPulseRed 1s infinite alternate";

        if (prevFailCombo !== failCombo) {
            const arcadeMsgs = ["OOPS!", "MISS!", "TRY AGAIN!", "OUCH!", "FAIL!"];
            showPointPopup(arcadeMsgs[Math.floor(Math.random()*arcadeMsgs.length)], "#ff4444");
            // aciona partículas vermelhas
            if (typeof triggerParticleEffect === "function") triggerParticleEffect("wrong");
            prevFailCombo = failCombo;
            prevCombo = 0;
        }
    }

    if (msg) {
        comboText.textContent = msg;
        comboText.style.color = color;
        comboText.style.animation = anim;
        comboText.style.opacity = "1";
        comboText._hideTimeout = setTimeout(() => {
            comboText.style.opacity = "0";
        }, 1500);
    } else {
        comboText.textContent = "";
        comboText.style.opacity = "0";
        comboText.style.animation = "";
    }
}

function handleGuess(choice) {
    if (!canAnswer) return;
    canAnswer = false;
    clearInterval(timerInterval);
    clearTimeout(roundTimeout);

    const correct = gameImage.dataset.type;
    if (choice === correct) {
        feedback.textContent = "✅ Acertou!";
        feedback.style.color = "#00ff88";
        comboCount++;
        failCombo = 0;
        correctAnswers++;
        const bonus = 100 * comboCount;
        score += bonus;
        showPointPopup(`+${bonus}`, "#00ff88");
        if (typeof triggerParticleEffect === "function") triggerParticleEffect("correct");
    } else {
        feedback.textContent = "❌ Errou!";
        feedback.style.color = "#ff4444";
        comboCount = 0;
        failCombo++;
        const penalty = failCombo * 200;
        score -= penalty;
        showPointPopup(`-${penalty}`, "#ff4444");
        if (typeof triggerParticleEffect === "function") triggerParticleEffect("wrong");
    }

    updateScoreDisplay();
    updateComboDisplay();
    roundTimeout = setTimeout(nextRound, DELAY_NEXT_ROUND);
}

function updateScoreDisplay() {
    scoreText.textContent = score;
    if (score > highscore) {
        highscore = score;
        writeHighScore(highscore);
        highscoreText.textContent = highscore;
        finalHighscoreText.textContent = highscore;
        showPointPopup("NEW HI-SCORE", "#ffdb4d");
        if (typeof triggerParticleEffect === "function") triggerParticleEffect("bonus");
    }
}
function endGame() {
  // limpa timers / intervalos para evitar atualizações depois do fim
  clearInterval(timerInterval);
  clearTimeout(roundTimeout);

  // troca de telas (game -> end)
  gameScreen.classList.remove("active");
  endScreen.classList.add("active");

  // pega referências (usar sempre getElementById para evitar variáveis indefinidas)
  const finalHitsEl = document.getElementById("final-hits");
  const finalPointsEl = document.getElementById("final-points");
  const finalHighEl = document.getElementById("final-highscore");
  const prizeEl = document.getElementById("prize");
  const titleEl = document.getElementById("final-title");

  if (!finalHitsEl || !finalPointsEl || !finalHighEl || !prizeEl || !titleEl) {
    console.error("endGame: alguns elementos finais não foram encontrados.");
    return;
  }

  // usa os valores reais das variáveis do jogo
  const hits = Number.isFinite(correctAnswers) ? correctAnswers : 0;
  const finalScore = Number.isFinite(score) ? score : 0;
  const high = Number.isFinite(highscore) ? highscore : 0;

  // atualiza UI com os valores corretos
  finalHitsEl.textContent = hits;
  finalPointsEl.textContent = finalScore;
  finalHighEl.textContent = high;

  // título glitch
  titleEl.classList.add("glitch");
  titleEl.style.fontSize = "1.6rem";

  // mensagem personalizada baseada em acertos (mantém compatibilidade com ambos modos)
  let titleText = "";
  let prizeText = "";

  if (hits <= 3) {
    titleText = "GAME OVER";
    prizeText = "A IA riu de você.";
  } else if (hits <= 6) {
    titleText = "DERROTA TECNOLÓGICA!";
    prizeText = "Continue tentando!";
  } else if (hits <= 9) {
    titleText = "HUMANO EM EVOLUÇÃO!";
    prizeText = "Resistiu bem.";
  } else if (hits <= 12) {
    titleText = "HERÓI CIBERNÉTICO!";
    prizeText = "Dominou a máquina!";
  } else if (hits <= 14) {
    titleText = "VOCÊ ENGANOU A IA!";
    prizeText = "Gênio da adivinhação!";
  } else {
    titleText = "A IA SE AJOELHA DIANTE DE VOCÊ!";
    prizeText = "Lenda Digital!";
  }

  titleEl.textContent = titleText;
  prizeEl.textContent = prizeText;

  // atualiza highscore se necessário (mantém comportamento antigo)
  if (finalScore > high) {
    highscore = finalScore;
    writeHighScore(highscore);
    finalHighEl.textContent = highscore;
    if (typeof showPointPopup === "function") showPointPopup("NEW HI-SCORE", "#ffdb4d");
    if (typeof triggerParticleEffect === "function") triggerParticleEffect("bonus");
  }
}


/* restartGame agora reinicia direto a primeira rodada (modo atual) */
function restartGame() {
    // reseta estado e inicia de novo no mesmo modo
    score = 0;
    round = 0;
    comboCount = 0;
    failCombo = 0;
    correctAnswers = 0;
    updateScoreDisplay();
    updateComboDisplay();
    endScreen.classList.remove("active");
    gameScreen.classList.add("active");
    if (mode === "classic") initClassicPool();
    nextRound();
}

function goToStart() {
    clearInterval(timerInterval);
    clearTimeout(roundTimeout);
    gameScreen.classList.remove("active");
    endScreen.classList.remove("active");
    startScreen.classList.add("active");
    score = 0; round = 0; comboCount = 0; failCombo = 0; correctAnswers = 0;
    updateScoreDisplay();
    updateComboDisplay();
}

themeButton.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    document.body.classList.toggle("light");
});
