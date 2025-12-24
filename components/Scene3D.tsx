'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

interface Scene3DProps {
  modelUrl: string;
  images: string[];
  // Terima daftar slot dari Parent (page.tsx) agar dinamis tiap Prodi
  slotNames: string[];
  onHoverScreen?: (isHovering: boolean, x: number, y: number, index: number) => void;
  onClickScreen?: (index: number) => void;
}

const Scene3D: React.FC<Scene3DProps> = ({ modelUrl, images, slotNames, onHoverScreen, onClickScreen }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();

  // State & Refs untuk Logika
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const interactableMeshes = useRef<THREE.Mesh[]>([]);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Refs callback (mencegah re-render berlebih)
  const onHoverRef = useRef(onHoverScreen);
  const onClickRef = useRef(onClickScreen);

  useEffect(() => {
    onHoverRef.current = onHoverScreen;
    onClickRef.current = onClickScreen;
  }, [onHoverScreen, onClickScreen]);

  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // ==========================================
    // 1. SETUP DASAR (Scene, Camera, Renderer)
    // ==========================================
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0);
    scene.fog = new THREE.Fog(0xa0a0a0, 10, 60);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.rotation.order = 'YXZ';
    camera.position.set(0, 1.7, 5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // PENTING: Agar warna gambar tidak pucat
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // ==========================================
    // 2. PENCAHAYAAN
    // ==========================================
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(10, 20, 10);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Grid Helper (Opsional, matikan jika tidak perlu)
    const grid = new THREE.GridHelper(100, 100, 0x555555, 0x999999);
    grid.position.y = -0.01;
    scene.add(grid);

    // ==========================================
    // 3. LOAD MODEL & TEMPEL GAMBAR
    // ==========================================
    const loader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous');
    interactableMeshes.current = [];

    // Material Hitam (Jika slot lebih banyak dari jumlah karya)
    const blackMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });

    // Helper: Setup Texture
    const setupTexture = (url: string) => {
        const tex = textureLoader.load(url);
        tex.flipY = false; // Standar GLTF
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    };

    // Helper: Buat Material berdasarkan Index Urutan
    const getMaterialForSlot = (slotIndex: number) => {
        // Cek apakah ada gambar di index ini?
        if (images && images[slotIndex]) {
            const tex = setupTexture(images[slotIndex]);
            return new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
        }
        // Jika tidak ada gambar, return Hitam
        return blackMaterial;
    };

    loader.load(modelUrl, (gltf) => {
        const model = gltf.scene;

        // --- FITUR DEBUGGING OTOMATIS ---
        console.group(`🔍 Debug Model: ${modelUrl}`);
        console.log("Daftar Mesh yang ditemukan:");
        // Mencetak semua nama mesh ke Console agar Anda bisa copy-paste untuk config
        model.traverse((node) => {
            if ((node as THREE.Mesh).isMesh) {
                console.log(`- ${node.name}`);
            }
        });
        console.groupEnd();
        // --------------------------------

        // 1. Siapkan Material
        // Kita buat daftar material sesuai urutan slotNames yang dikirim dari page.tsx
        const currentSlotNames = slotNames || [];
        const materials = currentSlotNames.map((_, index) => getMaterialForSlot(index));

        // 2. Traverse (Telusuri) Model untuk menempelkan material
        model.traverse((node) => {
          if ((node as THREE.Mesh).isMesh) {
            const mesh = node as THREE.Mesh;
            const name = mesh.name;

            // Cek apakah nama mesh ini ada di daftar slotNames
            // Kita gunakan 'includes' agar jika nama di blender "AN_VID_Slot1.001" tetap terdeteksi
            const slotIndex = currentSlotNames.findIndex(slotName => name.includes(slotName));

            if (slotIndex !== -1) {
               // Ketemu! Pasang material sesuai urutan
               mesh.material = materials[slotIndex];

               // Simpan index ini di mesh agar bisa dideteksi saat diklik
               mesh.userData = { slotIndex: slotIndex };

               interactableMeshes.current.push(mesh);
            }
          }
        });
        scene.add(model);
    }, undefined, (err) => {
        console.error("❌ Gagal memuat model:", err);
    });

    // ==========================================
    // 4. LOGIKA INTERAKSI (KLIK & HOVER)
    // ==========================================
    const updateMouse = (e: MouseEvent) => {
        if (!mountRef.current) return;
        const rect = mountRef.current.getBoundingClientRect();
        mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const getHit = () => {
        if (!cameraRef.current || interactableMeshes.current.length === 0) return { hit: false, index: -1 };
        raycaster.current.setFromCamera(mouse.current, cameraRef.current);
        const hits = raycaster.current.intersectObjects(interactableMeshes.current);

        if (hits.length > 0) {
            const hitMesh = hits[0].object;
            const index = hitMesh.userData.slotIndex;

            // Validasi: Hanya bisa diklik jika index valid DAN gambarnya benar-benar ada
            if (typeof index === 'number' && images && images[index]) {
                return { hit: true, index: index };
            }
        }
        return { hit: false, index: -1 };
    };

    const onMouseDown = (e: MouseEvent) => { if (e.button === 0) { isDragging.current = true; previousMousePosition.current = { x: e.clientX, y: e.clientY }; } };

    const onMouseUp = (e: MouseEvent) => {
        isDragging.current = false;
        if (e.clientX === previousMousePosition.current.x && e.clientY === previousMousePosition.current.y) {
            updateMouse(e);
            const { hit, index } = getHit();
            if (hit && onClickRef.current) onClickRef.current(index);
        }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        const deltaX = e.clientX - previousMousePosition.current.x;
        const deltaY = e.clientY - previousMousePosition.current.y;
        camera.rotation.y -= deltaX * 0.003;
        camera.rotation.x -= deltaY * 0.003;
        camera.rotation.x = Math.max(-1.4, Math.min(1.4, camera.rotation.x));
        previousMousePosition.current = { x: e.clientX, y: e.clientY };
      }
      updateMouse(e);
      const { hit, index } = getHit();

      // Ubah kursor jadi pointer hanya jika mengarah ke bingkai yang ADA GAMBARNYA
      if (onHoverRef.current) onHoverRef.current(hit, e.clientX, e.clientY, index);
      if (mountRef.current) mountRef.current.style.cursor = hit ? 'pointer' : (isDragging.current ? 'grabbing' : 'grab');
    };

    // ==========================================
    // 5. ANIMASI & KONTROL KEYBOARD
    // ==========================================
    const onKey = (e: KeyboardEvent, down: boolean) => {
        keysPressed.current[e.code] = down;
        if(['KeyW','KeyA','KeyS','KeyD'].includes(e.code)) setActiveKey(down ? e.code : null);
    };

    const canvas = renderer.domElement;
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', (e) => onKey(e, true));
    window.addEventListener('keyup', (e) => onKey(e, false));

    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);
      const delta = 0.02; // Fixed delta agar kecepatan konsisten
      const moveSpeed = 4.0 * delta;

      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward); forward.y = 0; forward.normalize();
      const right = new THREE.Vector3();
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      if (keysPressed.current['KeyW']) camera.position.add(forward.multiplyScalar(moveSpeed));
      if (keysPressed.current['KeyS']) camera.position.add(forward.multiplyScalar(-moveSpeed));
      if (keysPressed.current['KeyD']) camera.position.add(right.multiplyScalar(moveSpeed));
      if (keysPressed.current['KeyA']) camera.position.add(right.multiplyScalar(-moveSpeed));

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('keydown', (e) => onKey(e, true));
      window.removeEventListener('keyup', (e) => onKey(e, false));
      canvas.removeEventListener('mousedown', onMouseDown);
      renderer.dispose();
    };
  }, [modelUrl, images, slotNames]);
  // useEffect akan jalan ulang jika modelUrl atau daftar slotNames berubah

  // ==========================================
  // 6. UI TOMBOL VIRTUAL
  // ==========================================
  const handleBtnDown = (code: string) => { keysPressed.current[code] = true; setActiveKey(code); };
  const handleBtnUp = (code: string) => { keysPressed.current[code] = false; setActiveKey(null); };
  const btnClass = (key: string) => `w-12 h-12 flex items-center justify-center rounded-lg font-bold text-lg select-none transition-all duration-100 border-2 ${activeKey === key ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.6)] scale-95' : 'bg-black/40 text-white/90 border-white/20 hover:bg-black/60 backdrop-blur-md'}`;

  return (
    <div ref={mountRef} className="w-full h-full relative bg-gray-900 cursor-grab active:cursor-grabbing overflow-hidden">
      <div className="absolute top-4 left-4 bg-black/60 text-white px-4 py-3 rounded-lg text-xs pointer-events-none select-none z-10 backdrop-blur-sm border border-white/10 shadow-lg">
        <p className="mb-1">🖱️ <b>Klik + Geser</b> : Putar Kamera</p>
        <p className="mb-1">🖱️ <b>Klik Layar</b> : Lihat Detail</p>
        <p>⌨️ <b>WASD</b> : Berjalan</p>
      </div>

      <div className="absolute bottom-8 left-8 flex flex-col items-center gap-2 z-20">
        <div className={btnClass('KeyW')} onMouseDown={() => handleBtnDown('KeyW')} onMouseUp={() => handleBtnUp('KeyW')} onMouseLeave={() => handleBtnUp('KeyW')} onTouchStart={(e)=>{e.preventDefault();handleBtnDown('KeyW')}} onTouchEnd={(e)=>{e.preventDefault();handleBtnUp('KeyW')}}>W</div>
        <div className="flex gap-2">
          <div className={btnClass('KeyA')} onMouseDown={() => handleBtnDown('KeyA')} onMouseUp={() => handleBtnUp('KeyA')} onMouseLeave={() => handleBtnUp('KeyA')} onTouchStart={(e)=>{e.preventDefault();handleBtnDown('KeyA')}} onTouchEnd={(e)=>{e.preventDefault();handleBtnUp('KeyA')}}>A</div>
          <div className={btnClass('KeyS')} onMouseDown={() => handleBtnDown('KeyS')} onMouseUp={() => handleBtnUp('KeyS')} onMouseLeave={() => handleBtnUp('KeyS')} onTouchStart={(e)=>{e.preventDefault();handleBtnDown('KeyS')}} onTouchEnd={(e)=>{e.preventDefault();handleBtnUp('KeyS')}}>S</div>
          <div className={btnClass('KeyD')} onMouseDown={() => handleBtnDown('KeyD')} onMouseUp={() => handleBtnUp('KeyD')} onMouseLeave={() => handleBtnUp('KeyD')} onTouchStart={(e)=>{e.preventDefault();handleBtnDown('KeyD')}} onTouchEnd={(e)=>{e.preventDefault();handleBtnUp('KeyD')}}>D</div>
        </div>
      </div>
    </div>
  );
};

export default Scene3D;