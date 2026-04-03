import confetti from 'canvas-confetti';

/**
 * GESTOR DE CELEBRAÇÕES MASTERPIECE V7.0
 * Almejando 100% de fidelidade visual aos mockups de luxo.
 */

const GOLD_GRADIENT = ['#FFD700', '#DAA520', '#B8860B', '#f59e0b', '#FFFACD'];
const DIAMOND_GRADIENT = ['#FFFFFF', '#F0F8FF', '#E0FFFF', '#F8FAF6'];

// Helper para explosões com "Glow" (dispara duas vezes com escala e alpha diferentes)
function fireWithGlow(opts) {
  // 1. O brilho (transparente e maior)
  confetti({
    ...opts,
    particleCount: Math.floor(opts.particleCount * 0.4),
    scalar: opts.scalar * 1.8,
    opacity: 0.1,
    zIndex: 999998,
  });
  // 2. A partícula sólida
  confetti({
    ...opts,
    zIndex: 999999,
  });
}

// 1. ROYAL GOLD & DIAMONDS (O efeito do mockup 1)
function royalGold() {
  const duration = 12 * 1000;
  const end = Date.now() + duration;

  // Chuva de Moedas e Estrelas (Preenchimento total)
  const shower = setInterval(() => {
    if (Date.now() > end) return clearInterval(shower);

    fireWithGlow({
      particleCount: 20,
      startVelocity: 0,
      ticks: 500,
      origin: { x: Math.random(), y: Math.random() - 0.2 },
      colors: Math.random() > 0.7 ? DIAMOND_GRADIENT : GOLD_GRADIENT,
      shapes: ['circle', 'star'],
      gravity: 0.25, // Queda bem lenta e graciosa
      scalar: Math.random() * 2 + 1, // Escala massiva
      drift: Math.random() * 2 - 1,
    });
  }, 100);

  // Explosões de Impacto Laterais e Centrais
  const impacts = setInterval(() => {
    if (Date.now() > end) return clearInterval(impacts);
    
    const x = Math.random();
    fireWithGlow({
      particleCount: 150,
      startVelocity: 40,
      spread: 360,
      origin: { x, y: Math.random() * 0.5 },
      colors: GOLD_GRADIENT,
      shapes: ['star'],
      scalar: 1.5,
      gravity: 0.5
    });
  }, 2000);
}

// 2. MIDNIGHT FIREWORKS (O efeito do mockup 2)
function midnightFireworks() {
  const duration = 12 * 1000;
  const end = Date.now() + duration;
  const fireworkColors = ['#3b82f6', '#6366f1', '#a855f7', '#1e40af', '#ffffff'];

  const internalShow = setInterval(() => {
    if (Date.now() > end) return clearInterval(internalShow);

    const x = Math.random() * 0.8 + 0.1;
    const y = Math.random() * 0.3 + 0.1;

    // Rastro real luminoso
    confetti({
      particleCount: 30,
      angle: 90,
      spread: 10,
      origin: { x, y: y + 0.2 },
      colors: ['#fff'],
      startVelocity: 35,
      gravity: 1.5,
      scalar: 0.5,
      ticks: 50,
      zIndex: 999999
    });

    setTimeout(() => {
      // Explosão Esférica Massiva
      fireWithGlow({
        particleCount: 500,
        spread: 360,
        startVelocity: 60,
        decay: 0.92,
        gravity: 0.6,
        origin: { x, y },
        colors: fireworkColors,
        scalar: 1.8,
        ticks: 300
      });

      // Shimmer/Brocade Final
      setTimeout(() => {
        fireWithGlow({
          particleCount: 200,
          spread: 360,
          startVelocity: 20,
          decay: 0.88,
          gravity: 0.3,
          origin: { x, y },
          colors: ['#FFD700', '#ffffff'],
          shapes: ['star'],
          scalar: 0.6,
          ticks: 600
        });
      }, 200);
    }, 300);
  }, 1200);
}

// 3. NEON CORPORATE (O efeito do mockup 3)
function neonCorporate() {
  const neonColors = ['#00f2ff', '#00ff9d', '#ff00ea', '#7d00ff', '#ffffff'];
  const duration = 10 * 1000;
  const end = Date.now() + duration;

  const quickBursts = setInterval(() => {
    if (Date.now() > end) return clearInterval(quickBursts);

    fireWithGlow({
      particleCount: 500,
      startVelocity: 90,
      spread: 360,
      origin: { x: Math.random(), y: Math.random() * 0.5 + 0.2 },
      colors: neonColors,
      scalar: 2,
      gravity: 1,
      decay: 0.94,
      ticks: 150
    });
  }, 1000);
}

// 4. CLASSIC RH (Simplificado mas potente)
function classicRH() {
  const appColors = ['#3b82f6', '#6366f1', '#f59e0b', '#ffffff'];
  const end = Date.now() + (8 * 1000);

  (function frame() {
    fireWithGlow({ particleCount: 15, angle: 60, spread: 60, origin: { x: 0, y: 0.75 }, colors: appColors, scalar: 2.5 });
    fireWithGlow({ particleCount: 15, angle: 120, spread: 60, origin: { x: 1, y: 0.75 }, colors: appColors, scalar: 2.5 });

    if (Date.now() < end) requestAnimationFrame(frame);
  }());
}

// ROUTER
export function fireExtravagantConfetti(styleId = 'random') {
  const styles = ['royal_gold', 'midnight_fireworks', 'neon_corporate', 'classic_rh'];
  const effectiveStyle = styleId === 'random' ? styles[Math.floor(Math.random() * styles.length)] : styleId;

  switch (effectiveStyle) {
    case 'royal_gold': royalGold(); break;
    case 'midnight_fireworks': midnightFireworks(); break;
    case 'neon_corporate': neonCorporate(); break;
    case 'classic_rh': classicRH(); break;
    default: midnightFireworks();
  }
}
