import confetti from 'canvas-confetti';

/**
 * Dispara uma celebração V2.7 — Show de Fogos de Artifício com Grand Finale Arco-Íris.
 * Combina elegância corporativa no início com uma explosão de cores vibrantes no final.
 */
export function fireExtravagantConfetti() {
  const duration = 9 * 1000; // Estendido para 9 segundos para acomodar o show completo
  const animationEnd = Date.now() + duration;
  
  const appColors = ['#3b82f6', '#6366f1', '#f59e0b', '#ffffff', '#a855f7'];
  const goldColors = ['#f59e0b', '#FFD700', '#ffffff'];
  const rainbowColors = ['#ff0000', '#ffa500', '#ffff00', '#008000', '#0000ff', '#4b0082', '#ee82ee'];

  const randomInRange = (min, max) => Math.random() * (max - min) + min;

  // 1. SHOW DE FOGOS CORPORATIVOS (Primeiros 7 segundos)
  const fireworkInterval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    // Parar os fogos normais um pouco antes do Grand Finale
    if (timeLeft <= 2000) return clearInterval(fireworkInterval);

    const x = randomInRange(0.1, 0.9);
    const y = randomInRange(0.1, 0.4);
    
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 180,
        startVelocity: 45,
        origin: { x, y },
        colors: Math.random() > 0.5 ? appColors : goldColors,
        zIndex: 999999,
        scalar: 1.2,
        gravity: 0.7,
        shapes: ['circle'],
        ticks: 200
      });

      // Efeito de "Crackle" (Estrelinhas brancas)
      setTimeout(() => {
        confetti({
          particleCount: 40,
          spread: 360,
          startVelocity: 20,
          origin: { x, y },
          colors: ['#ffffff'],
          zIndex: 999999,
          scalar: 0.7,
          shapes: ['star'],
          gravity: 0.4,
          ticks: 100
        });
      }, 100);
    }, randomInRange(10, 500));
  }, 900);

  // 2. CHUVA LATERAL (Para preencher o fundo)
  const rainInterval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 2500) return clearInterval(rainInterval);

    confetti({
      particleCount: 20,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.7 },
      colors: appColors,
      zIndex: 999999,
      scalar: 1,
      gravity: 1.2
    });

    confetti({
      particleCount: 20,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.7 },
      colors: appColors,
      zIndex: 999999,
      scalar: 1,
      gravity: 1.2
    });
  }, 450);

  // 3. O GRANDE FINAL ARCO-ÍRIS (Barragem de cores vibrantes)
  // Ativa nos últimos 2 segundos da animação
  setTimeout(() => {
    const burstRainbow = (x, delay) => {
      setTimeout(() => {
        confetti({
          particleCount: 500,
          spread: 360,
          startVelocity: 70,
          origin: { x, y: 0.5 },
          colors: rainbowColors,
          zIndex: 999999,
          scalar: 2.2,
          ticks: 400,
          gravity: 0.9,
          shapes: ['circle', 'star']
        });
      }, delay);
    };

    // Sequência final de explosões massivas
    burstRainbow(0.2, 0);      // Explosão Esquerda
    burstRainbow(0.8, 400);    // Explosão Direita
    burstRainbow(0.5, 800);    // Explosão Central (O Clímax)
    
    // Chuva de encerramento
    setTimeout(() => {
      confetti({
        particleCount: 200,
        spread: 160,
        origin: { y: 0.3 }, // Caindo bem de cima
        colors: rainbowColors,
        zIndex: 999999,
        scalar: 1.5,
        gravity: 0.5
      });
    }, 1200);
    
  }, 7000);
}
