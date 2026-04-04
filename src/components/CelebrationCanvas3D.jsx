import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, PerspectiveCamera, Environment, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';

// SILENCIAR CONSOLE FLOOD (Previne congelamento por logs de depreciação repetitivos)
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('THREE.Clock: This module has been deprecated')) {
      return;
    }
    originalWarn(...args);
  };
}

// GEOMETRIAS COMPARTILHADAS (Otimização de Memória)
const COIN_GEOM = new THREE.CylinderGeometry(1, 1, 0.1, 32);
const DIAMOND_GEOM = new THREE.IcosahedronGeometry(0.7, 0); // Jóia Grande
const STAR_GEOM = new THREE.IcosahedronGeometry(0.3, 0); // Pearl-White Stars do Prompt
const BOX_GEOM = new THREE.BoxGeometry(1, 1, 1);
const SPARKLE_GEOM = new THREE.SphereGeometry(0.15, 8, 8); // Pequena faísca crepitante (crackle)
const NEON_RIBBON_GEOM = new THREE.BoxGeometry(0.08, 1.5, 0.2); 
const NEON_RING_GEOM = new THREE.TorusGeometry(0.5, 0.08, 8, 24); 
const CONFETTI_RECT_GEOM = new THREE.BoxGeometry(0.8, 0.4, 0.02); 
const CONFETTI_SQUARE_GEOM = new THREE.BoxGeometry(0.5, 0.5, 0.02); 
const FIREWORK_GEOM = new THREE.BoxGeometry(0.05, 0.05, 1.5); // Rastro luminoso

