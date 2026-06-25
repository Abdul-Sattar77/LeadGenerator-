"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// A slowly-rotating point-cloud globe (indigo) — "find leads anywhere on the map".
function Globe() {
  const group = useRef();

  const positions = useMemo(() => {
    const N = 2800;
    const r = 2.25;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2; // -1..1
      const rad = Math.sqrt(1 - y * y);
      const theta = Math.PI * (3 - Math.sqrt(5)) * i; // golden angle
      pos[i * 3] = Math.cos(theta) * rad * r;
      pos[i * 3 + 1] = y * r;
      pos[i * 3 + 2] = Math.sin(theta) * rad * r;
    }
    return pos;
  }, []);

  // A few brighter "hot lead" points scattered on the surface.
  const hot = useMemo(() => {
    const N = 60;
    const r = 2.28;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const rad = Math.sqrt(1 - y * y);
      const theta = Math.PI * (3 - Math.sqrt(5)) * i * 2.3;
      pos[i * 3] = Math.cos(theta) * rad * r;
      pos[i * 3 + 1] = y * r;
      pos[i * 3 + 2] = Math.sin(theta) * rad * r;
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.14;
      group.current.rotation.x = 0.32;
    }
  });

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={positions} count={positions.length / 3} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.032} color="#6366f1" sizeAttenuation transparent opacity={0.8} depthWrite={false} />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={hot} count={hot.length / 3} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.09} color="#d946ef" sizeAttenuation transparent opacity={0.95} depthWrite={false} />
      </points>
    </group>
  );
}

export default function HeroGlobe() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }} style={{ background: "transparent" }}>
      <Globe />
    </Canvas>
  );
}
