'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

interface Scene3DProps {
  modelUrl: string;
  projectImageUrl?: string | null; // URL gambar proyek (opsional)
}

const Scene3D: React.FC<Scene3DProps> = ({ modelUrl, projectImageUrl }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();

  // Refs untuk logika kontrol (agar tidak memicu re-render)
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  // State untuk visualisasi tombol UI
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // === 1. SETUP SCENE, CAMERA, RENDERER ===
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0);
    // Tambahkan kabut agar batas dunia tidak terlihat kasar
    scene.fog = new THREE.Fog(0xa0a0a0, 10, 60);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    // PENTING: Order YXZ agar rotasi kamera stabil (seperti game FPS)
    camera.rotation.order = 'YXZ';
    camera.position.set(0, 1.7, 5); // Tinggi mata manusia (1.7m)

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true; // Aktifkan bayangan
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Bersihkan container sebelum append
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }
    mountRef.current.appendChild(renderer.domElement);

    // === 2. PENCAHAYAAN (LIGHTING) ===
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(10, 20, 10);
    sunLight.castShadow = true;
    // Optimasi resolusi bayangan
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    // Tambahkan lantai grid sebagai acuan visual
    const grid = new THREE.GridHelper(100, 100, 0x555555, 0x999999);
    grid.position.y = -0.01;
    scene.add(grid);

    // === 3. LOAD MODEL & GANTI TEKSTUR ===
    const loader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;

        // Load Tekstur Proyek (Jika ada)
        let projectTexture: THREE.Texture | null = null;
        if (projectImageUrl) {
          projectTexture = textureLoader.load(projectImageUrl);
          projectTexture.flipY = false; // Fix orientasi tekstur GLTF
          projectTexture.colorSpace = THREE.SRGBColorSpace;
        }

        model.traverse((node) => {
          if ((node as THREE.Mesh).isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;

            // --- LOGIKA GANTI GAMBAR LAYAR ---
            // Cari mesh yang bernama "Screen", "Plane", atau "Image"
            // Sesuaikan nama ini dengan nama object di file GLB Anda
            if (projectTexture && (
                node.name.toLowerCase().includes('VID_Frame') ||
                node.name.toLowerCase().includes('VID_Slot_1') ||
                node.name.toLowerCase().includes('image') ||
                node.name.toLowerCase().includes('layar')
            )) {
              console.log("🎯 Menempelkan gambar ke:", node.name);
              const mesh = node as THREE.Mesh;
              // Ganti material mesh tersebut dengan gambar proyek
              mesh.material = new THREE.MeshBasicMaterial({ map: projectTexture });
            }
          }
        });

        scene.add(model);
        console.log("✅ Model berhasil dimuat");
      },
      undefined,
      (error) => console.error('❌ Error loading model:', error)
    );

    // === 4. EVENT LISTENERS (MOUSE & KEYBOARD) ===

    // Mouse Down
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Klik kiri
        isDragging.current = true;
        previousMousePosition.current = { x: e.clientX, y: e.clientY };
      }
    };

    // Mouse Up
    const onMouseUp = () => {
      isDragging.current = false;
    };

    // Mouse Move (Rotasi Kamera)
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        const deltaX = e.clientX - previousMousePosition.current.x;
        const deltaY = e.clientY - previousMousePosition.current.y;
        const sensitivity = 0.003;

        // Putar kiri/kanan (Y-axis)
        camera.rotation.y -= deltaX * sensitivity;

        // Putar atas/bawah (X-axis) dengan batasan
        camera.rotation.x -= deltaY * sensitivity;
        const maxPolarAngle = Math.PI / 2 - 0.1; // Hampir 90 derajat
        camera.rotation.x = Math.max(-maxPolarAngle, Math.min(maxPolarAngle, camera.rotation.x));

        previousMousePosition.current = { x: e.clientX, y: e.clientY };
      }
    };

    // Keyboard Down
    const onKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true;
      // Update visual tombol di layar
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
        setActiveKey(e.code);
      }
    };

    // Keyboard Up
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

    // === 5. GAME LOOP (ANIMASI) ===
    const clock = new THREE.Clock();

    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const moveSpeed = 4.0 * delta; // Kecepatan gerak (meter/detik)

      // Hitung arah depan & samping relatif terhadap arah kamera
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0; // Kunci agar tidak terbang ke atas/bawah
      forward.normalize();

      const right = new THREE.Vector3();
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      // Logika Gerak WASD
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
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // === 7. CLEANUP ===
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
      // Bersihkan memori GPU
      renderer.dispose();
    };
  }, [modelUrl, projectImageUrl]); // Re-run effect jika model atau gambar berubah

  // === HELPERS UNTUK TOMBOL LAYAR ===
  const handleBtnDown = (code: string) => {
    keysPressed.current[code] = true;
    setActiveKey(code);
  };

  const handleBtnUp = (code: string) => {
    keysPressed.current[code] = false;
    setActiveKey(null);
  };

  const btnClass = (key: string) => `
    w-12 h-12 flex items-center justify-center rounded-lg font-bold text-lg select-none transition-all duration-100 border-2
    ${activeKey === key
      ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.6)] scale-95'
      : 'bg-black/40 text-white/90 border-white/20 hover:bg-black/60 backdrop-blur-md'}
  `;

  return (
    <div
      ref={mountRef}
      className="w-full h-full relative bg-gray-900 cursor-grab active:cursor-grabbing overflow-hidden"
    >
      {/* UI Instruksi (Pojok Kiri Atas) */}
      <div className="absolute top-4 left-4 bg-black/60 text-white px-4 py-3 rounded-lg text-xs pointer-events-none select-none z-10 backdrop-blur-sm border border-white/10 shadow-lg">
        <p className="mb-1">🖱️ <b>Klik + Geser</b> : Putar Kamera</p>
        <p>⌨️ <b>WASD</b> : Berjalan</p>
      </div>

      {/* UI Kontrol WASD (Pojok Kiri Bawah) */}
      <div className="absolute bottom-8 left-8 flex flex-col items-center gap-2 z-20">
        {/* Tombol W */}
        <div
          className={btnClass('KeyW')}
          onMouseDown={() => handleBtnDown('KeyW')}
          onMouseUp={() => handleBtnUp('KeyW')}
          onMouseLeave={() => handleBtnUp('KeyW')}
          onTouchStart={(e) => { e.preventDefault(); handleBtnDown('KeyW'); }}
          onTouchEnd={(e) => { e.preventDefault(); handleBtnUp('KeyW'); }}
        >W</div>

        {/* Tombol ASD */}
        <div className="flex gap-2">
          <div
            className={btnClass('KeyA')}
            onMouseDown={() => handleBtnDown('KeyA')}
            onMouseUp={() => handleBtnUp('KeyA')}
            onMouseLeave={() => handleBtnUp('KeyA')}
            onTouchStart={(e) => { e.preventDefault(); handleBtnDown('KeyA'); }}
            onTouchEnd={(e) => { e.preventDefault(); handleBtnUp('KeyA'); }}
          >A</div>
          <div
            className={btnClass('KeyS')}
            onMouseDown={() => handleBtnDown('KeyS')}
            onMouseUp={() => handleBtnUp('KeyS')}
            onMouseLeave={() => handleBtnUp('KeyS')}
            onTouchStart={(e) => { e.preventDefault(); handleBtnDown('KeyS'); }}
            onTouchEnd={(e) => { e.preventDefault(); handleBtnUp('KeyS'); }}
          >S</div>
          <div
            className={btnClass('KeyD')}
            onMouseDown={() => handleBtnDown('KeyD')}
            onMouseUp={() => handleBtnUp('KeyD')}
            onMouseLeave={() => handleBtnUp('KeyD')}
            onTouchStart={(e) => { e.preventDefault(); handleBtnDown('KeyD'); }}
            onTouchEnd={(e) => { e.preventDefault(); handleBtnUp('KeyD'); }}
          >D</div>
        </div>
      </div>

    </div>
  );
};

export default Scene3D;