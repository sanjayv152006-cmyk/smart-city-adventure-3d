import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CITY_LOCATIONS } from '../data/locations';
import { CityLocationInfo, CityDefinition } from '../types/game';
import { soundService } from '../services/sound';

interface City3DCanvasProps {
  unlockedLocationIds: number[];
  newlyUnlockedId: number | null;
  focusedLocationId: number | null;
  onSelectLocation?: (id: number) => void;
  isNight?: boolean;
  cityDefinition?: CityDefinition;
  graphicsQuality?: 'low' | 'medium' | 'high';
}

export const City3DCanvas: React.FC<City3DCanvasProps> = ({
  unlockedLocationIds,
  newlyUnlockedId,
  focusedLocationId,
  onSelectLocation,
  isNight = false,
  cityDefinition,
  graphicsQuality = 'high',
}) => {
  const [hasWebGLError, setHasWebGLError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const locationGroupsRef = useRef<Map<number, THREE.Group>>(new Map());
  const lockedMarkersRef = useRef<Map<number, THREE.Group>>(new Map());
  const animFrameRef = useRef<number | null>(null);

  // References for animated elements
  const movingVehiclesRef = useRef<{
    mesh: THREE.Object3D;
    speed: number;
    axis: 'x' | 'z';
    min: number;
    max: number;
    dir: number;
  }[]>([]);
  const flyingPlaneRef = useRef<THREE.Object3D | null>(null);
  const hologramGlobeRef = useRef<THREE.Object3D | null>(null);
  const radarDishRef = useRef<THREE.Object3D | null>(null);
  const cloudGroupRef = useRef<THREE.Group | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const envTextureRef = useRef<THREE.Texture | null>(null);

  // Camera targets
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 36, 68));
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 5));
  const isTransitioningCam = useRef<boolean>(false);
  const safeUnlockedIds = Array.isArray(unlockedLocationIds) ? unlockedLocationIds : [];
  const unlockedLocationIdsRef = useRef<number[]>(safeUnlockedIds);
  unlockedLocationIdsRef.current = safeUnlockedIds;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- 1. SCENE & FOG SETUP ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const skyColor = cityDefinition ? cityDefinition.skyColor : 0x7dd3fc;
    const fogColor = cityDefinition ? cityDefinition.fogColor : 0xbae6fd;
    scene.background = new THREE.Color(isNight ? 0x090d16 : skyColor);
    scene.fog = new THREE.FogExp2(isNight ? 0x090d16 : fogColor, 0.007);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const isMobile = width < 768 || width / height < 1.0;

    const camera = new THREE.PerspectiveCamera(isMobile ? 50 : 45, width / height, 0.5, 500);
    const initialCamPos = isMobile ? new THREE.Vector3(0, 52, 96) : new THREE.Vector3(0, 38, 70);
    camera.position.copy(initialCamPos);
    targetCamPos.current.copy(initialCamPos);
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: graphicsQuality !== 'low',
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch (e) {
      console.warn('WebGL initialization failed, falling back to 2D view mode:', e);
      setHasWebGLError(true);
      return;
    }
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isNight ? 0.85 : 0.98;

    if (graphicsQuality === 'low') {
      renderer.setPixelRatio(1);
      renderer.shadowMap.enabled = false;
    } else if (graphicsQuality === 'medium') {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.BasicShadowMap;
    } else {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
    }

    container.appendChild(renderer.domElement);

    // --- 2. ENVIRONMENT MAP (STUDIO REFLECTION FOR GLASS & METALS) ---
    try {
      const pmrem = new THREE.PMREMGenerator(renderer);
      const roomEnv = new RoomEnvironment();
      const envMap = pmrem.fromScene(roomEnv, 0.04).texture;
      scene.environment = envMap;
      envTextureRef.current = envMap;
      pmrem.dispose();
      roomEnv.dispose();
    } catch (e) {
      console.warn('RoomEnvironment generation fallback:', e);
    }

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);

    // --- 3. ORBIT CONTROLS WITH SMOOTH MOBILE TOUCH ---
    let controls: OrbitControls;
    try {
      controls = new OrbitControls(camera, renderer.domElement);
    } catch (e) {
      console.warn('OrbitControls initialization error:', e);
      controls = {
        enableDamping: false,
        dampingFactor: 0.05,
        maxPolarAngle: Math.PI / 2,
        minDistance: 20,
        maxDistance: 140,
        target: new THREE.Vector3(0, 0, 5),
        update: () => {},
        dispose: () => {},
      } as unknown as OrbitControls;
    }
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enableRotate = true;
    controls.rotateSpeed = isMobile ? 0.85 : 0.75;
    controls.enableZoom = true;
    controls.zoomSpeed = isMobile ? 1.15 : 1.0;
    controls.enablePan = true;
    controls.panSpeed = 0.8;
    controls.screenSpacePanning = true;

    // Sensible zoom limits preventing roof clipping or drifting into void
    controls.minDistance = 20;
    controls.maxDistance = 140;
    controls.minPolarAngle = Math.PI * 0.12;
    controls.maxPolarAngle = Math.PI / 2.08;
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };
    controls.target.set(0, 0, 5);
    controlsRef.current = controls;

    // --- 4. LIGHTING RIG ---
    const ambientLight = new THREE.AmbientLight(isNight ? 0x1e293b : 0xffffff, isNight ? 0.25 : 0.35);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(
      isNight ? 0x1e293b : 0xdbeafe,
      isNight ? 0x090d16 : 0x1f2937,
      isNight ? 0.35 : 0.45
    );
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const sunLight = new THREE.DirectionalLight(isNight ? 0x93c5fd : 0xfffbeb, isNight ? 0.55 : 1.20);
    sunLight.position.set(45, 75, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 200;
    sunLight.shadow.camera.left = -65;
    sunLight.shadow.camera.right = 65;
    sunLight.shadow.camera.top = 65;
    sunLight.shadow.camera.bottom = -65;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    const rimLight = new THREE.DirectionalLight(isNight ? 0x38bdf8 : 0xfde68a, isNight ? 0.25 : 0.40);
    rimLight.position.set(-45, 30, -50);
    scene.add(rimLight);

    // --- 5. PROCEDURAL GROUND & CONNECTED ROADS ---
    buildGroundAndRoads(scene, cityDefinition?.groundColor, isNight);

    // --- 6. DECORATIVE SKY CLOUDS ---
    const clouds = buildClouds(isNight);
    scene.add(clouds);
    cloudGroupRef.current = clouds;

    // --- 7. BUILD ALL 10 ZONE GROUPS ---
    const animatedRefs = {
      hologramGlobe: (mesh: THREE.Object3D) => {
        hologramGlobeRef.current = mesh;
      },
      radarDish: (mesh: THREE.Object3D) => {
        radarDishRef.current = mesh;
      },
    };
    buildAllZones(scene, locationGroupsRef.current, lockedMarkersRef.current, animatedRefs, isNight);

    // --- 8. ANIMATED REALISTIC VEHICLES ON ROADS ---
    initMovingVehicles(scene, movingVehiclesRef.current);

    // --- 9. ANIMATED AIRPLANE OVER AIRPORT (NOSE POINTS STRICTLY FORWARD) ---
    const plane = buildRealisticAirplane();
    plane.position.set(-20, 24, 36);
    scene.add(plane);
    flyingPlaneRef.current = plane;

    // --- 10. RAYCASTING INTERACTION ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let pointerDownStart = { x: 0, y: 0, time: 0 };

    const handlePointerDown = (event: PointerEvent) => {
      pointerDownStart = { x: event.clientX, y: event.clientY, time: Date.now() };
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!onSelectLocation) return;
      const dist = Math.hypot(event.clientX - pointerDownStart.x, event.clientY - pointerDownStart.y);
      const elapsed = Date.now() - pointerDownStart.time;

      if (dist > 8 || elapsed > 400) {
        return;
      }

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(scene.children, true);
      for (const hit of intersects) {
        let cur: THREE.Object3D | null = hit.object;
        while (cur && cur !== scene) {
          if (cur.userData && cur.userData.locationId) {
            const locId = cur.userData.locationId;
            if (unlockedLocationIdsRef.current.includes(locId)) {
              soundService.playClick();
              onSelectLocation(locId);
            }
            return;
          }
          cur = cur.parent;
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);

    // --- 11. RESIZE HANDLER ---
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      const aspect = w / h;
      camera.aspect = aspect;
      const isMob = w < 768 || aspect < 1.0;
      camera.fov = isMob ? 50 : 45;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // --- 12. ANIMATION LOOP ---
    const timer = new THREE.Timer();
    let planeAngle = 0;

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      timer.update();
      const delta = Math.min(timer.getDelta(), 0.1);
      const elapsedTime = timer.getElapsed();

      controls.update();

      if (isTransitioningCam.current) {
        camera.position.lerp(targetCamPos.current, 0.05);
        controls.target.lerp(targetLookAt.current, 0.05);
        if (
          camera.position.distanceTo(targetCamPos.current) < 0.2 &&
          controls.target.distanceTo(targetLookAt.current) < 0.2
        ) {
          isTransitioningCam.current = false;
        }
      }

      // Gentle cloud drift
      if (cloudGroupRef.current) {
        cloudGroupRef.current.rotation.y = elapsedTime * 0.012;
      }

      // Rotating Radar Dish at Airport
      if (radarDishRef.current) {
        radarDishRef.current.rotation.y = elapsedTime * 1.5;
      }

      // Rotating Hologram Globe at Smart City Center
      if (hologramGlobeRef.current) {
        hologramGlobeRef.current.rotation.y = elapsedTime * 0.8;
        hologramGlobeRef.current.rotation.x = Math.sin(elapsedTime * 0.5) * 0.15;
      }

      // Moving vehicles on roads (correct forward driving)
      movingVehiclesRef.current.forEach((veh) => {
        if (veh.axis === 'x') {
          veh.mesh.position.x += veh.speed * veh.dir * delta;
          if (veh.dir > 0 && veh.mesh.position.x > veh.max) {
            veh.mesh.position.x = veh.min;
          } else if (veh.dir < 0 && veh.mesh.position.x < veh.min) {
            veh.mesh.position.x = veh.max;
          }
        } else {
          veh.mesh.position.z += veh.speed * veh.dir * delta;
          if (veh.dir > 0 && veh.mesh.position.z > veh.max) {
            veh.mesh.position.z = veh.min;
          } else if (veh.dir < 0 && veh.mesh.position.z < veh.min) {
            veh.mesh.position.z = veh.max;
          }
        }
      });

      // --- CRITICAL FIX: AIRPLANE FLIGHT PATH AND FORWARD NOSE DIRECTION ---
      if (flyingPlaneRef.current) {
        planeAngle += delta * 0.32;
        const radius = 22;
        const centerX = -20;
        const centerZ = 36;

        // Position on horizontal circle
        const curX = centerX + Math.cos(planeAngle) * radius;
        const curZ = centerZ + Math.sin(planeAngle) * radius;
        const curY = 24 + Math.sin(planeAngle * 2) * 1.4;

        // Velocity tangent vector: d(cos)/dt = -sin, d(sin)/dt = cos
        const velX = -Math.sin(planeAngle) * radius;
        const velZ = Math.cos(planeAngle) * radius;
        const velY = Math.cos(planeAngle * 2) * 2.8;

        flyingPlaneRef.current.position.set(curX, curY, curZ);

        // Since the airplane model is constructed with its nose pointing +Z:
        // atan2(velX, velZ) calculates the exact yaw heading so the nose points strictly in the direction of travel!
        const heading = Math.atan2(velX, velZ);
        flyingPlaneRef.current.rotation.y = heading;

        // Realistic aerodynamic bank roll into the turn (rolling around Z axis since fuselage is along Z)
        flyingPlaneRef.current.rotation.z = -0.16;

        // Realistic pitch following gentle climb/descent
        const horizSpeed = Math.hypot(velX, velZ);
        flyingPlaneRef.current.rotation.x = -Math.atan2(velY, horizSpeed) * 0.2;
      }

      // Locked markers subtle levitation
      lockedMarkersRef.current.forEach((marker) => {
        marker.position.y = 1.4 + Math.sin(elapsedTime * 2.5 + marker.position.x) * 0.15;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (controlsRef.current) controlsRef.current.dispose();
      if (envTextureRef.current) envTextureRef.current.dispose();
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (rendererRef.current.domElement.parentElement) {
          rendererRef.current.domElement.parentElement.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, [cityDefinition?.id, graphicsQuality]);

  // Update visibility and unlock animations
  useEffect(() => {
    const safeIds = Array.isArray(unlockedLocationIds) ? unlockedLocationIds : [];
    unlockedLocationIdsRef.current = safeIds;

    CITY_LOCATIONS.forEach((loc) => {
      const isUnlocked = safeIds.includes(loc.id);
      const bldgGroup = locationGroupsRef.current.get(loc.id);
      const lockMarker = lockedMarkersRef.current.get(loc.id);

      if (bldgGroup) {
        bldgGroup.visible = isUnlocked;
      }
      if (lockMarker) {
        lockMarker.visible = !isUnlocked;
      }
    });

    if (newlyUnlockedId !== null) {
      const group = locationGroupsRef.current.get(newlyUnlockedId);
      if (group) {
        group.scale.set(0.2, 0.2, 0.2);
        let progress = 0;
        const popAnim = () => {
          progress += 0.08;
          const s = Math.min(1.0, progress);
          const bounce = Math.sin(s * Math.PI * 0.5) * 1.05;
          group.scale.set(bounce, bounce, bounce);
          if (progress < 1.0) {
            requestAnimationFrame(popAnim);
          } else {
            group.scale.set(1, 1, 1);
          }
        };
        popAnim();
      }
    }
  }, [unlockedLocationIds, newlyUnlockedId]);

  // Camera flight focus
  useEffect(() => {
    if (cameraRef.current && controlsRef.current) {
      const isMob = window.innerWidth < 768 || window.innerWidth / window.innerHeight < 1.0;
      if (focusedLocationId !== null) {
        const loc = CITY_LOCATIONS.find((l) => l.id === focusedLocationId);
        if (loc) {
          const [tx, ty, tz] = loc.cameraTarget;
          targetLookAt.current.set(tx, ty, tz);
          targetCamPos.current.set(
            tx + (isMob ? 16 : 14),
            ty + (isMob ? 20 : 16),
            tz + (isMob ? 30 : 24)
          );
          isTransitioningCam.current = true;
        }
      } else {
        targetLookAt.current.set(0, 0, 5);
        targetCamPos.current.set(0, isMob ? 52 : 38, isMob ? 96 : 70);
        isTransitioningCam.current = true;
      }
    }
  }, [focusedLocationId]);

  // Update lighting on night toggle
  useEffect(() => {
    if (sunLightRef.current && hemiLightRef.current && sceneRef.current) {
      const skyColor = cityDefinition ? cityDefinition.skyColor : 0x7dd3fc;
      const fogColor = cityDefinition ? cityDefinition.fogColor : 0xbae6fd;
      sceneRef.current.background = new THREE.Color(isNight ? 0x090d16 : skyColor);
      sceneRef.current.fog = new THREE.FogExp2(isNight ? 0x090d16 : fogColor, 0.007);

      sunLightRef.current.color.setHex(isNight ? 0x93c5fd : 0xfffbeb);
      sunLightRef.current.intensity = isNight ? 0.55 : 1.20;
      hemiLightRef.current.color.setHex(isNight ? 0x1e293b : 0xdbeafe);
      hemiLightRef.current.groundColor.setHex(isNight ? 0x090d16 : 0x1f2937);
      hemiLightRef.current.intensity = isNight ? 0.35 : 0.45;
      if (rendererRef.current) {
        rendererRef.current.toneMappingExposure = isNight ? 0.85 : 0.98;
      }
    }
  }, [isNight, cityDefinition]);

  if (hasWebGLError) {
    return (
      <div className="absolute inset-0 w-full h-full overflow-hidden select-none bg-gradient-to-b from-slate-900 via-sky-950 to-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md p-6 rounded-3xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md space-y-3">
          <div className="text-3xl">🏙️</div>
          <h3 className="text-lg font-black text-white">Smart City Adventure</h3>
          <p className="text-xs text-slate-300">
            {cityDefinition?.name ? `Welcome to ${cityDefinition.name}!` : 'Welcome to your smart metropolis!'}
          </p>
          <div className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full inline-block">
            2D Safe View Mode Active • All Quizzes Operational
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none touch-none"
      style={{ touchAction: 'none' }}
    />
  );
};

// ==========================================
// 3D SCENE CONSTANTS & MATERIAL STYLING
// ==========================================
const TERRAIN_Y = 0.0;
const ROAD_Y = 0.025;
const MARKING_Y = 0.035;
const CURB_Y = 0.025;
const SURFACE_Y = 0.05;

// Shared material factory for clean PBR realism
const M = {
  asphalt: new THREE.MeshStandardMaterial({
    color: 0x141824, // darker, richer slate asphalt
    roughness: 0.86,
    metalness: 0.12,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -2,
  }),
  markingWhite: new THREE.MeshBasicMaterial({
    color: 0xffffff,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -4,
    depthWrite: true,
  }),
  markingYellow: new THREE.MeshBasicMaterial({
    color: 0xf59e0b, // vivid amber-gold divider
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -4,
    depthWrite: true,
  }),
  curbStone: new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.8,
    metalness: 0.08,
  }),
  sidewalkPavement: new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    roughness: 0.85,
    metalness: 0.06,
  }),
  brickRed: new THREE.MeshStandardMaterial({
    color: 0x991b1b,
    roughness: 0.85,
  }),
  brickWarm: new THREE.MeshStandardMaterial({
    color: 0xb45309,
    roughness: 0.82,
  }),
  stoneWall: new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.75,
  }),
  stuccoWhite: new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.58,
  }),
  stuccoCream: new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    roughness: 0.6,
  }),
  roofTileTerracotta: new THREE.MeshStandardMaterial({
    color: 0xa83220,
    roughness: 0.65,
  }),
  roofSlateDark: new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.5,
  }),
  windowGlass: new THREE.MeshStandardMaterial({
    color: 0x0284c7, // vibrant architectural reflective blue glass
    roughness: 0.08,
    metalness: 0.9,
    transparent: true,
    opacity: 0.9,
  }),
  windowDarkGlass: new THREE.MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.1,
    metalness: 0.88,
  }),
  woodWarm: new THREE.MeshStandardMaterial({
    color: 0x5c2b09,
    roughness: 0.78,
  }),
  steelGrey: new THREE.MeshStandardMaterial({
    color: 0x64748b,
    metalness: 0.82,
    roughness: 0.28,
  }),
  chromeBright: new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.95,
    roughness: 0.12,
  }),
  goldMetallic: new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.92,
    roughness: 0.22,
  }),
  tireRubber: new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.95,
  }),
  headlightGlow: new THREE.MeshBasicMaterial({
    color: 0xfffbeb,
  }),
  taillightRed: new THREE.MeshBasicMaterial({
    color: 0xef4444,
  }),
  sirenBlue: new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
  }),
};

