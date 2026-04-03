import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, PerspectiveCamera, Environment, Sparkles } from '@react-three/drei';
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
const DIAMOND_GEOM = new THREE.IcosahedronGeometry(0.7, 0);
const BOX_GEOM = new THREE.BoxGeometry(1, 1, 1);
const SPARKLE_GEOM = new THREE.SphereGeometry(0.5, 16, 16);
const NEON_RIBBON_GEOM = new THREE.BoxGeometry(0.08, 1.5, 0.2); 
const NEON_RING_GEOM = new THREE.TorusGeometry(0.5, 0.08, 8, 24); 
const CONFETTI_RECT_GEOM = new THREE.BoxGeometry(0.8, 0.4, 0.02); 
const CONFETTI_SQUARE_GEOM = new THREE.BoxGeometry(0.5, 0.5, 0.02); 
const FIREWORK_GEOM = new THREE.BoxGeometry(0.04, 0.04, 1.0); // Rastro de Pólvora Dinâmico

// 1. COMPONENTE BASE: ITEM COM FÍSICA 3D
function PhysicsItem({ type, position, rotation, scale, color, velocity, gravity = 0.005, damping = 0.992 }) {
  const mesh = useRef();
  const vel = useRef(new THREE.Vector3(...velocity));
  const pos = useRef(new THREE.Vector3(...position));
  const rot = useRef(new THREE.Vector3(...rotation));

  useFrame(() => {
    if (!mesh.current) return;
    
    // Aplicar gravidade
    vel.current.y -= gravity;
    
    // Damping (Amortecimento aerodinâmico)
    vel.current.multiplyScalar(damping);
    
    // Escala de tempo: se o construtor indicar um "slow motion" leve. 
    const timeScale = damping < 0.985 ? 1 : 0.5; 
    
    pos.current.x += vel.current.x * timeScale;
    pos.current.y += vel.current.y * timeScale;
    pos.current.z += vel.current.z * timeScale;
    
    // Rotação Adaptativa e Motion Blur Físico
    if (type === 'firework') {
      const target = pos.current.clone().add(vel.current);
      mesh.current.lookAt(target); 
      // Motion blur autêntico: o rastro se alonga conforme a velocidade atual e se torna um pinguinho de luz quando para
      const speed = vel.current.length();
      mesh.current.scale.z = Math.max(0.1, speed * 8); // Estica o Z
    } else {
      const rotScale = timeScale === 1 ? 1 : 0.15;
      mesh.current.rotation.x += rot.current.x * rotScale;
      mesh.current.rotation.y += rot.current.y * rotScale;
      mesh.current.rotation.z += rot.current.z * rotScale;
    }
    
    mesh.current.position.copy(pos.current);

    // Reset loop
    if (pos.current.y < -25) {
      pos.current.y = 25; 
      vel.current.y = velocity[1];
    }
  });

  const geometry = useMemo(() => {
    if (type === 'coin') return COIN_GEOM;
    if (type === 'box') return BOX_GEOM;
    if (type === 'sparkle') return SPARKLE_GEOM;
    if (type === 'neon_ribbon') return NEON_RIBBON_GEOM;
    if (type === 'neon_ring') return NEON_RING_GEOM;
    if (type === 'confetti_rect') return CONFETTI_RECT_GEOM;
    if (type === 'confetti_square') return CONFETTI_SQUARE_GEOM;
    if (type === 'firework') return FIREWORK_GEOM;
    return DIAMOND_GEOM;
  }, [type]);

  const material = useMemo(() => {
    if (type === 'diamond') return new THREE.MeshPhysicalMaterial({ 
      color: 0xffffff, metalness: 0, roughness: 0, transmission: 1, thickness: 1.5, ior: 2.417, iridescence: 0.3, reflectivity: 1, clearcoat: 1, envMapIntensity: 2
    });
    
    // Fagulhas e Fogos = Pura luz (Basic Material ignora sombras e luzes, é sempre "aceso" 100%)
    if (type === 'firework') return new THREE.MeshBasicMaterial({ color });

    if (type === 'confetti_rect' || type === 'confetti_square') return new THREE.MeshStandardMaterial({
      color, metalness: 0, roughness: 0.8 
    });

    const isNeon = type.includes('neon');
    return new THREE.MeshStandardMaterial({ 
      color, 
      metalness: type === 'coin' ? 0.9 : 0.2, 
      roughness: isNeon ? 0 : 0.2, 
      emissive: color, 
      emissiveIntensity: isNeon ? 8 : (type === 'sparkle' ? 2 : 0) 
    });
  }, [type, color]);

  return (
    <mesh ref={mesh} geometry={geometry} material={material} position={position} scale={type === 'sparkle' ? scale * 0.8 : scale} />
  );
}

