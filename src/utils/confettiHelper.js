import confetti from 'canvas-confetti';

/**
 * GESTOR DE CELEBRAÇÕES CINEMATIC V8.0
 * Utiliza formas customizadas SVG para atingir 100% de realismo (Moedas, Diamantes e Pérolas).
 */

// 1. FORMAS CUSTOMIZADAS (SVG Paths para realismo total)
const coinPath = 'M10,0 A10,10 0 1,1 10,20 A10,10 0 1,1 10,0 M10,3 A7,7 0 1,0 10,17 A7,7 0 1,0 10,3'; // Moeda com borda interna
const diamondPath = 'M10,0 L20,7 L14,20 L6,20 L0,7 Z M6,7 L14,7 M10,0 L10,7 M10,7 L14,20 M10,7 L6,20'; // Diamante lapidado

// Cores mais densas e ricas
const LUXURY_GOLD = ['#FFD700', '#DAA520', '#B8860B', '#f59e0b', '#FFE55E'];
const LUXURY_DIAMOND = ['#E0F7FA', '#B2EBF2', '#FFFFFF', '#F8FAF6', '#D1D5DB'];

// 2. EFEITO: ROYAL GOLD & DIAMONDS (WATERFALL MODE)
function royalGold() {
  const duration = 12 * 1000;
  const end = Date.now() + duration;

  // Shapes customizados
  const coin = confetti.shapeFromPath({ path: coinPath });
  const diamond = confetti.shapeFromPath({ path: diamondPath });

  // EMISSOR CENTRAL (CASCATA): O segredo do mockup é o fluxo central
  const waterfall = setInterval(() => {
    if (Date.now() > end) return clearInterval(waterfall);

    // Disparos do topo para simular a queda vertical densa
    confetti({
      particleCount: 8,
      startVelocity: 0,
      ticks: 400,
      origin: { x: Math.random() * 0.4 + 0.3, y: -0.2 }, // Focado no centro
      colors: LUXURY_GOLD,
      shapes: [coin],
      gravity: 0.6,
      scalar: Math.random() * 1.5 + 1.2,
      drift: Math.random() * 0.5 - 0.25,
      zIndex: 999999
    });

    confetti({
      particleCount: 5,
      startVelocity: 0,
      ticks: 500,
      origin: { x: Math.random() * 0.5 + 0.25, y: -0.1 },
      colors: LUXURY_DIAMOND,
      shapes: [diamond, 'circle'],
      gravity: 0.4,
      scalar: Math.random() * 1 + 0.8,
      drift: Math.random() * 1 - 0.5,
      zIndex: 999998
    });
  }, 80);

  // EXPLOSÕES DE IMPACTO (Para dar volume nas laterais)
  const impacts = setInterval(() => {
    if (Date.now() > end) return clearInterval(impacts);
    
    confetti({
      particleCount: 40,
      startVelocity: 30,
      spread: 70,
      origin: { x: Math.random() > 0.5 ? 0.1 : 0.9, y: 0.6 },
      colors: LUXURY_GOLD,
      shapes: [coin],
      scalar: 1,
      gravity: 1.2,
      zIndex: 999999
    });
  }, 1500);
}

// 3. MIDNIGHT FIREWORKS (SHELL MODE)
function midnightFireworks() {
  const duration = 10 * 1000;
  const end = Date.now() + duration;
  const colors = ['#3b82f6', '#6366f1', '#a855f7', '#ffffff', '#f59e0b'];

  const show = setInterval(() => {
    if (Date.now() > end) return clearInterval(show);

    const x = Math.random() * 0.6 + 0.2;
    const y = Math.random() * 0.3 + 0.1;

    // Burst Primário
    confetti({
      particleCount: 400,
      spread: 360,
      startVelocity: 60,
      origin: { x, y },
      colors: colors,
      scalar: 1.4,
      gravity: 0.8,
      ticks: 300,
      zIndex: 999999
    });

    // Shimmer secundário com estrelas reais
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 360,
        startVelocity: 25,
        origin: { x, y },
        colors: ['#ffffff', '#FFD700'],
        shapes: ['star'],
        scalar: 0.7,
        gravity: 0.4,
        ticks: 500,
        zIndex: 999998
      });
    }, 200);
  }, 1200);
}

// 4. NEON CORPORATE (GLOW MODE)
function neonCorporate() {
  const duration = 8 * 1000;
  const end = Date.now() + duration;
  const neonColors = ['#00f2ff', '#00ff9d', '#ff00ea', '#7d00ff', '#ffffff'];

  const interval = setInterval(() => {
    if (Date.now() > end) return clearInterval(interval);

    const x = Math.random();
    const y = Math.random() * 0.4 + 0.2;

    // Camada 1: Glow (Maior e translúcida)
    confetti({
      particleCount: 50,
      spread: 360,
      startVelocity: 70,
      origin: { x, y },
      colors: neonColors,
      scalar: 4,
      opacity: 0.1,
      zIndex: 999997
    });

    // Camada 2: Core (Sólida e rápida)
    confetti({
      particleCount: 200,
      spread: 360,
      startVelocity: 50,
      origin: { x, y },
      colors: neonColors,
      scalar: 1.2,
      zIndex: 999999
    });
  }, 1000);
}

// 5. CLASSIC RH PRIDE
function classicRH() {
  const appColors = ['#3b82f6', '#6366f1', '#f59e0b', '#ffffff'];
  const end = Date.now() + (7 * 1000);
  const coin = confetti.shapeFromPath({ path: coinPath });

  (function frame() {
    confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: appColors, scalar: 2, shapes: [coin, 'circle'] });
    confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: appColors, scalar: 2, shapes: [coin, 'circle'] });
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