// 1. COMPONENTE BASE: ITEM COM FÍSICA 3D
function PhysicsItem({ type, position, rotation, scale, color, velocity, burstVelocity = null, delay = 0, gravity = 0.005, damping = 0.992 }) {
  const mesh = useRef();
  const vel = useRef(new THREE.Vector3(...velocity));
  const pos = useRef(new THREE.Vector3(...position));
  const rot = useRef(new THREE.Vector3(...rotation));
  const age = useRef(0);
  const hasBurst = useRef(!burstVelocity);

  useFrame(() => {
    if (!mesh.current) return;
    
    age.current++;
    if (age.current < delay) {
      mesh.current.visible = false;
      return;
    }
    mesh.current.visible = true;

    // FASE 1: PROJETIL SUBINDO vs FASE 2: EXPLOSÃO 
    if (!hasBurst.current && burstVelocity) {
      // É um projetil em ascensão (casca de fogo de artifício)
      vel.current.y -= 0.002; // Gravidade pesada inicial para atingir o ápice 
      vel.current.multiplyScalar(0.985); // Atrito da bala de ar
      
      // CHEGOU NO APOGEU: BUM! (Velocidade vertical sumiu)
      if (vel.current.y <= 0.03) {
        vel.current.set(...burstVelocity);
        hasBurst.current = true;
      }
    } else {
      // FÍSICA DE QUEDA/EXPANSÃO NORMAL
      vel.current.y -= gravity;
      vel.current.multiplyScalar(damping);
    }
    
    // TIME SCALE: Manter a lógica original de suavização das outras cenas
    const timeScale = (damping < 0.985 && type !== 'firework' && type !== 'sparkle') ? 1 : 0.5; 
    
    pos.current.x += vel.current.x * timeScale;
    pos.current.y += vel.current.y * timeScale;
    pos.current.z += vel.current.z * timeScale;
    
    if (type === 'firework' || type === 'neon_laser' || (type === 'sparkle' && !hasBurst.current)) {
      // Motion blur lookAt do projetil/luz
      const target = pos.current.clone().add(vel.current);
      mesh.current.lookAt(target); 
      const speed = vel.current.length();
      mesh.current.scale.z = Math.max(0.1, speed * (type === 'neon_laser' ? 4 : 12)); 
    } else {
      const rotScale = timeScale === 1 ? 1 : 0.15;
      mesh.current.rotation.x += rot.current.x * rotScale;
      mesh.current.rotation.y += rot.current.y * rotScale;
      mesh.current.rotation.z += rot.current.z * rotScale;
    }
    
    mesh.current.position.copy(pos.current);

    const dist = pos.current.length();
    const speed = vel.current.length();
    
    // RENASCER CONTÍNUO: Elimina o "vazio / estático" 
    if (pos.current.y < -30 || dist > 60 || ((type === 'neon_laser') && speed < 0.02)) {
      if (type === 'confetti_rect' || type === 'confetti_square') {
        const fromLeft = pos.current.x < 0;
        pos.current.set(fromLeft ? -15 : 15, -12, THREE.MathUtils.randFloatSpread(10));
        vel.current.set(
          fromLeft ? 0.08 + Math.random() * 0.08 : -0.08 - Math.random() * 0.08, 
          0.15 + Math.random() * 0.2, 
          THREE.MathUtils.randFloatSpread(0.1)
        );
      } else if (type === 'neon_laser') {
        pos.current.set(0,0,0);
        const newSpeed = 0.5 + Math.random() * 0.8; 
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1); 
        vel.current.set(
          newSpeed * Math.sin(phi) * Math.cos(theta),
          newSpeed * Math.cos(phi), 
          newSpeed * Math.sin(phi) * Math.sin(theta)
        );
      } else if (type === 'coin' || type === 'diamond' || type === 'pearl_star') {
        // Apenas Gold volta lá pra cima
        pos.current.y = 30; 
        vel.current.y = velocity[1];
      }
    }
  });

  const geometry = useMemo(() => {
    if (type === 'coin') return COIN_GEOM;
    if (type === 'box') return BOX_GEOM;
    if (type === 'sparkle') return SPARKLE_GEOM;
    if (type === 'neon_ribbon' || type === 'neon_laser') return NEON_RIBBON_GEOM;
    if (type === 'neon_ring') return NEON_RING_GEOM;
    if (type === 'confetti_rect') return CONFETTI_RECT_GEOM;
    if (type === 'confetti_square') return CONFETTI_SQUARE_GEOM;
    if (type === 'firework') return FIREWORK_GEOM;
    if (type === 'pearl_star') return STAR_GEOM;
    return DIAMOND_GEOM;
  }, [type]);

  const material = useMemo(() => {
    if (type === 'diamond') return new THREE.MeshPhysicalMaterial({ 
      color: 0xffffff, metalness: 0, roughness: 0, transmission: 1, thickness: 1.5, ior: 2.417, iridescence: 0.3, reflectivity: 1, clearcoat: 1, envMapIntensity: 2
    });
    
    // Pearl-White Stars (Branco com iridescência metálica leve)
    if (type === 'pearl_star') return new THREE.MeshStandardMaterial({
      color: 0xffffff, metalness: 0.8, roughness: 0.1, emissive: 0x444444
    });
    
    // Luz pura intensa que dispara o componente BLOOM 
    if (type === 'firework' || type === 'sparkle' || type === 'neon_laser') {
      return new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2.5) }); // Intensificado para brilhar
    }

    if (type === 'confetti_rect' || type === 'confetti_square') return new THREE.MeshStandardMaterial({
      color, metalness: 0, roughness: 0.8 
    });

    const isNeon = type.includes('neon');
    return new THREE.MeshStandardMaterial({ 
      color, 
      metalness: type === 'coin' ? 1.0 : 0.2, // Full ouro metálico
      roughness: type === 'coin' ? 0.3 : (isNeon ? 0 : 0.2), 
      emissive: color, 
      emissiveIntensity: isNeon ? 4 : 0 // Glow base para neons que reagem à luz
    });
  }, [type, color]);

  const baseScale = type === 'coin' ? scale * 0.8 : (type === 'diamond' ? scale * 0.6 : scale);
  return (
    <mesh ref={mesh} geometry={geometry} material={material} position={position} scale={baseScale} />
  );
}

