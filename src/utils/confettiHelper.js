import confetti from 'canvas-confetti';

/**
 * Dispara uma celebração V2.6 — Show de Fogos de Artifício Reais.
 * Simula rojões subindo e explodindo em cascata.
 */
export function fireExtravagantConfetti() {
  const duration = 8 * 1000;
  const animationEnd = Date.now() + duration;
  
  const appColors = ['#3b82f6', '#6366f1', '#f59e0b', '#ffffff', '#a855f7'];
  const goldColors = ['#f59e0b', '#FFD700', '#ffffff'];

  const randomInRange = (min, max) => Math.random() * (max - min) + min;

  // 1. ROJÕES EM SEQUÊNCIA (O efeito de fogos de artifício real)
  const fireworkInterval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(fireworkInterval);

    // Lançamento aleatório
    const x = randomInRange(0.1, 0.9);
    const y = randomInRange(0.1, 0.4);
    
    // Pequeno atraso para simular a subida
    setTimeout(() => {
      // Explosão Principal
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

      // Brilho Secundário (Crepitar de estrelas)
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 360,
          startVelocity: 20,
          origin: { x, y },
          colors: ['#ffffff'],
          zIndex: 999999,
          scalar: 0.6,
          shapes: ['star'],
          gravity: 0.4,
          ticks: 100
        });
      }, 100);
    }, randomInRange(10, 500));
  }, 900);

  // 2. CHUVA LATERAL CONSTANTE (Para preencher a tela)
  const rainInterval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(rainInterval);

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
  }, 400);

  // 3. O GRANDE FINAL ÉPICO (Barragem de Fogos)
  setTimeout(() => {
    const finish = (x) => {
      confetti({
        particleCount: 400,
        spread: 360,
        startVelocity: 60,
        origin: { x, y: 0.5 },
        colors: goldColors,
        zIndex: 999999,
        scalar: 2,
        ticks: 300
      });
    };

    finish(0.2);
    finish(0.5);
    finish(0.8);
  }, 7000);
}
