'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, Html, useProgress } from '@react-three/drei';
import { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';

// --- Komponen Loading (Muncul saat model sedang didownload) ---
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="bg-black/80 text-white px-4 py-2 rounded-md text-sm font-mono">
        Loading Model: {progress.toFixed(0)}%
      </div>
    </Html>
  );
}

// --- Komponen Model ---
function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  // Clone scene agar bisa dipakai ulang jika perlu, dan setup shadow
  const clonedScene = scene.clone();

  return <primitive object={clonedScene} scale={100} position={[0, -1, 0]} />;
}

// --- Kontrol Pergerakan (WASD + Mouse) ---
function CameraController() {
  const { camera } = useThree();
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});
  const speed = 0.15; // Kecepatan gerak

  // Event Listener untuk Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => setKeys((k) => ({ ...k, [e.code]: true }));
    const handleKeyUp = (e: KeyboardEvent) => setKeys((k) => ({ ...k, [e.code]: false }));

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Loop setiap frame untuk update posisi kamera
  useFrame(() => {
    const direction = new THREE.Vector3();
    const frontVector = new THREE.Vector3(
      0,
      0,
      Number(keys['KeyS'] || keys['ArrowDown']) - Number(keys['KeyW'] || keys['ArrowUp'])
    );
    const sideVector = new THREE.Vector3(
      Number(keys['KeyA'] || keys['ArrowLeft']) - Number(keys['KeyD'] || keys['ArrowRight']),
      0,
      0
    );

    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(speed)
      .applyEuler(camera.rotation);

    // Kita kunci pergerakan vertikal (Y) agar seperti berjalan di lantai,
    // kecuali jika ingin mode 'terbang' hapus baris ini.
    // direction.y = 0;

    camera.position.add(direction);
  });

  return null;
}

// --- Komponen Utama Scene3D ---
interface Scene3DProps {
  modelUrl: string;
}

export default function Scene3D({ modelUrl }: Scene3DProps) {
  return (
    <div className="w-full h-full relative bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-700">

      {/* Instruksi Kontrol */}
      <div className="absolute top-4 left-4 z-10 bg-black/50 text-white p-3 rounded pointer-events-none backdrop-blur-sm">
        <h3 className="font-bold text-sm mb-1">Kontrol:</h3>
        <ul className="text-xs space-y-1 text-gray-300">
          <li>🖱️ <span className="font-semibold text-white">Kiri/Kanan + Drag</span>: Putar Kamera</li>
          <li>🖱️ <span className="font-semibold text-white">Scroll</span>: Zoom</li>
          <li>⌨️ <span className="font-semibold text-white">W / A / S / D</span>: Bergerak (Maju/Kiri/Mundur/Kanan)</li>
        </ul>
      </div>

      <Canvas shadows camera={{ position: [5, 2, 5], fov: 50 }}>
        {/* Cahaya Ambient (Dasar) */}
        <ambientLight intensity={0.5} />

        {/* Cahaya Matahari */}
        <directionalLight
          position={[10, 10, 5]}
          intensity={1.5}
          castShadow
        />

        {/* Environment untuk pantulan yang realistis */}
        <Environment preset="city" />

        {/* Model GLB */}
        <Model url={modelUrl} />

        {/* Kontrol */}
        <OrbitControls
          enablePan={false} // Matikan pan mouse karena kita pakai WASD
          enableZoom={true}
          minDistance={2}
          maxDistance={20}
        />
        <CameraController />

        {/* Loader */}
        <Loader />
      </Canvas>
    </div>
  );
}