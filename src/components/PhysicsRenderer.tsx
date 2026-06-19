/**
 * 3D物理实验渲染器
 * 使用原生Three.js实现动态WebGL渲染，根据实验类型渲染不同场景
 */

'use client';

import React, { useRef, useEffect, useState } from 'react';
import type { AnimationData, PhysicsObject, ExperimentScene } from '../workflow/engine';

// 检测WebGL
function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch { return false; }
}

interface PhysicsRendererProps {
  scene: ExperimentScene | null;
  animations: AnimationData[];
  currentTime: number;
  isPlaying: boolean;
}

// WebGL可用时的Three.js渲染器
function ThreeRenderer({ scene, animations, currentTime, isPlaying }: PhysicsRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<any>(null);
  const threeSceneRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const meshesRef = useRef<Map<string, any>>(new Map());
  const linesRef = useRef<Map<string, any>>(new Map());
  const frameRef = useRef<number>(0);
  const orbitRef = useRef({ isDragging: false, lastX: 0, lastY: 0, theta: 0.5, phi: 1.2, distance: 20, targetX: 0, targetY: 3, targetZ: 0 });
  const trailRef = useRef<any[]>([]);

  useEffect(() => {
    let disposed = false;

    (async () => {
      const THREE = await import('three');
      if (disposed) return;

      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      rendererRef.current = renderer;

      const threeScene = new THREE.Scene();
      threeScene.background = new THREE.Color('#0a0a1a');
      threeScene.fog = new THREE.Fog('#0a0a1a', 15, 50);
      threeSceneRef.current = threeScene;

      const camera = new THREE.PerspectiveCamera(50, 2, 0.5, 100);
      camera.position.set(12, 8, 16);
      camera.lookAt(0, 3, 0);
      cameraRef.current = camera;

      // 灯光
      threeScene.add(new THREE.AmbientLight('#4a6090', 0.6));
      const sunLight = new THREE.DirectionalLight('#ffffff', 1.5);
      sunLight.position.set(15, 20, 10);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 0.5;
      sunLight.shadow.camera.far = 60;
      sunLight.shadow.camera.left = -20;
      sunLight.shadow.camera.right = 20;
      sunLight.shadow.camera.top = 20;
      sunLight.shadow.camera.bottom = -20;
      sunLight.shadow.bias = -0.0001;
      threeScene.add(sunLight);
      const rimLight = new THREE.DirectionalLight('#6ab0ff', 0.6);
      rimLight.position.set(-8, 5, -8);
      threeScene.add(rimLight);
      const bottomLight = new THREE.PointLight('#4a6090', 0.4, 30);
      bottomLight.position.set(0, -2, 0);
      threeScene.add(bottomLight);
      threeScene.add(new THREE.HemisphereLight('#6ab0ff', '#1a2a3a', 0.4));

      // 地面
      const groundGeo = new THREE.PlaneGeometry(40, 40);
      const groundMat = new THREE.MeshStandardMaterial({ color: '#1a2a3a', roughness: 0.7, metalness: 0.3 });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = 0;
      ground.receiveShadow = true;
      threeScene.add(ground);

      // 网格
      const gridHelper = new THREE.PolarGridHelper(20, 40, 30, 64, '#4a90d9', '#3a5a7a');
      gridHelper.position.y = 0.01;
      threeScene.add(gridHelper);

      // 背景星空
      const starsGeo = new THREE.BufferGeometry();
      const starsCount = 500;
      const starsPositions = new Float32Array(starsCount * 3);
      for (let i = 0; i < starsCount; i++) {
        starsPositions[i * 3] = (Math.random() - 0.5) * 40;
        starsPositions[i * 3 + 1] = Math.random() * 20 - 2;
        starsPositions[i * 3 + 2] = (Math.random() - 0.5) * 40;
      }
      starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
      const starsMat = new THREE.PointsMaterial({ color: '#4a90d9', size: 0.08, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false });
      const stars = new THREE.Points(starsGeo, starsMat);
      threeScene.add(stars);

      // 渲染循环
      const animate = () => {
        if (disposed) return;
        frameRef.current = requestAnimationFrame(animate);
        const o = orbitRef.current;
        if (!o.isDragging) o.theta += 0.002;
        const camX = o.targetX + o.distance * Math.sin(o.phi) * Math.cos(o.theta);
        const camY = o.targetY + o.distance * Math.cos(o.phi);
        const camZ = o.targetZ + o.distance * Math.sin(o.phi) * Math.sin(o.theta);
        camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.05);
        camera.lookAt(o.targetX, o.targetY, o.targetZ);
        stars.rotation.y += 0.0003;
        renderer.render(threeScene, camera);
      };
      frameRef.current = requestAnimationFrame(animate);

      // 鼠标事件
      const handleMouseDown = (e: MouseEvent) => {
        orbitRef.current.isDragging = true;
        orbitRef.current.lastX = e.clientX;
        orbitRef.current.lastY = e.clientY;
      };
      const handleMouseMove = (e: MouseEvent) => {
        if (!orbitRef.current.isDragging) return;
        const dx = e.clientX - orbitRef.current.lastX;
        const dy = e.clientY - orbitRef.current.lastY;
        orbitRef.current.theta -= dx * 0.005;
        orbitRef.current.phi = Math.max(0.2, Math.min(Math.PI / 2 - 0.1, orbitRef.current.phi - dy * 0.005));
        orbitRef.current.lastX = e.clientX;
        orbitRef.current.lastY = e.clientY;
      };
      const handleMouseUp = () => { orbitRef.current.isDragging = false; };
      const handleWheel = (e: WheelEvent) => {
        orbitRef.current.distance = Math.max(5, Math.min(40, orbitRef.current.distance + e.deltaY * 0.02));
      };
      const handleResize = () => {
        if (!container) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / Math.max(h, 1);
        camera.updateProjectionMatrix();
      };

      container.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      container.addEventListener('wheel', handleWheel, { passive: true });
      window.addEventListener('resize', handleResize);
      handleResize();

      return () => {
        disposed = true;
        cancelAnimationFrame(frameRef.current);
        container.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        container.removeEventListener('wheel', handleWheel);
        window.removeEventListener('resize', handleResize);
        renderer.dispose();
        threeScene.traverse((obj: any) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose());
            else obj.material.dispose();
          }
        });
      };
    })();

    return () => { disposed = true; };
  }, []);

  // 更新场景对象
  useEffect(() => {
    (async () => {
      const THREE = await import('three');
      const threeScene = threeSceneRef.current;
      if (!threeScene) return;

      // 清除旧网格和线条
      meshesRef.current.forEach((mesh) => { threeScene.remove(mesh); if (mesh.geometry) mesh.geometry.dispose(); if (mesh.material) mesh.material.dispose(); });
      meshesRef.current.clear();
      linesRef.current.forEach((line) => { threeScene.remove(line); if (line.geometry) line.geometry.dispose(); if (line.material) line.material.dispose(); });
      linesRef.current.clear();
      trailRef.current = [];

      const sceneType = (scene?.metadata as any)?.sceneType || 'default';
      const objects = scene?.objects || [];

      if (objects.length === 0) {
        const demoObj = createDemoObjects(THREE);
        demoObj.forEach(m => { threeScene.add(m); meshesRef.current.set(m.userData.id, m); });
      } else {
        objects.forEach(obj => {
          const mesh = createObjectMesh(THREE, obj);
          threeScene.add(mesh);
          meshesRef.current.set(obj.id, mesh);
        });

        // 场景特定元素
        buildSceneSpecificElements(THREE, threeScene, sceneType, objects, linesRef);
      }

      // 相机位置
      if (scene?.camera) {
        const o = orbitRef.current;
        o.targetX = scene.camera.target[0];
        o.targetY = scene.camera.target[1];
        o.targetZ = scene.camera.target[2];
        const cp = scene.camera.position;
        o.distance = Math.sqrt(cp[0] * cp[0] + cp[1] * cp[1] + cp[2] * cp[2]);
        o.phi = Math.acos(cp[1] / o.distance);
        o.theta = Math.atan2(cp[2], cp[0]);
      }
    })();
  }, [scene]);

  // 动画更新
  useEffect(() => {
    if (!isPlaying) return;
    let disposed = false;

    const run = async () => {
      const THREE = await import('three');
      if (disposed) return;

      const raf = () => {
        if (disposed) return;
        requestAnimationFrame(raf);
        const sceneType = (scene?.metadata as any)?.sceneType || 'freefall';

        animations.forEach(anim => {
          const mesh = meshesRef.current.get(anim.objectId);
          if (!mesh) return;
          const keyframes = anim.keyframes;
          if (keyframes.length === 0) return;

          let currentFrame = keyframes[0];
          for (let i = 0; i < keyframes.length; i++) {
            if (keyframes[i].time <= currentTime) currentFrame = keyframes[i];
            else break;
          }

          if (currentFrame?.position) {
            const pos = currentFrame.position;
            mesh.position.set(pos[0], pos[1], pos[2]);

            // 轨迹
            if (sceneType === 'projectile' || sceneType === 'freefall') {
              trailRef.current.push(pos.slice());
              if (trailRef.current.length > 200) trailRef.current.shift();
            }
          }
        });

        // 更新场景特定元素
        updateSceneElements(THREE, sceneType, animations, currentTime, meshesRef, linesRef);
      };
      raf();
    };
    run();

    return () => { disposed = true; };
  }, [isPlaying, currentTime, animations, scene]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      <div style={{
        position: 'absolute', top: '12px', left: '12px',
        padding: '8px 14px', background: 'rgba(0,0,0,0.5)',
        borderRadius: '8px', border: '1px solid rgba(74, 144, 217, 0.3)',
        fontSize: '11px', color: '#708090', pointerEvents: 'none',
      }}>
        <div>时间: {currentTime.toFixed(2)}s</div>
        <div>对象: {scene?.objects.length || 0}</div>
        <div>🖱 拖拽旋转 · 滚轮缩放</div>
      </div>
    </div>
  );
}

