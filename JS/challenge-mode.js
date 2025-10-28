/* =======================================================
   MODO DESAFIO (resiliente à ordem de carregamento)
   - 15 rodadas
   - 5s por rodada (tempo esgotado = erro)
   - integração segura com script.js original
   ======================================================= */

(function(){
  // --- Configurações e pool de imagens ---
  const CHALLENGE_IMAGES = [];
  let challengePool = [];
  const TIME_PER_ROUND = 5; // segundos
  let challengeTimer = 0;
  let challengeTimerInterval = null;

  // Arquivos (ajuste se precisar)
  const files = [
    "humano (1).jpg","humano (2).jpg","humano (3).jpg","humano (4).jpg","humano (5).jpg",
    "humano (6).jpg","humano (7).jpg","humano (8).jpg",
    "humano (9).jpg","humano (10).jpg","humano (11).jpg","humano (12).jpg","humano (13).jpg",
    "humano (14).jfif","humano (15).jfif","ai (1).png","ai (2).png","ai (3).png","ai (4).png","ai (5).png","ai (6).png"
    ,"ai (7).png","ai (8).png","ai (9).png","ai (10).png","ai (11).png","ai (12).png","ai (13).png","ai (14).png","ai (15).png"
  ];


  function loadChallengeImages() {
    CHALLENGE_IMAGES.length = 0;
    files.forEach(f => {
      const type = f.toLowerCase().includes("ai") ? "ai" : "human";
      const url = `./Imagens/desafio/${f}`;
      CHALLENGE_IMAGES.push({ url, type });
      // pré-carrega
      const i = new Image();
      i.src = url;
      i.onerror = () => console.warn(`⚠️ Imagem (desafio) não encontrada: ${url}`);
    });
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function initChallengePool() {
    loadChallengeImages();
    challengePool = shuffle([...CHALLENGE_IMAGES]);
  }

  function getNextChallengeImage() {
    if (!challengePool || challengePool.length === 0) initChallengePool();
    return challengePool.pop();
  }

  // Expõe as funções (caso script.js chame diretamente)
  window.initChallengePool = initChallengePool;
  window.getNextChallengeImage = getNextChallengeImage;

  // --- Funções do temporizador / timeout ---
  function clearChallengeTimer() {
    if (challengeTimerInterval) {
      clearInterval(challengeTimerInterval);
      challengeTimerInterval = null;
    }
  }

  function startChallengeTimer() {
    // se não existir o elemento timerText, só guarda e retorna
    if (typeof timerText === "undefined") return;
    challengeTimer = TIME_PER_ROUND;
    timerText.textContent = `⏱️ ${challengeTimer}s`;
    clearChallengeTimer();
    challengeTimerInterval = setInterval(() => {
      challengeTimer--;
      timerText.textContent = `⏱️ ${challengeTimer}s`;
      if (challengeTimer <= 0) {
        clearChallengeTimer();
        // handleTimeOut deve existir após patch; chamamos a versão interna abaixo
        if (typeof handleTimeOut === "function") handleTimeOut();
        else {
          // fallback: marca como erro e avança
          if (typeof canAnswer !== "undefined" && canAnswer) {
            // simula um timeout: marca erro similar ao handleGuess
            canAnswer = false;
            if (typeof showPointPopup === "function") showPointPopup("-200", "#ff4444");
            if (typeof triggerParticleEffect === "function") triggerParticleEffect("wrong");
            if (typeof updateScoreDisplay === "function") updateScoreDisplay();
            if (typeof updateComboDisplay === "function") updateComboDisplay();
            // agenda próxima rodada
            if (typeof roundTimeout !== "undefined") {
              roundTimeout = setTimeout(() => {
                if (typeof nextRound === "function") nextRound();
              }, 2000);
            }
          }
        }
      }
    }, 1000);
  }

  // Este handler será chamado quando o tempo acabar (versão usada após patch)
  function handleTimeOut() {
    if (typeof canAnswer === "undefined" || !canAnswer) return;
    canAnswer = false;
    // feedback visual
    if (typeof feedback !== "undefined") {
      try { feedback.textContent = "⌛ Tempo esgotado!"; feedback.style.color = "#ff4444"; } catch(e) {}
    }
    // mantém a mesma penalidade do handleGuess
    if (typeof comboCount !== "undefined") comboCount = 0;
    if (typeof failCombo !== "undefined") failCombo++;
    const penalty = (typeof failCombo !== "undefined") ? (failCombo * 200) : 200;
    if (typeof score !== "undefined") score -= penalty;
    if (typeof showPointPopup === "function") showPointPopup(`-${penalty}`, "#ff4444");
    if (typeof triggerParticleEffect === "function") triggerParticleEffect("wrong");
    if (typeof updateScoreDisplay === "function") updateScoreDisplay();
    if (typeof updateComboDisplay === "function") updateComboDisplay();
    // aguarda 2s e chama nextRound
    if (typeof nextRound === "function") {
      roundTimeout = setTimeout(nextRound, 2000);
    }
  }

  // --- Apply patches quando as funções do script.js existirem ---
  const maxTries = 200; // ~20s de polling
  let tries = 0;
  const poll = setInterval(() => {
    tries++;
    // precisamos de nextRound e handleGuess (e idealmente endGame)
    const hasNext = (typeof nextRound === "function");
    const hasHandleGuess = (typeof handleGuess === "function");
    const hasEnd = (typeof endGame === "function");
    if (!hasNext && tries > maxTries) {
      clearInterval(poll);
      console.warn("challenge-mode: nextRound não detectado — patch não aplicado.");
      return;
    }
    if (hasNext && hasHandleGuess && hasEnd) {
      clearInterval(poll);

      // Salva originais
      const origNextRound = nextRound;
      const origEndGame = endGame;
      const origHandleGuess = handleGuess;

      // Patch: handleGuess -> limpar temporizador do desafio quando o jogador responde
      handleGuess = function(choice) {
        clearChallengeTimer();
        try { return origHandleGuess(choice); } catch(e) { console.error(e); }
      };

      // Patch: nextRound -> se mode === 'challenge', usar pool de desafio e temporizador
      nextRound = function() {
        // se não estivermos no modo challenge, delega ao original
        if (mode !== "challenge") {
          clearChallengeTimer();
          return origNextRound();
        }

        clearChallengeTimer();

        const maxRounds = 15;
        if (typeof round === "number" && round >= maxRounds) return endGame();

        // incrementa rodada e atualiza UI (mesma lógica do original)
        if (typeof round === "number") round++;
        if (typeof roundText !== "undefined") roundText.textContent = `${round}/${maxRounds}`;
        if (typeof feedback !== "undefined") feedback.textContent = "";
        if (typeof timerText !== "undefined") timerText.textContent = "";
        if (typeof canAnswer !== "undefined") canAnswer = true;

        // pega imagem do desafio
        const img = getNextChallengeImage();
        if (img && img.url) {
          try {
            gameImage.src = img.url;
            gameImage.dataset.type = img.type;
          } catch(e) { console.error("challenge-mode: erro ao setar imagem", e); }
        }

        // inicia temporizador do desafio
        startChallengeTimer();
      };

      // Patch: endGame -> se modo challenge, usa mensagens humorísticas, senão delega
      endGame = function() {
        clearChallengeTimer();
        if (mode !== "challenge") return origEndGame();

        // comportamento parecido com o endGame do original, mas com mensagens diferentes
        try {
          gameScreen.classList.remove("active");
          endScreen.classList.add("active");
          // dentro do patch endGame do challenge-mode.js: substituir
// document.getElementById("final-score").textContent = correctAnswers;
// por:
const finalHitsElPatch = document.getElementById("final-hits");
if (finalHitsElPatch) finalHitsElPatch.textContent = correctAnswers;

// e, se quiser mostrar o score também (usar a variável score):
const finalPointsElPatch = document.getElementById("final-points");
if (finalPointsElPatch) finalPointsElPatch.textContent = (typeof score === "number") ? score : 0;

          if (typeof finalHighscoreText !== "undefined") finalHighscoreText.textContent = highscore;

          const title = document.getElementById("final-title");
          title.style.fontSize = "1.4rem";
          title.classList.add("glitch");

          let prize = "";
          if (correctAnswers <= 3) {
              prize = "IA riu de você";
              title.textContent = "Derrota tecnológica!";
          } else if (correctAnswers <= 6) {
              prize = "A IA continua vitoriosa";
              title.textContent = "Quase um humano 2.0!";
          } else if (correctAnswers <= 9) {
              prize = "Resistiu bem!";
              title.textContent = "Humano em evolução!";
          } else if (correctAnswers <= 12) {
              prize = "Dominou a máquina!";
              title.textContent = "Herói cibernético!";
          } else if (correctAnswers <= 14) {
              prize = "Gênio da adivinhação!";
              title.textContent = "MESTRE DA PERCEPÇÃO";
          } else {
              prize = "Lenda digital!";
              title.textContent = "A IA se ajoelha diante de você!";
          }

          document.getElementById("prize").textContent = prize;
        } catch (e) {
          console.error("challenge-mode: erro no endGame patch", e);
          return origEndGame();
        }
      };

      // Pronto — patch aplicado
      console.info("challenge-mode: patch aplicado com sucesso.");
    }
  }, 100);

})();
