import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { useLocation } from 'react-router-dom';

function Network({ isDashboard }) {
  const groupRef = useRef();

  const circleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(64, 64, 50, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#FFFFFF';
    ctx.fill();
    return new THREE.CanvasTexture(canvas);
  }, []);

  const { positions, linesArray } = useMemo(() => {
    const minDistance = 3.5;
    const pointsCount = isDashboard ? 120 : 200;

    const pts = [];
    for (let i = 0; i < pointsCount; i++) {
      const x = (Math.random() - 0.5) * 40;
      const y = (Math.random() - 0.5) * 40;
      const z = (Math.random() - 0.5) * 25;
      pts.push(new THREE.Vector3(x, y, z));
    }

    const posArray = new Float32Array(pointsCount * 3);
    pts.forEach((p, i) => {
      posArray[i * 3] = p.x;
      posArray[i * 3 + 1] = p.y;
      posArray[i * 3 + 2] = p.z;
    });

    const lnArray = [];
    for (let i = 0; i < pointsCount; i++) {
      for (let j = i + 1; j < pointsCount; j++) {
        const dist = pts[i].distanceTo(pts[j]);
        if (dist < minDistance) {
          lnArray.push(
            pts[i].x, pts[i].y, pts[i].z,
            pts[j].x, pts[j].y, pts[j].z
          );
        }
      }
    }

    const finalLines = new Float32Array(lnArray);
    return { positions: posArray, linesArray: finalLines };
  }, [isDashboard]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.03;
      groupRef.current.rotation.x += delta * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={1.2} rotationIntensity={0.3} floatIntensity={1}>
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={positions.length / 3}
              array={positions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.6}
            color="#0076CE"
            map={circleTexture}
            transparent
            opacity={isDashboard ? 0.3 : 0.8}
            alphaTest={0.05}
            sizeAttenuation={true}
          />
        </points>

        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={linesArray.length / 3}
              array={linesArray}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#0058A3" transparent opacity={isDashboard ? 0.1 : 0.3} />
        </lineSegments>
      </Float>
    </group>
  );
}

export default function NetworkBackground() {
  const location = useLocation();
  const isDashboard = location.pathname === '/rag' || location.pathname === '/dashboard';

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-gradient-to-br from-[#F8FAFC] to-[#FFFFFF]">
      <div className={`transition-opacity duration-1000 ${isDashboard ? 'opacity-10' : 'opacity-100'} w-full h-full`}>
        <Canvas camera={{ position: [0, 0, 20], fov: 60 }}>
          <fog attach="fog" args={['#F8FAFC', 8, 30]} />
          <ambientLight intensity={1} />
          <Network isDashboard={isDashboard} />
        </Canvas>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#F8FAFC]/40 via-transparent to-[#F8FAFC]/20"></div>
    </div>
  );
}
