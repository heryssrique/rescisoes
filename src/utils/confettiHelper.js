import confetti from 'canvas-confetti';

/**
 * Dispara uma celebração ultra-luxuosa, pesada e extravagante.
 * Simoniza fogos de artifício reais, chuva de ouro e explosões coordenadas.
 */
export function fireExtravagantConfetti() {
  const duration = 7 * 1000; // 7 segundos de festa
  const animationEnd = Date.now() + duration;
  
  // Cores de Extrema Elegância: Ouro Real, Ouro Branco, Diamante e Safira
  const luxuryColors = ['#FFD700', '#DAA520', '#EEE8AA', '#FFFFFF', '#F0E68C', '#1E3A8A'];

  const randomInRange = (min, max) => Math.random() * (max - min) + min;

  // 1. CHUVA COORDINADA (Os canhões base)
  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 100 * (timeLeft / duration);

    // Canhão de Ouro da Esquerda
    confetti({
      particleCount,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.65 },
      colors: luxuryColors,
      zIndex: 999999,
      scalar: 1.2,
      gravity: 1,
      drift: 0.5
    });

    // Canhão de Ouro da Direita
    confetti({
      particleCount,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.65 },
      colors: luxuryColors,
      zIndex: 999999,
      scalar: 1.2,
      gravity: 1,
      drift: -0.5
    });

    // Brilhos Estrelares aleatórios por toda a tela
    confetti({
      particleCount: 15,
      angle: randomInRange(55, 125),
      spread: randomInRange(50, 70),
      particleCount: randomInRange(10, 25),
      origin: { x: randomInRange(0.1, 0.9), y: randomInRange(0, 0.5) },
      colors: ['#FFD700', '#FFFFFF', '#FFFACD'],
      shapes: ['star'],
      gravity: 0.6,
      scalar: 0.8,
      zIndex: 999999
    });
  }, 250);

  // 2. SHOW DE FOGOS DE ARTIFÍCIO (Explosões Centrais)
  const fireworkInterval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(fireworkInterval);

    // Explosões em posições aleatórias na metade superior da tela
    fireworkBurst(randomInRange(0.2, 0.8), randomInRange(0.2, 0.5));
  }, 800);

  function fireworkBurst(originX, originY) {
    // Camada 1: Núcleo da explosão (Círculos)
    confetti({
      particleCount: 80,
      spread: 360,
      startVelocity: 40,
      origin: { x: originX, y: originY },
      colors: luxuryColors,
      zIndex: 999999,
      scalar: 1.3,
      gravity: 0.5,
      shapes: ['circle']
    });

    // Camada 2: Brilho da explosão (Estrelas)
    setTimeout(() => {
      confetti({
        particleCount: 40,
        spread: 360,
        startVelocity: 25,
        origin: { x: originX, y: originY },
        colors: ['#FFFFFF', '#FFD700'],
        zIndex: 999999,
        scalar: 0.7,
        shapes: ['star'],
        gravity: 0.3
      });
    }, 150);
  }

  // 3. O GRANDE FINAL (Crescendo no último segundo)
  setTimeout(() => {
    const endCount = 350;
    const commonOrigin = { y: 0.7 };
    
    // Leque de fechamento
    confetti({ particleCount: endCount, angle: 60, spread: 100, origin: { x: 0, ...commonOrigin }, colors: luxuryColors, zIndex: 999999, scalar: 2 });
    confetti({ particleCount: endCount, angle: 120, spread: 100, origin: { x: 1, ...commonOrigin }, colors: luxuryColors, zIndex: 999999, scalar: 2 });
    confetti({ particleCount: endCount, angle: 90, spread: 120, origin: { x: 0.5, ...commonOrigin }, colors: luxuryColors, zIndex: 999999, scalar: 2 });
  }, 6200);
}
