import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, PerspectiveCamera, Environment, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// 1. COMPONENTE: MOEDA DE OURO 3D
function GoldCoin({ position, rotation, scale, color = '#FFD700' }) {
  const mesh = useRef();
  // Geometria de cilindro fino para simular moeda
  const geometry = useMemo(() => new THREE.CylinderGeometry(1, 1, 0.1, 32), []);
  // Material metálico premium
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: color,
    metalness: 0.9,
    roughness: 0.1,
    emissive: color,
    emissiveIntensity: 0.1
  }), [color]);

  useFrame((state) => {
    if (!mesh.current) return;
    mesh.current.position.y -= 0.05; // Queda constante
    mesh.current.rotation.x += rotation[0];
    mesh.current.rotation.y += rotation[1];
    mesh.current.rotation.z += rotation[2];
    
    // Reset se sair da tela
    if (mesh.current.position.y < -10) {
      mesh.current.position.y = 10;
    }
  });

  return (
    <mesh ref={mesh} position={position} geometry={geometry} material={material} scale={scale} castShadow />
  );
}

// 2. COMPONENTE: DIAMANTE 3D
function Diamond({ position, rotation, scale, color = '#E0F7FA' }) {
  const mesh = useRef();
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(0.7, 0), []);
  const material = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: color,
    metalness: 0.1,
    roughness: 0,
    transmission: 1, // Vidro
    thickness: 1,
    ior: 2.4, // Indice de refração do diamante
    iridescence: 0.5,
    reflectivity: 1
  }), [color]);

  useFrame(() => {
    if (!mesh.current) return;
    mesh.current.position.y -= 0.04;
    mesh.current.rotation.y += rotation[1];
    if (mesh.current.position.y < -10) mesh.current.position.y = 10;
  });

  return (
    <mesh ref={mesh} position={position} geometry={geometry} material={material} scale={scale} />
  );
}

// 3. CENA DE CELEBRAÇÃO
function CelebrationScene({ count = 60, style = 'royal_gold' }) {
  const elements = useMemo(() => {
    const rainbowColors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#8b00ff'];
    const corporateColors = ['#3b82f6', '#6366f1', '#a855f7', '#ffffff'];
    
    return new Array(count).fill().map((_, i) => {
      let color = '#FFD700';
      if (style === 'rainbow') color = rainbowColors[i % rainbowColors.length];
      else if (style === 'corporate') color = corporateColors[i % corporateColors.length];

      return {
        position: [THREE.MathUtils.randFloatSpread(20), THREE.MathUtils.randFloat(5, 15), THREE.MathUtils.randFloatSpread(10)],
        rotation: [Math.random() * 0.05, Math.random() * 0.05, Math.random() * 0.05],
        scale: Math.random() * 0.4 + 0.3,
        type: Math.random() > 0.3 ? 'coin' : 'diamond',
        color: color
      };
    });
  }, [count, style]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 10]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={2} color="#ffffff" />
      <pointLight position={[-10, 5, 5]} intensity={1} color={style === 'royal_gold' ? '#FFD700' : '#ffffff'} />
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Sparkles count={100} scale={20} size={2} speed={0.5} color={style === 'royal_gold' ? '#FFD700' : '#ffffff'} />
      
      {elements.map((el, i) => (
        el.type === 'coin' 
          ? <GoldCoin key={i} {...el} /> 
          : <Diamond key={i} {...el} />
      ))}
      
      <Environment preset="city" />
    </>
  );
}

// 4. WRAPPER CONTAINER
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
      background: 'rgba(0,0,0,0.1)',
      backdropFilter: 'blur(2px)' // Efeito de profundidade solicitado
    }}>
      <Canvas shadows dpr={[1, 2]}>
        <CelebrationScene />
      </Canvas>
    </div>
  );
}
