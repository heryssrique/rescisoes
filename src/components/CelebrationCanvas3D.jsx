import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, PerspectiveCamera, Environment, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// 1. COMPONENTE BASE: ITEM COM FÍSICA 3D
function PhysicsItem({ type, position, rotation, scale, color, velocity, gravity = 0.005 }) {
  const mesh = useRef();
  const vel = useRef(new THREE.Vector3(...velocity));
  const pos = useRef(new THREE.Vector3(...position));
  const rot = useRef(new THREE.Vector3(...rotation));

  useFrame(() => {
    if (!mesh.current) return;
    
    // Aplicar gravidade à velocidade
    vel.current.y -= gravity;
    
    // Atualizar posição
    pos.current.add(vel.current);
    
    // Atualizar rotação
    mesh.current.rotation.x += rot.current.x;
    mesh.current.rotation.y += rot.current.y;
    mesh.current.rotation.z += rot.current.z;
    
    mesh.current.position.copy(pos.current);

    // Reset ou morte (se sair muito da tela)
    if (pos.current.y < -15) {
      pos.current.y = 15; // Loop para cascatas
      vel.current.y = velocity[1];
    }
  });

  const getGeometry = () => {
    if (type === 'coin') return <cylinderGeometry args={[1, 1, 0.1, 32]} />;
    if (type === 'box') return <boxGeometry args={[1, 1, 1]} />;
    if (type === 'sparkle') return <sphereGeometry args={[0.5, 16, 16]} />;
    return <icosahedronGeometry args={[0.7, 0]} />;
  };

  const getMaterial = () => {
    if (type === 'diamond') return (
      <meshPhysicalMaterial 
        color={color} metalness={0.1} roughness={0} 
        transmission={1} thickness={1} ior={2.4} 
        iridescence={0.5} reflectivity={1} 
      />
    );
    return (
      <meshStandardMaterial 
        color={color} 
        metalness={type === 'coin' ? 0.9 : 0.5} 
        roughness={0.2} 
        emissive={color} 
        emissiveIntensity={type === 'box' || type === 'sparkle' ? 2 : 0.2} 
      />
    );
  };

  return (
    <mesh ref={mesh} position={position} scale={type === 'sparkle' ? scale * 0.3 : type === 'box' ? scale * 0.5 : scale}>
      {getGeometry()}
      {getMaterial()}
    </mesh>
  );
}

// 2. CENA DE CELEBRAÇÃO ESPECIALIZADA
function CelebrationScene({ style = 'royal_gold' }) {
  const count = style === 'midnight_fireworks' ? 120 : 80;
  
  const elements = useMemo(() => {
    const rainbowColors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#8b00ff'];
    const corporateColors = ['#00f2ff', '#7d00ff', '#ff00ea', '#ffffff'];
    const goldColors = ['#FFD700', '#DAA520', '#B8860B', '#f59e0b'];
    
    return new Array(count).fill().map((_, i) => {
      let type = 'diamond';
      let color = '#ffffff';
      let position = [0, 0, 0];
      let velocity = [0, 0, 0];
      let gravity = 0.005;

      if (style === 'royal_gold') {
        type = Math.random() > 0.4 ? 'coin' : 'diamond';
        color = goldColors[i % goldColors.length];
        position = [THREE.MathUtils.randFloatSpread(25), 15 + Math.random() * 10, THREE.MathUtils.randFloatSpread(10)];
        velocity = [Math.random() * 0.02 - 0.01, -0.05 - Math.random() * 0.05, 0];
      } else if (style === 'classic_rh') {
        type = Math.random() > 0.5 ? 'coin' : 'sparkle';
        color = ['#3b82f6', '#6366f1', '#f59e0b', '#ffffff'][i % 4];
        const fromLeft = i % 2 === 0;
        position = [fromLeft ? -15 : 15, -10, 0];
        velocity = [fromLeft ? 0.15 + Math.random() * 0.1 : -0.15 - Math.random() * 0.1, 0.2 + Math.random() * 0.2, Math.random() * 0.05 - 0.025];
        gravity = 0.008;
      } else if (style === 'midnight_fireworks') {
        type = 'sparkle';
        color = ['#ffffff', '#FFD700', '#3b82f6', '#ff00ea'][i % 4];
        // Múltiplos pontos de explosão
        const burstIdx = Math.floor(i / 30);
        const burstPos = [THREE.MathUtils.randFloatSpread(30), THREE.MathUtils.randFloat(0, 10), THREE.MathUtils.randFloatSpread(10)];
        position = [...burstPos];
        const speed = 0.1 + Math.random() * 0.2;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        velocity = [
          speed * Math.sin(phi) * Math.cos(theta),
          speed * Math.sin(phi) * Math.sin(theta),
          speed * Math.cos(phi)
        ];
        gravity = 0.003;
      } else if (style === 'neon_corporate') {
        type = Math.random() > 0.5 ? 'box' : 'diamond';
        color = corporateColors[i % corporateColors.length];
        position = [THREE.MathUtils.randFloatSpread(30), 15, THREE.MathUtils.randFloatSpread(15)];
        velocity = [0, -0.1 - Math.random() * 0.1, 0];
      } else {
        // Rainbow/Default
        type = 'diamond';
        color = rainbowColors[i % rainbowColors.length];
        position = [THREE.MathUtils.randFloatSpread(25), 15, THREE.MathUtils.randFloatSpread(10)];
        velocity = [0, -0.05 - Math.random() * 0.05, 0];
      }

      return {
        type, 
        color, 
        position, 
        velocity, 
        gravity,
        rotation: [Math.random() * 0.1, Math.random() * 0.1, Math.random() * 0.1],
        scale: Math.random() * 0.5 + 0.4
      };
    });
  }, [count, style]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 15]} />
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

// 3. WRAPPER CONTAINER
export function CelebrationCanvas3D({ active, onComplete }) {
  if (!active) return null;

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      zIndex: 999999, 
      pointerEvents: 'none',
      background: 'rgba(0,0,0,0.15)',
      backdropFilter: 'blur(3px)'
    }}>
      <Canvas shadows dpr={[1, 2]}>
        <CelebrationScene style={active} />
      </Canvas>
    </div>
  );
}
