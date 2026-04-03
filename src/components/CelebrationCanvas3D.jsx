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
const NEON_RIBBON_GEOM = new THREE.BoxGeometry(0.08, 1.5, 0.2); // Fitas de confetti 3D
const NEON_RING_GEOM = new THREE.TorusGeometry(0.5, 0.08, 8, 24); // Anéis cibernéticos

// 1. COMPONENTE BASE: ITEM COM FÍSICA 3D
function PhysicsItem({ type, position, rotation, scale, color, velocity, gravity = 0.005, damping = 0.992 }) {
  const mesh = useRef();
  const vel = useRef(new THREE.Vector3(...velocity));
  const pos = useRef(new THREE.Vector3(...position));
  const rot = useRef(new THREE.Vector3(...rotation));

  useFrame(() => {
    if (!mesh.current) return;
    
    // Aplicar gravidade à velocidade
    vel.current.y -= gravity;
    
    // Damping customizável (Amortecimento aerodinâmico)
    vel.current.multiplyScalar(damping);
    
    // Atualizar posição (cinemática ou linear dependendo do damping)
    const timeScale = damping < 0.99 ? 1 : 0.5; // Se não houver mto damping, rola rapido, senão cinematico
    pos.current.x += vel.current.x * timeScale;
    pos.current.y += vel.current.y * timeScale;
    pos.current.z += vel.current.z * timeScale;
    
    // Atualizar rotação
    mesh.current.rotation.x += rot.current.x * (timeScale === 1 ? 1 : 0.1);
    mesh.current.rotation.y += rot.current.y * (timeScale === 1 ? 1 : 0.1);
    mesh.current.rotation.z += rot.current.z * (timeScale === 1 ? 1 : 0.1);
    
    mesh.current.position.copy(pos.current);

    // Reset ou morte (se sair muito da tela)
    if (pos.current.y < -20) {
      pos.current.y = 20; 
      vel.current.y = velocity[1];
    }
  });

  // Memoizar geometria baseada no tipo para economizar GPU
  const geometry = useMemo(() => {
    if (type === 'coin') return COIN_GEOM;
    if (type === 'box') return BOX_GEOM;
    if (type === 'sparkle') return SPARKLE_GEOM;
    if (type === 'neon_ribbon') return NEON_RIBBON_GEOM;
    if (type === 'neon_ring') return NEON_RING_GEOM;
    return DIAMOND_GEOM;
  }, [type]);

  // Memoizar material para evitar re-alocação a cada frame
  const material = useMemo(() => {
    if (type === 'diamond') return new THREE.MeshPhysicalMaterial({ 
      color: 0xffffff, metalness: 0, roughness: 0, transmission: 1, thickness: 1.5, ior: 2.417, iridescence: 0.3, reflectivity: 1, clearcoat: 1, envMapIntensity: 2
    });
    const isNeon = type.includes('neon');
    return new THREE.MeshStandardMaterial({ 
      color, 
      metalness: type === 'coin' ? 0.9 : 0.2, 
      roughness: isNeon ? 0 : 0.2, 
      emissive: color, 
      emissiveIntensity: isNeon ? 8 : (type === 'sparkle' ? 2 : 0.2) 
    });
  }, [type, color]);

  return (
    <mesh ref={mesh} geometry={geometry} material={material} position={position} scale={type === 'sparkle' ? scale * 0.8 : scale} />
  );
}

// 2. CENA DE CELEBRAÇÃO ESPECIALIZADA
function CelebrationScene({ style = 'royal_gold' }) {
  const count = style === 'midnight_fireworks' ? 180 : (style === 'neon_corporate' ? 150 : 80);
  
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
        position = [THREE.MathUtils.randFloatSpread(25), 15 + Math.random() * 10, THREE.MathUtils.randFloatSpread(10)];
        velocity = [Math.random() * 0.005 - 0.0025, -0.005 - Math.random() * 0.01, 0];
        gravity = 0.0004;
      } else if (style === 'classic_rh') {
        type = Math.random() > 0.5 ? 'coin' : 'sparkle';
        color = ['#3b82f6', '#6366f1', '#f59e0b', '#ffffff'][i % 4];
        const fromLeft = i % 2 === 0;
        position = [fromLeft ? -15 : 15, -10, 0];
        velocity = [fromLeft ? 0.04 + Math.random() * 0.03 : -0.04 - Math.random() * 0.03, 0.08 + Math.random() * 0.08, Math.random() * 0.02 - 0.01];
        gravity = 0.0006;
      } else if (style === 'midnight_fireworks') {
        type = 'sparkle';
        color = ['#ff0055', '#FFD700', '#00f2ff', '#ff00ea'][i % 4];
        
        const center = fireworksCenters[i % 3];
        position = [...center];
        
        const speed = 0.08 + Math.random() * 0.12; 
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1); 
        velocity = [
          speed * Math.sin(phi) * Math.cos(theta),
          speed * Math.cos(phi), 
          speed * Math.sin(phi) * Math.sin(theta)
        ];
        gravity = 0.0008; 
      } else if (style === 'neon_corporate') {
        // High-Tech Cyber Explosão (Fitas 3D espessas e Anéis Virtuais)
        type = Math.random() > 0.7 ? 'neon_ring' : 'neon_ribbon';
        color = corporateColors[i % corporateColors.length];
        position = [THREE.MathUtils.randFloatSpread(5), -5, THREE.MathUtils.randFloatSpread(5)];
        velocity = [
          THREE.MathUtils.randFloatSpread(0.2), 
          0.1 + Math.random() * 0.25, // Explosão pra cima
          THREE.MathUtils.randFloatSpread(0.2)
        ];
        rotation = [Math.random() * 0.4, Math.random() * 0.4, Math.random() * 0.4];
        gravity = 0.002; // Gravidade realista para explodir logo
        damping = 0.97; // Alta fricção simulando ambiente digital (dados caindo)
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