// ==========================================
// 1. PROCEDURAL GROUND, ROADS & INFRASTRUCTURE
// ==========================================
function buildGroundAndRoads(scene: THREE.Scene, groundColorHex?: number, isNight?: boolean) {
  // Main Grass Landscape with Natural PBR Appearance
  const terrainGeo = new THREE.PlaneGeometry(164, 144, 1, 1);
  const terrainMat = new THREE.MeshStandardMaterial({
    color: groundColorHex ?? (isNight ? 0x0d3b1e : 0x1e6338),
    roughness: 0.88,
    metalness: 0.05,
    depthWrite: true,
  });
  const terrain = new THREE.Mesh(terrainGeo, terrainMat);
  terrain.rotation.x = -Math.PI / 2;
  terrain.position.y = TERRAIN_Y;
  terrain.receiveShadow = true;
  scene.add(terrain);

  // Subtle natural geometric lawn shading patches across the landscape for depth & variation
  const lawnTone1 = isNight ? 0x0a2d17 : 0x165328;
  const lawnTone2 = isNight ? 0x0e3e20 : 0x226b3c;
  const lawnPatches = [
    { x: -58, z: -28, w: 16, d: 20, col: lawnTone1 },
    { x: 58, z: -28, w: 16, d: 20, col: lawnTone2 },
    { x: -58, z: 4, w: 16, d: 20, col: lawnTone2 },
    { x: 58, z: 4, w: 16, d: 20, col: lawnTone1 },
    { x: -58, z: 36, w: 16, d: 22, col: lawnTone1 },
    { x: 58, z: 36, w: 16, d: 22, col: lawnTone2 },
    { x: 0, z: -52, w: 40, d: 12, col: lawnTone1 },
    { x: 0, z: 58, w: 40, d: 10, col: lawnTone2 },
  ];
  lawnPatches.forEach((lp) => {
    const patchMat = new THREE.MeshStandardMaterial({
      color: lp.col,
      roughness: 0.9,
      polygonOffset: true,
      polygonOffsetFactor: -0.5,
      polygonOffsetUnits: -1,
    });
    const patch = new THREE.Mesh(new THREE.PlaneGeometry(lp.w, lp.d), patchMat);
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(lp.x, TERRAIN_Y + 0.005, lp.z);
    patch.receiveShadow = true;
    scene.add(patch);
  });

  // Sub-base bedrock beneath terrain positioned at y = -1.05
  const baseGeo = new THREE.BoxGeometry(164.5, 2.0, 144.5);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x0b111e, roughness: 0.95 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = -1.05;
  base.receiveShadow = true;
  scene.add(base);

  // Road Configuration
  const ROAD_W = 6.4;
  const HALF_W = ROAD_W / 2;
  const EW_AVENUES = [-42, -12, 20, 52];
  const NS_STREETS = [-48, -24, 2, 28, 52];

  // Intersections
  const junctions: { x: number; z: number }[] = [];
  [-42, -12, 20].forEach((z) => {
    NS_STREETS.forEach((x) => junctions.push({ x, z }));
  });
  [-48, 2, 52].forEach((x) => junctions.push({ x, z: 52 }));

  junctions.forEach(({ x, z }) => {
    // Asphalt junction slab
    const jMesh = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W + 0.04, ROAD_W + 0.04), M.asphalt);
    jMesh.rotation.x = -Math.PI / 2;
    jMesh.position.set(x, ROAD_Y, z);
    jMesh.receiveShadow = true;
    scene.add(jMesh);

    // Crosswalk Zebra Stripes along North & South entrances
    [-HALF_W - 0.7, HALF_W + 0.7].forEach((zOff) => {
      for (let i = -2; i <= 2; i++) {
        if (i === 0) continue;
        const zebra = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 1.2), M.markingWhite);
        zebra.rotation.x = -Math.PI / 2;
        zebra.position.set(x + i * 0.9, MARKING_Y, z + zOff);
        scene.add(zebra);
      }
    });

    // Crosswalk Zebra Stripes along West & East entrances
    [-HALF_W - 0.7, HALF_W + 0.7].forEach((xOff) => {
      for (let i = -2; i <= 2; i++) {
        if (i === 0) continue;
        const zebra = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.48), M.markingWhite);
        zebra.rotation.x = -Math.PI / 2;
        zebra.position.set(x + xOff, MARKING_Y, z + i * 0.9);
        scene.add(zebra);
      }
    });

    // Street Corner Traffic Light Signal Posts on key intersections
    if ((x === -24 || x === 2 || x === 28) && (z === -12 || z === 20)) {
      scene.add(createTrafficLight(x + HALF_W + 0.9, z + HALF_W + 0.9, Math.PI));
    }
  });

  // Road segment helpers
  const createEWSegment = (xStart: number, xEnd: number, z: number) => {
    const len = xEnd - xStart;
    if (len <= 0.1) return;
    const cx = (xStart + xEnd) / 2;

    const seg = new THREE.Mesh(new THREE.PlaneGeometry(len + 0.04, ROAD_W), M.asphalt);
    seg.rotation.x = -Math.PI / 2;
    seg.position.set(cx, ROAD_Y, z);
    seg.receiveShadow = true;
    scene.add(seg);

    // Double yellow continuous median line along X axis
    const median1 = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.12), M.markingYellow);
    median1.rotation.x = -Math.PI / 2;
    median1.position.set(cx, MARKING_Y, z - 0.1);
    scene.add(median1);

    const median2 = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.12), M.markingYellow);
    median2.rotation.x = -Math.PI / 2;
    median2.position.set(cx, MARKING_Y, z + 0.1);
    scene.add(median2);

    // White outer curb lines along road edges
    const curbLine1 = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.1), M.markingWhite);
    curbLine1.rotation.x = -Math.PI / 2;
    curbLine1.position.set(cx, MARKING_Y, z - (HALF_W - 0.2));
    scene.add(curbLine1);

    const curbLine2 = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.1), M.markingWhite);
    curbLine2.rotation.x = -Math.PI / 2;
    curbLine2.position.set(cx, MARKING_Y, z + (HALF_W - 0.2));
    scene.add(curbLine2);

    // Solid white stop lines before intersections
    if (len > 8) {
      const stopBar1 = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 2.6), M.markingWhite);
      stopBar1.rotation.x = -Math.PI / 2;
      stopBar1.position.set(xStart + 1.2, MARKING_Y, z - 1.5);
      scene.add(stopBar1);

      const stopBar2 = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 2.6), M.markingWhite);
      stopBar2.rotation.x = -Math.PI / 2;
      stopBar2.position.set(xEnd - 1.2, MARKING_Y, z + 1.5);
      scene.add(stopBar2);
    }

    // Streetlamps along sidewalk verge
    if (len > 12) {
      scene.add(createRealisticStreetLight(cx, z + HALF_W + 0.8, 0));
    }
  };

  const createNSSegment = (zStart: number, zEnd: number, x: number) => {
    const len = zEnd - zStart;
    if (len <= 0.1) return;
    const cz = (zStart + zEnd) / 2;

    const seg = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, len + 0.04), M.asphalt);
    seg.rotation.x = -Math.PI / 2;
    seg.position.set(x, ROAD_Y, cz);
    seg.receiveShadow = true;
    scene.add(seg);

    // Double yellow continuous center divider along Z axis
    const med1 = new THREE.Mesh(new THREE.PlaneGeometry(0.12, len), M.markingYellow);
    med1.rotation.x = -Math.PI / 2;
    med1.position.set(x - 0.1, MARKING_Y, cz);
    scene.add(med1);

    const med2 = new THREE.Mesh(new THREE.PlaneGeometry(0.12, len), M.markingYellow);
    med2.rotation.x = -Math.PI / 2;
    med2.position.set(x + 0.1, MARKING_Y, cz);
    scene.add(med2);

    // White outer curb lines along road edges
    const curbLine1 = new THREE.Mesh(new THREE.PlaneGeometry(0.1, len), M.markingWhite);
    curbLine1.rotation.x = -Math.PI / 2;
    curbLine1.position.set(x - (HALF_W - 0.2), MARKING_Y, cz);
    scene.add(curbLine1);

    const curbLine2 = new THREE.Mesh(new THREE.PlaneGeometry(0.1, len), M.markingWhite);
    curbLine2.rotation.x = -Math.PI / 2;
    curbLine2.position.set(x + (HALF_W - 0.2), MARKING_Y, cz);
    scene.add(curbLine2);

    // Solid white stop lines before intersections
    if (len > 8) {
      const stopBar1 = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.35), M.markingWhite);
      stopBar1.rotation.x = -Math.PI / 2;
      stopBar1.position.set(x + 1.5, MARKING_Y, zStart + 1.2);
      scene.add(stopBar1);

      const stopBar2 = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.35), M.markingWhite);
      stopBar2.rotation.x = -Math.PI / 2;
      stopBar2.position.set(x - 1.5, MARKING_Y, zEnd - 1.2);
      scene.add(stopBar2);
    }

    // Streetlamp along sidewalk
    if (len > 14) {
      scene.add(createRealisticStreetLight(x + HALF_W + 0.8, cz, -Math.PI / 2));
    }
  };

  // Build East-West segments
  [-42, -12, 20].forEach((z) => {
    createEWSegment(-72, NS_STREETS[0] - HALF_W, z);
    for (let i = 0; i < NS_STREETS.length - 1; i++) {
      createEWSegment(NS_STREETS[i] + HALF_W, NS_STREETS[i + 1] - HALF_W, z);
    }
    createEWSegment(NS_STREETS[NS_STREETS.length - 1] + HALF_W, 72, z);
  });

  // South Parkway Avenue
  createEWSegment(-72, -48 - HALF_W, 52);
  createEWSegment(-48 + HALF_W, 2 - HALF_W, 52);
  createEWSegment(2 + HALF_W, 52 - HALF_W, 52);
  createEWSegment(52 + HALF_W, 72, 52);

  // Build North-South segments
  [-48, 2, 52].forEach((x) => {
    createNSSegment(-62, -42 - HALF_W, x);
    createNSSegment(-42 + HALF_W, -12 - HALF_W, x);
    createNSSegment(-12 + HALF_W, 20 - HALF_W, x);
    createNSSegment(20 + HALF_W, 52 - HALF_W, x);
    createNSSegment(52 + HALF_W, 62, x);
  });

  [-24, 28].forEach((x) => {
    createNSSegment(-62, -42 - HALF_W, x);
    createNSSegment(-42 + HALF_W, -12 - HALF_W, x);
    createNSSegment(-12 + HALF_W, 20 - HALF_W, x);
  });
}

