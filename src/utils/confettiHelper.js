import confetti from 'canvas-confetti';

/**
 * Dispara uma celebração V2.5 — Paleta Harmonizada Premium.
 * Cores baseadas na identidade do DesliGest: Azul Cobalto, Indigo, Ouro e Diamante.
 */
export function fireExtravagantConfetti() {
  const duration = 7 * 1000;
  const animationEnd = Date.now() + duration;
  
  // PALETA HARMONIZADA: Azul do App (#3b82f6), Indigo (#6366f1), Ouro (#f59e0b) e Branco Puro.
  const appColors = ['#3b82f6', '#6366f1', '#f59e0b', '#ffffff', '#a855f7'];

  const randomInRange = (min, max) => Math.random() * (max - min) + min;

  // 1. CHUVA COORDINADA (Canhões laterais)
  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 70 * (timeLeft / duration);

    // Canhão Azul e Ouro (Esquerda)
    confetti({
      particleCount,
      angle: 60,
      spread: 75,
      origin: { x: 0, y: 0.65 },
      colors: appColors,
      zIndex: 999999,
      scalar: 1.2,
      gravity: 0.9,
      drift: 0.3
    });

    // Canhão Indigo e Ouro (Direita)
    confetti({
      particleCount,
      angle: 120,
      spread: 75,
      origin: { x: 1, y: 0.65 },
      colors: appColors,
      zIndex: 999999,
      scalar: 1.2,
      gravity: 0.9,
      drift: -0.3
    });

    // POEIRA DE OURO: Pequenas estrelas douradas caindo suavemente
    confetti({
      particleCount: 10,
      angle: randomInRange(55, 125),
      spread: randomInRange(50, 70),
      origin: { x: randomInRange(0.1, 0.9), y: randomInRange(0, 0.4) },
      colors: ['#f59e0b', '#ffffff'],
      shapes: ['star'],
      gravity: 0.5,
      scalar: 0.7,
      zIndex: 999999
    });
  }, 250);

  // 2. SHOW DE EXPLOSÕES (Cores coordenadas)
  const fireworkInterval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(fireworkInterval);

    // Explosões alternando entre tons de Azul/Branco e tons de Ouro
    const isGoldBurst = Math.random() > 0.5;
    const colors = isGoldBurst ? ['#f59e0b', '#ffffff'] : ['#3b82f6', '#6366f1', '#ffffff'];
    
    fireworkBurst(randomInRange(0.2, 0.8), randomInRange(0.2, 0.5), colors);
  }, 800);

  function fireworkBurst(originX, originY, colors) {
    // Camada 1: Círculos harmonizados
    confetti({
      particleCount: 100,
      spread: 360,
      startVelocity: 35,
      origin: { x: originX, y: originY },
      colors: colors,
      zIndex: 999999,
      scalar: 1.2,
      gravity: 0.6,
      shapes: ['circle']
    });

    // Camada 2: Brilho extra (Estrelas Brancas)
    setTimeout(() => {
      confetti({
        particleCount: 30,
        spread: 360,
        startVelocity: 20,
        origin: { x: originX, y: originY },
        colors: ['#ffffff'],
        zIndex: 999999,
        scalar: 0.8,
        shapes: ['star'],
        gravity: 0.4
      });
    }, 150);
  }

  // 3. O GRANDE FINAL (Triple-Wave de Ouro e Azul)
  setTimeout(() => {
    const endCount = 300;
    const commonOrigin = { y: 0.7 };
    
    confetti({ particleCount: endCount, angle: 60, spread: 100, origin: { x: 0, ...commonOrigin }, colors: appColors, zIndex: 999999, scalar: 1.8 });
    confetti({ particleCount: endCount, angle: 120, spread: 100, origin: { x: 1, ...commonOrigin }, colors: appColors, zIndex: 999999, scalar: 1.8 });
    confetti({ particleCount: endCount, angle: 90, spread: 120, origin: { x: 0.5, ...commonOrigin }, colors: ['#f59e0b', '#ffffff'], zIndex: 999999, scalar: 2 });
  }, 6200);
}
