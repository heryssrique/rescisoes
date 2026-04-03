import React, { useRef, useMemo, useState, useEffect } from 'react';
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
function PhysicsItem({ type, position, rotation, scale, color, velocity, gravity = 0.005, damping = 0.992 }) {
  const mesh = useRef();
  const vel = useRef(new THREE.Vector3(...velocity));
  const pos = useRef(new THREE.Vector3(...position));
  const rot = useRef(new THREE.Vector3(...rotation));

  useFrame(() => {
    if (!mesh.current) return;
    
    vel.current.y -= gravity;
    vel.current.multiplyScalar(damping);
    
    const timeScale = damping < 0.985 ? 1 : 0.5; 
    
    pos.current.x += vel.current.x * timeScale;
    pos.current.y += vel.current.y * timeScale;
    pos.current.z += vel.current.z * timeScale;
    
    if (type === 'firework' || type === 'neon_laser') {
      const target = pos.current.clone().add(vel.current);
      mesh.current.lookAt(target); 
      const speed = vel.current.length();
      mesh.current.scale.z = Math.max(0.1, speed * (type === 'neon_laser' ? 4 : 8)); 
    } else {
      const rotScale = timeScale === 1 ? 1 : 0.15;
      mesh.current.rotation.x += rot.current.x * rotScale;
      mesh.current.rotation.y += rot.current.y * rotScale;
      mesh.current.rotation.z += rot.current.z * rotScale;
    }
    
    mesh.current.position.copy(pos.current);

    const dist = pos.current.length();
    const speed = vel.current.length();
    
    // RENASCER CONTÍNUO: Elimina o "vazio / estático" do final das animações
    // Se caiu da borda (y <-30), viajou muito (dist > 60) ou os fogos pararam no ar (speed < 0.02)
    if (pos.current.y < -30 || dist > 60 || ((type === 'firework' || type === 'sparkle') && speed < 0.02)) {
      if (type === 'confetti_rect' || type === 'confetti_square') {
        const fromLeft = pos.current.x < 0;
        pos.current.set(fromLeft ? -15 : 15, -12, THREE.MathUtils.randFloatSpread(10));
        vel.current.set(
          fromLeft ? 0.08 + Math.random() * 0.08 : -0.08 - Math.random() * 0.08, 
          0.15 + Math.random() * 0.2, 
          THREE.MathUtils.randFloatSpread(0.1)
        );
      } else if (type === 'firework' || type === 'sparkle') {
        // Dispara UMA NOVA BATERIA de fogos no céu 
        const newCenter = [THREE.MathUtils.randFloatSpread(25), 5 + Math.random() * 10, THREE.MathUtils.randFloatSpread(5)];
        pos.current.set(...newCenter);
        const newSpeed = type === 'sparkle' ? (0.2 + Math.random() * 0.3) : (0.5 + Math.random() * 0.6); 
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1); 
        vel.current.set(
          newSpeed * Math.sin(phi) * Math.cos(theta),
          newSpeed * Math.cos(phi), 
          newSpeed * Math.sin(phi) * Math.sin(theta)
        );
      } else if (type === 'neon_laser') {
        // Dispara no novo pulso do centro da tela para manter ritmo High Tech
        pos.current.set(0,0,0);
        const newSpeed = 0.5 + Math.random() * 0.8; 
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1); 
        vel.current.set(
          newSpeed * Math.sin(phi) * Math.cos(theta),
          newSpeed * Math.cos(phi), 
          newSpeed * Math.sin(phi) * Math.sin(theta)
        );
      } else {
        // Default Ouro/Rainbow
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
  const count = style === 'midnight_fireworks' ? 300 : (style === 'classic_rh' || style === 'neon_corporate' ? 200 : 120);
  
  const elements = useMemo(() => {
    const goldColors = ['#FFD700', '#DAA520', '#F8E231', '#B8860B'];
    const neonColors = ['#00f2ff', '#ff00ea', '#39ff14']; // Cyan, Magenta, Electric Lime Green do Prompt
    const fireworkColors = ['#0f52ba', '#9966cc', '#FFD700']; // Sapphire blue, Amethyst purple, Gold
    
    const fireworksCenters = [
      [THREE.MathUtils.randFloatSpread(20), 2 + Math.random() * 6, THREE.MathUtils.randFloatSpread(8)],
      [THREE.MathUtils.randFloatSpread(20), 5 + Math.random() * 8, THREE.MathUtils.randFloatSpread(5)],
      [THREE.MathUtils.randFloatSpread(20), 4 + Math.random() * 7, THREE.MathUtils.randFloatSpread(8)]
    ];
    
    return new Array(count).fill().map((_, i) => {
      let type = 'diamond';
      let color = '#ffffff';
      let position = [0, 0, 0];
      let velocity = [0, 0, 0];
      let gravity = 0.005;
      let damping = 0.992; 
      let rotation = [Math.random() * 0.1, Math.random() * 0.1, Math.random() * 0.1];

      if (style === 'royal_gold') {
        const rand = Math.random();
        type = rand > 0.6 ? 'coin' : (rand > 0.3 ? 'diamond' : 'pearl_star'); // Ouro, Cristais e Estrelas de Pérola
        color = type === 'pearl_star' ? '#ffffff' : goldColors[i % goldColors.length];
        position = [THREE.MathUtils.randFloatSpread(35), 15 + Math.random() * 20, THREE.MathUtils.randFloatSpread(15)];
        velocity = [THREE.MathUtils.randFloatSpread(0.01), -0.01 - Math.random() * 0.02, 0];
        rotation = [Math.random() * 0.4, Math.random() * 0.4, Math.random() * 0.4];
        gravity = 0.0003; 
        damping = 0.995; // Queda elegante de luxo
      } else if (style === 'classic_rh') {
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
      } else if (style === 'midnight_fireworks') {
        const isCrackle = Math.random() > 0.7; // "crackle effect with tiny shimmering white dots"
        type = isCrackle ? 'sparkle' : 'firework';
        
        // Cores Vibrantes Extremamente Amplas e Variadas!
        const diversedColors = [
          '#ff0055', '#FFD700', '#00f2ff', '#ff00ea', 
          '#00ff66', '#ff8800', '#ff0044', '#7d00ff', 
          '#ffffff', '#0044ff'
        ];
        color = isCrackle ? '#ffffff' : diversedColors[i % diversedColors.length];
        
        // Múltiplos núcleos no céu (Muito mais explosões ao mesmo tempo)
        const centers = [
          [THREE.MathUtils.randFloatSpread(25), 8 + Math.random() * 5, THREE.MathUtils.randFloatSpread(5)],
          [THREE.MathUtils.randFloatSpread(25), 6 + Math.random() * 5, THREE.MathUtils.randFloatSpread(5)],
          [THREE.MathUtils.randFloatSpread(25), 10 + Math.random() * 5, THREE.MathUtils.randFloatSpread(5)],
          [THREE.MathUtils.randFloatSpread(25), 7 + Math.random() * 5, THREE.MathUtils.randFloatSpread(5)],
          [THREE.MathUtils.randFloatSpread(25), 9 + Math.random() * 5, THREE.MathUtils.randFloatSpread(5)],
          [THREE.MathUtils.randFloatSpread(25), 5 + Math.random() * 5, THREE.MathUtils.randFloatSpread(5)]
        ];
        
        const center = centers[i % centers.length];
        position = [...center];
        
        // Explosão Absurda com travamento de atrito (Eles explodem e PARAM NO AR pra não cair como "projéteis")
        const speed = isCrackle ? (0.2 + Math.random() * 0.3) : (0.5 + Math.random() * 0.6); 
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1); 
        velocity = [
          speed * Math.sin(phi) * Math.cos(theta),
          speed * Math.cos(phi), 
          speed * Math.sin(phi) * Math.sin(theta)
        ];
        gravity = 0; // ZERO gravidade. Pólvora voa, para, brilha parado igual ao real e evapora.
        damping = 0.90; // Super atrito freia a explosão logo criando esferas volumosas perfeitas no céu
      } else if (style === 'neon_corporate') {
        // "Vibrant, high-energy explosions of neon cyan, magenta... bursting from the center"
        type = 'neon_laser';
        color = neonColors[i % neonColors.length];
        
        position = [0, 0, 0]; // Bursting from the center
        const speed = 0.5 + Math.random() * 0.8; // Energia vibrante violentíssima
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1); 
        velocity = [
          speed * Math.sin(phi) * Math.cos(theta),
          speed * Math.cos(phi), 
          speed * Math.sin(phi) * Math.sin(theta)
        ];
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
        gravity,
        damping,
        rotation,
        scale: Math.random() * 0.5 + 0.4
      };
    });
  }, [count, style]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={3.0} color="#ffffff" />
      <pointLight position={[-10, 5, 5]} intensity={2.0} color={style === 'royal_gold' ? '#FFD700' : '#ffffff'} />
      
      {/* Cinematic Lighting & Bloom para o High-Level Corporate Success */}
      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.5} />
      </EffectComposer>
      
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
      <Sparkles count={100} scale={30} size={2} speed={0.2} opacity={0.5} color={style === 'royal_gold' ? '#FFD700' : '#ffffff'} />
      
      {elements.map((el, i) => (
        <PhysicsItem key={`${style}-${i}`} {...el} />
      ))}
      
      <Environment preset="city" />
    </>
  );
}

// 3. WRAPPER CONTAINER (Truly Persistent Canvas)
export function CelebrationCanvas3D({ active }) {
  // Mantemos a cena renderizando mesmo após o active ser nulo para evitar o "congelamento de último frame" 
  // O Canvas vai "fazer o fade out" enquanto a cena continua viva por baixo.
  const [activeScene, setActiveScene] = useState(active);

  useEffect(() => {
    if (active) {
      setActiveScene(active);
    } else {
      const timeout = setTimeout(() => setActiveScene(null), 1000);
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
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' }} />

      <Canvas 
        shadows 
        dpr={[1, 2]} 
        gl={{ antialias: false, alpha: true }} 
        camera={{ position: [0, 0, 15] }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        {activeScene && <CelebrationScene style={activeScene} />}
      </Canvas>
    </motion.div>
  );
}

// 4. NOTA FINAL: Sistema de Celebração Premium v12.1
// Estabilização completa do contexto WebGL com física ultra-lenta.