function buildClouds(isNight?: boolean): THREE.Group {
  const group = new THREE.Group();
  const cloudMat = new THREE.MeshStandardMaterial({
    color: isNight ? 0x334155 : 0xffffff,
    roughness: 0.9,
    metalness: 0.0,
    transparent: true,
    opacity: isNight ? 0.45 : 0.85,
  });

  const puffGeo = new THREE.DodecahedronGeometry(2.4, 1);
  const cloudConfigs = [
    { x: -50, y: 36, z: -40 },
    { x: 30, y: 40, z: -45 },
    { x: -35, y: 38, z: 20 },
    { x: 45, y: 36, z: 30 },
    { x: 5, y: 42, z: -10 },
  ];

  cloudConfigs.forEach((cfg) => {
    const cloud = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const puff = new THREE.Mesh(puffGeo, cloudMat);
      puff.position.set(
        (i - 2) * 2.2 + (Math.random() - 0.5) * 1,
        (Math.random() - 0.5) * 1.2,
        (Math.random() - 0.5) * 1.5
      );
      const s = 0.8 + Math.random() * 0.5;
      puff.scale.set(s, s * 0.7, s);
      cloud.add(puff);
    }
    cloud.position.set(cfg.x, cfg.y, cfg.z);
    group.add(cloud);
  });

  return group;
}

