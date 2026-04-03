import confetti from 'canvas-confetti';

/**
 * Dispara uma celebração V3.0 (ULTRA-REALISTA) — Real Firework Shells.
 * Simula o lançamento de morteiros, o estouro em alta altitude e o brilho final (shimmer).
 */
export function fireExtravagantConfetti() {
  const duration = 10 * 1000; // Celebração estendida de 10 segundos
  const animationEnd = Date.now() + duration;
  
  const appColors = ['#3b82f6', '#6366f1', '#f59e0b', '#ffffff', '#a855f7'];
  const goldColors = ['#f59e0b', '#FFD700', '#ffffff', '#B8860B'];
  const rainbowColors = ['#ff0000', '#ffa500', '#ffff00', '#008000', '#0000ff', '#4b0082', '#ee82ee'];

  const randomInRange = (min, max) => Math.random() * (max - min) + min;

  // 1. LANÇADOR DE MORTEIROS (Efeito Realista de Explosão única)
  const shellInterval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 2500) return clearInterval(shellInterval);

    // Coordenadas da Explosão
    const x = randomInRange(0.15, 0.85);
    const y = randomInRange(0.15, 0.45);
    const useRainbow = timeLeft < 5000; // Começa a usar cores arco-íris na metade final
    const currentColors = useRainbow ? rainbowColors : (Math.random() > 0.6 ? goldColors : appColors);

    // PASSO 1: O "Launch" (Rastro rápido de subida)
    // Simulado por uma pequena explosão vertical estreita
    confetti({
      particleCount: 15,
      angle: 90,
      spread: 20,
      origin: { x, y: y + 0.2 }, // Começa logo abaixo da explosão
      colors: ['#ffffff'],
      startVelocity: 35,
      gravity: 2,
      scalar: 0.5,
      ticks: 30,
      zIndex: 999999
    });

    // PASSO 2: A Explosão Principal (High Altitude Shell)
    setTimeout(() => {
      // Impacto Primário (Bolas grandes)
      confetti({
        particleCount: 180,
        spread: 360,
        startVelocity: 50,
        decay: 0.92,
        gravity: 0.6,
        origin: { x, y },
        colors: currentColors,
        zIndex: 999999,
        scalar: 1.5,
        shapes: ['circle'],
        ticks: 200
      });

      // Shimmer/Brocade (Faíscas prateadas/douradas que demoram a sumir)
      setTimeout(() => {
        confetti({
          particleCount: 60,
          spread: 360,
          startVelocity: 25,
          decay: 0.88,
          gravity: 0.5,
          origin: { x, y },
          colors: ['#ffffff', '#FFD700'],
          zIndex: 999999,
          scalar: 0.5,
          shapes: ['star'],
          ticks: 300 // Duram mais tempo no ar
        });
      }, 100);

      // Pequenas explosões secundárias (Efeito cascata)
      if (Math.random() > 0.5) {
        setTimeout(() => {
          fireworkBurst(x + randomInRange(-0.1, 0.1), y + randomInRange(-0.1, 0.1), currentColors, 40);
        }, 300);
      }
    }, 200);

  }, 1200);

  function fireworkBurst(originX, originY, colors, count) {
    confetti({
      particleCount: count,
      spread: 360,
      startVelocity: 30,
      origin: { x: originX, y: originY },
      colors: colors,
      zIndex: 999999,
      scalar: 1,
      gravity: 0.8
    });
  }

  // 2. GRAND FINALE (Múltiplos Morteiros e Rainbow Blast)
  setTimeout(() => {
    // 3 Morteiros de uma vez
    const finalePositions = [0.2, 0.5, 0.8];
    
    finalePositions.forEach((pos, i) => {
      setTimeout(() => {
        // Explosão de Grande Escala
        confetti({
          particleCount: 400,
          spread: 360,
          startVelocity: 75,
          origin: { x: pos, y: 0.4 },
          colors: rainbowColors,
          zIndex: 999999,
          scalar: 2.5,
          ticks: 500,
          gravity: 0.8,
          shapes: ['circle', 'star']
        });
      }, i * 300);
    });

    // Chuva Final de "Cinzas Douradas"
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 160,
        origin: { y: 0.2 },
        colors: ['#FFD700', '#ffffff'],
        zIndex: 999999,
        scalar: 0.6,
        gravity: 0.4,
        drift: 0,
        ticks: 600
      });
    }, 1500);

  }, 7800);
}