// 2. CENA DE CELEBRAÇÃO ESPECIALIZADA
function CelebrationScene({ style = 'royal_gold' }) {
  const count = style.includes('firework') ? 300 : (style.includes('rh') || style.includes('neon') ? 200 : 120);
  
  const elements = useMemo(() => {
    const goldColors = ['#FFD700', '#DAA520', '#F8E231', '#B8860B'];
    const neonColors = ['#00f2ff', '#ff00ea', '#39ff14']; // Cyan, Magenta, Electric Lime Green do Prompt
    const rainbowColors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#8b00ff'];
    
    return new Array(count).fill().map((_, i) => {
      let type = 'diamond';
      let color = '#ffffff';
      let position = [0, 0, 0];
      let velocity = [0, 0, 0];
      let burstVelocity = null;
      let delay = 0;
      let gravity = 0.005;
      let damping = 0.992; 
      let rotation = [Math.random() * 0.1, Math.random() * 0.1, Math.random() * 0.1];

      if (style.includes('gold')) {
        const rand = Math.random();
        type = rand > 0.6 ? 'coin' : (rand > 0.3 ? 'diamond' : 'pearl_star'); // Ouro, Cristais e Estrelas de Pérola
        color = type === 'pearl_star' ? '#ffffff' : goldColors[i % goldColors.length];
        position = [THREE.MathUtils.randFloatSpread(35), 15 + Math.random() * 20, THREE.MathUtils.randFloatSpread(15)];
        velocity = [THREE.MathUtils.randFloatSpread(0.01), -0.01 - Math.random() * 0.02, 0];
        rotation = [Math.random() * 0.4, Math.random() * 0.4, Math.random() * 0.4];
        gravity = 0.0003; 
        damping = 0.995; // Queda elegante de luxo
      } else if (style.includes('rh')) {
        type = Math.random() > 0.5 ? 'confetti_rect' : 'confetti_square';
        color = ['#3b82f6', '#6366f1', '#f59e0b', '#ffffff', '#10b981', '#ec4899'][i % 6];
        const fromLeft = i % 2 === 0;
        position = [fromLeft ? -15 : 15, -12, THREE.MathUtils.randFloatSpread(10)]; 
        velocity = [
          fromLeft ? 0.08 + Math.random() * 0.08 : -0.08 - Math.random() * 0.08, 
          0.15 + Math.random() * 0.2, 
          THREE.MathUtils.randFloatSpread(0.1) 
        ];
        rotation = [Math.random() * 0.8, Math.random() * 0.8, Math.random() * 0.8]; 
        gravity = 0.002; 
        damping = 0.98; 
      } else if (style.includes('firework')) {
        const isCrackle = Math.random() > 0.7; 
        type = isCrackle ? 'sparkle' : 'firework';
        
        const diversedColors = [
          '#ff0055', '#FFD700', '#00f2ff', '#ff00ea', 
          '#00ff66', '#ff8800', '#ff0044', '#7d00ff', 
          '#ffffff', '#0044ff'
        ];
        color = isCrackle ? '#ffffff' : diversedColors[i % diversedColors.length];
        
        // 4 Lançadores Sincronizados de Projéteis 
        const launcherIdx = i % 4;
        const launchers = [
          { x: -10, delay: 0 },    // Esq: Começa Instante 0
          { x: 5,   delay: 60 },   // Central Dir: 1 segundo depois
          { x: -5,  delay: 130 },  // Central Esq: 2 segundos depois
          { x: 12,  delay: 35 }    // Ponta Dir: 0.5 seg depois
        ];
        const launcher = launchers[launcherIdx];
        
        // Todos do mesmo array sharem a posição inferior exata para mascarar um tiro único
        position = [launcher.x, -25, 0];
        
        // Disparo idêntico para o bloco (O rastro do projetil)
        velocity = [0, 0.45 + (launcherIdx * 0.02), 0]; 
        
        // A matemática da explosão na meia vida (Boom)
        const speed = isCrackle ? (0.05 + Math.random() * 0.05) : (0.1 + Math.random() * 0.1); 
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1); 
        burstVelocity = [
          speed * Math.sin(phi) * Math.cos(theta),
          speed * Math.cos(phi), 
          speed * Math.sin(phi) * Math.sin(theta)
        ];
        
        delay = launcher.delay;
        gravity = 0.0005; // Pequeníssima gravidade no pós-bomba
        damping = 0.97;
      } else if (style.includes('neon')) {
        // "Vibrant, high-energy explosions of neon cyan, magenta... bursting from the center"
        type = 'neon_laser';
        color = neonColors[i % neonColors.length];
        
        position = [0, 0, 0]; // Bursting from the center
        const speed = 0.5 + Math.random() * 0.8; // Energia vibrante violentíssima
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1); 
        vel = [
          speed * Math.sin(phi) * Math.cos(theta),
          speed * Math.cos(phi), 
          speed * Math.sin(phi) * Math.sin(theta)
        ];
        velocity = vel;
        rotation = [0, 0, 0]; // Alinhado ao vetor
        gravity = 0; // Voa sem peso
        damping = 0.99; // Lento atrito p viajar longe da tela
      } else {
        type = 'diamond';
        color = rainbowColors[i % rainbowColors.length];
        position = [THREE.MathUtils.randFloatSpread(25), 15, THREE.MathUtils.randFloatSpread(10)];
        velocity = [0, -0.01 - Math.random() * 0.01, 0];
        gravity = 0.0003;
      }

      return {
        type, 
        color, 
        position, 
        velocity, 
        burstVelocity,
        delay,
        gravity,
        damping,
        rotation,
        scale: Math.random() * 0.5 + 0.4
      };
    });
  }, [count, style]);

  return (
    <Suspense fallback={null}>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={3.0} color="#ffffff" />
      <pointLight position={[-10, 5, 5]} intensity={2.0} color={style.includes('gold') ? '#FFD700' : '#ffffff'} />
      
      {/* Cinematic Lighting & Bloom para o High-Level Corporate Success */}
      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.5} />
      </EffectComposer>
      
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
      <Sparkles count={100} scale={30} size={2} speed={0.2} opacity={0.5} color={style.includes('gold') ? '#FFD700' : '#ffffff'} />
      
      {elements.map((el, i) => (
        <PhysicsItem key={`${style}-${i}`} {...el} />
      ))}
      
      <Environment preset="city" />
    </Suspense>
  );
}

// 3. WRAPPER CONTAINER (Truly Persistent Canvas)
export function CelebrationCanvas3D({ mode: active }) {
  // Mantemos a cena renderizando mesmo após o active ser nulo para evitar o "congelamento de último frame" 
  // O Canvas vai "fazer o fade out" enquanto a cena continua viva por baixo.
  const [activeScene, setActiveScene] = useState(active);

  useEffect(() => {
    if (active) {
      setActiveScene(active);
    } else {
      const timeout = setTimeout(() => setActiveScene(null), 1200);
      return () => clearTimeout(timeout);
    }
  }, [active]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: active ? 1 : 0 }} // Desaparece suavemente
      transition={{ duration: 0.8 }}
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        zIndex: 999999, 
        pointerEvents: 'none',
        display: activeScene ? 'block' : 'none'
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' }} />

      <Canvas 
        shadows 
        dpr={[1, 1.5]} 
        gl={{ antialias: false, alpha: true }} 
        camera={{ position: [0, 0, 15], fov: 55 }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        {activeScene && <CelebrationScene style={activeScene.toLowerCase()} />}
      </Canvas>
    </motion.div>
  );
}