// ==========================================
// 2. REALISTIC VEHICLES & ANIMATION FLEET
// ==========================================
function initMovingVehicles(
  scene: THREE.Scene,
  list: { mesh: THREE.Object3D; speed: number; axis: 'x' | 'z'; min: number; max: number; dir: number }[]
) {
  const sedanColors = [0xdc2626, 0x2563eb, 0x059669, 0xf8fafc, 0x1e293b, 0x7c3aed];

  // Avenues (East-West)
  const ewAvenues = [-42, -12, 20, 52];
  ewAvenues.forEach((zRoad, idx) => {
    for (let c = 0; c < 2; c++) {
      const dir = c === 0 ? 1 : -1;
      const laneOffset = dir > 0 ? 1.6 : -1.6;

      let veh: THREE.Group;
      if ((idx + c) % 4 === 1) {
        veh = createRealisticTaxi();
      } else if ((idx + c) % 4 === 2) {
        veh = createRealisticDeliveryVan(0xffffff);
      } else if (idx === 2 && c === 0) {
        veh = createRealisticCityBus();
      } else {
        veh = createRealisticSedan(sedanColors[(idx * 2 + c) % sedanColors.length]);
      }

      veh.position.set(-60 + c * 60, ROAD_Y, zRoad + laneOffset);
      // East-West vehicle heading: Car forward is +X. dir > 0: rotation.y = 0; dir < 0: rotation.y = Math.PI
      veh.rotation.y = dir > 0 ? 0 : Math.PI;
      scene.add(veh);

      list.push({
        mesh: veh,
        speed: 10 + Math.random() * 4,
        axis: 'x',
        min: -70,
        max: 70,
        dir,
      });
    }
  });

  // Central Boulevard (x = 2): Correct North-South forward heading!
  [-1, 1].forEach((dir, i) => {
    const laneOffset = dir > 0 ? 1.6 : -1.6;
    const veh = i === 0 ? createRealisticCityBus() : createRealisticSedan(0x0284c7);
    veh.position.set(2 + laneOffset, ROAD_Y, -30 + i * 40);
    // Since car model forward is +X:
    // To face +Z (dir > 0): rotation.y = -Math.PI / 2
    // To face -Z (dir < 0): rotation.y = +Math.PI / 2
    veh.rotation.y = dir > 0 ? -Math.PI / 2 : Math.PI / 2;
    scene.add(veh);
    list.push({
      mesh: veh,
      speed: 9.5,
      axis: 'z',
      min: -56,
      max: 56,
      dir,
    });
  });

  // Cross Streets (x = -24, 28): Correct North-South forward heading!
  [-24, 28].forEach((xRoad, idx) => {
    const dir = idx % 2 === 0 ? 1 : -1;
    const laneOffset = dir > 0 ? 1.6 : -1.6;
    const veh = createRealisticSedan(sedanColors[(idx + 3) % sedanColors.length]);
    veh.position.set(xRoad + laneOffset, ROAD_Y, -35 + idx * 30);
    // Correct forward orientation
    veh.rotation.y = dir > 0 ? -Math.PI / 2 : Math.PI / 2;
    scene.add(veh);
    list.push({
      mesh: veh,
      speed: 10 + Math.random() * 3,
      axis: 'z',
      min: -50,
      max: 18,
      dir,
    });
  });
}

// 2.1 Realistic Sedan Model
function createRealisticSedan(colorHex: number): THREE.Group {
  const car = new THREE.Group();
  const paintMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.35,
    metalness: 0.45,
  });

  // Lower chassis
  const chassisGeo = new THREE.BoxGeometry(3.6, 0.65, 1.8);
  const chassis = new THREE.Mesh(chassisGeo, paintMat);
  chassis.position.y = 0.55;
  chassis.castShadow = true;
  car.add(chassis);

  // Bumpers & grille
  const bumperMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 1.82), bumperMat);
  frontBumper.position.set(1.75, 0.45, 0);
  car.add(frontBumper);

  const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 1.82), bumperMat);
  rearBumper.position.set(-1.75, 0.45, 0);
  car.add(rearBumper);

  // Aerodynamic cabin & roof
  const cabinGeo = new THREE.BoxGeometry(2.1, 0.75, 1.55);
  const cabin = new THREE.Mesh(cabinGeo, paintMat);
  cabin.position.set(-0.15, 1.2, 0);
  cabin.castShadow = true;
  car.add(cabin);

  // Front Windshield
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.65, 1.45), M.windowGlass);
  windshield.rotation.z = -0.35;
  windshield.position.set(0.9, 1.15, 0);
  car.add(windshield);

  // Rear Window
  const rearWindow = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.65, 1.45), M.windowGlass);
  rearWindow.rotation.z = 0.35;
  rearWindow.position.set(-1.18, 1.15, 0);
  car.add(rearWindow);

  // Side Windows
  [-0.78, 0.78].forEach((wz) => {
    const sideWin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.52, 0.05), M.windowDarkGlass);
    sideWin.position.set(-0.15, 1.2, wz);
    car.add(sideWin);
  });

  // 4 Alloy Wheels with rubber tires
  const wheelPositions = [
    [-1.15, 0.35, -0.92],
    [1.15, 0.35, -0.92],
    [-1.15, 0.35, 0.92],
    [1.15, 0.35, 0.92],
  ];
  wheelPositions.forEach(([wx, wy, wz]) => {
    car.add(createCarWheel(wx, wy, wz));
  });

  // LED Headlights on front (+X) and Red Taillights on rear (-X)
  [-0.6, 0.6].forEach((zOff) => {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.32), M.headlightGlow);
    head.position.set(1.82, 0.65, zOff);
    car.add(head);

    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.32), M.taillightRed);
    tail.position.set(-1.82, 0.68, zOff);
    car.add(tail);
  });

  return car;
}

// 2.2 Realistic NYC / City Taxi
function createRealisticTaxi(): THREE.Group {
  const taxi = createRealisticSedan(0xfacc15);

  const signBase = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.4), M.steelGrey);
  signBase.position.set(-0.15, 1.62, 0);
  taxi.add(signBase);

  const signLit = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.3), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
  signLit.position.set(-0.15, 1.76, 0);
  taxi.add(signLit);

  [-0.91, 0.91].forEach((zOff) => {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.15), new THREE.MeshBasicMaterial({ color: 0x0f172a }));
    if (zOff < 0) stripe.rotation.y = Math.PI;
    stripe.position.set(-0.1, 0.68, zOff);
    taxi.add(stripe);
  });

  return taxi;
}

// 2.3 Realistic Delivery Van
function createRealisticDeliveryVan(colorHex: number): THREE.Group {
  const van = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.4 });

  // Front Cab (+X)
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 1.9), bodyMat);
  cab.position.set(1.2, 0.85, 0);
  cab.castShadow = true;
  van.add(cab);

  // Cargo Box (-X)
  const cargoMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 });
  const cargo = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.6, 1.94), cargoMat);
  cargo.position.set(-0.9, 1.1, 0);
  cargo.castShadow = true;
  van.add(cargo);

  // Windshield
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 1.7), M.windowGlass);
  windshield.rotation.z = -0.3;
  windshield.position.set(1.95, 1.05, 0);
  van.add(windshield);

  // Wheels
  [
    [-1.3, 0.38, -0.98],
    [1.3, 0.38, -0.98],
    [-1.3, 0.38, 0.98],
    [1.3, 0.38, 0.98],
  ].forEach(([wx, wy, wz]) => {
    van.add(createCarWheel(wx, wy, wz, 0.38));
  });

  // Headlights & Taillights
  [-0.65, 0.65].forEach((zOff) => {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.32), M.headlightGlow);
    head.position.set(2.12, 0.65, zOff);
    van.add(head);

    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 0.25), M.taillightRed);
    tail.position.set(-2.32, 0.9, zOff);
    van.add(tail);
  });

  return van;
}

// 2.4 Realistic City Transit Bus
function createRealisticCityBus(): THREE.Group {
  const bus = new THREE.Group();
  const busMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(7.2, 2.2, 2.2), busMat);
  body.position.set(0, 1.45, 0);
  body.castShadow = true;
  bus.add(body);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(7.22, 0.25, 2.22), M.stuccoWhite);
  roof.position.set(0, 2.58, 0);
  bus.add(roof);

  [-1.5, 1.5].forEach((rx) => {
    const ac = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 1.2), M.steelGrey);
    ac.position.set(rx, 2.82, 0);
    bus.add(ac);
  });

  [-1.12, 1.12].forEach((zOff) => {
    const glass = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.85, 0.05), M.windowGlass);
    glass.position.set(0, 1.75, zOff);
    bus.add(glass);
  });

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 2.05), M.windowGlass);
  windshield.position.set(3.62, 1.55, 0);
  bus.add(windshield);

  const routeSign = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 1.6), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
  routeSign.position.set(3.64, 2.3, 0);
  bus.add(routeSign);

  [
    [-2.2, 0.45, -1.12],
    [2.2, 0.45, -1.12],
    [-2.2, 0.45, 1.12],
    [2.2, 0.45, 1.12],
  ].forEach(([wx, wy, wz]) => {
    bus.add(createCarWheel(wx, wy, wz, 0.45));
  });

  return bus;
}

// 2.5 Realistic Police Patrol Cruiser
function createRealisticPoliceCruiser(): THREE.Group {
  const cruiser = createRealisticSedan(0x0f172a);

  [-0.91, 0.91].forEach((zOff) => {
    const doorDecal = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.55), M.stuccoWhite);
    if (zOff < 0) doorDecal.rotation.y = Math.PI;
    doorDecal.position.set(-0.15, 0.58, zOff);
    cruiser.add(doorDecal);
  });

  const pushBar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.55, 1.2), M.steelGrey);
  pushBar.position.set(1.92, 0.5, 0);
  cruiser.add(pushBar);

  const barMount = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 1.2), M.steelGrey);
  barMount.position.set(-0.15, 1.62, 0);
  cruiser.add(barMount);

  const blueLight = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.5), M.sirenBlue);
  blueLight.position.set(-0.15, 1.74, -0.32);
  cruiser.add(blueLight);

  const redLight = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.5), M.taillightRed);
  redLight.position.set(-0.15, 1.74, 0.32);
  cruiser.add(redLight);

  return cruiser;
}

