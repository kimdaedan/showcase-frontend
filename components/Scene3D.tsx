'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

interface Scene3DProps {
  modelUrl: string;
  images: string[]; // Menerima array URL gambar (Index 0 = TV, Index 1 = Poster)
}

const Scene3D: React.FC<Scene3DProps> = ({ modelUrl, images }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();

  // Refs untuk logika kontrol
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
    scene.fog = new THREE.Fog(0xa0a0a0, 10, 60);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.rotation.order = 'YXZ'; // Penting untuk kontrol ala FPS
    camera.position.set(0, 1.7, 5); // Tinggi mata rata-rata

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Bersihkan container
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
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    // Lantai Grid
    const grid = new THREE.GridHelper(100, 100, 0x555555, 0x999999);
    grid.position.y = -0.01;
    scene.add(grid);

    // === 3. LOAD MODEL & MULTIPLE TEXTURES ===
    const loader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous'); // Wajib untuk gambar dari backend

    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;

        // --- A. PERSIAPAN TEXTURE TV (Gambar Pertama) ---
        let textureTV: THREE.Texture | null = null;
        if (images && images[0]) {
          textureTV = textureLoader.load(
            images[0],
            undefined, undefined,
            (err) => console.error("❌ Gagal load texture TV:", err)
          );

          // Settingan TV (Horizontal)
          textureTV.flipY = false; // Sesuaikan jika terbalik (true/false)
          textureTV.colorSpace = THREE.SRGBColorSpace;
          textureTV.wrapS = THREE.ClampToEdgeWrapping;
          textureTV.wrapT = THREE.ClampToEdgeWrapping;
          textureTV.repeat.set(5, 4);
          textureTV.center.set(0.53, 0.4);
          textureTV.rotation =1.6; // Tidak diputar
        }

        // --- B. PERSIAPAN TEXTURE POSTER (Gambar Kedua) ---
        let texturePoster: THREE.Texture | null = null;
        if (images && images[1]) {
          texturePoster = textureLoader.load(
            images[1],
            undefined, undefined,
            (err) => console.error("❌ Gagal load texture Poster:", err)
          );

          // Settingan Poster (Biasanya Vertikal)
          // Jika poster terbalik, ubah flipY jadi true
          texturePoster.flipY = false;
          texturePoster.colorSpace = THREE.SRGBColorSpace;
          texturePoster.wrapS = THREE.ClampToEdgeWrapping;
          texturePoster.wrapT = THREE.ClampToEdgeWrapping;
          texturePoster.repeat.set(5, 4);
          texturePoster.center.set(0.5, 0.35);
          texturePoster.rotation = 0;
        }

        // --- C. TRAVERSING MODEL ---
        model.traverse((node) => {
          if ((node as THREE.Mesh).isMesh) {
            const mesh = node as THREE.Mesh;

            // 1. Logika TV (VID_Slot_1)
            if (textureTV && mesh.name.includes('VID_Slot_1')) {
              console.log(`📺 TV Detected! Menempelkan gambar 1 ke: ${mesh.name}`);
              mesh.material = new THREE.MeshBasicMaterial({
                map: textureTV,
                side: THREE.DoubleSide
              });
            }

            // 2. Logika Poster (IMG_Slot_1)
            if (texturePoster && mesh.name.includes('IMG_Slot_1')) {
              console.log(`🖼️ Poster Detected! Menempelkan gambar 2 ke: ${mesh.name}`);
              mesh.material = new THREE.MeshBasicMaterial({
                map: texturePoster,
                side: THREE.DoubleSide
              });
            }
          }
        });

        scene.add(model);
        console.log("✅ Model berhasil dimuat");
      },
      undefined,
      (error) => console.error('❌ Error loading GLTF model:', error)
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
    const onMouseUp = () => { isDragging.current = false; };

    // Mouse Move (Rotasi Kamera)
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        const deltaX = e.clientX - previousMousePosition.current.x;
        const deltaY = e.clientY - previousMousePosition.current.y;
        const sensitivity = 0.003;

        camera.rotation.y -= deltaX * sensitivity;
        camera.rotation.x -= deltaY * sensitivity;

        // Batasi sudut pandang atas/bawah
        const maxPolarAngle = Math.PI / 2 - 0.1;
        camera.rotation.x = Math.max(-maxPolarAngle, Math.min(maxPolarAngle, camera.rotation.x));

        previousMousePosition.current = { x: e.clientX, y: e.clientY };
      }
    };

    // Keyboard Handlers
    const onKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) setActiveKey(e.code);
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

    // === 5. GAME LOOP ===
    const clock = new THREE.Clock();

    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const moveSpeed = 4.0 * delta;

      // Hitung arah gerak relatif kamera
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
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
         // Cek apakah node masih ada sebelum remove
         if (mountRef.current.contains(renderer.domElement)) {
           mountRef.current.removeChild(renderer.domElement);
         }
      }
      renderer.dispose();
    };

  }, [modelUrl, images]); // Efek dijalankan ulang jika model atau gambar berubah

  // === HELPERS UI ===
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
      {/* UI Instruksi */}
      <div className="absolute top-4 left-4 bg-black/60 text-white px-4 py-3 rounded-lg text-xs pointer-events-none select-none z-10 backdrop-blur-sm border border-white/10 shadow-lg">
        <p className="mb-1">🖱️ <b>Klik + Geser</b> : Putar Kamera</p>
        <p>⌨️ <b>WASD</b> : Berjalan</p>
      </div>

      {/* UI Kontrol WASD */}
      <div className="absolute bottom-8 left-8 flex flex-col items-center gap-2 z-20">
        <div
          className={btnClass('KeyW')}
          onMouseDown={() => handleBtnDown('KeyW')}
          onMouseUp={() => handleBtnUp('KeyW')}
          onMouseLeave={() => handleBtnUp('KeyW')}
          onTouchStart={(e) => { e.preventDefault(); handleBtnDown('KeyW'); }}
          onTouchEnd={(e) => { e.preventDefault(); handleBtnUp('KeyW'); }}
        >W</div>

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