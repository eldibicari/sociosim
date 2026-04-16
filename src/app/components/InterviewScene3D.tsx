"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// ─── Abstract geometric figure (wireframe humanoid) ───────────────────────────
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
  const color = new THREE.Color(colorHex);

  // Line material with glow-like emissive color
  const mat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.85,
        linewidth: 1,
      }),
    [color]
  );

  // Build geometry: head (sphere wireframe) + torso + arms + legs
  const head = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.22, 8, 6);
    return new THREE.WireframeGeometry(geo);
  }, []);

  const torso = useMemo(() => {
    const pts = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -0.7, 0),
    ];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  const shoulders = useMemo(() => {
    const pts = [
      new THREE.Vector3(-0.45, -0.1, 0),
      new THREE.Vector3(0, -0.1, 0),
      new THREE.Vector3(0.45, -0.1, 0),
    ];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  const armL = useMemo(() => {
    const pts = [
      new THREE.Vector3(-0.45, -0.1, 0),
      new THREE.Vector3(-0.55, -0.55, 0),
    ];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  const armR = useMemo(() => {
    const pts = [
      new THREE.Vector3(0.45, -0.1, 0),
      new THREE.Vector3(0.55, -0.55, 0),
    ];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  const legL = useMemo(() => {
    const pts = [
      new THREE.Vector3(-0.12, -0.7, 0),
      new THREE.Vector3(-0.22, -1.3, 0),
    ];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  const legR = useMemo(() => {
    const pts = [
      new THREE.Vector3(0.12, -0.7, 0),
      new THREE.Vector3(0.22, -1.3, 0),
    ];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime() + phaseOffset;

    // Breathing / subtle sway
    groupRef.current.rotation.y = facing + Math.sin(t * 0.4) * 0.12;
    groupRef.current.position.y = position[1] + Math.sin(t * 0.6) * 0.04;

    // Pulse opacity via material
    mat.opacity = 0.6 + Math.sin(t * 1.2) * 0.25;
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Head */}
      <lineSegments geometry={head} material={mat} position={[0, 0.22, 0]} />
      {/* Body */}
      <line geometry={torso} material={mat} />
      <line geometry={shoulders} material={mat} />
      <line geometry={armL} material={mat} />
      <line geometry={armR} material={mat} />
      <line geometry={legL} material={mat} />
      <line geometry={legR} material={mat} />
    </group>
  );
}

// ─── Floating particles ───────────────────────────────────────────────────────
function Particles({ count = 60, color }: { count?: number; color: string }) {
  const ref = useRef<THREE.Points>(null);

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4;
      sz[i] = Math.random() * 2 + 0.5;
    }
    return [pos, sz];
  }, [count]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.getElapsedTime() * 0.04;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.03}
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
}

// ─── Connection line between figures ─────────────────────────────────────────
function ConnectionBeam() {
  const ref = useRef<THREE.Line>(null);

  const geo = useMemo(() => {
    const pts = [new THREE.Vector3(-1.8, -0.5, 0), new THREE.Vector3(1.8, -0.5, 0)];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  const mat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color("#6366f1"),
        transparent: true,
        opacity: 0.3,
        linewidth: 1,
      }),
    []
  );

  useFrame(({ clock }) => {
    if (!ref.current) return;
    (ref.current.material as THREE.LineBasicMaterial).opacity =
      0.15 + Math.sin(clock.getElapsedTime() * 1.5) * 0.15;
  });

  return <line ref={ref} geometry={geo} material={mat} />;
}

// ─── Inner scene ──────────────────────────────────────────────────────────────
function Scene() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 2, 3]} intensity={0.8} color="#6366f1" />
      <pointLight position={[-3, 0, 2]} intensity={0.4} color="#ec4899" />
      <pointLight position={[3, 0, 2]} intensity={0.4} color="#06b6d4" />

      {/* Left figure — facing right */}
      <AbstractFigure
        position={[-1.8, 0.5, 0]}
        facing={0.5}
        colorHex="#818cf8"
        phaseOffset={0}
      />
      {/* Right figure — facing left */}
      <AbstractFigure
        position={[1.8, 0.5, 0]}
        facing={-0.5}
        colorHex="#34d399"
        phaseOffset={1.6}
      />

      {/* Beam connecting them */}
      <ConnectionBeam />

      {/* Ambient particles */}
      <Particles count={80} color="#6366f1" />
    </>
  );
}

// ─── Exported component ───────────────────────────────────────────────────────
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
