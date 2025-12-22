'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

interface Scene3DProps {
  modelUrl: string;
  images: string[];
  // Callback menerima index (0 = TV/Mesh25, 1 = Poster)
  onHoverScreen?: (isHovering: boolean, x: number, y: number, index: number) => void;
  onClickScreen?: (index: number) => void;
}

const Scene3D: React.FC<Scene3DProps> = ({ modelUrl, images, onHoverScreen, onClickScreen }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();

  // Refs Logika & Interaksi
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const interactableMeshes = useRef<THREE.Mesh[]>([]);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Mencegah Re-render Loop
  const onHoverRef = useRef(onHoverScreen);
  const onClickRef = useRef(onClickScreen);

  useEffect(() => {
    onHoverRef.current = onHoverScreen;
    onClickRef.current = onClickScreen;
  }, [onHoverScreen, onClickScreen]);

  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // --- 1. SETUP SCENE ---
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

    mountRef.current.innerHTML = ''; // Clear container
    mountRef.current.appendChild(renderer.domElement);

    // --- 2. LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5); sunLight.position.set(10, 20, 10); sunLight.castShadow = true; scene.add(sunLight);
    const grid = new THREE.GridHelper(100, 100, 0x555555, 0x999999); grid.position.y = -0.01; scene.add(grid);

    // --- 3. LOAD MODEL & TEXTURE ---
    const loader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous');
    interactableMeshes.current = [];

    loader.load(modelUrl, (gltf) => {
        const model = gltf.scene;

        // --- TEXTURE SETUP ---

        // 1. Texture Khusus Model Lama (VID_Slot_1) - Index 0
        let textureTV: THREE.Texture | null = null;
        if (images && images[0]) {
          textureTV = textureLoader.load(images[0]);
          textureTV.flipY = false; textureTV.colorSpace = THREE.SRGBColorSpace;
          // Rotasi khusus untuk model lama
          textureTV.rotation = 1.6; textureTV.center.set(0.53, 0.4); textureTV.repeat.set(5, 4);
          textureTV.wrapS = THREE.ClampToEdgeWrapping; textureTV.wrapT = THREE.ClampToEdgeWrapping;
        }

        // 2. Texture Khusus Model Lama (IMG_Slot_1) - Index 1
        let texturePoster: THREE.Texture | null = null;
        if (images && images[1]) {
          texturePoster = textureLoader.load(images[1]);
          texturePoster.flipY = false; texturePoster.colorSpace = THREE.SRGBColorSpace;
          texturePoster.rotation = 0; texturePoster.center.set(0.5, 0.35); texturePoster.repeat.set(5, 4);
          texturePoster.wrapS = THREE.ClampToEdgeWrapping; texturePoster.wrapT = THREE.ClampToEdgeWrapping;
        }

        // 3. [BARU] Texture Khusus Mesh "25" (Mapping Normal) - Index 0
        // Kita buat texture instance baru agar settingan rotasi textureTV tidak merusak mesh 25
        let textureMesh17: THREE.Texture | null = null;
        if (images && images[0]) {
           textureMesh17 = textureLoader.load(images[0]);
           textureMesh17.flipY = false; // Standar GLTF
           textureMesh17.colorSpace = THREE.SRGBColorSpace;
           // Tidak perlu rotasi aneh-aneh untuk mesh standar
        }

        // --- TRAVERSE & APPLY ---
        model.traverse((node) => {
          if ((node as THREE.Mesh).isMesh) {
            const mesh = node as THREE.Mesh;

            // A. Logika Model Lama (TV)
            if (mesh.name.includes('VID_Slot_1')) {
              if (textureTV) mesh.material = new THREE.MeshBasicMaterial({ map: textureTV, side: THREE.DoubleSide });
              interactableMeshes.current.push(mesh);
            }

            // B. Logika Model Lama (Poster)
            if (mesh.name.includes('IMG_Slot_1')) {
              if (texturePoster) mesh.material = new THREE.MeshBasicMaterial({ map: texturePoster, side: THREE.DoubleSide });
              interactableMeshes.current.push(mesh);
            }

            // C. [BARU] Logika Mesh "25"
            // Kita gunakan exact match (===) atau includes tergantung kebutuhan
            if (mesh.name === '17' || mesh.name.includes('17')) {
               if (textureMesh17) {
                  // Gunakan MeshBasicMaterial agar gambar terang (seperti layar)
                  mesh.material = new THREE.MeshBasicMaterial({ map: textureMesh17, side: THREE.DoubleSide });
               }
               interactableMeshes.current.push(mesh);
            }
          }
        });
        scene.add(model);
    }, undefined, (err) => console.error(err));

    // --- 4. INTERAKSI ---
    const updateMouseCoordinates = (clientX: number, clientY: number) => {
        if (!mountRef.current) return;
        const rect = mountRef.current.getBoundingClientRect();
        mouse.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouse.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const getIntersection = () => {
        if (!cameraRef.current || interactableMeshes.current.length === 0) return { hit: false, index: -1 };
        raycaster.current.setFromCamera(mouse.current, cameraRef.current);
        const intersects = raycaster.current.intersectObjects(interactableMeshes.current);

        if (intersects.length > 0) {
            const objectName = intersects[0].object.name;

            // Interaksi Model Lama
            if (objectName.includes('VID_Slot_1')) return { hit: true, index: 0 };
            if (objectName.includes('IMG_Slot_1')) return { hit: true, index: 1 };

            // [BARU] Interaksi Mesh "25" -> Return index 0 (karena menampilkan image[0])
            if (objectName === '17' || objectName.includes('17')) return { hit: true, index: 0 };
        }
        return { hit: false, index: -1 };
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { isDragging.current = true; previousMousePosition.current = { x: e.clientX, y: e.clientY }; }
    };

    const onMouseUp = (e: MouseEvent) => {
        isDragging.current = false;
        if (e.clientX === previousMousePosition.current.x && e.clientY === previousMousePosition.current.y) {
            updateMouseCoordinates(e.clientX, e.clientY);
            const { hit, index } = getIntersection();
            if (hit && onClickRef.current) onClickRef.current(index); // Kirim Index
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
      updateMouseCoordinates(e.clientX, e.clientY);
      const { hit, index } = getIntersection();
      if (onHoverRef.current) onHoverRef.current(hit, e.clientX, e.clientY, index);
      if (mountRef.current) mountRef.current.style.cursor = hit ? 'pointer' : (isDragging.current ? 'grabbing' : 'grab');
    };

    // Keyboard Controls
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
      const forward = new THREE.Vector3(); camera.getWorldDirection(forward); forward.y = 0; forward.normalize();
      const right = new THREE.Vector3(); right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      if (keysPressed.current['KeyW'] || keysPressed.current['ArrowUp']) camera.position.add(forward.multiplyScalar(moveSpeed));
      if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) camera.position.add(forward.multiplyScalar(-moveSpeed));
      if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) camera.position.add(right.multiplyScalar(moveSpeed));
      if (keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft']) camera.position.add(right.multiplyScalar(-moveSpeed));
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
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

  // UI Helpers (Buttons)
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