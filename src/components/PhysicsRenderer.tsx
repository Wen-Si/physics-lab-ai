/**
 * 3D物理实验渲染器
 * 使用原生Three.js实现动态WebGL渲染
 */

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
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
  const sceneRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const meshesRef = useRef<Map<string, any>>(new Map());
  const frameRef = useRef<number>(0);
  const clockRef = useRef<any>(null);
  const orbitRef = useRef({ isDragging: false, lastX: 0, lastY: 0, theta: 0.5, phi: 1.2, distance: 20, targetX: 0, targetY: 3, targetZ: 0 });

  useEffect(() => {
    const THREE = require('three');
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    // 场景
    const threeScene = new THREE.Scene();
    threeScene.background = new THREE.Color('#0a0a1a');
    threeScene.fog = new THREE.Fog('#0a0a1a', 15, 50);
    sceneRef.current = threeScene;

    // 相机
    const camera = new THREE.PerspectiveCamera(50, 2, 0.5, 100);
    camera.position.set(12, 8, 16);
    camera.lookAt(0, 3, 0);
    cameraRef.current = camera;

    const clock = new THREE.Clock();
    clockRef.current = clock;

    // 灯光
    const ambientLight = new THREE.AmbientLight('#4a6090', 0.6);
    threeScene.add(ambientLight);

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

    const hemisphereLight = new THREE.HemisphereLight('#6ab0ff', '#1a2a3a', 0.4);
    threeScene.add(hemisphereLight);

    // 地面
    const groundGeometry = new THREE.PlaneGeometry(40, 40);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: '#1a2a3a',
      roughness: 0.7,
      metalness: 0.3
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    threeScene.add(ground);

    // 网格
    const gridHelper = new THREE.PolarGridHelper(20, 40, 30, 64, '#4a90d9', '#3a5a7a');
    gridHelper.position.y = 0.01;
    threeScene.add(gridHelper);

    // 坐标轴
    const axisLength = 10;
    const axisColors = { x: '#ff4757', y: '#2ed573', z: '#1e90ff' };

    const createAxis = (dir: [number, number, number], color: string) => {
      const group = new THREE.Group();
      const shaftGeo = new THREE.CylinderGeometry(0.05, 0.05, axisLength, 8);
      const shaftMat = new THREE.MeshBasicMaterial({ color });
      const shaft = new THREE.Mesh(shaftGeo, shaftMat);
      const tipGeo = new THREE.ConeGeometry(0.15, 0.5, 8);
      const tipMat = new THREE.MeshBasicMaterial({ color });
      const tip = new THREE.Mesh(tipGeo, tipMat);
      tip.position.y = axisLength / 2;
      shaft.position.y = axisLength / 4;
      group.add(shaft, tip);
      if (dir[0] === 1) group.rotation.z = -Math.PI / 2;
      else if (dir[2] === 1) group.rotation.x = Math.PI / 2;
      threeScene.add(group);
    };
    createAxis([1, 0, 0], axisColors.x);
    createAxis([0, 1, 0], axisColors.y);
    createAxis([0, 0, 1], axisColors.z);

    // 粒子系统 - 背景星空
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
      frameRef.current = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.1);

      // 更新相机位置（轨道控制）
      const o = orbitRef.current;
      if (!o.isDragging) {
        // 自动微旋转
        o.theta += dt * 0.15;
      }
      const camX = o.targetX + o.distance * Math.sin(o.phi) * Math.cos(o.theta);
      const camY = o.targetY + o.distance * Math.cos(o.phi);
      const camZ = o.targetZ + o.distance * Math.sin(o.phi) * Math.sin(o.theta);
      camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.1);
      camera.lookAt(o.targetX, o.targetY, o.targetZ);

      // 粒子旋转
      stars.rotation.y += dt * 0.02;

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
      if (!container || !renderer) return;
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
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m: any) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    };
  }, []);

  // 更新物理对象
  useEffect(() => {
    const THREE = require('three');
    const threeScene = sceneRef.current;
    if (!threeScene) return;

    // 清除旧网格
    meshesRef.current.forEach((mesh) => {
      threeScene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    });
    meshesRef.current.clear();

    const objects = scene?.objects || [];
    if (objects.length === 0) {
      // 默认演示对象
      const demoObjects: PhysicsObject[] = [
        { id: 'demo1', name: '演示球', type: 'sphere', position: [0, 5, 0], rotation: [0, 0, 0], scale: [1, 1, 1], mass: 1, color: '#ff6b6b' },
        { id: 'demo2', name: '演示方块', type: 'cube', position: [3, 0.5, 2], rotation: [0, 0, 0], scale: [1, 1, 1], mass: 2, color: '#4a90d9' },
        { id: 'demo3', name: '演示柱体', type: 'cylinder', position: [-3, 0.5, -2], rotation: [0, 0, 0], scale: [1, 1, 1], mass: 1.5, color: '#2ed573' },
      ];
      demoObjects.forEach(obj => {
        const mesh = createObjectMesh(THREE, obj);
        threeScene.add(mesh);
        meshesRef.current.set(obj.id, mesh);
      });
    } else {
      objects.forEach(obj => {
        const mesh = createObjectMesh(THREE, obj);
        threeScene.add(mesh);
        meshesRef.current.set(obj.id, mesh);
      });
    }
  }, [scene]);

  // 动画更新
  useEffect(() => {
    if (!isPlaying) return;
    const THREE = require('three');

    let raf: number;
    const animate = () => {
      raf = requestAnimationFrame(animate);

      animations.forEach(anim => {
        const mesh = meshesRef.current.get(anim.objectId);
        if (!mesh) return;
        const keyframes = anim.keyframes;
        if (keyframes.length === 0) return;

        // 找到当前时间对应的关键帧
        let currentFrame = keyframes[0];
        for (let i = 0; i < keyframes.length; i++) {
          if (keyframes[i].time <= currentTime) {
            currentFrame = keyframes[i];
          } else break;
        }

        if (currentFrame?.position) {
          mesh.position.set(currentFrame.position[0], currentFrame.position[1], currentFrame.position[2]);
        }
      });
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, currentTime, animations]);

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
        <div>对象: {scene?.objects.length || 3}</div>
        <div>🖱 拖拽旋转 · 滚轮缩放</div>
      </div>
    </div>
  );
}

// 创建物理对象网格
function createObjectMesh(THREE: any, obj: PhysicsObject): any {
  let geometry: any;
  switch (obj.type) {
    case 'sphere':
      geometry = new THREE.SphereGeometry(0.5, 32, 32);
      break;
    case 'cube':
      geometry = new THREE.BoxGeometry(1, 1, 1);
      break;
    case 'cylinder':
      geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
      break;
    default:
      geometry = new THREE.SphereGeometry(0.5, 32, 32);
  }

  const color = obj.color || '#4a90d9';
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.3,
    metalness: 0.4,
    emissive: color,
    emissiveIntensity: 0.25,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(obj.position[0], obj.position[1], obj.position[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = { name: obj.name, type: obj.type, color };

  // 发光环
  const ringGeo = new THREE.TorusGeometry(0.55, 0.05, 16, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  mesh.add(ring);

  return mesh;
}

// WebGL不可用时的降级视图
function FallbackView({ scene }: { scene: ExperimentScene | null }) {
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
          <h4 style={{ color: '#6ab0ff', marginBottom: '12px' }}>📋 实验场景信息</h4>
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