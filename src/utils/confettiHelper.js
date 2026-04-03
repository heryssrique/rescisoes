import confetti from 'canvas-confetti';

/**
 * GESTOR DE CELEBRAÇÕES LUXO V5.0
 * Estilos baseados nos mockups premium apresentados.
 */

// 1. ROYAL GOLD & DIAMONDS (Luxo e Prestígio)
function royalGold() {
  const duration = 10 * 1000;
  const animationEnd = Date.now() + duration;
  const goldPalette = ['#FFD700', '#DAA520', '#EEE8AA', '#FFFFFF', '#F0E68C'];

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(interval);

    // Chuva constante
    confetti({
      particleCount: 15,
      startVelocity: 0,
      ticks: 400,
      origin: { x: Math.random(), y: Math.random() - 0.3 },
      colors: goldPalette,
      shapes: ['circle', 'star'],
      gravity: 0.3,
      scalar: Math.random() * 1.2 + 0.8,
      drift: Math.random() * 2 - 1,
      zIndex: 999999
    });

    // Explosões ocasionais de "Diamante"
    if (Math.random() > 0.9) {
      confetti({
        particleCount: 50,
        startVelocity: 30,
        spread: 360,
        origin: { x: Math.random(), y: Math.random() * 0.5 },
        colors: ['#ffffff', '#f8fafc'],
        shapes: ['star'],
        scalar: 0.7,
        zIndex: 999999
      });
    }
  }, 100);
}

// 2. MIDNIGHT FIREWORKS (Morteiros Reais e Realismo)
function midnightFireworks() {
  const duration = 10 * 1000;
  const animationEnd = Date.now() + duration;
  const fireworkColors = ['#3b82f6', '#6366f1', '#a855f7', '#f59e0b', '#ffffff'];

  const shellInterval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 2000) return clearInterval(shellInterval);

    const x = Math.random() * 0.8 + 0.1;
    const y = Math.random() * 0.3 + 0.1;

    // Launch trail
    confetti({ particleCount: 10, angle: 90, spread: 15, origin: { x, y: y + 0.3 }, colors: ['#ffffff'], startVelocity: 40, gravity: 2, scalar: 0.4, ticks: 40, zIndex: 999999 });

    setTimeout(() => {
      // Main Burst
      confetti({
        particleCount: 200,
        spread: 360,
        startVelocity: 55,
        decay: 0.93,
        gravity: 0.7,
        origin: { x, y },
        colors: fireworkColors,
        zIndex: 999999,
        scalar: 1.4,
        ticks: 250
      });

      // Shimmer
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 360,
          startVelocity: 25,
          decay: 0.9,
          gravity: 0.4,
          origin: { x, y },
          colors: ['#ffffff', '#FFD700'],
          shapes: ['star'],
          scalar: 0.5,
          ticks: 400
        });
      }, 150);
    }, 250);
  }, 1000);
}

// 3. NEON CORPORATE (Inovação e Energia High-Tech)
function neonCorporate() {
  const neonColors = ['#00f2ff', '#00ff9d', '#ff00ea', '#7d00ff', '#ffffff'];
  const duration = 6 * 1000;
  const animationEnd = Date.now() + duration;

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(interval);

    confetti({
      particleCount: 100,
      startVelocity: 60,
      spread: 360,
      origin: { x: Math.random(), y: Math.random() * 0.5 + 0.2 },
      colors: neonColors,
      zIndex: 999999,
      scalar: 1.2,
      gravity: 0.8,
      decay: 0.94,
      ticks: 150
    });
  }, 800);
}

// 4. CLASSIC RH CELEBRATION (O clássico unificado)
function classicRH() {
  const appColors = ['#3b82f6', '#6366f1', '#f59e0b', '#ffffff'];
  const end = Date.now() + (5 * 1000);

  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors: appColors, zIndex: 999999, scalar: 1.2 });
    confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors: appColors, zIndex: 999999, scalar: 1.2 });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());
}

// ROUTER PRINCIPAL
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
