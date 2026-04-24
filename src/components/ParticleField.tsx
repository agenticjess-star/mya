import { useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 800;

function Particles() {
  const mesh = useRef<THREE.Points>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const { viewport } = useThree();

  const [positions, velocities, basePositions] = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const vel = new Float32Array(PARTICLE_COUNT * 3);
    const base = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const x = (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * 14;
      const z = (Math.random() - 0.5) * 8;
      pos[i3] = x;
      pos[i3 + 1] = y;
      pos[i3 + 2] = z;
      base[i3] = x;
      base[i3 + 1] = y;
      base[i3 + 2] = z;
      vel[i3] = (Math.random() - 0.5) * 0.002;
      vel[i3 + 1] = (Math.random() - 0.5) * 0.001;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.001;
    }
    return [pos, vel, base];
  }, []);

  const sizes = useMemo(() => {
    const s = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      s[i] = Math.random() * 2.5 + 0.5;
    }
    return s;
  }, []);

  const handlePointerMove = useCallback((e: { clientX: number; clientY: number }) => {
    mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }, []);

  // Attach mouse listener
  useMemo(() => {
    window.addEventListener('mousemove', handlePointerMove);
    return () => window.removeEventListener('mousemove', handlePointerMove);
  }, [handlePointerMove]);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const geo = mesh.current.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const t = clock.getElapsedTime();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      // Gentle drift
      arr[i3] += velocities[i3];
      arr[i3 + 1] += velocities[i3 + 1];
      arr[i3 + 2] += velocities[i3 + 2];

      // Breathing
      const breathe = Math.sin(t * 0.3 + i * 0.1) * 0.008;
      arr[i3 + 1] += breathe;

      // Mouse repulsion
      const dx = arr[i3] - mouse.current.x * viewport.width * 0.5;
      const dy = arr[i3 + 1] - mouse.current.y * viewport.height * 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 3) {
        const force = (3 - dist) * 0.003;
        arr[i3] += (dx / dist) * force;
        arr[i3 + 1] += (dy / dist) * force;
      }

      // Soft return to base
      arr[i3] += (basePositions[i3] - arr[i3]) * 0.001;
      arr[i3 + 1] += (basePositions[i3 + 1] - arr[i3 + 1]) * 0.001;
      arr[i3 + 2] += (basePositions[i3 + 2] - arr[i3 + 2]) * 0.001;
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={PARTICLE_COUNT}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color={new THREE.Color('hsl(30, 15%, 50%)')}
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Subtle connecting lines between nearby particles
function ConnectionLines() {
  const lineRef = useRef<THREE.LineSegments>(null);
  const positions = useMemo(() => new Float32Array(PARTICLE_COUNT * PARTICLE_COUNT * 0.01 * 6), []);

  useFrame(({ scene }) => {
    if (!lineRef.current) return;
    const points = scene.children.find(c => c.type === 'Points') as THREE.Points | undefined;
    if (!points) return;
    const posArr = (points.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
    const linePositions = lineRef.current.geometry.attributes.position.array as Float32Array;
    let idx = 0;
    const maxDist = 2.5;

    for (let i = 0; i < Math.min(PARTICLE_COUNT, 200); i++) {
      for (let j = i + 1; j < Math.min(PARTICLE_COUNT, 200); j++) {
        const dx = posArr[i * 3] - posArr[j * 3];
        const dy = posArr[i * 3 + 1] - posArr[j * 3 + 1];
        const dz = posArr[i * 3 + 2] - posArr[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < maxDist && idx < positions.length - 6) {
          linePositions[idx++] = posArr[i * 3];
          linePositions[idx++] = posArr[i * 3 + 1];
          linePositions[idx++] = posArr[i * 3 + 2];
          linePositions[idx++] = posArr[j * 3];
          linePositions[idx++] = posArr[j * 3 + 1];
          linePositions[idx++] = posArr[j * 3 + 2];
        }
      }
    }

    // Zero out remaining
    for (let i = idx; i < linePositions.length; i++) {
      linePositions[i] = 0;
    }

    (lineRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <lineSegments ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color={new THREE.Color('hsl(25, 30%, 45%)')}
        transparent
        opacity={0.06}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

export default function ParticleField() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" style={{ opacity: 0.7 }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 1.5]}
        style={{ pointerEvents: 'auto' }}
        gl={{ antialias: false, alpha: true }}
      >
        <Particles />
        <ConnectionLines />
      </Canvas>
    </div>
  );
}