// 2.6 Realistic Hospital Ambulance
function createRealisticAmbulance(): THREE.Group {
  const amb = new THREE.Group();
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });

  const box = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.0, 2.0), whiteMat);
  box.position.set(0, 1.35, 0);
  box.castShadow = true;
  amb.add(box);

  const stripeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  [-1.02, 1.02].forEach((zOff) => {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.35), stripeMat);
    if (zOff < 0) stripe.rotation.y = Math.PI;
    stripe.position.set(0, 1.2, zOff);
    amb.add(stripe);

    const c1 = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.22), stripeMat);
    const c2 = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.7), stripeMat);
    if (zOff < 0) {
      c1.rotation.y = Math.PI;
      c2.rotation.y = Math.PI;
    }
    c1.position.set(-0.8, 1.75, zOff);
    c2.position.set(-0.8, 1.75, zOff);
    amb.add(c1);
    amb.add(c2);
  });

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 1.8), M.windowGlass);
  windshield.position.set(2.22, 1.45, 0);
  amb.add(windshield);

  const sirenRed = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.25, 12), M.taillightRed);
  sirenRed.position.set(0.6, 2.45, -0.45);
  amb.add(sirenRed);

  const sirenBlue = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.25, 12), M.sirenBlue);
  sirenBlue.position.set(0.6, 2.45, 0.45);
  amb.add(sirenBlue);

  [
    [-1.4, 0.4, -1.02],
    [1.4, 0.4, -1.02],
    [-1.4, 0.4, 1.02],
    [1.4, 0.4, 1.02],
  ].forEach(([wx, wy, wz]) => {
    amb.add(createCarWheel(wx, wy, wz, 0.4));
  });

  return amb;
}

// Wheel builder with rubber tire and recessed silver alloy rim
function createCarWheel(x: number, y: number, z: number, radius = 0.35): THREE.Group {
  const wheel = new THREE.Group();
  wheel.position.set(x, y, z);

  const tireGeo = new THREE.CylinderGeometry(radius, radius, 0.35, 16);
  tireGeo.rotateX(Math.PI / 2);
  const tire = new THREE.Mesh(tireGeo, M.tireRubber);
  wheel.add(tire);

  const rimGeo = new THREE.CylinderGeometry(radius * 0.65, radius * 0.65, 0.36, 12);
  rimGeo.rotateX(Math.PI / 2);
  const rim = new THREE.Mesh(rimGeo, M.steelGrey);
  wheel.add(rim);

  return wheel;
}

// 2.7 Realistic Passenger Jet Airplane with NOSE POINTING STRICTLY ALONG +Z
function buildRealisticAirplane(): THREE.Group {
  const plane = new THREE.Group();
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.1 });
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35, metalness: 0.4 });

  // Sleek Aerodynamic Fuselage (strictly aligned along Z axis)
  const fuselageGeo = new THREE.CylinderGeometry(0.8, 0.8, 8.5, 20);
  fuselageGeo.rotateX(Math.PI / 2);
  const fuselage = new THREE.Mesh(fuselageGeo, whiteMat);
  fuselage.castShadow = true;
  plane.add(fuselage);

  // Cockpit Nose Cone pointing strictly along +Z (FORWARD DIRECTION)
  const noseGeo = new THREE.ConeGeometry(0.8, 2.0, 20);
  noseGeo.rotateX(Math.PI / 2);
  const nose = new THREE.Mesh(noseGeo, whiteMat);
  nose.position.z = 5.25;
  plane.add(nose);

  // Cockpit Windows
  const cockpitGlass = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, 0.6), M.windowDarkGlass);
  cockpitGlass.position.set(0, 0.4, 4.4);
  plane.add(cockpitGlass);

  // Swept Wings (spanning across X axis from -5.4 to +5.4)
  const wingShape = new THREE.BoxGeometry(10.8, 0.16, 2.6);
  const wings = new THREE.Mesh(wingShape, whiteMat);
  wings.position.set(0, -0.1, 0.6);
  wings.castShadow = true;
  plane.add(wings);

  // Winglets on left and right wing tips
  [-5.4, 5.4].forEach((wx) => {
    const winglet = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.8), blueMat);
    winglet.position.set(wx, 0.2, 0.4);
    plane.add(winglet);
  });

  // Vertical Tail Fin at the rear (-Z)
  const tailGeo = new THREE.BoxGeometry(0.18, 2.2, 1.6);
  const tail = new THREE.Mesh(tailGeo, blueMat);
  tail.position.set(0, 1.4, -3.8);
  tail.rotation.x = 0.3; // Swept back
  plane.add(tail);

  // Horizontal Tail Stabilizers at rear (-Z)
  const horizTail = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.12, 1.4), whiteMat);
  horizTail.position.set(0, 0.25, -3.8);
  plane.add(horizTail);

  // High-bypass Turbofan Jet Engines under wings (intakes facing +Z forward)
  [-2.6, 2.6].forEach((xOff) => {
    const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.42, 1.8, 16), whiteMat);
    nacelle.rotateX(Math.PI / 2);
    nacelle.position.set(xOff, -0.65, 0.6);
    plane.add(nacelle);

    const cowl = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.2, 16), M.steelGrey);
    cowl.rotateX(Math.PI / 2);
    cowl.position.set(xOff, -0.65, 1.45);
    plane.add(cowl);
  });

  plane.scale.set(0.9, 0.9, 0.9);
  return plane;
}

// ==========================================
// 3. BUILD ALL 10 ZONE ARCHITECTURAL MODELS
// ==========================================
function buildAllZones(
  scene: THREE.Scene,
  locationGroups: Map<number, THREE.Group>,
  lockedMarkers: Map<number, THREE.Group>,
  animatedRefs: { hologramGlobe: (m: THREE.Object3D) => void; radarDish: (m: THREE.Object3D) => void },
  isNight?: boolean
) {
  const ZONE_PLOTS: Record<number, { width: number; depth: number; offsetX: number; offsetZ: number; color: number }> = {
    1: { width: 16.2, depth: 21.6, offsetX: 0, offsetZ: 0, color: 0x1e293b },
    2: { width: 17.6, depth: 21.6, offsetX: 0, offsetZ: 0, color: 0x1e293b },
    3: { width: 17.6, depth: 21.6, offsetX: 0, offsetZ: 0, color: 0x1e293b },
    4: { width: 16.2, depth: 21.6, offsetX: 0, offsetZ: 0, color: 0x1e293b },
    5: { width: 16.2, depth: 23.6, offsetX: 0, offsetZ: 0, color: 0x1e6338 },
    6: { width: 17.6, depth: 23.6, offsetX: 0, offsetZ: 0, color: 0x1e293b },
    7: { width: 17.6, depth: 23.6, offsetX: 0, offsetZ: 0, color: 0x1e293b },
    8: { width: 16.2, depth: 23.6, offsetX: 0, offsetZ: 0, color: 0x1e293b },
    9: { width: 40.0, depth: 23.6, offsetX: -3.0, offsetZ: 0, color: 0x1e293b },
    10: { width: 40.0, depth: 23.6, offsetX: 5.0, offsetZ: 0, color: 0x0f172a },
  };

  CITY_LOCATIONS.forEach((loc) => {
    const group = new THREE.Group();
    group.position.set(loc.position3D[0], loc.position3D[1], loc.position3D[2]);
    group.userData = { locationId: loc.id, locationName: loc.name };

    // Concrete curb base platform
    const cfg = ZONE_PLOTS[loc.id] ?? { width: 16.0, depth: 20.0, offsetX: 0, offsetZ: 0, color: 0x334155 };
    const plotGeo = new THREE.BoxGeometry(cfg.width, 0.05, cfg.depth);
    const plotMat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      roughness: 0.85,
    });
    const plot = new THREE.Mesh(plotGeo, plotMat);
    plot.position.set(cfg.offsetX, CURB_Y, cfg.offsetZ);
    plot.receiveShadow = true;
    group.add(plot);

    // Build specific high-fidelity zone architectures
    switch (loc.id) {
      case 1:
        buildResidentialArea(group);
        break;
      case 2:
        buildSchoolZone(group);
        break;
      case 3:
        buildHospitalZone(group);
        break;
      case 4:
        buildShoppingDistrict(group);
        break;
      case 5:
        buildCentralPark(group);
        break;
      case 6:
        buildPoliceStation(group);
        break;
      case 7:
        buildFireStation(group);
        break;
      case 8:
        buildSportsStadium(group);
        break;
      case 9:
        buildAirport(group, animatedRefs.radarDish);
        break;
      case 10:
        buildSmartCityCenter(group, animatedRefs.hologramGlobe);
        break;
    }

    scene.add(group);
    locationGroups.set(loc.id, group);

    const markerGroup = buildLockedMarker(loc);
    scene.add(markerGroup);
    lockedMarkers.set(loc.id, markerGroup);
  });
}

// Holographic Padlock Construction Marker
function buildLockedMarker(loc: (typeof CITY_LOCATIONS)[0]): THREE.Group {
  const group = new THREE.Group();
  group.position.set(loc.position3D[0], 1.4, loc.position3D[2]);
  group.userData = { locationId: loc.id };

  // Ground Glowing Energy Disc
  const discGeo = new THREE.CylinderGeometry(2.8, 3.0, 0.12, 32);
  const discMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.2,
    metalness: 0.8,
    transparent: true,
    opacity: 0.8,
  });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.position.y = -1.35;
  group.add(disc);

  // Golden Padlock Body
  const lockBodyGeo = new THREE.BoxGeometry(2.3, 2.0, 1.2);
  const lockBody = new THREE.Mesh(lockBodyGeo, M.goldMetallic);
  lockBody.position.y = 1.0;
  lockBody.castShadow = true;
  group.add(lockBody);

  // Silver Shackle
  const torusGeo = new THREE.TorusGeometry(0.85, 0.22, 16, 24, Math.PI);
  const shackle = new THREE.Mesh(torusGeo, M.chromeBright);
  shackle.position.set(0, 1.95, 0);
  group.add(shackle);

  // Keyhole
  const keyholeGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.25, 12);
  keyholeGeo.rotateX(Math.PI / 2);
  const keyholeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  const keyhole = new THREE.Mesh(keyholeGeo, keyholeMat);
  keyhole.position.set(0, 1.0, 0);
  group.add(keyhole);

  return group;
}