// 创建演示对象
function createDemoObjects(THREE: any): any[] {
  const meshes: any[] = [];
  const objs: Array<{ type: string; position: [number, number, number]; color: string; id: string }> = [
    { type: 'sphere', position: [0, 5, 0], color: '#ff6b6b', id: 'demo1' },
    { type: 'cube', position: [3, 0.5, 2], color: '#4a90d9', id: 'demo2' },
    { type: 'cylinder', position: [-3, 0.5, -2], color: '#2ed573', id: 'demo3' },
  ];
  objs.forEach(o => {
    const mesh = createObjectMesh(THREE, { id: o.id, name: '演示体', type: o.type as any, position: o.position, rotation: [0,0,0], scale: [1,1,1], mass: 1, color: o.color });
    mesh.userData.id = o.id;
    meshes.push(mesh);
  });
  return meshes;
}

// 创建物理对象网格
function createObjectMesh(THREE: any, obj: PhysicsObject): any {
  let geometry: any;
  switch (obj.type) {
    case 'sphere':
      geometry = new THREE.SphereGeometry(0.5 * (obj.scale?.[0] || 1), 32, 32);
      break;
    case 'cube':
      geometry = new THREE.BoxGeometry(obj.scale?.[0] || 1, obj.scale?.[1] || 1, obj.scale?.[2] || 1);
      break;
    case 'cylinder':
      geometry = new THREE.CylinderGeometry((obj.scale?.[0] || 0.3), (obj.scale?.[0] || 0.3), obj.scale?.[1] || 1, 32);
      break;
    case 'plane':
      geometry = new THREE.BoxGeometry(obj.scale?.[0] || 5, obj.scale?.[1] || 0.1, obj.scale?.[2] || 5);
      break;
    case 'ramp':
      geometry = new THREE.BoxGeometry(obj.scale?.[0] || 5, obj.scale?.[1] || 0.3, obj.scale?.[2] || 2);
      break;
    case 'lens':
      geometry = new THREE.CylinderGeometry(0.8, 0.8, 0.15, 32);
      break;
    default:
      geometry = new THREE.SphereGeometry(0.5, 32, 32);
  }

  const color = obj.color || '#4a90d9';
  const material = new THREE.MeshStandardMaterial({
    color, roughness: 0.3, metalness: 0.4,
    emissive: color, emissiveIntensity: 0.25,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(obj.position[0], obj.position[1], obj.position[2]);
  if (obj.type === 'ramp') mesh.rotation.set(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = { id: obj.id, name: obj.name, type: obj.type, color };

  // 发光环 (仅对运动物体)
  if (obj.type === 'sphere' || obj.type === 'cube') {
    const ringGeo = new THREE.TorusGeometry(0.55, 0.05, 16, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    mesh.add(ring);
  }

  return mesh;
}

// 构建场景特定元素
function buildSceneSpecificElements(THREE: any, threeScene: any, sceneType: string, objects: PhysicsObject[], linesRef: React.MutableRefObject<Map<string, any>>) {
  switch (sceneType) {
    case 'pendulum': {
      // 摆线
      const pivot = objects.find(o => o.id === 'pivot');
      const bob = objects.find(o => o.id === 'bob');
      if (pivot && bob) {
        const lineGeo = new THREE.BufferGeometry();
        const positions = new Float32Array([
          pivot.position[0], pivot.position[1], pivot.position[2],
          bob.position[0], bob.position[1], bob.position[2]
        ]);
        lineGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const lineMat = new THREE.LineBasicMaterial({ color: '#a0b0c0', linewidth: 1 });
        const line = new THREE.Line(lineGeo, lineMat);
        threeScene.add(line);
        linesRef.current.set('pendulum_string', line);
      }
      break;
    }
    case 'spring': {
      // 弹簧线圈 - 螺旋线
      const wall = objects.find(o => o.id === 'wall');
      const block = objects.find(o => o.id === 'mass_block');
      if (wall && block) {
        const coilPoints: number[] = [];
        const segments = 60;
        const coils = 8;
        const startX = wall.position[0] + 0.15;
        const endX = block.position[0] - 0.3;
        const y = block.position[1];
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          const x = startX + (endX - startX) * t;
          const z = Math.sin(t * coils * Math.PI * 2) * 0.3;
          coilPoints.push(x, y, z);
        }
        const coilGeo = new THREE.BufferGeometry();
        coilGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(coilPoints), 3));
        const coilMat = new THREE.LineBasicMaterial({ color: '#ffeaa7' });
        const coilLine = new THREE.Line(coilGeo, coilMat);
        threeScene.add(coilLine);
        linesRef.current.set('spring_coil', coilLine);
      }
      break;
    }
    case 'projectile': {
      // 轨迹线组
      const trailGroup = new THREE.Group();
      trailGroup.name = 'trail_group';
      threeScene.add(trailGroup);
      linesRef.current.set('trail_group', trailGroup);
      break;
    }
  }
}

// 更新场景特定元素（动画时）
function updateSceneElements(
  THREE: any, sceneType: string, animations: AnimationData[], currentTime: number,
  meshesRef: React.MutableRefObject<Map<string, any>>, linesRef: React.MutableRefObject<Map<string, any>>
) {
  switch (sceneType) {
    case 'pendulum': {
      const pivotMesh = meshesRef.current.get('pivot');
      const bobMesh = meshesRef.current.get('bob');
      const stringLine = linesRef.current.get('pendulum_string');
      if (pivotMesh && bobMesh && stringLine) {
        const positions = stringLine.geometry.attributes.position.array;
        positions[0] = pivotMesh.position.x;
        positions[1] = pivotMesh.position.y;
        positions[2] = pivotMesh.position.z;
        positions[3] = bobMesh.position.x;
        positions[4] = bobMesh.position.y;
        positions[5] = bobMesh.position.z;
        stringLine.geometry.attributes.position.needsUpdate = true;
      }
      break;
    }
    case 'spring': {
      const wallMesh = meshesRef.current.get('wall');
      const blockMesh = meshesRef.current.get('mass_block');
      const coilLine = linesRef.current.get('spring_coil');
      if (wallMesh && blockMesh && coilLine) {
        const positions = coilLine.geometry.attributes.position.array;
        const coils = 8;
        const segments = positions.length / 3;
        const startX = wallMesh.position.x + 0.15;
        const endX = blockMesh.position.x - 0.3;
        const y = blockMesh.position.y;
        for (let i = 0; i < segments; i++) {
          const t = i / (segments - 1);
          positions[i * 3] = startX + (endX - startX) * t;
          positions[i * 3 + 1] = y;
          positions[i * 3 + 2] = Math.sin(t * coils * Math.PI * 2) * 0.3;
        }
        coilLine.geometry.attributes.position.needsUpdate = true;
      }
      break;
    }
  }
}

// WebGL不可用时的降级视图
function FallbackView({ scene }: { scene: ExperimentScene | null }) {
  const sceneType = scene ? ((scene.metadata as any)?.sceneType || 'freefall') : null;
  const sceneTypeNames: Record<string, string> = {
    freefall: '自由落体', pendulum: '单摆运动', spring: '弹簧振子',
    projectile: '平抛运动', ramp: '斜面下滑'
  };

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '16px',
      background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a3e 50%, #0f0f2e 100%)',
      color: '#a0b0c0', textAlign: 'center', padding: '40px'
    }}>
      <div style={{ fontSize: '64px' }}>🔬</div>
      <h3 style={{ fontSize: '20px', color: '#6ab0ff', margin: 0 }}>3D 物理实验视口</h3>
      <p style={{ fontSize: '14px', maxWidth: '400px', lineHeight: '1.6' }}>
        当前浏览器环境不支持 WebGL 3D 渲染。<br/>
        请使用 Chrome、Firefox 或 Edge 浏览器以获得完整的 3D 交互体验。
      </p>
      {scene && (
        <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(74, 144, 217, 0.1)', border: '1px solid rgba(74, 144, 217, 0.3)', borderRadius: '12px', textAlign: 'left', maxWidth: '500px' }}>
          <h4 style={{ color: '#6ab0ff', marginBottom: '12px' }}>📋 实验场景: {sceneTypeNames[sceneType || ''] || '力学实验'}</h4>
          <p style={{ fontSize: '13px', color: '#a0b0c0', marginBottom: '8px' }}><strong>对象数量：</strong>{scene.objects.length} 个</p>
          {scene.objects.map((obj, i) => (
            <div key={i} style={{ fontSize: '12px', color: '#708090', padding: '4px 0' }}>
              • {obj.name} ({obj.type}) — 位置: [{obj.position.map(v => v.toFixed(1)).join(', ')}]
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PhysicsRenderer(props: PhysicsRendererProps) {
  const [webglOk, setWebglOk] = useState<boolean | null>(null);

  useEffect(() => {
    setWebglOk(isWebGLAvailable());
  }, []);

  if (webglOk === null) {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a3e 50%, #0f0f2e 100%)',
        color: '#6ab0ff', fontSize: '16px'
      }}>
        正在初始化 3D 引擎...
      </div>
    );
  }

  if (!webglOk) {
    return <FallbackView scene={props.scene} />;
  }

  return <ThreeRenderer {...props} />;
}