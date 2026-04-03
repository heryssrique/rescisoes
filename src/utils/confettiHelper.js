import confetti from 'canvas-confetti';

/**
 * GESTOR DE CELEBRAÇÕES PREMIUM V4.0
 * Contém diferentes estilos de efeitos reais e luxuosos.
 */

// 1. EFEITO: SHOW DE FOGOS REALISTA (O atual v3.0)
function fireworkShow() {
  const duration = 10 * 1000;
  const animationEnd = Date.now() + duration;
  const appColors = ['#3b82f6', '#6366f1', '#f59e0b', '#ffffff', '#a855f7'];
  const goldColors = ['#f59e0b', '#FFD700', '#ffffff', '#B8860B'];
  const randomInRange = (min, max) => Math.random() * (max - min) + min;

  const shellInterval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 2500) return clearInterval(shellInterval);

    const x = randomInRange(0.15, 0.85);
    const y = randomInRange(0.15, 0.45);
    const currentColors = Math.random() > 0.6 ? goldColors : appColors;

    confetti({ particleCount: 15, angle: 90, spread: 20, origin: { x, y: y + 0.2 }, colors: ['#ffffff'], startVelocity: 35, gravity: 2, scalar: 0.5, ticks: 30, zIndex: 999999 });

    setTimeout(() => {
      confetti({ particleCount: 180, spread: 360, startVelocity: 50, decay: 0.92, gravity: 0.6, origin: { x, y }, colors: currentColors, zIndex: 999999, scalar: 1.5, shapes: ['circle'], ticks: 200 });
      setTimeout(() => {
        confetti({ particleCount: 60, spread: 360, startVelocity: 25, decay: 0.88, gravity: 0.5, origin: { x, y }, colors: ['#ffffff', '#FFD700'], zIndex: 999999, scalar: 0.5, shapes: ['star'], ticks: 300 });
      }, 100);
    }, 200);
  }, 1200);

  // Grand Finale
  setTimeout(() => {
    const finalePositions = [0.2, 0.5, 0.8];
    finalePositions.forEach((pos, i) => {
      setTimeout(() => {
        confetti({ particleCount: 300, spread: 360, startVelocity: 70, origin: { x: pos, y: 0.4 }, colors: ['#ff0000', '#ffff00', '#00ff00', '#0000ff', '#ffffff'], zIndex: 999999, scalar: 2.2, ticks: 400, gravity: 0.8 });
      }, i * 300);
    });
  }, 7800);
}

// 2. EFEITO: CHUVA DE OURO (Elegante e constante)
function goldRain() {
  const duration = 8 * 1000;
  const animationEnd = Date.now() + duration;
  const goldPalette = ['#f59e0b', '#FFD700', '#ffffff', '#B8860B', '#F3F4F6'];

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(interval);

    confetti({
      particleCount: 20,
      startVelocity: 0,
      ticks: 300,
      origin: { x: Math.random(), y: Math.random() - 0.3 },
      colors: goldPalette,
      shapes: ['circle', 'star'],
      gravity: 0.4,
      scalar: Math.random() * 1 + 0.5,
      drift: Math.random() * 2 - 1,
      zIndex: 999999
    });
  }, 100);
}

// 3. EFEITO: EXPLOSÃO NEON (Energia Alta e Rápida)
function neonExplosion() {
  const neonColors = ['#39ff14', '#fe019a', '#04d9ff', '#bc13fe', '#ff073a', '#ccff00'];
  const count = 300;
  
  const burst = (originX, originY) => {
    confetti({
      particleCount: count,
      startVelocity: 55,
      spread: 360,
      origin: { x: originX, y: originY },
      colors: neonColors,
      zIndex: 999999,
      scalar: 1.2,
      gravity: 0.7,
      decay: 0.95
    });
  };

  burst(0.25, 0.5);
  setTimeout(() => burst(0.75, 0.5), 300);
  setTimeout(() => burst(0.5, 0.3), 600);
}

// 4. EFEITO: TIRO DE CANHÃO (Clássico Lado a Lado)
function schoolPride() {
  const appColors = ['#3b82f6', '#6366f1', '#f59e0b', '#ffffff'];
  const count = 250;
  const defaults = { origin: { y: 0.7 }, zIndex: 999999, scalar: 1.5 };

  function fire(particleRatio, opts) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
      colors: appColors
    });
  }

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

// FUNÇÃO PRINCIPAL DE DISPARO (Router)
export function fireExtravagantConfetti(styleId = 'random') {
  // Se 'random', escolhe um estilo
  const styles = ['firework', 'gold_rain', 'neon', 'classic'];
  const effectiveStyle = styleId === 'random' ? styles[Math.floor(Math.random() * styles.length)] : styleId;

  switch (effectiveStyle) {
    case 'firework': fireworkShow(); break;
    case 'gold_rain': goldRain(); break;
    case 'neon': neonExplosion(); break;
    case 'classic': schoolPride(); break;
    default: fireworkShow();
  }
}