// ----------------------------------------------------
// ZONE 1: REALISTIC SUBURBAN RESIDENTIAL HOMES
// ----------------------------------------------------
function buildResidentialArea(group: THREE.Group) {
  const houseConfigs = [
    { x: -4.5, z: -4.8, style: 'brick', color: 0x991b1b },
    { x: 4.5, z: -4.8, style: 'scandi', color: 0x78350f },
    { x: -4.5, z: 4.8, style: 'cottage', color: 0x38bdf8 },
    { x: 4.5, z: 4.8, style: 'modern', color: 0xe2e8f0 },
  ];

  houseConfigs.forEach((cfg) => {
    const house = new THREE.Group();
    house.position.set(cfg.x, SURFACE_Y, cfg.z);

    const base = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.4, 4.4), M.stoneWall);
    base.position.y = 0.2;
    house.add(base);

    if (cfg.style === 'brick') {
      const walls = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.4, 4.2), M.brickRed);
      walls.position.y = 2.1;
      walls.castShadow = true;
      walls.receiveShadow = true;
      house.add(walls);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(3.6, 2.2, 4), M.roofTileTerracotta);
      roof.rotateY(Math.PI / 4);
      roof.position.y = 4.8;
      roof.castShadow = true;
      house.add(roof);

      const chim = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.6, 0.7), M.brickRed);
      chim.position.set(1.2, 5.0, 0.8);
      house.add(chim);

      const porch = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 0.9), M.stuccoWhite);
      porch.position.set(0, 2.4, 2.3);
      house.add(porch);

      const door = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.0), M.woodWarm);
      door.position.set(0, 1.4, 2.12);
      house.add(door);

      [
        [-1.1, 2.6, 2.12],
        [1.1, 2.6, 2.12],
        [-1.1, 1.3, 2.12],
        [1.1, 1.3, 2.12],
      ].forEach(([wx, wy, wz]) => {
        const winFrame = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.08), M.stuccoWhite);
        winFrame.position.set(wx, wy, wz);
        house.add(winFrame);

        const winGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.75), M.windowGlass);
        winGlass.position.set(wx, wy, wz + 0.05);
        house.add(winGlass);
      });
    } else if (cfg.style === 'scandi') {
      const walls = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.2, 4.2), M.woodWarm);
      walls.position.y = 2.0;
      walls.castShadow = true;
      house.add(walls);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.25, 4.6), M.roofSlateDark);
      roof.rotation.x = 0.15;
      roof.position.set(0, 3.8, 0);
      roof.castShadow = true;
      house.add(roof);

      const solar = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.06, 1.4), M.windowGlass);
      solar.rotation.x = 0.15;
      solar.position.set(0, 4.0, 0);
      house.add(solar);

      const picWin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 0.08), M.windowGlass);
      picWin.position.set(0.8, 2.0, 2.12);
      house.add(picWin);

      const frontDoor = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.9), M.stuccoWhite);
      frontDoor.position.set(-1.0, 1.35, 2.12);
      house.add(frontDoor);
    } else if (cfg.style === 'cottage') {
      const walls = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.0, 4.2), new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.6 }));
      walls.position.y = 1.9;
      walls.castShadow = true;
      house.add(walls);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(3.5, 2.2, 4), M.roofSlateDark);
      roof.rotateY(Math.PI / 4);
      roof.position.y = 4.4;
      house.add(roof);

      const dormer = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 1.2), M.stuccoWhite);
      dormer.position.set(0, 4.0, 1.6);
      house.add(dormer);

      const door = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.8), M.woodWarm);
      door.position.set(0, 1.3, 2.12);
      house.add(door);
    } else {
      const walls = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.6, 4.2), M.stuccoWhite);
      walls.position.y = 2.2;
      walls.castShadow = true;
      house.add(walls);

      const balconyFloor = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 1.0), M.stuccoWhite);
      balconyFloor.position.set(0, 2.2, 2.5);
      house.add(balconyFloor);

      const railing = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 0.05), M.steelGrey);
      railing.position.set(0, 2.5, 3.0);
      house.add(railing);

      const roofCap = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.25, 4.4), M.roofSlateDark);
      roofCap.position.set(0, 4.1, 0);
      house.add(roofCap);
    }

    group.add(house);
  });

  [
    [-6.5, 0],
    [6.5, 0],
    [0, -7.5],
    [0, 7.5],
    [-6.5, -7.0],
    [6.5, 7.0],
  ].forEach(([tx, tz], i) => {
    group.add(createTree(tx, tz, i % 2 === 0 ? 'deciduous' : 'flowering'));
  });

  group.add(createRealisticStreetLight(-6.2, -5.5, 0));
  group.add(createRealisticStreetLight(6.2, 5.5, Math.PI));
  group.add(createParkBench(-6.2, 0, Math.PI / 2));
}

// ----------------------------------------------------
// ZONE 2: NEOCLASSICAL ACADEMY SCHOOL ZONE
// ----------------------------------------------------
function buildSchoolZone(group: THREE.Group) {
  const school = new THREE.Group();
  school.position.set(0, SURFACE_Y, -2.5);

  const mainBldg = new THREE.Mesh(new THREE.BoxGeometry(12, 4.8, 6.5), M.brickRed);
  mainBldg.position.y = 2.4;
  mainBldg.castShadow = true;
  mainBldg.receiveShadow = true;
  school.add(mainBldg);

  const portico = new THREE.Mesh(new THREE.BoxGeometry(4.5, 4.9, 1.4), M.stuccoWhite);
  portico.position.set(0, 2.45, 3.4);
  portico.castShadow = true;
  school.add(portico);

  [-1.5, -0.5, 0.5, 1.5].forEach((cx) => {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 4.2, 12), M.stuccoWhite);
    col.position.set(cx, 2.1, 4.0);
    school.add(col);
  });

  const pediment = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.4, 4), M.stuccoWhite);
  pediment.rotateY(Math.PI / 4);
  pediment.position.set(0, 5.2, 3.4);
  school.add(pediment);

  const tower = new THREE.Mesh(new THREE.BoxGeometry(3.2, 8.5, 3.2), M.brickRed);
  tower.position.set(0, 5.5, 0);
  tower.castShadow = true;
  school.add(tower);

  const clockGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.12, 24);
  clockGeo.rotateX(Math.PI / 2);
  const clockMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  [
    [0, 8.0, 1.62, 0],
    [0, 8.0, -1.62, Math.PI],
    [1.62, 8.0, 0, Math.PI / 2],
    [-1.62, 8.0, 0, -Math.PI / 2],
  ].forEach(([cx, cy, cz, ry]) => {
    const clock = new THREE.Mesh(clockGeo, clockMat);
    clock.position.set(cx, cy, cz);
    clock.rotation.y = ry;
    school.add(clock);
  });

  const belfryMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.4 });
  const belfry = new THREE.Mesh(new THREE.ConeGeometry(2.4, 2.6, 4), belfryMat);
  belfry.rotateY(Math.PI / 4);
  belfry.position.set(0, 11.0, 0);
  school.add(belfry);

  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 1.8, 8), M.goldMetallic);
  spire.position.set(0, 12.8, 0);
  school.add(spire);

  [-4.5, -2.8, 2.8, 4.5].forEach((wx) => {
    [1.8, 3.6].forEach((wy) => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.12), M.windowGlass);
      win.position.set(wx, wy, 3.3);
      school.add(win);
    });
  });

  group.add(school);

  const court = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 5.5), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6 }));
  court.rotation.x = -Math.PI / 2;
  court.position.set(4.2, SURFACE_Y + 0.005, 4.8);
  group.add(court);

  [-3.2, 3.2].forEach((hx) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8), M.steelGrey);
    pole.position.set(4.2 + hx, SURFACE_Y + 1.4, 4.8);
    group.add(pole);

    const backboard = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 1.0), M.stuccoWhite);
    backboard.position.set(4.2 + hx, SURFACE_Y + 2.6, 4.8);
    group.add(backboard);
  });

  const slideLadder = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.6, 8), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
  slideLadder.position.set(-5.5, SURFACE_Y + 1.3, 3.5);
  group.add(slideLadder);

  const slide = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 3.4), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
  slide.rotation.x = -Math.PI / 4.2;
  slide.position.set(-5.5, SURFACE_Y + 1.3, 4.8);
  group.add(slide);

  const bus = createRealisticCityBus();
  bus.position.set(-1.8, SURFACE_Y, 6.2);
  bus.scale.set(0.8, 0.8, 0.8);
  group.add(bus);

  group.add(createTree(-7.2, -6.5, 'deciduous'));
  group.add(createTree(7.2, -6.5, 'deciduous'));
}

// ----------------------------------------------------
// ZONE 3: METROPOLITAN HOSPITAL MEDICAL CENTER
// ----------------------------------------------------
function buildHospitalZone(group: THREE.Group) {
  const tower = new THREE.Mesh(new THREE.BoxGeometry(8.5, 9.5, 7.5), M.stuccoWhite);
  tower.position.set(0, SURFACE_Y + 4.75, -1.2);
  tower.castShadow = true;
  group.add(tower);

  const atrium = new THREE.Mesh(new THREE.BoxGeometry(6.5, 6.5, 2.8), M.windowGlass);
  atrium.position.set(0, SURFACE_Y + 3.25, 3.2);
  atrium.castShadow = true;
  group.add(atrium);

  [-5.8, 5.8].forEach((wx) => {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(4.2, 6.0, 6.2), M.stuccoWhite);
    wing.position.set(wx, SURFACE_Y + 3.0, -1.2);
    wing.castShadow = true;
    group.add(wing);

    for (let l = 1; l <= 3; l++) {
      const louver = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.12, 0.5), M.steelGrey);
      louver.position.set(wx, SURFACE_Y + l * 1.6, 2.0);
      group.add(louver);
    }
  });

  const crossH = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.8, 0.25), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
  crossH.position.set(0, SURFACE_Y + 7.8, 2.65);
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.6, 0.25), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
  crossV.position.set(0, SURFACE_Y + 7.8, 2.65);
  group.add(crossH);
  group.add(crossV);

  const heliPad = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, 0.2, 24), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
  heliPad.position.set(0, SURFACE_Y + 9.6, -1.2);
  group.add(heliPad);

  const ringYellow = new THREE.Mesh(new THREE.RingGeometry(1.8, 2.0, 24), M.markingYellow);
  ringYellow.rotation.x = -Math.PI / 2;
  ringYellow.position.set(0, SURFACE_Y + 9.72, -1.2);
  group.add(ringYellow);

  const canopy = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.2, 3.8), M.steelGrey);
  canopy.position.set(5.2, SURFACE_Y + 2.8, 4.2);
  group.add(canopy);

  const amb = createRealisticAmbulance();
  amb.position.set(5.2, SURFACE_Y, 4.4);
  group.add(amb);

  group.add(createRealisticStreetLight(-6.5, 4.8, 0));
  group.add(createTree(-6.5, -6.5, 'deciduous'));
}

