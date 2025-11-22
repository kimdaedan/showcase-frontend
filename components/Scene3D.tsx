'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
// Menggunakan path import standar untuk Next.js
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

interface Scene3DProps {
  modelUrl: string;
}

const Scene3D: React.FC<Scene3DProps> = ({ modelUrl }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();

  // Refs untuk kontrol state agar tidak memicu re-render React
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!mountRef.current) return;

    // === 1. SETUP DASAR ===
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0);
    scene.fog = new THREE.Fog(0xa0a0a0, 10, 60); // Kabut lebih jauh

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    // PENTING: Order 'YXZ' agar rotasi kamera seperti FPS (tidak miring/roll)
    camera.rotation.order = 'YXZ';
    camera.position.set(0, 1.7, 5); // Tinggi mata manusia

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio); // Agar tajam di layar HP/Retina
    renderer.shadowMap.enabled = true; // Aktifkan bayangan
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Bersihkan container sebelum append (penting untuk React Strict Mode)
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }
    mountRef.current.appendChild(renderer.domElement);

    // === 2. PENCAHAYAAN (Lighting) ===
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(10, 20, 10);
    sunLight.castShadow = true;
    // Optimasi shadow map
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    scene.add(sunLight);

    // Grid Helper (Opsional: Lantai acuan)
    const grid = new THREE.GridHelper(100, 100, 0x555555, 0x999999);
    grid.position.y = -0.01; // Sedikit di bawah 0 agar tidak z-fighting
    scene.add(grid);

    // === 3. LOAD MODEL ===
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;

        // Aktifkan bayangan untuk semua bagian model
        model.traverse((node) => {
          if ((node as THREE.Mesh).isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;

            // Opsional: Fix jika material terlihat gelap/rusak
            // const mesh = node as THREE.Mesh;
            // if (mesh.material) (mesh.material as THREE.Material).side = THREE.DoubleSide;
          }
        });

        scene.add(model);
        console.log("✅ Model dimuat:", modelUrl);
      },
      (xhr) => {
        // Loading progress (bisa dipakai untuk UI loading bar jika mau)
        // console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      (error) => {
        console.error('❌ Error memuat model:', error);
      }
    );

    // === 4. KONTROL (Event Listeners) ===

    const onMouseDown = (e: MouseEvent) => {
      // Hanya aktifkan drag jika klik kiri (button 0)
      if (e.button === 0) {
        isDragging.current = true;
        previousMousePosition.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        const deltaX = e.clientX - previousMousePosition.current.x;
        const deltaY = e.clientY - previousMousePosition.current.y;

        const sensitivity = 0.003;

        // Rotasi Y (Kiri/Kanan) - Putar badan
        camera.rotation.y -= deltaX * sensitivity;

        // Rotasi X (Atas/Bawah) - Angguk kepala
        camera.rotation.x -= deltaY * sensitivity;

        // Batasi agar tidak bisa melihat terbalik (Clamp -90 sampai 90 derajat)
        const maxPolarAngle = Math.PI / 2 - 0.1; // Sedikit kurang dari 90 derajat
        camera.rotation.x = Math.max(-maxPolarAngle, Math.min(maxPolarAngle, camera.rotation.x));

        previousMousePosition.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };

    // Listeners di Canvas (untuk Mouse)
    const canvas = renderer.domElement;
    canvas.addEventListener('mousedown', onMouseDown);
    // Listeners di Window (agar drag tidak lepas jika mouse keluar canvas)
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);


    // === 5. GAME LOOP (Animation) ===
    const clock = new THREE.Clock();

    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const moveSpeed = 4.0 * delta; // Kecepatan jalan (meter per detik)

      // Hitung arah depan & samping berdasarkan arah kamera saat ini
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0; // Kunci gerakan vertikal (agar tidak terbang)
      forward.normalize();

      const right = new THREE.Vector3();
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      // Logika WASD
      if (keysPressed.current['KeyW'] || keysPressed.current['ArrowUp']) {
        camera.position.add(forward.multiplyScalar(moveSpeed));
      }
      if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) {
        camera.position.add(forward.multiplyScalar(-moveSpeed));
      }
      if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) {
        camera.position.add(right.multiplyScalar(moveSpeed));
      }
      if (keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft']) {
        camera.position.add(right.multiplyScalar(-moveSpeed));
      }

      renderer.render(scene, camera);
    };

    animate();

    // === 6. HANDLE RESIZE ===
    const handleResize = () => {
      if (!mountRef.current) return;
      const newWidth = mountRef.current.clientWidth;
      const newHeight = mountRef.current.clientHeight;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // === 7. CLEANUP (Saat komponen hilang) ===
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);

      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousedown', onMouseDown);

      if (mountRef.current && renderer.domElement) {
        // Cek apakah child masih ada sebelum remove
        if (mountRef.current.contains(renderer.domElement)) {
          mountRef.current.removeChild(renderer.domElement);
        }
      }

      // Bebaskan memori GPU
      renderer.dispose();
      scene.clear();
    };
  }, [modelUrl]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full relative bg-gray-300 cursor-grab active:cursor-grabbing"
    >
      {/* UI Instruksi */}
      <div className="absolute top-4 left-4 bg-black/70 text-white p-4 rounded-lg text-sm pointer-events-none select-none z-10 backdrop-blur-sm border border-white/20">
        <h3 className="font-bold mb-1 text-yellow-400">Kontrol Pameran:</h3>
        <ul className="space-y-1 text-gray-200">
          <li>🖱️ <b>Klik Kiri + Geser</b> : Lihat Sekeliling</li>
          <li>⌨️ <b>W / A / S / D</b> : Berjalan</li>
        </ul>
      </div>
    </div>
  );
};

export default Scene3D;