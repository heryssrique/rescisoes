import React, { useMemo, useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

/**
 * ROYAL CELEBRATION ENGINE - 100% 3D FANTASTIC VERSION
 */

const DIAMOND_GEOM = new THREE.IcosahedronGeometry(0.5, 0); 
const COIN_GEOM = new THREE.CylinderGeometry(0.5, 0.5, 0.12, 32); 

// ─── 1. ROYAL GOLD & DIAMONDS ────────────────────────────
function RoyalScene({ trigger }) {
  const cRef = useRef();
  const dRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const TOTAL = 400;
  
  const parts = useMemo(() => {
    const t = [];
    for (let i = 0; i < TOTAL; i++) {
        const type = Math.random() > 0.45 ? 'coin' : 'diam';
        t.push({
          type,
          pos: new THREE.Vector3((Math.random() - 0.5) * 1.5, 8.0, (Math.random() - 0.5) * 2),
          vel: new THREE.Vector3((Math.random() - 0.5) * 0.45, -(Math.random() * 0.15 + 0.05), (Math.random() - 0.5) * 0.25),
          rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
          rv: new THREE.Euler((Math.random() - 0.5) * 0.12, (Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.12),
          scale: type === 'coin' ? 1.6 + Math.random() * 0.6 : 1.1 + Math.random() * 0.5,
          age: 0,
          delay: Math.random() * 0.6,
        });
      }
      return t;
    }, [trigger]);

  useFrame((state, delta) => {
    let ci = 0, di = 0;
    const spd = Math.min(delta, 0.1) * 60;
    parts.forEach((p) => {
      p.age += delta;
      if (p.age < p.delay) {
        dummy.position.set(0, 100, 0);
        dummy.scale.setScalar(0);
      } else {
        p.vel.x *= 0.985; p.vel.z *= 0.985;
        p.vel.y -= 0.0025 * spd;
        p.pos.addScaledVector(p.vel, spd);
        p.rot.x += p.rv.x * spd; p.rot.y += p.rv.y * spd;
        dummy.position.copy(p.pos);
        dummy.rotation.copy(p.rot);
        let s = p.scale;
        if (p.pos.y < -12) s *= Math.max(0, 1 - ((-12 - p.pos.y) / 6));
        dummy.scale.setScalar(s);
      }
      dummy.updateMatrix();
      if (p.type === 'coin') cRef.current?.setMatrixAt(ci++, dummy.matrix);
      else dRef.current?.setMatrixAt(di++, dummy.matrix);
    });
    if (cRef.current) { cRef.current.count = ci; cRef.current.instanceMatrix.needsUpdate = true; }
    if (dRef.current) { dRef.current.count = di; dRef.current.instanceMatrix.needsUpdate = true; }
  });

  return (
    <group>
      <instancedMesh ref={cRef} args={[COIN_GEOM, null, TOTAL]}>
        <meshStandardMaterial color="#FFD700" metalness={1.0} roughness={0.15} emissive="#B8860B" emissiveIntensity={0.1} />
      </instancedMesh>
      <instancedMesh ref={dRef} args={[DIAMOND_GEOM, null, TOTAL]}>
        <meshPhysicalMaterial color="#ffffff" metalness={0.2} roughness={0} transparent opacity={0.8} transmission={0.9} thickness={0.5} emissive="#E0F7FA" emissiveIntensity={0.1} />
      </instancedMesh>
    </group>
  );
}

// ─── 2. MIDNIGHT FIREWORKS (3D LIGHT BURST) ──────────────
const FW_GEOM = new THREE.SphereGeometry(0.12, 4, 4);

function FireworkScene({ trigger }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const PART_COUNT = 450;
  const colors = ['#3b82f6', '#6366f1', '#a855f7', '#ffffff', '#ffd700', '#ec4899'];
  
  const bursts = useMemo(() => {
    const b = [];
    for (let i = 0; i < 6; i++) {
        const origin = new THREE.Vector3((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 4);
        const color = colors[Math.floor(Math.random() * colors.length)];
        const delay = i * 1.0;
        for (let j = 0; j < 75; j++) {
            const phi = Math.acos(-1 + (2 * j) / 75);
            const theta = Math.sqrt(75 * Math.PI) * phi;
            b.push({
                pos: origin.clone(),
                vel: new THREE.Vector3(Math.cos(theta) * Math.sin(phi), Math.sin(theta) * Math.sin(phi), Math.cos(phi)).multiplyScalar(0.4 + Math.random() * 0.3),
                color: new THREE.Color(color),
                age: 0,
                delay: delay
            });
        }
    }
    return b;
  }, [trigger]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const spd = Math.min(delta, 0.1) * 60;
    bursts.forEach((p, i) => {
        p.age += delta;
        if (p.age < p.delay) {
            dummy.scale.setScalar(0);
        } else {
            p.vel.multiplyScalar(0.965);
            p.vel.y -= 0.005 * spd;
            p.pos.addScaledVector(p.vel, spd);
            dummy.position.copy(p.pos);
            const life = 1.0 - ((p.age - p.delay) / 4.5);
            dummy.scale.setScalar(Math.max(0, life * 1.8));
        }
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[FW_GEOM, null, PART_COUNT]}>
        <meshStandardMaterial emissive="#FFFFFF" emissiveIntensity={10} />
    </instancedMesh>
  );
}

// ─── 3. RH PRIDE (3D RAINBOW CRYSTALS) ───────────────────
function PrideScene({ trigger }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const TOTAL = 400;
  const PRIDE_COLORS = ['#ff0000', '#ff8700', '#ffd300', '#deff0a', '#a1ff0a', '#0aff99', '#0aefff', '#147df5', '#580aff', '#be0aff'];

  const parts = useMemo(() => {
    const t = [];
    for (let i = 0; i < TOTAL; i++) {
        t.push({
            pos: new THREE.Vector3((Math.random() - 0.5) * 22, 10, (Math.random() - 0.5) * 5),
            vel: new THREE.Vector3((Math.random() - 0.5) * 0.1, -(Math.random() * 0.12 + 0.05), (Math.random() - 0.5) * 0.1),
            rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
            delay: Math.random() * 6,
            age: 0
        });
    }
    return t;
  }, [trigger]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const spd = Math.min(delta, 0.1) * 60;
    parts.forEach((p, i) => {
        p.age += delta;
        if (p.age < p.delay) {
            dummy.scale.setScalar(0);
        } else {
            p.pos.addScaledVector(p.vel, spd);
            p.rot.x += 0.05; p.rot.y += 0.05;
            dummy.position.copy(p.pos);
            dummy.rotation.copy(p.rot);
            dummy.scale.setScalar(0.9);
            if (p.pos.y < -14) p.pos.y = 12; 
        }
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[DIAMOND_GEOM, null, TOTAL]}>
        <meshStandardMaterial emissive="#FFFFFF" emissiveIntensity={0.8} />
    </instancedMesh>
  );
}

export const CelebrationCanvas3D = ({ mode }) => {
  const [active, setActive] = useState(null);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    if (mode) {
      setActive(mode.toLowerCase());
      setTrigger(t => t + 1);
      const timer = setTimeout(() => setActive(null), 12500);
      return () => clearTimeout(timer);
    }
  }, [mode]);

  if (!active) return null;

  return (
    <AnimatePresence>
      <motion.div 
        key="celebration-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 99999, background: 'radial-gradient(circle at center, rgba(0,0,0,0) 20%, rgba(0,0,0,0.4) 100%)' }}
      >
        <Canvas gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }} dpr={[1, 1.5]}>
          <PerspectiveCamera makeDefault position={[0, 0, 18]} fov={55} />
          <Suspense fallback={null}>
            <Environment preset="city" />
            <ambientLight intensity={0.5} />
            <spotLight position={[5, 15, 10]} intensity={200} color="#FFD700" />
            
            {active.includes('gold') && <RoyalScene trigger={trigger} />}
            {active.includes('firework') && <FireworkScene trigger={trigger} />}
            {active.includes('rh') && <PrideScene trigger={trigger} />}
            
            <EffectComposer multisampling={0}>
              <Bloom intensity={1.8} luminanceThreshold={0.5} mipmapBlur={true} />
            </EffectComposer>
          </Suspense>
        </Canvas>
      </motion.div>
    </AnimatePresence>
  );
}