// ----------------------------------------------------
// ZONE 4: GRAND GALLERIA SHOPPING DISTRICT
// ----------------------------------------------------
function buildShoppingDistrict(group: THREE.Group) {
  const galleria = new THREE.Mesh(new THREE.BoxGeometry(13.5, 6.5, 8.0), new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4 }));
  galleria.position.set(0, SURFACE_Y + 3.25, -2.0);
  galleria.castShadow = true;
  group.add(galleria);

  const skylight = new THREE.Mesh(
    new THREE.CylinderGeometry(2.6, 2.6, 11, 24, 1, false, 0, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.85, transparent: true, opacity: 0.85 })
  );
  skylight.rotation.z = Math.PI / 2;
  skylight.position.set(0, SURFACE_Y + 6.6, -2.0);
  group.add(skylight);

  const awningColors = [0x991b1b, 0x0284c7, 0xf59e0b];
  [-4.5, 0, 4.5].forEach((bx, idx) => {
    const vitrine = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.2, 0.15), M.windowGlass);
    vitrine.position.set(bx, SURFACE_Y + 1.1, 2.05);
    group.add(vitrine);

    const awning = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.25, 1.6),
      new THREE.MeshStandardMaterial({ color: awningColors[idx], roughness: 0.5 })
    );
    awning.rotation.x = 0.2;
    awning.position.set(bx, SURFACE_Y + 2.3, 2.8);
    group.add(awning);
  });

  [-4.0, 0, 4.0].forEach((cx, idx) => {
    const table = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.8, 12), M.woodWarm);
    table.position.set(cx, SURFACE_Y + 0.4, 5.5);
    group.add(table);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8), M.steelGrey);
    pole.position.set(cx, SURFACE_Y + 1.2, 5.5);
    group.add(pole);

    const parasol = new THREE.Mesh(
      new THREE.ConeGeometry(1.3, 0.5, 8),
      new THREE.MeshStandardMaterial({ color: idx % 2 === 0 ? 0xdc2626 : 0x0284c7 })
    );
    parasol.position.set(cx, SURFACE_Y + 2.3, 5.5);
    group.add(parasol);
  });

  group.add(createRealisticStreetLight(-6.5, 6.2, 0));
  group.add(createRealisticStreetLight(6.5, 6.2, 0));
}

// ----------------------------------------------------
// ZONE 5: CENTRAL PARK URBAN BOTANICAL OASIS
// ----------------------------------------------------
function buildCentralPark(group: THREE.Group) {
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(16.0, 23.4), new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 }));
  grass.rotation.x = -Math.PI / 2;
  grass.position.y = SURFACE_Y + 0.003;
  group.add(grass);

  const pathMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.8 });
  const mainPath = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 23.2), pathMat);
  mainPath.rotation.x = -Math.PI / 2;
  mainPath.position.set(0, SURFACE_Y + 0.006, 0);
  group.add(mainPath);

  const fountain = new THREE.Group();
  fountain.position.set(0, SURFACE_Y + 0.008, 0);

  const basin = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.9, 0.75, 24), M.stuccoWhite);
  basin.position.y = 0.38;
  basin.castShadow = true;
  fountain.add(basin);

  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(3.3, 3.3, 0.1, 24),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.05, metalness: 0.75, transparent: true, opacity: 0.9 })
  );
  water.position.y = 0.68;
  fountain.add(water);

  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 0.8, 0.8, 16), M.stuccoWhite);
  bowl.position.y = 1.3;
  fountain.add(bowl);

  const waterJet = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.4, 1.2, 12), M.windowGlass);
  waterJet.position.y = 2.1;
  fountain.add(waterJet);

  group.add(fountain);

  const gazebo = new THREE.Group();
  gazebo.position.set(-4.8, SURFACE_Y + 0.008, -5.5);

  const floor = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.5, 0.25, 8), M.stuccoWhite);
  floor.position.y = 0.12;
  gazebo.add(floor);

  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.6, 8), M.stuccoWhite);
    col.position.set(Math.cos(angle) * 2.0, 1.3, Math.sin(angle) * 2.0);
    gazebo.add(col);
  }

  const gazRoof = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.5, 6), new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.4 }));
  gazRoof.position.y = 3.3;
  gazebo.add(gazRoof);

  group.add(gazebo);

  group.add(createParkBench(-2.2, -4.0, Math.PI / 2));
  group.add(createParkBench(2.2, -4.0, -Math.PI / 2));
  group.add(createParkBench(-2.2, 4.0, Math.PI / 2));
  group.add(createParkBench(2.2, 4.0, -Math.PI / 2));

  [
    [-5.5, 5],
    [5.5, 5],
    [5, -5],
    [5.5, 0],
    [-5.5, 0],
    [5.0, -7.0],
  ].forEach(([px, pz], idx) => {
    group.add(createTree(px, pz, idx % 2 === 0 ? 'deciduous' : 'pine'));
  });
}

// ----------------------------------------------------
// ZONE 6: POLICE GUARDIAN PRECINCT HEADQUARTERS
// ----------------------------------------------------
function buildPoliceStation(group: THREE.Group) {
  const mainBldg = new THREE.Mesh(new THREE.BoxGeometry(11.5, 5.5, 8.2), new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4 }));
  mainBldg.position.set(0, SURFACE_Y + 2.75, -2.2);
  mainBldg.castShadow = true;
  group.add(mainBldg);

  const portico = new THREE.Mesh(new THREE.BoxGeometry(5.2, 3.8, 2.2), M.stoneWall);
  portico.position.set(0, SURFACE_Y + 1.9, 2.4);
  portico.castShadow = true;
  group.add(portico);

  const crest = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 0.2), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
  crest.position.set(0, SURFACE_Y + 3.8, 3.4);
  group.add(crest);

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.25, 7.5, 8), M.steelGrey);
  mast.position.set(4.2, SURFACE_Y + 6.5, -2.2);
  group.add(mast);

  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), M.taillightRed);
  beacon.position.set(4.2, SURFACE_Y + 10.3, -2.2);
  group.add(beacon);

  [-3.8, 3.8].forEach((cx) => {
    const cruiser = createRealisticPoliceCruiser();
    cruiser.position.set(cx, SURFACE_Y, 5.0);
    group.add(cruiser);
  });

  group.add(createRealisticStreetLight(-6.5, 5.0, 0));
  group.add(createTree(-6.5, -6.5, 'pine'));
}

// ----------------------------------------------------
// ZONE 7: FIRE RESCUE STATION NO. 1
// ----------------------------------------------------
function buildFireStation(group: THREE.Group) {
  const hall = new THREE.Mesh(new THREE.BoxGeometry(12.5, 6.5, 8.5), M.brickRed);
  hall.position.set(0, SURFACE_Y + 3.25, -2.0);
  hall.castShadow = true;
  group.add(hall);

  const bayMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
  [-3.2, 3.2].forEach((bx) => {
    const bayFrame = new THREE.Mesh(new THREE.BoxGeometry(4.2, 4.4, 0.35), bayMat);
    bayFrame.position.set(bx, SURFACE_Y + 2.2, 2.2);
    group.add(bayFrame);

    for (let s = 1; s <= 3; s++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.5, 0.1), M.windowGlass);
      slat.position.set(bx, SURFACE_Y + s * 1.1, 2.35);
      group.add(slat);
    }
  });

  const tower = new THREE.Mesh(new THREE.BoxGeometry(3.6, 10.5, 3.6), M.brickRed);
  tower.position.set(5.5, SURFACE_Y + 5.25, -2.0);
  tower.castShadow = true;
  group.add(tower);

  const railing = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.8, 3.8), M.steelGrey);
  railing.position.set(5.5, SURFACE_Y + 10.5, -2.0);
  group.add(railing);

  const fireEngine = new THREE.Group();
  fireEngine.position.set(0, SURFACE_Y, 5.2);

  const engineBody = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.2, 2.2), bayMat);
  engineBody.position.y = 1.5;
  engineBody.castShadow = true;
  fireEngine.add(engineBody);

  const ladder = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.25, 1.2), M.chromeBright);
  ladder.position.set(0, 2.8, 0);
  fireEngine.add(ladder);

  const siren = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 1.4), M.taillightRed);
  siren.position.set(2.0, 2.7, 0);
  fireEngine.add(siren);

  [
    [-1.8, 0.45, -1.15],
    [0.0, 0.45, -1.15],
    [1.8, 0.45, -1.15],
    [-1.8, 0.45, 1.15],
    [0.0, 0.45, 1.15],
    [1.8, 0.45, 1.15],
  ].forEach(([wx, wy, wz]) => {
    fireEngine.add(createCarWheel(wx, wy, wz, 0.45));
  });

  group.add(fireEngine);
  group.add(createFireHydrant(-6.5, 6.0));
}

// ----------------------------------------------------
// ZONE 8: SMART ARENA SPORTS STADIUM
// ----------------------------------------------------
function buildSportsStadium(group: THREE.Group) {
  const bowlGeo = new THREE.CylinderGeometry(8.2, 7.2, 4.4, 32, 1, true);
  const bowl = new THREE.Mesh(bowlGeo, new THREE.MeshStandardMaterial({ color: 0x6d28d9, roughness: 0.5 }));
  bowl.position.set(0, SURFACE_Y + 2.2, 0);
  bowl.castShadow = true;
  group.add(bowl);

  const seatGeo = new THREE.CylinderGeometry(7.2, 5.4, 4.0, 32, 1, true);
  const seats = new THREE.Mesh(seatGeo, new THREE.MeshStandardMaterial({ color: 0xa78bfa, roughness: 0.6 }));
  seats.position.set(0, SURFACE_Y + 2.05, 0);
  group.add(seats);

  const pitch = new THREE.Mesh(new THREE.PlaneGeometry(8.8, 5.8), new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 }));
  pitch.rotation.x = -Math.PI / 2;
  pitch.position.set(0, SURFACE_Y + 0.008, 0);
  group.add(pitch);

  const lines = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 5.4), M.markingWhite);
  lines.rotation.x = -Math.PI / 2;
  lines.position.set(0, SURFACE_Y + 0.012, 0);
  group.add(lines);

  [-4.2, 4.2].forEach((gx) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 2.0), M.stuccoWhite);
    post.position.set(gx, SURFACE_Y + 0.5, 0);
    group.add(post);
  });

  [
    [-6.8, -6.8],
    [6.8, -6.8],
    [-6.8, 6.8],
    [6.8, 6.8],
  ].forEach(([lx, lz]) => {
    const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 8.5, 8), M.steelGrey);
    pylon.position.set(lx, SURFACE_Y + 4.25, lz);
    group.add(pylon);

    const head = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 0.6), M.headlightGlow);
    head.position.set(lx, SURFACE_Y + 8.5, lz);
    group.add(head);
  });
}

