"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function Terrain() {
  const ref = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(14, 14, 28, 28);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i);
      p.setZ(i, Math.sin(x * 0.7) * 0.5 + Math.cos(y * 0.6) * 0.45 + Math.sin((x + y) * 0.3) * 0.4);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  useFrame(({ pointer, clock }) => {
    const m = ref.current;
    if (!m) return;
    m.rotation.x = -1.05 + pointer.y * 0.12;
    m.rotation.z = clock.elapsedTime * 0.04 + pointer.x * 0.15;
  });

  return (
    <mesh ref={ref} geometry={geo} position={[0, -0.6, 0]}>
      <meshBasicMaterial color="#B5502C" wireframe transparent opacity={0.55} />
    </mesh>
  );
}

function Parcel({ x, z, s }: { x: number; z: number; s: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = 0.8 + Math.sin(clock.elapsedTime * 0.8 + x) * 0.15;
  });
  return (
    <mesh ref={ref} position={[x, 0.8, z]} rotation={[-Math.PI / 2, 0, 0.3]}>
      <boxGeometry args={[s, s * 0.7, 0.04]} />
      <meshBasicMaterial color="#C8FF4D" wireframe />
    </mesh>
  );
}

/** Homepage-only 3D backdrop: low-poly wireframe terrain + floating plot outlines, mouse-driven depth. */
export default function Hero3D() {
  return (
    <Canvas camera={{ position: [0, 1.5, 6], fov: 50 }} dpr={[1, 1.5]} gl={{ antialias: false, alpha: true }}>
      <Terrain />
      <Parcel x={-2.5} z={0.5} s={1.3} />
      <Parcel x={2.2} z={-0.4} s={1.7} />
      <Parcel x={0.2} z={1.4} s={0.9} />
    </Canvas>
  );
}
