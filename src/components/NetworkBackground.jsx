import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

function Network() {
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
    const pointsCount = 200;
    
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
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
        groupRef.current.rotation.y += delta * 0.03;
        groupRef.current.rotation.x += delta * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1.5}>
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={positions.length / 3}
              array={positions}
              itemSize={3}
            />
          </bufferGeometry>
          {/* Using Dell primary blue mapping to dark shapes so it shows up beautifully on the white bg */}
          <pointsMaterial 
              size={0.6} 
              color="#0076CE" 
              map={circleTexture} 
              transparent 
              opacity={0.8} 
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
          <lineBasicMaterial color="#0058A3" transparent opacity={0.3} />
        </lineSegments>
      </Float>
    </group>
  );
}

export default function NetworkBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#F8F8F8]">
      <Canvas camera={{ position: [0, 0, 20], fov: 60 }}>
        {/* Light Fog to blend network securely into the white/gray background */}
        <fog attach="fog" args={['#F8F8F8', 8, 30]} />
        <ambientLight intensity={1} />
        <Network />
      </Canvas>
      {/* Light gradient overlay to frame the text nicely without stealing clicks */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F8F8F8]/40 via-transparent to-[#F8F8F8]"></div>
    </div>
  );
}
