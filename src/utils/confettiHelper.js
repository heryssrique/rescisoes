import confetti from 'canvas-confetti';

/**
 * Dispara uma animação luxuosa e "pesada" de confetes.
 * Inclui canhões laterais, fogos de artifício no centro e brilhos (stars).
 */
export function fireExtravagantConfetti() {
  const duration = 5 * 1000;
  const animationEnd = Date.now() + duration;
  
  // Cores luxuosas: Ouro, Prata, Azul Cobalto e Branco Perolado
  const luxuryColors = ['#FFD700', '#C0C0C0', '#ffffff', '#1e3a8a', '#9333ea', '#f59e0b'];

  const randomInRange = (min, max) => Math.random() * (max - min) + min;

  // 1. Canhões laterais contínuos (O efeito de chuva)
  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 60 * (timeLeft / duration);

    // Canhão esquerda
    confetti({
      particleCount,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: luxuryColors,
      zIndex: 999999,
      size: 10,
      scalar: 1.2,
      gravity: 1.2
    });

    // Canhão direita
    confetti({
      particleCount,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: luxuryColors,
      zIndex: 999999,
      size: 10,
      scalar: 1.2,
      gravity: 1.2
    });

    // Brilhos aleatórios (estrelas) no centro
    if (timeLeft % 500 < 50) {
      confetti({
        particleCount: 20,
        spread: 360,
        ticks: 60,
        gravity: 0.8,
        decay: 0.94,
        startVelocity: 30,
        shapes: ['star'],
        origin: { x: randomInRange(0.3, 0.7), y: randomInRange(0.3, 0.6) },
        colors: ['#FFD700', '#ffffff'],
        zIndex: 999999
      });
    }
  }, 200);

  // 2. "Explosões" de fogos de artifício (Grand Finale em 3 etapas)
  setTimeout(() => fireworkBurst(0.5, 0.4), 100);
  setTimeout(() => fireworkBurst(0.2, 0.5), 1500);
  setTimeout(() => fireworkBurst(0.8, 0.5), 1700);
  setTimeout(() => fireworkBurst(0.5, 0.2), 3500);
  
  // O Grande Final
  setTimeout(() => {
    fireworkBurst(0.3, 0.4);
    fireworkBurst(0.7, 0.4);
    fireworkBurst(0.5, 0.5);
  }, 4500);

  function fireworkBurst(originX, originY) {
    confetti({
      particleCount: 150,
      spread: 120,
      origin: { x: originX, y: originY },
      colors: luxuryColors,
      zIndex: 999999,
      scalar: 1.5,
      ticks: 100,
      gravity: 0.8,
      shapes: ['circle', 'star']
    });
  }
}
