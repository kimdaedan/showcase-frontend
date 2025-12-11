'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

interface Scene3DProps {
  modelUrl: string;
  images: string[];
  onHoverScreen?: (isHovering: boolean, x: number, y: number) => void;
  onClickScreen?: () => void;
}

const Scene3D: React.FC<Scene3DProps> = ({ modelUrl, images, onHoverScreen, onClickScreen }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();

  // --- REFS LOGIKA UTAMA (Agar tidak memicu re-render) ---
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const interactableMeshes = useRef<THREE.Mesh[]>([]);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // [SOLUSI BUG] Simpan callback parent ke dalam Ref
  // Ini memutus siklus render ulang saat mouse bergerak
  const onHoverRef = useRef(onHoverScreen);
  const onClickRef = useRef(onClickScreen);

  // Update ref setiap kali props berubah (Ringan, tidak merusak scene)
  useEffect(() => {
    onHoverRef.current = onHoverScreen;
    onClickRef.current = onClickScreen;
  }, [onHoverScreen, onClickScreen]);

  // State Visual Tombol WASD
  const [activeKey, setActiveKey] = useState<string | null>(null);

  // --- INISIALISASI SCENE ---
  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Setup Dasar
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0);
    scene.fog = new THREE.Fog(0xa0a0a0, 10, 60);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.rotation.order = 'YXZ';
    camera.position.set(0, 1.7, 5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Bersihkan container sebelum mount
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }
    mountRef.current.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(10, 20, 10);
    sunLight.castShadow = true;
    scene.add(sunLight);
    const grid = new THREE.GridHelper(100, 100, 0x555555, 0x999999);
    grid.position.y = -0.01;
    scene.add(grid);

    // 3. Load Model & Texture
    const loader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous');

    interactableMeshes.current = []; // Reset list

    loader.load(modelUrl, (gltf) => {
        const model = gltf.scene;

        // Texture TV
        let textureTV: THREE.Texture | null = null;
        if (images && images[0]) {
          textureTV = textureLoader.load(images[0]);
          textureTV.flipY = false;
          textureTV.colorSpace = THREE.SRGBColorSpace;
          textureTV.rotation = 1.6;
          textureTV.center.set(0.53, 0.4);
          textureTV.repeat.set(5, 4);
          textureTV.wrapS = THREE.ClampToEdgeWrapping;
          textureTV.wrapT = THREE.ClampToEdgeWrapping;
        }

        // Texture Poster
        let texturePoster: THREE.Texture | null = null;
        if (images && images[1]) {
          texturePoster = textureLoader.load(images[1]);
          texturePoster.flipY = false;
          texturePoster.colorSpace = THREE.SRGBColorSpace;
          texturePoster.rotation = 0;
          texturePoster.center.set(0.5, 0.35);
          texturePoster.repeat.set(5, 4);
          texturePoster.wrapS = THREE.ClampToEdgeWrapping;
          texturePoster.wrapT = THREE.ClampToEdgeWrapping;
        }

        model.traverse((node) => {
          if ((node as THREE.Mesh).isMesh) {
            const mesh = node as THREE.Mesh;

            // Pasang Texture & Daftarkan ke Interaksi
            if (mesh.name.includes('VID_Slot_1')) {
              if (textureTV) mesh.material = new THREE.MeshBasicMaterial({ map: textureTV, side: THREE.DoubleSide });
              interactableMeshes.current.push(mesh);
            }
            if (mesh.name.includes('IMG_Slot_1')) {
              if (texturePoster) mesh.material = new THREE.MeshBasicMaterial({ map: texturePoster, side: THREE.DoubleSide });
              interactableMeshes.current.push(mesh);
            }
          }
        });

        scene.add(model);
      }, undefined, (err) => console.error('Error load GLTF:', err)
    );

    // --- LOGIKA INTERAKSI ---

    const updateMouseCoordinates = (clientX: number, clientY: number) => {
        if (!mountRef.current) return;
        const rect = mountRef.current.getBoundingClientRect();
        mouse.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouse.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const checkIntersection = () => {
        if (!cameraRef.current || interactableMeshes.current.length === 0) return false;
        raycaster.current.setFromCamera(mouse.current, cameraRef.current);
        const intersects = raycaster.current.intersectObjects(interactableMeshes.current);
        return intersects.length > 0;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isDragging.current = true;
        previousMousePosition.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseUp = (e: MouseEvent) => {
        isDragging.current = false;
        // Deteksi Klik (bukan drag)
        if (e.clientX === previousMousePosition.current.x && e.clientY === previousMousePosition.current.y) {
            updateMouseCoordinates(e.clientX, e.clientY);
            if (checkIntersection()) {
                // Panggil Parent via Ref (Aman dari refresh)
                if (onClickRef.current) onClickRef.current();
            }
        }
    };

    const onMouseMove = (e: MouseEvent) => {
      // 1. Rotasi Kamera
      if (isDragging.current) {
        const deltaX = e.clientX - previousMousePosition.current.x;
        const deltaY = e.clientY - previousMousePosition.current.y;
        camera.rotation.y -= deltaX * 0.003;
        camera.rotation.x -= deltaY * 0.003;
        camera.rotation.x = Math.max(-1.4, Math.min(1.4, camera.rotation.x));
        previousMousePosition.current = { x: e.clientX, y: e.clientY };
      }

      // 2. Hover Detection
      updateMouseCoordinates(e.clientX, e.clientY);
      const isHovering = checkIntersection();

      // Panggil Parent via Ref (Aman dari refresh)
      if (onHoverRef.current) {
          onHoverRef.current(isHovering, e.clientX, e.clientY);
      }

      // Cursor Style
      if (mountRef.current) {
          mountRef.current.style.cursor = isHovering ? 'pointer' : (isDragging.current ? 'grabbing' : 'grab');
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) setActiveKey(e.code);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
      setActiveKey(null);
    };

    // Event Listeners
    const canvas = renderer.domElement;
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Animation Loop
    const clock = new THREE.Clock();
    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const moveSpeed = 4.0 * delta;

      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0; forward.normalize();
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

    // Cleanup
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousedown', onMouseDown);
      if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };

  // [PENTING] Jangan masukkan onHoverScreen/onClickScreen disini!
  }, [modelUrl, images]);

  // --- UI BUTTONS HELPERS ---
  const handleBtnDown = (code: string) => { keysPressed.current[code] = true; setActiveKey(code); };
  const handleBtnUp = (code: string) => { keysPressed.current[code] = false; setActiveKey(null); };
  const btnClass = (key: string) => `w-12 h-12 flex items-center justify-center rounded-lg font-bold text-lg select-none transition-all duration-100 border-2 ${activeKey === key ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.6)] scale-95' : 'bg-black/40 text-white/90 border-white/20 hover:bg-black/60 backdrop-blur-md'}`;

  return (
    <div ref={mountRef} className="w-full h-full relative bg-gray-900 cursor-grab active:cursor-grabbing overflow-hidden">
      <div className="absolute top-4 left-4 bg-black/60 text-white px-4 py-3 rounded-lg text-xs pointer-events-none select-none z-10 backdrop-blur-sm border border-white/10 shadow-lg">
        <p className="mb-1">🖱️ <b>Klik + Geser</b> : Putar Kamera</p>
        <p className="mb-1">🖱️ <b>Klik Layar TV</b> : Lihat Detail</p>
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