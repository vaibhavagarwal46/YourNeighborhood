// frontend/src/components/3D/FloatingCity.js
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';

function NodeNetwork() {
  const ref = useRef();

  // Create an array of random coordinates for our network nodes
  const count = 150;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 15;     // X axis width
    positions[i + 1] = (Math.random() - 0.5) * 8;  // Y axis height
    positions[i + 2] = (Math.random() - 0.5) * 10; // Z axis depth
  }

  // Slowly rotate the network for a premium feel
  useFrame((state) => {
    ref.current.rotation.y = state.clock.getElapsedTime() * 0.03;
    ref.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.05;
  });

  return (
    <group ref={ref}>
      <Points positions="{positions}" stride="{3}">
        <PointMaterial transparent color="#00c896" size="{0.08}" sizeAttenuation="{true}" depthWrite="{false}" opacity="{0.6}"/>
      </Points>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} color="#7c3aed" />
    </group>
  );
}

export default function FloatingCity() {
  return (
    <div className="canvas-container">
      <Canvas camera={{ position: [0, 0, 6], fov: 60 }}>
        <NodeNetwork/>
      </Canvas>
    </div>
  );
}