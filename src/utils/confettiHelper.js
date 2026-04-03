import confetti from 'canvas-confetti';

/**
 * GESTOR DE CELEBRAÇÕES ULTRA-EXTRAVAGANZA V6.0
 * Focando em densidade massiva, escala de partículas aumentada e preenchimento total de tela.
 */

// Helper para disparar partículas pesadas
const fireHeavy = (opts) => {
  confetti({
    ...opts,
    zIndex: 999999,
  });
};

// 1. ROYAL GOLD & DIAMONDS (Densidade Máxima)
function royalGold() {
  const end = Date.now() + (10 * 1000);
  const goldPalette = ['#FFD700', '#DAA520', '#EEE8AA', '#FFFFFF', '#F0E68C', '#B8860B'];

  // Chuva de fundo densa
  const interval = setInterval(() => {
    if (Date.now() > end) return clearInterval(interval);
    
    // Disparos triplos para preencher
    for(let i=0; i<3; i++) {
      fireHeavy({
        particleCount: 15,
        startVelocity: 0,
        ticks: 300,
        origin: { x: Math.random(), y: Math.random() - 0.3 },
        colors: goldPalette,
        shapes: ['circle', 'star'],
        gravity: 0.4,
        scalar: Math.random() * 1.5 + 1, // Partículas maiores
        drift: Math.random() * 4 - 2,
      });
    }
  }, 150);

  // Explosões de Impacto (Ouro e Diamante)
  const burstInterval = setInterval(() => {
    if (Date.now() > end) return clearInterval(burstInterval);
    
    fireHeavy({
      particleCount: 100,
      startVelocity: 45,
      spread: 360,
      origin: { x: Math.random(), y: Math.random() * 0.5 },
      colors: ['#ffffff', '#FFD700'],
      shapes: ['star'],
      scalar: 1.2,
      gravity: 0.8
    });
  }, 1500);
}

// 2. MIDNIGHT FIREWORKS (Show de Múltiplos Morteiros)
function midnightFireworks() {
  const duration = 12 * 1000; // Mais longo
  const end = Date.now() + duration;
  const colors = ['#3b82f6', '#6366f1', '#f59e0b', '#ffffff', '#a855f7', '#ff0000'];

  const internalShow = setInterval(() => {
    if (Date.now() > end) return clearInterval(internalShow);

    const x = Math.random() * 0.7 + 0.15;
    const y = Math.random() * 0.3 + 0.1;

    // Rastro de subida
    fireHeavy({
      particleCount: 25,
      angle: 90,
      spread: 15,
      origin: { x, y: y + 0.3 },
      colors: ['#fff'],
      startVelocity: 45,
      gravity: 1.8,
      scalar: 0.6,
      ticks: 60
    });

    setTimeout(() => {
      // Explosão Massiva (500 partículas!)
      fireHeavy({
        particleCount: 450,
        spread: 360,
        startVelocity: 65,
        decay: 0.91,
        gravity: 0.7,
        origin: { x, y },
        colors: colors,
        scalar: 1.6,
        ticks: 300
      });

      // Efeito Brocade (Dourado/Prata)
      setTimeout(() => {
        fireHeavy({
          particleCount: 150,
          spread: 360,
          startVelocity: 30,
          decay: 0.88,
          gravity: 0.4,
          origin: { x, y },
          colors: ['#FFD700', '#ffffff'],
          shapes: ['star'],
          scalar: 0.8,
          ticks: 500
        });
      }, 200);
    }, 350);
  }, 1000);
}

// 3. NEON CORPORATE (Velocidade e Cor Total)
function neonCorporate() {
  const neonColors = ['#00f2ff', '#00ff9d', '#ff00ea', '#7d00ff', '#ffffff'];
  const duration = 8 * 1000;
  const end = Date.now() + duration;

  const interval = setInterval(() => {
    if (Date.now() > end) return clearInterval(interval);

    fireHeavy({
      particleCount: 500, // Aumentado drasticamente
      startVelocity: 80,
      spread: 360,
      origin: { x: Math.random(), y: Math.random() * 0.4 + 0.2 },
      colors: neonColors,
      scalar: 1.5,
      gravity: 0.9,
      decay: 0.92,
      ticks: 200
    });
  }, 1000);
}

// 4. CLASSIC RH PRIDE (O "Banho" de Confete)
function classicRH() {
  const appColors = ['#3b82f6', '#6366f1', '#f59e0b', '#ffffff'];
  const end = Date.now() + (8 * 1000);

  (function frame() {
    // 4 Canhões simultâneos
    fireHeavy({ particleCount: 10, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: appColors, scalar: 2 });
    fireHeavy({ particleCount: 10, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: appColors, scalar: 2 });
    fireHeavy({ particleCount: 5, angle: 90, spread: 180, origin: { x: 0.5, y: 0.8 }, colors: appColors, scalar: 1.5 });

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
