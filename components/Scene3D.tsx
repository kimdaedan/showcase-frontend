'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

interface Scene3DProps {
  modelUrl: string;
}

const Scene3D: React.FC<Scene3DProps> = ({ modelUrl }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();

  // Ref untuk logika 3D (agar tidak re-render saat loop berjalan)
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  // State untuk Visualisasi Tombol (Agar tombol di layar menyala saat ditekan)
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // === 1. SETUP DASAR ===
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0);
    scene.fog = new THREE.Fog(0xa0a0a0, 10, 60);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.rotation.order = 'YXZ';
    camera.position.set(0, 1.7, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }
    mountRef.current.appendChild(renderer.domElement);

    // === 2. PENCAHAYAAN ===
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(10, 20, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    const grid = new THREE.GridHelper(100, 100, 0x555555, 0x999999);
    grid.position.y = -0.01;
    scene.add(grid);

    // === 3. LOAD MODEL ===
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        model.traverse((node) => {
          if ((node as THREE.Mesh).isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });
        scene.add(model);
      },
      undefined,
      (error) => console.error('Error loading model:', error)
    );

    // === 4. KONTROL INPUT ===

    const onMouseDown = (e: MouseEvent) => {
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

        camera.rotation.y -= deltaX * sensitivity;
        camera.rotation.x -= deltaY * sensitivity;

        const maxPolarAngle = Math.PI / 2 - 0.1;
        camera.rotation.x = Math.max(-maxPolarAngle, Math.min(maxPolarAngle, camera.rotation.x));

        previousMousePosition.current = { x: e.clientX, y: e.clientY };
      }
    };

    // Update Ref dan State Visual
    const onKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true;
      // Update visual UI (hanya untuk WASD)
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
        setActiveKey(e.code);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
      setActiveKey(null);
    };

    const canvas = renderer.domElement;
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // === 5. ANIMASI ===
    const clock = new THREE.Clock();

    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const moveSpeed = 4.0 * delta;

      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const right = new THREE.Vector3();
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      if (keysPressed.current['KeyW'] || keysPressed.current['ArrowUp']) camera.position.add(forward.multiplyScalar(moveSpeed));
      if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) camera.position.add(forward.multiplyScalar(-moveSpeed));
      if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) camera.position.add(right.multiplyScalar(moveSpeed));
      if (keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft']) camera.position.add(right.multiplyScalar(-moveSpeed));

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousedown', onMouseDown);

      if (mountRef.current && renderer.domElement) {
        if (mountRef.current.contains(renderer.domElement)) {
          mountRef.current.removeChild(renderer.domElement);
        }
      }
      renderer.dispose();
    };
  }, [modelUrl]);

  // Helper untuk menghandle klik tombol on-screen
  const handleBtnDown = (code: string) => {
    keysPressed.current[code] = true;
    setActiveKey(code);
  };

  const handleBtnUp = (code: string) => {
    keysPressed.current[code] = false;
    setActiveKey(null);
  };

  // Style class untuk tombol
  const btnClass = (key: string) => `
    w-10 h-10 flex items-center justify-center rounded-md font-bold text-sm select-none transition-colors border border-white/30
    ${activeKey === key ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'bg-black/50 text-white/80 hover:bg-black/70'}
  `;

  return (
    <div
      ref={mountRef}
      className="w-full h-full relative bg-gray-300 cursor-grab active:cursor-grabbing overflow-hidden"
    >
      {/* UI Instruksi (Atas Kiri) */}
      <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-2 rounded text-xs pointer-events-none select-none z-10 backdrop-blur-sm">
        <p>🖱️ <b>Drag</b> : Lihat</p>
        <p>⌨️ <b>WASD</b> : Jalan</p>
      </div>

      {/* UI Kontrol WASD (Bawah Kiri) */}
      <div className="absolute bottom-6 left-6 flex flex-col items-center gap-1 z-20">
        {/* Baris Atas: W */}
        <div
          className={btnClass('KeyW')}
          onMouseDown={() => handleBtnDown('KeyW')}
          onMouseUp={() => handleBtnUp('KeyW')}
          onMouseLeave={() => handleBtnUp('KeyW')}
          onTouchStart={() => handleBtnDown('KeyW')}
          onTouchEnd={() => handleBtnUp('KeyW')}
        >W</div>

        {/* Baris Bawah: ASD */}
        <div className="flex gap-1">
          <div
            className={btnClass('KeyA')}
            onMouseDown={() => handleBtnDown('KeyA')}
            onMouseUp={() => handleBtnUp('KeyA')}
            onMouseLeave={() => handleBtnUp('KeyA')}
            onTouchStart={() => handleBtnDown('KeyA')}
            onTouchEnd={() => handleBtnUp('KeyA')}
          >A</div>
          <div
            className={btnClass('KeyS')}
            onMouseDown={() => handleBtnDown('KeyS')}
            onMouseUp={() => handleBtnUp('KeyS')}
            onMouseLeave={() => handleBtnUp('KeyS')}
            onTouchStart={() => handleBtnDown('KeyS')}
            onTouchEnd={() => handleBtnUp('KeyS')}
          >S</div>
          <div
            className={btnClass('KeyD')}
            onMouseDown={() => handleBtnDown('KeyD')}
            onMouseUp={() => handleBtnUp('KeyD')}
            onMouseLeave={() => handleBtnUp('KeyD')}
            onTouchStart={() => handleBtnDown('KeyD')}
            onTouchEnd={() => handleBtnUp('KeyD')}
          >D</div>
        </div>
      </div>

    </div>
  );
};

export default Scene3D;