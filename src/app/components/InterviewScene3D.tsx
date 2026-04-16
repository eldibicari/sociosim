"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── Abstract geometric figure ────────────────────────────────────────────────
function AbstractFigure({
  position,
  facing,
  colorHex,
  phaseOffset = 0,
}: {
  position: [number, number, number];
  facing: number;
  colorHex: string;
  phaseOffset?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  const mat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(colorHex),
        transparent: true,
        opacity: 0.8,
      }),
    [colorHex]
  );

  const mesh = useMemo(() => {
    const points: THREE.Vector3[] = [
      // Head (octagon)
      ...Array.from({ length: 8 }, (_, k) => {
        const a = (k / 8) * Math.PI * 2;
        const b = ((k + 1) / 8) * Math.PI * 2;
        return [
          new THREE.Vector3(Math.cos(a) * 0.22, 0.44 + Math.sin(a) * 0.22, 0),
          new THREE.Vector3(Math.cos(b) * 0.22, 0.44 + Math.sin(b) * 0.22, 0),
        ];
      }).flat(),
      // Torso
      new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.7, 0),
      // Shoulders
      new THREE.Vector3(-0.45, -0.1, 0), new THREE.Vector3(0.45, -0.1, 0),
      // Arms
      new THREE.Vector3(-0.45, -0.1, 0), new THREE.Vector3(-0.55, -0.55, 0),
      new THREE.Vector3(0.45, -0.1, 0), new THREE.Vector3(0.55, -0.55, 0),
      // Legs
      new THREE.Vector3(-0.12, -0.7, 0), new THREE.Vector3(-0.22, -1.3, 0),
      new THREE.Vector3(0.12, -0.7, 0), new THREE.Vector3(0.22, -1.3, 0),
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return new THREE.LineSegments(geo, mat);
  }, [mat]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime() + phaseOffset;
    groupRef.current.rotation.y = facing + Math.sin(t * 0.4) * 0.12;
    groupRef.current.position.y = position[1] + Math.sin(t * 0.6) * 0.04;
    // eslint-disable-next-line react-compiler/react-compiler
    mat.opacity = 0.55 + Math.sin(t * 1.2) * 0.25;
  });

  return (
    <group ref={groupRef} position={position}>
      <primitive object={mesh} />
    </group>
  );
}

// ─── Floating particles ───────────────────────────────────────────────────────
function Particles({ count = 40, color }: { count?: number; color: string }) {
  const groupRef = useRef<THREE.Group>(null);

  // eslint-disable-next-line react-compiler/react-compiler
  const { group } = useMemo(() => {
    const g = new THREE.Group();
    const geo = new THREE.SphereGeometry(0.018, 4, 4);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.45,
    });
    /* eslint-disable react-compiler/react-compiler */
    const positions = Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 8,
      y: (Math.random() - 0.5) * 5,
      z: (Math.random() - 0.5) * 3,
      speed: 0.3 + Math.random() * 0.4,
      offset: Math.random() * Math.PI * 2,
    }));
    /* eslint-enable react-compiler/react-compiler */
    positions.forEach((p) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(p.x, p.y, p.z);
      m.userData = { speed: p.speed, offset: p.offset, baseY: p.y };
      g.add(m);
    });
    return { group: g, positions };
  }, [count, color]);

  useEffect(() => {
    if (groupRef.current) groupRef.current.add(group);
    return () => { group.clear(); };
  }, [group]);

  useFrame(({ clock }) => {
    group.children.forEach((child) => {
      const { speed, offset, baseY } = child.userData as { speed: number; offset: number; baseY: number };
      child.position.y = baseY + Math.sin(clock.getElapsedTime() * speed + offset) * 0.15;
    });
  });

  return <group ref={groupRef} />;
}

// ─── Connection beam ──────────────────────────────────────────────────────────
function ConnectionBeam() {
  const beam = useMemo(() => {
    const pts = [new THREE.Vector3(-1.8, -0.5, 0), new THREE.Vector3(1.8, -0.5, 0)];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color("#6366f1"),
      transparent: true,
      opacity: 0.25,
    });
    return new THREE.LineSegments(geo, mat);
  }, []);

  useFrame(({ clock }) => {
    // eslint-disable-next-line react-compiler/react-compiler
    (beam.material as THREE.LineBasicMaterial).opacity =
      0.1 + Math.sin(clock.getElapsedTime() * 1.5) * 0.1;
  });

  return <primitive object={beam} />;
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 2, 3]} intensity={0.6} color="#6366f1" />
      <pointLight position={[-3, 0, 2]} intensity={0.35} color="#ec4899" />
      <pointLight position={[3, 0, 2]} intensity={0.35} color="#06b6d4" />
      <AbstractFigure position={[-1.8, 0.5, 0]} facing={0.5} colorHex="#818cf8" phaseOffset={0} />
      <AbstractFigure position={[1.8, 0.5, 0]} facing={-0.5} colorHex="#34d399" phaseOffset={1.6} />
      <ConnectionBeam />
      <Particles count={50} color="#6366f1" />
    </>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export function InterviewScene3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.5]}
    >
      <Scene />
    </Canvas>
  );
}
