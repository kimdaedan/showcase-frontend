'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

interface Scene3DProps {
  modelUrl: string;
  images: string[];
  // Callback interaksi
  onHoverScreen?: (isHovering: boolean, x: number, y: number, index: number) => void;
  onClickScreen?: (index: number) => void;
}

const Scene3D: React.FC<Scene3DProps> = ({ modelUrl, images, onHoverScreen, onClickScreen }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();

  // State & Refs
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const interactableMeshes = useRef<THREE.Mesh[]>([]);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Refs untuk callback agar tidak re-render
  const onHoverRef = useRef(onHoverScreen);
  const onClickRef = useRef(onClickScreen);

  useEffect(() => {
    onHoverRef.current = onHoverScreen;
    onClickRef.current = onClickScreen;
  }, [onHoverScreen, onClickScreen]);

  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // 1. SETUP SCENE
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
    renderer.outputColorSpace = THREE.SRGBColorSpace; // PENTING: Warna akurat

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // 2. LIGHTING
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(10, 20, 10);
    sunLight.castShadow = true;
    scene.add(sunLight);
    const grid = new THREE.GridHelper(100, 100, 0x555555, 0x999999);
    grid.position.y = -0.01;
    scene.add(grid);

    // 3. LOAD MODEL & TEXTURE
    const loader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous');
    interactableMeshes.current = [];

    // Material untuk layar kosong (HITAM)
    const emptyMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });

    // Helper: Setup Texture Standar
    const setupTexture = (url: string) => {
        const tex = textureLoader.load(url);
        tex.flipY = false; // Standar GLTF
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    };

    // Helper: Ambil material unik (TANPA PENGULANGAN)
    const getUniqueMaterial = (index: number) => {
        // Jika tidak ada gambar di index ini, return hitam
        if (!images || !images[index]) return emptyMaterial;

        const tex = setupTexture(images[index]);
        return new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
    };

    loader.load(modelUrl, (gltf) => {
        const model = gltf.scene;
        console.log("✅ Model Loaded. Mapping slots uniquely...");

        // Mapping 1-on-1 (Index 0 ke Slot 8, Index 1 ke Slot 9, dst)
        const matSlot8 = getUniqueMaterial(0);
        const matSlot9 = getUniqueMaterial(1);
        const matSlot5 = getUniqueMaterial(2);
        const matSlot6 = getUniqueMaterial(3);
        const matSlot7 = getUniqueMaterial(4);

        // Traverse Model
        model.traverse((node) => {
          if ((node as THREE.Mesh).isMesh) {
            const mesh = node as THREE.Mesh;
            const name = mesh.name;

            // --- MAPPING MESH ---
            if (name.includes('AN_VID_Slot8')) {
               mesh.material = matSlot8;
               interactableMeshes.current.push(mesh);
            }
            else if (name.includes('AN_VID_Slot9')) {
               mesh.material = matSlot9;
               interactableMeshes.current.push(mesh);
            }
            else if (name.includes('AN_VID_Slot5')) {
               mesh.material = matSlot5;
               interactableMeshes.current.push(mesh);
            }
            else if (name.includes('AN_VID_Slot6')) {
               mesh.material = matSlot6;
               interactableMeshes.current.push(mesh);
            }
            else if (name.includes('AN_VID_Slot7')) {
               mesh.material = matSlot7;
               interactableMeshes.current.push(mesh);
            }

            // Legacy Support (Model Lama)
            else if (name.includes('VID_Slot_1') && images[0]) {
               const t = setupTexture(images[0]);
               t.rotation = 1.6; t.center.set(0.53, 0.4); t.repeat.set(5, 4);
               t.wrapS = THREE.ClampToEdgeWrapping; t.wrapT = THREE.ClampToEdgeWrapping;
               mesh.material = new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide });
               interactableMeshes.current.push(mesh);
            }
            else if (name.includes('IMG_Slot_1') && images[1]) {
               const t = setupTexture(images[1]);
               mesh.material = new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide });
               interactableMeshes.current.push(mesh);
            }
          }
        });
        scene.add(model);
    }, undefined, (err) => console.error("Error loading model:", err));

    // 4. LOGIKA INTERAKSI
    const updateMouse = (e: MouseEvent) => {
        if (!mountRef.current) return;
        const rect = mountRef.current.getBoundingClientRect();
        mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    // Validasi Klik: Hanya jika slot ada gambarnya
    const getHit = () => {
        if (!cameraRef.current || interactableMeshes.current.length === 0) return { hit: false, index: -1 };
        raycaster.current.setFromCamera(mouse.current, cameraRef.current);
        const hits = raycaster.current.intersectObjects(interactableMeshes.current);

        if (hits.length > 0) {
            const n = hits[0].object.name;
            let targetIndex = -1;

            if (n.includes('AN_VID_Slot8') || n.includes('VID_Slot_1')) targetIndex = 0;
            else if (n.includes('AN_VID_Slot9') || n.includes('IMG_Slot_1')) targetIndex = 1;
            else if (n.includes('AN_VID_Slot5')) targetIndex = 2;
            else if (n.includes('AN_VID_Slot6')) targetIndex = 3;
            else if (n.includes('AN_VID_Slot7')) targetIndex = 4;

            // Validasi: Hanya return hit jika index valid DAN gambarnya ada
            if (targetIndex !== -1 && images && images[targetIndex]) {
                return { hit: true, index: targetIndex };
            }
        }
        return { hit: false, index: -1 };
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { isDragging.current = true; previousMousePosition.current = { x: e.clientX, y: e.clientY }; }
    };

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

      // Kursor pointer hanya jika slot ada isinya
      if (onHoverRef.current) onHoverRef.current(hit, e.clientX, e.clientY, index);
      if (mountRef.current) mountRef.current.style.cursor = hit ? 'pointer' : (isDragging.current ? 'grabbing' : 'grab');
    };

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
    canvas.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

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
      camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousedown', onMouseDown);
      renderer.dispose();
    };
  }, [modelUrl, images]);

  // UI Helper
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