// 2. CENA DE CELEBRAÇÃO ESPECIALIZADA
function CelebrationScene({ style = 'royal_gold' }) {
  const count = style === 'midnight_fireworks' ? 200 : (style === 'classic_rh' || style === 'neon_corporate' ? 150 : 80);
  
  const elements = useMemo(() => {
    const rainbowColors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#8b00ff'];
    const corporateColors = ['#00f2ff', '#7d00ff', '#ff00ea', '#ffffff', '#00ffaa'];
    const goldColors = ['#FFD700', '#DAA520', '#B8860B', '#f59e0b'];
    
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
        type = Math.random() > 0.4 ? 'coin' : 'diamond';
        color = goldColors[i % goldColors.length];
        position = [THREE.MathUtils.randFloatSpread(25), 15 + Math.random() * 20, THREE.MathUtils.randFloatSpread(10)];
        velocity = [Math.random() * 0.01 - 0.005, -0.01 - Math.random() * 0.02, 0];
        rotation = [Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5];
        gravity = 0.0003; 
        damping = 0.995; 
      } else if (style === 'classic_rh') {
        type = Math.random() > 0.5 ? 'confetti_rect' : 'confetti_square';
        color = ['#3b82f6', '#6366f1', '#f59e0b', '#ffffff', '#10b981', '#ec4899'][i % 6];
        const fromLeft = i % 2 === 0;
        position = [fromLeft ? -15 : 15, -12, THREE.MathUtils.randFloatSpread(10)]; 
        velocity = [
          fromLeft ? 0.2 + Math.random() * 0.15 : -0.2 - Math.random() * 0.15, 
          0.4 + Math.random() * 0.3, 
          THREE.MathUtils.randFloatSpread(0.15) 
        ];
        rotation = [Math.random() * 0.8, Math.random() * 0.8, Math.random() * 0.8]; 
        gravity = 0.006; 
        damping = 0.98; 
      } else if (style === 'midnight_fireworks') {
        // Estouro Realista (Altíssima energia inicial com forte desaceleração pelo atrito)
        type = 'firework';
        color = ['#ff0055', '#FFD700', '#00f2ff', '#ff00ea'][i % 4];
        
        const center = fireworksCenters[i % 3];
        position = [...center];
        
        const speed = 0.4 + Math.random() * 0.5; // Explosão violentamente forte
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1); 
        velocity = [
          speed * Math.sin(phi) * Math.cos(theta),
          speed * Math.cos(phi), 
          speed * Math.sin(phi) * Math.sin(theta)
        ];
        gravity = 0.004; // Peso sensível para criar a cascata de pólvora caindo
        damping = 0.92; // Alta fricção para barrar a explosão e fazê-la parar no ar como um balão
      } else if (style === 'neon_corporate') {
        // High-Tech Cyber Streams (Estilo Matrix Data Rain / Lasers)
        type = 'neon_ribbon';
        color = corporateColors[i % corporateColors.length];
        // Espalhar pela TELA TODA (Spread 40)
        position = [THREE.MathUtils.randFloatSpread(40), 15 + Math.random() * 20, THREE.MathUtils.randFloatSpread(20)];
        velocity = [
          0, // Sem dispersão horizontal
          -0.2 - Math.random() * 0.3, // Queda VERTICAL EXTREMAMENTE RÁPIDA
          0
        ];
        rotation = [0, 0, 0]; // Retilíneo, como um laser/dado real
        gravity = 0; // Gravidade zero (movimento linear puro)
        // Sem fricção (laser não sofre com ar)
        damping = 1; 
      } else {
        // Rainbow/Default
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
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={2.5} color="#ffffff" />
      <pointLight position={[-10, 5, 5]} intensity={1.5} color={style === 'royal_gold' ? '#FFD700' : '#ffffff'} />
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Sparkles count={150} scale={30} size={2.5} speed={0.6} color={style === 'royal_gold' ? '#FFD700' : '#ffffff'} />
      
      {elements.map((el, i) => (
        <PhysicsItem key={`${style}-${i}`} {...el} />
      ))}
      
      <Environment preset="city" />
    </>
  );
}

// 3. WRAPPER CONTAINER (Truly Persistent Canvas)
export function CelebrationCanvas3D({ active }) {
  // O segredo do 'Context Lost' é o Canvas estar SEMPRE montado
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      zIndex: 999999, 
      pointerEvents: 'none',
    }}>
      <AnimatePresence>
        {active && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%', 
              height: '100%', 
              background: 'rgba(0,0,0,0.15)',
              backdropFilter: 'blur(3px)'
            }}
          />
        )}
      </AnimatePresence>

      <Canvas 
        shadows 
        dpr={[1, 2]} 
        gl={{ antialias: true }} 
        camera={{ position: [0, 0, 15] }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        {active && <CelebrationScene style={active} />}
      </Canvas>
    </div>
  );
}

// 4. NOTA FINAL: Sistema de Celebração Premium v12.1
// Estabilização completa do contexto WebGL com física ultra-lenta.