// ----------------------------------------------------
// ZONE 9: SKYWAY INTERNATIONAL AIRPORT
// ----------------------------------------------------
function buildAirport(group: THREE.Group, onRadarReady?: (m: THREE.Object3D) => void) {
  const terminal = new THREE.Mesh(new THREE.BoxGeometry(18, 3.8, 6.5), M.stuccoWhite);
  terminal.position.set(-3, SURFACE_Y + 1.9, -4.5);
  terminal.castShadow = true;
  group.add(terminal);

  const glassFacade = new THREE.Mesh(new THREE.BoxGeometry(17.8, 2.4, 0.15), M.windowGlass);
  glassFacade.position.set(-3, SURFACE_Y + 2.0, -1.2);
  group.add(glassFacade);

  const towerShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.4, 9.5, 16), M.stoneWall);
  towerShaft.position.set(-10, SURFACE_Y + 4.75, -4.5);
  group.add(towerShaft);

  const cab = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 1.5, 2.2, 16), M.windowGlass);
  cab.position.set(-10, SURFACE_Y + 10.0, -4.5);
  group.add(cab);

  const radar = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.15, 16), M.steelGrey);
  radar.rotation.x = Math.PI / 4;
  radar.position.set(-10, SURFACE_Y + 11.5, -4.5);
  group.add(radar);
  if (onRadarReady) onRadarReady(radar);

  const runway = new THREE.Mesh(
    new THREE.PlaneGeometry(35, 6.2),
    new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.88,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );
  runway.rotation.x = -Math.PI / 2;
  runway.position.set(-3, SURFACE_Y + 0.005, 3.8);
  group.add(runway);

  for (let t = -2.4; t <= 2.4; t += 0.8) {
    const key = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.35), M.markingWhite);
    key.rotation.x = -Math.PI / 2;
    key.position.set(-18.5, SURFACE_Y + 0.01, 3.8 + t);
    group.add(key);
  }

  for (let rx = -15; rx <= 12; rx += 3.0) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.28), M.markingWhite);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(rx, SURFACE_Y + 0.01, 3.8);
    group.add(dash);
  }

  // Realistic Parked Passenger Jet on Apron (Nose points along +Z in model space)
  const jet = buildRealisticAirplane();
  jet.position.set(6.0, SURFACE_Y, -2.0);
  jet.rotation.y = Math.PI / 3;
  jet.scale.set(0.7, 0.7, 0.7);

  // Landing gear aligned with nose at +Z and wings along X
  [
    [0, 0.5, 3.6],
    [-1.8, 0.5, -0.5],
    [1.8, 0.5, -0.5],
  ].forEach(([gx, gy, gz]) => {
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.0, 8), M.steelGrey);
    strut.position.set(gx, gy, gz);
    jet.add(strut);

    const wheel = createCarWheel(gx, 0.22, gz, 0.22);
    jet.add(wheel);
  });

  group.add(jet);
}

// ----------------------------------------------------
// ZONE 10: SMART METROPOLIS & CYBER PLAZA
// ----------------------------------------------------
function buildSmartCityCenter(group: THREE.Group, onGlobeReady?: (m: THREE.Object3D) => void) {
  const mainTower = new THREE.Mesh(new THREE.BoxGeometry(6.0, 18, 6.0), M.windowGlass);
  mainTower.position.set(5.0, SURFACE_Y + 9.0, -2.5);
  mainTower.castShadow = true;
  group.add(mainTower);

  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.4, 5.5, 8), M.chromeBright);
  spire.position.set(5.0, SURFACE_Y + 20.5, -2.5);
  group.add(spire);

  [-5.5, 5.5].forEach((tx, idx) => {
    const h = idx === 0 ? 13 : 15;
    const tower = new THREE.Mesh(new THREE.BoxGeometry(4.4, h, 4.4), M.windowGlass);
    tower.position.set(5.0 + tx, SURFACE_Y + h / 2, -2.5);
    tower.castShadow = true;
    group.add(tower);
  });

  const skybridge = new THREE.Mesh(new THREE.BoxGeometry(11, 1.6, 2.2), M.windowGlass);
  skybridge.position.set(5.0, SURFACE_Y + 10.5, -2.5);
  group.add(skybridge);

  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 4.2, 0.55, 32), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 }));
  plaza.position.set(5.0, SURFACE_Y + 0.28, 4.8);
  group.add(plaza);

  const hologramGlobe = new THREE.Mesh(
    new THREE.SphereGeometry(1.7, 24, 24),
    new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.1,
      metalness: 0.9,
      wireframe: true,
      transparent: true,
      opacity: 0.9,
    })
  );
  hologramGlobe.position.set(5.0, SURFACE_Y + 2.4, 4.8);
  group.add(hologramGlobe);
  if (onGlobeReady) onGlobeReady(hologramGlobe);

  [-5.8, 5.8].forEach((sx) => {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.28, 3.4, 8), M.steelGrey);
    trunk.position.set(5.0 + sx, SURFACE_Y + 1.7, 5.2);
    group.add(trunk);

    const petal = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.16, 6), M.windowGlass);
    petal.rotation.x = Math.PI / 5;
    petal.position.set(5.0 + sx, SURFACE_Y + 3.4, 5.2);
    group.add(petal);
  });
}

// ==========================================
// 4. SHARED PROCEDURAL ASSET HELPERS
// ==========================================
function createTree(x: number, z: number, variant: 'deciduous' | 'flowering' | 'pine' = 'deciduous'): THREE.Group {
  const tree = new THREE.Group();
  tree.position.set(x, SURFACE_Y, z);

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.36, 1.6, 8), M.woodWarm);
  trunk.position.y = 0.8;
  trunk.castShadow = true;
  tree.add(trunk);

  if (variant === 'pine') {
    const pineMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.82 });
    [
      { y: 1.8, r: 1.5, h: 1.6 },
      { y: 2.8, r: 1.2, h: 1.4 },
      { y: 3.7, r: 0.8, h: 1.2 },
    ].forEach((tier) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(tier.r, tier.h, 8), pineMat);
      cone.position.y = tier.y;
      cone.castShadow = true;
      tree.add(cone);
    });
  } else {
    const leafColor = variant === 'flowering' ? 0xdb2777 : 0x166534;
    const leafMat = new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.78 });
    const geo = new THREE.DodecahedronGeometry(1.2, 1);

    [
      { x: 0, y: 2.1, z: 0, s: 1.1 },
      { x: 0.35, y: 2.7, z: 0.2, s: 0.85 },
      { x: -0.3, y: 2.5, z: -0.25, s: 0.8 },
    ].forEach((c) => {
      const puff = new THREE.Mesh(geo, leafMat);
      puff.position.set(c.x, c.y, c.z);
      puff.scale.set(c.s, c.s, c.s);
      puff.castShadow = true;
      tree.add(puff);
    });
  }

  return tree;
}

function createRealisticStreetLight(x: number, z: number, rotationY = 0): THREE.Group {
  const light = new THREE.Group();
  light.position.set(x, SURFACE_Y, z);
  light.rotation.y = rotationY;

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.2, 8), M.steelGrey);
  base.position.y = 0.1;
  light.add(base);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 3.6, 8), M.steelGrey);
  pole.position.y = 1.9;
  light.add(pole);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.1), M.steelGrey);
  arm.position.set(0.45, 3.65, 0);
  light.add(arm);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.35), M.steelGrey);
  head.position.set(0.85, 3.58, 0);
  light.add(head);

  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), M.headlightGlow);
  bulb.position.set(0.85, 3.48, 0);
  light.add(bulb);

  return light;
}

function createTrafficLight(x: number, z: number, rotationY = 0): THREE.Group {
  const signal = new THREE.Group();
  signal.position.set(x, SURFACE_Y, z);
  signal.rotation.y = rotationY;

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 4.2, 8), M.steelGrey);
  pole.position.y = 2.1;
  signal.add(pole);

  const box = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.4, 0.45), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 }));
  box.position.set(0, 3.4, 0);
  signal.add(box);

  const colors = [0xef4444, 0xfacc15, 0x22c55e];
  colors.forEach((col, idx) => {
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: col }));
    lens.position.set(0, 3.8 - idx * 0.4, 0.22);
    signal.add(lens);
  });

  return signal;
}

function createParkBench(x: number, z: number, rotationY = 0): THREE.Group {
  const bench = new THREE.Group();
  bench.position.set(x, SURFACE_Y, z);
  bench.rotation.y = rotationY;

  const legMat = M.steelGrey;
  [-0.8, 0.8].forEach((lx) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.6), legMat);
    leg.position.set(lx, 0.3, 0);
    bench.add(leg);
  });

  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.55), M.woodWarm);
  seat.position.set(0, 0.55, 0);
  bench.add(seat);

  const back = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.45, 0.08), M.woodWarm);
  back.position.set(0, 0.95, -0.24);
  bench.add(back);

  return bench;
}

function createFireHydrant(x: number, z: number): THREE.Group {
  const hydrant = new THREE.Group();
  hydrant.position.set(x, SURFACE_Y, z);

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.7, 12), new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 }));
  body.position.y = 0.35;
  hydrant.add(body);

  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
  cap.position.y = 0.7;
  hydrant.add(cap);

  [-0.22, 0.22].forEach((nx) => {
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.15, 8), M.steelGrey);
    nozzle.rotateZ(Math.PI / 2);
    nozzle.position.set(nx, 0.45, 0);
    hydrant.add(nozzle);
  });

  return hydrant;
}
